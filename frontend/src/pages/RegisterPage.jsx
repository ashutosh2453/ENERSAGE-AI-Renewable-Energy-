import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Zap } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password);
      addToast('Registration successful', 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-space p-4">
      <div className="glass w-full max-w-md p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-energy-cyan/20 blur-[50px] rounded-full -mr-10 -mt-10"></div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-energy-cyan/20 border border-energy-cyan flex items-center justify-center glow-cyan">
            <Zap size={20} className="text-energy-cyan" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-white">ENER SAGE AI</h1>
        </div>
        <h2 className="text-xl font-semibold mb-6 text-slate-200">Create an account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} required className="w-full bg-surface/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-energy-cyan focus:ring-1 focus:ring-energy-cyan transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full bg-surface/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-energy-cyan focus:ring-1 focus:ring-energy-cyan transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full bg-surface/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-energy-cyan focus:ring-1 focus:ring-energy-cyan transition-colors" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-energy-cyan/10 border border-energy-cyan text-energy-cyan font-medium hover:bg-energy-cyan hover:text-bg-space transition-all glow-cyan mt-4 disabled:opacity-50">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account? <a href="/login" className="text-energy-cyan hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
