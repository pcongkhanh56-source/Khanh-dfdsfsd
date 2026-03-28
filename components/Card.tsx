
import React from 'react';
import { CardData } from '../types';

interface CardProps {
  card: CardData;
  index: number;
  onClick: (id: number) => void;
  disabled: boolean;
}

export const Card: React.FC<CardProps> = ({ card, index, onClick, disabled }) => {
  const isShown = card.isFlipped || card.isMatched;

  return (
    <div 
      className="relative w-full aspect-square perspective-1000 cursor-pointer group"
      onClick={() => !disabled && !isShown && onClick(card.id)}
    >
      <div 
        className={`card-inner relative w-full h-full transform-style-3d ${
          isShown ? 'rotate-y-180' : ''
        }`}
      >
        {/* FRONT FACE (Revealed Content) */}
        <div className={`absolute inset-0 w-full h-full flex items-center justify-center rounded-[2rem] shadow-2xl border-4 backface-hidden rotate-y-180 transition-all duration-500 ${
          card.isMatched 
            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-400 ring-8 ring-emerald-500/10' 
            : 'bg-white border-white'
        }`}>
          <div className="flex flex-col items-center p-2">
            <span className={`text-4xl sm:text-5xl lg:text-7xl select-none transition-all duration-700 ${card.isMatched ? 'scale-110 rotate-[360deg] drop-shadow-xl' : ''}`}>
              {card.content}
            </span>
            {card.isMatched && (
               <div className="absolute top-4 right-4 bg-emerald-500 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                 <i className="fa-solid fa-check text-white text-xs"></i>
               </div>
            )}
          </div>
        </div>

        {/* BACK FACE (Vibrant Colorful Pattern) */}
        <div className={`absolute inset-0 w-full h-full rounded-[2rem] shadow-xl backface-hidden border-4 border-white overflow-hidden transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] ${
          'bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400'
        }`}>
          {/* Glass Overlay Pattern */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
          
          {/* Internal Shimmer */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>

          <div className="relative flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-[0_10px_20px_rgba(0,0,0,0.1)] flex items-center justify-center mb-2 transform rotate-3 group-hover:rotate-12 transition-all duration-500">
              <span className="text-emerald-700 text-3xl font-black italic tracking-tighter drop-shadow-sm">
                {index + 1}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 bg-white/40 rounded-full"></div>
              <span className="text-white text-[10px] font-black tracking-[0.25em] uppercase drop-shadow-md">TRÚC XANH</span>
              <div className="h-1 w-1 bg-white/40 rounded-full"></div>
            </div>
          </div>
          
          {/* Corner Decors */}
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-emerald-300/20 rounded-full blur-xl"></div>
        </div>
      </div>
    </div>
  );
};
