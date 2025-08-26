import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { geminiService } from '../services/geminiService';
import type { SpeakingScenario } from '../types';
import { SpeakingIcon, MicIcon, StopIcon } from './icons/Icons';
import { WordWithTooltip } from './WordWithTooltip';

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const SPEAKING_SCENARIOS: SpeakingScenario[] = [
    {
        id: 'restaurant',
        title: 'En el Restaurante',
        description: 'Pide comida y bebida en un restaurante.',
        systemInstruction: `You are Kandy, a friendly restaurant waitress. Your customer is an A1 English learner. Start by greeting them and asking "What would you like to order?". Your goal is to take their order. Use simple A1 vocabulary related to food (e.g., "water", "pizza", "salad", "chicken", "apple juice", "dessert") and restaurant interactions (e.g., "order", "anything else?", "enjoy your meal"). Keep your responses very short and encouraging.`
    },
    {
        id: 'airport',
        title: 'En el Aeropuerto',
        description: 'Haz el check-in para un vuelo.',
        systemInstruction: `You are Kandy, a friendly airline check-in agent. Your customer is an A1 English learner. Start by greeting them and asking "Where are you flying to today?". Your goal is to check them in for their flight. Use simple A1 vocabulary related to travel (e.g., "passport", "ticket", "bag", "window seat", "gate", "flight"). Keep your responses very short and clear.`
    },
    {
        id: 'interview',
        title: 'Entrevista de Trabajo',
        description: 'Responde a preguntas básicas en una entrevista.',
        systemInstruction: `You are Kandy, a friendly job interviewer. The candidate is an A1 English learner. Start by saying "Hello, thank you for coming. Tell me about yourself." Your goal is to ask simple job interview questions. Use basic A1 vocabulary (e.g., "name", "work", "like", "good at", "job"). Keep your questions very short and simple.`
    },
    {
        id: 'cinema',
        title: 'En el Cine',
        description: 'Compra entradas para ver una película.',
        systemInstruction: `You are Kandy, a friendly cinema ticket seller. The customer is an A1 English learner. Start by asking, "Hello! Which movie would you like to see?". Your goal is to sell them a ticket. Use simple A1 vocabulary like "movie", "ticket", "how many", "time", "popcorn", "drink". Keep your interaction short and helpful.`
    },
    {
        id: 'taxi',
        title: 'En un Taxi',
        description: 'Dile al conductor a dónde quieres ir.',
        systemInstruction: `You are Kandy, a friendly taxi driver. The passenger is an A1 English learner. Start the conversation with "Good morning! Where to?". Your goal is to understand their destination. Use simple A1 vocabulary like "go to", "address", "please", "here is fine", "thank you". Keep your responses very short.`
    },
    {
        id: 'university',
        title: 'En la Universidad',
        description: 'Pide indicaciones para llegar a un aula.',
        systemInstruction: `You are Kandy, a helpful university student. An A1 English learner asks you for directions. Start with "Hi! Can I help you?". Your goal is to help them find a classroom. Use simple A1 vocabulary like "classroom", "where is", "go straight", "turn left", "turn right", "next to". Keep your directions simple.`
    },
    {
        id: 'work',
        title: 'Día en el Trabajo',
        description: 'Saluda a un colega y habla de una tarea.',
        systemInstruction: `You are Kandy, a friendly coworker. You are talking to a new colleague who is an A1 English learner. Start by saying, "Good morning! How are you today?". Your goal is to have a short, simple chat about work. Use A1 vocabulary like "email", "meeting", "report", "help", "computer", "coffee break".`
    },
    {
        id: 'party',
        title: 'En una Fiesta',
        description: 'Preséntate a alguien nuevo.',
        systemInstruction: `You are Kandy, a friendly person at a party. You see an A1 English learner standing alone. Start by saying, "Hi! I'm Kandy. What's your name?". Your goal is to make small talk. Use simple A1 vocabulary like "music", "drink", "food", "fun", "do you like".`
    },
    {
        id: 'supermarket',
        title: 'En el Supermercado',
        description: 'Pregunta dónde está un producto.',
        systemInstruction: `You are Kandy, a helpful supermarket employee. An A1 English learner needs help. Start by asking, "Hello, can I help you find something?". Your goal is to help them find an item. Use simple A1 vocabulary like "where is", "milk", "bread", "apples", "aisle 3", "on the right".`
    },
    {
        id: 'doctor',
        title: 'En el Médico',
        description: 'Describe un síntoma simple.',
        systemInstruction: `You are Kandy, a kind doctor. Your patient is an A1 English learner. Start by asking, "Hello, what's the problem today?". Your goal is to understand their symptom. Use simple A1 vocabulary like "I have a", "headache", "cold", "stomach ache", "feel sick", "rest", "water".`
    },
    {
        id: 'library',
        title: 'En la Biblioteca',
        description: 'Pregunta cómo pedir un libro prestado.',
        systemInstruction: `You are Kandy, a friendly librarian. An A1 English learner wants to borrow a book. Start by saying, "Hello! How can I help you?". Your goal is to explain how to borrow a book. Use simple A1 vocabulary like "book", "borrow", "library card", "one week", "return".`
    },
    {
        id: 'coffee_shop',
        title: 'En la Cafetería',
        description: 'Pide un café y un pastel.',
        systemInstruction: `You are Kandy, a cheerful barista. An A1 English learner is at the counter. Start with "Hi! What can I get for you?". Your goal is to take their order. Use simple A1 vocabulary like "coffee", "tea", "cake", "small", "large", "to go", "for here".`
    },
    {
        id: 'shopping',
        title: 'Comprando Ropa',
        description: 'Pide una talla o color diferente.',
        systemInstruction: `You are Kandy, a helpful shop assistant. An A1 English learner wants to buy a shirt. Start with "Hello! Can I help you with anything?". Your goal is to help them find the right size or color. Use simple A1 vocabulary like "shirt", "size", "small", "medium", "large", "color", "red", "blue".`
    },
    {
        id: 'park',
        title: 'En el Parque',
        description: 'Habla sobre el tiempo con alguien.',
        systemInstruction: `You are Kandy, a friendly person sitting on a park bench. An A1 English learner sits next to you. Start the conversation with "It's a beautiful day, isn't it?". Your goal is to have a short chat about the weather. Use simple A1 vocabulary like "sunny", "cold", "raining", "I like", "weather".`
    },
    {
        id: 'bus',
        title: 'En el Autobús',
        description: 'Pregunta si un asiento está ocupado.',
        systemInstruction: `You are Kandy, a passenger on a bus. An A1 English learner points to the seat next to you. You should start by saying "Hello!". Your goal is to tell them if the seat is free. Use very simple A1 phrases like "Yes, it's free." or "Sorry, it's taken." Then ask them a simple question like "Where are you going?".`
    },
    {
        id: 'gym',
        title: 'En el Gimnasio',
        description: 'Pregunta cómo usar una máquina.',
        systemInstruction: `You are Kandy, a helpful person at the gym. An A1 English learner looks confused by a machine. Start by asking, "Hi, do you need help with that?". Your goal is to give a very simple instruction. Use A1 vocabulary like "push", "pull", "slowly", "like this", "good job".`
    },
    {
        id: 'phone_call',
        title: 'Haciendo una Llamada',
        description: 'Llama a un amigo para hacer planes.',
        systemInstruction: `You are Kandy, answering a phone call from your friend, who is an A1 English learner. Start by saying "Hello?". Your goal is to make a simple plan. Use A1 vocabulary like "Hi", "it's me", "are you free", "tomorrow", "let's go to", "the park", "see you".`
    },
    {
        id: 'hotel',
        title: 'En el Hotel',
        description: 'Haz el check-in en tu habitación.',
        systemInstruction: `You are Kandy, a friendly hotel receptionist. An A1 English learner wants to check in. Start with "Hello, welcome! Do you have a reservation?". Your goal is to check them in. Use simple A1 vocabulary like "reservation", "name", "passport", "room key", "floor", "enjoy your stay".`
    },
    {
        id: 'friends_house',
        title: 'En Casa de un Amigo',
        description: 'Saluda a un amigo y a su familia.',
        systemInstruction: `You are Kandy, and your friend, an A1 English learner, has come to your house. Start by saying, "Hi! Come in!". Your goal is to introduce them to your family. Use simple A1 vocabulary like "this is my", "mother", "father", "nice to meet you", "sit down", "drink?".`
    }
];

