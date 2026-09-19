import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const departments = [
  { name: 'Roads & Infrastructure', description: 'Handles potholes, damaged roads, drainage', color: '#dc2626' },
  { name: 'Sanitation & Waste', description: 'Handles garbage, illegal dumping, public toilets', color: '#16a34a' },
  { name: 'Electricity & Lighting', description: 'Handles streetlights, traffic signals', color: '#d97706' },
  { name: 'Water & Utilities', description: 'Handles water leakage, drainage problems', color: '#2563eb' },
  { name: 'General Public Works', description: 'Handles other civic issues', color: '#7c3aed' },
  { name: 'Parks & Recreation', description: 'Maintains public parks, playgrounds, and green spaces', color: '#84cc16' },
  { name: 'Traffic & Transport', description: 'Handles bus shelters, parking issues, road signs', color: '#0ea5e9' },
  { name: 'Public Health', description: 'Handles pest control, mosquito breeding, hygiene', color: '#e11d48' },
  { name: 'Animal Control', description: 'Handles stray animals, dead animal removal', color: '#a855f7' },
  { name: 'Fire & Rescue', description: 'Handles fire hazards, building safety compliance', color: '#f97316' },
];

const locations = [
  { lat: 19.0760, lng: 72.8777, address: 'Mumbai, Maharashtra' },
  { lat: 28.6139, lng: 77.2090, address: 'New Delhi, Delhi' },
  { lat: 22.5726, lng: 88.3639, address: 'Kolkata, West Bengal' },
  { lat: 13.0827, lng: 80.2707, address: 'Chennai, Tamil Nadu' },
  { lat: 12.9716, lng: 77.5946, address: 'Bengaluru, Karnataka' },
  { lat: 17.3850, lng: 78.4867, address: 'Hyderabad, Telangana' },
  { lat: 23.0225, lng: 72.5714, address: 'Ahmedabad, Gujarat' },
  { lat: 26.9124, lng: 75.7873, address: 'Jaipur, Rajasthan' },
  { lat: 26.8467, lng: 80.9462, address: 'Lucknow, Uttar Pradesh' },
  { lat: 23.2599, lng: 77.4126, address: 'Bhopal, Madhya Pradesh' },
  { lat: 25.5941, lng: 85.1376, address: 'Patna, Bihar' },
  { lat: 30.7333, lng: 76.7794, address: 'Chandigarh, Punjab' },
  { lat: 8.5241, lng: 76.9366, address: 'Thiruvananthapuram, Kerala' },
  { lat: 20.2961, lng: 85.8245, address: 'Bhubaneswar, Odisha' },
  { lat: 26.1445, lng: 91.7362, address: 'Guwahati, Assam' },
  { lat: 34.0837, lng: 74.7973, address: 'Srinagar, Jammu and Kashmir' },
  { lat: 15.4909, lng: 73.8278, address: 'Panaji, Goa' },
  { lat: 21.2514, lng: 81.6296, address: 'Raipur, Chhattisgarh' },
  { lat: 23.3441, lng: 85.3096, address: 'Ranchi, Jharkhand' },
  { lat: 30.3165, lng: 78.0322, address: 'Dehradun, Uttarakhand' },
];

