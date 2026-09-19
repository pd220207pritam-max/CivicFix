import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageUrl, description } = await req.json()

    // Try AI suggestion using Gemini if API key is available
    const geminiKey = process.env.GEMINI_API_KEY
    
    if (geminiKey && imageUrl) {
      try {
        const suggestion = await getGeminiSuggestion(geminiKey, imageUrl, description)
        if (suggestion) {
          return NextResponse.json({ category: suggestion, confidence: 'high', source: 'ai' })
        }
      } catch (aiError) {
        console.warn('AI suggestion failed, using fallback:', aiError)
      }
    }

    // Fallback: keyword-based suggestion from description
    if (description) {
      const category = keywordSuggest(description)
      if (category) {
        return NextResponse.json({ category, confidence: 'low', source: 'keyword' })
      }
    }

    return NextResponse.json({ category: null, source: 'none' })
  } catch (error) {
    return NextResponse.json({ category: null, source: 'error' })
  }
}

async function getGeminiSuggestion(apiKey: string, imageUrl: string, description?: string): Promise<string | null> {
  const categories = ['Pothole', 'Garbage', 'Broken Streetlight', 'Water Leakage', 'Drainage Problem', 'Damaged Road', 'Traffic Signal', 'Public Toilet', 'Illegal Dumping', 'Other']
  
  const prompt = `You are analyzing a civic issue report. Based on the description${imageUrl ? ' and image' : ''}, categorize this issue into exactly one of these categories: ${categories.join(', ')}.

${description ? `Description: "${description}"` : ''}

Respond with ONLY the category name, nothing else. Example: "Pothole"`

  const requestBody: Record<string, unknown> = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      maxOutputTokens: 50,
      temperature: 0.1,
    }
  }

  // If it's a local upload URL, we can't pass to Gemini, use text only
  if (imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('localhost')) {
    (requestBody.contents as { parts: { text?: string; inlineData?: unknown }[] }[])[0].parts.unshift({
      inlineData: {
        mimeType: 'image/jpeg',
        // We'd need to fetch and base64 encode the image here
      }
    })
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  )

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
  
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  
  const categories2 = ['Pothole', 'Garbage', 'Broken Streetlight', 'Water Leakage', 'Drainage Problem', 'Damaged Road', 'Traffic Signal', 'Public Toilet', 'Illegal Dumping', 'Other']
  return categories2.find(c => text?.toLowerCase().includes(c.toLowerCase())) || null
}

function keywordSuggest(description: string): string | null {
  const desc = description.toLowerCase()
  
  if (desc.includes('pothole') || desc.includes('hole in road') || desc.includes('road hole')) return 'Pothole'
  if (desc.includes('garbage') || desc.includes('trash') || desc.includes('waste') || desc.includes('rubbish') || desc.includes('litter')) return 'Garbage'
  if (desc.includes('streetlight') || desc.includes('street light') || desc.includes('lamp post') || desc.includes('light not working')) return 'Broken Streetlight'
  if (desc.includes('water leak') || desc.includes('pipe burst') || desc.includes('water main') || desc.includes('leaking pipe')) return 'Water Leakage'
  if (desc.includes('drain') || desc.includes('manhole') || desc.includes('sewage') || desc.includes('flooding')) return 'Drainage Problem'
  if (desc.includes('road damage') || desc.includes('broken road') || desc.includes('damaged road') || desc.includes('road condition')) return 'Damaged Road'
  if (desc.includes('traffic signal') || desc.includes('traffic light') || desc.includes('signal not working')) return 'Traffic Signal'
  if (desc.includes('toilet') || desc.includes('restroom') || desc.includes('bathroom')) return 'Public Toilet'
  if (desc.includes('dump') || desc.includes('illegal waste') || desc.includes('fly-tip')) return 'Illegal Dumping'
  
  return null
}