export const SpeakingBuddy: React.FC<{ onActivityComplete: (activityType: string, points: number, achievementId?: 'speakingScenario') => void; }> = ({ onActivityComplete }) => {
    const [selectedScenario, setSelectedScenario] = useState<SpeakingScenario | null>(null);
    const [chat, setChat] = useState<Chat | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [userTranscript, setUserTranscript] = useState('');
    const [kandyResponse, setKandyResponse] = useState('');
    const recognitionRef = useRef<any>(null);
    // Fix: Use ReturnType<typeof setTimeout> for environment-agnostic timer ID type.
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasAwardedPoints = useRef(false);

    const stopAll = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
        speechSynthesis.cancel();
        setIsListening(false);
        setIsSpeaking(false);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            stopAll();
        };
    }, [stopAll]);

    const handleSelectScenario = (scenario: SpeakingScenario) => {
        stopAll();
        setSelectedScenario(scenario);
        const newChat = geminiService.createSpeakingBuddyChat(scenario.systemInstruction);
        setChat(newChat);
        setUserTranscript('');
        setKandyResponse('...');
        hasAwardedPoints.current = false;
        
        handleSendMessage("Start the conversation."); 

        timerRef.current = setTimeout(() => {
            if (!hasAwardedPoints.current) {
                onActivityComplete('Conversación Libre', 25, 'speakingScenario');
                hasAwardedPoints.current = true;
            }
        }, 180000); // 3 minutes
    };

    const handleSendMessage = async (message: string) => {
        if (!chat) return;

        try {
            const result = await chat.sendMessage({ message });
            const responseText = result.text;
            setKandyResponse(responseText);
            speak(responseText);
        } catch (error) {
            console.error("Error sending message to AI:", error);
            const errorMessage = "I'm sorry, I'm having trouble connecting right now.";
            setKandyResponse(errorMessage);
            speak(errorMessage);
        }
    };

    const speak = (text: string) => {
        if (!text) {
            startListening(); 
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            startListening();
        };
        speechSynthesis.speak(utterance);
    };

    const startListening = useCallback(() => {
        if (isListening) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Tu navegador no soporta el reconocimiento de voz. Prueba con Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsListening(true);
            setUserTranscript('');
        };

        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map(result => result.transcript)
                .join('');
            
            setUserTranscript(transcript);

            if (event.results[0].isFinal) {
                recognition.stop();
                if (transcript.trim()) {
                    handleSendMessage(transcript);
                }
            }
        };
        
        recognition.onend = () => {
            setIsListening(false);
        };
        
        recognition.start();
    }, [isListening]);


    if (!selectedScenario) {
        return (
             <div className="max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400">AI Speaking Buddy</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-base md:text-lg">Practica conversaciones de la vida real con tu tutor de IA, Kandy.</p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {SPEAKING_SCENARIOS.map(sc => (
                        <button key={sc.id} onClick={() => handleSelectScenario(sc)} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-left transition-transform transform hover:-translate-y-1 hover:shadow-xl">
                            <div className="text-primary-500 text-2xl mb-3"><SpeakingIcon /></div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{sc.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">{sc.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto text-center">
             <button onClick={() => { stopAll(); setSelectedScenario(null); }} className="mb-6 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                &larr; Volver a los escenarios
            </button>
            <h2 className="text-3xl font-bold text-primary-600 dark:text-primary-400">{selectedScenario.title}</h2>
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 min-h-[50vh] flex flex-col justify-between">
                <div>
                    <div className="mb-8">
                        <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">Kandy dice:</p>
                        <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100 min-h-[3em]">
                           {kandyResponse.split(/(\s+)/).map((word, index) => (
                               <WordWithTooltip key={index} word={word} />
                           ))}
                        </p>
                    </div>
                     <div className="mb-8">
                        <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">Tú dices:</p>
                        <p className="text-2xl font-semibold text-primary-600 dark:text-primary-400 min-h-[3em] p-4 bg-primary-500/5 dark:bg-gray-700/50 rounded-lg">
                            {userTranscript || "..."}
                        </p>
                    </div>
                </div>
                 <div className="flex flex-col items-center">
                    <button
                        onClick={isListening ? stopAll : startListening}
                        disabled={isSpeaking}
                        className={`flex items-center justify-center w-24 h-24 text-white font-bold rounded-full transition-all duration-300 shadow-xl
                            ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary-500 hover:bg-primary-600'}
                            ${isSpeaking ? 'bg-gray-400 cursor-not-allowed' : ''}
                        `}
                    >
                        {isListening ? <StopIcon /> : <MicIcon />}
                    </button>
                    <p className="mt-4 text-gray-500 dark:text-gray-400">
                        {isSpeaking ? 'Kandy está hablando...' : (isListening ? 'Escuchando...' : 'Pulsa para hablar')}
                    </p>
                </div>
            </div>
        </div>
    );
};