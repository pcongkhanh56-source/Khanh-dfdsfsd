
import React, { useEffect, useState, useRef } from 'react';
import { TeamConfig } from '../types';
import { audioService } from '../services/audioService';

interface TeamRandomizerProps {
  teams: TeamConfig[];
  onSelected: (index: number) => void;
}

export const TeamRandomizer: React.FC<TeamRandomizerProps> = ({ teams, onSelected }) => {
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    let speed = 50;
    let count = 0;
    // Tạo số lần nhảy ngẫu nhiên để kết quả không đoán trước được
    const maxCount = 25 + Math.floor(Math.random() * 20);
    
    const tick = () => {
      // Cập nhật chỉ số mới
      const nextIndex = (currentIndexRef.current + 1) % teams.length;
      currentIndexRef.current = nextIndex;
      setHighlightedIndex(nextIndex);
      
      audioService.playTick();
      count++;
      
      if (count < maxCount) {
        // Tốc độ quay chậm dần ở những vòng cuối
        if (count > maxCount - 10) {
          speed += 50;
        } else if (count > maxCount - 20) {
          speed += 20;
        }
        
        setTimeout(tick, speed);
      } else {
        // Khi kết thúc
        audioService.playTada();
        setIsFinished(true);
        
        // Đợi 2 giây để người chơi thấy rõ đội thắng trước khi vào game
        setTimeout(() => {
          onSelected(currentIndexRef.current);
        }, 2000);
      }
    };
    
    const startTimeout = setTimeout(tick, speed);
    return () => clearTimeout(startTimeout);
  }, [teams.length, onSelected]);

  const winner = teams[highlightedIndex];

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[200] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full">
        <div className="mb-12">
          <h2 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight leading-tight uppercase">
            Ai Sẽ Đi Đầu?
          </h2>
          <p className="text-emerald-400 font-bold uppercase tracking-[0.4em] text-sm md:text-base">Vòng quay may mắn đang chọn đội khởi hành...</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mb-16 px-4">
          {teams.map((team, idx) => {
            const isHighlighted = highlightedIndex === idx;
            return (
              <div 
                key={idx}
                className={`relative p-6 md:p-10 rounded-[3rem] border-4 transition-all duration-150 transform ${
                  isHighlighted 
                  ? `scale-110 border-white bg-gradient-to-br ${team.bg} shadow-[0_0_60px_rgba(255,255,255,0.4)] z-20` 
                  : 'border-white/5 bg-white/5 opacity-20 grayscale scale-90 z-10'
                }`}
              >
                <div className={`w-20 h-20 md:w-28 md:h-28 rounded-[2rem] flex items-center justify-center text-white text-4xl md:text-6xl mb-4 transition-transform ${isHighlighted ? 'animate-bounce' : ''}`}>
                  <i className={`fa-solid ${team.icon}`}></i>
                </div>
                <p className="text-white font-black text-sm md:text-lg uppercase tracking-widest whitespace-nowrap">{team.name}</p>
                
                {isHighlighted && isFinished && (
                   <div className="absolute -top-6 -right-6 bg-yellow-400 w-16 h-16 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-2xl animate-in zoom-in spin-in duration-500">
                     <i className="fa-solid fa-crown text-slate-900 text-2xl"></i>
                   </div>
                )}
              </div>
            );
          })}
        </div>

        {isFinished && (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
             <div className={`inline-block px-12 py-6 rounded-[2.5rem] bg-white text-slate-900 font-black text-2xl md:text-4xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] transform -rotate-1`}>
               CHÚC MỪNG <span className="text-emerald-600">{winner.name.toUpperCase()}</span>!
             </div>
             <p className="text-white/50 font-bold mt-6 animate-pulse uppercase tracking-[0.3em] text-xs md:text-sm">Trận đấu sẽ bắt đầu ngay bây giờ...</p>
          </div>
        )}
      </div>
      
      {/* Decorative particles for finishing */}
      {isFinished && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-white rounded-full animate-ping delay-300"></div>
          <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-emerald-400 rounded-full animate-ping delay-700"></div>
        </div>
      )}
    </div>
  );
};
