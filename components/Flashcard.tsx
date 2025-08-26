import React, { useState } from 'react';
import type { FlashcardData } from '../types';
import { FlipIcon } from './icons/Icons';

interface FlashcardProps {
  card: FlashcardData;
}

export const Flashcard: React.FC<FlashcardProps> = ({ card }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="w-full h-80 perspective-1000" onClick={handleFlip}>
      <div
        className={`relative w-full h-full transform-style-preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* Front of the card */}
        <div className="absolute w-full h-full backface-hidden flex flex-col justify-center items-center p-6 bg-gradient-to-br from-white to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 cursor-pointer">
          <h3 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">{card.english}</h3>
          {card.conjugation && (
             <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">(he/she/it: <span className="font-semibold text-gray-600 dark:text-gray-300">{card.conjugation}</span>)</p>
          )}
          <p className="text-center text-gray-600 dark:text-gray-300 italic">"{card.example}"</p>
          <div className="absolute bottom-4 right-4 text-gray-400 dark:text-gray-500">
            <FlipIcon />
          </div>
        </div>

        {/* Back of the card */}
        <div className="absolute w-full h-full backface-hidden flex flex-col justify-center items-center p-6 bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-2xl shadow-xl cursor-pointer rotate-y-180">
          <h3 className="text-4xl font-bold">{card.spanish}</h3>
           <div className="absolute bottom-4 right-4 text-white/70">
            <FlipIcon />
          </div>
        </div>
      </div>
    </div>
  );
};