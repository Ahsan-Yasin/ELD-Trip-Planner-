import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTripStore } from '../store';

const API_BASE = 'http://localhost:8000/api';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDrawerOpen, setDrawerOpen, getTripContextForChat, token, user, logout } = useTripStore();
  const location = useLocation();

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI Logistics Assistant powered by FMCSA HOS knowledge. Ask me anything about Hours of Service rules, compliance, trip planning, or ELD regulations.',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || chatLoading) return;

    const userMsg = { role: 'user' as const, content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setChatLoading(true);

    try {
      const tripContext = getTripContextForChat();
      const response = await fetch(`${API_BASE}/ai/chat/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          trip_context: tripContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      if (data.session_id) setSessionId(data.session_id);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '⚠️ I\'m having trouble connecting to the compliance service. Please make sure the Django backend is running on port 8000. In the meantime: the core HOS rules are — **11h drive limit**, **14h on-duty window**, **30-min break after 8h driving**, **70h/8-day cycle**.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputVal);
  };

  const isActive = (path: string) => location.pathname === path;

  const quickSuggestions = [
    'What are the daily HOS driving limits?',
    'Explain the 30-minute rest break rule.',
    'What triggers a 34-hour restart?',
    'How does the 14-hour window work?',
    'What is the 70-hour/8-day cycle?',
  ];

  return (
    <div className="flex flex-col h-full w-full bg-background text-on-background min-h-screen">
      {/* Top Nav Bar */}
      <nav className="bg-surface-container-lowest border-b border-border-subtle flex justify-between items-center h-[64px] px-xl w-full sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-xl">
          <div className="font-headline-sm text-headline-sm font-semibold text-primary">
            LogisticsPro
          </div>
          <div className="hidden md:flex gap-md">
            <Link
              to="/"
              className={`px-sm py-xs border-b-2 transition-colors duration-300 ${isActive('/') ? 'text-primary border-primary' : 'text-secondary border-transparent hover:text-primary'}`}
            >
              Dashboard
            </Link>
            <Link
              to="/planner"
              className={`px-sm py-xs border-b-2 transition-colors duration-300 ${isActive('/planner') ? 'text-primary border-primary' : 'text-secondary border-transparent hover:text-primary'}`}
            >
              Trips
            </Link>
            <Link
              to="/compliance"
              className={`px-sm py-xs border-b-2 transition-colors duration-300 ${isActive('/compliance') ? 'text-primary border-primary' : 'text-secondary border-transparent hover:text-primary'}`}
            >
              Compliance
            </Link>
            <Link
              to="/map"
              className={`px-sm py-xs border-b-2 transition-colors duration-300 ${isActive('/map') ? 'text-primary border-primary' : 'text-secondary border-transparent hover:text-primary'}`}
            >
              Map
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <button
            className="text-secondary hover:text-primary transition-colors duration-300"
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button
            className="text-secondary hover:text-primary transition-colors duration-300"
            title="Settings"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-surface-variant overflow-hidden border border-border-subtle flex items-center justify-center bg-primary-container text-on-primary-container font-bold text-sm">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden h-full">
        {/* Side Nav Bar */}
        <aside className="bg-surface-container-low flex flex-col w-[260px] h-full py-lg px-md z-40 border-r border-border-subtle shrink-0 hidden md:flex">
          <div className="mb-xl px-sm flex items-center gap-md">
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm flex-shrink-0">
              DC
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Dispatch Center
              </span>
              <span className="font-label-md text-label-md text-text-secondary">
                Active: 12 Units
              </span>
            </div>
          </div>

          <Link
            to="/planner"
            className="bg-primary text-on-primary font-label-md text-label-md font-semibold h-[44px] rounded-lg mb-lg hover:bg-primary-fixed-variant transition-colors flex items-center justify-center gap-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Trip Request
          </Link>

          <nav className="flex-1 flex flex-col gap-xs">
            {[
              { to: '/', icon: 'dashboard', label: 'Dashboard' },
              { to: '/planner', icon: 'route', label: 'Trip Planner' },
              { to: '/map', icon: 'map', label: 'Route Map' },
              { to: '/compliance', icon: 'gavel', label: 'Compliance' },
              { to: '/history', icon: 'history', label: 'History' },
            ].map(({ to, icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`rounded-xl flex items-center gap-sm px-md py-sm transition-all duration-150 ${
                  isActive(to)
                    ? 'bg-primary-container text-on-primary-container font-semibold'
                    : 'text-secondary hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
                <span className="font-label-md text-label-md">{label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-lg border-t border-border-subtle flex flex-col gap-xs">
            <a
              href="#"
              className="text-secondary hover:text-primary hover:bg-surface-container-high rounded-xl flex items-center gap-sm px-md py-sm transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">help</span>
              <span className="font-label-md text-label-md">Support</span>
            </a>
            <button
              onClick={() => logout()}
              className="w-full text-left text-secondary hover:text-error hover:bg-error-container/20 rounded-xl flex items-center gap-sm px-md py-sm transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span className="font-label-md text-label-md">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-surface overflow-hidden h-full relative">
          {children}
        </main>

        {/* AI Assistant Drawer */}
        <div
          className={`fixed right-0 top-0 h-full z-[60] flex flex-col shadow-2xl bg-surface-container-lowest border-l border-border-subtle transition-transform duration-300 ease-in-out w-[340px] ${
            isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-lg border-b border-border-subtle flex justify-between items-center shrink-0 bg-surface-container-low">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
                AI Compliance Assistant
              </h2>
              <p className="font-body-md text-body-md text-secondary mt-xs text-xs">
                Powered by FMCSA HOS Knowledge Base
              </p>
            </div>
            <button
              className="text-secondary hover:text-primary transition-colors duration-300 p-xs rounded-lg hover:bg-surface-container"
              onClick={() => setDrawerOpen(false)}
            >
              <span className="material-symbols-outlined hover:rotate-90 transition-transform duration-300">
                close
              </span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-md overflow-y-auto flex flex-col gap-sm">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mr-xs shrink-0 mt-xs">
                    <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-lg p-sm text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary-container text-on-primary-container rounded-tr-none font-medium'
                      : 'bg-surface-container-high text-on-surface rounded-tl-none border border-border-subtle'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex items-center gap-xs pl-[28px]">
                <div className="bg-surface-container-high border border-border-subtle rounded-lg px-sm py-xs flex gap-xs items-center">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length === 1 && (
            <div className="px-md py-sm bg-surface-container-low/40 border-t border-border-subtle flex flex-col gap-xs shrink-0">
              <span className="font-label-md text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                Suggested Questions:
              </span>
              {quickSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="text-left text-[11px] bg-surface-container-lowest hover:bg-surface-container border border-border-subtle px-sm py-xs rounded transition-colors text-text-secondary hover:text-text-primary"
                  onClick={() => handleSendMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={handleFormSubmit}
            className="p-md border-t border-border-subtle bg-surface-bright shrink-0"
          >
            <div className="flex items-center border border-border-subtle rounded-lg px-md py-xs bg-surface-container-lowest focus-within:border-primary transition-colors duration-300">
              <input
                className="flex-1 border-0 bg-transparent focus:ring-0 font-body-md text-body-md px-0 py-sm outline-none text-xs placeholder-secondary"
                placeholder="Ask about HOS rules, compliance..."
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !inputVal.trim()}
                className="text-primary ml-sm hover:scale-110 disabled:opacity-40 transition-transform duration-300"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
            <p className="text-[10px] text-text-secondary mt-xs text-center">
              RAG-powered • FMCSA HOS knowledge base
            </p>
          </form>
        </div>

        {/* Floating Chat Button */}
        <button
          className="fixed bottom-xl right-xl w-[56px] h-[56px] bg-primary-container text-on-primary-container rounded-full shadow-lg flex items-center justify-center hover:opacity-90 hover:scale-110 hover:-rotate-12 transition-all duration-300 z-50 animate-float"
          onClick={() => setDrawerOpen(true)}
          title="Open AI Assistant"
        >
          <span className="material-symbols-outlined text-[24px]">chat</span>
        </button>
      </div>
    </div>
  );
};

export default Layout;
