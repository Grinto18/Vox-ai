import { GoogleGenAI, Type } from '@google/genai';
import { DocumentaryScript, DurationOption, VisualStyle } from './types.js';

// Initialize server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY || '';

export const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export function hasGeminiKey(): boolean {
  const k = process.env.GEMINI_API_KEY;
  return Boolean(k && k.trim().length > 10 && !k.includes('MY_GEMINI_API_KEY'));
}

// System instruction for Arabic documentary writing in Vox aesthetic
const SCRIPT_SYSTEM_INSTRUCTION = `أنت رئيس تحرير ومخرج وثائقي متخصص في إنتاج فيديوهات وثائقية تاريخية وثقافية وعلمية باللغة العربية بأسلوب مجلة Vox العالمية.
مبادئك الصارمة:
1. السرد قصصي شائق، لغة عربية فصحى فصيحة ومعاصرة دون تكلف.
2. التمييز الدقيق بين الحقائق التاريخية المؤكدة والفرضيات غير المحسومة.
3. تفكيك الموضوع إلى مشاهد سردية سينمائية محكمة التوقيت.
4. إعطاء وصف بصري دقيق لكل مشهد يناسب الرسوم الكولاجية أو الخرائط أو الصور الوثائقية.
5. صياغة عناوين قصيرة ملهمة ومقتبسات على الشاشة (On-Screen Titles).
6. تطابق مدة كل مشهد بحيث يكون مجموعها مساوياً للمدة المستهدفة بدقة.`;

export async function generateDocumentaryScript(
  topic: string,
  targetDuration: DurationOption,
  visualStyle: VisualStyle,
  additionalInstructions?: string
): Promise<DocumentaryScript> {
  if (!hasGeminiKey()) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  // Calculate planned scene count based on duration
  // 30s -> 3 scenes (10s each)
  // 60s -> 4-5 scenes (12-15s each)
  // 180s -> 8-10 scenes (~18-20s each)
  const targetSceneCount = targetDuration === 30 ? 3 : targetDuration === 60 ? 4 : 8;

  const prompt = `الموضوع الوثائقي: "${topic}"
المدة المستهدفة: ${targetDuration} ثانية
الأسلوب البصري: ${visualStyle}
عدد المشاهد المخطط: ${targetSceneCount} مشاهد
${additionalInstructions ? `تعليمات وتوجيهات إضافية: ${additionalInstructions}` : ''}

قم بتوليد سيناريو وثائقي احترافي متكامل مع تفصيل كل مشهد. احرص على أن تكون لغة التعليق الصوتي دافئة وسينمائية، وأن يتطابق مجموع ثواني المشاهد بدقة مع ${targetDuration} ثانية.`;

  const genConfig = {
    systemInstruction: SCRIPT_SYSTEM_INSTRUCTION,
    temperature: 0.7,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'عنوان وثائقي ملفت بأسلوب فوكس العربي',
        },
        topicSummary: {
          type: Type.STRING,
          description: 'ملخص مكثف لفكرة الفيلم في سطرين',
        },
        narrationLanguage: {
          type: Type.STRING,
          description: 'لغة السرد، مثل: ar',
        },
        targetDuration: {
          type: Type.NUMBER,
          description: 'المدة الإجمالية بالثواني',
        },
        fullNarrationScript: {
          type: Type.STRING,
          description: 'النص الكامل المقروء للسرد الصوتي كاملاً',
        },
        historicalUncertaintyNotes: {
          type: Type.STRING,
          description: 'ملاحظات حول الشك التاريخي أو التضارب في الروايات إن وُجد، أو تنويه بالدقة',
        },
        sourceReferences: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'المصادر التاريخية أو العلمية المعتمدة للسرد',
        },
        scenes: {
          type: Type.ARRAY,
          description: 'مشاهد الفيلم المقسمة بتوقيتات دقيقة',
          items: {
            type: Type.OBJECT,
            properties: {
              sceneNumber: { type: Type.INTEGER },
              durationSeconds: { type: Type.NUMBER },
              onScreenTitle: {
                type: Type.STRING,
                description: 'عنوان شاشة موجز يظهر أثناء المشهد (2-5 كلمات)',
              },
              narrationSegment: {
                type: Type.STRING,
                description: 'الفقرة الصوتية الخاصة بهذا المشهد فقط',
              },
              visualDescription: {
                type: Type.STRING,
                description: 'وصف مفصل لما يراه المشاهد على الشاشة',
              },
              generationPrompt: {
                type: Type.STRING,
                description: 'برومبت توليد الصورة أو الرسم بالإنجليزية عالي التفاصيل',
              },
              transitionSuggestion: {
                type: Type.STRING,
                description: 'اقتراح الانتقال للمشهد التالي (تلاشي، انزلاق، زوم)',
              },
              sourceOrVerificationNotes: {
                type: Type.STRING,
                description: 'توثيق الحقيقة التاريخية في هذا المشهد',
              },
            },
            required: [
              'sceneNumber',
              'durationSeconds',
              'onScreenTitle',
              'narrationSegment',
              'visualDescription',
              'generationPrompt',
              'transitionSuggestion',
            ],
          },
        },
      },
      required: [
        'title',
        'topicSummary',
        'narrationLanguage',
        'targetDuration',
        'fullNarrationScript',
        'scenes',
      ],
    },
  };

  let response;
  try {
    const primaryCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: genConfig,
    });
    const timeoutLimit = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_GEMINI_3_8')), 4500)
    );
    response = (await Promise.race([primaryCall, timeoutLimit])) as any;
  } catch (primaryErr: any) {
    console.warn('Gemini 3.8 Flash spike/timeout, switching to fast gemini-3.1-flash-lite:', primaryErr?.message || primaryErr);
    response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: genConfig,
    });
  }

  const rawText = response.text;
  if (!rawText) {
    throw new Error('EMPTY_GEMINI_RESPONSE');
  }

  const parsed = JSON.parse(rawText) as DocumentaryScript;

  // Normalize durations so sum matches targetDuration closely
  let totalDur = parsed.scenes.reduce((acc, s) => acc + (s.durationSeconds || 10), 0);
  if (totalDur <= 0) totalDur = targetDuration;

  // Scale if skewed
  const factor = targetDuration / totalDur;
  let running = 0;
  parsed.scenes.forEach((s, idx) => {
    if (idx === parsed.scenes.length - 1) {
      s.durationSeconds = Math.max(4, targetDuration - running);
    } else {
      s.durationSeconds = Math.max(4, Math.round(s.durationSeconds * factor));
      running += s.durationSeconds;
    }
  });

  parsed.targetDuration = targetDuration;
  parsed.narrationLanguage = 'ar';

  return parsed;
}
