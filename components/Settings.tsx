import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import type { Lesson, Theme, ButtonColor, BackgroundName } from '../types';
import { TrashIcon, UploadIcon } from './icons/Icons';

interface SettingsProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

export const Settings: React.FC<SettingsProps> = ({ theme, setTheme }) => {
    const [customLessons, setCustomLessons] = useState<Lesson[]>([]);
    const [title, setTitle] = useState('');
    const [formTheme, setFormTheme] = useState('');
    const [vocabulary, setVocabulary] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractionError, setExtractionError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCustomLessons(storageService.getCustomLessons());
    }, []);

    const resetForm = () => {
        setTitle('');
        setFormTheme('');
        setVocabulary('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSaveLesson = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !formTheme || !vocabulary) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        const newLesson: Lesson = {
            id: `custom-${Date.now()}`,
            title,
            theme: formTheme,
            vocabulary: vocabulary.split(',').map(v => v.trim()).filter(Boolean),
            isCustom: true,
        };

        const updatedLessons = [...customLessons, newLesson];
        setCustomLessons(updatedLessons);
        storageService.saveCustomLessons(updatedLessons);
        resetForm();
    };
    
    const handleDeleteLesson = (lessonId: string) => {
        const updatedLessons = customLessons.filter(lesson => lesson.id !== lessonId);
        setCustomLessons(updatedLessons);
        storageService.saveCustomLessons(updatedLessons);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setExtractionError('Por favor, sube un archivo PDF.');
            return;
        }

        setIsExtracting(true);
        setExtractionError(null);
        resetForm();

        try {
            const result = await geminiService.extractLessonFromPDF(file);
            setTitle(result.title);
            setFormTheme(result.theme);
            setVocabulary(result.vocabulary.join(', '));
        } catch (error) {
            console.error(error);
            setExtractionError('Hubo un error al procesar el PDF. Por favor, inténtalo de nuevo o introduce los datos manualmente.');
        } finally {
            setIsExtracting(false);
        }
    };
    
    const handleButtonColorChange = (color: ButtonColor) => {
        setTheme({ ...theme, buttonColor: color });
    };

    const handleBgChange = (background: BackgroundName) => {
        const isDark = background === 'dark' || background === 'black' || background === 'blue';
        setTheme({ ...theme, backgroundName: background, mode: isDark ? 'dark' : 'light' });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <header className="text-center mb-8">
                <h2 className="text-4xl font-bold text-gray-700 dark:text-gray-200">Ajustes</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Personaliza la apariencia y gestiona tus lecciones.</p>
            </header>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 mb-8">
                <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">Apariencia</h3>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color de los Botones</label>
                    <div className="flex flex-wrap gap-3">
                        {(['pink', 'gold', 'red', 'green', 'blue'] as ButtonColor[]).map(color => {
                            const colorClasses: Record<ButtonColor, string> = {
                                pink: 'bg-pink-500',
                                gold: 'bg-yellow-500',
                                red: 'bg-red-500',
                                green: 'bg-green-500',
                                blue: 'bg-blue-500',
                            };
                            return (
                                <button
                                    key={color}
                                    onClick={() => handleButtonColorChange(color)}
                                    className={`w-10 h-10 rounded-full ${colorClasses[color]} transition-transform transform hover:scale-110 ${theme.buttonColor === color ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-gray-800 dark:ring-white' : ''}`}
                                    aria-label={`Select ${color} button color`}
                                />
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color de Fondo</label>
                    <div className="flex flex-wrap gap-3">
                        {(['white', 'dark', 'black', 'blue'] as BackgroundName[]).map(bg => {
                            const bgClasses: Record<BackgroundName, string> = {
                                white: 'bg-gray-50 border-gray-300',
                                dark: 'bg-gray-900 border-gray-600',
                                black: 'bg-black border-gray-600',
                                blue: 'bg-blue-900 border-blue-700',
                            };
                             return (
                                <button
                                    key={bg}
                                    onClick={() => handleBgChange(bg)}
                                    className={`w-10 h-10 rounded-full border-2 ${bgClasses[bg]} transition-transform transform hover:scale-110 ${theme.backgroundName === bg ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-gray-800 dark:ring-white' : ''}`}
                                    aria-label={`Select ${bg} background`}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form to add a new lesson */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <h3 className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-4">Añadir Nueva Lección</h3>
                    
                    <div className="mb-6">
                        <label 
                            htmlFor="pdf-upload" 
                            className="cursor-pointer group flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center text-gray-500 dark:text-gray-400">
                                <UploadIcon />
                                <p className="mb-2 text-sm "><span className="font-semibold">Sube un PDF</span> para rellenar automáticamente</p>
                                <p className="text-xs">Tu lección de clase, en un clic</p>
                            </div>
                            <input ref={fileInputRef} id="pdf-upload" type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} disabled={isExtracting} />
                        </label>
                        {isExtracting && (
                            <div className="mt-2 text-center text-sm text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500 mr-2"></div>
                                Analizando PDF con IA...
                            </div>
                        )}
                        {extractionError && <p className="mt-2 text-sm text-red-500 text-center">{extractionError}</p>}
                    </div>

                     <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white dark:bg-gray-800 px-2 text-sm text-gray-500 dark:text-gray-400">O introduce los datos manualmente</span>
                        </div>
                    </div>

                    <form onSubmit={handleSaveLesson} className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título de la Lección</label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ej: Unidad 4: Mis Hobbies"
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                                disabled={isExtracting}
                            />
                        </div>
                        <div>
                            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tema Principal</label>
                            <input
                                type="text"
                                id="theme"
                                value={formTheme}
                                onChange={(e) => setFormTheme(e.target.value)}
                                placeholder="Ej: Hablar sobre actividades de tiempo libre"
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                                disabled={isExtracting}
                            />
                        </div>
                        <div>
                            <label htmlFor="vocabulary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vocabulario Clave (separado por comas)</label>
                            <textarea
                                id="vocabulary"
                                value={vocabulary}
                                onChange={(e) => setVocabulary(e.target.value)}
                                placeholder="Ej: play, read, watch, music, sport, book"
                                rows={4}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                                disabled={isExtracting}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isExtracting}
                            className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:bg-primary-300 dark:disabled:bg-gray-600"
                        >
                            {isExtracting ? 'Procesando...' : 'Guardar Lección'}
                        </button>
                    </form>
                </div>

                {/* List of custom lessons */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                     <h3 className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-4">Mis Lecciones Guardadas</h3>
                     <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {customLessons.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center mt-8">Aún no has añadido ninguna lección personalizada.</p>
                        ) : (
                            customLessons.map(lesson => (
                                <div key={lesson.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-gray-800 dark:text-gray-100">{lesson.title}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{lesson.theme}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Vocabulario: {lesson.vocabulary.slice(0, 4).join(', ')}...</p>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteLesson(lesson.id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full transition-colors"
                                        aria-label="Eliminar lección"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            ))
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
};