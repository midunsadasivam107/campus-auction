import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import {
  HiOutlineBell,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineQuestionMarkCircle,
  HiOutlineDesktopComputer,
} from 'react-icons/hi';

function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    browserPermission,
    requestBrowserPermission,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'outbid':
        return <span className="text-red-500 font-bold">⚡</span>;
      case 'auction_won':
      case 'seller_approved':
        return <span className="text-amber-500 font-bold">🏆</span>;
      case 'new_question':
      case 'question_answered':
        return <HiOutlineQuestionMarkCircle className="w-5 h-5 text-blue-500" />;
      case 'saved_search_match':
        return <span className="text-purple-500 font-bold">🎯</span>;
      default:
        return <HiOutlineBell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time auction alerts, outbid notices, and buyer questions
          </p>
        </div>

        <div className="flex items-center gap-2">
          {browserPermission !== 'granted' && (
            <button
              onClick={requestBrowserPermission}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <HiOutlineDesktopComputer className="w-4 h-4 text-primary-600" />
              Enable Browser Alerts
            </button>
          )}

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3.5 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <HiOutlineCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="mt-6 space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markAsRead(n._id)}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                !n.isRead
                  ? 'bg-blue-50/40 border-blue-200 shadow-2xs'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-lg shrink-0 shadow-2xs mt-0.5">
                {getNotificationIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-slate-900 truncate">
                    {n.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {n.createdAt
                      ? formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })
                      : 'recently'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {n.message}
                </p>

                {n.listing && (
                  <div className="mt-2">
                    <Link
                      to={`/auction/${n.listing._id || n.listing}`}
                      className="inline-block text-xs font-semibold text-primary-600 hover:text-primary-700 underline"
                    >
                      View Auction Listing →
                    </Link>
                  </div>
                )}
              </div>

              {!n.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-primary-600 shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center text-xl mx-auto mb-3">
            🔔
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No notifications yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You will receive instant alerts here when you place bids, when an auction closes, or when a buyer asks a question.
          </p>
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
