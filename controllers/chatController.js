
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

export const chatWithBot = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.json({
        reply: "🌿 Hi! Welcome to Range Of Himalayas. How can I help you today?",
      });
    }

    const text = message.toLowerCase();

    // Greetings
    if (
      ["hi", "hello", "hey", "hii", "good morning", "good evening"].some(
        (greeting) => text.includes(greeting)
      )
    ) {
      return res.json({
        reply: `
🌿 Welcome to Range Of Himalayas!

I can help you with:

📦 Track Orders
🚚 Shipping Information
💳 Payments & COD
🍯 Product Information
🔄 Returns & Refunds

Try asking:
• Track my order
• Sea Buckthorn Pulp benefits
• Delivery time
• Do you offer COD?
        `,
      });
    }

    const faqs = [
      {
        keywords: ["delivery", "shipping", "deliver", "ship"],
        answer:
          "🚚 We deliver PAN India. Orders usually reach within 3–5 business days.",
      },

      {
        keywords: ["tracking", "track", "order status", "track my order"],
        answer:
          "📦 Please enter your Order ID and our team will help you track your order.",
      },

      {
        keywords: ["cod", "cash", "cash on delivery"],
        answer:
          "💳 Yes, Cash on Delivery (COD) is available on eligible orders.",
      },

      {
        keywords: ["payment", "upi", "card", "online payment"],
        answer:
          "💳 We accept UPI, Debit Cards, Credit Cards and Net Banking.",
      },

      {
        keywords: ["sea buckthorn honey", "himalayan honey"],
        answer:
          "🍯 Our Sea Buckthorn Honey is raw, natural and sourced from the Himalayan valleys.",
      },

      {
        keywords: ["sea buckthorn honey benefits", "honey benefits"],
        answer:
          "🍯 Sea Buckthorn Honey supports immunity, digestion and healthy skin.",
      },

      {
        keywords: ["sea buckthorn pulp", "sea buckthorn juice"],
        answer:
          "🥤 Our Sea Buckthorn Pulp is made from freshly harvested Himalayan berries and contains no additives.",
      },

      {
        keywords: ["sea buckthorn pulp benefits"],
        answer:
          "🥤 Rich in Vitamin C and Omega 3,6,7,9. Supports immunity, skin health and overall wellness.",
      },

      {
        keywords: ["apricot oil", "khubani oil"],
        answer:
          "🌰 Our Apricot Oil is cold-pressed from premium Himalayan apricot kernels.",
      },

      {
        keywords: ["apricot oil benefits"],
        answer:
          "🌰 Apricot Oil deeply moisturizes skin and nourishes hair naturally.",
      },

      {
        keywords: ["dry apricot", "khubani"],
        answer:
          "🍑 Our Dry Apricots are naturally sun-dried in the Himalayas without chemicals.",
      },

      {
        keywords: ["dry apricot benefits"],
        answer:
          "🍑 Rich in fiber, iron and antioxidants. Supports digestion and energy.",
      },

      {
        keywords: ["kala zeera", "black cumin"],
        answer:
          "🌿 Himalayan Kala Zeera is aromatic, flavorful and traditionally used for wellness.",
      },

      {
        keywords: ["kala zeera benefits"],
        answer:
          "🌿 Kala Zeera supports digestion and has antioxidant properties.",
      },

      {
        keywords: ["sea buckthorn tea", "herbal tea"],
        answer:
          "☕ Our Sea Buckthorn Tea is a refreshing Himalayan herbal infusion.",
      },

      {
        keywords: ["sea buckthorn tea benefits"],
        answer:
          "☕ Supports immunity, detoxification and digestive health.",
      },

      {
        keywords: ["skin", "glowing skin"],
        answer:
          "✨ For glowing skin we recommend Rosehip Cream and Sea Buckthorn Pulp.",
      },

      {
        keywords: ["immunity", "immune system"],
        answer:
          "💪 For immunity support we recommend Sea Buckthorn Pulp and Saffron Honey.",
      },

      {
        keywords: ["hair", "hair growth", "hair fall"],
        answer:
          "🌿 Apricot Oil is excellent for nourishing the scalp and promoting healthy hair.",
      },

      {
        keywords: ["organic", "natural", "chemical free"],
        answer:
          "🌿 All our products are natural and responsibly sourced from the Himalayas.",
      },

      {
        keywords: ["return", "refund", "replace"],
        answer:
          "🔄 Returns and refunds are handled according to our return policy.",
      },

      {
        keywords: ["contact", "support", "whatsapp"],
        answer:
          "📲 Please contact us on WhatsApp or through our Contact Us page.",
      },
    ];

    const match = faqs.find((faq) =>
      faq.keywords.some((keyword) => text.includes(keyword))
    );

    if (match) {
      return res.json({
        reply: match.answer,
      });
    }

    // GROK AI FALLBACK
    const completion = await client.chat.completions.create({
      model: "grok-3-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `
You are Range Of Himalayas AI Assistant.

Products:
- Sea Buckthorn Honey
- Sea Buckthorn Pulp
- Apricot Oil
- Dry Apricots
- Kala Zeera
- Sea Buckthorn Tea
- Rosehip Cream
- Saffron Honey

Rules:
- Be friendly.
- Keep answers under 120 words.
- Recommend products when relevant.
- If unsure, suggest contacting support.
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    return res.json({
      reply: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);

    return res.json({
      reply:
        "🌿 I'm currently unavailable. Please contact us on WhatsApp for assistance.",
    });
  }
};

