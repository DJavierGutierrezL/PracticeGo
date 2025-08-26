
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Flashcard } from './Flashcard';
import { PrevIcon, NextIcon, ShuffleIcon, FlipIcon } from './icons/Icons';
import type { FlashcardData } from '../types';

interface FlashcardWithActionProps extends FlashcardData {
    onFlip: () => void;
}

const FlashcardWithAction: React.FC<{ card: FlashcardWithActionProps }> = ({ card }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    card.onFlip();
  };

  return (
    <div className="w-full h-80 perspective-1000" onClick={handleFlip}>
      <div
        className={`relative w-full h-full transform-style-preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}
      >
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


interface VocabularyReviewProps {
    deck?: FlashcardData[];
    onActivityComplete: (activityType: string, points: number) => void;
}

export const VocabularyReview: React.FC<VocabularyReviewProps> = ({ deck, onActivityComplete }) => {
  const [shuffledDeck, setShuffledDeck] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasAwardedPoints, setHasAwardedPoints] = useState(false);

  useEffect(() => {
    if (deck && deck.length > 0) {
        setShuffledDeck([...deck].sort(() => Math.random() - 0.5));
        setCurrentIndex(0);
        setHasAwardedPoints(false); // Reset on new deck
    } else {
        setShuffledDeck([]);
    }
  }, [deck]);

  const currentCard = useMemo(() => shuffledDeck[currentIndex], [shuffledDeck, currentIndex]);

  const handleFirstFlip = () => {
      if (!hasAwardedPoints) {
          onActivityComplete('Repaso de Vocabulario', 10);
          setHasAwardedPoints(true);
      }
  };

  const goToNextCard = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % shuffledDeck.length);
  }, [shuffledDeck.length]);

  const goToPrevCard = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + shuffledDeck.length) % shuffledDeck.length);
  }, [shuffledDeck.length]);

  const shuffleDeck = useCallback(() => {
    if(shuffledDeck.length > 0) {
        setShuffledDeck(prev => [...prev].sort(() => Math.random() - 0.5));
        setCurrentIndex(0);
    }
  }, [shuffledDeck]);

  if (!deck || deck.length === 0) {
      return (
          <div className="max-w-2xl mx-auto text-center">
              <header className="mb-8">
                  <h2 className="text-3xl font-bold text-primary-600 dark:text-primary-400">Repaso de Vocabulario</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">Practica palabras clave de tu lección.</p>
              </header>
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 h-80 flex flex-col items-center justify-center">
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">No hay vocabulario seleccionado</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">Por favor, ve a <span className="font-bold text-primary-500">Clase del Día</span> para generar el vocabulario de una lección.</p>
              </div>
          </div>
      )
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-primary-600 dark:text-primary-400">Repaso de Vocabulario de la Lección</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Practica las palabras de la lección seleccionada.</p>
      </header>
      
      <FlashcardWithAction key={currentCard.english} card={{ ...currentCard, onFlip: handleFirstFlip }} />

      <div className="flex justify-between items-center mt-8">
        <button onClick={goToPrevCard} className="p-4 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
          <PrevIcon />
        </button>
        <div className="text-gray-500 dark:text-gray-400 font-medium">
          {currentIndex + 1} / {shuffledDeck.length}
        </div>
        <button onClick={goToNextCard} className="p-4 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
          <NextIcon />
        </button>
      </div>

      <div className="mt-6">
        <button onClick={shuffleDeck} className="px-6 py-3 bg-primary-500 text-white font-semibold rounded-full shadow-lg hover:bg-primary-600 transition-colors flex items-center mx-auto">
          <ShuffleIcon />
          <span className="ml-2">Barajar Mazo</span>
        </button>
      </div>
    </div>
  );
};
