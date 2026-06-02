import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTripStore } from '../store';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDrawerOpen, setDrawerOpen } = useTripStore();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex flex-col h-full w-full bg-background text-on-background min-h-screen">
      {/* TopNavBar */}
      <nav className="bg-surface-container-lowest border-b border-border-subtle flex justify-between items-center h-[64px] px-xl w-full sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-xl">
          <div className="font-headline-sm text-headline-sm font-semibold text-primary">
            LogisticsPro
          </div>
          <div className="hidden md:flex gap-md">
            <Link to="/" className={`px-sm py-xs border-b-2 transition-colors duration-300 ${isActive('/') ? 'text-primary border-primary' : 'text-secondary border-transparent hover:text-primary'}`}>Dashboard</Link>
            <Link to="/planner" className={`px-sm py-xs border-b-2 transition-colors duration-300 ${isActive('/planner') ? 'text-primary border-primary' : 'text-secondary border-transparent hover:text-primary'}`}>Trips</Link>
            <Link to="/compliance" className={`px-sm py-xs border-b-2 transition-colors duration-300 ${isActive('/compliance') ? 'text-primary border-primary' : 'text-secondary border-transparent hover:text-primary'}`}>Compliance</Link>
            <a className="text-secondary hover:text-primary transition-colors duration-300 cursor-pointer active:opacity-70 px-sm py-xs border-b-2 border-transparent" href="#">Fleet</a>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <button className="text-secondary hover:text-primary transition-colors duration-300">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-secondary hover:text-primary transition-colors duration-300">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-surface-variant overflow-hidden border border-border-subtle">
            <img alt="User Profile Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWZrOnL4Sr8D8QzvFcuVGVI1dUjo6Nu2Eg1l9DUIGPuKi9Fli8sOvahlH76-Cy8UHo2qtKnywssurjiEVHfJ1c0XaOmPxpUIBvLJ8tLIQpGiaOQa5bzic71y3uGp8qwwhFajKdims0M-NwOm2Blf2i1ZRI5xSQiTkeL3xnb__4XiezXla8rRlYM8lkqAoqXNumrcaqyfSW6qr-w3Em0uQyxBK-05aW0GK9AEKexQvHcPC_eNmrFlK4C01aaZa2I3ECemuZpUP6Is8" />
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden h-full">
        {/* SideNavBar */}
        <aside className="bg-surface-container-low flex flex-col w-[260px] h-full py-lg px-md z-40 border-r border-border-subtle shrink-0 hidden md:flex">
          <div className="mb-xl px-sm flex items-center gap-md">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden flex-shrink-0">
               <img alt="Carrier Logo" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnZFfHuXOwHjyCJZtBKncRTxj2blpJMjn7vhygpoWUu_08gfm1Gx4ymSxiNyMC2t5nDGimpWu1HSDyB4yj77xb02C8hIQQ8qVKJ5F4JJkTVapeQ6k3ApVhmIGyp4U_YtCmFunGoFxApAHRwyyI_WA1jjK08QaN9-52s5oaoopxwJpqs25IPquf8JwHpKSkWBxpUi1WWnqsv6hhySOdzfAdFk9I1GLpYYd4e_cR6ERQPhG9Ik0waXbl8psrbHFEWKIX8cluEP2Vkws"/>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Dispatch Center</span>
              <span className="font-label-md text-label-md text-text-secondary">Active: 12 Units</span>
            </div>
          </div>
          <button className="bg-primary text-on-primary font-label-md text-label-md font-semibold h-[44px] rounded-lg mb-lg hover:bg-primary-fixed-variant transition-colors flex items-center justify-center gap-sm">
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Trip Request
          </button>
          <nav className="flex-1 flex flex-col gap-xs">
            <Link to="/" className={`rounded-xl flex items-center gap-sm px-md py-sm transition-all duration-150 scale-95 active:scale-90 ${isActive('/') ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-secondary hover:bg-surface-container-highest'}`}>
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span className="font-label-md text-label-md">Dashboard</span>
            </Link>
            <Link to="/planner" className={`rounded-xl flex items-center gap-sm px-md py-sm transition-all duration-150 scale-95 active:scale-90 ${isActive('/planner') ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-secondary hover:bg-surface-container-highest'}`}>
              <span className="material-symbols-outlined text-[20px]">route</span>
              <span className="font-label-md text-label-md">Trip Planner</span>
            </Link>
            <Link to="/map" className={`rounded-xl flex items-center gap-sm px-md py-sm transition-all duration-150 scale-95 active:scale-90 ${isActive('/map') ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-secondary hover:bg-surface-container-highest'}`}>
              <span className="material-symbols-outlined text-[20px]">map</span>
              <span className="font-label-md text-label-md">Route Map</span>
            </Link>
            <Link to="/compliance" className={`rounded-xl flex items-center gap-sm px-md py-sm transition-all duration-150 scale-95 active:scale-90 ${isActive('/compliance') ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-secondary hover:bg-surface-container-highest'}`}>
              <span className="material-symbols-outlined text-[20px]">gavel</span>
              <span className="font-label-md text-label-md">Compliance</span>
            </Link>
            <Link to="/history" className={`rounded-xl flex items-center gap-sm px-md py-sm transition-all duration-150 scale-95 active:scale-90 ${isActive('/history') ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-secondary hover:bg-surface-container-highest'}`}>
              <span className="material-symbols-outlined text-[20px]" style={isActive('/history') ? {fontVariationSettings: "'FILL' 1, 'wght' 400"} : {}}>history</span>
              <span className="font-label-md text-label-md">History</span>
            </Link>
          </nav>
          <div className="mt-auto pt-lg border-t border-border-subtle flex flex-col gap-xs">
            <a className="text-secondary hover:text-primary hover:bg-surface-container-high rounded-xl flex items-center gap-sm px-md py-sm transition-all" href="#">
              <span className="material-symbols-outlined text-[20px]">help</span>
              <span className="font-label-md text-label-md">Support</span>
            </a>
            <a className="text-secondary hover:text-primary hover:bg-surface-container-high rounded-xl flex items-center gap-sm px-md py-sm transition-all" href="#">
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span className="font-label-md text-label-md">Sign Out</span>
            </a>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-surface overflow-hidden h-full relative">
           {children}
        </main>

        {/* NavigationDrawer (AI Assistant) */}
        <div className={`fixed right-0 top-0 h-full z-[60] flex flex-col shadow-2xl bg-surface-container-lowest border-l border-border-subtle transition-transform duration-300 ease-in-out w-[320px] ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-lg border-b border-border-subtle flex justify-between items-center">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">AI Logistics Assistant</h2>
              <p className="font-body-md text-body-md text-secondary mt-xs">Ask about routes or compliance</p>
            </div>
            <button className="text-secondary hover:text-primary transition-colors duration-300" onClick={() => setDrawerOpen(false)}>
              <span className="material-symbols-outlined hover:rotate-90 transition-transform duration-300">close</span>
            </button>
          </div>
          <div className="flex border-b border-border-subtle">
            <button className="flex-1 py-sm text-primary font-bold border-b-2 border-primary font-label-md text-label-md transition-colors duration-300 flex justify-center items-center">
              <span className="material-symbols-outlined align-middle mr-xs text-[18px]">chat_bubble</span>Chat
            </button>
          </div>
          <div className="flex-1 p-md overflow-y-auto">
            <div className="text-secondary font-body-md text-body-md text-center mt-xl">How can I help with your route today?</div>
          </div>
          <div className="p-md border-t border-border-subtle">
            <div className="flex items-center border border-border-subtle rounded-lg px-md py-xs bg-surface-container-lowest focus-within:border-primary transition-colors duration-300">
              <input className="flex-1 border-0 bg-transparent focus:ring-0 font-body-md text-body-md px-0 py-sm outline-none" placeholder="Type a message..." type="text" />
              <button className="text-primary ml-sm hover:scale-110 transition-transform duration-300"><span className="material-symbols-outlined">send</span></button>
            </div>
          </div>
        </div>

        {/* Floating Action Button for AI */}
        <button className="fixed bottom-xl right-xl w-[56px] h-[56px] bg-primary-container text-on-primary-container rounded-full shadow-lg flex items-center justify-center hover:opacity-90 hover:scale-110 hover:-rotate-12 transition-all duration-300 z-50 animate-float" onClick={() => setDrawerOpen(true)}>
          <span className="material-symbols-outlined text-[24px]">chat</span>
        </button>
      </div>
    </div>
  );
};

export default Layout;
