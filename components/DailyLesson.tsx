import React, { useState, useEffect } from 'react';
import { LESSONS_DATA } from '../lessons';
import { storageService } from '../services/storageService';
import type { Lesson } from '../types';

// Main Component
interface DailyLessonProps {
    onSelectLesson: (lesson: Lesson) => void;
    isLoading: boolean;
}

export const DailyLesson: React.FC<DailyLessonProps> = ({ onSelectLesson, isLoading }) => {
    const [allLessons, setAllLessons] = useState<Lesson[]>([]);
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

    useEffect(() => {
        const customLessons = storageService.getCustomLessons();
        setAllLessons([...LESSONS_DATA, ...customLessons]);
    }, []);
    
    const handleSelectLesson = (lesson: Lesson) => {
        if (isLoading) return;
        setSelectedLessonId(lesson.id);
        onSelectLesson(lesson);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <header className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400">Clase del Día</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-base md:text-lg">Elige una lección para generar una práctica personalizada con IA.</p>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Serás redirigido a "Mis Lecciones" para comenzar.</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                {allLessons.map(lesson => (
                    <button 
                        key={lesson.id} 
                        onClick={() => handleSelectLesson(lesson)} 
                        disabled={isLoading}
                        className={`p-4 rounded-xl text-left transition-all duration-200 shadow-md transform hover:-translate-y-1 relative
                            ${selectedLessonId === lesson.id && isLoading
                                ? 'bg-primary-500 text-white ring-2 ring-offset-2 ring-primary-500 animate-pulse'
                                : selectedLessonId === lesson.id
                                ? 'bg-primary-500 text-white ring-2 ring-offset-2 ring-primary-500'
                                : 'bg-white dark:bg-gray-800 dark:hover:bg-primary-600/10 hover:bg-primary-500/10'}
                            ${isLoading ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                        {lesson.isCustom && (
                            <span className="absolute top-2 right-2 text-xs bg-yellow-400 text-yellow-800 font-bold px-2 py-0.5 rounded-full">Personal</span>
                        )}
                        <h3 className="font-bold text-md text-gray-800 dark:text-gray-100">{lesson.title}</h3>
                        <p className={`text-sm mt-1 ${selectedLessonId === lesson.id ? 'text-primary-500/80 dark:text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>{lesson.theme}</p>
                    </button>
                ))}
            </div>

            {isLoading && selectedLessonId && (
                <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="mt-4 text-primary-600 dark:text-primary-400 font-semibold">Generando tu lección... Serás redirigido en un momento. 🪄</p>
                </div>
            )}
        </div>
    );
};