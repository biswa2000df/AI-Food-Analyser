import React, { useEffect, useState } from 'react';
import { User, HistoryRecord } from '../../types';
import { apiService } from '../../services/api';
import { Database, Loader, Search, Calendar, Eye } from 'lucide-react';
import { Modal } from '../UI/Modal';

interface HistoryProps {
  user: User;
}

export const History: React.FC<HistoryProps> = ({ user }) => {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const data = await apiService.fetchHistory(user);
        if (mounted) setRecords(data);
      } catch (e) {
        console.error("History fetch error", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [user]);

  const getImageUrl = (url: string) => {
    if (!url) return 'https://placehold.co/400x300?text=No+Image';
    if (url.includes('drive.google.com')) {
        const idMatch = url.match(/id=([^&]+)/) || url.match(/\/d\/([^\/]+)/);
        if (idMatch) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w400`;
    }
    return url;
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-ai-cyan">
            <Loader className="w-10 h-10 animate-spin mb-4" />
            <p className="font-mono text-sm animate-pulse">DECRYPTING ARCHIVES...</p>
        </div>
    );
  }

  if (records.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-600 border border-dashed border-gray-800 rounded-2xl bg-[#0f131a]/50">
            <Search className="w-16 h-16 mb-4 opacity-50" />
            <h3 className="text-xl font-oswald tracking-wide text-gray-400">NO RECORDS FOUND</h3>
            <p className="text-xs font-mono mt-2">Initiate scans to populate database.</p>
        </div>
    );
  }

  return (
    <div className="animate-fade-in pb-24 md:pb-0">
        <div className="flex justify-between items-center mb-8">
             <h2 className="text-2xl font-bold text-white font-oswald tracking-wide flex items-center gap-3">
                <Database className="text-ai-cyan" /> HISTORY LOGS
            </h2>
            <span className="text-xs font-mono text-gray-500 px-3 py-1 border border-gray-800 rounded-full">
                COUNT: {records.length}
            </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {records.map((record, idx) => (
                <div 
                    key={idx} 
                    onClick={() => setSelectedRecord(record)}
                    className="group bg-[#0f131a] border border-gray-800 rounded-xl overflow-hidden hover:border-ai-cyan/50 transition-all cursor-pointer shadow-lg hover:shadow-[0_0_15px_rgba(0,234,223,0.1)] flex flex-col"
                >
                    {/* Image Logic: Always 100% opacity on mobile/default, desktop gets 80%->100% on hover */}
                    <div className="relative h-48 bg-gray-900 overflow-hidden">
                        <img 
                            src={getImageUrl(record.image)} 
                            alt="Scan" 
                            className="w-full h-full object-cover opacity-100 md:opacity-80 md:group-hover:opacity-100 md:group-hover:scale-105 transition duration-700"
                            onError={(e: any) => e.target.src='https://placehold.co/400x300?text=Image+Error'}
                        />
                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-ai-cyan text-[10px] px-2 py-1 rounded font-mono border border-ai-cyan/30 flex items-center gap-1 z-20">
                            <Calendar size={10} /> {record.timestamp}
                        </div>
                        
                        {/* Mobile: Subtle dark overlay always. Desktop: Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-black/20 md:group-hover:bg-transparent transition z-10"></div>
                        
                        {/* Overlay Icon: Always visible on Mobile bottom-left, Centered on Desktop Hover */}
                        <div className="absolute bottom-2 left-2 md:inset-0 md:flex md:items-center md:justify-center md:opacity-0 md:group-hover:opacity-100 transition duration-300 z-30">
                            <div className="bg-black/60 p-2 rounded-full border border-ai-cyan text-ai-cyan backdrop-blur-sm shadow-lg flex items-center gap-2 md:block">
                                <Eye size={16} className="md:w-5 md:h-5" />
                                <span className="text-[9px] md:hidden font-bold font-oswald">VIEW DETAILS</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-end mb-3 pb-3 border-b border-gray-800">
                             <span className="text-xs text-gray-500 font-bold">ID: #{String(record.recordId).slice(-4)}</span>
                             <span className="text-xl font-black font-mono text-white group-hover:text-ai-cyan transition">
                                {record.analysis.totals.calories} <span className="text-xs text-gray-500 font-sans font-normal">kcal</span>
                             </span>
                        </div>

                        <div className="space-y-2 flex-1">
                            {record.analysis.foodItems.slice(0, 3).map((item, i) => (
                                <div key={i} className="flex justify-between text-xs">
                                    <span className="text-gray-300 truncate w-2/3">{item.name}</span>
                                    <span className="text-gray-500 font-mono">{Math.round(item.calories)}</span>
                                </div>
                            ))}
                            {record.analysis.foodItems.length > 3 && (
                                <div className="text-[10px] text-ai-cyan italic mt-1">
                                    +{record.analysis.foodItems.length - 3} more items...
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-3 mt-4 border-t border-gray-800 bg-gray-900/30 -mx-4 -mb-4 p-3">
                            <MiniMacro label="PRO" value={record.analysis.totals.protein} color="text-pink-400" />
                            <MiniMacro label="CRB" value={record.analysis.totals.carbs} color="text-emerald-400" />
                            <MiniMacro label="FAT" value={record.analysis.totals.fat} color="text-amber-400" />
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Detail Modal */}
        <Modal isOpen={!!selectedRecord} onClose={() => setSelectedRecord(null)} title="SCAN DETAILS">
            {selectedRecord && (
                <div className="space-y-6">
                    <div className="rounded-lg overflow-hidden border border-gray-700 relative">
                        <img src={getImageUrl(selectedRecord.image)} className="w-full max-h-64 object-cover" alt="Detail" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-center text-xs text-gray-400 font-mono">
                            Recorded: {selectedRecord.timestamp}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 text-center bg-gray-800/50 p-4 rounded-xl">
                        <div>
                            <div className="text-[10px] text-gray-400 uppercase">Cal</div>
                            <div className="text-xl font-bold text-white font-mono">{selectedRecord.analysis.totals.calories.toFixed(0)}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-pink-400 uppercase">Pro</div>
                            <div className="text-lg font-bold text-pink-400 font-mono">{selectedRecord.analysis.totals.protein.toFixed(0)}g</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-emerald-400 uppercase">Carb</div>
                            <div className="text-lg font-bold text-emerald-400 font-mono">{selectedRecord.analysis.totals.carbs.toFixed(0)}g</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-amber-400 uppercase">Fat</div>
                            <div className="text-lg font-bold text-amber-400 font-mono">{selectedRecord.analysis.totals.fat.toFixed(0)}g</div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-white font-oswald mb-2 border-b border-gray-800 pb-1">FULL ITEM LIST</h4>
                        <ul className="space-y-2">
                            {selectedRecord.analysis.foodItems.map((item, i) => (
                                <li key={i} className="flex justify-between p-2 bg-gray-900 rounded border border-gray-800 overflow-x-auto">
                                    <div className="text-xs whitespace-nowrap pr-2">
                                        <span className="text-white block">{item.name}</span>
                                        <span className="text-gray-500 text-[9px]">{item.quantity}</span>
                                    </div>
                                    <div className="text-right whitespace-nowrap">
                                         <div className="text-ai-cyan font-mono text-sm">{item.calories}</div>
                                         <div className="text-[9px] text-gray-500">kcal</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </Modal>
    </div>
  );
};

const MiniMacro = ({ label, value, color }: any) => (
    <div className="text-center">
        <div className="text-[9px] text-gray-500 uppercase">{label}</div>
        <div className={`text-sm font-bold font-mono ${color}`}>{Math.round(value)}g</div>
    </div>
);