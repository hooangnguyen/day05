import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface CVUploaderProps {
  geminiKey: string;
  cvAnalysis: any;
  setCvAnalysis: (data: any) => void;
  onRequireKey: () => void;
}

export default function CVUploader({ geminiKey, cvAnalysis, setCvAnalysis, onRequireKey }: CVUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  const analyzeCV = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('cv', file);
    if (geminiKey) formData.append('apiKey', geminiKey);
    
    try {
      const res = await fetch('/api/cv/analyze', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze CV');
      }
      
      setCvAnalysis({
        text: data.cvText,
        analysis: data.analysis
      });
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('API_KEY')) {
        onRequireKey();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-[#0F0F0F] rounded-2xl shadow-sm border border-white/10 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Upload your CV</h2>
          <p className="text-slate-400 mt-2">Get AI-powered feedback and keyword analysis to improve your resume.</p>
        </div>
        
        <div 
          {...getRootProps()} 
          className={cn(
            "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors text-center",
            isDragActive ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 bg-black/40 hover:bg-white/5 hover:border-white/20"
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className={cn("w-12 h-12 mb-4", isDragActive ? "text-indigo-400" : "text-slate-400")} />
          {isDragActive ? (
            <p className="text-indigo-400 font-medium tracking-tight">Drop your CV here...</p>
          ) : (
             <p className="text-slate-300 font-medium">
               Drag & drop your CV here, or <span className="text-indigo-400">browse</span>
             </p>
          )}
          <p className="text-xs text-slate-500 mt-2">Supports PDF and TXT</p>
        </div>

        {file && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center justify-between p-4 bg-[#1A1A1A] border border-white/5 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <FileText className="text-indigo-400 w-6 h-6" />
              <div>
                <p className="text-sm font-medium text-white">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              onClick={analyzeCV}
              disabled={isLoading}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Analyzing...' : 'Analyze CV'}
            </button>
          </motion.div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {cvAnalysis && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="md:col-span-2 space-y-6">
            <div className="bg-[#0F0F0F] rounded-2xl shadow-sm border border-white/10 p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Overall Feedback
              </h3>
              <p className="text-slate-300 leading-relaxed text-sm bg-black/40 p-4 rounded-xl border border-dashed border-white/5">
                {cvAnalysis.analysis.overall_feedback}
              </p>
            </div>
            
            <div className="bg-[#0F0F0F] rounded-2xl shadow-sm border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Actionable Suggestions</h3>
              <ul className="space-y-3">
                {cvAnalysis.analysis.improvement_suggestions.map((sug: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-300 bg-[#1A1A1A] p-4 rounded-xl border border-white/5">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">{i+1}</span>
                    <span className="mt-0.5 leading-relaxed">{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-[#0F0F0F] rounded-2xl shadow-sm border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Summary Profile</h3>
              <p className="text-sm text-slate-300 leading-relaxed bg-[#1A1A1A] p-4 rounded-xl border border-white/5">
                {cvAnalysis.analysis.extracted_summary}
              </p>
            </div>
            
            <div className="bg-[#0F0F0F] rounded-2xl shadow-sm border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Detected Skills</h3>
              <div className="flex flex-wrap gap-2">
                {cvAnalysis.analysis.extracted_skills.map((skill: string, i: number) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
