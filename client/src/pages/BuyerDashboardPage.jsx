import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CountdownTimer from '../components/auction/CountdownTimer';
import StudentProfileModal from '../components/profile/StudentProfileModal';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineTag,
  HiOutlineCheckCircle,
  HiOutlineArrowNarrowRight,
  HiOutlineExclamation,
  HiOutlineUser,
} from 'react-icons/hi';

function BuyerDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const fetchMyBids = async () => {
    try {
      const res = await api.get('/bids/my');
      setBids(res.data.bids || []);
    } catch {
      toast.error('Failed to load your bidding history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchMyBids();
  }, [isAuthenticated]);

  // Group bids by listing so each unique auction is shown once with student's highest bid
  const groupedAuctions = Object.values(
    bids.reduce((acc, bid) => {
      if (!bid.listing) return acc;
      const listId = bid.listing._id;
      if (!acc[listId]) {
        acc[listId] = {
          listing: bid.listing,
          myHighestBid: bid.amount,
          myBidsCount: 1,
          latestBidDate: bid.createdAt,
        };
      } else {
        acc[listId].myBidsCount += 1;
        if (bid.amount > acc[listId].myHighestBid) {
          acc[listId].myHighestBid = bid.amount;
        }
      }
      return acc;
    }, {})
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Buyer Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Track all auctions you have bid on, monitor live status, and counter outbids
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading your bids...</div>
      ) : groupedAuctions.length > 0 ? (
        <div className="mt-6 space-y-4">
          {groupedAuctions.map(({ listing, myHighestBid, myBidsCount }) => {
            const isWinner =
              user &&
              listing.currentWinner &&
              (listing.currentWinner === user._id ||
                listing.currentWinner._id === user._id);

            const isLeading = isWinner && listing.status === 'active';
            const isOutbid = !isWinner && listing.status === 'active';
            const isWon =
              isWinner &&
              (listing.status === 'sold' ||
                listing.status === 'pending_approval' ||
                listing.status === 'completed');

            let statusBadge = (
              <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
                {listing.status}
              </span>
            );

            if (isLeading) {
              statusBadge = (
                <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded bg-green-100 text-green-700 flex items-center gap-1">
                  <span>🏆</span> Leading Bidder
                </span>
              );
            } else if (isOutbid) {
              statusBadge = (
                <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-1 animate-pulse">
                  <HiOutlineExclamation className="w-3.5 h-3.5" /> Outbid
                </span>
              );
            } else if (isWon) {
              statusBadge = (
                <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                  <span>🎉</span> You Won!
                </span>
              );
            }

            return (
              <div
                key={listing._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={
                      listing.images?.[0]?.url ||
                      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=60'
                    }
                    alt={listing.title}
                    className="w-20 h-20 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {listing.category}
                      </span>
                      {statusBadge}
                    </div>
                    <Link
                      to={`/auction/${listing._id}`}
                      className="block font-bold text-slate-900 hover:text-primary-600 text-base line-clamp-1"
                    >
                      {listing.title}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">
                      You placed {myBidsCount} {myBidsCount === 1 ? 'bid' : 'bids'} • Your highest bid: ₹{myHighestBid}
                    </p>
                    {listing.seller && (
                      <button
                        type="button"
                        onClick={() => setSelectedSeller(listing.seller)}
                        className="mt-1 flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold group cursor-pointer transition-colors"
                        title="View seller profile and student credentials"
                      >
                        <HiOutlineUser className="w-3.5 h-3.5" />
                        <span>Seller: {listing.seller.name || 'Campus Student'}</span>
                        <span className="text-[10px] text-zinc-400 group-hover:text-red-400 underline ml-0.5">
                          (View Profile)
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right price & action */}
                <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 justify-between md:justify-end">
                  <div className="text-left md:text-right">
                    <span className="text-xs text-slate-400 block uppercase font-medium">
                      Current Price
                    </span>
                    <span className="text-xl font-extrabold text-slate-900">
                      ₹{listing.currentPrice ?? listing.startingPrice}
                    </span>
                  </div>

                  {listing.seller && (
                    <button
                      type="button"
                      onClick={() => setSelectedSeller(listing.seller)}
                      className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="View seller profile"
                    >
                      <HiOutlineUser className="w-4 h-4 text-red-400" />
                      Seller Profile
                    </button>
                  )}

                  <Link
                    to={`/auction/${listing._id}`}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors ${
                      isOutbid
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}
                  >
                    {isOutbid ? 'Counter Bid Now' : 'View Auction'}
                    <HiOutlineArrowNarrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm mb-3">
            You haven't bid on any items yet. Explore active auctions!
          </p>
          <Link
            to="/search"
            className="inline-block px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            Browse Auctions
          </Link>
        </div>
      )}

      {/* Reusable Student Profile Modal */}
      <StudentProfileModal
        isOpen={!!selectedSeller}
        onClose={() => setSelectedSeller(null)}
        initialUser={selectedSeller}
        userId={selectedSeller?._id || selectedSeller?.id}
        roleLabel="Seller Profile"
      />
    </div>
  );
}

export default BuyerDashboardPage;
