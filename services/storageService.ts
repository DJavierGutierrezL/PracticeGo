import type { Lesson } from '../types';

const CUSTOM_LESSONS_KEY = 'practicego_custom_lessons';

export const storageService = {
  getCustomLessons: (): Lesson[] => {
    try {
      const lessonsJson = localStorage.getItem(CUSTOM_LESSONS_KEY);
      if (lessonsJson) {
        return JSON.parse(lessonsJson);
      }
    } catch (error) {
      console.error("Failed to parse custom lessons from localStorage", error);
    }
    return [];
  },

  saveCustomLessons: (lessons: Lesson[]): void => {
    try {
      const lessonsJson = JSON.stringify(lessons);
      localStorage.setItem(CUSTOM_LESSONS_KEY, lessonsJson);
    } catch (error) {
      console.error("Failed to save custom lessons to localStorage", error);
    }
  },
};