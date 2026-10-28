import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CountdownTimer from '../components/auction/CountdownTimer';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineTag,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineCurrencyRupee,
  HiOutlineClock,
} from 'react-icons/hi';

function AuctionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);

  // Bid input state (for upcoming bidding milestone)
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);

  // Active tab (description, bids, qa)
  const [activeTab, setActiveTab] = useState('description');

  const fetchListing = async () => {
    try {
      const res = await api.get(`/listings/${id}`);
      setListing(res.data.listing);
      // Auto-set suggested minimum bid
      const current = res.data.listing.currentPrice ?? res.data.listing.startingPrice;
      const minInc = res.data.listing.minBidIncrement || 10;
      const nextMin = res.data.listing.bidCount === 0 ? current : current + minInc;
      setBidAmount(String(nextMin));
    } catch {
      toast.error('Failed to load auction listing');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-4 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        <p className="mt-2 text-slate-500 text-sm">Loading auction...</p>
      </div>
    );
  }

  if (!listing) return null;

  const isSeller = user && listing.seller && (listing.seller._id === user._id || listing.seller.id === user._id);
  const isWinner = user && listing.currentWinner && (listing.currentWinner._id === user._id || listing.currentWinner.id === user._id);
  const isClosed =
    listing.status === 'closed' ||
    listing.status === 'sold' ||
    listing.status === 'completed' ||
    listing.status === 'unsold' ||
    listing.status === 'rejected' ||
    listing.status === 'cancelled' ||
    new Date(listing.closingTime) <= new Date();

  const photos =
    listing.images && listing.images.length > 0
      ? listing.images
      : [{ url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80' }];

  // Minimum required bid amount
  const minRequiredBid =
    listing.bidCount === 0
      ? listing.startingPrice
      : (listing.currentPrice || listing.startingPrice) + (listing.minBidIncrement || 10);

  // Handle Cancel Listing
  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this auction listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      toast.success('Listing cancelled');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel listing');
    }
  };

  // Handle Seller Approve
  const handleApprove = async () => {
    try {
      const res = await api.post(`/listings/${id}/approve`);
      setListing(res.data.listing);
      toast.success('Sale approved! Item is reserved for the winning student.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    }
  };

  // Handle Seller Reject
  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this winning bid?')) return;
    try {
      const res = await api.post(`/listings/${id}/reject`);
      setListing(res.data.listing);
      toast.success('Winning bid rejected.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject');
    }
  };

  // Handle Handover Confirmation
  const handleConfirmPickup = async () => {
    try {
      const res = await api.post(`/listings/${id}/confirm-pickup`);
      setListing(res.data.listing);
      toast.success('Campus handover confirmed! Deal completed 🎉');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to confirm handover');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        <span className="capitalize">{listing.category}</span>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate max-w-xs">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Photo Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Large Photo */}
          <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs relative">
            <img
              src={photos[selectedPhotoIdx]?.url}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="text-xs font-semibold bg-white/95 text-slate-800 px-2.5 py-1 rounded-md shadow-xs capitalize">
                {listing.category}
              </span>
              <span className="text-xs font-semibold bg-slate-900/80 text-white px-2.5 py-1 rounded-md shadow-xs capitalize">
                {listing.condition?.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {photos.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPhotoIdx(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedPhotoIdx === idx
                      ? 'border-primary-600 ring-2 ring-primary-100'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Auction Info & Bidding Action (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              {listing.title}
            </h1>

            {/* Status / Countdown */}
            <div className="mt-4 flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status:
                </span>
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                  listing.status === 'active' ? 'bg-green-100 text-green-700' :
                  listing.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                  listing.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {listing.status?.replace('_', ' ')}
                </span>
              </div>

              {!isClosed ? (
                <CountdownTimer targetDate={listing.closingTime} />
              ) : (
                <span className="text-xs font-bold text-slate-500">AUCTION CLOSED</span>
              )}
            </div>

            {/* Pricing Section */}
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    {listing.bidCount > 0 ? 'Current Leading Bid' : 'Starting Price'}
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1">
                    ₹{listing.currentPrice ?? listing.startingPrice}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Starting: ₹{listing.startingPrice}</p>
                  <p className="text-xs text-slate-500">Min Inc: +₹{listing.minBidIncrement || 10}</p>
                  <p className="text-xs font-semibold text-primary-600 mt-0.5">
                    {listing.bidCount} {listing.bidCount === 1 ? 'bid' : 'bids'}
                  </p>
                </div>
              </div>
            </div>

            {/* Seller Controls */}
            {isSeller && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  You are the seller of this item
                </p>

                {listing.bidCount === 0 && (
                  <div className="flex gap-2">
                    <Link
                      to={`/auction/${listing._id}/edit`}
                      className="flex-1 py-2 px-3 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 text-center flex items-center justify-center gap-1.5"
                    >
                      <HiOutlinePencilAlt className="w-4 h-4" /> Edit
                    </Link>
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-2 px-3 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center justify-center gap-1.5"
                    >
                      <HiOutlineTrash className="w-4 h-4" /> Cancel Listing
                    </button>
                  </div>
                )}

                {/* Approve/Reject winning price */}
                {(listing.status === 'pending_approval' || (listing.status === 'closed' && listing.bidCount > 0)) && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs text-slate-600">
                      Auction finished with a winning bid of ₹{listing.currentPrice}. Please approve or reject:
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleApprove}
                        className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
                      >
                        <HiOutlineCheckCircle className="w-4 h-4" /> Approve Sale
                      </button>
                      <button
                        onClick={handleReject}
                        className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
                      >
                        <HiOutlineXCircle className="w-4 h-4" /> Reject Bid
                      </button>
                    </div>
                  </div>
                )}

                {/* Handover confirmation */}
                {listing.status === 'sold' && (
                  <button
                    onClick={handleConfirmPickup}
                    className="w-full py-2.5 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <HiOutlineCheckCircle className="w-5 h-5" /> Confirm Campus Handover
                  </button>
                )}
              </div>
            )}

            {/* Buyer Handover Confirmation */}
            {isWinner && listing.status === 'sold' && !isSeller && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl space-y-2">
                <p className="text-sm font-semibold text-green-900">
                  🎉 You are the provisional winner!
                </p>
                <p className="text-xs text-green-700">
                  Meet the seller on campus to inspect the item and hand over cash.
                </p>
                <button
                  onClick={handleConfirmPickup}
                  className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold"
                >
                  Confirm Item Received
                </button>
              </div>
            )}

            {/* Quick Bid Form Box (Manual bidding placeholder) */}
            {!isClosed && !isSeller && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Place a Bid (Min ₹{minRequiredBid})
                  </label>
                  <span className="text-xs text-slate-400">⚡ Real-time updates</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={minRequiredBid}
                      step={listing.minBidIncrement || 10}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
                    />
                  </div>
                  <button
                    disabled={bidding || !isAuthenticated}
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Please log in to place a bid');
                        navigate('/login');
                        return;
                      }
                      toast.success(`Bid prepared for ₹${bidAmount}. Real-time bidding activates in Phase 5!`);
                    }}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50"
                  >
                    Place Bid
                  </button>
                </div>
                {!isAuthenticated && (
                  <p className="text-xs text-slate-500 mt-2">
                    <Link to="/login" className="text-primary-600 font-semibold underline">
                      Log in
                    </Link>{' '}
                    as a student to participate in this auction.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Seller Card */}
          {listing.seller && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Seller Information
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
                  {listing.seller.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{listing.seller.name}</h3>
                  <p className="text-xs text-slate-500">
                    {listing.seller.graduationYear
                      ? `Class of ${listing.seller.graduationYear}`
                      : 'Campus Student'}
                  </p>
                  {listing.seller.studentId && (
                    <p className="text-[11px] text-slate-400 font-mono">
                      ID: {listing.seller.studentId}
                    </p>
                  )}
                </div>
              </div>
              {listing.seller.bio && (
                <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 italic">
                  "{listing.seller.bio}"
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Tabs: Description, Bid History, Q&A */}
      <div className="mt-10 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'description'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Item Description
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`pb-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'bids'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Bid History ({listing.bidCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('qa')}
            className={`pb-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'qa'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Questions & Answers
          </button>
        </div>

        <div className="py-6">
          {activeTab === 'description' && (
            <div className="prose prose-slate max-w-none text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {listing.description}
            </div>
          )}

          {activeTab === 'bids' && (
            <div>
              <p className="text-sm text-slate-500">
                {listing.bidCount === 0
                  ? 'No bids placed yet. Be the first student to bid!'
                  : `Total ${listing.bidCount} bids placed. Real-time bid log will appear here.`}
              </p>
            </div>
          )}

          {activeTab === 'qa' && (
            <div>
              <p className="text-sm text-slate-500">
                Have a question about this item? Ask the seller directly before bidding.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuctionDetailPage;
