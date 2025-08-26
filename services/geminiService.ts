import { GoogleGenAI, Chat, Type } from "@google/genai";
import type { PronunciationFeedback, PronunciationWord, WordDefinition, Lesson, GeneratedLessonMaterials, FillInTheBlankExercise } from '../types';

// IMPORTANT: This assumes the API_KEY is set in the environment.
// Do not add any UI for entering the key.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might want to handle this more gracefully.
  // For this context, we'll log an error.
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const DEFAULT_SYSTEM_INSTRUCTION = `You are Kandy, a friendly and patient English tutor for A1 level students.
- Your name is Kandy.
- Keep your responses very short and simple.
- Use only A1 level vocabulary.
- Ask simple, short questions to keep the conversation going (e.g., "What is your name?", "How are you?", "What is your favorite color?").
- Talk about basic topics like introductions, family, food, and daily routines.
- Use emojis to be more friendly. 😊
- If the user makes a spelling or grammar mistake, gently correct them in your conversational response. For example, if they say 'I has a dog', you can say 'That's great! We say "I have a dog". What is your dog's name?'.
- IMPORTANT: After your conversational response, if you detected any mistakes, add a special JSON block on a new line at the very end of your output. The format must be exactly: <!-- CORRECTIONS: [{"original": "word", "corrected": "word"}] -->. Only include this block if there are corrections. Do not include it otherwise. For example, if the user writes "My name are Tom", you should include <!-- CORRECTIONS: [{"original": "are", "corrected": "is"}] -->.`;

// Helper to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

