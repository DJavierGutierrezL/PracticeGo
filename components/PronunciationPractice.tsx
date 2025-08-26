
import React, { useState, useRef, useEffect } from 'react';
import { MicIcon, StopIcon } from './icons/Icons';

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface PronunciationPracticeProps {
    onActivityComplete: (activityType: string, points: number, achievementId?: 'pronunciationPro') => void;
}

const PHRASES_TO_PRACTICE = [
    "Hello, how are you?",
    "My name is Alex.",
    "I have a big family.",
    "This is my brother.",
    "She likes to eat pizza.",
    "He works in an office.",
    "They go to school every day.",
    "What is your favorite color?",
    "I want to drink some water.",
    "Goodbye, see you tomorrow."
];

const normalizeText = (text: string) => text.toLowerCase().replace(/[.,!?]/g, '');

export const PronunciationPractice: React.FC<PronunciationPracticeProps> = ({ onActivityComplete }) => {
    const [selectedPhrase, setSelectedPhrase] = useState(PHRASES_TO_PRACTICE[0]);
    const [isRecording, setIsRecording] = useState(false);
    const [userTranscript, setUserTranscript] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ score: number; words: { word: string; isCorrect: boolean }[] } | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Clean up on component unmount
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const handleSelectPhrase = (phrase: string) => {
        setSelectedPhrase(phrase);
        setUserTranscript(null);
        setFeedback(null);
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Tu navegador no soporta el reconocimiento de voz. Prueba con Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsRecording(true);
            setUserTranscript(null);
            setFeedback(null);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setUserTranscript(transcript);
            compareAndScore(selectedPhrase, transcript);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.onerror = (event: any) => {
            console.error("Error en el reconocimiento de voz:", event.error);
            setIsRecording(false);
        };

        recognition.start();
    };

    const compareAndScore = (original: string, transcript: string) => {
        const originalWords = normalizeText(original).split(' ');
        const transcriptWords = normalizeText(transcript).split(' ');

        let correctCount = 0;
        const feedbackWords = originalWords.map((originalWord) => {
            const isCorrect = transcriptWords.includes(originalWord);
            if (isCorrect) {
                correctCount++;
            }
            const cleanOriginal = originalWord.replace(/[.,!?]/g, '');
            return { word: cleanOriginal, isCorrect };
        });

        const score = Math.round((correctCount / originalWords.length) * 100);
        setFeedback({ score, words: feedbackWords });

        if (score >= 80) {
            onActivityComplete('Pronunciación con IA', 20, 'pronunciationPro');
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="max-w-4xl mx-auto">
            <header className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400">Práctica de Pronunciación</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-base md:text-lg">Lee una frase y recibe una puntuación sobre tu pronunciación con IA.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Elige una Frase</h3>
                    <div className="space-y-2">
                        {PHRASES_TO_PRACTICE.map(phrase => (
                            <button
                                key={phrase}
                                onClick={() => handleSelectPhrase(phrase)}
                                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedPhrase === phrase ? 'bg-primary-500 text-white font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                {phrase}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-primary-500/10 dark:border-gray-700 flex flex-col items-center justify-center min-h-[400px]">
                    <p className="text-2xl md:text-3xl text-center font-serif text-gray-800 dark:text-gray-100 mb-8">"{selectedPhrase}"</p>

                    <button
                        onClick={handleToggleRecording}
                        className={`flex items-center justify-center w-48 h-16 px-6 text-white font-bold rounded-full transition-all duration-300 shadow-lg ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary-500 hover:bg-primary-600'}`}
                    >
                        {isRecording ? <StopIcon/> : <MicIcon/>}
                        <span className="ml-2">{isRecording ? 'Grabando...' : 'Grabar Ahora'}</span>
                    </button>

                    {feedback && (
                        <div className="mt-8 text-center animate-fade-in-up w-full">
                            <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200">¡Resultado!</h3>
                            <p className={`text-6xl font-bold my-2 ${getScoreColor(feedback.score)}`}>{feedback.score}%</p>
                            <p className="text-gray-600 dark:text-gray-300">de precisión</p>

                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tu dijiste: "{userTranscript}"</p>
                                <div className="text-lg">
                                    {selectedPhrase.split(' ').map((originalWord, index) => {
                                        const feedbackWord = feedback.words.find(fw => normalizeText(fw.word) === normalizeText(originalWord));
                                        const isCorrect = feedbackWord ? feedbackWord.isCorrect : false;
                                        return (
                                            <span key={index} className={isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
                                                {originalWord}{' '}
                                            </span>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
