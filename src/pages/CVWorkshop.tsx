import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MapPin, ExternalLink, Check, Lock, ChevronLeft, ChevronRight, LayoutDashboard, Search, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function CVWorkshop({ cvAnalysis, setCvAnalysis, selectedRole, cvFile, cvData: parentCvData, setCvData: setParentCvData }: { cvAnalysis?: any, setCvAnalysis?: any, selectedRole?: string | null, cvFile?: File | null, cvData?: any, setCvData?: any, cvText?: string | null }) {
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');

  useEffect(() => {
    if (cvFile && !cvAnalysis && !isAnalyzing && setCvAnalysis) {
      const runAnalysis = async () => {
        setIsAnalyzing(true);
        try {
          const formData = new FormData();
          formData.append('cv', cvFile);
          if (selectedRole) formData.append('role', selectedRole);

          const res = await fetch('/api/cv/analyze', {
            method: 'POST',
            body: formData,
          });
          
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to analyze");
          }
          const data = await res.json();
          setCvAnalysis({
            text: data.cvText,
            analysis: data.analysis
          });
        } catch(e: any) {
          setAnalyzeError(e.message);
        } finally {
          setIsAnalyzing(false);
        }
      }
      runAnalysis();
    }
  }, [cvFile, cvAnalysis, selectedRole, setCvAnalysis, isAnalyzing]);
  
  // Local state for CV data fallback if parent not available
  const [localCvData, setLocalCvData] = useState<any>(() => {
    if (cvAnalysis?.analysis?.parsed_cv) {
      return cvAnalysis.analysis.parsed_cv;
    }
    // Fallback data if no analysis or not structured yet
    return {
      name: "Quang Tran",
      role: "ML Engineer Fresher",
      email: "quang.tran.ai@gmail.com",
      location: "Vietnam",
      links: ["linkedin.com/in/quangtran-ai"],
      summary: "ML engineer with 2 years deploying models to production at a retail analytics company. Reduced inference latency 40% and shipped an automated retraining pipeline maintaining accuracy within 2% monthly.",
      experience: [
        {
          title: "ML Engineer Fresher",
          company: "Smart Retail Analytics",
          period: "Jan 2023–Present",
          bullets: [
            "Deployed product-recommendation model via FastAPI + Docker serving 100 RPS at <50ms p99 latency",
            "Reduced inference latency 40% through ONNX quantisation and batch-inference optimisation",
            "Built automated retraining pipeline triggered on data drift..."
          ]
        }
      ]
    };
  });

  const cvData = parentCvData || localCvData;
  const setCvData = setParentCvData || setLocalCvData;

  const [editingField, setEditingField] = useState<string | null>(null);

  const handleEdit = (field: string, value: any) => {
    setCvData((prev: any) => {
      const newData = { ...prev };
      // Handle nested updates simply
      if (field.startsWith('exp_')) {
         const parts = field.split('_');
         const idx = parseInt(parts[1], 10);
         const subfield = parts[2];
         if (subfield === 'bullet') {
             const bIdx = parseInt(parts[3], 10);
             newData.experience[idx].bullets[bIdx] = value;
         } else {
             newData.experience[idx][subfield] = value;
         }
      } else {
         newData[field] = value;
      }
      return newData;
    });
  };

  const toggleStep = (step: number) => {
    setCompletedSteps(prev => 
      prev.includes(step) ? prev.filter(s => s !== step) : [...prev, step]
    );
  };

  const baseSteps = selectedRole && selectedRole.includes("AI") ? [
    `Demonstrate impact in ${selectedRole} specific context (e.g. model accuracy, inference speed).`,
    "Highlight specific AI/ML frameworks used (PyTorch, TensorFlow, etc.).",
    "Quantify the business value of your AI models."
  ] : selectedRole ? [
    `Showcase concrete achievements related to ${selectedRole}.`,
    "List the exact tools and methodologies used in your roles.",
    "Quantify your impact with numbers and metrics."
  ] : [
    "Say what merged: tickets/PRs/small features — and that you went through review",
    "Stack proof: languages, frameworks, tests/CI, staging or prod if true",
    "One honest metric: bugs fixed, build time, coverage, pilot users — intern/first-role scale is fine"
  ];

  const aiSuggestions = cvAnalysis?.analysis?.improvement_suggestions || [];
  const steps = aiSuggestions.length > 0 ? aiSuggestions : baseSteps;

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 w-full">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Đang phân tích CV của bạn...</h2>
        <p className="text-slate-500 mt-2 font-medium">Hệ thống đang cấu trúc thông tin và đưa ra lời khuyên cho vị trí {selectedRole}.</p>
      </div>
    );
  }

  if (analyzeError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 w-full p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4">
          <Check className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Đã xảy ra lỗi</h2>
        <p className="text-red-600 mb-6 font-medium">{analyzeError}</p>
        <button onClick={() => navigate('/upload')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full overflow-hidden">
      
      {/* Workshop Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/role')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
              Career Survival Kit <span className="text-slate-300">/</span> <span className="text-blue-600">{selectedRole || 'CV Workshop'}</span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-2 mt-0.5">
              STEP 2 OF 3
            </h2>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-300">
             <div className="flex gap-0.5"><div className="w-2 h-2 rounded bg-slate-200"/><div className="w-2 h-2 rounded bg-slate-200"/><div className="w-2 h-2 rounded bg-slate-200"/></div> SUM
             <div className="flex gap-0.5 ml-2"><div className="w-2 h-2 rounded bg-blue-600 shadow-[0_0_5px_rgba(37,99,235,0.4)]"/><div className="w-2 h-2 rounded bg-slate-200"/><div className="w-2 h-2 rounded bg-slate-200"/></div> EXP
             <div className="flex gap-0.5 ml-2"><div className="w-2 h-2 rounded bg-slate-200"/><div className="w-2 h-2 rounded bg-slate-200"/><div className="w-2 h-2 rounded bg-slate-200"/></div> PROJ
          </div>
          <div className="flex items-center gap-3">
             <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-blue-600 w-[11%]" />
             </div>
             <span className="text-xs font-bold text-blue-600">1/9 completed</span>
          </div>
        </div>
      </div>

      {/* Main Workshop Content */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row max-w-[1440px] mx-auto w-full relative">
        
        {/* Left Side: Live Tool */}
        <div className="w-full lg:w-[45%] h-full overflow-y-auto px-6 py-8 border-r border-slate-200 bg-slate-50 custom-scrollbar relative z-10 flex justify-center pb-24">
          <div className="w-full max-w-xl">
               <div className="flex items-center gap-3 mb-6 bg-white border border-slate-200 px-4 py-2.5 rounded-full shadow-sm mx-auto w-fit">
               <div className="w-2 h-2 rounded-full bg-blue-600" />
               <span className="text-xs font-bold text-slate-700">Nhấp vào bất kỳ phần nào trên CV để chỉnh sửa</span>
             </div>

             {/* CV Paper */}
             <div className="bg-white w-full shadow-lg border border-slate-200 rounded-lg p-10 pt-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
                
                {/* Header */}
                <div className="mb-4">
                  {editingField === 'name' ? (
                    <input autoFocus value={cvData.name || ''} onChange={(e) => handleEdit('name', e.target.value)} onBlur={() => setEditingField(null)} className="text-3xl font-extrabold text-slate-900 tracking-tight w-full bg-slate-50 border-blue-500 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500" />
                  ) : (
                    <h1 onClick={() => setEditingField('name')} className="text-3xl font-extrabold text-slate-900 tracking-tight cursor-pointer hover:bg-slate-50 rounded px-2 py-1 -mx-2">{cvData.name || 'Họ và Tên'}</h1>
                  )}
                  
                  {editingField === 'role' ? (
                    <input autoFocus value={cvData.role || ''} onChange={(e) => handleEdit('role', e.target.value)} onBlur={() => setEditingField(null)} className="text-lg font-bold text-slate-700 mt-1 w-full bg-slate-50 border-blue-500 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500" />
                  ) : (
                    <h2 onClick={() => setEditingField('role')} className="text-lg font-bold text-slate-700 mt-1 cursor-pointer hover:bg-slate-50 rounded px-2 py-1 -mx-2">{cvData.role || 'Vị trí Ứng tuyển'}</h2>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500 mb-10">
                  {editingField === 'email' ? (
                     <input autoFocus value={cvData.email || ''} onChange={(e) => handleEdit('email', e.target.value)} onBlur={() => setEditingField(null)} className="bg-slate-50 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]" />
                  ) : (
                    <span onClick={() => setEditingField('email')} className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900"><Mail className="w-3.5 h-3.5"/> {cvData.email || 'Email'}</span>
                  )}

                  {editingField === 'location' ? (
                     <input autoFocus value={cvData.location || ''} onChange={(e) => handleEdit('location', e.target.value)} onBlur={() => setEditingField(null)} className="bg-slate-50 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]" />
                  ) : (
                    <span onClick={() => setEditingField('location')} className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900"><MapPin className="w-3.5 h-3.5"/> {cvData.location || 'Địa điểm'}</span>
                  )}
                </div>

                {/* Summary */}
                <div className="mb-10 content-section p-4 hover:bg-slate-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200">
                  <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">Tóm tắt Cảnh quan (Summary)</h3>
                  {editingField === 'summary' ? (
                     <textarea autoFocus value={cvData.summary || ''} onChange={(e) => handleEdit('summary', e.target.value)} onBlur={() => setEditingField(null)} className="w-full h-32 bg-slate-50 border-blue-500 rounded p-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-medium leading-relaxed resize-none" />
                  ) : (
                    <p onClick={() => setEditingField('summary')} className="text-sm text-slate-700 leading-relaxed font-medium">
                      {cvData.summary || 'Bấm vào đây để viết phần tóm tắt cho vị trí này...'}
                    </p>
                  )}
                </div>

                {/* Experience (Active) */}
                <div className="mb-8 content-section p-5 bg-blue-50/50 border-2 border-blue-500 rounded-xl relative shadow-sm">
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-sm uppercase tracking-wider">
                    Đang chọn
                  </div>
                  <h3 className="text-[10px] uppercase tracking-widest text-blue-600 font-bold mb-5">Kinh nghiệm làm việc</h3>
                  
                  {completedSteps.length < 3 && (
                     <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 mb-5 relative overflow-hidden">
                       <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">AI Đề Xuất & Nhắc Nhở</div>
                       
                       <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-3 text-sm text-orange-800 font-medium relative overflow-hidden">
                         <div className="text-orange-500 flex-shrink-0 mt-0.5">💡</div>
                         <p>Xem các nhận xét từ AI phần bên phải để cải thiện mô tả công việc của bạn chi tiết hơn.</p>
                       </div>
                     </div>
                  )}

                  <div className="relative">
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">Nhấp vào bất kỳ dữ liệu nào để sửa đổi ↓</div>
                    
                    {cvData.experience?.map((exp: any, i: number) => (
                      <div key={i} className="mb-6 last:mb-0">
                         <div className="flex justify-between items-baseline mb-2">
                           <h4 className="font-bold text-sm text-slate-900 group">
                              {editingField === `exp_${i}_title` ? (
                                <input autoFocus value={exp.title || ''} onChange={(e) => handleEdit(`exp_${i}_title`, e.target.value)} onBlur={() => setEditingField(null)} className="bg-slate-50 rounded px-2 outline-none focus:ring-1 focus:ring-blue-500 w-[200px]" />
                              ) : (
                                <span onClick={() => setEditingField(`exp_${i}_title`)} className="cursor-pointer hover:bg-slate-200 px-1 rounded -ml-1 transition-colors">{exp.title || 'Vị trí công việc'}</span>
                              )}
                              <span className="text-slate-500 font-normal ml-1">· </span>
                              {editingField === `exp_${i}_company` ? (
                                <input autoFocus value={exp.company || ''} onChange={(e) => handleEdit(`exp_${i}_company`, e.target.value)} onBlur={() => setEditingField(null)} className="font-normal text-slate-500 bg-slate-50 rounded px-2 outline-none focus:ring-1 focus:ring-blue-500 w-[150px]" />
                              ) : (
                                <span onClick={() => setEditingField(`exp_${i}_company`)} className="text-slate-500 font-normal cursor-pointer hover:bg-slate-200 px-1 rounded transition-colors">{exp.company || 'Tên Công ty'}</span>
                              )}
                           </h4>
                           
                           {editingField === `exp_${i}_period` ? (
                              <input autoFocus value={exp.period || ''} onChange={(e) => handleEdit(`exp_${i}_period`, e.target.value)} onBlur={() => setEditingField(null)} className="text-xs text-slate-400 font-medium bg-slate-50 rounded px-2 outline-none focus:ring-1 focus:ring-blue-500 w-[120px]" />
                           ) : (
                              <span onClick={() => setEditingField(`exp_${i}_period`)} className="text-xs text-slate-400 font-medium cursor-pointer hover:bg-slate-200 px-1 rounded transition-colors">{exp.period || 'Từ - Đến'}</span>
                           )}
                         </div>
                         
                         <ul className="text-sm text-slate-700 space-y-3 pl-4 list-disc marker:text-blue-500 font-medium leading-relaxed mb-3">
                           {exp.bullets?.map((bullet: string, bIdx: number) => (
                             <li key={bIdx} className="transition-all duration-300">
                               {editingField === `exp_${i}_bullet_${bIdx}` ? (
                                  <textarea autoFocus value={bullet} onChange={(e) => handleEdit(`exp_${i}_bullet_${bIdx}`, e.target.value)} onBlur={() => setEditingField(null)} className="w-full text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 rounded p-2 outline-none focus:ring-1 focus:ring-blue-500 min-h-[60px] resize-none" />
                               ) : (
                                  <span onClick={() => setEditingField(`exp_${i}_bullet_${bIdx}`)} className="cursor-pointer hover:bg-slate-100 rounded px-1 -ml-1 transition-colors block">{bullet}</span>
                               )}
                             </li>
                           ))}
                         </ul>
                         <button onClick={() => {
                           const newExp = [...cvData.experience];
                           if (!newExp[i].bullets) newExp[i].bullets = [];
                           newExp[i].bullets.push("Thêm mô phỏng công việc hoặc thành tích...");
                           setCvData({...cvData, experience: newExp});
                           setEditingField(`exp_${i}_bullet_${newExp[i].bullets.length - 1}`);
                         }} className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors -ml-2 pb-4">
                           + Thêm Dòng
                         </button>
                      </div>
                    ))}
                    
                    <button onClick={() => {
                      const newExp = [...(cvData.experience || []), {
                        title: "Ví trí công việc",
                        company: "Tên công ty",
                        period: "Ngày - Ngày",
                        bullets: ["Mô tả thành tích bạn đạt được..."]
                      }];
                      setCvData({...cvData, experience: newExp});
                      setEditingField(`exp_${newExp.length - 1}_title`);
                    }} className="mt-4 w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm rounded-xl hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-colors">
                      + Thêm Kinh nghiệm mới
                    </button>
                  </div>
                </div>

             </div>
          </div>
        </div>

        {/* Right Side: Checklist & Feedback */}
        <div className="w-full lg:w-[55%] h-full overflow-y-auto px-6 py-8 lg:px-12 bg-white custom-scrollbar pb-24">
           <div className="max-w-2xl mx-auto">
              
              <h2 className="text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">Nhận Xét & Đánh Giá từ AI</h2>

              {cvAnalysis?.analysis?.overall_feedback && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 lg:p-8 mb-8 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm text-blue-600">
                      <span className="text-xl">✨</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-2">Đánh giá chung</h3>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">
                        {cvAnalysis.analysis.overall_feedback}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 lg:p-8 mb-8 shadow-sm">
                
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Danh sách cần cải thiện</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400 ml-2">{completedSteps.length}/{steps.length} Hoàn thành</span>
                  </div>
                </div>
                
                <p className="text-sm font-medium text-slate-700 mb-6 flex items-center gap-2">
                  Tích chọn những mục bạn đã chỉnh sửa xong:
                </p>

                <div className="space-y-4">
                  {steps.map((step, idx) => {
                    const isChecked = completedSteps.includes(idx);
                    const isEnabled = true; // allow checking any item
                    return (
                      <div 
                        key={idx}
                        onClick={() => toggleStep(idx)}
                        className={cn(
                          "border rounded-xl p-4 flex gap-4 transition-all overflow-hidden relative",
                          isChecked ? "bg-white border-blue-200 shadow-[0_0_15px_rgba(37,99,235,0.05)] cursor-pointer" : 
                          isEnabled ? "bg-white border-slate-200 hover:border-blue-300 cursor-pointer" : 
                          "bg-slate-100/50 border-slate-100 cursor-not-allowed opacity-50"
                        )}
                      >
                        {isChecked && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
                        <div className={cn(
                          "w-6 h-6 rounded shrink-0 border font-bold text-xs flex items-center justify-center transition-colors",
                          isChecked ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-100 border-slate-300 text-slate-400"
                        )}>
                          {isChecked ? <Check className="w-3.5 h-3.5" /> : (idx + 1)}
                        </div>
                        <p className={cn(
                          "text-sm font-medium leading-relaxed pt-0.5",
                          isChecked ? "text-slate-900" : "text-slate-500"
                        )}>
                          {step}
                        </p>
                      </div>
                    )
                  })}
                </div>

              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => navigate('/job-search')}
                  className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Tìm Việc Ngay <ChevronRight className="w-4 h-4" />
                </button>
              </div>

           </div>
        </div>

      </div>
    </div>
  );
}
