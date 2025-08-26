
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SmartZone } from './components/SmartZone';
import { ReadingPractice } from './components/ReadingPractice';
import { DailyLesson } from './components/DailyLesson';
import { Settings } from './components/Settings';
import { LessonView } from './components/LessonView';
import { ExercisesPractice } from './components/ExercisesPractice';
import { DictationPractice } from './components/DictationPractice';
import { EnglishClassics } from './components/EnglishClassics';
import { MyProgress } from './components/MyProgress';
import { PronunciationPractice } from './components/PronunciationPractice';
import { SpeakingBuddy } from './components/SpeakingBuddy';
import { Toast } from './components/Toast';
import { Login } from './components/Login';
import { geminiService } from './services/geminiService';
import { progressService } from './services/progressService';
import type { Lesson, GeneratedLessonMaterials, Theme, ButtonColor, UserProgress, ToastMessage } from './types';

export type Section = 'lessons' | 'exercises' | 'chat' | 'reading' | 'dailyLesson' | 'settings' | 'dictation' | 'classics' | 'progress' | 'pronunciation' | 'speaking';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('dailyLesson');
  const [user, setUser] = useState({ username: 'admin', password: '54321' });
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('practicego-theme');
    if (storedTheme) {
      try {
        return JSON.parse(storedTheme);
      } catch (e) {
        return { buttonColor: 'blue', backgroundName: 'white', mode: 'light' };
      }
    }
    return { buttonColor: 'blue', backgroundName: 'white', mode: 'light' };
  });

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [generatedMaterials, setGeneratedMaterials] = useState<GeneratedLessonMaterials | null>(null);
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress>(progressService.getProgress());
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('dark', 'light');
    root.classList.add(theme.mode);

    const body = window.document.body;
    body.className = '';
    const bgClasses: Record<Theme['backgroundName'], string> = {
      white: 'bg-gray-50 dark:bg-gray-900',
      dark: 'bg-gray-900',
      black: 'bg-black',
      blue: 'bg-blue-900'
    };
    body.classList.add(...bgClasses[theme.backgroundName].split(' '));

    const colorMap: Record<ButtonColor, Record<string, string>> = {
      pink: { '--primary-500': '#ec4899', '--primary-600': '#db2777' },
      gold: { '--primary-500': '#f59e0b', '--primary-600': '#d97706' },
      red: { '--primary-500': '#ef4444', '--primary-600': '#dc2626' },
      green: { '--primary-500': '#22c55e', '--primary-600': '#16a34a' },
      blue: { '--primary-500': '#3b82f6', '--primary-600': '#2563eb' },
    };
    const colors = colorMap[theme.buttonColor];
    for (const key in colors) {
      root.style.setProperty(key, colors[key]);
    }

    localStorage.setItem('practicego-theme', JSON.stringify(theme));
  }, [theme]);

  const showToast = (message: string) => {
    setToast({ id: Date.now(), message });
  };

  const handleActivityComplete = (activityType: string, points: number, achievementId?: any) => {
    const { progress: newProgress, bonus } = progressService.addPoints(points, activityType, achievementId);
    setUserProgress(newProgress);
    let toastMessage = `✅ ${activityType} - +${points} pts`;
    if (bonus > 0) {
        toastMessage += ` (+${bonus} pts por racha!)`;
    }
    showToast(toastMessage);
  };

  const handleSelectLesson = async (lesson: Lesson) => {
    if (isLessonLoading) return;
    
    setSelectedLesson(lesson);
    setGeneratedMaterials(null);
    setLessonError(null);
    setIsLessonLoading(true);
    setActiveSection('lessons');
    handleActivityComplete('Clase del Día completada', 15);

    try {
      const result = await geminiService.generateLessonMaterials(lesson);
      setGeneratedMaterials(result);
    } catch (e) {
      setLessonError('No se pudieron generar los materiales de la lección. Por favor, inténtalo de nuevo.');
      console.error(e);
    } finally {
      setIsLessonLoading(false);
    }
  };

  const navigateToSection = (section: Section) => {
    setActiveSection(section);
  };

  const startThemedChat = () => {
    setActiveSection('chat');
  };
  
  const handleLogin = (u: string, p: string): boolean => {
    if (u === user.username && p === user.password) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleUpdateUser = (newUser: { username: string, password: string }) => {
    setUser(newUser);
    showToast('✅ Credenciales actualizadas correctamente.');
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dailyLesson':
        return <DailyLesson onSelectLesson={handleSelectLesson} isLoading={isLessonLoading} />;
      case 'chat':
        return <SmartZone lessonMaterials={generatedMaterials} onActivityComplete={handleActivityComplete} />;
      case 'reading':
        return <ReadingPractice lessonText={generatedMaterials?.readingText} onActivityComplete={handleActivityComplete} />;
      case 'exercises':
        return <ExercisesPractice lesson={selectedLesson} materials={generatedMaterials} onActivityComplete={handleActivityComplete} />;
      case 'dictation':
        return <DictationPractice lesson={selectedLesson} onActivityComplete={handleActivityComplete} />;
      case 'classics':
        return <EnglishClassics onActivityComplete={handleActivityComplete} />;
      case 'lessons':
        return <LessonView 
          lesson={selectedLesson} 
          materials={generatedMaterials} 
          isLoading={isLessonLoading} 
          error={lessonError}
          onStartChat={startThemedChat}
          onActivityComplete={handleActivityComplete}
        />;
      case 'settings':
        return <Settings theme={theme} setTheme={setTheme} user={user} onUpdateUser={handleUpdateUser} />;
      case 'progress':
        return <MyProgress progress={userProgress} />;
      case 'pronunciation':
        return <PronunciationPractice onActivityComplete={handleActivityComplete} />;
      case 'speaking':
        return <SpeakingBuddy onActivityComplete={handleActivityComplete} />;
      default:
        return <DailyLesson onSelectLesson={handleSelectLesson} isLoading={isLessonLoading} />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen font-sans">
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={navigateToSection} 
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        {renderSection()}
      </main>
      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;
