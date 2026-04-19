import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface MathProblemAnalysis {
  title: string;
  cleanQuestion: string;
  correctAnswer: string;
  stepByStepGuide: string;
  initialHint: string;
}

export interface EvaluationResult {
  status: 'CORRECT' | 'NEARLY_CORRECT' | 'INCORRECT';
  feedback: string;
}

const SYSTEM_PROMPT = `Bạn là một chuyên gia ôn thi THPT Quốc gia môn Toán tại Việt Nam. 
CHỈ giải quyết các vấn đề liên quan đến TOÁN HỌC. Nếu người dùng hỏi lĩnh vực khác, hãy từ chối khéo léo và nhắc họ gửi đề toán.

Nhiệm vụ của bạn là hỗ trợ học sinh giải toán theo phương pháp tư duy:
1. Khi nhận bài toán, hãy phân tích kỹ, giải bài chi tiết nhưng không được tiết lộ đáp án ngay.
2. Bạn sẽ cung cấp một gợi ý nhỏ (Hint) để học sinh tự làm.
3. Khi học sinh đưa ra kết quả, bạn sẽ đánh giá:
   - 'CORRECT': Nếu đúng hoàn toàn. Phản hồi "Chính xác!" hoặc khen ngợi ngắn gọn.
   - 'NEARLY_CORRECT': Nếu họ đã rất gần (ví dụ: nhầm dấu, sai đơn vị, hoặc giá trị gần đúng cho phép). Bạn sẽ trả về status này để hệ thống hiển thị giải chi tiết.
   - 'INCORRECT': Nếu sai nhiều hoặc chưa có hướng đúng. Cung cấp thêm gợi ý (Hint) mới để họ thử lại.

Luôn sử dụng LaTeX cho các công thức toán học (ví dụ: $x^2$, $\\frac{a}{b}$).`;

export async function analyzeProblem(problemText: string): Promise<MathProblemAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Hãy phân tích bài toán sau và trả về kết quả dưới dạng JSON: "${problemText}"`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Tiêu đề ngắn gọn của dạng toán" },
          cleanQuestion: { type: Type.STRING, description: "Câu hỏi đã được làm sạch" },
          correctAnswer: { type: Type.STRING, description: "Đáp án cuối cùng chính xác nhất" },
          stepByStepGuide: { type: Type.STRING, description: "Hướng dẫn giải chi tiết từng bước" },
          initialHint: { type: Type.STRING, description: "Gợi ý đầu tiên để học sinh bắt đầu làm" },
        },
        required: ["title", "cleanQuestion", "correctAnswer", "stepByStepGuide", "initialHint"],
      },
    },
  });

  return JSON.parse(response.text);
}

export async function evaluateAnswer(problem: MathProblemAnalysis, userTry: string): Promise<EvaluationResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Bài toán: ${problem.cleanQuestion}
Đáp án đúng là: ${problem.correctAnswer}
Người dùng trả lời: "${userTry}"

Hãy đánh giá xem câu trả lời của người dùng.
- Trả về 'CORRECT' nếu đúng hoàn toàn.
- Trả về 'NEARLY_CORRECT' nếu họ đã gần sát hoặc đúng ý tưởng chính nhưng sai sót nhỏ.
- Trả về 'INCORRECT' nếu sai hoặc chưa đủ.
- Kèm theo phản hồi (feedback) ngắn gọn, khích lệ.`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { 
            type: Type.STRING, 
            enum: ["CORRECT", "NEARLY_CORRECT", "INCORRECT"] 
          },
          feedback: { type: Type.STRING },
        },
        required: ["status", "feedback"],
      },
    },
  });

  return JSON.parse(response.text);
}

export async function getFormulas(topic: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Hãy cung cấp tóm tắt các công thức quan trọng nhất và các lưu ý giải nhanh cho chuyên đề Toán THPT: "${topic}". 
Yêu cầu:
- Trình bày khoa học, dễ hiểu.
- Sử dụng LaTeX cho công thức.
- Tập trung vào các dạng thường gặp trong đề thi THPT Quốc gia.`,
    config: {
      systemInstruction: "Bạn là một siêu từ điển công thức toán học THPT.",
    },
  });

  return response.text;
}
