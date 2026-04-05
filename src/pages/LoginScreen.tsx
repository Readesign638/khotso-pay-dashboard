import React, { useState } from 'react';
// Added Eye and EyeOff for the password toggle
import { Mail, Lock, Building, ArrowRight, UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // New state for visibility

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      const userData = { email, password };
      localStorage.setItem('portfolioUser', JSON.stringify(userData));
      alert("Registration Successful! Please sign in with your new credentials.");
      setIsRegistering(false);
      setPassword('');
    } else {
      const savedUserStr = localStorage.getItem('portfolioUser');
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;

      const isAdmin = email === 'admin@khotsopay.ls' && password === '123456';
      const isSavedUser = savedUser && email === savedUser.email && password === savedUser.password;

      if (isAdmin || isSavedUser) {
        onLogin();
      } else {
        setError('Invalid credentials. Try: admin@khotsopay.ls / 123456');
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 bg-slate-900 font-sans">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop')` }}
      />

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="bg-white rounded-[40px] shadow-2xl p-10 md:p-14">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-blue-600 tracking-tighter italic mb-2">KhotsoPay</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              {isRegistering ? 'Create Account' : 'Merchant Login'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <div className="relative group animate-in fade-in zoom-in-95 duration-200">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Business Name" 
                  required={isRegistering}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-600/20 focus:ring-4 focus:ring-blue-600/5 font-medium transition-all" 
                />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Email Address" 
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-600/20 focus:ring-4 focus:ring-blue-600/5 font-medium transition-all" 
                required 
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Password" 
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-600/20 focus:ring-4 focus:ring-blue-600/5 font-medium transition-all" 
                required 
              />
              {/* PASSWORD TOGGLE BUTTON */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors focus:outline-none"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button type="submit" className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-black text-lg py-5 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95">
              {isRegistering ? (
                <>Register <UserPlus size={22} /></>
              ) : (
                <>Sign In <ArrowRight size={22} /></>
              )}
            </button>
          </form>

          <button 
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(''); // Clear error when switching modes
            }} 
            className="w-full mt-8 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors"
          >
            {isRegistering ? 'Back to Login' : 'New merchant? Register Business'}
          </button>
        </div>
      </div>
    </div>
  );
}