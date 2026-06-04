import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code, Box, Briefcase, Cpu, ChevronRight, ChevronDown, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const TRACKS = [
  {
    id: 'engineering',
    title: 'Engineering track',
    desc: 'Build and ship technical systems',
    icon: Code,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    roles: [
      'Software Engineering (SWE)',
      'Artificial Intelligence (AI) / Machine Learning (ML)',
      'Data Analytics (DA) & Business Intelligence (BI)',
      'Data Engineering',
      'Cloud Engineering / DevOps'
    ]
  },
  {
    id: 'product',
    title: 'Product & analytics track',
    desc: 'Shape product and evidence-based decisions',
    icon: Box,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    roles: [
      'Product Management (PM)',
      'Product Growth / Growth PM',
      'Business Analytics (BA)',
      'UI/UX / Product Design'
    ]
  },
  {
    id: 'business',
    title: 'Tech-enabled business roles',
    desc: 'Delivery, growth, and operations with a tech lens',
    icon: Briefcase,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    roles: [
      'Project Management (Tech Projects)',
      'Business Development (Tech Industry)',
      'Digital Marketing (Tech-focused)',
      'Operations (Tech Operations / Process Automation)'
    ]
  },
  {
    id: 'ai',
    title: 'AI applications',
    desc: 'Applied AI as product, workflow, or core lever',
    icon: Cpu,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    roles: [
      'AI/ML Engineer',
      'AI Product Manager',
      'Prompt Engineer'
    ]
  }
];

export default function RoleSelection({ selectedRole, setSelectedRole }: { selectedRole: string | null, setSelectedRole: (role: string | null) => void }) {
  const navigate = useNavigate();
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);

  const handleNext = () => {
    if (selectedRole) {
      localStorage.setItem('px_target_role', selectedRole);
      navigate('/cv-workshop');
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-white w-full flex flex-col items-center pt-16 pb-12 px-6">
      
      <div className="w-full max-w-4xl max-w-[900px]">
        <h1 className="text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight mb-3">Where are you heading?</h1>
        <p className="text-lg text-slate-500 font-medium mb-12">
          Choose your career pillar, then pick the role that fits. We'll build<br/>your workspace around it.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {TRACKS.map((track) => {
            const isExpanded = expandedTrack === track.id;
            const hasSelectedRole = track.roles.includes(selectedRole || '');
            const isActiveStyle = isExpanded || hasSelectedRole;

            return (
              <div 
                key={track.id}
                className={cn(
                  "border rounded-2xl transition-all duration-200 overflow-hidden",
                  isActiveStyle 
                    ? "border-blue-500 ring-1 ring-blue-500/20 shadow-sm" 
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div 
                  className={cn(
                    "flex px-6 py-6 items-center gap-5 cursor-pointer relative",
                    isActiveStyle ? "bg-white" : "bg-white"
                  )}
                  onClick={() => {
                    setExpandedTrack(isExpanded ? null : track.id);
                  }}
                >
                  <div className={cn(
                    "w-12 h-12 flex shrink-0 items-center justify-center rounded-xl",
                    isActiveStyle ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "bg-blue-50 text-blue-600"
                  )}>
                    <track.icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 pr-6">
                    <h3 className="text-[17px] font-bold text-slate-900 leading-tight mb-1">{track.title}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-snug">{track.desc}</p>
                  </div>

                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-slate-50/50 border-t border-slate-100"
                    >
                      <div className="p-6">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-blue-600 mb-4 px-1">Select a specific role →</div>
                        <div className="flex flex-col gap-2.5">
                          {track.roles.map((role) => (
                            <div
                              key={role}
                              onClick={() => setSelectedRole(role === selectedRole ? null : role)}
                              className={cn(
                                "px-4 py-3.5 rounded-xl text-[14px] font-medium cursor-pointer transition-all",
                                role === selectedRole 
                                  ? "bg-blue-100 text-blue-700 shadow-inner border border-blue-200/50" 
                                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                              )}
                            >
                              {role}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-8 mt-12 pb-20">
          <span className="text-sm font-medium text-slate-500">
            {selectedRole ? `Selected: ${selectedRole}` : "Now pick a specific role"}
          </span>
          <button
            onClick={handleNext}
            disabled={!selectedRole}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all text-sm",
              selectedRole 
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            Next Step <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
