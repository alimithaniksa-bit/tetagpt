import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Sparkles, 
  Chrome, 
  AlertTriangle, 
  CheckCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { 
  auth, 
  db, 
  googleProvider,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  doc,
  setDoc,
  serverTimestamp
} from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const userData = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Google Explorer',
        email: firebaseUser.email || '',
        picture: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
        created_at: new Date().toISOString()
      };

      // Save user to Firestore users collection
      await setDoc(doc(db, "users", firebaseUser.uid), {
        ...userData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setSuccess('Successfully signed in with Google!');
      setTimeout(() => {
        onAuthSuccess(userData);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to authenticate with Google. Popups may be blocked.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Please enter your full name');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = credential.user;

        // Update display name
        await updateProfile(firebaseUser, {
          displayName: name,
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`
        });

        const userData = {
          id: firebaseUser.uid,
          name: name,
          email: firebaseUser.email || '',
          picture: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
          created_at: new Date().toISOString()
        };

        // Create doc in Firestore
        await setDoc(doc(db, "users", firebaseUser.uid), {
          ...userData,
          updatedAt: serverTimestamp()
        });

        setSuccess('Account created successfully!');
        setTimeout(() => {
          onAuthSuccess(userData);
          onClose();
        }, 1200);

      } else {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = credential.user;

        const userData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Teta Developer',
          email: firebaseUser.email || '',
          picture: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
          created_at: new Date().toISOString()
        };

        // Sync metadata with Firestore just in case
        await setDoc(doc(db, "users", firebaseUser.uid), {
          ...userData,
          updatedAt: serverTimestamp()
        }, { merge: true });

        setSuccess('Signed in successfully!');
        setTimeout(() => {
          onAuthSuccess(userData);
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || 'Authentication failed. Please check your inputs.';
      if (err.code === 'auth/wrong-password') {
        errMsg = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/user-not-found') {
        errMsg = 'No user found with this email address.';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = 'This email is already registered. Try logging in.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'Please enter a valid email address.';
      }
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-black text-white text-base uppercase tracking-wider">
                {isSignUp ? "Create Workspace" : "Access Engine"}
              </h3>
              <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-widest">
                {isSignUp ? "Sync with Cloud Database" : "Secure Firebase Authentication"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-all text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Status Indicators */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
              >
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400 font-medium leading-relaxed">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3"
              >
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-400 font-medium leading-relaxed">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social Sign In Option */}
          <div className="space-y-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white text-black hover:bg-neutral-100 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(255,255,255,0.05)]"
            >
              <Chrome className="w-4 h-4 shrink-0" />
              Continue with Google
            </button>
          </div>

          {/* Spacer / Or */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <span className="relative px-3 bg-[#151515] text-[9px] font-black uppercase tracking-widest text-neutral-500">
              Matrix Email Terminal
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Display Nickname
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="w-4 h-4 text-neutral-500" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-3.5 pl-11 pr-5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-mono"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-neutral-500" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@matrix.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-3.5 pl-11 pr-5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-neutral-500" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-3.5 pl-11 pr-5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Auth Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-widest transition-all shadow-[0_15px_30px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  Compiling Auth Matrix...
                </>
              ) : (
                <>
                  {isSignUp ? "Construct Account" : "Access Console"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="text-center pt-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              className="text-[10px] text-neutral-400 hover:text-emerald-500 font-bold uppercase tracking-wider transition-colors"
            >
              {isSignUp ? "Already registered? Click to Access Console" : "New creator? Click to construct account"}
            </button>
          </div>

          {/* Security Disclaimer */}
          <div className="flex items-center justify-center gap-1.5 text-[9px] text-neutral-500 font-semibold uppercase tracking-widest pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure connection authenticated by Firebase</span>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
