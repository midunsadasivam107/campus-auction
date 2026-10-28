import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineAcademicCap,
  HiOutlineIdentification,
  HiOutlineBadgeCheck,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineX,
  HiOutlineClipboardCopy,
  HiOutlineCheck,
  HiOutlineArrowNarrowRight,
} from 'react-icons/hi';

function StudentProfileModal({
  isOpen,
  onClose,
  userId,
  initialUser = null,
  roleLabel = 'Student Profile',
}) {
  const [profile, setProfile] = useState(initialUser);
  const [stats, setStats] = useState(null);
  const [activeListings, setActiveListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Fetch full profile info when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const targetId = userId || initialUser?._id || initialUser?.id;
    if (!targetId) {
      if (initialUser) setProfile(initialUser);
      return;
    }

    let isMounted = true;
    setLoading(true);

    api
      .get(`/auth/profile/${targetId}`)
      .then((res) => {
        if (!isMounted) return;
        setProfile(res.data.user);
        setStats(res.data.stats);
        setActiveListings(res.data.activeListings || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        // Fallback to initialUser if available
        if (initialUser) {
          setProfile(initialUser);
        } else {
          toast.error(err.response?.data?.error || 'Failed to load student profile');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, initialUser]);

  if (!isOpen) return null;

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    toast.success('Email copied to clipboard!');
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : null;

  const displayName = profile?.name || 'Campus Student';
  const displayEmail = profile?.email || '';
  const displayStudentId = profile?.studentId;
  const displayGradYear = profile?.graduationYear;
  const displayBio = profile?.bio;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-r from-red-950 via-zinc-900 to-black p-6 border-b border-zinc-850">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close profile"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
              <HiOutlineBadgeCheck className="w-3.5 h-3.5 text-red-400" />
              Verified Student
            </span>
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
              {roleLabel}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg border border-red-500/40 shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white truncate">
                {displayName}
              </h2>
              <p className="text-sm text-zinc-400 flex items-center gap-1.5 mt-0.5 truncate">
                <HiOutlineMail className="w-4 h-4 text-red-400 shrink-0" />
                <span className="truncate">{displayEmail}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-zinc-200">
          {loading && !profile ? (
            <div className="py-12 text-center text-zinc-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent mb-2"></div>
              <p className="text-sm">Loading verified student profile...</p>
            </div>
          ) : (
            <>
              {/* Quick Actions (Email & Copy) */}
              <div className="flex flex-wrap gap-2.5">
                {displayEmail && (
                  <>
                    <a
                      href={`mailto:${displayEmail}`}
                      className="flex-1 min-w-[140px] px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                      <HiOutlineMail className="w-4 h-4" />
                      Email Student
                    </a>
                    <button
                      onClick={() => handleCopyEmail(displayEmail)}
                      className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copiedEmail ? (
                        <>
                          <HiOutlineCheck className="w-4 h-4 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <HiOutlineClipboardCopy className="w-4 h-4 text-zinc-400" />
                          <span>Copy Email</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Student Credentials & Verification */}
              <div className="bg-zinc-900/70 border border-zinc-850 rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                  <HiOutlineIdentification className="w-4 h-4 text-red-400" />
                  Campus Identity & Verification
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-850">
                    <span className="text-[11px] text-zinc-400 block font-medium">
                      Student ID
                    </span>
                    <span className="font-semibold text-white font-mono">
                      {displayStudentId || 'Not provided'}
                    </span>
                  </div>

                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-850">
                    <span className="text-[11px] text-zinc-400 block font-medium">
                      Graduation Year
                    </span>
                    <span className="font-semibold text-white">
                      {displayGradYear ? `Class of ${displayGradYear}` : 'Enrolled'}
                    </span>
                  </div>

                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-850">
                    <span className="text-[11px] text-zinc-400 block font-medium">
                      Member Since
                    </span>
                    <span className="font-semibold text-white">
                      {memberSince || 'Active Member'}
                    </span>
                  </div>

                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-850">
                    <span className="text-[11px] text-zinc-400 block font-medium">
                      Campus Trust
                    </span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <HiOutlineCheck className="w-3.5 h-3.5" /> Verified Student
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="bg-zinc-900/70 border border-zinc-850 rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                  <HiOutlineUser className="w-4 h-4 text-red-400" />
                  About
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed italic">
                  {displayBio
                    ? `"${displayBio}"`
                    : 'Campus auction peer student member.'}
                </p>
              </div>

              {/* Selling Activity Stats (if available) */}
              {stats && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-900/70 border border-zinc-850 p-3.5 rounded-2xl text-center">
                    <span className="text-xl font-bold text-white block">
                      {stats.totalListings}
                    </span>
                    <span className="text-[11px] text-zinc-400 uppercase tracking-wider">
                      Total Listings
                    </span>
                  </div>
                  <div className="bg-zinc-900/70 border border-zinc-850 p-3.5 rounded-2xl text-center">
                    <span className="text-xl font-bold text-red-400 block">
                      {stats.activeListingsCount}
                    </span>
                    <span className="text-[11px] text-zinc-400 uppercase tracking-wider">
                      Active Now
                    </span>
                  </div>
                  <div className="bg-zinc-900/70 border border-zinc-850 p-3.5 rounded-2xl text-center">
                    <span className="text-xl font-bold text-emerald-400 block">
                      {stats.soldListings}
                    </span>
                    <span className="text-[11px] text-zinc-400 uppercase tracking-wider">
                      Completed Deals
                    </span>
                  </div>
                </div>
              )}

              {/* Active Listings from this student */}
              {activeListings && activeListings.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <HiOutlineTag className="w-4 h-4 text-red-400" />
                      Other Active Auctions by {displayName.split(' ')[0]}
                    </p>
                    <span className="text-xs text-red-400 font-semibold">
                      {activeListings.length} active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeListings.map((item) => (
                      <Link
                        key={item._id}
                        to={`/auction/${item._id}`}
                        onClick={onClose}
                        className="group bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 hover:border-red-500/40 rounded-xl p-3 transition-all flex items-center gap-3"
                      >
                        <img
                          src={
                            item.images?.[0]?.url ||
                            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=60'
                          }
                          alt={item.title}
                          className="w-12 h-12 rounded-lg object-cover bg-zinc-800 border border-zinc-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white group-hover:text-red-400 truncate">
                            {item.title}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[11px]">
                            <span className="font-extrabold text-red-400">
                              ₹{item.currentPrice ?? item.startingPrice}
                            </span>
                            <span className="text-zinc-500">
                              {item.bidCount} {item.bidCount === 1 ? 'bid' : 'bids'}
                            </span>
                          </div>
                        </div>
                        <HiOutlineArrowNarrowRight className="w-4 h-4 text-zinc-600 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentProfileModal;
