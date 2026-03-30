
import React, { useState, useCallback } from 'react';
import { CardData, GameStatus, GameTheme, QuizQuestion, TeamConfig, GameHistoryItem } from './types';
import { audioService } from './services/audioService';
import { Card } from './components/Card';
import { QuestionModal } from './components/QuestionModal';
import { SetupScreen } from './components/SetupScreen';
import { TeamRandomizer } from './components/TeamRandomizer';

const DEFAULT_TEAMS: TeamConfig[] = [
  { name: 'Đội Rồng Xanh', theme: 'blue', icon: 'fa-dragon', bg: 'from-blue-500 to-indigo-600', border: 'border-blue-400', shadow: 'shadow-blue-500/40', text: 'text-blue-600', light: 'bg-blue-50' },
  { name: 'Đội Phượng Hoàng', theme: 'rose', icon: 'fa-fire', bg: 'from-rose-500 to-red-600', border: 'border-rose-400', shadow: 'shadow-rose-500/40', text: 'text-rose-600', light: 'bg-rose-50' },
  { name: 'Đội Sét Vàng', theme: 'amber', icon: 'fa-bolt', bg: 'from-amber-400 to-orange-500', border: 'border-amber-400', shadow: 'shadow-amber-500/40', text: 'text-amber-600', light: 'bg-amber-50' },
  { name: 'Đội Sao Tím', theme: 'purple', icon: 'fa-star', bg: 'from-fuchsia-500 to-purple-600', border: 'border-fuchsia-400', shadow: 'shadow-fuchsia-500/40', text: 'text-fuchsia-600', light: 'bg-fuchsia-50' },
  { name: 'Đội Lá Xanh', theme: 'teal', icon: 'fa-leaf', bg: 'from-teal-400 to-cyan-600', border: 'border-teal-400', shadow: 'shadow-teal-500/40', text: 'text-teal-600', light: 'bg-teal-50' },
];

