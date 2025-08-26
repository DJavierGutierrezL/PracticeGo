
import React from 'react';
import { InteractiveExercises } from './InteractiveExercises';
import type { Lesson, GeneratedLessonMaterials } from '../types';
import { ExercisesIcon } from './icons/Icons';

interface ExercisesPracticeProps {
    lesson: Lesson | null;
    materials: GeneratedLessonMaterials | null;
    onActivityComplete: (activityType: string, points: number, achievementId?: 'firstExercise') => void;
}

export const ExercisesPractice: React.FC<ExercisesPracticeProps> = ({ lesson, materials, onActivityComplete }) => {
    if (!materials || !lesson) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                <div className="text-primary-500 mb-4"><ExercisesIcon /></div>
                <h2 className="text-3xl font-bold text-gray-700 dark:text-gray-200 mb-2">Ejercicios Prácticos</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">Ve a <span className="font-bold text-primary-500">'Clase del Día'</span> para seleccionar una lección y empezar a practicar.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <header className="text-center mb-8">
                <h2 className="text-4xl font-bold text-primary-600 dark:text-primary-400">Ejercicios Prácticos</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Completa los ejercicios para la lección: <span className="font-bold text-gray-800 dark:text-gray-100">{lesson.title}</span></p>
            </header>
            <InteractiveExercises 
                initialExercises={materials.exercises} 
                lesson={lesson} 
                onActivityComplete={() => onActivityComplete('Ejercicios Prácticos', 10, 'firstExercise')}
            />
        </div>
    );
};
