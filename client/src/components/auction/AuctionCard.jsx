import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
import { HiOutlineTag } from 'react-icons/hi';

function AuctionCard({ listing }) {
  const coverImage =
    listing.images && listing.images.length > 0
      ? listing.images[0].url
      : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=60';

  const formatCondition = (cond) => {
    switch (cond) {
      case 'like_new':
        return 'Like New';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'worn':
        return 'Worn';
      default:
        return cond;
    }
  };

  const isClosed =
    listing.status === 'closed' ||
    listing.status === 'sold' ||
    listing.status === 'completed' ||
    listing.status === 'unsold' ||
    listing.status === 'rejected' ||
    listing.status === 'cancelled' ||
    new Date(listing.closingTime) <= new Date();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group">
      {/* Photo */}
      <Link
        to={`/auction/${listing._id || listing.id}`}
        className="relative block aspect-4/3 overflow-hidden bg-slate-100"
      >
        <img
          src={coverImage}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badges on image */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <span className="text-[11px] font-semibold bg-white/95 text-slate-800 px-2 py-0.5 rounded-md shadow-xs capitalize">
            {listing.category}
          </span>
          <span className="text-[11px] font-medium bg-slate-900/80 text-white px-2 py-0.5 rounded-md shadow-xs">
            {formatCondition(listing.condition)}
          </span>
        </div>

        {/* Live status badge */}
        <div className="absolute bottom-2.5 right-2.5">
          {isClosed ? (
            <span className="text-xs font-semibold bg-slate-800 text-white px-2.5 py-0.5 rounded-md shadow-xs">
              Closed
            </span>
          ) : (
            <CountdownTimer targetDate={listing.closingTime} />
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link
            to={`/auction/${listing._id || listing.id}`}
            className="block text-slate-900 font-semibold hover:text-primary-600 transition-colors line-clamp-1 text-base"
            title={listing.title}
          >
            {listing.title}
          </Link>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {listing.description}
          </p>
        </div>

        {/* Price & Bids */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-medium tracking-wider">
              {listing.bidCount > 0 ? 'Current Bid' : 'Starting Price'}
            </p>
            <p className="text-lg font-bold text-slate-900">
              ₹{listing.currentPrice ?? listing.startingPrice}
            </p>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
              <HiOutlineTag className="w-3.5 h-3.5" />
              {listing.bidCount || 0} {listing.bidCount === 1 ? 'bid' : 'bids'}
            </span>
            <Link
              to={`/auction/${listing._id || listing.id}`}
              className="block mt-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              View Auction →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuctionCard;
