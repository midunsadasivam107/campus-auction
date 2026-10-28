import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineCurrencyRupee, HiOutlineLightningBolt } from 'react-icons/hi';
import AutoBidSetup from './AutoBidSetup';

function BidForm({ listing, user, isAuthenticated, onBidSuccess }) {
  const isSeller =
    user &&
    listing.seller &&
    (listing.seller._id === user._id || listing.seller.id === user._id);

  const isLeadingBidder =
    user &&
    listing.currentWinner &&
    (listing.currentWinner._id === user._id ||
      listing.currentWinner.id === user._id ||
      listing.currentWinner === user._id);

  const minIncrement = listing.minBidIncrement || 10;
  const currentPrice = listing.currentPrice ?? listing.startingPrice;
  const minRequiredBid =
    listing.bidCount === 0 ? listing.startingPrice : currentPrice + minIncrement;

  const [amount, setAmount] = useState(String(minRequiredBid));
  const [submitting, setSubmitting] = useState(false);

  // Update bid input when leading price changes
  useEffect(() => {
    setAmount(String(minRequiredBid));
  }, [minRequiredBid]);

  const addIncrement = (inc) => {
    const nextVal = (Number(amount) || minRequiredBid) + inc;
    setAmount(String(nextVal));
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please log in to place a bid');
      return;
    }

    if (isSeller) {
      toast.error('You cannot bid on your own listing');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < minRequiredBid) {
      toast.error(`Bid must be at least ₹${minRequiredBid}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/listings/${listing._id}/bids`, {
        amount: numAmount,
      });

      toast.success(res.data.message || `Bid of ₹${numAmount} placed! 🎯`);
      if (onBidSuccess) {
        onBidSuccess(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  if (isSeller) {
    return (
      <div className="p-3.5 bg-slate-100 rounded-xl text-center text-xs text-slate-500 font-medium">
        🛡️ As the seller, you cannot place bids on this listing.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Leading Bidder Banner */}
      {isLeadingBidder && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800 flex items-center gap-1.5 justify-center">
          <span>🏆</span>
          <span>You currently hold the leading bid!</span>
        </div>
      )}

      <form onSubmit={handleBidSubmit} className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-semibold uppercase tracking-wider">
            Your Bid Amount
          </span>
          <span className="text-slate-400">Min required: ₹{minRequiredBid}</span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-semibold">
              ₹
            </span>
            <input
              type="number"
              min={minRequiredBid}
              step={minIncrement}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-base focus:ring-2 focus:ring-primary-500 focus:outline-none shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-1"
          >
            {submitting ? 'Placing...' : 'Place Bid'}
          </button>
        </div>

        {/* Quick Increment Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-400">Quick add:</span>
          {[
            { label: `+₹${minIncrement}`, val: minIncrement },
            { label: '+₹50', val: 50 },
            { label: '+₹100', val: 100 },
          ].map((btn, i) => (
            <button
              key={i}
              type="button"
              onClick={() => addIncrement(btn.val)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-primary-50 text-slate-700 hover:text-primary-700 rounded-md text-xs font-medium border border-slate-200 transition-colors"
            >
              {btn.label}
            </button>
          ))}
        </div>

        {!isAuthenticated && (
          <p className="text-xs text-slate-500 text-center pt-1">
            <Link to="/login" className="text-primary-600 font-semibold underline">
              Log in
            </Link>{' '}
            as a student to participate in this auction.
          </p>
        )}
      </form>

      <AutoBidSetup
        listingId={listing._id}
        currentPrice={currentPrice}
        minIncrement={minIncrement}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}

export default BidForm;
