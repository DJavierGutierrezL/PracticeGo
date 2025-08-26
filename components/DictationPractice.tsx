
import React, { useState, useCallback, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import type { Lesson } from '../types';
import { BookIcon, PlayIcon, PauseIcon, StopSpeechIcon, TortoiseIcon, TargetIcon } from './icons/Icons';

interface DictationPracticeProps {
    lesson: Lesson | null;
    onActivityComplete: (activityType: string, points: number, achievementId?: 'firstDictation') => void;
}

interface DictationContent {
    title: string;
    transcript: string;
}

interface ColoredSegment {
    word: string;
    status: 'correct' | 'incorrect' | 'space';
}

interface MisspelledWord {
    incorrect: string;
    correct: string;
}

const cleanTextForComparison = (text: string) => text.toLowerCase().replace(/[^\w\s']/g, "").split(/\s+/).filter(Boolean);

export const DictationPractice: React.FC<DictationPracticeProps> = ({ lesson, onActivityComplete }) => {
    const [dictation, setDictation] = useState<DictationContent | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userInput, setUserInput] = useState('');
    const [coloredUserInput, setColoredUserInput] = useState<ColoredSegment[] | null>(null);
    const [isChecked, setIsChecked] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [misspelledWords, setMisspelledWords] = useState<MisspelledWord[]>([]);
    
    useEffect(() => {
        return () => {
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
            }
        };
    }, []);

    const handleGenerateDictation = useCallback(async () => {
        if (!lesson) {
            setError("Por favor, selecciona una lección primero en 'Clase del Día'.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setDictation(null);
        setUserInput('');
        setIsChecked(false);
        setColoredUserInput(null);
        setMisspelledWords([]);
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        setIsPlaying(false);

        try {
            const content = await geminiService.generateDictation(lesson);
            setDictation(content);
        } catch (e) {
            setError("No se pudo generar el dictado. Por favor, inténtalo de nuevo.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [lesson]);
    
    const handlePlay = useCallback((rate: number = 1.0) => {
        if (!dictation) return;

        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(dictation.transcript);
        utterance.lang = 'en-US';
        utterance.rate = rate;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => {
            setIsPlaying(false);
            setError("No se pudo reproducir el audio del dictado.");
        };
        
        speechSynthesis.speak(utterance);
        setIsPlaying(true);
    }, [dictation]);

    const handlePause = () => {
        speechSynthesis.pause();
        setIsPlaying(false);
    };

    const handleResume = () => {
        speechSynthesis.resume();
        setIsPlaying(true);
    };

    const handleStop = () => {
        speechSynthesis.cancel();
        setIsPlaying(false);
    };

    const handleCheck = () => {
        if (!dictation) return;
        
        onActivityComplete('Dictado Completado', 15, 'firstDictation');

        const originalWords = cleanTextForComparison(dictation.transcript);
        const userSegments = userInput.split(/(\s+)/); // Split by space, keeping spaces
        const newMisspelled: MisspelledWord[] = [];
        
        let originalWordIndex = 0;
        
        const newColoredInput: ColoredSegment[] = userSegments.map(segment => {
            if (segment.trim() === '') {
                return { word: segment, status: 'space' };
            }
            
            const cleanSegment = segment.toLowerCase().replace(/[^\w\s']/g, "");
            
            if (originalWordIndex < originalWords.length) {
                if (cleanSegment === originalWords[originalWordIndex]) {
                    originalWordIndex++;
                    return { word: segment, status: 'correct' };
                } else {
                    newMisspelled.push({ incorrect: segment, correct: originalWords[originalWordIndex] });
                    originalWordIndex++;
                    return { word: segment, status: 'incorrect' };
                }
            } else {
                // User typed extra words not in the original
                newMisspelled.push({ incorrect: segment, correct: '' }); // No correct equivalent
                return { word: segment, status: 'incorrect' };
            }
        });

        setColoredUserInput(newColoredInput);
        setMisspelledWords(newMisspelled);
        setIsChecked(true);
    };
    
    const getResultColor = (status: ColoredSegment['status']) => {
        switch (status) {
            case 'correct': return 'font-semibold text-green-600 dark:text-green-400';
            case 'incorrect': return 'font-semibold text-red-500 dark:text-red-400';
            default: return '';
        }
    };

    if (!lesson) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                <div className="text-primary-500 mb-4"><BookIcon /></div>
                <h2 className="text-3xl font-bold text-gray-700 dark:text-gray-200 mb-2">Dictado en Línea</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">Ve a <span className="font-bold text-primary-500">'Clase del Día'</span> para seleccionar una lección y generar tu práctica de dictado personalizada.</p>
            </div>
        );
    }
    
    return (
        <div className="max-w-6xl mx-auto">
            <header className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400">Dictado en Línea</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-base md:text-lg">Genera un dictado con IA basado en tu lección actual.</p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 md:p-8 rounded-2xl shadow-xl border border-primary-500/10 dark:border-gray-700">
                    {!dictation && !isLoading && (
                        <div className="text-center">
                            <p className="mb-4 text-gray-600 dark:text-gray-300">Práctica de dictado para: <span className="font-bold text-primary-700 dark:text-primary-300">{lesson.title}</span></p>
                            <button onClick={handleGenerateDictation} className="px-8 py-3 bg-primary-500 text-white font-bold rounded-full shadow-lg hover:bg-primary-600 transition-transform transform hover:scale-105">
                               Generar Dictado
                            </button>
                        </div>
                    )}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-48">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
                            <p className="mt-4 text-primary-600 dark:text-primary-400">La IA está preparando tu dictado...</p>
                        </div>
                    )}
                    {error && <p className="text-center text-red-500">{error}</p>}
                    
                    {dictation && !isLoading && (
                        <div className="animate-fade-in-up">
                            <h3 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-4">{dictation.title}</h3>
                            
                             <div className="flex justify-center items-center space-x-2 sm:space-x-4 mb-6 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-full">
                                {!isPlaying && !speechSynthesis.speaking ? (
                                    <button onClick={() => handlePlay(1.0)} className="p-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors" aria-label="Play"><PlayIcon /></button>
                                ) : isPlaying ? (
                                    <button onClick={handlePause} className="p-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors" aria-label="Pause"><PauseIcon /></button>
                                ) : (
                                    <button onClick={handleResume} className="p-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors" aria-label="Resume"><PlayIcon /></button>
                                )}
                                <button onClick={() => handlePlay(0.6)} className="p-3 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors" aria-label="Play Slower">
                                    <TortoiseIcon />
                                </button>
                                <button onClick={handleStop} disabled={!speechSynthesis.speaking && !isPlaying} className="p-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600" aria-label="Stop"><StopSpeechIcon /></button>
                            </div>
                            
                            <div className="mb-4">
                                <label htmlFor="dictation-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tu respuesta:</label>
                                <textarea
                                    id="dictation-input"
                                    rows={3}
                                    value={userInput}
                                    onChange={(e) => { setUserInput(e.target.value); if(isChecked) setIsChecked(false); }}
                                    placeholder="Escribe aquí lo que escuchas..."
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={handleCheck}
                                    disabled={!userInput.trim()}
                                    className="px-8 py-3 bg-primary-500 text-white font-bold rounded-full shadow-lg hover:bg-primary-600 transition-transform transform hover:scale-105 disabled:bg-primary-500/50 dark:disabled:bg-gray-600"
                                >
                                    Comprobar
                                </button>
                                 <button onClick={handleGenerateDictation} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-full shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                                    Generar Otro Dictado
                                </button>
                            </div>

                            {isChecked && coloredUserInput && (
                                 <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg animate-fade-in-up">
                                    <h4 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">Tu Intento:</h4>
                                    <p className="text-xl md:text-2xl font-serif leading-loose mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-md">
                                       {coloredUserInput.map((item, index) => (
                                           <span key={index} className={getResultColor(item.status)}>
                                               {item.word}
                                           </span>
                                       ))}
                                    </p>
                                    <h4 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">Texto Original:</h4>
                                    <p className="text-xl md:text-2xl font-serif leading-loose text-gray-600 dark:text-gray-400 p-4 border border-gray-200 dark:border-gray-600 rounded-md">
                                        {dictation.transcript}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-primary-500/10 dark:border-gray-700 p-6 h-full">
                    <div className="flex items-center mb-4">
                        <div className="text-primary-500 mr-3"><TargetIcon /></div>
                        <h3 className="text-xl font-bold text-primary-600 dark:text-primary-400">Palabras a Practicar</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Las palabras que escribas mal aparecerán aquí.</p>
                    <div className="space-y-3">
                        {misspelledWords.length === 0 ? (
                            <div className="text-center text-gray-400 dark:text-gray-500 pt-8">Tu lista de práctica está vacía.</div>
                        ) : (
                            <ul className="space-y-3">
                                {misspelledWords.map((word, index) => (
                                    <li key={index} className="flex items-center justify-between bg-primary-500/10 dark:bg-gray-700 p-3 rounded-lg">
                                        <span className="text-gray-500 dark:text-gray-400 line-through">{word.incorrect}</span>
                                        <span className="text-lg font-bold mx-2 text-primary-400">→</span>
                                        <span className="text-gray-800 dark:text-gray-100 font-semibold">{word.correct}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
