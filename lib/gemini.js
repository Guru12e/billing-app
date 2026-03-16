import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function parseVoiceWithGemini(transcript, products) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const productList = products
      .map((p) => `${p.name} (₹${p.price})`)
      .join(", ");

    const prompt = `
You are a billing assistant for an Indian store.

Available products:
${productList}

User said: "${transcript}"

Return ONLY valid JSON:
[{"name":"product name","qty":number}]

Rules:
- Translate Tamil automatically
- If quantity missing use 1
- If nothing matches return []
`;

    const result = await model.generateContent(prompt);

    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json|```/g, "").trim();

    console.log(text);

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
}
