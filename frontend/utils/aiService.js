import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY

async function callGeminiAPI(prompt) {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured. Set NEXT_PUBLIC_GEMINI_API_KEY environment variable.')
    }

    if (!prompt || prompt.trim().length === 0) {
        throw new Error('Prompt is empty')
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const result = await model.generateContent(prompt)
        const response = result.response
        const text = response.text()

        if (!text || text.trim().length === 0) {
            throw new Error('Gemini API returned empty response')
        }

        return text
    } catch (error) {
        console.error('Gemini API error:', error)
        throw error
    }
}

export async function improveGrammar(text) {
    const prompt = `Fix grammar and spelling errors in this text. Return only the corrected text:

"${text}"`

    return await callGeminiAPI(prompt)
}

export async function changeTone(text, tone) {
    const prompt = `Rewrite this text in a ${tone} tone. Return only the rewritten text:

"${text}"`

    return await callGeminiAPI(prompt)
}

export async function makeConcise(text) {
    const prompt = `Make this text concise and clear. Remove unnecessary words. Return only the concise text:

"${text}"`

    return await callGeminiAPI(prompt)
}

export async function expandText(text) {
    const prompt = `Expand this text with more details and examples. Return only the expanded text:

"${text}"`

    return await callGeminiAPI(prompt)
}

export async function fixPunctuation(text) {
    const prompt = `Fix punctuation, capitalization and formatting in this text. Return only the fixed text:

"${text}"`

    return await callGeminiAPI(prompt)
}

export async function simplifyText(text) {
    const prompt = `Simplify this text for a general audience. Use simpler words and shorter sentences. Return only the simplified text:

"${text}"`

    return await callGeminiAPI(prompt)
}

export async function makeProfessional(text) {
    const prompt = `Make this text more professional and suitable for business communication. Return only the professional text:

"${text}"`

    return await callGeminiAPI(prompt)
}

export async function generateSuggestions(text) {
    const prompt = `Provide 3-5 specific suggestions to improve this text:

"${text}"`

    return await callGeminiAPI(prompt)
}

export async function analyzeWriting(text) {
    const prompt = `Analyze this text for clarity, tone, structure and any issues:

"${text}"`

    return await callGeminiAPI(prompt)
}
