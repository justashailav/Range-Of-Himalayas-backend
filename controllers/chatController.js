export const chatWithBot = (req, res) => {
  const { message } = req.body;

  // Safety: avoid crash on page load
  if (!message || !message.trim()) {
    return res.json({
      reply: "Hi 👋 How can I help you today?",
    });
  }

  const text = message.toLowerCase();

  const faqs = [
    // DELIVERY & SHIPPING
    {
      keywords: ["delivery", "shipping", "deliver", "ship"],
      answer:
        "We deliver PAN India 🌿 Orders usually reach within 3–5 business days.",
    },
    {
      keywords: ["tracking", "track", "order status"],
      answer:
        "Once your order is shipped, you will receive a tracking link via SMS or email.",
    },

    // PAYMENT
    {
      keywords: ["cod", "cash", "cash on delivery"],
      answer:
        "Yes, Cash on Delivery (COD) is available on eligible orders across India.",
    },
    {
      keywords: ["payment", "online payment", "upi", "card"],
      answer:
        "We accept UPI, debit/credit cards, net banking, and other secure online payment methods.",
    },

    // PAHADI RAJMA
    {
      keywords: ["rajma", "pahadi", "kidney beans"],
      answer:
        "Our Pahadi Rajma is sourced directly from Himalayan farmers. It is natural, rich in protein, and has an authentic taste.",
    },
    {
      keywords: ["rajma benefits", "rajma health"],
      answer:
        "Pahadi Rajma is rich in protein, fiber, and essential minerals, making it great for digestion and overall health.",
    },

    // DRY APRICOT
    {
      keywords: ["apricot", "khubani", "dry apricot"],
      answer:
        "Our dry apricots are sun-dried, chemical-free, and rich in vitamins, iron, and antioxidants.",
    },
    {
      keywords: ["apricot benefits", "khubani benefits"],
      answer:
        "Dry apricots help improve digestion, boost immunity, and are good for skin and eye health.",
    },

    // 🌾 RED RICE (NEW)
    {
      keywords: ["red rice", "lal chawal", "red rice pahadi"],
      answer:
        "Our Red Rice is traditionally grown in the Himalayan region. It is unpolished, rich in fiber, and has a natural earthy flavor.",
    },
    {
      keywords: ["red rice benefits", "lal chawal benefits"],
      answer:
        "Red Rice is high in fiber and antioxidants. It helps in better digestion, weight management, and maintaining heart health.",
    },
    {
      keywords: ["how to cook red rice", "red rice cooking"],
      answer:
        "Red Rice should be soaked for 30 minutes and cooked in a 1:2 ratio (rice:water). It takes slightly longer to cook than white rice.",
    },

    // ORGANIC / QUALITY
    {
      keywords: ["organic", "chemical free", "natural"],
      answer:
        "All our products are natural and chemical-free, sourced responsibly from Himalayan farmers.",
    },
    {
      keywords: ["quality", "authentic", "original"],
      answer:
        "We focus on quality over quantity, ensuring authentic Himalayan products with traditional taste.",
    },

    // RETURNS & SUPPORT
    {
      keywords: ["return", "refund", "replace"],
      answer:
        "Returns and refunds are handled as per our return policy. Please visit the Return Policy page for details.",
    },
    {
      keywords: ["contact", "support", "help"],
      answer:
        "You can contact us via the Contact Us page or WhatsApp for quick assistance 🌿",
    },
  ];

  const match = faqs.find((faq) =>
    faq.keywords.some((k) => text.includes(k))
  );

  if (match) {
    return res.json({ reply: match.answer });
  }

  return res.json({
    reply:
      "I’m not fully sure about that 🌿 Please contact us on WhatsApp for personalized assistance.",
  });
};
