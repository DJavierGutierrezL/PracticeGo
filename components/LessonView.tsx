
import React, { useState, useCallback, useRef } from 'react';
import type { Lesson, GeneratedLessonMaterials, FlashcardData, PronunciationFeedback, PronunciationWord } from '../types';
import { geminiService } from '../services/geminiService';
import { Flashcard } from './Flashcard';
import { WordWithTooltip } from './WordWithTooltip';
import { InteractiveExercises } from './InteractiveExercises';
import { PrevIcon, NextIcon, MicIcon, StopIcon, ChatIcon, ReadingIcon, VocabIcon, BookIcon } from './icons/Icons';

type RecordingState = 'idle' | 'recording' | 'processing' | 'finished';

// Sub-component for Vocabulary Practice
const VocabularySection: React.FC<{ flashcards: FlashcardData[] }> = ({ flashcards }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToNextCard = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, [flashcards.length]);

    const goToPrevCard = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, [flashcards.length]);

    if (!flashcards || flashcards.length === 0) {
        return <div>No se encontraron tarjetas de vocabulario.</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-primary-500/10 dark:border-gray-700">
            <div className="flex items-center mb-4">
                <div className="text-primary-500 mr-3"><VocabIcon /></div>
                <h3 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Vocabulario de la Lección</h3>
            </div>
            <div className="max-w-md mx-auto">
                <Flashcard key={flashcards[currentIndex].english} card={flashcards[currentIndex]} />
                <div className="flex justify-between items-center mt-6">
                    <button onClick={goToPrevCard} className="p-3 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"><PrevIcon /></button>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">{currentIndex + 1} / {flashcards.length}</span>
                    <button onClick={goToNextCard} className="p-3 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"><NextIcon /></button>
                </div>
            </div>
        </div>
    );
};

// Sub-component for Reading Practice
const ReadingSection: React.FC<{ text: string }> = ({ text }) => {
    const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.start();
            setRecordingState('recording');
            setFeedback(null);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Se denegó el acceso al micrófono. Por favor, permite el acceso en la configuración de tu navegador.');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && recordingState === 'recording') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setRecordingState('processing');
            geminiService.generatePronunciationFeedback(text).then(simulatedFeedback => {
                setFeedback(simulatedFeedback);
                setRecordingState('finished');
            });
        }
    };

    const getWordColor = (word: PronunciationWord): string => {
        if (!feedback) return 'text-gray-800 dark:text-gray-100';
        return word.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400';
    };

    const renderText = () => {
        if (feedback) {
            return feedback.words.map((wordObj, index) => (
                <React.Fragment key={index}>
                    <WordWithTooltip word={wordObj.word} originalColor={getWordColor(wordObj)} />{' '}
                </React.Fragment>
            ));
        }
        return text.split(/(\s+)/).map((segment, index) => {
            if (segment.trim().length > 0) return <WordWithTooltip key={index} word={segment} />;
            return <span key={index}>{segment}</span>;
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-primary-500/10 dark:border-gray-700">
            <div className="flex items-center mb-4">
                <div className="text-primary-500 mr-3"><ReadingIcon /></div>
                <h3 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Práctica de Lectura</h3>
            </div>
            <div className="bg-primary-500/5 dark:bg-gray-900 p-6 rounded-lg mb-6 min-h-[100px] flex items-center justify-center">
                <p className="text-xl leading-relaxed text-center font-serif text-gray-800 dark:text-gray-100">{renderText()}</p>
            </div>
            <div className="flex items-center justify-center space-x-4">
                <button
                    onClick={recordingState === 'recording' ? handleStopRecording : handleStartRecording}
                    disabled={recordingState === 'processing'}
                    className={`flex items-center justify-center w-48 h-12 px-6 text-white font-bold rounded-full transition-all duration-300 shadow-lg ${recordingState === 'recording' ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-500 hover:bg-primary-600'} ${recordingState === 'processing' ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : ''}`}>
                    {recordingState === 'idle' && <><MicIcon /> <span className="ml-2">Grabar</span></>}
                    {recordingState === 'recording' && <><StopIcon /> <span className="ml-2">Detener</span></>}
                    {recordingState === 'processing' && 'Analizando...'}
                    {recordingState === 'finished' && <><MicIcon /> <span className="ml-2">Grabar de Nuevo</span></>}
                </button>
            </div>
             {feedback && recordingState === 'finished' && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg animate-fade-in-up">
                    <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Reporte de Pronunciación</h4>
                    <p className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Fonemas a Practicar:
                        <span className="ml-2 font-normal text-gray-700 dark:text-gray-200">{feedback.phonemesToImprove.join(', ')}</span>
                    </p>
                </div>
            )}
        </div>
    );
};

// Sub-component for Chat Prompt
const ChatPromptSection: React.FC<{ onStart: () => void; lessonTheme: string; }> = ({ onStart, lessonTheme }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-primary-500/10 dark:border-gray-700 text-center">
             <div className="flex items-center mb-4 justify-center">
                <div className="text-primary-500 mr-3"><ChatIcon /></div>
                <h3 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Práctica de Conversación</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">¿Listo para hablar sobre "{lessonTheme.toLowerCase()}"?</p>
            <button onClick={onStart} className="px-8 py-3 bg-primary-500 text-white font-bold rounded-full shadow-lg hover:bg-primary-600 transition-transform transform hover:scale-105 flex items-center mx-auto">
                <ChatIcon />
                <span className="ml-2">¡Chatear con Kandy!</span>
            </button>
        </div>
    );
};


interface LessonViewProps {
    lesson: Lesson | null;
    materials: GeneratedLessonMaterials | null;
    isLoading: boolean;
    error: string | null;
    onStartChat: () => void;
    onActivityComplete: (activityType: string, points: number, achievementId?: any) => void;
}

export const LessonView: React.FC<LessonViewProps> = ({ lesson, materials, isLoading, error, onStartChat, onActivityComplete }) => {
    
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500"></div>
                <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-6">Generando tu lección...</h2>
                <p className="text-gray-500 dark:text-gray-400">La IA está preparando tus materiales de práctica. ¡Gracias por tu paciencia! 🪄</p>
            </div>
        );
    }
    
    if (error) {
        return <div className="flex items-center justify-center h-full text-center p-8 bg-red-100 text-red-700 rounded-2xl shadow-lg">{error}</div>;
    }

    if (!lesson || !materials) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                <div className="text-primary-500 mb-4"><BookIcon /></div>
                <h2 className="text-3xl font-bold text-gray-700 dark:text-gray-200 mb-2">Mis Lecciones</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">Ve a <span className="font-bold text-primary-500">'Clase del Día'</span> para seleccionar una lección y generar tu plan de estudio personalizado.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <header className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400">{lesson.title}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-base md:text-lg">{lesson.theme}</p>
            </header>

            <div className="space-y-8 animate-fade-in-up">
                <VocabularySection flashcards={materials.flashcards} />
                <ReadingSection text={materials.readingText} />
                <InteractiveExercises 
                    lesson={lesson} 
                    initialExercises={materials.exercises} 
                    onActivityComplete={() => onActivityComplete('Lección Terminada', 20, 'firstExercise')} 
                />
                <ChatPromptSection onStart={onStartChat} lessonTheme={lesson.theme} />
            </div>
        </div>
    );
};
