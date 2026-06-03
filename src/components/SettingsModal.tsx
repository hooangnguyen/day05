import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsModalProps {
  onClose: () => void;
  geminiKey: string;
  setGeminiKey: (k: string) => void;
}

export default function SettingsModal({ onClose, geminiKey, setGeminiKey }: SettingsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0F0F0F] border border-white/10 rounded-xl shadow-2xl p-6 w-full max-w-md relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold mb-6 text-white">Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="gemini" className="block text-sm font-medium text-slate-300 mb-1">
              Gemini API Key
            </label>
            <input 
              id="gemini"
              type="password"
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg focus:ring-0 focus:border-indigo-500 outline-none transition-all text-sm text-indigo-400 placeholder:text-slate-600"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-2">
              Used for CV analysis and Job matching (Gemini 2.5 Flash Lite). If left blank, the app will try to use the server's configured environment variable.
            </p>
          </div>
          
          <div className="pt-4 border-t border-white/5">
            <h3 className="text-sm font-medium text-white mb-2">Supabase & Decoda API</h3>
            <p className="text-xs text-slate-500">
              For this preview, Supabase and Decoda API integration is handled on the backend via environment variables (.env). A mock Decoda API is used if there are no external endpoints available.
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 transition-colors shadow-sm"
          >
            Save & Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
