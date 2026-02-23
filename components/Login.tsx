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
      toast.error(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-100 via-brand-50 to-accent-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-brand-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-accent-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-brand-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center transform hover:scale-105 transition-transform duration-300">
          <div className="w-16 h-16 bg-gradient-to-tr from-accent-600 to-accent-400 rounded-2xl flex items-center justify-center shadow-xl shadow-accent-500/40 rotate-3 hover:rotate-0 transition-all duration-300 animate-pulse-glow">
            <span className="text-white font-bold text-3xl tracking-tight">S</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-4xl font-extrabold text-accent-800 tracking-tight">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 mb-8 font-bold uppercase tracking-widest">
          Hall Booking & Reservation System
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="card-glass py-8 px-4 shadow-2xl shadow-accent-900/10 sm:rounded-2xl sm:px-10">

          <form className="space-y-5" onSubmit={handleEmailAuth}>

            {isSignUp && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 sm:text-sm rounded-lg py-2.5 border-gray-300 focus:ring-brand-500 focus:border-brand-500"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role Selection</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      className="block w-full pl-10 sm:text-sm rounded-lg py-2.5 border border-gray-300 focus:ring-brand-500 focus:border-brand-500 outline-none appearance-none bg-white cursor-pointer"
                    >
                      <option value="staff">Staff (Booking Requests)</option>
                      <optgroup label="Admin Roles">
                        <option value="admin_ic">Admin I/C (Stage 1 Approver)</option>
                        <option value="coordinator">Coordinator (Stage 2 Approver)</option>
                        <option value="head_ops">Head of Operations (Stage 3 Approver)</option>
                      </optgroup>
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Admins will have access to the approval dashboard automatically.</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address (SNS/iHub only)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 sm:text-sm rounded-lg py-2.5 border-gray-300 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="name@snsgroups.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 sm:text-sm rounded-lg py-2.5 border-gray-300 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 rounded-xl shadow-lg shadow-accent-600/25 text-sm font-bold text-white bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-500 hover:to-accent-400 focus:outline-none transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
              >
                {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign in')}
              </button>
            </div>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-accent-600 hover:text-accent-800 font-bold transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </button>
            </div>

          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className={`w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'
                  }`}
              >
                <span className="flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                  {isSignUp ? 'Sign Up with Google' : 'Sign in with Google'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};