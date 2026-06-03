import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building, Globe, Send, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface JobSearchProps {
  geminiKey: string;
  cvAnalysis: any;
  onRequireKey: () => void;
}

export default function JobSearch({ geminiKey, cvAnalysis, onRequireKey }: JobSearchProps) {
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlMessage, setCrawlMessage] = useState('');
  
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleCrawlJobs = async () => {
    setIsCrawling(true);
    setCrawlMessage('');
    try {
      const res = await fetch('/api/jobs/crawl', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCrawlMessage(data.message);
    } catch(err: any) {
      setCrawlMessage('Failed to crawl jobs: ' + err.message);
    } finally {
      setIsCrawling(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    setError('');
    
    try {
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          cvSummary: cvAnalysis?.analysis?.extracted_summary,
          cvSkills: cvAnalysis?.analysis?.extracted_skills,
          apiKey: geminiKey
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setJobs(data.results || []);
    } catch(err: any) {
      setError(err.message);
      if (err.message.includes('API_KEY')) {
        onRequireKey();
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 h-full">
      
      {/* Sidebar: Chat / Search */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        
        {/* Crawl Data Control */}
        <div className="bg-[#0F0F0F] rounded-2xl shadow-sm border border-white/10 p-5">
          <h3 className="text-sm font-semibold text-white mb-2">Job Data Source</h3>
          <p className="text-xs text-slate-400 mb-4 tracking-tight">Sync latest jobs from Decoda API (TopCV, LinkedIn) to Supabase.</p>
          <button 
            onClick={handleCrawlJobs}
            disabled={isCrawling}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors disabled:opacity-75"
          >
            {isCrawling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {isCrawling ? 'Crawling Jobs...' : 'Crawl Jobs'}
          </button>
          
          <AnimatePresence>
            {crawlMessage && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 overflow-hidden">
                <p className="text-xs p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">{crawlMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat / Query Box */}
        <div className="bg-[#0F0F0F] rounded-2xl shadow-sm border border-white/10 p-5 flex-1 flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Find Your Dream Job
          </h3>
          <p className="text-xs text-slate-400 mb-4 tracking-tight">
            Describe the role you want. We'll find matches based on this and your uploaded CV.
          </p>
          
          <form onSubmit={handleSearch} className="mt-auto relative">
            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g. I am looking for a remote React frontend developer role with a modern tech stack..."
              className="w-full resize-none h-32 p-3 bg-[#1A1A1A] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 shadow-inner transition-all placeholder:text-slate-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
            <div className="absolute bottom-3 right-3">
              <button 
                type="submit"
                disabled={isSearching}
                className="bg-indigo-600 w-8 h-8 flex items-center justify-center text-white rounded-lg hover:bg-indigo-500 disabled:opacity-75 transition-colors shadow-lg"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>
          
          {!cvAnalysis && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              You haven't uploaded a CV. Search results will only be based on your prompt above.
            </div>
          )}
        </div>
      </div>
      
      {/* Main: Job Results */}
      <div className="w-full md:w-2/3 flex flex-col h-full">
        <div className="bg-[#0F0F0F] rounded-2xl shadow-sm border border-white/10 p-6 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h2 className="text-xl font-bold text-white">Matching Jobs</h2>
            <span className="text-sm text-indigo-400 font-medium px-3 py-1 bg-indigo-500/10 rounded-full">{jobs.length} results</span>
          </div>
          
          {error && (
             <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm shrink-0">
               {error}
             </div>
          )}

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {jobs.length === 0 && !isSearching && !error && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p>Run a search to see AI-evaluated jobs here.</p>
              </div>
            )}
            
            {jobs.map((job, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-5 hover:border-indigo-500/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-white font-semibold leading-tight mb-1 group-hover:text-indigo-400 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {job.company}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                    </div>
                  </div>
                  
                  {/* Fit Score Badge */}
                  <div className="text-right">
                    <div className={cn(
                      "inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter",
                      job.fit_percent >= 80 ? "bg-emerald-500/10 text-emerald-400" :
                      job.fit_percent >= 50 ? "bg-amber-500/10 text-amber-400" :
                      "bg-red-500/10 text-red-400"
                    )}>
                      {job.fit_percent}% Fit
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/5 text-sm">
                  <h4 className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    AI Fit Analysis
                  </h4>
                  <p className="text-slate-400 leading-relaxed text-xs">
                    {job.fit_reason}
                  </p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">
                    Crawled via {job.source || 'Decoda'}
                  </span>
                  
                  {job.url && (
                    <a 
                      href={job.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
                    >
                      View Original Job &rarr;
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
