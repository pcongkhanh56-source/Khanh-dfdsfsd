
import React, { useState, useEffect } from 'react';
import { GameTheme, TeamConfig } from '../types';
import { getThemeFromGemini, getSingleQuestionFromGemini, editQuestionWithGemini, setCustomApiKey, getCustomApiKey } from '../services/geminiService';

interface SetupScreenProps {
  onComplete: (theme: GameTheme, teams: TeamConfig[]) => void;
  onLoading: () => void;
  currentTeams: TeamConfig[];
}

const COLOR_PRESETS: Record<string, Partial<TeamConfig>> = {
  blue: { bg: 'from-blue-500 to-indigo-600', border: 'border-blue-400', shadow: 'shadow-blue-500/40', text: 'text-blue-600', light: 'bg-blue-50' },
  rose: { bg: 'from-rose-500 to-red-600', border: 'border-rose-400', shadow: 'shadow-rose-500/40', text: 'text-rose-600', light: 'bg-rose-50' },
  amber: { bg: 'from-amber-400 to-orange-500', border: 'border-amber-400', shadow: 'shadow-amber-500/40', text: 'text-amber-600', light: 'bg-amber-50' },
  purple: { bg: 'from-fuchsia-500 to-purple-600', border: 'border-fuchsia-400', shadow: 'shadow-fuchsia-500/40', text: 'text-fuchsia-600', light: 'bg-fuchsia-50' },
  teal: { bg: 'from-teal-400 to-cyan-600', border: 'border-teal-400', shadow: 'shadow-teal-500/40', text: 'text-teal-600', light: 'bg-teal-50' },
  indigo: { bg: 'from-indigo-500 to-violet-700', border: 'border-indigo-400', shadow: 'shadow-indigo-500/40', text: 'text-indigo-600', light: 'bg-indigo-50' },
  emerald: { bg: 'from-emerald-500 to-green-700', border: 'border-emerald-400', shadow: 'shadow-emerald-500/40', text: 'text-emerald-600', light: 'bg-emerald-50' },
};

const TEAM_TEMPLATES: TeamConfig[] = [
  { name: 'Đội Rồng Xanh', theme: 'blue', icon: 'fa-dragon', bg: 'from-blue-500 to-indigo-600', border: 'border-blue-400', shadow: 'shadow-blue-500/40', text: 'text-blue-600', light: 'bg-blue-50' },
  { name: 'Đội Phượng Hoàng', theme: 'rose', icon: 'fa-fire', bg: 'from-rose-500 to-red-600', border: 'border-rose-400', shadow: 'shadow-rose-500/40', text: 'text-rose-600', light: 'bg-rose-50' },
  { name: 'Đội Sét Vàng', theme: 'amber', icon: 'fa-bolt', bg: 'from-amber-400 to-orange-500', border: 'border-amber-400', shadow: 'shadow-amber-500/40', text: 'text-amber-600', light: 'bg-amber-50' },
  { name: 'Đội Sao Tím', theme: 'purple', icon: 'fa-star', bg: 'from-fuchsia-500 to-purple-600', border: 'border-fuchsia-400', shadow: 'shadow-fuchsia-500/40', text: 'text-fuchsia-600', light: 'bg-fuchsia-50' },
  { name: 'Đội Lá Xanh', theme: 'teal', icon: 'fa-leaf', bg: 'from-teal-400 to-cyan-600', border: 'border-teal-400', shadow: 'shadow-teal-500/40', text: 'text-teal-600', light: 'bg-teal-50' },
];

const ICONS = ['fa-dragon', 'fa-fire', 'fa-bolt', 'fa-star', 'fa-leaf', 'fa-ghost', 'fa-rocket', 'fa-shield-halved', 'fa-paw', 'fa-crown', 'fa-gem', 'fa-mask'];
const PAIR_OPTIONS = [6, 8, 10, 12];
const TEAM_OPTIONS = [2, 3, 4, 5];

