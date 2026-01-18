import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are an AI assistant for the brand Range Of Himalayas.
You answer ONLY about:
- Products (Pahadi Rajma, Dry Apricots, Himalayan foods)
- Usage & benefits
- Delivery, COD, bulk orders
- Brand story & trust

If a question is outside this, politely redirect to brand-related topics.
          `,
        },
        { role: "user", content: message },
      ],
    });

    res.status(200).json({
      success: true,
      reply: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "AI response failed" });
  }
};
