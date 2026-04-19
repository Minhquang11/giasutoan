/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Loader2, RefreshCcw, BookOpen, CheckCircle2, AlertCircle, Info, Paperclip, Calculator, Book, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from './lib/utils';
import { analyzeProblem, evaluateAnswer, getFormulas, type MathProblemAnalysis } from './services/geminiService';
import { FORMULA_DATA } from './constants/mathContent';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  type?: 'text' | 'problem' | 'hint' | 'solution' | 'feedback' | 'formula';
}

const FORMULA_HANDBOOK = [
  { id: 'ham-so', label: 'Hàm Số & Đồ Thị' },
  { id: 'nguyen-ham', label: 'Nguyên Hàm & Tích Phân' },
  { id: 'mu-log', label: 'Mũ & Logarit' },
  { id: 'so-phuc', label: 'Số Phức' },
  { id: 'khoi-da-dien', label: 'Khối Đa Diện' },
];

const EXAM_ITEMS = [
  { label: 'Sở Hải Phòng 2026', url: 'https://toanmath.com/2026/04/de-khao-sat-thi-tot-nghiep-thpt-2026-mon-toan-so-gddt-hai-phong.html' },
  { label: 'Sở Đồng Nai 2026', url: 'https://toanmath.com/2026/04/de-thi-thu-tot-nghiep-thpt-2026-lan-1-mon-toan-so-gddt-dong-nai.html' },
  { label: 'Chuyên Lê Khiết 2026', url: 'https://toanmath.com/2026/04/de-thi-thu-tn-thpt-2026-mon-toan-lan-1-truong-chuyen-le-khiet-quang-ngai.html' },
  { label: 'Sở Phú Thọ 2026', url: 'https://toanmath.com/2026/04/de-khao-sat-chat-luong-toan-12-dot-2-nam-2025-2026-so-gddt-phu-tho.html' },
  { label: 'Sở Quảng Ninh 2026', url: 'https://toanmath.com/2026/04/de-thi-thu-tot-nghiep-thpt-nam-2026-mon-toan-so-gddt-quang-ninh.html' },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'bot',
      content: 'Chào bạn! Mình là Gia sư Toán THPT. Hãy gửi để bài toán bạn đang thắc mắc, mình sẽ cùng bạn giải nó nhé!',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<MathProblemAnalysis | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0 });
  const [selectedFormulaTopic, setSelectedFormulaTopic] = useState<{id: string, label: string} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const EXAM_DATE = new Date('2026-06-12T07:30:00');
    const updateTime = () => {
      const now = new Date();
      const diff = EXAM_DATE.getTime() - now.getTime();
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        });
      }
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleTopicClick = (id: string, label: string) => {
    setSelectedFormulaTopic({ id, label });
  };

  const handleExamSolutionGuide = (label: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user',
        content: `Hướng dẫn giải đề: ${label}`,
      },
      {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: `Vì lý do bảo mật và bản quyền PDF, mình không thể đọc trực tiếp toàn bộ đề ${label}. \n\nTuy nhiên, bạn hãy **chụp màn hình hoặc chép câu hỏi** cụ thể từ đề thi đó gửi vào đây, mình sẽ hướng dẫn bạn giải chi tiết từng bước nhé!`,
      },
    ]);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      if (!currentProblem) {
        const analysis = await analyzeProblem(userMsg.content);
        setCurrentProblem(analysis);

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          content: `### ${analysis.title}\n\nMình đã nhận được câu hỏi. Gợi ý cho bạn nè:\n\n${analysis.initialHint}\n\n*Hãy thử đưa ra kết quả của bạn nhé!*`,
          type: 'problem',
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const evaluation = await evaluateAnswer(currentProblem, userMsg.content);

        const feedbackMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          content: evaluation.feedback,
          type: 'feedback',
        };

        let extraMsgs: Message[] = [feedbackMsg];

        if (evaluation.status === 'CORRECT') {
          extraMsgs.push({
            id: (Date.now() + 2).toString(),
            role: 'bot',
            content: 'Chúc mừng bạn! Đáp án hoàn toàn chính xác. Bạn có muốn gửi bài toán mới không?',
          });
          setCurrentProblem(null);
        } else if (evaluation.status === 'NEARLY_CORRECT') {
          extraMsgs.push({
            id: (Date.now() + 2).toString(),
            role: 'bot',
            content: `Bạn đã rất gần rồi! Đây là hướng dẫn đầy đủ và đáp án cuối cùng:\n\n---\n**Hướng dẫn chi tiết:**\n${currentProblem.stepByStepGuide}\n\n**Đáp án cuối cùng:** \n### ${currentProblem.correctAnswer}`,
            type: 'solution',
          });
          setCurrentProblem(null);
        }

        setMessages((prev) => [...prev, ...extraMsgs]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: 'error',
          role: 'bot',
          content: 'Rất tiếc, đã có lỗi xảy ra khi xử lý yêu cầu. Bạn thử lại nhé!',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    setCurrentProblem(null);
    setMessages([
      {
        id: Date.now().toString(),
        role: 'bot',
        content: 'Đã sẵn sàng cho bài toán mới! Bạn cứ gửi đề nhé.',
      },
    ]);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-indigo-950 uppercase leading-none">MathGuide AI</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase mt-1">Lộ Trình Ôn Thi THPT Quốc Gia</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Đếm ngược kỳ thi</p>
            <p className="text-sm font-extrabold text-red-500 font-mono">
              {countdown.days} Ngày : {String(countdown.hours).padStart(2, '0')} Giờ
            </p>
          </div>
          <div className="hidden md:block h-10 w-px bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 border border-indigo-200 text-xs">
              AT
            </div>
            <span className="text-sm font-semibold text-slate-700 hidden sm:block">Anh Tuấn</span>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 hidden lg:flex">
          <section>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-4 tracking-widest">Sổ tay công thức</h3>
            <div className="space-y-1">
              {FORMULA_HANDBOOK.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTopicClick(item.id, item.label)}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-all flex items-center gap-2 group"
                >
                  <Book size={14} className="opacity-40 group-hover:opacity-100" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </section>
          
          <section>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-4 tracking-widest">Kho Đề Thi & Lời Giải</h3>
            <div className="space-y-1">
              {EXAM_ITEMS.map((exam, index) => (
                <div key={index} className="group relative">
                  <a
                    href={exam.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-md transition-colors"
                  >
                    {exam.label}
                  </a>
                  <button 
                    onClick={() => handleExamSolutionGuide(exam.label)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-[10px] bg-indigo-50 text-indigo-600 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                  >
                    Giải
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-auto p-4 bg-slate-50 rounded-xl border border-slate-200 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
              <Bot size={80} />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed italic relative z-10">
              "MathGuide AI không giải hộ bạn, chúng tôi hướng dẫn bạn cách để tự mình chinh phục."
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-slate-50 relative">
          {/* Chat Window */}
          <div 
            ref={scrollRef}
            className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className={cn(
                    "flex w-full mb-6",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "flex max-w-[85%] sm:max-w-[80%] items-start gap-4",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                      msg.role === 'user' ? "bg-slate-800 text-white font-bold text-[10px]" : "bg-indigo-600 text-white"
                    )}>
                      {msg.role === 'user' ? 'AT' : <Bot size={18} strokeWidth={2.5} />}
                    </div>
                    <div className={cn(
                      "p-4 rounded-2xl shadow-sm border text-sm leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-indigo-600 text-white border-indigo-500 rounded-tr-none shadow-indigo-100" 
                        : "bg-white text-slate-800 border-slate-200 rounded-tl-none"
                    )}>
                      <div className={cn(
                        "prose prose-sm max-w-none",
                        msg.role === 'user' 
                          ? "prose-invert prose-p:text-white" 
                          : "prose-slate"
                      )}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkMath]} 
                          rehypePlugins={[rehypeKatex]}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      
                      {msg.type === 'solution' && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-indigo-600 font-bold uppercase text-[10px] tracking-wider">
                          <CheckCircle2 size={14} />
                          Đã hoàn thành lời giải chi tiết
                        </div>
                      )}
                      
                      {msg.role === 'bot' && msg.type === 'problem' && !currentProblem && (
                         <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-tight">Đang chờ đề bài mới...</span>
                         </div>
                      )}

                      {msg.role === 'bot' && currentProblem && msg.id === messages[messages.length-1].id && (
                        <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-tight">Đang chờ kết quả của bạn để hiện lời giải chi tiết...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 text-slate-400 text-xs ml-12 p-2"
              >
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                </div>
                <span className="font-medium">MathGuide đang phân tích dữ liệu...</span>
              </motion.div>
            )}
          </div>

          {/* Floating Action Button for Reset on Mobile */}
          <button 
            onClick={handleReset}
            className="absolute bottom-28 right-8 p-3 bg-white border border-slate-200 text-slate-500 rounded-full shadow-lg hover:bg-slate-50 transition-all z-10 lg:hidden"
            title="Làm mới bài tập"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>

          {/* Input Area */}
          <div className="h-28 bg-white border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <input 
                autoFocus
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={currentProblem ? "Nhập kết quả cuối cùng của bạn..." : "Nhập câu hỏi toán học của bạn..."} 
                className="bg-transparent border-none outline-none flex-1 text-sm text-slate-800 placeholder-slate-400 font-medium"
              />
              <div className="flex items-center gap-1.5">
                <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors hidden sm:block">
                  <Paperclip size={18} />
                </button>
                <button 
                  disabled={!inputValue.trim() || isTyping}
                  onClick={handleSend}
                  className={cn(
                    "p-2 rounded-lg transition-all shadow-sm flex items-center justify-center",
                    inputValue.trim() && !isTyping 
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95" 
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                    <img 
                      src={`https://picsum.photos/seed/${i + 10}/32/32`} 
                      alt="avatar" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500 shadow-sm">
                  +1k
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-tight w-24">
                Bạn đang cùng học với 1.2k sĩ tử
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* Formula Modal */}
      <AnimatePresence>
        {selectedFormulaTopic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFormulaTopic(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b flex items-center justify-between bg-indigo-600 text-white">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6" />
                  <h2 className="text-xl font-bold uppercase tracking-tight">{selectedFormulaTopic.label}</h2>
                </div>
                <button 
                  onClick={() => setSelectedFormulaTopic(null)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="prose prose-indigo max-w-none prose-p:text-slate-600 prose-headings:text-slate-800">
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {FORMULA_DATA[selectedFormulaTopic.id] || "Không tìm thấy nội dung."}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t flex justify-center">
                <button 
                  onClick={() => setSelectedFormulaTopic(null)}
                  className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                >
                  Đã hiểu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
