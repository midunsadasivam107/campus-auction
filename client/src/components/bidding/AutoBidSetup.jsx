import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
  HiOutlineInformationCircle,
  HiOutlineTrash,
} from 'react-icons/hi';

function AutoBidSetup({ listingId, currentPrice, minIncrement, isAuthenticated }) {
  const [activeAutoBid, setActiveAutoBid] = useState(null);
  const [maxAmount, setMaxAmount] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const minSuggested = (currentPrice || 0) + (minIncrement || 10) * 2;

  const fetchMyAutoBid = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/listings/${listingId}/auto-bid`);
      setActiveAutoBid(res.data.autoBid);
      if (res.data.autoBid) {
        setMaxAmount(String(res.data.autoBid.maxAmount));
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAutoBid();
  }, [listingId, isAuthenticated]);

  const handleSetAutoBid = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please log in to configure automatic bidding');
      return;
    }

    const num = Number(maxAmount);
    if (isNaN(num) || num <= currentPrice) {
      toast.error(`Auto-bid maximum must be greater than current price (₹${currentPrice})`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/listings/${listingId}/auto-bid`, {
        maxAmount: num,
      });
      setActiveAutoBid(res.data.autoBid);
      toast.success(res.data.message || 'Auto-bidding configured! ⚡');
      setShowConfig(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to configure auto-bid');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAutoBid = async () => {
    if (!window.confirm('Cancel your automatic bidding for this auction?')) return;
    try {
      await api.delete(`/listings/${listingId}/auto-bid`);
      setActiveAutoBid(null);
      setMaxAmount('');
      toast.success('Automatic bidding cancelled');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel auto-bid');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="pt-3 border-t border-slate-100">
      {/* Header toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1.5 focus:outline-none"
        >
          <span className="p-1 rounded-md bg-red-950/80 text-red-400 border border-red-800/60">
            <HiOutlineLightningBolt className="w-3.5 h-3.5" />
          </span>
          {activeAutoBid
            ? `Auto-Bidding Active (Max: ₹${activeAutoBid.maxAmount})`
            : 'Set Up Automatic Bidding (Proxy Bid)'}
        </button>

        {activeAutoBid && (
          <button
            type="button"
            onClick={handleCancelAutoBid}
            className="text-[11px] text-red-500 hover:text-red-400 font-medium flex items-center gap-0.5"
            title="Cancel Auto-Bid"
          >
            <HiOutlineTrash className="w-3.5 h-3.5" /> Cancel
          </button>
        )}
      </div>

      {/* Config Form */}
      {showConfig && (
        <div className="mt-3 p-3.5 bg-red-950/40 border border-red-900/50 rounded-xl space-y-3 text-xs text-red-200">
          <div className="flex items-start gap-2">
            <HiOutlineShieldCheck className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="font-semibold text-white">How it works:</strong> Set your maximum confirmed bid. Campus Auction will automatically place bids by the minimum increment (+₹{minIncrement}) only as needed to keep you winning. Your max is 100% confidential.
            </p>
          </div>

          <form onSubmit={handleSetAutoBid} className="space-y-2 pt-1">
            <label className="block font-semibold text-zinc-300">
              Maximum Confirmed Amount (₹)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={currentPrice + minIncrement}
                step={minIncrement}
                required
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder={`e.g. ₹${minSuggested}`}
                className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-xs whitespace-nowrap disabled:opacity-50"
              >
                {submitting ? 'Saving...' : activeAutoBid ? 'Update' : 'Set Auto-Bid'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AutoBidSetup;
