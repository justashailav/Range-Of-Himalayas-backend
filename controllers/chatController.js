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
    // 🌿 SEA BUCKTHORN HONEY
{
  keywords: ["sea buckthorn honey", "himalayan honey", "natural honey"],
  answer:
    "Our Sea Buckthorn Honey is raw, unprocessed, and sourced from the Himalayan valleys. It combines the richness of wild honey with the powerful nutrients of sea buckthorn.",
},
{
  keywords: ["sea buckthorn honey benefits", "honey benefits"],
  answer:
    "Sea Buckthorn Honey is rich in antioxidants, boosts immunity, improves digestion, and supports skin health naturally.",
},

// 🌿 SEA BUCKTHORN PULP
{
  keywords: ["sea buckthorn pulp", "sea buckthorn juice", "lehsun fruit pulp"],
  answer:
    "Our Sea Buckthorn Pulp is made from freshly harvested berries from the Himalayas. It is pure, nutrient-dense, and free from additives.",
},
{
  keywords: ["sea buckthorn pulp benefits", "sea buckthorn juice benefits"],
  answer:
    "Sea Buckthorn Pulp is loaded with Vitamin C, helps boost immunity, improves skin glow, and supports overall wellness.",
},

// 🌿 APRICOT OIL
{
  keywords: ["apricot oil", "khubani oil", "apricot kernel oil"],
  answer:
    "Our Apricot Oil is cold-pressed from high-quality Himalayan apricot kernels. It is lightweight, pure, and highly nourishing.",
},
{
  keywords: ["apricot oil benefits", "khubani oil benefits"],
  answer:
    "Apricot Oil deeply moisturizes skin, improves elasticity, promotes hair growth, and adds natural shine to hair.",
},

// 🌿 DRY APRICOT
{
  keywords: ["dry apricot", "khubani", "dried apricot"],
  answer:
    "Our Dry Apricots are naturally sun-dried in the Himalayas without any chemicals, preserving their natural sweetness and nutrients.",
},
{
  keywords: ["dry apricot benefits", "khubani benefits"],
  answer:
    "Dry Apricots are rich in iron, fiber, and antioxidants. They support digestion, improve skin health, and boost energy levels.",
},

// 🌿 KALA ZEERA
{
  keywords: ["kala zeera", "black cumin", "himalayan jeera"],
  answer:
    "Our Kala Zeera is sourced from high-altitude Himalayan regions. It has a strong aroma and is widely used in traditional cooking and medicine.",
},
{
  keywords: ["kala zeera benefits", "black cumin benefits"],
  answer:
    "Kala Zeera helps improve digestion, supports metabolism, and has antioxidant and anti-inflammatory properties.",
},

// 🌿 SEA BUCKTHORN TEA
{
  keywords: ["sea buckthorn tea", "herbal tea himalaya"],
  answer:
    "Our Sea Buckthorn Tea is a refreshing herbal infusion made from Himalayan sea buckthorn, known for its tangy taste and health benefits.",
},
{
  keywords: ["sea buckthorn tea benefits"],
  answer:
    "Sea Buckthorn Tea boosts immunity, detoxifies the body, and promotes healthy skin and digestion.",
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
