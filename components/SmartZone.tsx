
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { geminiService } from '../services/geminiService';
import type { Chat } from '@google/genai';
import { SendIcon, BotIcon, UserIcon, TargetIcon, ArrowLeftIcon, MoreVertIcon, MicIcon, StopIcon } from './icons/Icons';
import { WordWithTooltip } from './WordWithTooltip';
import type { WordCorrection, GeneratedLessonMaterials } from '../types';

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface SmartZoneProps {
  lessonMaterials: GeneratedLessonMaterials | null;
  onActivityComplete: (activityType: string, points: number, achievementId?: 'firstChat' | 'wordWatcher') => void;
}

const WordWatch: React.FC<{ words: WordCorrection[] }> = ({ words }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-primary-500/10 dark:border-gray-700 p-6 h-full w-full max-w-md mx-auto">
    <div className="flex items-center mb-4">
      <div className="text-primary-500 mr-3"><TargetIcon /></div>
      <h3 className="text-xl font-bold text-primary-600 dark:text-primary-400">Palabras en Observación</h3>
    </div>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Las palabras que necesitas practicar aparecerán aquí automáticamente.</p>
    <div className="space-y-3">
      {words.length === 0 ? (
         <div className="text-center text-gray-400 dark:text-gray-500 pt-8">Tu lista de práctica está vacía. ¡Sigue chateando!</div>
      ) : (
        <ul className="space-y-3">
          {words.map((word, index) => (
            <li key={index} className="flex items-center justify-between bg-primary-500/10 dark:bg-gray-700 p-3 rounded-lg">
              <span className="text-gray-500 dark:text-gray-400 line-through">{word.original}</span>
              <span className="text-lg font-bold mx-2 text-primary-400">→</span>
              <span className="text-gray-800 dark:text-gray-100 font-semibold">
                <WordWithTooltip word={word.corrected} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

export const SmartZone: React.FC<SmartZoneProps> = ({ lessonMaterials, onActivityComplete }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [incorrectWords, setIncorrectWords] = useState<WordCorrection[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstMessageSent = useRef(false);

  useEffect(() => {
    const initChat = () => {
      const systemInstruction = lessonMaterials?.chatSystemInstruction;
      const newChat = geminiService.startChat(systemInstruction);
      setChat(newChat);
      setMessages([]);
      setIncorrectWords([]);
      isFirstMessageSent.current = false;

      const initialMessage = lessonMaterials
        ? "Great! Let's practice today's lesson. Tell me something about it. 😊"
        : "Hello! My name is Kandy. 😊 What's your name?";
      
      setMessages([{ role: 'model', text: initialMessage }]);
    };
    initChat();
  }, [lessonMaterials]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  const handleToggleRecording = () => {
    if (isRecording) {
        recognitionRef.current?.stop();
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Tu navegador no soporta el reconocimiento de voz. Prueba con Chrome.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
    };

    recognition.onend = () => {
        setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
        console.error("Error en el reconocimiento de voz:", event.error);
        setIsRecording(false);
    };

    recognition.start();
  };

  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim() || !chat || isLoading) return;

    const userMessage: Message = { role: 'user', text: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const stream = await chat.sendMessageStream({ message: userInput });
      let modelResponse = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of stream) {
        modelResponse += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = modelResponse.replace(/<!-- CORRECTIONS: .* -->/, '').trim();
          return newMessages;
        });
      }
      
      if (!isFirstMessageSent.current) {
          onActivityComplete('Interacción en Chat', 5, 'firstChat');
          isFirstMessageSent.current = true;
      } else {
          onActivityComplete('Interacción en Chat', 5);
      }

      const correctionRegex = /<!-- CORRECTIONS: (.*) -->/;
      const match = modelResponse.match(correctionRegex);
      
      if (match && match[1]) {
        try {
          const newCorrections = JSON.parse(match[1]) as WordCorrection[];
          const updatedWords = [...incorrectWords];
          const existingOriginals = new Set(updatedWords.map(w => w.original));
          
          newCorrections.forEach(c => {
              if(!existingOriginals.has(c.original)) {
                  updatedWords.push(c);
              }
          });
          setIncorrectWords(updatedWords);

          if (updatedWords.length >= 10) {
              onActivityComplete('Corrección de Palabras', 0, 'wordWatcher');
          }

        } catch (e) {
            console.error("Failed to parse corrections JSON", e);
        }
      }
      
    } catch (error) {
      setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[newMessages.length - 1]?.text === '') {
              newMessages.pop();
          }
          return [...newMessages, { role: 'model', text: "Ups, algo salió mal. La IA no está disponible en este momento, inténtalo de nuevo más tarde." }];
      });
    } finally {
      setIsLoading(false);
    }
  }, [userInput, chat, isLoading, onActivityComplete, incorrectWords]);
  
  const renderMessageText = (text: string) => {
    return text.split(/(\s+)/).map((word, index) => {
      if (word.trim().length > 0) {
        return <WordWithTooltip key={index} word={word} />;
      }
      return <span key={index}>{word}</span>;
    });
  };

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center gap-8 w-full">
      {/* Smartphone component */}
      <div className="w-full max-w-md h-[80vh] max-h-[700px] bg-black border-[10px] border-black rounded-[40px] shadow-2xl overflow-hidden flex flex-col flex-shrink-0">
        {/* Screen */}
        <div className="w-full h-full bg-white dark:bg-gray-800 rounded-[30px] overflow-hidden flex flex-col">
           {/* Header */}
          <header className="bg-gray-100 dark:bg-gray-900 p-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
             <div className="flex items-center">
                <button className="text-gray-600 dark:text-gray-300 mr-2"><ArrowLeftIcon /></button>
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white mr-3">
                    <BotIcon />
                </div>
                <div>
                    <h2 className="font-bold text-gray-800 dark:text-gray-100">Kandy</h2>
                    <p className="text-xs text-green-500">online</p>
                </div>
             </div>
             <button className="text-gray-600 dark:text-gray-300"><MoreVertIcon /></button>
          </header>
          {/* Chat area */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 text-white"><BotIcon /></div>}
                  <div className={`max-w-xs p-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary-500 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none shadow'}`}>
                    <p className="text-sm leading-relaxed">{renderMessageText(msg.text)}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 text-white"><BotIcon /></div>
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-2xl rounded-bl-none shadow"><div className="flex items-center justify-center space-x-1"><div className="w-2 h-2 bg-primary-500/50 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-primary-500/50 rounded-full animate-bounce [animation-delay:0.1s]"></div><div className="w-2 h-2 bg-primary-500/50 rounded-full animate-bounce [animation-delay:0.2s]"></div></div></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          {/* Input area */}
          <div className="p-2 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2">
                <button
                    onClick={handleToggleRecording}
                    disabled={isLoading || !chat}
                    className={`p-3 rounded-full transition-colors duration-200 ${
                        isRecording 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                    {isRecording ? <StopIcon /> : <MicIcon />}
                </button>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={isRecording ? "Escuchando..." : "Escribe un mensaje..."}
                    className="w-full p-3 border-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={isLoading || !chat}
                  />
                </div>
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !userInput.trim() || !chat}
                className="p-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:bg-primary-500/50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Word Watch component */}
      <div className="w-full max-w-md lg:max-w-sm flex-shrink-0 mt-8 lg:mt-0">
         <WordWatch words={incorrectWords} />
      </div>
    </div>
  );
};
