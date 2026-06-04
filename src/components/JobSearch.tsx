import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building, Globe, Send, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface JobSearchProps {
  cvAnalysis?: any;
  selectedRole?: string | null;
  cvData?: any;
}

export default function JobSearch({ cvAnalysis, selectedRole, cvData }: JobSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    setError('');
    
    try {
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query || selectedRole || 'software engineer',
          cvData: cvData || cvAnalysis?.analysis?.parsed_cv,
          cvSummary: cvAnalysis?.analysis?.extracted_summary,
          cvSkills: cvAnalysis?.analysis?.extracted_skills,
          cvLocation: cvData?.location || cvAnalysis?.analysis?.extracted_location
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setJobs(data.results || []);
      setHasSearched(true);
    } catch(err: any) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!hasSearched && (selectedRole || cvAnalysis || cvData)) {
      handleSearch();
    }
  }, [selectedRole, cvAnalysis, cvData]);

  return (
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 w-full p-6 lg:p-10 lg:h-full bg-white">
      
      {/* Sidebar: Chat / Search */}
      <div className="w-full md:w-1/3 flex flex-col gap-6 h-full pb-8 lg:pb-0">
        
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Tìm việc</h1>
          <p className="text-slate-500 text-sm">Khám phá và đánh giá các cơ hội phù hợp với CV của bạn.</p>
        </div>

        {/* Chat / Query Box */}
        <div className="bg-blue-50/50 rounded-2xl shadow-sm border border-blue-100 p-6 flex flex-col shrink-0 flex-1 lg:flex-none">
          <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            AI Đề xuất Công việc
          </h3>
          <p className="text-xs text-slate-600 mb-5 tracking-tight">
            Mô tả vị trí bạn mong muốn. Chúng tôi sẽ tìm kiếm dựa trên yêu cầu này và CV của bạn.
          </p>
          
          <form onSubmit={handleSearch} className="relative mt-auto">
            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`VD: Tôi đang tìm kiếm vị trí ${selectedRole || 'frontend developer'} làm việc remote với mức lương...`}
              className="w-full resize-none h-36 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 font-medium"
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
                className="bg-blue-600 w-10 h-10 flex items-center justify-center text-white rounded-lg hover:bg-blue-700 disabled:opacity-75 transition-colors shadow-sm"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
          
          {!cvAnalysis && !cvData && (
             <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-orange-500" />
              Bạn chưa tải lên CV. Kết quả tìm kiếm sẽ chỉ dựa trên mô tả phía trên.
            </div>
          )}
        </div>
      </div>
      
      {/* Main: Job Results */}
      <div className="w-full md:w-2/3 flex flex-col h-full lg:overflow-hidden lg:pl-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h2 className="text-xl font-bold text-slate-900">Công việc Phù hợp</h2>
            <span className="text-sm text-blue-600 font-bold px-3 py-1 bg-blue-50 rounded-full border border-blue-100">{jobs.length} kết quả</span>
          </div>
          
          {error && (
             <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm shrink-0 font-medium">
               {error}
             </div>
          )}

          <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar pb-6">
            {jobs.length === 0 && !isSearching && !error && (
              <div className="h-[200px] flex flex-col items-center justify-center text-center p-8 text-slate-500">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                   <Search className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-medium text-sm">Thực hiện tìm kiếm để xem các vị trí được AI đánh giá.</p>
              </div>
            )}

            {isSearching && jobs.length === 0 && (
              <div className="h-[200px] flex flex-col items-center justify-center text-center p-8 text-blue-600">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-bold">Đang tìm kiếm công việc phù hợp với bạn...</p>
              </div>
            )}
            
            {jobs.map((job, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h3 className="text-slate-900 text-lg font-bold leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1.5"><Building className="w-4 h-4 text-slate-400" /> {job.company}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {job.location}</span>
                    </div>
                  </div>
                  
                  {/* Fit Score Badge */}
                  <div className="text-right shrink-0">
                    <div className={cn(
                      "inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider",
                      job.fit_percent >= 80 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      job.fit_percent >= 50 ? "bg-orange-50 text-orange-700 border border-orange-200" :
                      "bg-red-50 text-red-700 border border-red-200"
                    )}>
                      {job.fit_percent}% Phù hợp
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 p-5 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    AI Phân tích mức độ phù hợp
                  </h4>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {job.fit_reason}
                  </p>
                </div>
                
                <div className="mt-5 pt-5 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Nguồn: {job.source || 'RapidAPI'}
                  </span>
                  
                  {job.url && (
                    <a 
                      href={job.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 font-bold hover:text-blue-700 transition-colors flex items-center gap-1"
                    >
                      Xem chi tiết &rarr;
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
