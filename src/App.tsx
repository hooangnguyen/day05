/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Upload, Briefcase, Search, Settings } from 'lucide-react';
import CVUploader from './components/CVUploader';
import JobSearch from './components/JobSearch';
import SettingsModal from './components/SettingsModal';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'cv' | 'jobs'>('cv');
  const [showSettings, setShowSettings] = useState(false);

  // App State
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('geminiKey') || '');
  const [cvAnalysis, setCvAnalysis] = useState<any>(null);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200 font-sans">
      <header className="bg-[#0D0D0D] border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 text-indigo-500">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold"><Briefcase className="w-5 h-5" /></div>
            <h1 className="text-xl font-semibold tracking-tight text-white">CareerAI</h1>
          </div>
          
          <div className="flex gap-4">
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('cv')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'cv' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Upload className="w-4 h-4 inline-block mr-1" />
                CV Analysis
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'jobs' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Search className="w-4 h-4 inline-block mr-1" />
                Find Jobs
              </button>
            </nav>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              title="Settings & API Keys"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'cv' && (
            <motion.div
              key="cv"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <CVUploader 
                geminiKey={geminiKey} 
                cvAnalysis={cvAnalysis} 
                setCvAnalysis={setCvAnalysis} 
                onRequireKey={() => setShowSettings(true)}
              />
            </motion.div>
          )}

          {activeTab === 'jobs' && (
            <motion.div
              key="jobs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <JobSearch 
                geminiKey={geminiKey} 
                cvAnalysis={cvAnalysis}
                onRequireKey={() => setShowSettings(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)} 
          geminiKey={geminiKey}
          setGeminiKey={(v) => {
            setGeminiKey(v);
            localStorage.setItem('geminiKey', v);
          }}
        />
      )}
    </div>
  );
}
