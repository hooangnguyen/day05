import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

import { useNavigate } from 'react-router-dom';

interface CVUploaderProps {
  cvAnalysis: any;
  setCvAnalysis: (data: any) => void;
  cvText?: string | null;
  setCvText?: (text: string | null) => void;
  cvFile?: File | null;
  setCvFile?: (file: File | null) => void;
}

export default function CVUploader({ cvAnalysis, setCvAnalysis, cvFile, setCvFile }: CVUploaderProps) {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      if (setCvFile) setCvFile(acceptedFiles[0]);
      setError('');
      // Navigate straight to role selection
      navigate('/role');
    }
  }, [setCvFile, navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  return (
    <div className="flex flex-col h-full bg-white px-6 py-10 lg:px-12 items-center justify-center">
      <div className="max-w-xl mx-auto w-full flex flex-col text-center">
        <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Upload your CV</h1>
        <p className="text-slate-500 mb-8 text-base">We'll use this to evaluate your fit and give you custom improvement tips based on your target role.</p>
        
        <div 
          {...getRootProps()} 
          className={cn(
            "bg-white rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center cursor-pointer transition-all text-center relative overflow-hidden group w-full",
            isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
          )}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="text-lg text-slate-900 font-bold tracking-tight mb-1">Click to upload or drag and drop</p>
          <p className="text-sm text-slate-500 font-medium tracking-tight">PDF or TXT files only (Max 5MB)</p>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
      </div>
    </div>
    
  );
}
