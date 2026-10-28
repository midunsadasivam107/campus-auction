import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import AuctionCard from '../components/auction/AuctionCard';
import {
  HiOutlineSparkles,
  HiOutlinePaperAirplane,
  HiOutlineShieldCheck,
  HiOutlineTag,
} from 'react-icons/hi';

const SUGGESTIONS = [
  'Find me a bicycle under ₹2,000',
  'Scientific calculator under ₹500',
  'How does the anti-sniping rule work?',
  'How does automatic bidding work?',
  'Engineering textbooks in good condition',
];

function AIAssistantPage() {
  const { user, isAuthenticated } = useAuth();

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "👋 Hi! I'm your Campus Auction AI Assistant. Ask me to find items within your budget, recommend active auctions, or explain platform rules like anti-sniping and proxy bidding.",
      listings: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText = null) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    // Add student message
    const userMsg = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: textToSend });
      const aiMsg = {
        sender: 'ai',
        text: res.data.reply,
        listings: res.data.listings || [],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      toast.error('AI assistant is temporarily unavailable');
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: "I'm having trouble connecting right now. You can use the standard search filters on the Browse page!",
          listings: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xl shadow-xs">
            <HiOutlineSparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              AI Campus Assistant
              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                Beta
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Natural language search, item discovery & auction rule guide
            </p>
          </div>
        </div>

        {user?.spendingLimit && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-lg text-xs font-semibold text-green-700">
            <HiOutlineShieldCheck className="w-4 h-4 text-green-600" />
            <span>Guardrail: ₹{user.spendingLimit} limit</span>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${
              m.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed shadow-2xs ${
                m.sender === 'user'
                  ? 'bg-primary-600 text-white rounded-br-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-line">{m.text}</p>
            </div>

            {/* Render any returned database listing cards */}
            {m.listings && m.listings.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {m.listings.map((l) => (
                  <div
                    key={l._id}
                    className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex gap-3 items-center"
                  >
                    <img
                      src={
                        l.images?.[0]?.url ||
                        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=60'
                      }
                      alt={l.title}
                      className="w-16 h-16 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {l.category}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900 truncate mt-0.5">
                        {l.title}
                      </h4>
                      <p className="text-xs font-extrabold text-primary-600 mt-0.5">
                        ₹{l.currentPrice ?? l.startingPrice}
                      </p>
                      <Link
                        to={`/auction/${l._id}`}
                        className="inline-block mt-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700 underline"
                      >
                        View & Bid →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl w-fit shadow-2xs text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce delay-100" />
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce delay-200" />
            <span className="ml-1 font-medium">Searching campus listings...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="pt-2 pb-3 overflow-x-auto flex gap-2">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSend(s)}
            className="text-xs bg-white hover:bg-purple-50 text-slate-600 hover:text-purple-700 px-3 py-1.5 rounded-full border border-slate-200 transition-colors whitespace-nowrap shadow-2xs font-medium"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2 pt-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me: 'Find a bicycle under ₹2000' or 'How does anti-sniping work?'"
          className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm shadow-xs"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          <HiOutlinePaperAirplane className="w-5 h-5 rotate-90" />
        </button>
      </form>
    </div>
  );
}

export default AIAssistantPage;
