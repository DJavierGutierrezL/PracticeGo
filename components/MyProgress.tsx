
import React from 'react';
import type { UserProgress, Achievement } from '../types';
import { progressService } from '../services/progressService';
import { ChartIcon } from './icons/Icons';
import { StreakCalendar } from './StreakCalendar';

interface MyProgressProps {
    progress: UserProgress;
}

const allAchievements = progressService.getAchievements();

const AchievementCard: React.FC<{ achievement: Achievement, isUnlocked: boolean }> = ({ achievement, isUnlocked }) => (
    <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${isUnlocked ? 'bg-green-100 dark:bg-green-900/50 border-green-500' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
        <div className={`text-3xl mb-2 ${isUnlocked ? '' : 'grayscale'}`}>{achievement.icon}</div>
        <h4 className={`font-bold ${isUnlocked ? 'text-green-800 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>{achievement.name}</h4>
        <p className={`text-sm ${isUnlocked ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>{achievement.description}</p>
    </div>
);

const StatCard: React.FC<{ label: string; value: string | number; icon: string; }> = ({ label, value, icon }) => (
    <div className="bg-primary-500/10 dark:bg-gray-800 p-6 rounded-2xl flex items-center gap-4">
        <div className="text-4xl">{icon}</div>
        <div>
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{value}</div>
            <div className="text-gray-500 dark:text-gray-400">{label}</div>
        </div>
    </div>
);

const PointsLegend: React.FC = () => {
    const legendItems = [
        { action: 'Conversación Libre (3 min)', points: '+25 pts' },
        { action: 'Pronunciación IA (score ≥ 80%)', points: '+20 pts' },
        { action: 'Mantener Racha Diaria', points: '+20 pts extra' },
        { action: 'Terminar una Lección', points: '+20 pts' },
        { action: 'Práctica de Lectura', points: '+15 pts' },
        { action: 'Dictado en Línea', points: '+15 pts' },
        { action: 'Completar Clase del Día', points: '+15 pts' },
        { action: 'Repaso de Vocabulario', points: '+10 pts' },
        { action: 'Ejercicios Prácticos', points: '+10 pts' },
        { action: 'Listening (quiz)', points: '+10 pts' },
        { action: 'Interactuar en Chat', points: '+5 pts' },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">¿Cómo ganar puntos?</h3>
            <ul className="space-y-2">
                {legendItems.map(item => (
                    <li key={item.action} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{item.action}</span>
                        <span className="font-bold text-primary-500">{item.points}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};


export const MyProgress: React.FC<MyProgressProps> = ({ progress }) => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        return d.toISOString().split('T')[0];
    });

    const weeklyPoints = last7Days.reduce((sum, dayStr) => {
        return sum + (progress.activities[dayStr]?.points || 0);
    }, 0);

    return (
        <div className="max-w-6xl mx-auto">
            <header className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400">Mi Progreso</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-base md:text-lg">¡Mira lo lejos que has llegado en tu viaje de aprendizaje!</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard label="Puntos Totales" value={progress.points} icon="⭐" />
                <StatCard label="Puntos (últimos 7 días)" value={weeklyPoints} icon="📈" />
                <StatCard label="Racha de Días" value={progress.streak} icon="🔥" />
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2">
                     <StreakCalendar activities={progress.activities} streak={progress.streak} lastPracticed={progress.lastPracticed} />
                </div>
                <div>
                    <PointsLegend />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-4">
                    <div className="text-primary-500 mr-3 text-2xl">🏆</div>
                    <h3 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Logros</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.values(allAchievements).map(ach => (
                        <AchievementCard 
                            key={ach.id}
                            achievement={ach} 
                            isUnlocked={progress.achievements.includes(ach.id)} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