export const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete, currentTeams }) => {
  const [mode, setMode] = useState<'CHOICE' | 'AI' | 'MANUAL' | 'TEAMS'>('CHOICE');
  const [pairCount, setPairCount] = useState<number>(6);
  const [teamCount, setTeamCount] = useState<number>(currentTeams.length);
  const [prompt, setPrompt] = useState('');
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingIndices, setRegeneratingIndices] = useState<number[]>([]);
  const [editingInstructions, setEditingInstructions] = useState<{ [key: number]: string }>({});
  const [manualEditMode, setManualEditMode] = useState<{ [key: number]: boolean }>({});
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getCustomApiKey());
  const [teams, setTeams] = useState<TeamConfig[]>(currentTeams);
  const [manualTheme, setManualTheme] = useState<GameTheme>({
    name: 'Chủ đề tùy chỉnh',
    items: Array(pairCount).fill(null).map(() => ({
      emoji: '⭐',
      quiz: { question: '', options: ['', '', '', ''], correctAnswer: '' }
    }))
  });

  useEffect(() => {
    if (mode === 'CHOICE' || mode === 'MANUAL' && !isAiGenerated) {
      setManualTheme(prev => ({
        ...prev,
        items: Array(pairCount).fill(null).map((_, i) => prev.items[i] || {
          emoji: '⭐',
          quiz: { question: '', options: ['', '', '', ''], correctAnswer: '' }
        })
      }));
    }
  }, [pairCount, mode, isAiGenerated]);

  useEffect(() => {
    setTeams(prev => {
      if (prev.length === teamCount) return prev;
      if (prev.length > teamCount) return prev.slice(0, teamCount);
      const newTeams = [...prev];
      for (let i = prev.length; i < teamCount; i++) {
        newTeams.push(TEAM_TEMPLATES[i] || { ...TEAM_TEMPLATES[0], name: `Đội ${i + 1}` });
      }
      return newTeams;
    });
  }, [teamCount]);

  useEffect(() => {
    if (mode === 'MANUAL' && (window as any).MathJax) {
      (window as any).MathJax.typesetPromise().catch((err: Error) => console.error('MathJax error:', err));
    }
  }, [manualTheme, mode, manualEditMode]);

  const handleSaveApiKey = () => {
    setCustomApiKey(apiKeyInput.trim());
    setShowApiKeyModal(false);
  };

  const handleAiSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const mathPrompt = `${prompt}. Lưu ý: Sử dụng LaTeX cho công thức nếu cần.`;
      const theme = await getThemeFromGemini(mathPrompt, pairCount);
      setManualTheme(theme);
      setIsAiGenerated(true);
      setMode('MANUAL');
    } catch (err) {
      alert("Có lỗi khi tạo câu hỏi. Vui lòng thử lại!");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateItem = async (idx: number) => {
    setRegeneratingIndices(prev => [...prev, idx]);
    try {
      const newItem = await getSingleQuestionFromGemini(manualTheme.name || prompt);
      const newItems = [...manualTheme.items];
      newItems[idx] = newItem;
      setManualTheme({ ...manualTheme, items: newItems });
    } catch (err) {
      console.error("Lỗi khi đổi câu hỏi", err);
    } finally {
      setRegeneratingIndices(prev => prev.filter(i => i !== idx));
    }
  };

  const handleEditItemWithAI = async (idx: number) => {
    const instruction = editingInstructions[idx];
    if (!instruction || !instruction.trim()) return;
    
    setRegeneratingIndices(prev => [...prev, idx]);
    try {
      const currentItem = manualTheme.items[idx];
      const newItem = await editQuestionWithGemini(currentItem, instruction);
      const newItems = [...manualTheme.items];
      newItems[idx] = newItem;
      setManualTheme({ ...manualTheme, items: newItems });
      setEditingInstructions(prev => ({ ...prev, [idx]: '' }));
    } catch (err) {
      console.error("Lỗi khi sửa câu hỏi", err);
    } finally {
      setRegeneratingIndices(prev => prev.filter(i => i !== idx));
    }
  };

  const handleManualItemChange = (idx: number, field: string, value: any) => {
    const newItems = [...manualTheme.items];
    if (field === 'emoji') newItems[idx].emoji = value;
    else if (field === 'question') newItems[idx].quiz.question = value;
    else if (field === 'correctAnswer') newItems[idx].quiz.correctAnswer = value;
    setManualTheme({ ...manualTheme, items: newItems });
  };

  const handleOptionChange = (itemIdx: number, optIdx: number, value: string) => {
    const newItems = [...manualTheme.items];
    newItems[itemIdx].quiz.options[optIdx] = value;
    setManualTheme({ ...manualTheme, items: newItems });
  };

  const updateTeam = (idx: number, updates: Partial<TeamConfig>) => {
    const newTeams = [...teams];
    newTeams[idx] = { ...newTeams[idx], ...updates };
    setTeams(newTeams);
  };

  const validateManual = () => {
    return manualTheme.items.every(item => 
      item.emoji && item.quiz.question && 
      item.quiz.options.every(o => o.trim() !== '') && 
      item.quiz.options.includes(item.quiz.correctAnswer)
    );
  };

  if (isGenerating) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center animate-in fade-in duration-500">
        <div className="relative inline-block mb-12">
          <div className="w-32 h-32 border-8 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fa-solid fa-wand-magic-sparkles text-3xl text-emerald-600 animate-pulse"></i>
          </div>
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4">AI Đang Soạn Câu Hỏi...</h2>
        <p className="text-slate-500 font-bold text-lg">Vui lòng đợi trong giây lát, trí tuệ nhân tạo đang làm việc!</p>
        <div className="mt-8 flex justify-center gap-2">
           {[1,2,3].map(i => <div key={i} className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}}></div>)}
        </div>
      </div>
    );
  }

  if (mode === 'CHOICE') {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 relative">
        <div className="absolute top-4 right-4 z-50">
          <button 
            onClick={() => setShowApiKeyModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-xl text-slate-600 font-bold hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
          >
            <i className="fa-solid fa-key"></i> API Key
          </button>
        </div>

        {showApiKeyModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-left">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800">Cài đặt Gemini API Key</h3>
                <button onClick={() => setShowApiKeyModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              <p className="text-sm text-slate-600 font-medium mb-6">
                Nhập API Key của bạn từ Google AI Studio để sử dụng tính năng tạo câu hỏi tự động khi xuất bản web.
              </p>
              <input 
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-mono text-sm mb-6 transition-colors"
              />
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setShowApiKeyModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSaveApiKey}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md"
                >
                  Lưu API Key
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="inline-block p-4 bg-emerald-100 rounded-3xl mb-8 animate-float">
          <i className="fa-solid fa-gamepad text-5xl text-emerald-600"></i>
        </div>
        <h2 className="text-6xl font-black text-slate-900 mb-6 tracking-tight">Chuẩn Bị Cuộc Đua</h2>
        
        <div className="flex flex-col md:flex-row gap-8 justify-center mb-12">
          <div className="bg-white/50 backdrop-blur p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Số lượng cặp thẻ</p>
            <div className="flex justify-center gap-4">
              {PAIR_OPTIONS.map(num => (
                <button key={num} onClick={() => setPairCount(num)} className={`w-14 h-14 rounded-2xl font-black text-lg transition-all shadow-md ${pairCount === num ? 'bg-emerald-600 text-white scale-110 shadow-emerald-200' : 'bg-white text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}>{num}</button>
              ))}
            </div>
          </div>
          <div className="bg-white/50 backdrop-blur p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Số lượng đội chơi</p>
            <div className="flex justify-center gap-4">
              {TEAM_OPTIONS.map(num => (
                <button key={num} onClick={() => setTeamCount(num)} className={`w-14 h-14 rounded-2xl font-black text-lg transition-all shadow-md ${teamCount === num ? 'bg-indigo-600 text-white scale-110 shadow-indigo-200' : 'bg-white text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}>{num}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <button onClick={() => setMode('AI')} className="group p-10 bg-white rounded-[3rem] border-4 border-emerald-100 hover:border-emerald-500 transition-all shadow-xl flex flex-col items-center gap-6 active:scale-95">
            <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform"><i className="fa-solid fa-wand-magic-sparkles text-3xl text-emerald-600"></i></div>
            <h3 className="text-2xl font-black text-slate-800">Tạo Bằng AI</h3>
          </button>
          <button onClick={() => { setMode('MANUAL'); setIsAiGenerated(false); }} className="group p-10 bg-white rounded-[3rem] border-4 border-indigo-100 hover:border-indigo-500 transition-all shadow-xl flex flex-col items-center gap-6 active:scale-95">
            <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform"><i className="fa-solid fa-pen-nib text-3xl text-indigo-600"></i></div>
            <h3 className="text-2xl font-black text-slate-800">Tự Soạn</h3>
          </button>
          <button onClick={() => setMode('TEAMS')} className="group p-10 bg-white rounded-[3rem] border-4 border-rose-100 hover:border-rose-500 transition-all shadow-xl flex flex-col items-center gap-6 active:scale-95">
            <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform"><i className="fa-solid fa-users-gear text-3xl text-rose-600"></i></div>
            <h3 className="text-2xl font-black text-slate-800">Tùy Chỉnh Đội</h3>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'TEAMS') {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4 animate-in fade-in duration-700">
        <div className="flex items-center justify-between mb-12">
          <button onClick={() => setMode('CHOICE')} className="text-emerald-600 hover:text-emerald-800 font-black flex items-center gap-3 text-lg"><i className="fa-solid fa-circle-chevron-left"></i> Quay lại</button>
          <h2 className="text-4xl font-black text-slate-900">Cấu Hình {teams.length} Đội</h2>
          <div className="w-32"></div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {teams.map((team, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[3rem] shadow-xl border-2 border-slate-50 flex flex-col md:flex-row items-center gap-8 group">
              <div className={`w-24 h-24 rounded-[2rem] bg-gradient-to-br ${team.bg} flex items-center justify-center text-white text-4xl shadow-lg shrink-0 group-hover:rotate-6 transition-all duration-500`}><i className={`fa-solid ${team.icon}`}></i></div>
              <div className="flex-grow space-y-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Tên Đội</label>
                    <input value={team.name} onChange={e => updateTeam(idx, { name: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Biểu Tượng</label>
                    <div className="flex flex-wrap gap-2">
                      {ICONS.map(icon => (
                        <button key={icon} onClick={() => updateTeam(idx, { icon })} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${team.icon === icon ? 'bg-emerald-600 text-white scale-110' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}><i className={`fa-solid ${icon} text-sm`}></i></button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <button onClick={() => setMode('CHOICE')} className="px-16 py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-emerald-700 active:scale-95 transition-all">LƯU CẤU HÌNH</button>
        </div>
      </div>
    );
  }

  if (mode === 'AI') {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 animate-in zoom-in duration-500">
        <button onClick={() => setMode('CHOICE')} className="mb-10 text-emerald-600 hover:text-emerald-800 font-black flex items-center gap-3 text-lg"><i className="fa-solid fa-circle-chevron-left"></i> Quay lại</button>
        <div className="glass-panel p-16 rounded-[4rem] shadow-2xl">
          <h3 className="text-4xl font-black text-slate-900 mb-2">Chủ Đề Bạn Muốn?</h3>
          <p className="text-slate-400 font-bold mb-8">AI sẽ soạn thảo {pairCount} câu hỏi hấp dẫn dựa trên ý tưởng của bạn.</p>
          <form onSubmit={handleAiSubmit} className="space-y-10">
            <input autoFocus value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ví dụ: Động vật đại dương, Các hành tinh..." className="w-full bg-slate-100 border-none rounded-3xl px-8 py-6 text-xl font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none" />
            <button className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black text-2xl shadow-lg hover:bg-emerald-700 transition-all">TIẾP TỤC</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
        <button onClick={() => setMode(isAiGenerated ? 'AI' : 'CHOICE')} className="text-slate-400 hover:text-emerald-600 font-bold flex items-center gap-2 text-lg"><i className="fa-solid fa-arrow-left"></i> Quay lại</button>
        <div className="text-center">
            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">
              {isAiGenerated ? 'Xem trước & Chỉnh sửa AI' : `Soạn thảo ${pairCount} cặp thẻ`}
            </h3>
            <p className="text-emerald-600 text-sm font-black uppercase tracking-[0.2em] mt-2">CHỦ ĐỀ: {manualTheme.name}</p>
        </div>
        <div className="flex gap-4">
          {isAiGenerated && (
            <button onClick={() => handleAiSubmit()} className="px-8 py-4 bg-emerald-50 text-emerald-600 border-2 border-emerald-100 rounded-[2rem] font-black hover:bg-emerald-100 transition-all active:scale-95 flex items-center gap-2">
              <i className="fa-solid fa-rotate"></i> Tạo lại tất cả
            </button>
          )}
          <button onClick={() => validateManual() && onComplete(manualTheme, teams)} disabled={!validateManual()} className="px-12 py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-emerald-700 disabled:bg-slate-200 transition-all active:scale-95">BẮT ĐẦU CHƠI</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {manualTheme.items.map((item, idx) => {
          const isRegenerating = regeneratingIndices.includes(idx);
          return (
            <div key={idx} className={`bg-white p-6 rounded-[3rem] shadow-xl border-4 relative group hover:border-emerald-200 transition-all flex flex-col ${isRegenerating ? 'opacity-50 pointer-events-none border-emerald-400 animate-pulse' : 'border-slate-50'}`}>
              <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
                <button 
                  onClick={() => setManualEditMode(prev => ({ ...prev, [idx]: !prev[idx] }))}
                  title={manualEditMode[idx] ? "Xem trước" : "Sửa thủ công"}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${manualEditMode[idx] ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white'}`}
                >
                  <i className={`fa-solid ${manualEditMode[idx] ? 'fa-eye' : 'fa-pen'}`}></i>
                </button>
                {isAiGenerated && (
                  <button 
                    onClick={() => handleRegenerateItem(idx)}
                    title="Tạo mới hoàn toàn câu này"
                    className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                  >
                    <i className={`fa-solid fa-rotate-right ${isRegenerating ? 'animate-spin' : ''}`}></i>
                  </button>
                )}
                <div className="text-slate-200 font-black text-3xl">0{idx+1}</div>
              </div>

              {/* Preview or Manual Edit Section */}
              <div className="flex-grow mb-6 mt-12">
                {manualEditMode[idx] ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="shrink-0">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Biểu tượng</label>
                        <input value={item.emoji} onChange={e => handleManualItemChange(idx, 'emoji', e.target.value)} className="w-16 h-16 text-3xl text-center bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 transition-all" />
                      </div>
                      <div className="flex-grow">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Câu hỏi</label>
                        <textarea value={item.quiz.question} onChange={e => handleManualItemChange(idx, 'question', e.target.value)} rows={2} className="w-full bg-slate-50 rounded-xl px-4 py-2 text-sm font-bold focus:border-emerald-500 border-2 border-transparent outline-none transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Đáp án (Tích chọn câu đúng)</label>
                      {item.quiz.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex gap-3 items-center">
                          <div onClick={() => handleManualItemChange(idx, 'correctAnswer', opt)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${item.quiz.correctAnswer === opt && opt !== '' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-slate-50'}`}>
                            {item.quiz.correctAnswer === opt && opt !== '' && <i className="fa-solid fa-check text-[10px]"></i>}
                          </div>
                          <input value={opt} onChange={e => handleOptionChange(idx, oIdx, e.target.value)} placeholder={`Lựa chọn ${String.fromCharCode(65+oIdx)}`} className="flex-grow bg-slate-50 rounded-lg px-3 py-1.5 text-xs font-bold border-2 border-transparent focus:border-emerald-500 outline-none transition-all" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Giải thích</label>
                      <textarea value={item.quiz.explanation} onChange={e => handleManualItemChange(idx, 'explanation', e.target.value)} rows={2} className="w-full bg-slate-50 rounded-xl px-4 py-2 text-sm font-bold focus:border-emerald-500 border-2 border-transparent outline-none transition-all" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 text-4xl flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-slate-100 shrink-0">
                        {item.emoji}
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg leading-snug line-clamp-3">
                        {item.quiz.question}
                      </h4>
                    </div>

                    {item.quiz.svgIllustration && (
                      <div 
                        className="mb-4 flex justify-center items-center bg-slate-50 rounded-2xl p-2 overflow-hidden [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:max-h-32"
                        dangerouslySetInnerHTML={{ __html: item.quiz.svgIllustration }}
                      />
                    )}

                    <div className="space-y-2 mb-4">
                      {item.quiz.options.map((opt, oIdx) => {
                        const isCorrect = item.quiz.correctAnswer === opt && opt !== '';
                        return (
                          <div key={oIdx} className={`px-3 py-2 rounded-xl text-sm font-bold border-2 ${isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-transparent text-slate-600'}`}>
                            <span className="mr-2 opacity-50">{String.fromCharCode(65+oIdx)}.</span> {opt}
                            {isCorrect && <i className="fa-solid fa-check float-right mt-1 text-emerald-500"></i>}
                          </div>
                        );
                      })}
                    </div>

                    {item.quiz.explanation && (
                      <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Giải thích</p>
                        <p className="text-xs text-blue-800 font-semibold line-clamp-2" title={item.quiz.explanation}>{item.quiz.explanation}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Edit Section */}
              <div className="pt-4 border-t-2 border-slate-100 mt-auto">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  <i className="fa-solid fa-wand-magic-sparkles mr-1"></i> Yêu cầu AI sửa đổi
                </label>
                <div className="flex gap-2">
                  <input 
                    value={editingInstructions[idx] || ''} 
                    onChange={e => setEditingInstructions(prev => ({ ...prev, [idx]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleEditItemWithAI(idx)}
                    placeholder="VD: Đổi hình con mèo, làm câu hỏi khó hơn..." 
                    className="flex-grow bg-slate-50 rounded-xl px-3 py-2 text-xs font-bold focus:border-emerald-500 border-2 border-transparent outline-none transition-all" 
                  />
                  <button 
                    onClick={() => handleEditItemWithAI(idx)}
                    disabled={!editingInstructions[idx]?.trim() || isRegenerating}
                    className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 disabled:bg-slate-300 transition-all shrink-0"
                  >
                    <i className="fa-solid fa-paper-plane text-sm"></i>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
