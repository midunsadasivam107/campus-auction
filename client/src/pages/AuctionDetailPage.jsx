import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CountdownTimer from '../components/auction/CountdownTimer';
import BidForm from '../components/bidding/BidForm';
import BidHistory from '../components/bidding/BidHistory';
import QAThread from '../components/qa/QAThread';
import StudentProfileModal from '../components/profile/StudentProfileModal';
import socket from '../services/socket';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineTag,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineLightningBolt,
  HiOutlineBadgeCheck,
} from 'react-icons/hi';

function AuctionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [listing, setListing] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('bids');
  const [extensionNotice, setExtensionNotice] = useState(null);
  const [profileModal, setProfileModal] = useState({
    isOpen: false,
    user: null,
    role: 'Student Profile',
  });

  const openProfileModal = (targetUser, role = 'Student Profile') => {
    if (!targetUser) return;
    setProfileModal({
      isOpen: true,
      user: targetUser,
      role,
    });
  };

  const closeProfileModal = () => {
    setProfileModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Store user ID in ref for socket closure
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Fetch listing data & bid history
  const fetchData = async () => {
    try {
      const [listingRes, bidsRes] = await Promise.all([
        api.get(`/listings/${id}`),
        api.get(`/listings/${id}/bids`),
      ]);
      setListing(listingRes.data.listing);
      setBids(bidsRes.data.bids || []);
    } catch {
      toast.error('Failed to load auction');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // ─── Socket.IO Real-Time Subscriptions ───
    socket.emit('join-auction', id);

    const handleNewBid = (data) => {
      // Update listing price, bidCount, and closingTime if updated
      setListing((prev) => {
        if (!prev) return prev;

        // Check if current student was outbid
        const prevWinnerId = prev.currentWinner?._id || prev.currentWinner;
        const currentUserId = userRef.current?._id;
        if (
          currentUserId &&
          prevWinnerId === currentUserId &&
          data.bidderName !== userRef.current?.name
        ) {
          toast.error(
            `⚠️ You've been outbid on ${prev.title}! New high bid is ₹${data.amount}`,
            { duration: 5000, icon: '⚡' }
          );
        }

        return {
          ...prev,
          currentPrice: data.amount,
          bidCount: data.bidCount,
          closingTime: data.closingTime || prev.closingTime,
        };
      });

      // Prepend new bid to history
      setBids((prevBids) => [
        {
          _id: `bid_${Date.now()}`,
          amount: data.amount,
          createdAt: data.createdAt || new Date().toISOString(),
          isAutoBid: data.isAutoBid,
          bidder: { name: data.bidderName },
        },
        ...prevBids,
      ]);
    };

    const handleAuctionExtended = (data) => {
      setListing((prev) =>
        prev ? { ...prev, closingTime: data.newClosingTime } : prev
      );
      setExtensionNotice(
        data.message || '⚡ Anti-sniping: Auction extended by 60 seconds!'
      );
      toast(
        '⚡ Last-minute bid! Auction extended by 60 seconds (anti-sniping rule)',
        { duration: 6000, icon: '⏰' }
      );
    };

    const handleAuctionClosed = () => {
      setListing((prev) => (prev ? { ...prev, status: 'closed' } : prev));
      toast('Auction closed!', { icon: '🏁' });
    };

    socket.on('new-bid', handleNewBid);
    socket.on('auction-extended', handleAuctionExtended);
    socket.on('auction-closed', handleAuctionClosed);

    return () => {
      socket.emit('leave-auction', id);
      socket.off('new-bid', handleNewBid);
      socket.off('auction-extended', handleAuctionExtended);
      socket.off('auction-closed', handleAuctionClosed);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-4 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        <p className="mt-2 text-slate-500 text-sm">Loading live auction...</p>
      </div>
    );
  }

  if (!listing) return null;

  const isSeller =
    user &&
    listing.seller &&
    (listing.seller._id === user._id || listing.seller.id === user._id);
  const isWinner =
    user &&
    listing.currentWinner &&
    (listing.currentWinner._id === user._id ||
      listing.currentWinner.id === user._id ||
      listing.currentWinner === user._id);

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
      : [
          {
            url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
          },
        ];

  // Callback on local bid success
  const handleBidSuccess = (resData) => {
    setListing((prev) => ({
      ...prev,
      currentPrice: resData.listing.currentPrice,
      bidCount: resData.listing.bidCount,
      closingTime: resData.listing.closingTime,
      currentWinner: resData.listing.currentWinner,
    }));
    setBids((prev) => [resData.bid, ...prev]);
  };

  // Seller Action Handlers
  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this auction listing?'))
      return;
    try {
      await api.delete(`/listings/${id}`);
      toast.success('Listing cancelled');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    }
  };

  const handleApprove = async () => {
    try {
      const res = await api.post(`/listings/${id}/approve`);
      setListing(res.data.listing);
      toast.success('Winning bid approved! Item reserved.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this winning bid?'))
      return;
    try {
      const res = await api.post(`/listings/${id}/reject`);
      setListing(res.data.listing);
      toast.success('Winning bid rejected.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject');
    }
  };

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
      {/* Extension Alert Banner */}
      {extensionNotice && (
        <div className="mb-4 p-3 bg-amber-500 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span>{extensionNotice}</span>
          </div>
          <button
            onClick={() => setExtensionNotice(null)}
            className="text-white hover:text-amber-100 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-primary-600">
          Home
        </Link>
        <span>/</span>
        <Link
          to={`/search?category=${listing.category}`}
          className="capitalize hover:text-primary-600"
        >
          {listing.category}
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate max-w-xs">
          {listing.title}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Photos (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
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
                  <img
                    src={p.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & Live Bidding Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              {listing.title}
            </h1>

            {/* Status & Live Countdown Bar */}
            <div className="mt-4 flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status:
                </span>
                <span
                  className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    listing.status === 'active'
                      ? 'bg-red-950/80 text-red-400 border border-red-800/60'
                      : listing.status === 'sold'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                      : listing.status === 'completed'
                      ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {listing.status?.replace('_', ' ')}
                </span>
              </div>

              {!isClosed ? (
                <CountdownTimer targetDate={listing.closingTime} />
              ) : (
                <span className="text-xs font-bold text-slate-500">
                  AUCTION CLOSED
                </span>
              )}
            </div>

            {/* Price Box */}
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    {listing.bidCount > 0
                      ? 'Current Leading Bid'
                      : 'Starting Price'}
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1">
                    ₹{listing.currentPrice ?? listing.startingPrice}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    Starting: ₹{listing.startingPrice}
                  </p>
                  <p className="text-xs text-slate-500">
                    Min Inc: +₹{listing.minBidIncrement || 10}
                  </p>
                  <p className="text-xs font-semibold text-primary-600 mt-0.5">
                    {listing.bidCount}{' '}
                    {listing.bidCount === 1 ? 'bid' : 'bids'}
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

                {(listing.status === 'pending_approval' ||
                  (listing.status === 'closed' && listing.bidCount > 0)) && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs text-slate-600">
                      Auction finished with winning bid of ₹
                      {listing.currentPrice}. Please approve or reject:
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleApprove}
                        className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
                      >
                        <HiOutlineCheckCircle className="w-4 h-4" /> Approve
                        Sale
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

                {listing.status === 'sold' && (
                  <button
                    onClick={handleConfirmPickup}
                    className="w-full py-2.5 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <HiOutlineCheckCircle className="w-5 h-5" /> Confirm Campus
                    Handover
                  </button>
                )}

                {/* Seller's Winning Buyer Profile Card */}
                {listing.currentWinner && (
                  <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <HiOutlineBadgeCheck className="w-3.5 h-3.5 text-red-500" />
                        Winning Buyer Info
                      </span>
                      <span className="text-xs font-bold text-red-400">
                        ₹{listing.currentPrice}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {listing.currentWinner?.name || 'Winning Bidder'}
                        </p>
                        {listing.currentWinner?.studentId && (
                          <p className="text-[11px] text-zinc-400 font-mono">
                            ID: {listing.currentWinner.studentId}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => openProfileModal(listing.currentWinner, 'Winning Buyer Profile')}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors shrink-0"
                      >
                        <HiOutlineUser className="w-3.5 h-3.5" /> View Buyer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Buyer Handover Confirmation */}
            {isWinner && listing.status === 'sold' && !isSeller && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl space-y-2.5">
                <p className="text-sm font-semibold text-green-900">
                  🎉 You won this auction!
                </p>
                <p className="text-xs text-green-700">
                  Meet the seller on campus to inspect the item and hand over cash.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={handleConfirmPickup}
                    className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold text-center"
                  >
                    Confirm Item Received
                  </button>
                  {listing.seller && (
                    <button
                      type="button"
                      onClick={() => openProfileModal(listing.seller, 'Seller Profile')}
                      className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <HiOutlineUser className="w-3.5 h-3.5 text-red-400" /> View Seller
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Live Bidding Form */}
            {!isClosed && !isSeller && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <BidForm
                  listing={listing}
                  user={user}
                  isAuthenticated={isAuthenticated}
                  onBidSuccess={handleBidSuccess}
                />
              </div>
            )}
          </div>

          {/* Seller Card */}
          {listing.seller && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Seller Information
                </p>
                <button
                  type="button"
                  onClick={() => openProfileModal(listing.seller, 'Seller Profile')}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
                >
                  View Profile →
                </button>
              </div>
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => openProfileModal(listing.seller, 'Seller Profile')}
              >
                <div className="w-12 h-12 rounded-full bg-red-950/80 text-red-400 border border-red-800/60 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                  {listing.seller.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-red-400 transition-colors">
                    {listing.seller.name}
                  </h3>
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
              <button
                type="button"
                onClick={() => openProfileModal(listing.seller, 'Seller Profile')}
                className="mt-4 w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 hover:border-red-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <HiOutlineUser className="w-4 h-4 text-red-400" />
                View Full Seller Profile & Other Listings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Tabs: Bid History, Description, Q&A */}
      <div className="mt-10 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('bids')}
            className={`pb-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'bids'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Live Bid History ({bids.length})
          </button>
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
          {activeTab === 'bids' && (
            <BidHistory
              bids={bids}
              currentWinnerId={listing.currentWinner}
              currentUserId={user?._id}
              onSelectBidder={(bidder) => openProfileModal(bidder, 'Bidder Profile')}
            />
          )}

          {activeTab === 'description' && (
            <div className="prose prose-slate max-w-none text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {listing.description}
            </div>
          )}

          {activeTab === 'qa' && (
            <QAThread
              listingId={id}
              isSeller={isSeller}
              isAuthenticated={isAuthenticated}
            />
          )}
        </div>
      </div>

      {/* Reusable Student Profile Modal */}
      <StudentProfileModal
        isOpen={profileModal.isOpen}
        onClose={closeProfileModal}
        initialUser={profileModal.user}
        userId={profileModal.user?._id || profileModal.user?.id}
        roleLabel={profileModal.role}
      />
    </div>
  );
}

export default AuctionDetailPage;
