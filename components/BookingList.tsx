import React, { useState } from 'react';
import { BookingFormData, User, ApprovalStatus } from '../types';
import { Clock, Calendar, MapPin, CheckCircle, XCircle, Hourglass, Trash2, AlertTriangle, Check, X } from 'lucide-react';

interface BookingListProps {
  bookings: BookingFormData[];
  user: User;
  onNewBooking: () => void;
  onCancelBooking: (id: string) => void;
  onUpdateStatus?: (id: string, stage: 1 | 2 | 3, status: ApprovalStatus) => void;
}

export const BookingList: React.FC<BookingListProps> = ({
  bookings,
  user,
  onNewBooking,
  onCancelBooking,
  onUpdateStatus
}) => {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'myBookings'>('pending');

  const pendingBookings = bookings.filter(b => {
    // Show user's own pending bookings only if staff. For admins, those go to myBookings tab.
    if (user.role === 'staff' && b.userId === user.uid && b.status === 'Pending') return true;

    // Admin Approval Views
    if (user.role === 'admin_ic') return b.stage1_status === 'Pending' && b.status !== 'Rejected';
    if (user.role === 'coordinator') return b.stage2_status === 'Pending' && b.status !== 'Rejected';
    if (user.role === 'head_ops') return b.stage3_status === 'Pending' && b.status !== 'Rejected';

    return false;
  });

  const historyBookings = bookings.filter(b => {
    // Show user's own completed/rejected bookings
    if (user.role === 'staff' && b.userId === user.uid && b.status !== 'Pending') return true;

    // Admin history (acted upon or globally rejected)
    if (user.role === 'admin_ic') return b.stage1_status !== 'Pending' || b.status === 'Rejected';
    if (user.role === 'coordinator') return b.stage2_status !== 'Pending' || b.status === 'Rejected';
    if (user.role === 'head_ops') return b.stage3_status !== 'Pending' || b.status === 'Rejected';

    return false;
  });

  const myBookings = bookings.filter(b => b.userId === user.uid);

  const displayBookings = activeTab === 'pending' ? pendingBookings : activeTab === 'history' ? historyBookings : myBookings;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'text-brand-800 bg-brand-100 border-brand-200';
      case 'Rejected': return 'text-gray-500 bg-gray-100 border-gray-200 line-through';
      default: return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="w-4 h-4 mr-1.5" />;
      case 'Rejected': return <XCircle className="w-4 h-4 mr-1.5" />;
      default: return <Hourglass className="w-4 h-4 mr-1.5" />;
    }
  };

  const currentStage = user.role === 'admin_ic' ? 1 : user.role === 'coordinator' ? 2 : user.role === 'head_ops' ? 3 : 0;

  return (
    <div className="space-y-6">
      {/* Confirmation Modal */}
      {confirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setConfirmId(null)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cancel Reservation</h3>
              </div>
            </div>

            <p className="text-gray-500 text-sm mb-6 ml-13">
              Are you sure you want to cancel this booking? This action cannot be undone and will remove the request permanently.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                Keep
              </button>
              <button
                onClick={() => {
                  if (confirmId) onCancelBooking(confirmId);
                  setConfirmId(null);
                }}
                className="px-4 py-2 text-white bg-gray-800 hover:bg-gray-900 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Yes, Cancel it
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{user.role === 'staff' ? 'My Bookings' : 'Dashboard'}</h2>
          <p className="text-sm text-gray-500 mt-1">Logged in as <span className="font-semibold text-brand-600">{user.name}</span> ({user.role})</p>
        </div>
        <button
          onClick={onNewBooking}
          className="btn-glow text-sm bg-accent-500 hover:bg-accent-600 text-gray-900 px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-accent-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
        >
          + New Booking
        </button>
      </div>

      <div className="flex space-x-1 border-b-2 border-brand-200 mb-6 pb-0 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-3 text-sm font-bold transition-all duration-200 border-b-3 -mb-px rounded-t-lg ${activeTab === 'pending'
            ? 'text-accent-700 border-accent-600 bg-accent-50'
            : 'text-gray-500 border-transparent hover:text-accent-600 hover:bg-brand-50'
            }`}
        >
          {user.role === 'staff' ? 'Pending Requests' : 'Pending Approvals'} ({pendingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 text-sm font-bold transition-all duration-200 border-b-3 -mb-px rounded-t-lg ${activeTab === 'history'
            ? 'text-accent-700 border-accent-600 bg-accent-50'
            : 'text-gray-500 border-transparent hover:text-accent-600 hover:bg-brand-50'
            }`}
        >
          {user.role === 'staff' ? 'History' : 'Approval History'} ({historyBookings.length})
        </button>
        {user.role !== 'staff' && (
          <button
            onClick={() => setActiveTab('myBookings')}
            className={`px-5 py-3 text-sm font-bold transition-all duration-200 border-b-3 -mb-px rounded-t-lg ${activeTab === 'myBookings'
              ? 'text-accent-700 border-accent-600 bg-accent-50'
              : 'text-gray-500 border-transparent hover:text-accent-600 hover:bg-brand-50'
              }`}
          >
            My Bookings ({myBookings.length})
          </button>
        )}
      </div>

      <div className="grid gap-6">
        {displayBookings.length === 0 ? (
          <div className="card-glass rounded-xl p-8 text-center shadow-sm">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Calendar className="w-10 h-10 text-brand-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">You're all caught up! There are no requests matching this filter at the moment.</p>
          </div>
        ) : (
          displayBookings.map((booking) => (
            <div key={booking.id} className="card-glass group rounded-xl p-5 shadow-md hover:shadow-xl hover:shadow-accent-500/5 transition-all duration-300 relative overflow-hidden">

              {/* Show trash icon for staff OR if the admin is the creator of the exact booking */}
              {(user.role === 'staff' || booking.userId === user.uid) && booking.status === 'Pending' && (
                <div className="absolute top-6 right-6 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <button
                    onClick={() => setConfirmId(booking.id || null)}
                    className="p-2.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-brand-200"
                    title="Cancel Booking"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4 pr-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{booking.meetingType}</h3>
                  <p className="text-sm text-gray-500">{booking.department} • Coordinator: {booking.coordinatorName}</p>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                  {getStatusIcon(booking.status)}
                  {booking.status}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {booking.hallName}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(booking.requiredDate).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  {booking.startTime} ({booking.duration})
                </div>
                <div className="flex items-center text-gray-500">
                  <span className="font-medium text-gray-900 mr-1">Booked By:</span>
                  {booking.bookedBy}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {booking.audioSystem && <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs text-gray-600">Audio System</span>}
                {booking.projector && <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs text-gray-600">Projector</span>}
                <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs text-gray-600">AC: {booking.airConditioning}</span>
                <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs text-gray-600">Capacity: {booking.participants}</span>
              </div>

              <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="grid grid-cols-3 gap-2 w-full md:flex md:flex-wrap md:gap-6 text-xs text-gray-400 md:w-auto text-center md:text-left">
                  <div className="flex flex-col gap-1 items-center md:items-start bg-gray-50 md:bg-transparent p-2 md:p-0 rounded-lg">
                    <span className="uppercase tracking-wider font-semibold text-[10px] md:text-xs">Admin I/C</span>
                    <span className={booking.stage1_status === 'Approved' ? 'text-gray-900 font-bold' : booking.stage1_status === 'Rejected' ? 'text-gray-400 line-through font-medium' : 'text-gray-500'}>
                      {booking.stage1_status === 'Approved' ? 'Verified' : booking.stage1_status === 'Rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 items-center md:items-start bg-gray-50 md:bg-transparent p-2 md:p-0 rounded-lg">
                    <span className="uppercase tracking-wider font-semibold text-[10px] md:text-xs">Coordinator</span>
                    <span className={booking.stage2_status === 'Approved' ? 'text-gray-900 font-bold' : booking.stage2_status === 'Rejected' ? 'text-gray-400 line-through font-medium' : 'text-gray-500'}>
                      {booking.stage2_status === 'Approved' ? 'Approved' : booking.stage2_status === 'Rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 items-center md:items-start bg-gray-50 md:bg-transparent p-2 md:p-0 rounded-lg">
                    <span className="uppercase tracking-wider font-semibold text-[10px] md:text-xs">Head of Ops</span>
                    <span className={booking.stage3_status === 'Approved' ? 'text-gray-900 font-bold' : booking.stage3_status === 'Rejected' ? 'text-gray-400 line-through font-medium' : 'text-gray-500'}>
                      {booking.stage3_status === 'Approved' ? 'Signed' : booking.stage3_status === 'Rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Admin Actions (Cannot approve their own requests directly unless they are the intended stage approver... but let's allow standard flow) */}
                {user.role !== 'staff' && activeTab === 'pending' && onUpdateStatus && booking.id && booking.userId !== user.uid && (
                  <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <button
                      onClick={() => onUpdateStatus(booking.id!, currentStage as 1 | 2 | 3, 'Rejected')}
                      className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 border border-brand-200 text-brand-700 bg-white hover:bg-brand-50 rounded-lg text-sm font-bold transition-colors"
                    >
                      <X className="w-4 h-4 mr-1.5" /> Reject
                    </button>
                    <button
                      onClick={() => onUpdateStatus(booking.id!, currentStage as 1 | 2 | 3, 'Approved')}
                      className="btn-glow flex-1 md:flex-none flex items-center justify-center px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-gray-900 rounded-xl text-sm font-bold shadow-lg shadow-accent-500/25 transition-all"
                    >
                      <Check className="w-4 h-4 mr-1.5" /> Approve
                    </button>
                  </div>
                )}

                {/* Mobile Cancel Button */}
                {(user.role === 'staff' || booking.userId === user.uid) && booking.status === 'Pending' && (
                  <button
                    onClick={() => setConfirmId(booking.id || null)}
                    className="md:hidden w-full flex justify-center items-center text-brand-700 text-sm font-bold px-4 py-2 border border-brand-200 bg-brand-50 rounded-lg active:bg-brand-100 mt-2"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Cancel Request
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};