const complaintData = [
  { title: 'Large pothole on main road', category: 'Pothole', description: 'A very large pothole has developed on the main road causing accidents and traffic jams. Multiple vehicles have been damaged.' },
  { title: 'Garbage overflowing from bins', category: 'Garbage', description: 'The garbage bins near the market area have been overflowing for 3 days. Residents are very concerned about hygiene.' },
  { title: 'Streetlight not working', category: 'Broken Streetlight', description: 'The streetlight at the corner has not been working for a week. The area is very dark at night making it unsafe.' },
  { title: 'Water pipe burst on street', category: 'Water Leakage', description: 'A major water pipe has burst under the road causing water logging. Significant water wastage happening.' },
  { title: 'Blocked storm drain causing flooding', category: 'Drainage Problem', description: 'The storm drain is completely blocked with debris. During rains, the entire street floods causing major inconvenience.' },
  { title: 'Road completely damaged after monsoon', category: 'Damaged Road', description: 'The road surface has been completely destroyed after monsoon. Large craters make it impassable for vehicles.' },
  { title: 'Traffic signal not working at busy junction', category: 'Traffic Signal', description: 'The traffic signal at the main junction has been non-functional for 2 days. Traffic police needed here urgently.' },
  { title: 'Public toilet in terrible condition', category: 'Public Toilet', description: 'The public toilet near the bus stop is in a terrible condition with broken fixtures and no water supply.' },
  { title: 'Illegal dumping near park', category: 'Illegal Dumping', description: 'Construction debris and garbage is being illegally dumped near the public park. Foul smell and hygiene issues.' },
  { title: 'Multiple potholes on residential street', category: 'Pothole', description: 'There are more than 10 potholes on this residential street that have been present for months. No action taken despite multiple complaints.' },
  { title: 'Open manhole dangerous to pedestrians', category: 'Drainage Problem', description: 'A manhole cover is missing creating a serious safety hazard for pedestrians and cyclists, especially at night.' },
  { title: 'Broken street bench vandalized', category: 'Other', description: 'The street bench near the garden has been vandalized and the broken parts are causing injury risk to visitors.' },
  { title: 'Leaking water main flooding basement', category: 'Water Leakage', description: 'Water from a main pipe leak is seeping into building basements causing structural damage to multiple buildings.' },
  { title: 'Footpath completely broken', category: 'Damaged Road', description: 'The footpath tiles are completely broken and uneven creating trip hazards. Senior citizens cannot walk safely.' },
  { title: 'Garbage truck missing collection', category: 'Garbage', description: 'The garbage truck has not collected waste in our area for 5 days. Multiple complaints made but no response.' },
  { title: 'Park lighting completely dark', category: 'Broken Streetlight', description: 'All 8 lights in the public park are non-functional making it dangerous to use in evenings. Antisocial activities reported.' },
  { title: 'Road cave-in after heavy rain', category: 'Damaged Road', description: 'A portion of the road has caved in after heavy rains exposing underground pipes. Very dangerous for traffic.' },
  { title: 'Fly-tipping behind school', category: 'Illegal Dumping', description: 'Someone is dumping medical waste and construction debris behind the primary school. Urgent health hazard for children.' },
  { title: 'Traffic signal stuck on red', category: 'Traffic Signal', description: 'The traffic signal is stuck on red mode causing major traffic backup. Commuters are frustrated and running the signal.' },
  { title: 'Overflowing sewage on street', category: 'Drainage Problem', description: 'Sewage water is overflowing onto the main street creating a massive health hazard. Strong foul smell throughout the area.' },
];

export async function GET() {
  try {
    // Clear existing data so we don't end up with 40 or 60 items
    await prisma.statusHistory.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.notification.deleteMany();

    const depts = [];
    for (const dept of departments) {
      const d = await prisma.department.upsert({
        where: { name: dept.name },
        update: {},
        create: dept,
      });
      depts.push(d);
    }

    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@civicfix.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@civicfix.com',
        password: adminPassword,
        role: 'ADMIN',
      },
    });

    const citizenPassword = await bcrypt.hash('citizen123', 10);
    const citizen = await prisma.user.upsert({
      where: { email: 'citizen@civicfix.com' },
      update: {},
      create: {
        name: 'Demo Citizen',
        email: 'citizen@civicfix.com',
        password: citizenPassword,
        role: 'CITIZEN',
      },
    });

    const statusList = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Resolved'];

    for (let i = 0; i < complaintData.length; i++) {
      const data = complaintData[i];
      const location = locations[i % locations.length];
      const status = statusList[i % statusList.length];
      const dept = i % 3 === 0 ? depts[i % depts.length] : null;

      const latOffset = (Math.random() - 0.5) * 0.02;
      const lngOffset = (Math.random() - 0.5) * 0.02;
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      const complaint = await prisma.complaint.create({
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          status: status,
          latitude: location.lat + latOffset,
          longitude: location.lng + lngOffset,
          address: location.address,
          isDemo: true,
          userId: citizen.id,
          departmentId: dept?.id,
          createdAt: createdAt,
        },
      });

      await prisma.statusHistory.create({
        data: {
          status: 'Submitted',
          note: 'Complaint submitted by citizen',
          complaintId: complaint.id,
          changedById: citizen.id,
          createdAt: createdAt,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Database seeded with 20 complaints!' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
