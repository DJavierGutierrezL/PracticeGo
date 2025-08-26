import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import type { WordDefinition } from '../types';
import { CloseIcon } from './icons/Icons';

interface WordWithTooltipProps {
  word: string;
  originalColor?: string;
}

export const WordWithTooltip: React.FC<WordWithTooltipProps> = ({ word, originalColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  
  const baseColor = originalColor ? '' : 'text-gray-800 dark:text-gray-100';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  
  const handleClick = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    if (!definition && !error) {
      setIsLoading(true);
      setError(null);
      try {
        const result = await geminiService.getWordDefinition(word);
        setDefinition(result);
      } catch (e) {
        setError("No se pudo obtener la definición.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (word.trim() === '') {
    return <span>{word}</span>;
  }

  return (
    <span className="relative inline-block" ref={wrapperRef}>
      <span
        onClick={handleClick}
        className={`cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-600/50 rounded transition-colors duration-200 ${isOpen ? 'bg-yellow-200 dark:bg-yellow-600/50' : ''} ${originalColor || baseColor}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {word}
      </span>
      {isOpen && (
        <div 
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600 p-4 text-left animate-fade-in-up"
          role="tooltip"
        >
            <button onClick={() => setIsOpen(false)} className="absolute top-2 right-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Cerrar">
                <CloseIcon />
            </button>
          <h4 className="font-bold text-lg text-pink-600 dark:text-pink-400 mb-2 capitalize">{word.toLowerCase().replace(/[.,!?]/g, '')}</h4>
          {isLoading && <div className="text-gray-500 dark:text-gray-400">Cargando...</div>}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {definition && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Traducción:</p>
                <p className="text-gray-800 dark:text-gray-100 font-bold">{definition.translation}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Resumen (IA):</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{definition.overview}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </span>
  );
};