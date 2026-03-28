
import { GoogleGenAI, Type } from "@google/genai";
import { GameTheme, QuizQuestion } from "../types";

let ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const setCustomApiKey = (key: string) => {
  if (key) {
    ai = new GoogleGenAI({ apiKey: key });
    localStorage.setItem('custom_gemini_api_key', key);
  } else {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    localStorage.removeItem('custom_gemini_api_key');
  }
};

// Initialize from localStorage if available
const storedKey = localStorage.getItem('custom_gemini_api_key');
if (storedKey) {
  ai = new GoogleGenAI({ apiKey: storedKey });
}

export const getCustomApiKey = () => {
  return localStorage.getItem('custom_gemini_api_key') || '';
};

export const getThemeFromGemini = async (userPrompt: string, pairCount: number = 6): Promise<GameTheme> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate exactly ${pairCount} unique items for a Vietnamese memory match game "Trúc Xanh" based on: "${userPrompt}". 
    For each item, provide an emoji and a simple trivia question related to it with 4 options and 1 correct answer.
    IMPORTANT: 
    1. If there are mathematical formulas, use LaTeX format (e.g., $x^2 + y^2 = r^2$).
    2. Provide a short, interesting explanation (explanation) for the correct answer.
    3. Provide an SVG illustration (svgIllustration) for the question. The SVG should be a valid SVG string, visually appealing, and relevant to the question. Use Tailwind colors if possible.
    Return the theme name and the items list.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          items: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                emoji: { type: Type.STRING },
                quiz: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING, description: "Giải thích ngắn gọn cho đáp án đúng" },
                    svgIllustration: { type: Type.STRING, description: "A valid SVG string illustrating the question." }
                  },
                  required: ["question", "options", "correctAnswer", "explanation"]
                }
              },
              required: ["emoji", "quiz"]
            }
          }
        },
        required: ["name", "items"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    if (data.items && data.items.length >= pairCount) {
      return {
        name: data.name,
        items: data.items.slice(0, pairCount)
      };
    }
    throw new Error("Invalid data");
  } catch (error) {
    console.error("Gemini Error", error);
    const defaultItems = [
      { emoji: "🍎", quiz: { question: "Táo có màu gì phổ biến nhất?", options: ["Xanh", "Đỏ", "Tím", "Vàng"], correctAnswer: "Đỏ", explanation: "Táo đỏ chứa nhiều anthocyanin tạo nên màu sắc đặc trưng và rất tốt cho sức khỏe.", svgIllustration: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="55" r="35" fill="#ef4444"/><path d="M50 20 Q55 10 65 15" stroke="#22c55e" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M50 20 L50 25" stroke="#78350f" stroke-width="4" stroke-linecap="round"/></svg>` } },
      { emoji: "🍌", quiz: { question: "Chuối cung cấp nhiều chất gì?", options: ["Sắt", "Kali", "Canxi", "Kẽm"], correctAnswer: "Kali", explanation: "Kali trong chuối giúp duy trì huyết áp ổn định và hỗ trợ hoạt động của cơ bắp.", svgIllustration: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M20 80 Q50 90 80 20 Q60 50 20 80" fill="#eab308"/><path d="M25 75 Q50 85 75 25" stroke="#ca8a04" stroke-width="2" fill="none"/></svg>` } },
      { emoji: "🍇", quiz: { question: "Nho khô được làm từ gì?", options: ["Táo", "Nho tươi", "Mận", "Đào"], correctAnswer: "Nho tươi", explanation: "Nho khô là kết quả của quá trình sấy khô nho tươi, làm cô đọng lượng đường và chất dinh dưỡng.", svgIllustration: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="15" fill="#a855f7"/><circle cx="60" cy="40" r="15" fill="#a855f7"/><circle cx="50" cy="60" r="15" fill="#a855f7"/><path d="M50 25 L50 15 Q55 5 65 10" stroke="#22c55e" stroke-width="4" fill="none" stroke-linecap="round"/></svg>` } },
      { emoji: "🍓", quiz: { question: "Dâu tây thường trồng ở đâu tại VN?", options: ["Cần Thơ", "Đà Lạt", "Hà Nội", "Huế"], correctAnswer: "Đà Lạt", explanation: "Đà Lạt có khí hậu ôn hòa quanh năm, rất thích hợp cho sự phát triển của dâu tây.", svgIllustration: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 90 Q20 50 30 30 Q50 20 70 30 Q80 50 50 90" fill="#ef4444"/><path d="M30 30 Q50 10 70 30 Q50 20 30 30" fill="#22c55e"/><circle cx="40" cy="45" r="2" fill="#fef08a"/><circle cx="60" cy="45" r="2" fill="#fef08a"/><circle cx="50" cy="60" r="2" fill="#fef08a"/><circle cx="40" cy="70" r="2" fill="#fef08a"/><circle cx="60" cy="70" r="2" fill="#fef08a"/></svg>` } },
      { emoji: "🍍", quiz: { question: "Quả dứa còn gọi là quả gì?", options: ["Mận", "Thơm", "Ổi", "Xoài"], correctAnswer: "Thơm", explanation: "Tên gọi 'Thơm' bắt nguồn từ mùi hương đặc trưng và rất dễ chịu của loại quả này.", svgIllustration: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="65" rx="25" ry="30" fill="#eab308"/><path d="M50 35 L40 10 L50 25 L60 10 Z" fill="#22c55e"/><path d="M40 38 L25 20 L45 30 Z" fill="#16a34a"/><path d="M60 38 L75 20 L55 30 Z" fill="#16a34a"/><path d="M35 55 L65 75 M35 75 L65 55 M45 45 L70 60 M30 60 L55 45" stroke="#ca8a04" stroke-width="2" fill="none"/></svg>` } },
      { emoji: "🍉", quiz: { question: "Dưa hấu có ruột màu gì?", options: ["Xanh", "Đỏ", "Trắng", "Đen"], correctAnswer: "Đỏ", explanation: "Màu đỏ của dưa hấu là do lycopene, một chất chống oxy hóa mạnh mẽ.", svgIllustration: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M20 30 A 40 40 0 0 0 80 30 Z" fill="#ef4444"/><path d="M15 25 A 45 45 0 0 0 85 25" stroke="#22c55e" stroke-width="6" fill="none"/><circle cx="40" cy="45" r="2" fill="#1c1917"/><circle cx="60" cy="45" r="2" fill="#1c1917"/><circle cx="50" cy="55" r="2" fill="#1c1917"/></svg>` } },
    ];
    return {
      name: "Trái Cây",
      items: defaultItems.slice(0, pairCount)
    };
  }
};

export const editQuestionWithGemini = async (currentItem: { emoji: string, quiz: QuizQuestion }, instruction: string): Promise<{ emoji: string, quiz: QuizQuestion }> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an AI assistant helping to edit a trivia question for a Vietnamese memory match game "Trúc Xanh".
    Here is the current item:
    ${JSON.stringify(currentItem, null, 2)}
    
    The user wants to modify it based on this instruction: "${instruction}"
    
    Return the updated item. Ensure it has an emoji, a question, 4 options, 1 correct answer, an explanation, and an SVG illustration.
    If the user asks to change the image, generate a new SVG. Otherwise, you can keep the existing SVG or improve it.
    IMPORTANT: 
    1. Use LaTeX for math formulas (e.g., $E = mc^2$).
    2. The SVG should be a valid SVG string, visually appealing, and relevant to the question. Use Tailwind colors if possible.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          emoji: { type: Type.STRING },
          quiz: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              svgIllustration: { type: Type.STRING, description: "A valid SVG string illustrating the question." }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        },
        required: ["emoji", "quiz"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Edit Error", error);
    return currentItem; // fallback to original if parsing fails
  }
};

export const getSingleQuestionFromGemini = async (themeName: string): Promise<{ emoji: string, quiz: QuizQuestion }> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate ONE unique item for a Vietnamese memory match game "Trúc Xanh" about the topic: "${themeName}". 
    Provide an emoji and a simple trivia question with 4 options and 1 correct answer.
    IMPORTANT: 
    1. If there are mathematical formulas, use LaTeX format (e.g., $E = mc^2$).
    2. Provide a short, interesting explanation (explanation) for the correct answer.
    3. Provide an SVG illustration (svgIllustration) for the question. The SVG should be a valid SVG string, visually appealing, and relevant to the question. Use Tailwind colors if possible.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          emoji: { type: Type.STRING },
          quiz: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              svgIllustration: { type: Type.STRING, description: "A valid SVG string illustrating the question." }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        },
        required: ["emoji", "quiz"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return { emoji: "⭐", quiz: { question: "Ngôi sao có mấy cánh?", options: ["4", "5", "6", "7"], correctAnswer: "5", explanation: "Hình ảnh ngôi sao 5 cánh là biểu tượng phổ biến nhất trong văn hóa và thiên văn học.", svgIllustration: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,10 61,39 92,39 67,58 76,88 50,70 24,88 33,58 8,39 39,39" fill="#eab308"/></svg>` } };
  }
};
