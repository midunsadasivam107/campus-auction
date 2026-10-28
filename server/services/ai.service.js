const Listing = require('../models/Listing');
const { GEMINI_API_KEY } = require('../config/env');
const { CATEGORIES, LISTING_STATUS } = require('../utils/constants');

/**
 * Knowledge base for auction platform rules
 */
const AUCTION_RULES_INFO = {
  antiSnipe:
    '⚡ Anti-Sniping Rule: If any valid bid is placed with 30 seconds or less remaining on an auction, the deadline is automatically extended to 60 seconds from that bid. This gives all students a fair chance to react and stops last-second bot snipers.',
  autoBid:
    '🤖 Auto-Bidding (Proxy Bidding): You can set a confidential maximum amount. The system will automatically place bids by the minimum increment only as needed to keep you in the lead, without ever exceeding your maximum.',
  handover:
    '🤝 Campus Handover: After an auction closes and the seller approves the winning price, the item is reserved. Both students meet safely on campus for inspection and handover.',
  general:
    '🎓 Campus Auction is an exclusive student-to-student platform. All auctions have real-time live bidding, starting prices, and transparent bid histories.',
};

/**
 * Fallback intent and filter extractor when Gemini API key is missing or offline
 */
const fallbackIntentParser = async (message, user) => {
  const text = message.toLowerCase();

  // 1. Check for auction rule questions
  if (text.includes('snipe') || text.includes('extend') || text.includes('last second')) {
    return {
      reply: `${AUCTION_RULES_INFO.antiSnipe}\n\nWould you like me to help you find an active auction?`,
      listings: [],
    };
  }
  if (text.includes('auto') || text.includes('proxy') || text.includes('automatic')) {
    return {
      reply: `${AUCTION_RULES_INFO.autoBid}\n\nYou can set an auto-bid directly on any item's auction page.`,
      listings: [],
    };
  }
  if (text.includes('handover') || text.includes('pickup') || text.includes('pay') || text.includes('cash')) {
    return {
      reply: `${AUCTION_RULES_INFO.handover}\n\nNo online payment gateway fees — just direct student-to-student exchange.`,
      listings: [],
    };
  }

  // 2. Extract structured search filters
  const filter = { status: LISTING_STATUS.ACTIVE, closingTime: { $gt: new Date() } };

  // Price extraction: "under 2000", "< 500", "below 1500", "budget 800"
  const priceMatch = text.match(/(?:under|below|less than|<|budget|max|within)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
  if (priceMatch) {
    const max = parseInt(priceMatch[1], 10);
    filter.currentPrice = { $lte: max };
  }

  // Category matching
  for (const cat of CATEGORIES) {
    if (text.includes(cat) || text.includes(cat.slice(0, -1))) {
      filter.category = cat;
      break;
    }
  }

  // If no category matched directly, check common synonyms
  if (!filter.category) {
    if (text.includes('cycle') || text.includes('bike')) filter.category = 'bicycles';
    if (text.includes('book') || text.includes('notes')) filter.category = 'textbooks';
    if (text.includes('laptop') || text.includes('phone') || text.includes('screen') || text.includes('mouse'))
      filter.category = 'electronics';
    if (text.includes('table') || text.includes('chair') || text.includes('bed'))
      filter.category = 'furniture';
  }

  // Keyword query
  const words = text
    .replace(/(?:find|me|a|an|the|under|below|less|than|show|search|for|looking|need|in|₹|rs|\d+)/gi, '')
    .trim();

  if (words.length > 2 && !filter.category) {
    filter.$or = [
      { title: { $regex: words, $options: 'i' } },
      { description: { $regex: words, $options: 'i' } },
    ];
  }

  // Query actual MongoDB database
  const matchingListings = await Listing.find(filter)
    .sort({ closingTime: 1 })
    .limit(5)
    .populate('seller', 'name')
    .lean();

  let reply = '';
  if (matchingListings.length > 0) {
    reply = `I found ${matchingListings.length} active auction(s) on campus matching your request. Here are the top results:`;
  } else {
    reply = `I couldn't find any active listings matching that right now. Try searching for "bicycles", "calculators", "textbooks", or save a search to get notified!`;
  }

  return {
    reply,
    listings: matchingListings,
    fallback: true,
  };
};

/**
 * Handle AI Assistant conversation
 */
const processAIChat = async (message, user) => {
  if (!message || !message.trim()) {
    return { reply: 'Hi there! How can I help you find campus items or explain auction rules today?' };
  }

  // If GEMINI_API_KEY is available, use Gemini API
  if (GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: `You are the Campus Auction AI Assistant for a student marketplace.
You help college students find used items (bicycles, textbooks, calculators, electronics) and explain platform rules (anti-sniping, automatic proxy bidding, campus handover).
Rules:
- Be concise, friendly, and campus-appropriate.
- Spending limits: If user has a spendingLimit (${user?.spendingLimit || 'none'}), never recommend or prepare bids exceeding it.
- Never place bids automatically. Always require explicit user confirmation.
- Output JSON when identifying search intents: {"intent": "search", "category": "...", "maxPrice": number, "keywords": "...", "reply": "..."}
- Or for general QA: {"intent": "qa", "reply": "..."}`,
                },
              ],
            },
            contents: [{ parts: [{ text: message }] }],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);

          // If Gemini extracted search filters, execute against MongoDB
          if (parsed.intent === 'search') {
            const filter = { status: LISTING_STATUS.ACTIVE, closingTime: { $gt: new Date() } };
            if (parsed.category) filter.category = parsed.category;
            if (parsed.maxPrice) {
              // Safety guardrail: cap at student's spending limit
              const effectiveMax = user?.spendingLimit
                ? Math.min(parsed.maxPrice, user.spendingLimit)
                : parsed.maxPrice;
              filter.currentPrice = { $lte: effectiveMax };
            }
            if (parsed.keywords) {
              filter.$or = [
                { title: { $regex: parsed.keywords, $options: 'i' } },
                { description: { $regex: parsed.keywords, $options: 'i' } },
              ];
            }

            const dbListings = await Listing.find(filter)
              .sort({ closingTime: 1 })
              .limit(5)
              .populate('seller', 'name')
              .lean();

            return {
              reply: parsed.reply || `Here are matching auctions from the campus database:`,
              listings: dbListings,
            };
          }

          return {
            reply: parsed.reply,
            listings: [],
          };
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to local intent parser:', err.message);
    }
  }

  // Fallback to local rule-based database search
  return fallbackIntentParser(message, user);
};

module.exports = {
  processAIChat,
};
