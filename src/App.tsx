/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Terminal, 
  HardDrive, 
  Activity, 
  Send, 
  Cpu, 
  Wifi, 
  WifiOff,
  Maximize2,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { voiceService } from './services/voiceService.ts';
import { getJarvisResponse, JarvisMessage } from './services/geminiService.ts';
import { mockSystemService, VirtualFile } from './services/mockSystemService.ts';
import { automationService, AutomationTask } from './services/automationService.ts';

export default function App() {
  const [messages, setMessages] = useState<JarvisMessage[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [metrics, setMetrics] = useState({ cpu: 0, memory: 0, arcReactor: 84, uptime: 0 });
  const [online, setOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'automation'>('chat');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize files, tasks and metrics
    setFiles(mockSystemService.getFiles());
    setTasks(automationService.getTasks());
    const metricInterval = setInterval(() => {
      setMetrics(mockSystemService.getSystemMetrics());
    }, 2000);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial greeting
    const greeting = "Systems online, Sir. How can I assist you today?";
    setMessages([{ role: 'assistant', content: greeting }]);
    
    return () => {
      clearInterval(metricInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMsg: JarvisMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    const systemStatus = `CPU: ${metrics.cpu}%, Memory: ${metrics.memory}%, Files: ${files.length}, Tasks: ${tasks.length}, Internet: ${online ? 'Connected' : 'Disconnected'}`;
    const response = await getJarvisResponse([...messages, userMsg], systemStatus);
    
    // Parse commands from response
    let cleanResponse = response;
    const cmdRegex = /\[CMD:([^\]]+)\]/g;
    let match;
    
    while ((match = cmdRegex.exec(response)) !== null) {
      const fullCmd = match[1];
      const [type, ...args] = fullCmd.split('|');
      
      if (type === 'SET_REMINDER') {
        const textArg = args.find(a => a.startsWith('text='))?.split('=')[1];
        const timeArg = args.find(a => a.startsWith('time='))?.split('=')[1];
        
        if (textArg) {
          automationService.addTask({
            type: 'reminder',
            description: textArg,
            details: { time: timeArg }
          });
          setTasks(automationService.getTasks());
        }
      } else if (type === 'SYSTEM_CHECK') {
        const result = automationService.runSystemCheck();
        cleanResponse += `\n\n${result}`;
      } else if (type === 'DATA_BACKUP') {
        const result = automationService.runDataBackup(files.length);
        cleanResponse += `\n\n${result}`;
      }
      
      // Remove command from text response
      cleanResponse = cleanResponse.replace(match[0], '');
    }

    setIsThinking(false);
    setMessages(prev => [...prev, { role: 'assistant', content: cleanResponse.trim() }]);
    
    setIsSpeaking(true);
    voiceService.speak(cleanResponse.trim(), () => setIsSpeaking(false));
  };

  const toggleListening = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      voiceService.startListening(
        (text) => {
          setIsListening(false);
          handleSend(text);
        },
        () => setIsListening(false)
      );
    }
  };

  const createVirtualFile = () => {
    const name = `file_${Date.now()}.txt`;
    const newFile: VirtualFile = {
      name,
      content: "This is a new file created by JARVIS.",
      type: 'text',
      createdAt: new Date().toISOString()
    };
    mockSystemService.saveFile(newFile);
    setFiles(mockSystemService.getFiles());
  };

  return (
    <div className="h-screen w-screen flex flex-col p-4 md:p-8 relative overflow-hidden bg-[#050608] text-[#e0e6ed] font-sans">
      <div className="scan-line pointer-events-none" />
      
      {/* Background HUD Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 border-t border-l border-[#00e5ff]" />
        <div className="absolute bottom-0 right-0 w-64 h-64 border-b border-r border-[#00e5ff]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] border border-[#00e5ff] rounded-full opacity-5" />
      </div>

      {/* Header */}
      <header className="flex justify-between items-center mb-8 z-10">
        <div className="flex items-center gap-4">
          <motion.div 
            animate={{ 
              scale: isSpeaking ? [1, 1.1, 1] : 1,
              rotate: isThinking ? [0, 180, 360] : 0,
              boxShadow: isListening ? "0 0 30px #00e5ff" : "0 0 10px rgba(0, 229, 255, 0.3)"
            }}
            transition={{ 
              repeat: Infinity, 
              duration: isThinking ? 2 : 1,
              ease: "linear"
            }}
            className="w-12 h-12 rounded-full border-2 border-[#00e5ff] flex items-center justify-center bg-black/50"
          >
            <div className="w-6 h-6 rounded-full border border-[#00e5ff] opacity-50" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold tracking-widest text-[#00e5ff] uppercase jarvis-text-glow">J.A.R.V.I.S.</h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-tighter">MARK VII | CORE AI INTERFACE</p>
          </div>
        </div>

        <div className="flex gap-6 items-center text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00e5ff]" />
            <span className="text-gray-400">ARC:</span>
            <span className="text-[#00e5ff]">{metrics.arcReactor.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2">
            {online ? <Wifi className="w-4 h-4 text-[#00e5ff]" /> : <WifiOff className="w-4 h-4 text-red-500" />}
            <span className={online ? "text-[#00e5ff]" : "text-red-500"}>{online ? 'ST LINK' : 'OFFLINE'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 z-10">
        <div className="hidden lg:flex flex-col gap-6">
          <div className="border border-white/10 bg-white/5 backdrop-blur-md p-4 rounded-lg flex-1">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2">
              <Cpu className="w-3 h-3" /> System Vitals
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span>PROCESSOR LOAD</span>
                  <span>{metrics.cpu}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.cpu}%` }}
                    className="h-full bg-[#00e5ff]"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span>MEMORY ALLOCATION</span>
                  <span>{metrics.memory}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.memory}%` }}
                    className="h-full bg-[#00e5ff]"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-white/5">
                <div className="text-[9px] text-gray-500 mb-2">SYSTEM UPTIME</div>
                <div className="font-mono text-lg text-[#00e5ff]">{Math.floor(metrics.uptime / 60)}m {metrics.uptime % 60}s</div>
              </div>
            </div>
          </div>
          
          <div className="h-40 border border-white/10 bg-white/5 backdrop-blur-md p-4 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
             <div className="text-[10px] text-gray-400 absolute top-2 left-2 uppercase tracking-widest">ARC Reactor Core</div>
             <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 border-4 border-dashed border-[#00e5ff]/20 rounded-full flex items-center justify-center"
             >
                <div className="w-12 h-12 border-2 border-[#00e5ff] rounded-full jarvis-glow bg-[#00e5ff]/10" />
             </motion.div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          <div className="flex-1 border border-white/10 bg-white/5 backdrop-blur-md rounded-lg p-4 flex flex-col min-h-0 relative shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={`text-[10px] uppercase tracking-widest px-2 py-1 transition-colors ${activeTab === 'chat' ? 'text-[#00e5ff] border-b border-[#00e5ff]' : 'text-gray-500 hover:text-[#00e5ff]'}`}
                >
                  Neural Interface
                </button>
                <button 
                  onClick={() => setActiveTab('files')}
                  className={`text-[10px] uppercase tracking-widest px-2 py-1 transition-colors ${activeTab === 'files' ? 'text-[#00e5ff] border-b border-[#00e5ff]' : 'text-gray-500 hover:text-[#00e5ff]'}`}
                >
                  Data Storage
                </button>
                <button 
                  onClick={() => setActiveTab('automation')}
                  className={`text-[10px] uppercase tracking-widest px-2 py-1 transition-colors ${activeTab === 'automation' ? 'text-[#00e5ff] border-b border-[#00e5ff]' : 'text-gray-500 hover:text-[#00e5ff]'}`}
                >
                  Automations
                </button>
              </div>
              <Maximize2 className="w-3 h-3 text-gray-600 cursor-pointer hover:text-[#00e5ff]" />
            </div>

            <div className="flex-1 overflow-y-auto pr-2" ref={scrollRef}>
              {activeTab === 'chat' ? (
                <div className="space-y-6 pb-4">
                  {messages.map((msg, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">
                          {msg.role === 'user' ? 'GUEST_SR' : 'JARVIS_CORE'}
                        </span>
                      </div>
                      <div className={`max-w-[85%] p-3 rounded-lg text-sm font-mono leading-relaxed ${
                        msg.role === 'user' 
                        ? 'bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff]' 
                        : 'bg-white/5 border border-white/10 text-gray-300'
                      }`}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                  {isThinking && (
                    <div className="flex gap-1">
                      <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-[#00e5ff]" />
                      <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-[#00e5ff]" />
                      <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-[#00e5ff]" />
                    </div>
                  )}
                </div>
              ) : activeTab === 'files' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                  {files.map((file, i) => (
                    <div key={i} className="p-3 border border-white/10 rounded bg-white/5 flex flex-col gap-2 relative group">
                      <div className="flex items-center gap-2 text-[11px] text-[#00e5ff] font-mono">
                        <FileText className="w-4 h-4" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <div className="text-[9px] text-gray-500 line-clamp-2 font-mono">
                        {file.content}
                      </div>
                      <button 
                        onClick={() => {
                          mockSystemService.deleteFile(file.name);
                          setFiles(mockSystemService.getFiles());
                        }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500/50 hover:text-red-500 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={createVirtualFile}
                    className="p-3 border border-dashed border-white/20 rounded bg-transparent text-[11px] text-gray-500 hover:border-[#00e5ff] hover:text-[#00e5ff] transition-colors"
                  >
                    + INITIALIZE NEW DATA BUFFER
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {tasks.length === 0 && (
                    <div className="text-center py-10 text-gray-600 font-mono text-xs">
                      NO ACTIVE AUTOMATIONS DETECTED
                    </div>
                  )}
                  {tasks.map((task) => (
                    <div key={task.id} className="p-4 border border-white/10 rounded bg-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${task.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-[#00e5ff]/10 text-[#00e5ff]'}`}>
                          {task.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-mono text-gray-300 uppercase">{task.description}</div>
                          <div className="text-[9px] text-gray-600 uppercase tracking-tighter">
                            {task.type} {task.details?.time ? `| AT ${task.details.time}` : ''} | {new Date(task.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {task.status === 'pending' && (
                          <button 
                            onClick={() => {
                              automationService.completeTask(task.id);
                              setTasks(automationService.getTasks());
                            }}
                            className="text-[9px] border border-green-500/30 text-green-500/70 py-1 px-2 rounded hover:bg-green-500/10"
                          >
                            COMPLETE
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            automationService.deleteTask(task.id);
                            setTasks(automationService.getTasks());
                          }}
                          className="p-2 text-red-500/50 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <button 
                      onClick={() => {
                        const result = automationService.runSystemCheck();
                        setMessages(prev => [...prev, { role: 'assistant', content: result }]);
                        setIsSpeaking(true);
                        voiceService.speak(result, () => setIsSpeaking(false));
                        setActiveTab('chat');
                      }}
                      className="p-3 border border-white/10 bg-white/5 rounded text-[10px] text-gray-400 hover:border-[#00e5ff] hover:text-[#00e5ff] transition-all flex items-center justify-center gap-2"
                    >
                      <Cpu className="w-3 h-3" /> INITIATE SYSTEM CHECK
                    </button>
                    <button 
                      onClick={() => {
                        const result = automationService.runDataBackup(files.length);
                        setMessages(prev => [...prev, { role: 'assistant', content: result }]);
                        setIsSpeaking(true);
                        voiceService.speak(result, () => setIsSpeaking(false));
                        setActiveTab('chat');
                      }}
                      className="p-3 border border-white/10 bg-white/5 rounded text-[10px] text-gray-400 hover:border-[#00e5ff] hover:text-[#00e5ff] transition-all flex items-center justify-center gap-2"
                    >
                      <HardDrive className="w-3 h-3" /> SECURE DATA BACKUP
                    </button>
                  </div>

                  <div className="mt-8 p-4 border border-[#00e5ff]/20 bg-[#00e5ff]/5 rounded-lg border-dashed">
                    <h4 className="text-[10px] text-[#00e5ff] mb-2 uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" /> Data Processor Simulation
                    </h4>
                    <p className="text-[9px] text-gray-500 mb-2">INPUT RAW STRING DATA BELOW FOR JARVIS-SIDE ANALYSIS</p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        id="processInput"
                        placeholder="Enter data string..."
                        className="flex-1 bg-black/50 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-[#00e5ff]"
                      />
                      <button 
                        onClick={() => {
                          const inputVal = (document.getElementById('processInput') as HTMLInputElement).value;
                          if (inputVal) {
                            const result = automationService.processData(inputVal);
                            const userMsg: JarvisMessage = { role: 'user', content: `Process this data: ${inputVal}` };
                            setMessages(prev => [...prev, userMsg, { role: 'assistant', content: result }]);
                            setIsSpeaking(true);
                            voiceService.speak(result, () => setIsSpeaking(false));
                            (document.getElementById('processInput') as HTMLInputElement).value = '';
                            setActiveTab('chat');
                          }
                        }}
                        className="bg-[#00e5ff]/20 text-[#00e5ff] text-[9px] px-3 rounded hover:bg-[#00e5ff]/30 transition-colors"
                      >
                        RUN
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="mt-4 pt-4 border-t border-white/5 flex gap-4">
              <div className="flex-1 relative">
                <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00e5ff] opacity-50" />
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="AWAITING COMMAND..."
                  className="w-full bg-black/30 border border-white/10 rounded-full py-2 pl-10 pr-4 text-xs font-mono focus:outline-none focus:border-[#00e5ff] text-[#00e5ff] placeholder:text-gray-700"
                />
              </div>
              <button 
                onClick={toggleListening}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-[#00e5ff]/10 text-[#00e5ff] hover:bg-[#00e5ff]/20'
                }`}
              >
                {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => handleSend()}
                className="w-10 h-10 rounded-full bg-[#00e5ff]/10 text-[#00e5ff] hover:bg-[#00e5ff]/20 flex items-center justify-center transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-col gap-6">
          <div className="border border-white/10 bg-white/5 backdrop-blur-md p-4 rounded-lg flex flex-col gap-4">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Audio Frequency
            </h3>
            <div className="h-24 flex items-end justify-between gap-1 overflow-hidden px-2">
              {[...Array(12)].map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ 
                    height: isSpeaking || isListening ? [10, Math.random() * 80 + 10, 10] : 4 
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 0.2 + (i * 0.05),
                  }}
                  className="w-full bg-[#00e5ff] opacity-40 rounded-t-sm"
                />
              ))}
            </div>
          </div>

          <div className="flex-1 border border-white/10 bg-white/5 backdrop-blur-md p-4 rounded-lg flex flex-col">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2"><HardDrive className="w-3 h-3"/> Neural Logs</h3>
            <div className="flex-1 font-mono text-[9px] text-gray-500 space-y-2 overflow-hidden">
              <AnimatePresence initial={false}>
                {messages.slice(-6).map((m, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="truncate whitespace-nowrap"
                  >
                    [{new Date().toLocaleTimeString([], { hour12: false })}] {m.role.substring(0, 4).toUpperCase()} :: {m.content.substring(0, 30)}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div className="text-[#00e5ff]/30 animate-pulse mt-2">_ SYSTEM IDLE...</div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-8 flex justify-between items-center border-t border-white/5 pt-4 text-[9px] text-gray-600 font-mono tracking-widest z-10 shrink-0">
        <div className="flex gap-8 overflow-hidden">
          <span className="hidden sm:inline">ENCRYPTION: ARC-256</span>
          <span className="hidden sm:inline">DISTRICT: MALIBU_CA</span>
          <span>MARK_VII_OS</span>
        </div>
        <div className="flex gap-4 text-gray-400">
           {isSpeaking && <span className="text-[#00e5ff] animate-pulse">TRANSMITTING...</span>}
           {isThinking && <span className="text-[#00e5ff]">COMPUTING...</span>}
           <span className="hidden md:inline">© 2026 STARK INDUSTRIES GLOBAL</span>
        </div>
      </footer>
    </div>
  );
}
