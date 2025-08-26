
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { geminiService } from '../services/geminiService';
import type { PronunciationFeedback, PronunciationWord } from '../types';
import { MicIcon, StopIcon, RefreshIcon } from './icons/Icons';
import { WordWithTooltip } from './WordWithTooltip';

type RecordingState = 'idle' | 'recording' | 'processing' | 'finished';

interface ReadingPracticeProps {
  lessonText?: string;
  onActivityComplete: (activityType: string, points: number) => void;
}

export const ReadingPractice: React.FC<ReadingPracticeProps> = ({ lessonText, onActivityComplete }) => {
  const [text, setText] = useState<string>('');
  const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [isFetchingText, setIsFetchingText] = useState<boolean>(!lessonText);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const fetchNewText = useCallback(async () => {
    if (lessonText) return;

    setIsFetchingText(true);
    setFeedback(null);
    setRecordingState('idle');
    try {
      const newText = await geminiService.generateReadingText();
      setText(newText);
    } catch (error) {
      console.error("Failed to fetch new text:", error);
      setText("Hubo un error al obtener un nuevo texto. Por favor, inténtalo de nuevo.");
    } finally {
      setIsFetchingText(false);
    }
  }, [lessonText]);

  useEffect(() => {
    if (lessonText) {
      setText(lessonText);
      setFeedback(null);
      setRecordingState('idle');
      setIsFetchingText(false);
    } else {
      fetchNewText();
    }
  }, [lessonText, fetchNewText]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();
      setRecordingState('recording');
      setFeedback(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Se denegó el acceso al micrófono. Por favor, permite el acceso al micrófono en la configuración de tu navegador.');
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
        onActivityComplete('Práctica de Lectura', 15);
      });
    }
  };
  
  const getWordColor = (word: PronunciationWord): string => {
    if (!feedback) return 'text-gray-800 dark:text-gray-100';
    return word.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400';
  };

  const renderTextWithTooltips = () => {
    if (feedback) {
        return feedback.words.map((wordObj, index) => (
            <React.Fragment key={index}>
                <WordWithTooltip
                    word={wordObj.word}
                    originalColor={getWordColor(wordObj)}
                />
                {' '}
            </React.Fragment>
        ));
    }
    
    return text.split(/(\s+)/).map((segment, index) => {
        if (segment.trim().length > 0) {
            return <WordWithTooltip key={index} word={segment} />;
        }
        return <span key={index}>{segment}</span>;
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-4 md:p-8 rounded-2xl shadow-xl border border-primary-500/10 dark:border-gray-700">
      <header className="text-center mb-6">
        <h2 className="text-3xl font-bold text-primary-600 dark:text-primary-400">Práctica de Lectura</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {lessonText ? 'Lee el texto de tu lección en voz alta.' : 'Lee el texto en voz alta y recibe comentarios sobre tu pronunciación.'}
        </p>
      </header>

      <div className="bg-primary-500/5 dark:bg-gray-900 p-6 rounded-lg mb-6 min-h-[120px] flex items-center justify-center">
        {isFetchingText ? (
          <div className="text-primary-500 dark:text-primary-400">Generando una nueva historia...</div>
        ) : (
          <p className="text-xl sm:text-2xl leading-relaxed text-center font-serif text-gray-800 dark:text-gray-100">
            {renderTextWithTooltips()}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
        <button
          onClick={recordingState === 'recording' ? handleStopRecording : handleStartRecording}
          disabled={recordingState === 'processing' || isFetchingText}
          className={`flex items-center justify-center w-full sm:w-48 h-14 sm:h-16 px-6 text-white font-bold rounded-full transition-all duration-300 shadow-lg
            ${recordingState === 'recording' ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-500 hover:bg-primary-600'}
            ${recordingState === 'processing' || isFetchingText ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : ''}
          `}
        >
          {recordingState === 'idle' && <><MicIcon/> <span className="ml-2">Empezar a Grabar</span></>}
          {recordingState === 'recording' && <><StopIcon/> <span className="ml-2">Detener Grabación</span></>}
          {recordingState === 'processing' && 'Analizando...'}
          {recordingState === 'finished' && <><MicIcon/> <span className="ml-2">Grabar de Nuevo</span></>}
        </button>
        <button onClick={fetchNewText} disabled={isFetchingText || recordingState === 'recording' || recordingState === 'processing' || !!lessonText} className="p-4 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 transition-colors duration-200">
            <RefreshIcon />
        </button>
      </div>

      {feedback && recordingState === 'finished' && (
        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg animate-fade-in-up">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Reporte de Pronunciación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Análisis de Palabras</h4>
              <div className="flex flex-wrap gap-2">
                 <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div><span className="text-sm text-gray-700 dark:text-gray-300">Correcta</span></div>
                 <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div><span className="text-sm text-gray-700 dark:text-gray-300">Necesita Mejorar</span></div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Fonemas a Practicar</h4>
              {feedback.phonemesToImprove.length > 0 ? (
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                  {feedback.phonemesToImprove.map((phoneme, index) => (
                    <li key={index}>{phoneme}</li>
                  ))}
                </ul>
              ) : (
                 <p className="text-gray-500 dark:text-gray-400">¡Gran trabajo! No hay fonemas específicos para practicar esta vez.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
