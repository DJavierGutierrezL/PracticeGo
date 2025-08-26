
import type { UserProgress, Achievement, AchievementId } from '../types';

const PROGRESS_KEY = 'practicego_user_progress';

const ALL_ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  // Streaks
  streak3: { id: 'streak3', name: '¡En Racha!', description: 'Practica por 3 días seguidos.', icon: '🔥' },
  streak7: { id: 'streak7', name: 'Semana Perfecta', description: 'Practica por 7 días seguidos.', icon: '🗓️' },
  streak30: { id: 'streak30', name: 'Hábito Creado', description: 'Practica por 30 días seguidos.', icon: '🎯' },
  // Points
  points100: { id: 'points100', name: 'Principiante', description: 'Gana 100 puntos.', icon: '⭐' },
  points500: { id: 'points500', name: 'Estudiante', description: 'Gana 500 puntos.', icon: '✨' },
  points1000: { id: 'points1000', name: 'Erudito', description: 'Gana 1000 puntos.', icon: '🏆' },
  // First time actions
  firstChat: { id: 'firstChat', name: '¡Hola, Mundo!', description: 'Ten tu primera conversación con Kandy.', icon: '👋' },
  firstExercise: { id: 'firstExercise', name: 'Rompiendo el Hielo', description: 'Completa tu primer ejercicio.', icon: '✍️' },
  firstDictation: { id: 'firstDictation', name: 'Buen Oído', description: 'Completa tu primer dictado.', icon: '👂' },
  firstListening: { id: 'firstListening', name: 'Amante de los Clásicos', description: 'Completa tu primer quiz de listening.', icon: '📚' },
  // Milestones
  verbsMaster: { id: 'verbsMaster', name: 'Maestro de Verbos', description: 'Completa la sección de Verbos Esenciales.', icon: '💪' },
  allLessons: { id: 'allLessons', name: 'Explorador Curioso', description: 'Completa todas las lecciones por defecto.', icon: '🗺️' },
  pronunciationPro: { id: 'pronunciationPro', name: 'Pro de la Pronunciación', description: 'Obtén un 80% o más en una práctica de pronunciación.', icon: '🎤' },
  wordWatcher: { id: 'wordWatcher', name: 'Ojo de Águila', description: 'Corrige 10 palabras en el chat.', icon: '👀' },
  speakingScenario: { id: 'speakingScenario', name: 'Trotamundos', description: 'Completa un escenario con el AI Speaking Buddy.', icon: '💬' },
};

const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
           someDate.getMonth() === today.getMonth() &&
           someDate.getFullYear() === today.getFullYear();
};

const isYesterday = (someDate: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return someDate.getDate() === yesterday.getDate() &&
           someDate.getMonth() === yesterday.getMonth() &&
           someDate.getFullYear() === yesterday.getFullYear();
};

const getTodayString = () => new Date().toISOString().split('T')[0];

export const progressService = {
  getAchievements: (): Record<AchievementId, Achievement> => {
    return ALL_ACHIEVEMENTS;
  },
  
  getProgress: (): UserProgress => {
    try {
      const savedProgress = localStorage.getItem(PROGRESS_KEY);
      if (savedProgress) {
        const progress = JSON.parse(savedProgress) as UserProgress;
        if (progress.lastPracticed) {
            const lastDate = new Date(progress.lastPracticed);
            if (!isToday(lastDate) && !isYesterday(lastDate)) {
                progress.streak = 0;
            }
        }
        return progress;
      }
    } catch (e) {
      console.error("Failed to load progress", e);
    }
    return {
      points: 0,
      streak: 0,
      lastPracticed: null,
      achievements: [],
      activities: {}
    };
  },

  saveProgress: (progress: UserProgress): void => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  },
  
  addPoints: (points: number, activityType: string, achievementId?: AchievementId): { progress: UserProgress, bonus: number } => {
    const progress = progressService.getProgress();
    let totalPointsToAdd = points;
    let streakBonus = 0;

    const today = new Date();
    if (!progress.lastPracticed || !isToday(new Date(progress.lastPracticed))) {
        if (progress.lastPracticed && isYesterday(new Date(progress.lastPracticed))) {
            progress.streak += 1;
            streakBonus = 20; // Daily streak bonus
            totalPointsToAdd += streakBonus;
        } else {
            progress.streak = 1;
        }
        progress.lastPracticed = today.toISOString();
    }
    
    progress.points += totalPointsToAdd;
    
    const todayStr = getTodayString();
    if (!progress.activities[todayStr]) {
        progress.activities[todayStr] = { count: 0, points: 0 };
    }
    progress.activities[todayStr].count += 1;
    progress.activities[todayStr].points += totalPointsToAdd;

    if (achievementId && !progress.achievements.includes(achievementId)) {
        progress.achievements.push(achievementId);
    }
    if (progress.streak >= 3 && !progress.achievements.includes('streak3')) progress.achievements.push('streak3');
    if (progress.streak >= 7 && !progress.achievements.includes('streak7')) progress.achievements.push('streak7');
    if (progress.streak >= 30 && !progress.achievements.includes('streak30')) progress.achievements.push('streak30');
    if (progress.points >= 100 && !progress.achievements.includes('points100')) progress.achievements.push('points100');
    if (progress.points >= 500 && !progress.achievements.includes('points500')) progress.achievements.push('points500');
    if (progress.points >= 1000 && !progress.achievements.includes('points1000')) progress.achievements.push('points1000');


    progressService.saveProgress(progress);
    return { progress, bonus: streakBonus };
  },
};
