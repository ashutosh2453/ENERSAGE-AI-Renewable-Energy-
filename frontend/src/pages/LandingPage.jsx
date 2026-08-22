import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Brain, Sliders, Shield, Bell, ArrowRight, Activity, Cpu, BarChart2, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Particle = ({ style }) => (
  <div className="absolute rounded-full opacity-20 animate-pulse" style={style} />
);

const FeatureCard = ({ icon: Icon, title, desc, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    viewport={{ once: true }}
    className="glass p-6 hover:border-energy-cyan/40 transition-all duration-300 group cursor-pointer"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-energy-cyan transition-colors">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
  </motion.div>
);

const StatCounter = ({ value, label, suffix = '' }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const target = typeof value === 'number' ? value : parseFloat(value);
    const step = target / 60;
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current * 10) / 10);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-energy-cyan">{count}{suffix}</div>
      <div className="text-slate-400 text-sm mt-1">{label}</div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');

  const particles = Array.from({ length: 20 }, (_, i) => ({
    width: `${Math.random() * 6 + 2}px`,
    height: `${Math.random() * 6 + 2}px`,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    background: i % 3 === 0 ? '#00d4ff' : i % 3 === 1 ? '#00ff88' : '#f59e0b',
    animationDelay: `${Math.random() * 3}s`,
    animationDuration: `${Math.random() * 4 + 2}s`,
  }));

  const handleLaunchDemo = async () => {
    if (!user) { navigate('/register'); return; }
    setDemoLoading(true);
    setDemoError('');
    try {
      const res = await axios.post('/api/data/demo');
      const projectId = res.data.projectId;
      localStorage.setItem('renew_demo_projectId', projectId);
      localStorage.setItem('renew_current_project', projectId);
      navigate('/dashboard');
    } catch (err) {
      setDemoError(err.response?.data?.message || 'Failed to launch demo. Please try again.');
    } finally {
      setDemoLoading(false);
    }
  };

  const features = [
    { icon: TrendingUp, title: 'AI Forecasting Engine', desc: 'Random Forest + XGBoost ensemble predicts generation with confidence intervals up to 7 days ahead.', color: 'bg-energy-cyan/20', delay: 0.1 },
    { icon: Brain, title: 'Explainable AI (XAI)', desc: "Every prediction includes a \"Why?\" breakdown with feature importances mapped to plain English.", color: 'bg-purple-500/20', delay: 0.2 },
    { icon: Zap, title: 'Decision Engine', desc: 'Deterministic logic recommends USE, STORE, EXPORT, or GRID actions in real-time based on surplus/deficit.', color: 'bg-energy-green/20', delay: 0.3 },
    { icon: Sliders, title: 'What-If Simulator', desc: 'Adjust solar, wind, cloud coverage, and demand to simulate scenarios before they happen.', color: 'bg-amber-500/20', delay: 0.4 },
    { icon: Cpu, title: 'AI Copilot', desc: 'Conversational assistant powered by Groq LLaMA 3 with full awareness of your energy system state.', color: 'bg-pink-500/20', delay: 0.5 },
    { icon: Bell, title: 'Smart Alerts', desc: 'Auto-generated critical, warning, and opportunity alerts based on live forecast calculations.', color: 'bg-red-500/20', delay: 0.6 },
  ];

  return (
    <div className="min-h-screen bg-bg-space text-white overflow-x-hidden">
      {/* Particle Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => <Particle key={i} style={p} />)}
        <div className="absolute inset-0 bg-gradient-to-b from-energy-cyan/5 via-transparent to-energy-green/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-energy-cyan/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-energy-green/5 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Zap className="text-energy-cyan" size={24} />
          <span className="text-xl font-bold bg-gradient-to-r from-energy-cyan to-energy-green bg-clip-text text-transparent">ENER SAGE AI</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 rounded-lg bg-energy-cyan text-bg-space font-semibold text-sm hover:bg-energy-cyan/90 transition-colors">
              Go to Dashboard
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="text-slate-400 hover:text-white text-sm transition-colors">Login</button>
              <button onClick={() => navigate('/register')} className="px-4 py-2 rounded-lg bg-energy-cyan/10 border border-energy-cyan/30 text-energy-cyan text-sm hover:bg-energy-cyan/20 transition-colors">
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center pt-24 pb-20 px-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-energy-cyan/30 bg-energy-cyan/5 text-energy-cyan text-xs font-medium mb-8">
            <Activity size={12} />
            AI-Powered Energy Management Platform
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-none">
            <span className="bg-gradient-to-r from-energy-cyan via-white to-energy-green bg-clip-text text-transparent">ENER SAGE AI</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-4 leading-relaxed">
            Production-grade renewable energy forecasting, analysis, and decision management powered by machine learning and explainable AI.
          </p>
          <p className="text-sm text-slate-500 max-w-xl mx-auto mb-10">
            Solar + Wind microgrid intelligence. Real forecasts. Real decisions. Real results.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLaunchDemo}
              disabled={demoLoading}
              className="relative flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-energy-cyan to-energy-green text-bg-space font-bold text-base hover:opacity-90 transition-all glow-cyan disabled:opacity-60"
            >
              {demoLoading ? (
                <><div className="w-4 h-4 border-2 border-bg-space/30 border-t-bg-space rounded-full animate-spin" />Launching Demo...</>
              ) : (
                <><Zap size={18} />Launch Live Demo</>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-white font-semibold text-base hover:border-white/30 hover:bg-white/5 transition-all"
            >
              Get Started Free <ArrowRight size={16} />
            </motion.button>
          </div>

          {demoError && (
            <p className="mt-4 text-red-400 text-sm">{demoError}</p>
          )}
          {!user && (
            <p className="mt-4 text-slate-500 text-xs">Demo requires a free account — register in seconds.</p>
          )}
        </motion.div>

        {/* Hero dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-20 w-full max-w-5xl mx-auto"
        >
          <div className="glass p-1 rounded-2xl glow-cyan">
            <div className="bg-[#0d1117] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-slate-500 text-xs font-mono">renew-ai/dashboard</span>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Solar Gen', value: '142.3 kW', color: 'text-energy-cyan' },
                  { label: 'Wind Gen', value: '67.8 kW', color: 'text-energy-green' },
                  { label: 'Battery SOC', value: '74%', color: 'text-amber-400' },
                  { label: 'Confidence', value: '91.2%', color: 'text-purple-400' },
                ].map((kpi, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="text-slate-500 text-xs mb-1">{kpi.label}</div>
                    <div className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>
              <div className="h-24 bg-white/5 rounded-lg flex items-end gap-1 px-3 py-3">
                {Array.from({ length: 24 }, (_, i) => {
                  const h = Math.sin((i / 24) * Math.PI) * 0.8 + 0.1;
                  return (
                    <div key={i} className="flex-1 rounded-t" style={{ height: `${h * 100}%`, background: `rgba(0,212,255,${0.3 + h * 0.5})` }} />
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-slate-500 text-xs">Generation forecast with confidence intervals</span>
                <span className="text-energy-green text-xs font-medium flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-energy-green animate-pulse" />STORE</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 border-y border-white/5 py-12 px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8">
          <StatCounter value={30} label="Days of Forecasting" suffix=" Days" />
          <StatCounter value={99.2} label="Model Accuracy" suffix="%" />
          <StatCounter value={3} label="ML Models Ensemble" suffix="×" />
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-4">Everything you need to manage energy intelligently</h2>
            <p className="text-slate-400 max-w-xl mx-auto">From raw sensor data to actionable AI decisions — the complete pipeline.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => <FeatureCard key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20 px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
          </motion.div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {[
              { step: '01', title: 'Upload or Demo', desc: 'Upload your CSV energy data or launch the pre-built demo microgrid dataset instantly.', icon: BarChart2 },
              { step: '02', title: 'Train & Forecast', desc: 'The ML ensemble trains on your data and generates forecasts with confidence intervals and XAI explanations.', icon: Brain },
              { step: '03', title: 'Act on Insights', desc: 'Decision Engine recommends actions. Copilot explains them. Simulator lets you test scenarios.', icon: Zap },
            ].map((step, i) => (
              <React.Fragment key={i}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className="flex-1 glass p-6 text-center"
                >
                  <div className="text-5xl font-black text-energy-cyan/20 mb-2">{step.step}</div>
                  <step.icon className="text-energy-cyan mx-auto mb-3" size={28} />
                  <h3 className="text-white font-bold mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
                {i < 2 && <ChevronRight className="text-slate-600 hidden md:block flex-shrink-0" size={24} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 px-8 text-center border-t border-white/5">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to optimize your energy?</h2>
          <p className="text-slate-400 mb-8">Try the live demo — no setup required. 30 days of synthetic solar + wind microgrid data, pre-loaded.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleLaunchDemo}
            disabled={demoLoading}
            className="px-10 py-4 rounded-xl bg-gradient-to-r from-energy-cyan to-energy-green text-bg-space font-bold text-lg glow-cyan hover:opacity-90 transition-all disabled:opacity-60"
          >
            {demoLoading ? 'Launching...' : '⚡ Launch Live Demo'}
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-8 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Zap size={14} className="text-energy-cyan" />
          <span>ENER SAGE AI © 2024</span>
        </div>
        <span className="text-slate-600 text-xs">Powered by LLaMA 3 · scikit-learn · XGBoost</span>
      </footer>
    </div>
  );
};

export default LandingPage;