const App: React.FC = () => {
  const [theme, setTheme] = useState<GameTheme | null>(null);
  const [teams, setTeams] = useState<TeamConfig[]>(DEFAULT_TEAMS);
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [status, setStatus] = useState<GameStatus>(GameStatus.SETUP);
  const [activeTeam, setActiveTeam] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<QuizQuestion | null>(null);
  const [lastMatchedPair, setLastMatchedPair] = useState<number[]>([]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const initializeGame = useCallback(async (gameTheme: GameTheme, customTeams?: TeamConfig[]) => {
    const finalTeams = customTeams || DEFAULT_TEAMS;
    setTeams(finalTeams);
    
    const cardPairs: CardData[] = [];
    gameTheme.items.forEach((item, idx) => {
      const cardBase = { content: item.emoji, isFlipped: false, isMatched: false, question: item.quiz };
      cardPairs.push({ ...cardBase, id: idx * 2 });
      cardPairs.push({ ...cardBase, id: idx * 2 + 1 });
    });

    setCards(shuffleArray(cardPairs));
    setTheme(gameTheme);
    setScores(new Array(finalTeams.length).fill(0));
    setFlippedIndices([]);
    setLastMatchedPair([]);

    try {
      const historyStr = localStorage.getItem('trucxanh_history');
      let history: GameHistoryItem[] = historyStr ? JSON.parse(historyStr) : [];
      
      const isDuplicate = history.length > 0 && JSON.stringify(history[0].theme) === JSON.stringify(gameTheme);
      
      if (!isDuplicate) {
        const newItem: GameHistoryItem = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          theme: gameTheme
        };
        history = [newItem, ...history].slice(0, 20);
        localStorage.setItem('trucxanh_history', JSON.stringify(history));
      }
    } catch (e) {
      console.error("Could not save history", e);
    }

    // Chuyển sang bước chọn đội ngẫu nhiên thay vì chơi ngay
    setStatus(GameStatus.RANDOMIZING);
  }, []);

  const handleRandomizationComplete = (winnerIndex: number) => {
    setActiveTeam(winnerIndex);
    setStatus(GameStatus.PLAYING);
  };

  const handleCardClick = (id: number) => {
    if (flippedIndices.length === 2 || status !== GameStatus.PLAYING) return;
    
    audioService.init(); 
    audioService.playFlip();
    const newFlipped = [...flippedIndices, id];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const card1 = cards.find(c => c.id === newFlipped[0]);
      const card2 = cards.find(c => c.id === newFlipped[1]);

      if (card1?.content === card2?.content) {
        setLastMatchedPair(newFlipped);
        setTimeout(() => {
          audioService.playMatch();
          setActiveQuestion(card1!.question || null);
          setStatus(GameStatus.QUESTION);
          setCards(prev => prev.map(c => 
            (c.id === card1!.id || c.id === card2!.id) ? { ...c, isMatched: true } : c
          ));
        }, 600);
      } else {
        setTimeout(() => {
          audioService.playWrong();
          setFlippedIndices([]);
          setActiveTeam(prev => (prev + 1) % teams.length);
        }, 1200);
      }
    }
  };

  const handleAnswer = (correct: boolean) => {
    const nextTeamIndex = (activeTeam + 1) % teams.length;

    if (correct) {
      setScores(prev => {
        const next = [...prev];
        next[activeTeam] += 10;
        return next;
      });
      
      setActiveQuestion(null);
      setStatus(GameStatus.PLAYING);
      setFlippedIndices([]);
      setLastMatchedPair([]);
      
      if (cards.every(c => c.isMatched)) {
        setStatus(GameStatus.WON);
        audioService.playVictory(); 
      }
    } else {
      setCards(prev => {
        const resetCards = prev.map(c => 
          lastMatchedPair.includes(c.id) ? { ...c, isMatched: false, isFlipped: false } : c
        );
        return shuffleArray(resetCards);
      });

      setActiveQuestion(null);
      setStatus(GameStatus.PLAYING);
      setFlippedIndices([]);
      setLastMatchedPair([]);
      setActiveTeam(nextTeamIndex);
    }
  };

  const maxScore = Math.max(...scores);

  const getGridCols = () => {
    const count = cards.length;
    if (count <= 12) return 'grid-cols-3 md:grid-cols-4';
    if (count <= 16) return 'grid-cols-4';
    if (count <= 20) return 'grid-cols-4 md:grid-cols-5';
    return 'grid-cols-4 md:grid-cols-6';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 min-h-screen flex flex-col font-sans text-slate-800">
      <header className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-4 rounded-3xl shadow-2xl animate-float">
            <i className="fa-solid fa-leaf text-white text-4xl"></i>
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-emerald-900 tracking-tight uppercase">TRÚC XANH</h1>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">Tournament Edition</p>
          </div>
        </div>

        {status !== GameStatus.SETUP && status !== GameStatus.RANDOMIZING && (
          <button 
            onClick={() => setStatus(GameStatus.SETUP)}
            className="px-8 py-4 bg-white text-emerald-600 rounded-[2rem] font-black shadow-lg hover:shadow-2xl transition-all border-2 border-emerald-50 group flex items-center gap-3"
          >
            <i className="fa-solid fa-gear group-hover:rotate-90 transition-transform duration-500"></i>
            TÙY CHỈNH MỚI
          </button>
        )}
      </header>

      {status === GameStatus.SETUP && (
        <SetupScreen 
          onComplete={initializeGame} 
          onLoading={() => {}} 
          currentTeams={teams}
        />
      )}

      {status === GameStatus.RANDOMIZING && (
        <TeamRandomizer teams={teams} onSelected={handleRandomizationComplete} />
      )}

      {(status === GameStatus.PLAYING || status === GameStatus.QUESTION || status === GameStatus.WON) && (
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start flex-grow animate-in fade-in duration-1000">
          <div className="lg:col-span-3 space-y-4">
            <div className="space-y-3">
              {teams.map((team, idx) => {
                const isActive = activeTeam === idx;
                return (
                  <div key={idx} className={`p-5 rounded-3xl transition-all duration-500 border-2 overflow-hidden relative ${
                    isActive 
                    ? `bg-gradient-to-r ${team.bg} ${team.border} shadow-2xl ${team.shadow} scale-105 z-10` 
                    : 'bg-white border-slate-100/50 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isActive ? 'bg-white/20' : `${team.light} ${team.text}`}`}>
                          <i className={`fa-solid ${team.icon} text-lg`}></i>
                        </div>
                        <div>
                          <h3 className={`font-black text-xs tracking-tight ${isActive ? 'text-white' : 'text-slate-800'}`}>{team.name}</h3>
                          {isActive && <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest">Đang cầm lượt</span>}
                        </div>
                      </div>
                      <p className={`text-2xl font-black ${isActive ? 'text-white' : team.text}`}>{scores[idx]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="glass-panel p-6 rounded-[2rem] shadow-xl border-2 border-emerald-50">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Chủ đề hiện tại</label>
               <p className="text-lg font-black text-emerald-900 uppercase tracking-tight truncate">{theme?.name}</p>
            </div>
          </div>

          <div className="lg:col-span-9">
            <div className={`grid ${getGridCols()} gap-4 md:gap-6 p-8 glass-panel rounded-[3rem] shadow-2xl border-2 border-emerald-50`}>
              {cards.map((card, idx) => (
                <Card 
                  key={card.id} 
                  card={{...card, isFlipped: flippedIndices.includes(card.id) || lastMatchedPair.includes(card.id)}} 
                  index={idx}
                  onClick={handleCardClick}
                  disabled={status !== GameStatus.PLAYING}
                />
              ))}
            </div>
          </div>
        </main>
      )}

      {activeQuestion && <QuestionModal question={activeQuestion} onAnswer={handleAnswer} />}

      {status === GameStatus.WON && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[150] flex items-center justify-center p-6">
          <div className="bg-white rounded-[4rem] p-12 max-w-4xl w-full text-center shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="text-8xl mb-8 animate-bounce">🏆</div>
              <h2 className="text-6xl font-black text-slate-900 mb-2 uppercase">Chiến Thắng!</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest mb-12">Bảng Xếp Hạng Cuối Cùng</p>
              
              <div className={`grid grid-cols-1 md:grid-cols-${Math.min(teams.length, 5)} gap-4 mb-12`}>
                 {scores.map((score, idx) => {
                   const isWinner = score === maxScore && score > 0;
                   const team = teams[idx];
                   return (
                     <div key={idx} className={`p-6 rounded-[2rem] transition-all transform ${isWinner ? `scale-110 ${team.light} border-4 ${team.border} shadow-2xl` : 'bg-slate-50 border-2 border-slate-100 opacity-60'}`}>
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{team.name}</p>
                       <p className={`text-4xl font-black ${team.text}`}>{score}</p>
                       {isWinner && <span className={`text-[10px] font-black ${team.text} uppercase mt-2 block animate-pulse`}>Quán Quân</span>}
                     </div>
                   );
                 })}
              </div>

              <button 
                onClick={() => setStatus(GameStatus.SETUP)}
                className="px-16 py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-2xl shadow-xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-4 mx-auto"
              >
                <i className="fa-solid fa-play"></i> VÁN MỚI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
