import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Mic, DownloadCloud, RefreshCcw, AlertTriangle, Scan, Settings, Image as ImageIcon, Bot, Activity, PieChart, BarChart3, LayoutTemplate, XCircle, Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { apiService } from '../../services/api';
import { AnalysisResult, User } from '../../types';
import { jsPDF } from 'jspdf';

interface ScannerProps {
  user: User;
}

type ViewMode = 'gauge' | 'bar' | 'card';

export const Scanner: React.FC<ScannerProps> = ({ user }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("STARTING SCAN...");
  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('gauge');
  
  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto-scroll Ref
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  // Auto Scroll for Success AND Error
  useEffect(() => {
    if ((result || error) && resultsRef.current) {
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
  }, [result, error]);

  const handleReset = () => {
    setShowResetModal(true);
    setTimeout(() => {
        performReset();
        setShowResetModal(false);
    }, 800);
  };

  const performReset = () => {
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setAudioUrl(null);
    
    const fileIn = document.getElementById('file-upload') as HTMLInputElement;
    const camIn = document.getElementById('camera-upload') as HTMLInputElement;
    if(fileIn) fileIn.value = '';
    if(camIn) camIn.value = '';
  };

  const processFile = async (file: File) => {
    if (!file) return;
    
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setImageFile(file);
    setResult(null);
    setError(null);

    setIsLoading(true);
    
    const msgs = ['SCANNING FOOD...', 'IDENTIFYING INGREDIENTS...', 'CALCULATING CALORIES...', 'PREPARING RESULTS...'];
    let msgIdx = 0;
    const interval = setInterval(() => {
        setLoadingText(msgs[msgIdx % msgs.length]);
        msgIdx++;
    }, 1500);

    try {
      const analysis = await apiService.analyzeImage(file, user);
      setResult(analysis);
    } catch (err: any) {
      setError(err.message || "We couldn't analyze that image. Please try a clearer photo.");
      // Set a dummy result so the UI doesn't break but shows error state
      setResult({ status: 'error', food: [], total: {calories:0,protein:0,carbs:0,fat:0} });
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          const resBlob = await apiService.sendVoice(audioBlob, `user_${Date.now()}`);
          const audioUrl = URL.createObjectURL(resBlob);
          setAudioUrl(audioUrl);
        } catch (e) {
          console.error(e);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Mic Access Denied", e);
      alert("Microphone access is needed to use voice commands.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const generatePDF = async () => {
    if (!result) return;
    const doc = new jsPDF();
    
    doc.setFillColor(5, 7, 10);
    doc.rect(0, 0, 210, 297, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 234, 223);
    doc.text("NUTRITION ANALYSIS REPORT", 20, 30);

    doc.setFontSize(12);
    doc.setTextColor(200, 200, 200);
    doc.text(`User: ${user.username}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 48);

    let yPos = 60;

    if (imageFile) {
        try {
            const base64Img = await fileToBase64(imageFile);
            const format = imageFile.type === 'image/png' ? 'PNG' : 'JPEG';
            doc.addImage(base64Img, format, 20, 60, 80, 60);
            yPos = 130; 
        } catch (e) {
            doc.text("[Image Unavailable]", 20, 60);
            yPos = 80;
        }
    }

    doc.setFontSize(16); 
    doc.setTextColor(0, 234, 223); 
    doc.text("MACRONUTRIENT SUMMARY", 20, yPos);
    yPos += 10;
    
    doc.setDrawColor(0, 234, 223);
    doc.line(20, yPos, 190, yPos);
    yPos += 15;
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(`Total Calories: ${result.total.calories.toFixed(0)} kcal`, 20, yPos); yPos += 10;
    doc.text(`Protein: ${result.total.protein.toFixed(1)}g`, 20, yPos); yPos += 10;
    doc.text(`Carbs: ${result.total.carbs.toFixed(1)}g`, 20, yPos); yPos += 10;
    doc.text(`Fat: ${result.total.fat.toFixed(1)}g`, 20, yPos); yPos += 20;

    doc.text("DETECTED FOODS:", 20, yPos); yPos += 10;
    doc.setFontSize(10);
    result.food.forEach(item => {
        doc.setTextColor(200, 200, 200);
        const itemText = `• ${item.name} (${item.quantity}) - ${item.calories} kcal`;
        doc.text(itemText, 25, yPos);
        yPos += 8;
        if (yPos > 270) {
            doc.addPage();
            doc.setFillColor(5, 7, 10);
            doc.rect(0, 0, 210, 297, 'F');
            yPos = 20;
        }
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Powered by Biswa AI Sentinel | Developed by Biswa", 105, pageHeight - 10, { align: "center" });

    const filename = `My_Nutrition_Report_${user.username}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  // --- Enhanced Visual Components ---

  const CircularProgress = ({ value, max, label, colorStart, colorEnd, icon: Icon }: any) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const safeMax = max || 1;
    const offset = circumference - (value / safeMax) * circumference;
    
    // Generate unique ID for gradients
    const gradientId = `grad-${label.replace(/\s+/g, '')}`;

    return (
        <div className="relative flex flex-col items-center justify-center group">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-white/5 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
            
            <div className="relative w-28 h-28">
                <svg width="112" height="112" className="transform -rotate-90">
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={colorStart} />
                            <stop offset="100%" stopColor={colorEnd} />
                        </linearGradient>
                    </defs>
                    {/* Track */}
                    <circle cx="56" cy="56" r={radius} stroke="#1f2937" strokeWidth="8" fill="transparent" className="opacity-50" />
                    
                    {/* Decorative Ticks */}
                    <circle cx="56" cy="56" r={radius + 10} stroke="#374151" strokeWidth="2" fill="transparent" strokeDasharray="1, 5" className="opacity-30" />

                    {/* Progress */}
                    <circle 
                        cx="56" 
                        cy="56" 
                        r={radius} 
                        stroke={`url(#${gradientId})`} 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={offset} 
                        className="transition-all duration-1000 ease-out drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]" 
                        strokeLinecap="round" 
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <Icon size={16} className="mb-1 opacity-80" color={colorStart} />
                    <span className="text-lg font-bold font-mono tracking-tighter">{Math.round(value)}g</span>
                </div>
            </div>
            <span className="text-[10px] text-gray-400 font-oswald tracking-widest mt-2 uppercase">{label}</span>
        </div>
    );
  }

  const BarProgress = ({ value, max, label, color, bg, icon: Icon }: any) => {
      const percentage = Math.min((value / (max || 1)) * 100, 100);
      return (
          <div className="w-full group">
              <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-gray-800/50 border border-gray-700 group-hover:border-${color.split('-')[1]}-500/50 transition-colors`}>
                        <Icon size={14} className={color} />
                    </div>
                    <span className={`text-xs font-bold font-oswald tracking-wide text-gray-300`}>{label}</span>
                  </div>
                  <span className="text-xs font-mono text-white font-bold">{Math.round(value)}g</span>
              </div>
              <div className="h-3 w-full bg-gray-800/50 rounded-full overflow-hidden relative border border-gray-700/50">
                  {/* Grid lines overlay */}
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMSAwTDEgNCIgc3Ryb2tlPSJyZ2JhKDAsMCwwLDAuMikiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-30 z-10"></div>
                  <div className={`h-full ${bg} transition-all duration-1000 relative`} style={{ width: `${percentage}%` }}>
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                  </div>
              </div>
          </div>
      );
  }

  const CardStat = ({ value, label, color, icon: Icon }: any) => (
      <div className="relative flex flex-col items-center justify-center p-5 bg-[#0b0e14] rounded-2xl border border-gray-800 overflow-hidden group hover:border-gray-700 transition-all duration-300 hover:translate-y-[-2px] shadow-lg">
          <div className="absolute -right-4 -bottom-4 text-gray-800/20 group-hover:text-gray-800/40 transition-colors transform rotate-12">
              <Icon size={64} />
          </div>
          <div className="relative z-10 text-center">
              <div className={`inline-flex p-2 rounded-full bg-gray-900/80 mb-2 ${color}`}>
                <Icon size={20} />
              </div>
              <span className="block text-3xl font-black font-mono text-white mb-1">{Math.round(value)}</span>
              <span className="text-[10px] text-gray-500 font-oswald uppercase tracking-widest">{label}</span>
          </div>
      </div>
  );

  // Determine if alert mode should be active
  const isAlertMode = result?.status === 'not_food' || result?.status === 'error' || !!error;
  const cardBorderColor = isAlertMode ? 'border-red-500/50' : 'border-gray-800';
  const cardBg = isAlertMode ? 'bg-red-900/5' : 'bg-[#0f131a]';

  return (
    <div className="space-y-6 pb-24 md:pb-0 animate-fade-in">
      
      {isLoading && (
        <div className="fixed inset-0 z-[250] bg-black flex items-center justify-center overflow-hidden">
            {previewUrl && (
                <div className="absolute inset-0 overflow-hidden">
                    <img src={previewUrl} alt="Scanning" className="animated-scan-effect" />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                </div>
            )}
            <div className="engine-core-overlay rounded-xl md:rounded-3xl w-11/12 max-w-lg mx-auto p-8 flex flex-col items-center justify-center text-center transform transition duration-500 shadow-2xl border border-ai-cyan/50 bg-[#0f131a]/90">
                <Settings className="w-16 h-16 text-ai-cyan animate-[spin_3s_linear_infinite] mb-6" />
                <p className="text-3xl text-white font-black font-oswald tracking-[0.2em] leading-tight mb-3">
                    ANALYZING <span className="text-ai-cyan">MEAL</span>
                </p>
                <p className="text-sm text-gray-300 font-mono animate-pulse break-words uppercase tracking-widest">
                    {loadingText}
                </p>
            </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0f131a] border border-ai-cyan rounded-2xl p-8 flex flex-col items-center shadow-[0_0_50px_rgba(0,234,223,0.2)]">
                <RefreshCcw className="w-12 h-12 text-ai-cyan animate-[spin_1s_ease-in-out] mb-4" />
                <span className="text-white font-oswald tracking-widest text-lg">STARTING NEW SCAN...</span>
            </div>
        </div>
      )}

      <div className="flex justify-end">
        <button 
            onClick={handleReset} 
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0f131a] hover:bg-gray-800 border border-gray-800 hover:border-ai-cyan/50 text-gray-400 hover:text-white transition-all duration-300 text-xs font-bold font-oswald tracking-wider shadow-lg group"
        >
          <RefreshCcw size={16} className="group-hover:-rotate-180 transition-transform duration-500" /> 
          START NEW SCAN
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        
        {/* LEFT: Inputs */}
        <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl bg-[#0f131a] border border-gray-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-ai-cyan/5 to-transparent rounded-bl-full pointer-events-none"></div>

                <h2 className="text-lg font-bold mb-6 text-white font-oswald tracking-widest border-b border-gray-700/50 pb-3 flex items-center gap-3">
                    <Scan size={20} className="text-ai-cyan" /> ADD FOOD IMAGE
                </h2>
                
                <div className="flex flex-col space-y-4">
                    <label className="w-full cursor-pointer bg-[#05070a] hover:bg-gray-900 transition-all duration-300 p-5 rounded-2xl border border-dashed border-gray-700 hover:border-ai-cyan group relative overflow-hidden shadow-inner">
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="p-3 rounded-full bg-gray-800 group-hover:bg-gray-700 transition-colors text-ai-cyan shadow-lg">
                                <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                                <span className="block text-sm font-bold text-white tracking-wide font-oswald group-hover:text-ai-cyan transition-colors">UPLOAD PHOTO</span>
                                <span className="block text-[10px] text-gray-500 font-mono mt-1">Select from Gallery</span>
                            </div>
                        </div>
                        <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
                    </label>

                    <label className="w-full cursor-pointer bg-[#05070a] hover:bg-gray-900 transition-all duration-300 p-5 rounded-2xl border border-dashed border-gray-700 hover:border-pink-500 group relative overflow-hidden shadow-inner">
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="p-3 rounded-full bg-gray-800 group-hover:bg-gray-700 transition-colors text-pink-500 shadow-lg">
                                <Camera className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                                <span className="block text-sm font-bold text-white tracking-wide font-oswald group-hover:text-pink-500 transition-colors">TAKE PHOTO</span>
                                <span className="block text-[10px] text-gray-500 font-mono mt-1">Use Camera</span>
                            </div>
                        </div>
                        <input id="camera-upload" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
                    </label>
                </div>

                {/* Enhanced Voice AI */}
                <div className="mt-8 pt-6 border-t border-gray-800 relative">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-gray-400 font-oswald tracking-wider flex items-center gap-2">
                             <Activity size={14} className="text-ai-cyan" /> AI VOICE ASSISTANT
                        </h3>
                        <div className="relative">
                            <Bot size={24} className="text-ai-cyan animate-float" />
                            <div className="absolute inset-0 bg-ai-cyan/40 blur-lg rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    
                    <button 
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        className={`w-full py-5 rounded-xl font-bold text-white transition-all duration-200 shadow-lg flex items-center justify-center gap-3 select-none text-xs font-oswald tracking-[0.2em] relative overflow-hidden border
                            ${isRecording 
                                ? 'bg-rose-600 border-rose-500 scale-[0.98]' 
                                : 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700 hover:border-gray-500 hover:bg-gray-800'}
                        `}
                    >
                        <Mic size={18} className={isRecording ? 'hidden' : 'text-gray-300'} />
                        {isRecording ? (
                            <div className="flex items-center gap-1 h-5">
                                <span className="w-1.5 bg-white animate-[pulse_0.5s_ease-in-out_infinite] h-full rounded-full"></span>
                                <span className="w-1.5 bg-white animate-[pulse_0.5s_ease-in-out_0.1s_infinite] h-3 rounded-full"></span>
                                <span className="w-1.5 bg-white animate-[pulse_0.5s_ease-in-out_0.2s_infinite] h-full rounded-full"></span>
                                <span className="w-1.5 bg-white animate-[pulse_0.5s_ease-in-out_0.1s_infinite] h-2 rounded-full"></span>
                                <span className="ml-3 font-bold">LISTENING...</span>
                            </div>
                        ) : 'HOLD TO SPEAK'}
                    </button>
                    {audioUrl && <audio src={audioUrl} controls className="w-full mt-4 h-8 opacity-80 hover:opacity-100 transition-opacity" autoPlay />}
                </div>
            </div>

            {previewUrl && (
                <div className="p-1 rounded-3xl bg-gradient-to-b from-gray-800 to-transparent animate-fade-in">
                    <div className="bg-[#0f131a] rounded-[22px] p-4 border border-gray-800">
                        <h2 className="text-xs font-bold mb-3 text-ai-cyan font-oswald border-b border-gray-800 pb-2 tracking-wider flex items-center gap-2">
                            <ImageIcon size={14} /> IMAGE PREVIEW
                        </h2>
                        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-gray-700 shadow-inner bg-black group">
                            {/* Animated Zoom Effect on Preview */}
                            <img src={previewUrl} alt="Meal" className="w-full h-full object-cover animate-zoom-pan" />
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* RIGHT: Results */}
        <div className="lg:col-span-8 space-y-6" ref={resultsRef}>
            {/* Error / Not Food Banner */}
            {isAlertMode && (
                <div className="p-5 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl flex items-center gap-4 text-red-200 shadow-lg animate-slide-up">
                    <div className="bg-red-500/20 p-2 rounded-full animate-pulse">
                        <XCircle size={28} className="text-red-500" />
                    </div>
                    <div>
                        <h4 className="font-bold font-oswald text-sm tracking-wider text-red-400 mb-1">
                            {result?.status === 'not_food' ? "NON-FOOD ITEM DETECTED" : "ANALYSIS ERROR"}
                        </h4>
                        <span className="text-xs md:text-sm font-mono text-red-200">
                            {result?.status === 'not_food' ? "The scan did not detect valid nutritional content." : error}
                        </span>
                    </div>
                </div>
            )}

            {/* Main Analysis Card - Dynamic Styling */}
            <div className={`p-6 md:p-8 rounded-3xl ${cardBg} border ${cardBorderColor} shadow-2xl relative overflow-hidden transition-colors duration-500`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-gray-800 pb-4 gap-4 z-10 relative">
                    <div>
                        <h2 className="text-2xl font-black text-white font-oswald tracking-widest">
                            NUTRITION <span className={isAlertMode ? 'text-red-500' : 'text-ai-cyan'}>INSIGHTS</span>
                        </h2>
                        <p className="text-xs font-mono text-gray-500 mt-1">
                            {isAlertMode ? 'Scan Verification Failed' : 'Comprehensive Bio-Analysis'}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* View Switcher */}
                        {result && result.status === 'success' && (
                            <div className="flex bg-[#05070a] rounded-lg p-1 border border-gray-800 mr-2 shadow-inner">
                                <button onClick={() => setViewMode('gauge')} className={`p-2.5 rounded-md transition-all duration-300 ${viewMode === 'gauge' ? 'bg-ai-cyan text-black shadow-[0_0_10px_rgba(0,234,223,0.3)]' : 'text-gray-500 hover:text-gray-300'}`} title="Gauge View"><PieChart size={18} /></button>
                                <button onClick={() => setViewMode('bar')} className={`p-2.5 rounded-md transition-all duration-300 ${viewMode === 'bar' ? 'bg-ai-cyan text-black shadow-[0_0_10px_rgba(0,234,223,0.3)]' : 'text-gray-500 hover:text-gray-300'}`} title="Bar View"><BarChart3 size={18} /></button>
                                <button onClick={() => setViewMode('card')} className={`p-2.5 rounded-md transition-all duration-300 ${viewMode === 'card' ? 'bg-ai-cyan text-black shadow-[0_0_10px_rgba(0,234,223,0.3)]' : 'text-gray-500 hover:text-gray-300'}`} title="Card View"><LayoutTemplate size={18} /></button>
                            </div>
                        )}

                        {result ? (
                            result.status === 'not_food' ? 
                                <span className="px-4 py-2 rounded-full bg-amber-900/20 text-amber-500 border border-amber-700/50 text-xs font-bold font-mono tracking-wide flex items-center gap-2 animate-pulse">
                                    <AlertTriangle size={14} /> NOT FOOD
                                </span> :
                            result.status === 'error' || error ? 
                                <span className="px-4 py-2 rounded-full bg-red-900/20 text-red-500 border border-red-700/50 text-xs font-bold font-mono tracking-wide flex items-center gap-2">
                                    <AlertTriangle size={14} /> ERROR
                                </span> :
                                <span className="px-4 py-2 rounded-full bg-ai-cyan/10 text-ai-cyan border border-ai-cyan/30 text-xs font-bold font-mono tracking-wide shadow-[0_0_10px_rgba(0,234,223,0.2)] flex items-center gap-2">
                                    <Scan size={14} /> COMPLETE
                                </span>
                        ) : (
                            <span className="px-4 py-2 rounded-full bg-gray-800 text-gray-500 border border-gray-700 text-xs font-bold font-mono tracking-wide">
                                STANDBY
                            </span>
                        )}
                    </div>
                </div>

                {/* Dynamic Content Area */}
                <div className="flex flex-col items-center justify-center min-h-[250px]">
                     {!result ? (
                        //  PREMIUM STANDBY HUD
                        <div className="relative w-full h-64 border border-gray-800/50 rounded-2xl bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] flex flex-col items-center justify-center overflow-hidden group">
                            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                            <div className="w-32 h-32 rounded-full border-2 border-gray-800 flex items-center justify-center relative animate-pulse-slow">
                                <div className="w-24 h-24 rounded-full border border-ai-cyan/20 flex items-center justify-center bg-black/40 backdrop-blur-sm group-hover:border-ai-cyan/50 transition-colors">
                                    <Scan size={40} className="text-gray-600 group-hover:text-ai-cyan transition-colors" />
                                </div>
                                <div className="absolute inset-0 border-t-2 border-ai-cyan/50 rounded-full animate-spin-slow"></div>
                                <div className="absolute -inset-4 border border-dashed border-gray-800 rounded-full animate-[spin_10s_linear_infinite_reverse]"></div>
                            </div>
                            <h3 className="mt-6 font-oswald text-xl text-gray-500 tracking-[0.2em]">SYSTEM STANDBY</h3>
                            <p className="font-mono text-[10px] text-gray-600 tracking-widest mt-2">AWAITING BIOMETRIC INPUT</p>
                        </div>
                     ) : (
                        result.status === 'success' ? (
                            // SUCCESS VIEWS
                            <div className="w-full animate-fade-in">
                                {viewMode === 'gauge' && (
                                    <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                                        {/* Main Calorie Gauge */}
                                        <div className="relative w-56 h-56 flex items-center justify-center shrink-0">
                                             <div className="absolute inset-0 bg-ai-cyan/5 rounded-full blur-2xl animate-pulse"></div>
                                            <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_10px_rgba(0,234,223,0.2)]">
                                                <defs>
                                                    <linearGradient id="calGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor="#00C8B7" />
                                                        <stop offset="100%" stopColor="#00EADF" />
                                                    </linearGradient>
                                                </defs>
                                                <circle cx="50%" cy="50%" r="45%" stroke="#1f2937" strokeWidth="12" fill="transparent" strokeOpacity="0.5" />
                                                <circle cx="50%" cy="50%" r="45%" stroke="url(#calGradient)" strokeWidth="12" fill="transparent" strokeDasharray="283" strokeDashoffset={283 - ((Math.min(result.total.calories, 2500) / 2500) * 283)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                                            </svg>
                                            <div className="absolute flex flex-col items-center">
                                                <Flame size={24} className="text-ai-cyan mb-1 animate-bounce" />
                                                <span className="text-5xl font-black text-white font-mono tracking-tight">{result.total.calories.toFixed(0)}</span>
                                                <span className="text-xs text-ai-cyan font-bold font-oswald tracking-widest">KCAL</span>
                                            </div>
                                        </div>
                                        
                                        {/* Macro Gauges */}
                                        <div className="flex-1 w-full grid grid-cols-3 gap-4 md:gap-8">
                                            <CircularProgress value={result.total.protein} max={200} label="Protein" colorStart="#ec4899" colorEnd="#db2777" icon={Beef} />
                                            <CircularProgress value={result.total.carbs} max={300} label="Carbs" colorStart="#10b981" colorEnd="#059669" icon={Wheat} />
                                            <CircularProgress value={result.total.fat} max={100} label="Fat" colorStart="#f59e0b" colorEnd="#d97706" icon={Droplets} />
                                        </div>
                                    </div>
                                )}

                                {viewMode === 'bar' && (
                                    <div className="w-full space-y-6 p-4 md:p-6 bg-[#0b0e14] rounded-2xl border border-gray-800/50">
                                        <div className="flex justify-between items-end mb-2 pb-4 border-b border-gray-800">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-ai-cyan/10 border border-ai-cyan/30 text-ai-cyan">
                                                    <Flame size={20} />
                                                </div>
                                                <div>
                                                    <span className="block text-3xl font-black font-mono text-white">{result.total.calories.toFixed(0)}</span>
                                                    <span className="text-[10px] text-gray-500 font-oswald tracking-widest">TOTAL ENERGY</span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-ai-cyan font-mono border border-ai-cyan/30 px-2 py-1 rounded">TARGET: 2500</span>
                                        </div>
                                        <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden mb-8 relative shadow-inner">
                                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMSAwTDEgNCIgc3Ryb2tlPSJyZ2JhKDAsMCwwLDAuNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-20 z-10"></div>
                                            <div className="h-full bg-gradient-to-r from-ai-cyan/70 to-ai-cyan transition-all duration-1000" style={{width: `${Math.min((result.total.calories/2500)*100, 100)}%`}}></div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-5">
                                            <BarProgress value={result.total.protein} max={200} label="PROTEIN" color="text-pink-500" bg="bg-gradient-to-r from-pink-600 to-pink-500" icon={Beef} />
                                            <BarProgress value={result.total.carbs} max={300} label="CARBS" color="text-emerald-500" bg="bg-gradient-to-r from-emerald-600 to-emerald-500" icon={Wheat} />
                                            <BarProgress value={result.total.fat} max={100} label="FAT" color="text-amber-500" bg="bg-gradient-to-r from-amber-600 to-amber-500" icon={Droplets} />
                                        </div>
                                    </div>
                                )}

                                {viewMode === 'card' && (
                                    <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="col-span-2 md:col-span-4 p-6 bg-gradient-to-r from-ai-cyan/10 to-transparent border border-ai-cyan/30 rounded-2xl flex items-center justify-between relative overflow-hidden group">
                                            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-ai-cyan/5 to-transparent"></div>
                                            <div className="relative z-10">
                                                <span className="text-5xl font-black text-white font-mono block drop-shadow-[0_0_10px_rgba(0,234,223,0.5)]">{result.total.calories.toFixed(0)}</span>
                                                <span className="text-sm text-ai-cyan font-oswald tracking-widest">TOTAL CALORIES</span>
                                            </div>
                                            <Flame size={64} className="text-ai-cyan/20 absolute right-4 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <CardStat value={result.total.protein} label="PROTEIN (g)" color="text-pink-500" icon={Beef} />
                                        <CardStat value={result.total.carbs} label="CARBS (g)" color="text-emerald-500" icon={Wheat} />
                                        <CardStat value={result.total.fat} label="FAT (g)" color="text-amber-500" icon={Droplets} />
                                        <div className="p-4 bg-gray-800/30 rounded-2xl border border-gray-800 flex flex-col items-center justify-center hover:bg-gray-800/50 transition-colors">
                                            <span className="text-2xl font-bold text-white font-mono">{result.food.length}</span>
                                            <span className="text-[9px] text-gray-500 font-oswald uppercase mt-1">ITEMS DETECTED</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // FAILURE VIEW (Not Food / Error)
                            <div className="flex flex-col items-center text-center py-10">
                                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-4 animate-pulse border border-red-500/30">
                                    <AlertTriangle size={40} className="text-red-500" />
                                </div>
                                <h3 className="text-xl font-oswald text-white tracking-wide mb-2">
                                    {result.status === 'not_food' ? 'OBJECT NOT IDENTIFIED' : 'SCAN INTERRUPTED'}
                                </h3>
                                <p className="text-sm font-mono text-gray-500 max-w-xs">
                                    {result.status === 'not_food' 
                                        ? "The system could not match the visual patterns to known food databases." 
                                        : "A processing error occurred. Please ensure image clarity and try again."}
                                </p>
                            </div>
                        )
                     )}
                </div>
                
                {/* Decorative Background Element */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent ${isAlertMode ? 'via-red-900' : 'via-gray-800'} to-transparent transition-colors duration-500`}></div>
            </div>

            {/* Detected Foods */}
            <div className="p-6 rounded-3xl bg-[#0f131a] border border-gray-800 shadow-lg">
                 <h2 className="text-lg font-bold mb-4 text-white font-oswald tracking-wider border-b border-gray-700/50 pb-3">DETECTED FOODS</h2>
                 <ul className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                    {result?.food && result.food.length > 0 ? (
                        result.food.map((item, idx) => (
                            <li key={idx} className="flex justify-between items-center p-4 rounded-xl bg-gray-900/50 border border-gray-700/50 shadow-sm hover:border-ai-cyan/30 transition-colors overflow-x-auto group">
                                <div className="w-7/12 whitespace-nowrap pr-4 flex items-center gap-3">
                                    <div className="w-1.5 h-8 bg-gray-700 rounded-full group-hover:bg-ai-cyan transition-colors"></div>
                                    <div>
                                        <div className="font-bold text-white text-sm group-hover:text-ai-cyan transition-colors">{item.name}</div>
                                        <div className="text-[10px] text-gray-500 font-mono uppercase">{item.quantity}</div>
                                    </div>
                                </div>
                                <div className="w-5/12 text-right whitespace-nowrap">
                                    <div className="text-lg font-bold text-white font-mono">{item.calories.toFixed(0)} <span className="text-[10px] text-gray-500">kcal</span></div>
                                    <div className="text-[9px] text-gray-400 flex justify-end gap-2 font-mono mt-1">
                                        <span className="text-pink-400 flex items-center gap-0.5"><Beef size={8} /> {Math.round(item.protein)}</span>
                                        <span className="text-emerald-400 flex items-center gap-0.5"><Wheat size={8} /> {Math.round(item.carbs)}</span>
                                        <span className="text-amber-400 flex items-center gap-0.5"><Droplets size={8} /> {Math.round(item.fat)}</span>
                                    </div>
                                </div>
                            </li>
                        ))
                    ) : (
                        <li className="text-gray-500 p-8 text-center text-sm bg-gray-800/30 rounded-xl border border-dashed border-gray-700 flex flex-col items-center justify-center gap-2">
                           {result?.status === 'not_food' ? 
                                <div className="text-amber-500 flex flex-col items-center">
                                    <AlertTriangle className="mb-2 w-8 h-8" />
                                    <span>No food matches found in database.</span>
                                </div> 
                                : (
                                    <>
                                        <ImageIcon className="w-8 h-8 opacity-50" />
                                        <span>Awaiting successful scan to list items.</span>
                                    </>
                                )
                            }
                        </li>
                    )}
                 </ul>
            </div>

            <div className="text-center pt-4 pb-10 md:pb-0">
                 <button 
                    onClick={generatePDF}
                    disabled={!result || result.status !== 'success'}
                    className="bg-gradient-to-r from-[#00C8B7] to-[#00EADF] text-black font-bold font-oswald tracking-[0.1em] px-8 py-4 rounded-2xl inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-[0_0_30px_rgba(0,234,223,0.4)] transition-all duration-300 shadow-lg text-sm md:text-base"
                 >
                    <DownloadCloud size={20} className="mr-3" /> DOWNLOAD NUTRITION PDF
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
};