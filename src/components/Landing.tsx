import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, ArrowRight, CheckCircle2, ShieldCheck, Zap, Mail, Lock, User as UserIcon } from 'lucide-react';
import { googleSignIn, emailSignIn, emailSignUp } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        (window as any)._token = result.accessToken;
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'An error occurred during sign in.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdminAccess = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/demo-login', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to authenticate admin session');
      const data = await res.json();
      if (data?.token) {
        (window as any)._token = data.token;
        localStorage.setItem('irms_token', data.token);
        window.dispatchEvent(new CustomEvent('auth-token-updated', { detail: { token: data.token } }));
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to access workspace');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      let result;
      if (authMode === 'signup') {
        if (!name.trim()) throw new Error("Name is required");
        result = await emailSignUp(email, password, name);
      } else {
        result = await emailSignIn(email, password);
      }
      if (result) {
        (window as any)._token = result.accessToken;
        localStorage.setItem('irms_token', result.accessToken);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans flex flex-col md:flex-row">
      {/* Left side: Hero & Value Prop */}
      <div className="flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-center relative overflow-hidden bg-white border-r border-neutral-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl mx-auto md:mx-0 w-full"
        >
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-neutral-900 text-white p-2.5 rounded-xl shadow-sm">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">IRMS SaaS</h1>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1] text-neutral-950">
            Enterprise Resource <br className="hidden lg:block"/> Management, <span className="text-neutral-400">Simplified.</span>
          </h2>
          <p className="text-lg md:text-xl text-neutral-600 mb-10 leading-relaxed font-medium">
            Take control of your workforce, projects, and assets with an intelligent, unified operational dashboard designed for scale.
          </p>

          <div className="space-y-4">
            {[
              { icon: ShieldCheck, text: "Strict role-based access & audit logging" },
              { icon: Zap, text: "Real-time assignment & timesheet workflows" },
              { icon: CheckCircle2, text: "Automated conflict resolution & capacity validation" }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + (i * 0.1), ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                  <feature.icon className="w-4 h-4 text-neutral-900" />
                </div>
                <span className="text-neutral-700 font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Decorative background blur */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />
      </div>

      {/* Right side: Auth forms */}
      <div className="flex-1 p-8 md:p-16 flex items-center justify-center bg-neutral-50/50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-neutral-100">
            <AnimatePresence mode="wait">
              {!authMode ? (
                <motion.div 
                  key="start"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-2xl font-bold mb-2 tracking-tight">Get Started</h3>
                  <p className="text-neutral-500 mb-8 font-medium">Choose how you would like to continue.</p>

                  <div className="space-y-4">
                    <button 
                      onClick={handleQuickAdminAccess}
                      disabled={isLoading}
                      className="w-full flex items-center justify-between p-4 bg-neutral-900 text-white rounded-2xl hover:bg-neutral-800 transition-all group shadow-sm disabled:opacity-50 cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-neutral-800 p-2 rounded-lg group-hover:bg-neutral-700 transition-colors">
                          <ShieldCheck className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <span className="block font-bold text-sm text-white">Enter Workspace (Super Admin)</span>
                          <span className="block text-xs text-neutral-400">Muhammed Dakvan I · IRMS Organization</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
                    </button>

                    <button 
                      onClick={() => setAuthMode('signup')}
                      className="w-full flex items-center justify-between p-4 border border-neutral-200 rounded-2xl hover:border-neutral-900 hover:bg-neutral-50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-neutral-100 p-2 rounded-lg group-hover:bg-neutral-200 transition-colors">
                          <Mail className="w-5 h-5 text-neutral-900" />
                        </div>
                        <span className="font-semibold text-neutral-900">Sign up with Email</span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                    </button>

                    <button 
                      onClick={handleGoogleAuth}
                      disabled={isLoading}
                      className="w-full flex items-center justify-between p-4 border border-neutral-200 rounded-2xl hover:border-neutral-900 hover:bg-neutral-50 transition-all group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-neutral-100 p-2 rounded-lg group-hover:bg-neutral-200 transition-colors">
                          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                          </svg>
                        </div>
                        <span className="font-semibold text-neutral-900">Continue with Google</span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                    </button>
                  </div>

                  <p className="mt-8 text-center text-sm font-medium text-neutral-500">
                    Already have an account?{' '}
                    <button onClick={() => setAuthMode('signin')} className="text-neutral-900 hover:underline">
                      Log in
                    </button>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <button 
                    onClick={() => { setAuthMode(null); setError(null); }}
                    className="mb-6 text-sm font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" /> Back
                  </button>

                  <h3 className="text-2xl font-bold mb-2 tracking-tight">
                    {authMode === 'signup' ? 'Create an account' : 'Welcome back'}
                  </h3>
                  <p className="text-neutral-500 mb-8 font-medium">
                    {authMode === 'signup' ? 'Enter your details to register.' : 'Enter your credentials to access your workspace.'}
                  </p>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl font-medium">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    {authMode === 'signup' && (
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-neutral-700">Full Name</label>
                        <div className="relative">
                          <UserIcon className="absolute left-3.5 top-3 w-5 h-5 text-neutral-400" />
                          <input 
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all outline-none font-medium text-neutral-900"
                            placeholder="John Doe"
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-neutral-700">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 w-5 h-5 text-neutral-400" />
                        <input 
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all outline-none font-medium text-neutral-900"
                          placeholder="you@company.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-neutral-700">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 w-5 h-5 text-neutral-400" />
                        <input 
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all outline-none font-medium text-neutral-900"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 mt-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      {authMode === 'signup' ? 'Create Account' : 'Sign In'}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
