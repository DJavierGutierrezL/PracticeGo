
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CLASSICS_DATA, CHILDRENS_STORIES_DATA } from '../contentData';
import type { ClassicStory, QuizQuestion } from '../types';
import { WordWithTooltip } from './WordWithTooltip';
import { ClassicsIcon, PrevIcon, PlayIcon, PauseIcon, StopSpeechIcon } from './icons/Icons';

interface ComprehensionQuizProps {
    questions: QuizQuestion[];
    onQuizComplete: (activityType: string, points: number, achievementId?: 'firstListening') => void;
}

const ComprehensionQuiz: React.FC<ComprehensionQuizProps> = ({ questions, onQuizComplete }) => {
    const [userAnswers, setUserAnswers] = useState<(string | null)[]>(() => Array(questions.length).fill(null));
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        setUserAnswers(Array(questions.length).fill(null));
        setIsSubmitted(false);
    }, [questions]);

    const handleAnswerChange = (questionIndex: number, answer: string) => {
        setUserAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[questionIndex] = answer;
            return newAnswers;
        });
        if (isSubmitted) setIsSubmitted(false);
    };

    const handleCheckAnswers = () => {
        setIsSubmitted(true);
        onQuizComplete('Listening Quiz', 10, 'firstListening');
    };

    return (
        <div className="mt-8 bg-amber-50 dark:bg-gray-900/50 p-6 rounded-2xl">
            <h3 className="text-2xl font-bold text-amber-800 dark:text-amber-300 mb-6">Comprensión Lectora</h3>
            <div className="space-y-6">
                {questions.map((q, qIndex) => (
                    <div key={qIndex}>
                        <p className="font-semibold text-gray-800 dark:text-gray-200 mb-3">{qIndex + 1}. {q.question}</p>
                        <div className="space-y-2">
                            {q.type === 'true-false' && ['True', 'False'].map(option => {
                                const isChecked = userAnswers[qIndex] === option;
                                let bgColor = 'bg-white dark:bg-gray-700';
                                if (isSubmitted) {
                                    if (isChecked && option === q.answer) bgColor = 'bg-green-200 dark:bg-green-800';
                                    else if (isChecked && option !== q.answer) bgColor = 'bg-red-200 dark:bg-red-800';
                                    else if (option === q.answer) bgColor = 'bg-green-200 dark:bg-green-800';
                                }
                                return (
                                    <label key={option} className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${bgColor}`}>
                                        <input type="radio" name={`q-${qIndex}`} value={option} checked={isChecked} onChange={() => handleAnswerChange(qIndex, option)} className="mr-3 form-radio text-amber-600 focus:ring-amber-500" />
                                        <span>{option}</span>
                                    </label>
                                );
                            })}
                            {q.type === 'multiple-choice' && q.options?.map(option => {
                                const isChecked = userAnswers[qIndex] === option;
                                let bgColor = 'bg-white dark:bg-gray-700';
                                if (isSubmitted) {
                                    if (isChecked && option === q.answer) bgColor = 'bg-green-200 dark:bg-green-800';
                                    else if (isChecked && option !== q.answer) bgColor = 'bg-red-200 dark:bg-red-800';
                                    else if (option === q.answer) bgColor = 'bg-green-200 dark:bg-green-800';
                                }
                                return (
                                    <label key={option} className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${bgColor}`}>
                                        <input type="radio" name={`q-${qIndex}`} value={option} checked={isChecked} onChange={() => handleAnswerChange(qIndex, option)} className="mr-3 form-radio text-amber-600 focus:ring-amber-500" />
                                        <span>{option}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-8 text-center">
                <button onClick={handleCheckAnswers} className="px-8 py-3 bg-amber-600 text-white font-bold rounded-full shadow-lg hover:bg-amber-700 transition-transform transform hover:scale-105">
                    Comprobar Respuestas
                </button>
            </div>
        </div>
    );
};

interface EnglishClassicsProps {
    onActivityComplete: (activityType: string, points: number, achievementId?: 'firstListening') => void;
}

export const EnglishClassics: React.FC<EnglishClassicsProps> = ({ onActivityComplete }) => {
    const [activeTab, setActiveTab] = useState<'classics' | 'childrens'>('classics');
    const [selectedStory, setSelectedStory] = useState<ClassicStory | null>(null);
    const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        return () => {
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
            }
        };
    }, [selectedStory]);

    const handlePlay = useCallback(() => {
        if (!selectedStory || speechSynthesis.speaking) return;

        const utterance = new SpeechSynthesisUtterance(selectedStory.text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;

        utterance.onboundary = (event) => {
            if(event.name === 'word') {
                const textUpToBoundary = selectedStory.text.substring(0, event.charIndex);
                const wordCount = (textUpToBoundary.match(/\s+/g) || []).length;
                setCurrentWordIndex(wordCount);
            }
        };

        utterance.onend = () => {
            setIsPlaying(false);
            setCurrentWordIndex(-1);
        };
        
        utterance.onerror = () => {
             setIsPlaying(false);
             setCurrentWordIndex(-1);
             setError("No se pudo reproducir el audio.");
        };

        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
        setIsPlaying(true);
        setError(null);

    }, [selectedStory]);

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
        setCurrentWordIndex(-1);
    };

    const handleSelectStory = (story: ClassicStory) => {
        const shuffledQuiz = [...story.quiz].sort(() => 0.5 - Math.random());
        setCurrentQuiz(shuffledQuiz.slice(0, 5));
        setSelectedStory(story);
        setError(null);
    };

    const handleGoBack = () => {
        handleStop(); 
        setSelectedStory(null);
        setError(null);
        setCurrentQuiz([]);
    };

    const renderStoryText = () => {
        if (!selectedStory) return null;
        let wordCounter = 0;
        return selectedStory.text.split(/(\s+)/).map((segment, index) => {
            if (segment.trim().length === 0) {
                return <span key={index}>{segment}</span>;
            }
            const isHighlighted = wordCounter === currentWordIndex;
            wordCounter++;
            return (
                <span key={index} className={`${isHighlighted ? 'underline decoration-wavy decoration-amber-500 dark:decoration-amber-400 decoration-2 underline-offset-2' : ''}`}>
                    <WordWithTooltip word={segment} />
                </span>
            );
        });
    };

    if (selectedStory) {
        return (
            <div className="max-w-4xl mx-auto animate-fade-in-up">
                 <button onClick={handleGoBack} className="flex items-center gap-2 mb-6 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <PrevIcon /> Volver a la lista
                </button>
                <div className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-2xl shadow-xl border border-amber-100 dark:border-gray-700">
                    <header className="text-center mb-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-amber-700 dark:text-amber-400 font-serif">{selectedStory.title}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">by {selectedStory.author}</p>
                    </header>
                    
                    <div className="flex justify-center items-center space-x-4 mb-6 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-full">
                        {!isPlaying && !speechSynthesis.speaking ? (
                            <button onClick={handlePlay} className="p-3 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors" aria-label="Play">
                                <PlayIcon />
                            </button>
                        ) : isPlaying ? (
                            <button onClick={handlePause} className="p-3 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors" aria-label="Pause">
                                <PauseIcon />
                            </button>
                        ) : (
                             <button onClick={handleResume} className="p-3 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors" aria-label="Resume">
                                <PlayIcon />
                            </button>
                        )}
                        <button onClick={handleStop} disabled={!speechSynthesis.speaking && !isPlaying} className="p-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600" aria-label="Stop">
                            <StopSpeechIcon />
                        </button>
                    </div>

                    <article className="prose dark:prose-invert prose-lg max-w-none text-justify leading-relaxed">
                        <p>{renderStoryText()}</p>
                    </article>
                    
                    {error && <p className="text-center text-red-500 mt-8">{error}</p>}
                    
                    {currentQuiz.length > 0 && <ComprehensionQuiz questions={currentQuiz} onQuizComplete={onActivityComplete} />}
                </div>
                 <footer className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
                    Texto provisto por EnglishClub.com
                </footer>
            </div>
        );
    }

    const storiesToShow = activeTab === 'classics' ? CLASSICS_DATA : CHILDRENS_STORIES_DATA;

    return (
        <div className="max-w-4xl mx-auto">
            <header className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-amber-700 dark:text-amber-400">Listening</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-base md:text-lg">Lee y escucha historias para practicar tu listening.</p>
            </header>

             <div className="flex justify-center mb-8 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('classics')}
                    className={`px-4 md:px-6 py-3 font-semibold text-base md:text-lg transition-colors ${activeTab === 'classics' ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600' : 'text-gray-500 dark:text-gray-400 hover:text-amber-500'}`}
                >
                    Fábulas Clásicas
                </button>
                <button
                    onClick={() => setActiveTab('childrens')}
                    className={`px-4 md:px-6 py-3 font-semibold text-base md:text-lg transition-colors ${activeTab === 'childrens' ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600' : 'text-gray-500 dark:text-gray-400 hover:text-amber-500'}`}
                >
                    Cuentos Infantiles
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {storiesToShow.map(story => (
                    <button 
                        key={story.id} 
                        onClick={() => handleSelectStory(story)}
                        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-amber-100 dark:border-gray-700 text-left transition-transform transform hover:-translate-y-1 hover:shadow-xl"
                    >
                        <div className="flex items-center mb-3">
                            <div className="text-amber-500 mr-3"><ClassicsIcon/></div>
                            <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-400 font-serif">{story.title}</h3>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">by {story.author}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                           {story.text}
                        </p>
                    </button>
                ))}
            </div>
            <footer className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
                Texto provisto por EnglishClub.com
            </footer>
        </div>
    );
};
