
import React, { useState, useEffect } from 'react';
import type { FillInTheBlankExercise, Lesson } from '../types';
import { geminiService } from '../services/geminiService';
import { ExercisesIcon, RefreshIcon } from './icons/Icons';
import { WordWithTooltip } from './WordWithTooltip';

interface InteractiveExercisesProps {
  initialExercises: {
    fillInTheBlank: FillInTheBlankExercise[];
  };
  lesson: Lesson;
  onActivityComplete: () => void;
}

export const InteractiveExercises: React.FC<InteractiveExercisesProps> = ({ initialExercises, lesson, onActivityComplete }) => {
    const [exercises, setExercises] = useState<FillInTheBlankExercise[]>(initialExercises.fillInTheBlank);
    const [userAnswers, setUserAnswers] = useState<string[]>(() => Array(initialExercises.fillInTheBlank.length).fill(''));
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setExercises(initialExercises.fillInTheBlank);
        setUserAnswers(Array(initialExercises.fillInTheBlank.length).fill(''));
        setIsSubmitted(false);
        setError(null);
    }, [initialExercises]);


    const handleAnswerChange = (index: number, value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[index] = value;
        setUserAnswers(newAnswers);
        if (isSubmitted) {
            setIsSubmitted(false); // Reset submission state if user changes an answer
        }
    };

    const handleCheckAnswers = () => {
        setIsSubmitted(true);
        onActivityComplete();
    };

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        setError(null);
        try {
            const newExercises = await geminiService.generateMoreExercises(lesson);
            if (newExercises && newExercises.length > 0) {
                setExercises(newExercises);
                setUserAnswers(Array(newExercises.length).fill(''));
                setIsSubmitted(false);
            } else {
                setError("La IA no devolvió nuevos ejercicios. Inténtalo de nuevo.");
            }
        } catch (e) {
            console.error(e);
            setError("No se pudieron generar nuevos ejercicios. Por favor, inténtalo de nuevo.");
        } finally {
            setIsRegenerating(false);
        }
    };
    
    const renderTextWithTooltips = (text: string) => {
        if (!text) return null;
        return text.split(/(\s+)/).map((word, i) => {
            if (word.trim().length > 0) {
                return <WordWithTooltip key={i} word={word} />;
            }
            return <span key={i}>{word}</span>;
        });
    };

    const renderQuestion = (exercise: FillInTheBlankExercise, index: number) => {
        const parts = exercise.question.split('___');
        const isCorrect = userAnswers[index]?.trim().toLowerCase() === exercise.answer.toLowerCase();
        
        let borderColor = 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500';
        if (isSubmitted) {
            borderColor = isCorrect ? 'border-green-500 ring-green-500' : 'border-red-500 ring-red-500';
        }

        return (
            <div key={`${exercise.question}-${index}`} className="flex flex-wrap items-center gap-2 text-lg text-gray-800 dark:text-gray-200 leading-loose">
                <span className="font-semibold">{index + 1}.</span>
                {renderTextWithTooltips(parts[0])}
                <input
                    type="text"
                    value={userAnswers[index]}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className={`w-36 rounded-md border-2 bg-white dark:bg-gray-700 px-2 py-1 text-center font-semibold text-primary-500 dark:text-primary-400 shadow-sm transition-colors ${borderColor}`}
                    aria-label={`Respuesta para la pregunta ${index + 1}`}
                />
                {renderTextWithTooltips(parts[1])}
                {isSubmitted && !isCorrect && (
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">(Correcto: {exercise.answer})</span>
                )}
            </div>
        );
    };

    if (!exercises || exercises.length === 0) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-primary-500/10 dark:border-primary-700">
            <div className="flex items-center mb-4">
                <div className="text-primary-500 mr-3"><ExercisesIcon /></div>
                <h3 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Ejercicios Prácticos</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Completa las oraciones con el vocabulario de la lección.</p>
            
            {isRegenerating ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
                    <p className="mt-4 text-primary-600 dark:text-primary-400">Generando nuevos ejercicios...</p>
                </div>
            ) : (
                <div className="space-y-4 mb-6">
                    {exercises.map(renderQuestion)}
                </div>
            )}
            
            {error && <p className="text-center text-red-500 mb-4">{error}</p>}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                <button 
                    onClick={handleCheckAnswers}
                    disabled={isRegenerating}
                    className="px-8 py-3 bg-primary-500 text-white font-bold rounded-full shadow-lg hover:bg-primary-600 transition-transform transform hover:scale-105 disabled:bg-primary-300 dark:disabled:bg-gray-600"
                >
                    Comprobar Respuestas
                </button>
                 <button 
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="flex items-center justify-center px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-full shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                    <RefreshIcon />
                    <span className="ml-2">Generar Otros Ejercicios</span>
                </button>
            </div>
        </div>
    );
};
