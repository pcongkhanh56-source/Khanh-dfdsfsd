
import React, { useEffect, useState } from 'react';
import { QuizQuestion } from '../types';
import { audioService } from '../services/audioService';

interface QuestionModalProps {
  question: QuizQuestion;
  onAnswer: (correct: boolean) => void;
}

const TIMER_DURATION = 45;

export const QuestionModal: React.FC<QuestionModalProps> = ({ question, onAnswer }) => {
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Trigger MathJax typesetting when the modal content changes or result shows
  useEffect(() => {
    if ((window as any).MathJax) {
      (window as any).MathJax.typesetPromise().catch((err: Error) => console.error('MathJax error:', err));
    }
  }, [question, showResult]);

  // Countdown timer logic
  useEffect(() => {
    if (showResult) return; // Stop timer when answer is selected

    if (timeLeft <= 0) {
      handleOptionClick(null); // Time out
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showResult]);

  const handleOptionClick = (opt: string | null) => {
    if (showResult) return;
    
    const isCorrect = opt === question.correctAnswer;
    if (isCorrect) {
      audioService.playCorrectAnswer();
    } else {
      audioService.playWrongAnswer();
    }
    
    setSelectedOption(opt);
    setShowResult(true);
  };

  const handleContinue = () => {
    onAnswer(selectedOption === question.correctAnswer);
  };

  const timerColor = timeLeft > 10 ? 'text-emerald-500' : 'text-rose-500 animate-pulse';
  const progressWidth = (timeLeft / TIMER_DURATION) * 100;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-[3rem] w-full max-w-3xl max-h-full flex flex-col shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header with Timer */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6 text-white flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="flex items-center gap-4 z-10">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm">
              <i className="fa-solid fa-brain text-2xl text-yellow-300"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight uppercase">Thử Thách</h3>
              <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest">
                {showResult ? 'Kết quả câu hỏi' : 'Chọn đáp án đúng nhất'}
              </p>
            </div>
          </div>

          {!showResult && (
            <div className="flex flex-col items-end z-10">
              <div className={`text-4xl font-black tabular-nums ${timerColor}`}>
                {timeLeft}s
              </div>
            </div>
          )}
          
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
          
          {/* Progress Bar Background */}
          {!showResult && (
            <div className="absolute bottom-0 left-0 w-full h-2 bg-white/10">
               <div 
                 className={`h-full transition-all duration-1000 ease-linear ${timeLeft > 15 ? 'bg-emerald-400' : 'bg-rose-400'}`} 
                 style={{ width: `${progressWidth}%` }}
               ></div>
            </div>
          )}
        </div>
        
        <div className="p-8 sm:p-10 overflow-y-auto">
          {/* Question text */}
          <div className="mb-8 text-center px-4">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 leading-tight">
              {question.question}
            </p>
            {question.svgIllustration && (
              <div 
                className="mt-6 flex justify-center items-center max-w-full overflow-hidden rounded-xl [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:max-h-48"
                dangerouslySetInnerHTML={{ __html: question.svgIllustration }}
              />
            )}
          </div>
          
          {/* Result View or Option Selection */}
          {showResult ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={`p-6 sm:p-8 rounded-[2.5rem] mb-6 text-center border-4 ${selectedOption === question.correctAnswer ? 'bg-emerald-50 border-emerald-500' : 'bg-rose-50 border-rose-500'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${selectedOption === question.correctAnswer ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  <i className={`fa-solid ${selectedOption === question.correctAnswer ? 'fa-check' : 'fa-xmark'} text-3xl`}></i>
                </div>
                <h4 className={`text-xl font-black mb-1 ${selectedOption === question.correctAnswer ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {selectedOption === question.correctAnswer ? 'CHÍNH XÁC!' : (selectedOption === null ? 'HẾT GIỜ RỒI!' : 'CHƯA ĐÚNG!')}
                </h4>
                <p className="text-slate-600 font-bold text-base mb-4">
                  Đáp án: <span className="text-emerald-600 font-black">{question.correctAnswer}</span>
                </p>
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Giải thích chi tiết</p>
                  <p className="text-slate-700 font-semibold leading-relaxed text-sm sm:text-base">
                    {question.explanation || "Không có giải thích chi tiết cho câu hỏi này."}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleContinue}
                className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                TIẾP TỤC <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(opt)}
                  className="w-full p-4 sm:p-5 text-left rounded-[1.5rem] border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all font-bold text-slate-800 flex items-center gap-4 group active:scale-[0.98] shadow-sm hover:shadow-md"
                >
                  <span className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl text-slate-400 font-black group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-grow text-lg sm:text-xl leading-snug">{opt}</span>
                </button>
              ))}
            </div>
          )}

          {!showResult && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-3 px-5 py-2 bg-slate-50 rounded-full border border-slate-100">
                 <span className={`w-2 h-2 rounded-full animate-pulse ${timeLeft > 15 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   Thời gian còn lại: {timeLeft} giây
                 </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
