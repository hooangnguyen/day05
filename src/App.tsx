/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Briefcase, Search, UploadCloud, ChevronRight, FileText, Target, LayoutTemplate } from 'lucide-react';
import CVUploader from './components/CVUploader';
import JobSearch from './components/JobSearch';
import RoleSelection from './pages/RoleSelection';
import CVWorkshop from './pages/CVWorkshop';

function Sidebar() {
  const location = useLocation();
  
  return (
    <aside className="w-16 lg:w-72 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 transition-all duration-300 z-20">
      <div className="flex items-center gap-3 p-4 lg:p-6 mb-4 border-b border-slate-200 bg-white">
        <div className="w-8 h-8 shrink-0 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm ring-1 ring-blue-600/20">
          X
        </div>
        <div className="hidden lg:flex flex-col">
          <span className="text-sm font-bold tracking-tight text-slate-900 leading-none">Career Survival Kit</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 mt-1 font-medium">Project X Vietnam</span>
        </div>
      </div>
      
      <nav className="flex-1 px-3 space-y-1">
        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3 px-3 hidden lg:block mt-2">
          Your Workspace
        </div>

        <NavLink 
          to="/upload" 
          className={({ isActive }) => `flex items-center justify-center lg:justify-between gap-3 p-3 rounded-xl transition-all duration-200 relative group overflow-hidden ${isActive ? 'bg-white text-blue-600 border border-slate-200 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent'}`}
        >
          {({ isActive }) => (
            <>
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-xl"></div>}
              <div className="flex items-center gap-3">
                <UploadCloud className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="hidden lg:block font-medium text-sm">Upload CV</span>
              </div>
            </>
          )}
        </NavLink>
        
        <NavLink 
          to="/role" 
          className={({ isActive }) => `flex items-center justify-center lg:justify-between gap-3 p-3 rounded-xl transition-all duration-200 relative group overflow-hidden ${isActive ? 'bg-white text-blue-600 border border-slate-200 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent'}`}
        >
          {({ isActive }) => (
            <>
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-xl"></div>}
              <div className="flex items-center gap-3">
                <Target className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="hidden lg:block font-medium text-sm">Role Selection</span>
              </div>
            </>
          )}
        </NavLink>

        <NavLink 
          to="/cv-workshop" 
          className={({ isActive }) => `flex items-center justify-center lg:justify-between gap-3 p-3 rounded-xl transition-all duration-200 relative group overflow-hidden ${isActive ? 'bg-white text-blue-600 border border-slate-200 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent'}`}
        >
          {({ isActive }) => (
            <>
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-xl"></div>}
              <div className="flex items-center gap-3">
                <LayoutTemplate className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="hidden lg:block font-medium text-sm">CV Workshop</span>
              </div>
            </>
          )}
        </NavLink>

        <div className="my-4 border-t border-slate-200 mx-3"></div>

        <NavLink 
          to="/job-search" 
          className={({ isActive }) => `flex items-center justify-center lg:justify-between gap-3 p-3 rounded-xl transition-all duration-200 relative group overflow-hidden ${isActive ? 'bg-white text-blue-600 border border-slate-200 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent'}`}
        >
          {({ isActive }) => (
            <>
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-xl"></div>}
              <div className="flex items-center gap-3">
                <Search className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="hidden lg:block font-medium text-sm">Find Jobs</span>
              </div>
            </>
          )}
        </NavLink>
      </nav>

      <div className="mt-auto p-4 lg:p-6 bg-white border-t border-slate-200">
        <div className="flex items-center justify-center lg:justify-start gap-3">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-xs text-slate-500 hidden lg:block font-medium">Systems Online</span>
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  const [cvFile, setCvFile] = React.useState<File | null>(null);
  const [cvText, setCvText] = React.useState<string | null>(null);
  const [cvAnalysis, setCvAnalysis] = React.useState<any>(null);
  const [selectedRole, setSelectedRole] = React.useState<any>(null);
  const [editedCvData, setEditedCvData] = React.useState<any>(null);

  // Sync initial parsed CV to edited state when available
  React.useEffect(() => {
    if (cvAnalysis?.analysis?.parsed_cv && !editedCvData) {
      setEditedCvData(cvAnalysis.analysis.parsed_cv);
    }
  }, [cvAnalysis]);

  return (
    <BrowserRouter>
      <div className="w-full h-screen bg-slate-50 text-slate-900 flex font-sans overflow-hidden max-w-[100vw]">
        <Sidebar />

        {/* Main Interface Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full bg-white">
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className="h-full w-full mx-auto flex flex-col">
              <Routes>
                <Route path="/" element={<Navigate to="/upload" replace />} />
                <Route 
                  path="/upload" 
                  element={
                    <CVUploader 
                      cvAnalysis={cvAnalysis} 
                      setCvAnalysis={setCvAnalysis} 
                      cvText={cvText}
                      setCvText={setCvText}
                      cvFile={cvFile}
                      setCvFile={setCvFile}
                    />
                  } 
                />
                <Route path="/role" element={<RoleSelection selectedRole={selectedRole} setSelectedRole={setSelectedRole} />} />
                <Route path="/cv-workshop" element={<CVWorkshop cvAnalysis={cvAnalysis} setCvAnalysis={setCvAnalysis} cvText={cvText} cvFile={cvFile} selectedRole={selectedRole} cvData={editedCvData} setCvData={setEditedCvData} />} />
                <Route 
                  path="/job-search" 
                  element={
                    <JobSearch 
                      cvAnalysis={cvAnalysis}
                      selectedRole={selectedRole}
                      cvData={editedCvData}
                    />
                  } 
                />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