export const geminiService = {
  startChat: (systemInstruction?: string): Chat => {
    return ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
      },
    });
  },

  createSpeakingBuddyChat: (systemInstruction: string): Chat => {
    return ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
      },
    });
  },

  generateReadingText: async (): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Generate a very simple story for an A1 English learner. It must be between 3 and 5 short sentences. Use basic vocabulary. For example, talk about a cat, a house, or a family.',
      });
      return response.text;
    } catch (error) {
      console.error("Error generating reading text (fallback used):", error);
      return "My name is Tom. I have a cat. My cat is white. We play every day.";
    }
  },

  generatePronunciationFeedback: async (text: string): Promise<PronunciationFeedback> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following A1 English text and create a simulated pronunciation report. The text is: "${text}".
        Follow these rules:
        1.  Mark about 80-90% of the words as correct.
        2.  Randomly select 1 or 2 words and mark them as incorrect.
        3.  For the incorrect words, suggest 2-3 simple phonemes to improve, like "/æ/ as in cat" or "/iː/ as in see".`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              words: {
                type: Type.ARRAY,
                description: "An array of objects, one for each word in the original text.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN }
                  }
                }
              },
              phonemesToImprove: {
                type: Type.ARRAY,
                description: "A list of strings explaining which phonemes need practice.",
                items: {
                  type: Type.STRING
                }
              }
            }
          }
        }
      });
      
      const jsonText = response.text.trim();
      const parsedFeedback = JSON.parse(jsonText);
      
      const originalWords = text.replace(/[.,]/g, '').split(/\s+/);
      const feedbackWords: PronunciationWord[] = originalWords.map((word) => {
          const found = parsedFeedback.words.find((w: PronunciationWord) => w.word.toLowerCase().replace(/[.,]/g, '') === word.toLowerCase());
          return {
              word: word,
              isCorrect: found ? found.isCorrect : true
          };
      });

      return {
        words: feedbackWords,
        phonemesToImprove: parsedFeedback.phonemesToImprove || [],
      };

    } catch (error) {
      console.error("Error generating pronunciation feedback (fallback used):", error);
      const words = text.split(' ').map((word, index) => ({
        word,
        isCorrect: index !== 2,
      }));
      return {
        words,
        phonemesToImprove: ["/æ/ as in 'cat'", "/ð/ as in 'the'"],
      };
    }
  },

  getWordDefinition: async (word: string): Promise<WordDefinition> => {
    const cleanWord = word.toLowerCase().replace(/[.,!?]/g, '');
    if (!cleanWord) {
      return { translation: '-', overview: 'Esto es puntuación o un espacio.' };
    }
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Provide a simple Spanish translation and a brief, A1-level English overview for the word: "${cleanWord}". The overview should explain its main meaning in a friendly way, as if for a beginner.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translation: {
                type: Type.STRING,
                description: "The Spanish translation of the word."
              },
              overview: {
                type: Type.STRING,
                description: "A very simple, A1-level overview of the word's meaning in English."
              }
            }
          }
        }
      });
      const jsonText = response.text.trim();
      return JSON.parse(jsonText) as WordDefinition;
    } catch (error) {
      console.error(`Error getting definition for "${word}" (fallback used):`, error);
      return {
        translation: 'No disponible',
        overview: 'No se pudo obtener la definición. Es posible que se haya superado la cuota de la API. Inténtalo de nuevo más tarde.'
      };
    }
  },

  extractLessonFromPDF: async (file: File): Promise<{ title: string; theme: string; vocabulary: string[] }> => {
    try {
        const base64Data = await fileToBase64(file);

        const pdfPart = {
            inlineData: {
                mimeType: file.type,
                data: base64Data,
            },
        };

        const textPart = {
            text: `You are an expert in analyzing educational materials for A1 English learners. Analyze the provided PDF document, which is a page or chapter from an English textbook. Your task is to extract the key information to create a lesson plan. Identify the following three elements:
            1.  **Lesson Title**: The main title of the unit or lesson.
            2.  **Main Theme**: A short sentence describing what the lesson is about (e.g., "Talking about hobbies and free time activities.").
            3.  **Key Vocabulary**: A list of the most important new words or short phrases from the lesson.
            
            Return the information in a clean JSON object. Do not include any text or markdown formatting before or after the JSON.`
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, pdfPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "The title of the lesson." },
                        theme: { type: Type.STRING, description: "The main theme of the lesson." },
                        vocabulary: {
                            type: Type.ARRAY,
                            description: "A list of key vocabulary words.",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["title", "theme", "vocabulary"]
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error extracting lesson from PDF (fallback used):", error);
        return {
            title: 'Lección de Muestra (PDF)',
            theme: 'Hablar sobre rutinas diarias',
            vocabulary: ['wake up', 'eat breakfast', 'go to school', 'have lunch', 'do homework'],
        };
    }
  },

  generateLessonMaterials: async (lesson: Lesson): Promise<GeneratedLessonMaterials> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following A1 English lesson, generate practice materials.
        Lesson Title: "${lesson.title}"
        Vocabulary: ${lesson.vocabulary.join(', ')}
        Theme: "${lesson.theme}"

        Generate the following materials in a single JSON object:
        1.  "readingText": A very simple story (3-5 short sentences) for an A1 learner using the lesson's vocabulary and theme.
        2.  "flashcards": An array of up to 20 of the most important flashcard objects based on the vocabulary. Each object must have "english" (from the vocabulary list), "spanish" (its translation), and "example" (a simple A1 sentence using the word).
        3.  "chatSystemInstruction": A system instruction for the chatbot tutor Kandy. It MUST combine the standard Kandy persona with a new directive to focus the conversation on the lesson's theme and vocabulary. The standard persona is: "${DEFAULT_SYSTEM_INSTRUCTION}". The new directive is: "Your main goal for this conversation is to practice the topic: '${lesson.theme}'. Try to use words like: ${lesson.vocabulary.join(', ')}."
        4.  "exercises": An object containing a "fillInTheBlank" array with 15 fill-in-the-blank questions. Each question object must have:
            - "question": A simple A1 sentence with "___" representing the blank space.
            - "answer": The correct word from the vocabulary list that fits in the blank.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              readingText: { type: Type.STRING, description: "The generated story." },
              flashcards: {
                type: Type.ARRAY,
                description: "The generated flashcards.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    english: { type: Type.STRING },
                    spanish: { type: Type.STRING },
                    example: { type: Type.STRING },
                  }
                }
              },
              chatSystemInstruction: { type: Type.STRING, description: "The system instruction for the chatbot." },
              exercises: {
                type: Type.OBJECT,
                description: "A collection of interactive exercises.",
                properties: {
                    fillInTheBlank: {
                        type: Type.ARRAY,
                        description: "A list of fill-in-the-blank questions.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING, description: "The sentence with '___' as a blank." },
                                answer: { type: Type.STRING, description: "The correct answer for the blank." }
                            },
                             required: ["question", "answer"]
                        }
                    }
                }
              }
            },
            required: ["readingText", "flashcards", "chatSystemInstruction", "exercises"]
          }
        }
      });
      const jsonText = response.text.trim();
      const cleanedJsonText = jsonText.replace(/^```json\s*|```\s*$/g, '');
      return JSON.parse(cleanedJsonText) as GeneratedLessonMaterials;
    } catch (error) {
      console.error("Error generating lesson materials (fallback used):", error);
      const vocab = lesson.vocabulary.slice(0, 5);
      return {
        readingText: `This is a practice lesson about ${lesson.theme}. My name is Alex. I like to learn about ${vocab.length > 0 ? vocab[0] : 'new things'}. Every day, I practice ${vocab.length > 1 ? vocab[1] : 'English'}. It is fun.`,
        flashcards: vocab.map(v => ({ english: v, spanish: `(${v} en español)`, example: `This is an example for ${v}.`})),
        chatSystemInstruction: `You are Kandy, a friendly English tutor. Your main goal for this conversation is to practice the topic: '${lesson.theme}'. Try to use words like: ${lesson.vocabulary.join(', ')}.`,
        exercises: {
          fillInTheBlank: vocab.map(v => ({ question: `This is a sentence with ___.`, answer: v })).slice(0, 5)
        }
      };
    }
  },

  generateMoreExercises: async (lesson: Lesson): Promise<FillInTheBlankExercise[]> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following A1 English lesson, generate a new and different set of 15 practice exercises.
        Lesson Title: "${lesson.title}"
        Vocabulary: ${lesson.vocabulary.join(', ')}
        Theme: "${lesson.theme}"

        Generate ONLY a JSON array of 15 "fill-in-the-blank" question objects. Each object must have:
            - "question": A simple A1 sentence with "___" representing the blank space.
            - "answer": The correct word from the vocabulary list that fits in the blank.
        Do not repeat questions that might have been generated before. Be creative.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "A list of 15 new fill-in-the-blank questions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "The sentence with '___' as a blank." },
                    answer: { type: Type.STRING, description: "The correct answer for the blank." }
                },
                 required: ["question", "answer"]
            }
          }
        }
      });
      const jsonText = response.text.trim();
      const cleanedJsonText = jsonText.replace(/^```json\s*|```\s*$/g, '');
      return JSON.parse(cleanedJsonText) as FillInTheBlankExercise[];
    } catch (error) {
      console.error("Error generating more exercises (fallback used):", error);
      return [
        { question: `This is a ___ exercise.`, answer: 'practice' },
        { question: `I like to ___ English.`, answer: 'learn' },
        { question: `Let's ___ again tomorrow.`, answer: 'practice' },
        { question: `Can you ___ this sentence?`, answer: 'read' },
        { question: `Please ___ the blank.`, answer: 'fill' },
      ];
    }
  },

  generateDictation: async (lesson: Lesson): Promise<{ title: string; transcript: string }> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the A1 English lesson titled "${lesson.title}" with the theme "${lesson.theme}" and vocabulary [${lesson.vocabulary.join(', ')}], generate a practice dictation.
        
        The response must be a JSON object with two properties:
        1. "title": A short, engaging title for the dictation, related to the lesson.
        2. "transcript": A single, simple sentence for the dictation. This sentence MUST be under 100 characters and use vocabulary from the lesson.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              transcript: { type: Type.STRING }
            },
            required: ["title", "transcript"]
          }
        }
      });
      const jsonText = response.text.trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error("Error generating dictation (fallback used):", error);
      return {
        title: `Práctica de Dictado`,
        transcript: `Let's practice some English words today.`
      };
    }
  },
};
