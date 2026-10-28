import { formatDistanceToNow } from 'date-fns';
import { HiOutlineUser, HiOutlineCheckCircle } from 'react-icons/hi';

function BidHistory({ bids = [], currentWinnerId, currentUserId }) {
  if (!bids || bids.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-sm">
        No bids placed yet. Place the first bid to take the lead!
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="space-y-2">
        {bids.map((bid, index) => {
          const isHighest = index === 0;
          const isMyBid =
            currentUserId &&
            (bid.bidder?._id === currentUserId ||
              bid.bidder?.id === currentUserId);

          return (
            <div
              key={bid._id || index}
              className={`flex items-center justify-between p-3 rounded-xl border text-sm transition-all ${
                isHighest
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    isHighest
                      ? 'bg-amber-400 text-amber-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isHighest ? '👑' : '#' + (bids.length - index)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {bid.bidder?.name || 'Student'}
                    </span>
                    {isMyBid && (
                      <span className="text-[10px] font-bold uppercase bg-primary-100 text-primary-700 px-1.5 py-0.2 rounded">
                        You
                      </span>
                    )}
                    {bid.isAutoBid && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-medium">
                        Auto-Bid
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {bid.createdAt
                      ? formatDistanceToNow(new Date(bid.createdAt), {
                          addSuffix: true,
                        })
                      : 'recently'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-base font-bold text-slate-900">
                  ₹{bid.amount}
                </span>
                {isHighest && (
                  <span className="block text-[11px] font-semibold text-amber-700">
                    Current Highest
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BidHistory;
