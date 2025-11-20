import React, { useState } from 'react';
import { ShieldCheck, User as UserIcon, Smartphone, Key, ArrowRight, Mail, Calendar, Fingerprint, Hexagon } from 'lucide-react';
import { apiService } from '../../services/api';
import { AuthState, User } from '../../types';
import { FullScreenLoader } from '../UI/Loader';
import { Modal } from '../UI/Modal';

interface AuthProps {
  onSuccess: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [view, setView] = useState<AuthState>('login');
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{title: string, msg: string, type: 'error'|'success'} | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    mobile: '',
    email: '',
    dob: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlertMsg(null);

    try {
      if (view === 'login') {
        const res = await apiService.login({
          UserName: formData.username,
          MobileNumber: formData.mobile,
          Password: formData.password
        });
        if (res.status === 'success') {
            onSuccess({ username: formData.username, mobileNumber: formData.mobile });
        } else {
            if (res.message && res.message.toLowerCase().includes("already active")) {
                setAlertMsg({
                    title: "SESSION ACTIVE",
                    msg: "Account already active on another device. For security, we've logged you out automatically. Please login again.",
                    type: 'error'
                });
                await apiService.logout({ UserName: formData.username, MobileNumber: formData.mobile });
            } else {
                setAlertMsg({ title: "ACCESS DENIED", msg: res.message || 'Invalid Credentials.', type: 'error'});
            }
        }
      } else {
        const res = await apiService.register({
            UserName: formData.username,
            Password: formData.password,
            MobileNumber: formData.mobile,
            Email: formData.email,
            DateOfBirth: formData.dob,
            DateOfRegistration: new Date().toISOString().split('T')[0]
        });
        if (res.status === 'success') {
            setView('login');
            setFormData({ ...formData, password: '' });
            setAlertMsg({ title: "SUCCESS", msg: "Identity established. Please login to continue.", type: 'success'});
        } else {
            setAlertMsg({ title: "REGISTRATION FAILED", msg: res.message || 'Protocol failed.', type: 'error'});
        }
      }
    } catch (err) {
        setAlertMsg({ title: "NETWORK ERROR", msg: "Connection handshake failed.", type: 'error'});
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030405] relative overflow-y-auto custom-scrollbar">
      {/* Animated Background Effects */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-ai-cyan/5 rounded-full blur-[120px] animate-pulse-slow pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-slow delay-1000 pointer-events-none"></div>
      
      {loading && <FullScreenLoader text={view === 'login' ? "VERIFYING CREDENTIALS..." : "ESTABLISHING RECORD..."} />}
      
      {/* Content Wrapper - Ensure min-h-screen to allow scrolling */}
      <div className="flex items-center justify-center min-h-screen py-12 px-4">
        <div className="w-full max-w-md relative z-10 my-auto">
            
            {/* Card Container */}
            <div className="bg-[#0b0e14]/90 backdrop-blur-2xl border border-gray-800 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden">
                
                {/* Decorative Header Line */}
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-ai-cyan to-transparent"></div>

                <div className="p-6 md:p-10">
                    <div className="text-center mb-8">
                        <div className="relative inline-block mb-4">
                            <div className="absolute inset-0 bg-ai-cyan blur-lg opacity-40 animate-pulse"></div>
                            <div className="relative bg-[#0f131a] p-4 rounded-2xl border border-ai-cyan/30">
                                <Hexagon size={32} className="text-ai-cyan animate-spin-slow" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-oswald font-bold text-white tracking-tight mb-1">
                            BISWA <span className="text-ai-cyan">SENTINEL</span>
                        </h1>
                        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 font-mono tracking-[0.3em] uppercase">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            Secure Access v4.0
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-[#05070a] rounded-xl border border-gray-800 mb-8">
                        <button 
                            onClick={() => setView('login')} 
                            className={`flex-1 py-3 text-xs font-bold font-oswald tracking-widest rounded-lg transition-all duration-300 ${view === 'login' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            LOGIN
                        </button>
                        <button 
                            onClick={() => setView('register')} 
                            className={`flex-1 py-3 text-xs font-bold font-oswald tracking-widest rounded-lg transition-all duration-300 ${view === 'register' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            REGISTER
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
                        <div className="space-y-4">
                            <PremiumInput 
                                icon={<UserIcon size={18} />} 
                                type="text" 
                                name="username" 
                                placeholder="USERNAME" 
                                value={formData.username} 
                                onChange={handleChange} 
                            />
                            <PremiumInput 
                                icon={<Smartphone size={18} />} 
                                type="tel" 
                                name="mobile" 
                                placeholder="MOBILE NUMBER" 
                                value={formData.mobile} 
                                onChange={handleChange} 
                            />
                            
                            {view === 'register' && (
                                <div className="animate-fade-in space-y-4">
                                    <PremiumInput 
                                        icon={<Mail size={18} />} 
                                        type="email" 
                                        name="email" 
                                        placeholder="EMAIL ADDRESS" 
                                        value={formData.email} 
                                        onChange={handleChange} 
                                    />
                                    <PremiumInput 
                                        icon={<Calendar size={18} />} 
                                        type="date" 
                                        name="dob" 
                                        placeholder="" 
                                        value={formData.dob} 
                                        onChange={handleChange} 
                                    />
                                </div>
                            )}

                            <PremiumInput 
                                icon={<Key size={18} />} 
                                type="password" 
                                name="password" 
                                placeholder="PASSWORD" 
                                value={formData.password} 
                                onChange={handleChange} 
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="w-full py-4 mt-6 rounded-xl bg-gradient-to-r from-[#00C8B7] to-[#00EADF] text-[#05070a] font-black font-oswald tracking-[0.2em] text-sm flex items-center justify-center gap-2 group hover:shadow-[0_0_30px_rgba(0,234,223,0.4)] transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <span>{view === 'login' ? 'AUTHENTICATE' : 'CREATE ID'}</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                    
                    <div className="mt-8 pt-6 border-t border-gray-800/50 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
                            <Fingerprint size={16} />
                            <span className="text-[10px] font-mono uppercase tracking-widest">Biometric Encryption Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <Modal isOpen={!!alertMsg} onClose={() => setAlertMsg(null)} title={alertMsg?.title}>
        <div className="text-center p-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border shadow-lg ${alertMsg?.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
                {alertMsg?.type === 'error' ? <ShieldCheck size={32} /> : <Hexagon size={32} />}
            </div>
            <p className="text-sm text-gray-300 font-mono leading-relaxed mb-6">
                {alertMsg?.msg}
            </p>
            <button 
                onClick={() => setAlertMsg(null)}
                className="w-full py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold font-oswald tracking-wider text-xs transition border border-gray-700"
            >
                ACKNOWLEDGE
            </button>
        </div>
      </Modal>
    </div>
  );
};

const PremiumInput = ({ icon, ...props }: any) => (
    <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-ai-cyan transition-colors duration-300">
            {icon}
        </div>
        <input 
            {...props}
            required
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#05070a] border border-gray-800 text-gray-200 text-xs font-bold font-mono tracking-wide focus:border-ai-cyan focus:bg-[#0f131a] focus:shadow-[0_0_15px_rgba(0,234,223,0.1)] focus:outline-none transition-all duration-300 placeholder:text-gray-700"
        />
    </div>
);