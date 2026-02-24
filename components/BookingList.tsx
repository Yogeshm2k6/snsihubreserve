import React, { useState } from 'react';
import { BookingFormData, User, ApprovalStatus } from '../types';
import { Clock, Calendar, MapPin, CheckCircle, XCircle, Hourglass, Trash2, AlertTriangle, Check, X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

  const downloadReceipt = async (booking: BookingFormData) => {
    const elementId = `receipt-${booking.id}`;
    const element = document.getElementById(elementId);

    if (!element) return;

    try {
      // Temporarily show the hidden receipt div
      element.style.display = 'block';
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.top = '-9999px';

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Booking_Receipt_${booking.hallName}_${booking.requiredDate}.pdf`);

      // Hide it back
      element.style.display = 'none';
      element.style.position = '';
      element.style.left = '';
      element.style.top = '';

    } catch (error) {
      console.error("Error generating PDF", error);
    }
  };

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
          <h2 className="text-2xl font-bold text-white drop-shadow-md">{user.role === 'staff' ? 'My Bookings' : 'Dashboard'}</h2>
          <p className="text-sm text-white/80 mt-1">Logged in as <span className="font-semibold text-yellow-300">{user.name}</span> ({user.role})</p>
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
            : 'text-white/90 border-transparent hover:text-accent-300 hover:bg-white/10'
            }`}
        >
          {user.role === 'staff' ? 'Pending Requests' : 'Pending Approvals'} ({pendingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 text-sm font-bold transition-all duration-200 border-b-3 -mb-px rounded-t-lg ${activeTab === 'history'
            ? 'text-accent-700 border-accent-600 bg-accent-50'
            : 'text-white/90 border-transparent hover:text-accent-300 hover:bg-white/10'
            }`}
        >
          {user.role === 'staff' ? 'History' : 'Approval History'} ({historyBookings.length})
        </button>
        {user.role !== 'staff' && (
          <button
            onClick={() => setActiveTab('myBookings')}
            className={`px-5 py-3 text-sm font-bold transition-all duration-200 border-b-3 -mb-px rounded-t-lg ${activeTab === 'myBookings'
              ? 'text-accent-700 border-accent-600 bg-accent-50'
              : 'text-white/90 border-transparent hover:text-accent-300 hover:bg-white/10'
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

                {/* Download Receipt Button (Visible only if Approved) */}
                {booking.status === 'Approved' && (
                  <button
                    onClick={() => downloadReceipt(booking)}
                    className="mt-4 md:mt-0 w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow-lg shadow-gray-900/20 transition-all"
                  >
                    <Download className="w-4 h-4" /> Download Receipt
                  </button>
                )}
              </div>

              {/* Hidden Receipt Template for PDF Generation */}
              <div id={`receipt-${booking.id}`} style={{ display: 'none', width: '850px', padding: '0', backgroundColor: 'white', color: '#111827', fontFamily: "'Plus Jakarta Sans', sans-serif", border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden' }}>

                {/* Header Panel */}
                <div style={{ backgroundColor: '#111827', padding: '40px 50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '8px solid #facc15' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                      <img src="/logo.png" alt="SNS Logo" style={{ height: '55px', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <h1 style={{ margin: 0, fontSize: '32px', color: '#ffffff', fontWeight: '800', letterSpacing: '-0.5px' }}>SNS iHub Reserve</h1>
                      <p style={{ margin: '5px 0 0 0', color: '#9ca3af', fontSize: '15px' }}>Official Approved Booking Receipt</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: '#facc15', color: '#854d0e', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                      APPROVED
                    </div>
                    <p style={{ margin: '15px 0 0 0', fontSize: '13px', color: '#6b7280' }}>Receipt ID: <span style={{ color: '#d1d5db', fontFamily: 'monospace', fontSize: '14px' }}>{booking.id?.substring(0, 8).toUpperCase()}</span></p>
                  </div>
                </div>

                {/* Body Panel */}
                <div style={{ padding: '50px', backgroundColor: '#f8fafc' }}>

                  <div style={{ display: 'flex', gap: '40px', marginBottom: '40px' }}>
                    {/* Left Column - Event Details */}
                    <div style={{ flex: 1, backgroundColor: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
                        <span style={{ width: '6px', height: '24px', backgroundColor: '#facc15', marginRight: '12px', borderRadius: '3px' }}></span>
                        <h2 style={{ fontSize: '22px', color: '#0f172a', margin: 0, fontWeight: '800' }}>Event Details</h2>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                        <tbody>
                          <tr><td style={{ padding: '12px 0', color: '#64748b', width: '40%', borderBottom: '1px solid #f1f5f9' }}>Venue Room</td><td style={{ padding: '12px 0', fontWeight: '800', color: '#0f172a', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontSize: '16px' }}>{booking.hallName}</td></tr>
                          <tr><td style={{ padding: '12px 0', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Meeting Type</td><td style={{ padding: '12px 0', fontWeight: '600', color: '#334155', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{booking.meetingType}</td></tr>
                          <tr><td style={{ padding: '12px 0', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Scheduled Date</td><td style={{ padding: '12px 0', fontWeight: '700', color: '#0f172a', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{new Date(booking.requiredDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                          <tr><td style={{ padding: '12px 0', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Time Schedule</td><td style={{ padding: '12px 0', fontWeight: '700', color: '#0f172a', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{booking.startTime} ({booking.duration})</td></tr>
                          <tr><td style={{ padding: '12px 0', color: '#64748b' }}>Est. Participants</td><td style={{ padding: '12px 0', fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>{booking.participants} People</td></tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Right Column - Organizer Info & Facilities */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ backgroundColor: 'white', padding: '25px 30px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                          <span style={{ width: '4px', height: '20px', backgroundColor: '#facc15', marginRight: '10px', borderRadius: '2px' }}></span>
                          <h2 style={{ fontSize: '18px', color: '#0f172a', margin: 0, fontWeight: '700' }}>Organizer Info</h2>
                        </div>
                        <div style={{ fontSize: '14px', lineHeight: '1.7' }}>
                          <p style={{ margin: '0 0 10px 0', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Booked By:</span> <strong style={{ color: '#0f172a' }}>{booking.bookedBy}</strong></p>
                          <p style={{ margin: '0 0 10px 0', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Department:</span> <strong style={{ color: '#334155' }}>{booking.department}</strong></p>
                          <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Coordinator:</span> <strong style={{ color: '#334155' }}>{booking.coordinatorName}</strong></p>
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#0f172a', padding: '25px 30px', borderRadius: '16px', color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                        <h2 style={{ fontSize: '15px', color: '#facc15', margin: '0 0 15px 0', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Facilities Requested</h2>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '13px', flexWrap: 'wrap', fontWeight: '600' }}>
                          {booking.audioSystem && <span style={{ padding: '6px 12px', backgroundColor: '#1e293b', borderRadius: '6px', border: '1px solid #334155' }}>Audio System</span>}
                          {booking.projector && <span style={{ padding: '6px 12px', backgroundColor: '#1e293b', borderRadius: '6px', border: '1px solid #334155' }}>Projector</span>}
                          <span style={{ padding: '6px 12px', backgroundColor: '#1e293b', borderRadius: '6px', border: '1px solid #334155' }}>AC: {booking.airConditioning}</span>
                        </div>
                        {booking.otherRequirements && (
                          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #334155', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
                            <strong style={{ color: 'white' }}>Notes:</strong> {booking.otherRequirements}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Signatures Panel */}
                  <div style={{ backgroundColor: 'white', padding: '30px 40px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <h2 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 25px 0', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>Official Verifications</h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ color: '#f59e0b', fontSize: '28px', fontWeight: 'bold', fontFamily: 'cursive', marginBottom: '8px', opacity: 0.9, transform: 'rotate(-5deg)' }}>Verified</div>
                        <div style={{ borderTop: '2px dashed #cbd5e1', margin: '0 20px', paddingTop: '12px' }}>
                          <p style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#0f172a' }}>{booking.stage1_approved_by || 'Admin'}</p>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '600' }}>Admin I/C</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold', fontFamily: 'cursive', marginBottom: '8px', opacity: 0.9, transform: 'rotate(-2deg)' }}>Approved</div>
                        <div style={{ borderTop: '2px dashed #cbd5e1', margin: '0 20px', paddingTop: '12px' }}>
                          <p style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#0f172a' }}>{booking.stage2_approved_by || 'Coord'}</p>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '600' }}>Coordinator</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ color: '#0ea5e9', fontSize: '28px', fontWeight: 'bold', fontFamily: 'cursive', marginBottom: '8px', opacity: 0.9, transform: 'rotate(-4deg)' }}>Signed</div>
                        <div style={{ borderTop: '2px dashed #cbd5e1', margin: '0 20px', paddingTop: '12px' }}>
                          <p style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#0f172a' }}>{booking.stage3_approved_by || 'HO'}</p>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '600' }}>Head of Ops</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
                    <p style={{ margin: '0 0 4px 0' }}>This is a computer-generated confirmation receipt and is valid for entry.</p>
                    <p style={{ margin: 0 }}>Generated automatically on {new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};