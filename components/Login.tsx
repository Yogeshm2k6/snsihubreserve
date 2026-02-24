import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { User, UserRole } from '../types';
import { auth, googleProvider, db, requestNotificationPermission } from '../lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('staff');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    // const domain = email.split('@')[1]?.toLowerCase();
    // return domain === 'snsgroups.com' || domain === 'ihub.com';
    return true; // Temporarily allow all domains for testing
  };

  const handleAuthSuccess = async (userEmail: string | null, userName: string | null, uid: string, signUpRole?: UserRole) => {
    if (!userEmail) return;

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    let role: UserRole = signUpRole || 'staff';
    const finalName = userName || userEmail.split('@')[0];

    // If logging in, always prioritize existing database role.
    // If signing up, create the doc with the selected role.
    if (userSnap.exists()) {
      role = userSnap.data().role as UserRole;
    } else {
      // For new signups, it uses the selected `signUpRole` passed into the function OR 'staff'.
      await setDoc(userRef, {
        email: userEmail,
        name: finalName,
        role: role,
        createdAt: new Date().toISOString()
      });
    }
    // Attempt to get FCM Token for Web Push Notifications
    const token = await requestNotificationPermission();
    if (token) {
      // If the user document was just created or exists, update it with the token
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token)
      });
    }

    onLogin({
      email: userEmail,
      name: finalName,
      role: role,
      uid: uid
    });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error('Access restricted: Please use an @snsgroups.com or @ihub.com email address.');
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (isSignUp) {
        if (!name) throw new Error('Name is required for registration.');
        result = await createUserWithEmailAndPassword(auth, email, password);
        await handleAuthSuccess(result.user.email, name, result.user.uid, selectedRole);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
        await handleAuthSuccess(result.user.email, name, result.user.uid);
      }

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists. Please sign in instead.');
      } else if (err.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password.');
      } else if (err.code === 'auth/weak-password') {
        toast.error('Password should be at least 6 characters.');
      } else {
        toast.error(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email;

      if (!userEmail) {
        await auth.signOut();
        toast.error('Failed to get email from Google Sign-In.');
        setIsLoading(false);
        return;
      }

      if (!validateEmail(userEmail)) {
        await auth.signOut();
        toast.error('Access restricted: Please use an @snsgroups.com or @ihub.com email address.');
        setIsLoading(false);
        return;
      }

      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);

      if (!isSignUp && !userSnap.exists()) {
        await auth.signOut();
        setIsSignUp(true);
        toast.error('Account not found. Please select your role and click Sign Up with Google.');
        setIsLoading(false);
        return;
      }

      // If they are in isSignUp mode, they might be overwriting their own role if it somehow already exists.
      // Safe to pass `selectedRole` forcefully or let the handleAuthSuccess prioritize the existing database role.
      await handleAuthSuccess(userEmail, result.user.displayName, result.user.uid, isSignUp ? selectedRole : undefined);

    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('missing initial state')) {
        toast.error('Google Sign-In is blocked in this App or Browser (like Gmail Mobile). Please use Email/Password to sign in, or open this link directly in Chrome/Safari.', { duration: 8000 });
      } else if (err.code === 'auth/popup-closed-by-user') {
        toast.error('Sign in popup was closed. Please try again or use Email/Password.');
      } else {
        toast.error(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-accent-900 font-sans">
      <style>{`
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 25s alternate infinite ease-in-out;
        }
      `}</style>

      {/* Left Side - Brand / Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-brand-600 overflow-hidden shadow-2xl z-20">
        <div className="absolute inset-0 bg-brand-600/60 mix-blend-multiply z-10 transition-all duration-1000"></div>
        <img
          src="/hall pics/Huddle_Space.jpg"
          alt="SNS iHub Workspace"
          className="absolute inset-0 w-full h-full object-cover animate-slow-zoom"
        />

        <div className="relative z-20 flex flex-col justify-center px-16 xl:px-24 h-full text-white">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl mb-12 transform -rotate-3 hover:rotate-0 transition-all duration-500 cursor-default">
            <span className="text-white font-black text-4xl tracking-tight">S</span>
          </div>

          <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Reserve your <br /><span className="text-brand-300 drop-shadow-lg">perfect space.</span>
          </h1>
          <p className="text-lg xl:text-xl text-gray-200 max-w-md leading-relaxed font-medium opacity-90">
            Welcome to the SNS iHub Hall Booking System. Streamlined reservations, instant approvals, and real-time availability.
          </p>

          <div className="mt-16 flex items-center gap-5 bg-white/5 backdrop-blur-sm border border-white/10 w-fit px-6 py-4 rounded-2xl shadow-xl">
            <div className="flex -space-x-4">
              <div className="w-10 h-10 rounded-full border-2 border-brand-500 bg-brand-400"></div>
              <div className="w-10 h-10 rounded-full border-2 border-brand-500 bg-brand-300"></div>
              <div className="w-10 h-10 rounded-full border-2 border-brand-500 bg-brand-200"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white uppercase tracking-wider">Trusted Architecture</span>
              <span className="text-[11px] font-medium text-brand-200">Used by 50+ departments daily</span>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-400 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse-glow z-10"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30 z-10"></div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-24 xl:px-32 bg-white relative z-10">
        {/* Mobile decorative blobs */}
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-brand-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="lg:hidden absolute bottom-0 left-0 w-64 h-64 bg-accent-50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 transform -translate-x-1/2 translate-y-1/2"></div>

        <div className="relative z-10 w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30">
              <span className="text-white font-black text-3xl">S</span>
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-accent-900 tracking-tight">
              {isSignUp ? 'Create account' : 'Welcome'}
            </h2>
            <p className="mt-3 text-sm sm:text-base font-medium text-gray-500">
              {isSignUp ? 'Enter your details to register as staff or admin.' : 'Please enter your details to sign in.'}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleEmailAuth}>
            {isSignUp && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="group">
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                    </div>
                    <input
                      type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-100/50 rounded-2xl text-sm font-bold text-accent-900 transition-all outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Role Selection</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                    </div>
                    <select
                      value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      className="block w-full pl-11 pr-10 py-3.5 bg-gray-50/50 border-2 border-gray-100 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-100/50 rounded-2xl text-sm font-bold text-accent-900 transition-all outline-none appearance-none cursor-pointer"
                    >
                      <option value="staff">Staff (Booking Requests)</option>
                      <optgroup label="Admin Roles">
                        <option value="admin_ic">Admin I/C (Stage 1 Approver)</option>
                        <option value="coordinator">Coordinator (Stage 2 Approver)</option>
                        <option value="head_ops">Head of Operations (Stage 3 Approver)</option>
                      </optgroup>
                    </select>
                  </div>
                  <p className="mt-2 ml-1 text-[11px] font-semibold text-brand-500/80">Admins will have access to the approval dashboard automatically.</p>
                </div>
              </div>
            )}

            <div className="group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-100/50 rounded-2xl text-sm font-bold text-accent-900 transition-all outline-none"
                  placeholder="name@snsgroups.com"
                />
              </div>
            </div>

            <div className="group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-100/50 rounded-2xl text-sm font-bold text-accent-900 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit" disabled={isLoading}
              className={`w-full py-4 px-4 mt-4 rounded-2xl shadow-xl shadow-brand-500/20 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 hover:shadow-brand-500/40 hover:-translate-y-1 focus:outline-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 delay-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="mt-8 animate-in fade-in duration-1000 delay-300">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400 font-bold uppercase tracking-wider text-[10px]">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn} disabled={isLoading}
              className={`mt-6 w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-gray-100 hover:border-gray-200 rounded-2xl shadow-sm bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 focus:outline-none transition-all duration-300 hover:-translate-y-0.5 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
            </button>
          </div>

          <div className="mt-12 text-center animate-in fade-in duration-1000 delay-500">
            <button
              type="button" onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gray-500 font-medium hover:text-brand-600 transition-colors"
            >
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <span className="font-bold text-brand-600 underline underline-offset-4 decoration-2 decoration-brand-200 hover:decoration-brand-500 transition-colors">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};