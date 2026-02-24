import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HallCard } from './components/HallCard';
import { BookingForm } from './components/BookingForm';
import { BookingList } from './components/BookingList';
import { Login } from './components/Login';
import { HALLS } from './constants';
import { Hall, BookingFormData, ViewState, User, ApprovalStatus } from './types';
import { Search, Filter, CheckCircle2 } from 'lucide-react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, orderBy, where, getDocs, getDoc } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { Toaster, toast } from 'react-hot-toast';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
  const [bookings, setBookings] = useState<BookingFormData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [floorFilter, setFloorFilter] = useState('All');

  // Fetch Halls dynamically
  useEffect(() => {
    try {
      const q = query(collection(db, 'halls'));
      const unsubscribe = onSnapshot(q,
        (snapshot) => {
          if (snapshot.empty) {
            // Fallback to initial seed if DB is empty
            setHalls(HALLS);
          } else {
            const allHalls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hall));
            setHalls(allHalls);
          }
        },
        (error) => {
          console.error("Error fetching halls onSnapshot:", error);
          // If it fails (e.g., due to permissions before login), fallback to constants
          setHalls(HALLS);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error("Error fetching halls:", err);
      setHalls(HALLS); // Fallback
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setBookings([]);
      return;
    }

    try {
      const q = query(collection(db, 'bookings'), orderBy('submittedAt', 'desc'));
      const unsubscribe = onSnapshot(q,
        (snapshot) => {
          const allBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookingFormData));
          setBookings(allBookings);
        },
        (error) => {
          console.error("Firestore onSnapshot error:", error);
          if (error.code === 'permission-denied') {
            toast.error("Firebase Permission Denied! Please check your Firestore Rules.", { duration: 5000 });
          } else if (error.code === 'failed-precondition') {
            toast.error("Firestore Index missing. Check the console for the index creation link.", { duration: 8000 });
          }
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up bookings listener:", err);
    }
  }, [user?.uid]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    // Auto-navigate to dash if admin
    if (userData.role !== 'staff') {
      setCurrentView('MY_BOOKINGS');
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    setCurrentView('HOME');
  };

  const handleBookClick = (hall: Hall) => {
    setSelectedHall(hall);
    setCurrentView('BOOKING_FORM');
  };

  const sendEmailNotification = async (to: string, subject: string, body: string, bookingId?: string, stageToApprove?: number) => {
    try {
      let htmlContent = `<p>${body.replace(/\n/g, '<br>')}</p>`;

      if (bookingId && stageToApprove) {
        const approveUrl = `${window.location.origin}/?action=approve&id=${bookingId}&stage=${stageToApprove}`;
        const rejectUrl = `${window.location.origin}/?action=reject&id=${bookingId}&stage=${stageToApprove}`;

        htmlContent += `
          <br><br>
          <div style="display: flex; gap: 15px; margin-top: 10px;">
            <a href="${approveUrl}" style="padding: 10px 20px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-family: sans-serif; display: inline-block;">Approve Request</a>
            <a href="${rejectUrl}" style="padding: 10px 20px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-family: sans-serif; display: inline-block;">Reject Request</a>
          </div>
          <br>
          <p style="font-size: 12px; color: #666;">If you are not logged in, you will be prompted to log in before the action executes.</p>
        `;
      }

      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const response = await fetch(`${apiUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html: htmlContent })
      });

      if (!response.ok) {
        throw new Error('SMTP proxy server failed to send email');
      }
    } catch (error) {
      console.error("Email notification failed to queue via SMTP:", error);
    }
  };

  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'bookings'), {
        ...data,
        userId: user.uid,
        status: 'Pending',
        stage1_status: 'Pending',
        stage2_status: 'Pending',
        stage3_status: 'Pending',
      });

      const emailBody = `A new booking request is awaiting your approval.\nStaff Name: ${data.bookedBy}\nRoom: ${data.hallName}\nDate: ${data.requiredDate}\nDepartment: ${data.department}\nClick the button below to Approve or Reject immediately.`;

      // Fetch admin emails dynamically based on roles
      const getAdminEmails = async (role: string) => {
        const roleQuery = query(collection(db, 'users'), where('role', '==', role));
        const roleSnapshot = await getDocs(roleQuery);
        return roleSnapshot.docs.map(doc => doc.data().email as string);
      };

      const [adminIcEmails, coordinatorEmails, headOpsEmails] = await Promise.all([
        getAdminEmails('admin_ic'),
        getAdminEmails('coordinator'),
        getAdminEmails('head_ops')
      ]);

      // Notify All Admins Simultaneously (with fallbacks if no user has the role yet)
      const notifyAdmins = (emails: string[], fallbackEmail: string, title: string, docId: string, stage: number) => {
        if (emails.length > 0) {
          emails.forEach(email => sendEmailNotification(email, title, emailBody, docId, stage));
        } else {
          sendEmailNotification(fallbackEmail, title, emailBody, docId, stage);
        }
      };

      notifyAdmins(adminIcEmails, 'admin_ic@snsgroups.com', 'IHUB Booking Approval Required (Admin I/C)', docRef.id, 1);
      notifyAdmins(coordinatorEmails, 'coordinator@snsgroups.com', 'IHUB Booking Approval Required (Coordinator)', docRef.id, 2);
      notifyAdmins(headOpsEmails, 'head@snsgroups.com', 'IHUB Booking Approval Required (Head of Ops)', docRef.id, 3);


      setCurrentView('SUCCESS');
      toast.success('Booking request submitted successfully!');
    } catch (error) {
      console.error("Error adding booking:", error);
      toast.error("Failed to submit booking. Please try again.");
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await deleteDoc(doc(db, 'bookings', bookingId));
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, stage: 1 | 2 | 3, status: ApprovalStatus) => {
    if (!user) return;

    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      const updates: any = {};

      const stageKey = `stage${stage}_status`;
      const byKey = `stage${stage}_approved_by`;

      updates[stageKey] = status;
      updates[byKey] = user.name;

      let staffEmail = 'staff@snsgroups.com';
      try {
        const bookingData = bookings.find(b => b.id === bookingId);
        if (bookingData && bookingData.userId) {
          const userSnap = await getDoc(doc(db, 'users', bookingData.userId));
          if (userSnap.exists() && userSnap.data().email) {
            staffEmail = userSnap.data().email;
          }
        }
      } catch (err) {
        console.error('Failed to fetch staff email:', err);
      }

      if (status === 'Rejected') {
        updates.status = 'Rejected';
        // Notify Staff of rejection
        sendEmailNotification(staffEmail, 'Booking Request Rejected', `Your booking request for ${bookingId} has been rejected at Stage ${stage}.`);
      } else if (status === 'Approved') {
        if (stage === 3) {
          // If Head of Ops (Stage 3) approves, check if we want to mark the whole thing as approved.
          // Note for user: In a concurrent system, you might want to wait for ALL stages before marking final status,
          // but aligning with previous logic, Stage 3 is the ultimate decider.
          updates.status = 'Approved';
          sendEmailNotification(staffEmail, 'Booking Request Confirmed ✅', `Your booking request has been fully approved and confirmed!`);
        }
      }

      await updateDoc(bookingRef, updates);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredHalls = halls.filter(hall => {
    const matchesSearch = hall.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFloor = floorFilter === 'All' || hall.floor.includes(floorFilter);
    return matchesSearch && matchesFloor;
  });

  // Handle Email Approval Magic Links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const id = params.get('id');
    const stageStr = params.get('stage');

    if (action && id && stageStr && user) {
      const stage = parseInt(stageStr, 10);
      if ([1, 2, 3].includes(stage) && (action === 'approve' || action === 'reject')) {
        const requiredRole = stage === 1 ? 'admin_ic' : stage === 2 ? 'coordinator' : 'head_ops';

        // Prevent unauthorized processing and loop blocking
        if (user.role !== requiredRole) {
          toast.error(`Access Denied: You must be logged in as an ${requiredRole} to process Stage ${stage} approvals.`, { duration: 5000 });
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }

        const status: ApprovalStatus = action === 'approve' ? 'Approved' : 'Rejected';

        handleUpdateBookingStatus(id, stage as 1 | 2 | 3, status).then(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          setCurrentView('MY_BOOKINGS');
          toast.success(`Request magically ${status.toLowerCase()} via email link! ✨`, { duration: 6000 });
        });
      }
    }
  }, [user]); // Re-run when user changes (like after login)

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'HOME':
        return (
          <div className="space-y-8">
            <div className="card-glass rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-accent-800">Available Spaces</h1>
                  <p className="text-gray-500">Select a hall to start your reservation</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-600 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search halls..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2.5 border-2 border-brand-300 rounded-xl text-sm focus:ring-2 focus:ring-accent-400 focus:border-accent-500 outline-none w-full sm:w-64 bg-brand-50/50 placeholder-gray-400"
                    />
                  </div>

                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-600 w-4 h-4" />
                    <select
                      value={floorFilter}
                      onChange={(e) => setFloorFilter(e.target.value)}
                      className="pl-10 pr-8 py-2.5 border-2 border-brand-300 rounded-xl text-sm focus:ring-2 focus:ring-accent-400 focus:border-accent-500 outline-none appearance-none bg-brand-50/50 cursor-pointer font-medium"
                    >
                      <option value="All">All Floors</option>
                      <option value="2nd">2nd Floor</option>
                      <option value="3rd">3rd Floor</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredHalls.map(hall => (
                <HallCard key={hall.id} hall={hall} onBook={handleBookClick} />
              ))}
              {filteredHalls.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-500">
                  <p className="text-lg font-medium">No halls match your search criteria.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'BOOKING_FORM':
        return selectedHall ? (
          <BookingForm
            selectedHall={selectedHall}
            existingBookings={bookings}
            onBack={() => setCurrentView('HOME')}
            onSubmit={handleBookingSubmit}
          />
        ) : null;

      case 'MY_BOOKINGS':
        return (
          <BookingList
            bookings={bookings}
            user={user}
            onNewBooking={() => setCurrentView('HOME')}
            onCancelBooking={handleCancelBooking}
            onUpdateStatus={handleUpdateBookingStatus}
          />
        );

      case 'SUCCESS':
        return (
          <div className="max-w-md mx-auto mt-12 card-glass p-8 rounded-2xl shadow-2xl text-center animate-float border border-gray-100">
            <div className="w-20 h-20 bg-brand-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-500/30">
              <CheckCircle2 className="w-10 h-10 text-accent-900" />
            </div>
            <h2 className="text-2xl font-bold text-accent-800 mb-2">Request Submitted!</h2>
            <p className="text-gray-500 mb-8">
              Your reservation request for <span className="font-semibold text-accent-700">{selectedHall?.name}</span> has been sent for approval. You can track the status in "My Bookings".
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setCurrentView('MY_BOOKINGS')}
                className="btn-glow w-full bg-accent-600 hover:bg-accent-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-accent-600/25"
              >
                View Status
              </button>
              <button
                onClick={() => setCurrentView('HOME')}
                className="w-full bg-brand-200 hover:bg-brand-300 text-accent-800 font-medium py-3 rounded-xl border border-brand-400 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 selection:bg-accent-500 selection:text-white">
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar
        currentView={currentView}
        setView={setCurrentView}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </div>
      </main>

      <footer className="bg-gradient-to-r from-accent-800 via-accent-700 to-accent-800 py-6 pb-28 sm:pb-6 mt-auto shrink-0 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-brand-300">
          <p>© {new Date().getFullYear()} SNS Institutions iHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}