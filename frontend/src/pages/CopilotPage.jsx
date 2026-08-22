import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Zap, Battery, Sun, Wind, RotateCcw, Activity } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { copilotAPI, dataAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
  "Why was GRID used at 10 AM?",
  "What's tomorrow's expected peak generation?",
  "Should I export energy now?",
  "Simulate 20% lower solar output",
  "How is my battery performing?",
  "What's causing the energy deficit?",
];

const TypingDots = () => (
  <div className="flex gap-1 items-center h-5">
    {[0, 150, 300].map((delay, i) => (
      <div key={i} className="w-2 h-2 bg-energy-cyan rounded-full animate-bounce"
        style={{ animationDelay: `${delay}ms` }} />
    ))}
  </div>
);

const Message = ({ msg, isLast }) => {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1
        ${isUser ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-energy-cyan/20 border border-energy-cyan/30'}`}>
        {isUser ? <User size={14} className="text-blue-400" /> : <Bot size={14} className="text-energy-cyan" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
        ${isUser
          ? 'bg-blue-500/10 border border-blue-500/20 text-white rounded-tr-sm'
          : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm'}`}>
        {msg.content}
        {msg.error && <p className="text-red-400 text-xs mt-2">⚠ {msg.error}</p>}
      </div>
    </motion.div>
  );
};

const CopilotPage = () => {
  const { currentProject } = useProject();
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: '⚡ Hello! I\'m your ENER SAGE AI Copilot, powered by Groq LLM intelligence.\n\nI have access to your live energy data — solar generation, wind output, battery SOC, demand, and forecasts. Ask me anything about your microgrid!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch live stats for the header badges
  useEffect(() => {
    if (!currentProject) return;
    dataAPI.getStats(currentProject)
      .then(res => setLiveData(res.data))
      .catch(() => {});
  }, [currentProject]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await copilotAPI.chat({
        message: userMsg,
        projectId: currentProject,
        history: messages.slice(-10), // send last 10 messages for context
      });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.reply }]);

    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to reach AI service.';
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'I encountered an issue connecting to the AI service.',
        error: errMsg
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const clearChat = () => {
    setMessages([{
      role: 'ai',
      content: '⚡ Chat cleared. How can I help you with your energy management?'
    }]);
  };

  const soc = liveData?.latest?.batterySOC ?? liveData?.averages?.batterySOC;
  const totalGen = (liveData?.latest?.solarGeneration || 0) + (liveData?.latest?.windGeneration || 0);

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col glass rounded-xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-energy-cyan/10 border border-energy-cyan/30 flex items-center justify-center glow-cyan">
            <Bot size={18} className="text-energy-cyan" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm">AI Energy Copilot</h2>
            <p className="text-slate-500 text-xs">Groq · LLaMA 3 70B</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live context badges */}
          {soc != null && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-energy-green/10 border border-energy-green/20 text-energy-green flex items-center gap-1">
              <Battery size={10} />SOC: {Number(soc).toFixed(0)}%
            </span>
          )}
          {totalGen > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-energy-cyan/10 border border-energy-cyan/20 text-energy-cyan flex items-center gap-1">
              <Zap size={10} />{totalGen.toFixed(1)}kW
            </span>
          )}
          {!currentProject && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400">
              No project selected
            </span>
          )}
          <button onClick={clearChat} title="Clear chat"
            className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <Message key={i} msg={msg} isLast={i === messages.length - 1} />
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-energy-cyan/20 border border-energy-cyan/30 flex items-center justify-center">
              <Bot size={14} className="text-energy-cyan" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
              <TypingDots />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="px-5 py-2 flex gap-2 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
        {SUGGESTIONS.map(q => (
          <button key={q} onClick={() => sendMessage(q)} disabled={loading}
            className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full border border-white/10 bg-white/3 text-slate-400 hover:text-energy-cyan hover:border-energy-cyan/40 transition-colors disabled:opacity-40">
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask about solar output, battery usage, forecasts, or anomalies..."
            disabled={loading}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-energy-cyan/50 focus:bg-white/8 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-3 rounded-xl bg-energy-cyan/10 border border-energy-cyan/30 text-energy-cyan hover:bg-energy-cyan hover:text-bg-space transition-all disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CopilotPage;
