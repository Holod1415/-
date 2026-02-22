/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  History as HistoryIcon, 
  Loader2, 
  AlertCircle,
  Trash2,
  Maximize2,
  LayoutGrid,
  Square,
  Smartphone,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
interface ImageItem {
  id: string;
  prompt: string;
  url: string;
  timestamp: number;
  config: {
    aspectRatio: string;
  };
}

const ASPECT_RATIOS = [
  { id: '1:1', label: 'Square', icon: Square },
  { id: '16:9', label: 'Landscape', icon: Monitor },
  { id: '9:16', label: 'Portrait', icon: Smartphone },
  { id: '4:3', label: 'Classic', icon: LayoutGrid },
  { id: '3:4', label: 'Tall', icon: LayoutGrid },
] as const;

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<typeof ASPECT_RATIOS[number]['id']>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ImageItem[]>([]);
  const [currentImage, setCurrentImage] = useState<ImageItem | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('ai_image_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('ai_image_history', JSON.stringify(history));
  }, [history]);

  const generateImage = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        },
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
          break;
        }
      }

      if (!imageUrl) {
        throw new Error("No image data returned from the model.");
      }

      const newImage: ImageItem = {
        id: Math.random().toString(36).substring(7),
        prompt: prompt,
        url: imageUrl,
        timestamp: Date.now(),
        config: {
          aspectRatio,
        }
      };

      setHistory(prev => [newImage, ...prev]);
      setCurrentImage(newImage);
      setPrompt('');
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "An unexpected error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (currentImage?.id === id) {
      setCurrentImage(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <header className="flex flex-col items-center text-center mb-16 space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-900/20"
          >
            <ImageIcon className="w-8 h-8 text-emerald-500" />
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">AI Image Studio</h1>
            <p className="text-gray-500 text-sm font-medium tracking-[0.2em] uppercase">Transform text into visual reality</p>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Controls */}
          <div className="lg:col-span-5 space-y-8">
            <section className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    Creative Prompt
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A cyberpunk street at night, neon lights, rainy reflection, hyper-realistic..."
                    className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none placeholder:text-gray-700"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Aspect Ratio</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ASPECT_RATIOS.map((ratio) => {
                      const Icon = ratio.icon;
                      return (
                        <button
                          key={ratio.id}
                          onClick={() => setAspectRatio(ratio.id)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-2 py-3 rounded-xl border transition-all",
                            aspectRatio === ratio.id 
                              ? "bg-emerald-500 border-emerald-500 text-black" 
                              : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">{ratio.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={generateImage}
                  disabled={isGenerating || !prompt.trim()}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                    isGenerating || !prompt.trim()
                      ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-900/30 active:scale-[0.98]"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Generate
                    </>
                  )}
                </button>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 text-red-400 text-sm"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                  </motion.div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Result & History */}
          <div className="lg:col-span-7 space-y-12">
            {/* Result Display */}
            <section className="min-h-[400px] flex flex-col">
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center p-12 space-y-6"
                  >
                    <div className="relative">
                      <div className="w-20 h-20 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-emerald-500 animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold italic uppercase">Manifesting your vision</h3>
                      <p className="text-gray-500 text-sm max-w-xs mx-auto">Gemini is painting your imagination into pixels...</p>
                    </div>
                  </motion.div>
                ) : currentImage ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-500">Latest Creation</h2>
                      <div className="flex gap-2">
                        <a 
                          href={currentImage.url} 
                          download={`ai-image-${currentImage.id}.png`}
                          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                    <div className={cn(
                      "relative bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl group",
                      currentImage.config.aspectRatio === '1:1' ? 'aspect-square' : 
                      currentImage.config.aspectRatio === '16:9' ? 'aspect-video' : 
                      currentImage.config.aspectRatio === '9:16' ? 'aspect-[9/16] max-w-sm mx-auto' :
                      currentImage.config.aspectRatio === '4:3' ? 'aspect-[4/3]' : 'aspect-[3/4] max-w-sm mx-auto'
                    )}>
                      <img 
                        src={currentImage.url} 
                        alt={currentImage.prompt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-sm text-gray-200 line-clamp-2 italic">"{currentImage.prompt}"</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center p-12 text-gray-600"
                  >
                    <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Your generated image will appear here</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* History Grid */}
            {history.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4 text-gray-500" />
                    Archive
                  </h2>
                  <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">{history.length} items</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {history.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group relative aspect-square bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer"
                      onClick={() => setCurrentImage(item)}
                    >
                      <img src={item.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-white" />
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistoryItem(item.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 rounded-lg backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>

        <footer className="mt-32 pt-12 border-t border-white/5 text-center">
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} AI Image Studio • Powered by Gemini Flash 2.5
          </p>
        </footer>
      </div>
    </div>
  );
}
