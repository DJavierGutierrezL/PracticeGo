
import React from 'react';
import type { Section } from '../App';
import { LessonsIcon, ExercisesIcon, ChatIcon, ReadingIcon, BookIcon, SettingsIcon, DictationIcon, ClassicsIcon, PracticeGoLogo, PracticeGoIcon, TrophyIcon, ChartIcon, SpeakingIcon } from './icons/Icons';

interface SidebarProps {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
}

const NavItem: React.FC<{
  section: Section;
  activeSection: Section;
  onClick: (section: Section) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ section, activeSection, onClick, icon, label }) => {
  const isActive = activeSection === section;
  return (
    <button
      onClick={() => onClick(section)}
      className={`flex items-center w-full px-2 md:px-4 py-3 text-left rounded-lg transition-colors duration-200 justify-center md:justify-start ${
        isActive
          ? 'bg-primary-500 text-white shadow-md'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-500/10 dark:hover:bg-gray-700'
      }`}
      title={label}
    >
      <div className="md:mr-4">{icon}</div>
      <span className="font-medium hidden md:inline">{label}</span>
    </button>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection }) => {
  return (
    <aside className="w-20 md:w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg p-2 md:p-4 flex-shrink-0 flex flex-col transition-all duration-300">
      <div className="flex justify-center items-center h-16 mb-4 md:mb-6 md:px-4">
        <div className="hidden md:block">
            <PracticeGoLogo />
        </div>
        <div className="md:hidden">
            <PracticeGoIcon />
        </div>
      </div>
      <nav className="flex flex-col space-y-2">
        <NavItem section="dailyLesson" activeSection={activeSection} onClick={setActiveSection} icon={<BookIcon />} label="Clase del Día" />
        <NavItem section="progress" activeSection={activeSection} onClick={setActiveSection} icon={<ChartIcon />} label="Mi Progreso" />
        <NavItem section="lessons" activeSection={activeSection} onClick={setActiveSection} icon={<LessonsIcon />} label="Mis Lecciones" />
        <NavItem section="exercises" activeSection={activeSection} onClick={setActiveSection} icon={<ExercisesIcon />} label="Ejercicios Prácticos" />
        <NavItem section="chat" activeSection={activeSection} onClick={setActiveSection} icon={<ChatIcon />} label="Smart Zone (Chat)" />
        <NavItem section="reading" activeSection={activeSection} onClick={setActiveSection} icon={<ReadingIcon />} label="Práctica de Lectura" />
        <NavItem section="dictation" activeSection={activeSection} onClick={setActiveSection} icon={<DictationIcon />} label="Dictado en Línea" />
        <NavItem section="classics" activeSection={activeSection} onClick={setActiveSection} icon={<ClassicsIcon />} label="Listening" />
        <NavItem section="pronunciation" activeSection={activeSection} onClick={setActiveSection} icon={<TrophyIcon />} label="Práctica de Pronunciación" />
        <NavItem section="speaking" activeSection={activeSection} onClick={setActiveSection} icon={<SpeakingIcon />} label="AI Speaking Buddy" />
      </nav>
      <div className="mt-auto">
        <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
        <NavItem section="settings" activeSection={activeSection} onClick={setActiveSection} icon={<SettingsIcon />} label="Ajustes" />
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4 hidden md:block">&copy; 2024 PracticeGo</p>
      </div>
    </aside>
  );
};
