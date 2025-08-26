import type { Lesson } from './types';

export const LESSONS_DATA: Lesson[] = [
  {
    id: 'default-1',
    title: 'Unidad 1: Saludos e Introducciones',
    vocabulary: ['hello', 'goodbye', 'name', 'is', 'are', 'my', 'your', 'what'],
    theme: 'Conocer a alguien por primera vez y presentarse.',
    isCustom: false,
  },
  {
    id: 'default-2',
    title: 'Unidad 2: Mi Familia',
    vocabulary: ['family', 'mother', 'father', 'sister', 'brother', 'have', 'has', 'this is'],
    theme: 'Hablar sobre los miembros de tu familia inmediata.',
    isCustom: false,
  },
  {
    id: 'default-3',
    title: 'Unidad 3: Comida que me Gusta',
    vocabulary: ['food', 'like', 'eat', 'drink', 'apple', 'banana', 'pizza', 'water', 'I like'],
    theme: 'Expresar preferencias sobre diferentes tipos de comida y bebida.',
    isCustom: false,
  }
];
