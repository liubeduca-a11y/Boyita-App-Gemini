import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useStore } from '../store';
import { subDays, isAfter } from 'date-fns';
import { cn } from './Layout';

export function PediatricianChat() {
  const { events, profile } = useStore();
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: `¡Hola! Soy tu asistente virtual. Puedo ayudarte a analizar los datos de ${profile.name} y darte consejos generales. ¿En qué te puedo ayudar hoy?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      // Build context
      const recentEvents = events.filter(e => isAfter(new Date(e.timestamp), subDays(new Date(), 7)));
      
      let oz = 0;
      let diapers = 0;
      let sleepMs = 0;
      recentEvents.forEach(e => {
        if (e.type === 'feeding' && e.details?.amount) oz += e.details.amount;
        if (e.type === 'hygiene') diapers += 1;
        if (e.type === 'sleep' && e.endTimestamp) sleepMs += (e.endTimestamp - e.timestamp);
      });

      const context = `Datos de los últimos 7 días de ${profile.name}:
      - Onzas consumidas: ${oz.toFixed(1)}
      - Pañales cambiados: ${diapers}
      - Horas de sueño: ${(sleepMs / (1000 * 60 * 60)).toFixed(1)}
      `;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // We need to map our messages to the format expected by generateContent
      const contents = messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      contents.push({ role: 'user', parts: [{ text: userText }] });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: contents,
        config: {
          systemInstruction: `Eres un asistente virtual experto en cuidado de bebés, amigable y empático. Actúas como un pediatra de apoyo para analizar los datos registrados en la app. 
          IMPORTANTE: Aclara siempre que eres una IA y que ante cualquier duda médica o emergencia, deben consultar a un pediatra real.
          Aquí tienes el contexto del bebé:
          Nombre: ${profile.name}
          Fecha de nacimiento: ${profile.birthDate}
          ${context}
          
          Responde de forma concisa, clara y tranquilizadora. Usa un tono amigable y accesible para los padres.`,
        }
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || 'Lo siento, no pude procesar tu solicitud.' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Hubo un error al conectar con el asistente. Por favor, intenta de nuevo.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mt-8 flex flex-col h-[500px]">
      <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="p-2 bg-theme-light dark:bg-theme-dark/20 rounded-xl text-theme-dark dark:text-theme-base">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Asistente Pediátrico</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Resuelve dudas sobre los datos de {profile.name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] rounded-2xl p-3 text-sm whitespace-pre-wrap",
              msg.role === 'user' 
                ? "bg-theme-base text-white rounded-br-none" 
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none"
            )}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-none p-3">
              <Loader2 className="w-5 h-5 animate-spin text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Escribe tu pregunta..."
          className="flex-1 p-3 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-all text-sm text-gray-900 dark:text-white"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="p-3 bg-theme-dark dark:bg-theme-base text-white rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
