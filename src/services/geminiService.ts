import { QuizOptionKey } from '@/types/database';

export interface GeneratedQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: QuizOptionKey;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GenerateQuestionsOptions {
  apiKey: string;
  model?: string;
  topic: string;
  contextText?: string;
  examName?: string;
  questionCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  language?: 'bilingual' | 'english' | 'hindi';
}

export async function testGeminiApiKey(
  apiKey: string,
  model = 'gemini-1.5-flash'
): Promise<{ success: boolean; message: string }> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: 'Respond with the single word: "READY"' }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const errorMsg =
        errorJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, message: `API Verification Failed: ${errorMsg}` };
    }

    const data = await response.json();
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (candidateText) {
      return {
        success: true,
        message: `Connected successfully to ${model}! AI features are ready to use.`,
      };
    }

    return { success: false, message: 'Received empty response from Gemini API.' };
  } catch (err: any) {
    return {
      success: false,
      message: `Network or Connection Error: ${err?.message || 'Check your internet connection.'}`,
    };
  }
}

export async function generateQuestionsWithAi(
  options: GenerateQuestionsOptions
): Promise<GeneratedQuestion[]> {
  const {
    apiKey,
    model = 'gemini-1.5-flash',
    topic,
    contextText,
    examName,
    questionCount = 5,
    difficulty = 'medium',
    language = 'bilingual',
  } = options;

  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please add your API key in Settings.');
  }

  const langInstruction =
    language === 'bilingual'
      ? 'Format all questions, options, and explanations in Bilingual style (English followed by Hindi translation, e.g. "What is ARPANET? / एआरपानेट क्या है?").'
      : language === 'hindi'
      ? 'Format all questions, options, and explanations in Hindi (Devanagari script).'
      : 'Format all questions, options, and explanations in English.';

  const diffInstruction =
    difficulty === 'mixed'
      ? 'Include a mix of easy, medium, and conceptual exam-level questions.'
      : `Ensure all questions match a ${difficulty} difficulty level suitable for competitive exams like ${examName || 'general competitive exams'}.`;

  const prompt = `You are an expert exam question creator for competitive exams (such as DSSSB, EMRS, CTET, and Computer Science).
Generate exactly ${questionCount} multiple-choice questions (MCQs) on the following study topic:
Topic: "${topic}"
${examName ? `Target Exam: ${examName}` : ''}
${contextText ? `Source Study Notes/Context:\n"""${contextText.slice(0, 3000)}"""` : ''}

Requirements:
1. ${langInstruction}
2. ${diffInstruction}
3. Each question must have exactly 4 distinct options (Option A, B, C, D).
4. Clearly state the correct option as one of "A", "B", "C", or "D".
5. Provide a detailed, educational explanation for why the answer is correct.

Output ONLY a valid JSON array matching this exact schema:
[
  {
    "questionText": "Question text here",
    "optionA": "First option",
    "optionB": "Second option",
    "optionC": "Third option",
    "optionD": "Fourth option",
    "correctOption": "A",
    "explanation": "Detailed explanation here",
    "difficulty": "medium"
  }
]`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    const errorMsg =
      errorJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`Gemini AI Error: ${errorMsg}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

  if (!rawText) {
    throw new Error('AI returned an empty response.');
  }

  // Parse JSON array from output
  let parsedArray: any[] = [];
  try {
    parsedArray = JSON.parse(rawText);
  } catch {
    // If wrapped in markdown code fence, clean it up
    const cleaned = rawText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    parsedArray = JSON.parse(cleaned);
  }

  if (!Array.isArray(parsedArray)) {
    throw new Error('Unexpected response format from AI.');
  }

  return parsedArray.map((item, idx) => {
    let correct = String(item.correctOption || 'A').toUpperCase().trim();
    if (!['A', 'B', 'C', 'D'].includes(correct)) {
      correct = 'A';
    }

    return {
      questionText: item.questionText || item.question || `Question ${idx + 1}`,
      optionA: item.optionA || item.option_a || 'Option A',
      optionB: item.optionB || item.option_b || 'Option B',
      optionC: item.optionC || item.option_c || 'Option C',
      optionD: item.optionD || item.option_d || 'Option D',
      correctOption: correct as QuizOptionKey,
      explanation: item.explanation || '',
      difficulty: (item.difficulty === 'easy' || item.difficulty === 'hard' ? item.difficulty : 'medium'),
    };
  });
}
