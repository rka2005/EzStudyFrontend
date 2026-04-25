import React, { useState, useRef, useEffect } from "react";
import { Bot, Home, LogOut, Upload, X, Send, FileText, Image, Play, Loader, Copy, Check } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiFetch } from '../utils/apiClient';

const LearningPageSimple = ({ setShowLearningPage, user, onLogout }) => {
    const initialMessages = [
        {
            id: 1,
            sender: "ai",
            text: "👋 Welcome to EzStudy AI Console! I can help you with:\n\n📚 **Study Questions** - Ask anything about your subjects\n🖼️ **Image Recognition** - Upload images to analyze\n📄 **PDF Analysis** - Upload PDFs for content summary\n🎥 **Video Transcription** - Describe video content\n\nHow can I assist you today?",
            timestamp: new Date(),
            animated: true,
        },
    ];

    const [messages, setMessages] = useState(initialMessages);
    const [inputText, setInputText] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [copiedMessageId, setCopiedMessageId] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle file upload with recognition
    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach((file) => {
            const fileId = Date.now() + Math.random();
            const fileType = file.type.startsWith("image/") ? "image" :
                file.type === "application/pdf" ? "pdf" :
                    file.type.startsWith("video/") ? "video" : "document";

            setUploadedFiles((prev) => [
                ...prev,
                { id: fileId, name: file.name, type: fileType, file },
            ]);

            // Add file notification message with animation
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    sender: "user",
                    text: `📎 **Uploaded:** ${file.name} (${(file.size / 1024).toFixed(2)} KB)\n**Type:** ${fileType.toUpperCase()}`,
                    timestamp: new Date(),
                    isFile: true,
                    fileType,
                    animated: true,
                },
            ]);

            // Simulate file recognition with delay
            setTimeout(() => {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now() + 1,
                        sender: "ai",
                        text: getFileRecognitionMessage(fileType, file.name),
                        timestamp: new Date(),
                        animated: true,
                    },
                ]);
            }, 800);
        });
    };

    const newChat = () => {
        setMessages(initialMessages);
        setUploadedFiles([]);
        setInputText("");
        setIsLoading(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    const getFileRecognitionMessage = (fileType, fileName) => {
        const responses = {
            image: `🖼️ **Image Recognized!**\n\nI've detected an image: *${fileName}*\n\nI can help you:\n• Extract text (OCR)\n• Describe the content\n• Solve math problems\n• Analyze diagrams\n\nWhat would you like me to do?`,
            pdf: `📄 **PDF Loaded!**\n\nDocument: *${fileName}*\n\nI can:\n• Summarize the content\n• Extract key points\n• Answer questions about it\n• Create study notes\n\nWhat's your question?`,
            video: `🎥 **Video Uploaded!**\n\nVideo: *${fileName}*\n\nI can help:\n• Transcribe content\n• Summarize key points\n• Answer questions\n• Generate study notes\n\nDescribe what you need!`,
            document: `📄 **Document Ready!**\n\nFile: *${fileName}*\n\nLet me know how I can assist with this document.`,
        };
        return responses[fileType] || responses.document;
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() && uploadedFiles.length === 0) return;

        // Add user message with animation
        const userMsg = {
            id: Date.now(),
            sender: "user",
            text: inputText || "(Sent files for analysis)",
            timestamp: new Date(),
            animated: true,
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputText("");
        setIsLoading(true);

        try {
            // Create FormData for multipart upload
            const formData = new FormData();

            // Add chat data
            formData.append('messages', JSON.stringify(
                messages
                    .filter(m => !m.isFile)
                    .map((msg) => ({
                        role: msg.sender === "user" ? "user" : "assistant",
                        content: msg.text,
                    }))
                    .concat([{ role: "user", content: inputText }])
            ));
            formData.append('userMessage', inputText);
            formData.append('config', JSON.stringify({ tone: "balanced", mode: "tutor", personality: "friendly" }));

            // Add files
            uploadedFiles.forEach((file) => {
                formData.append('files', file.file, file.name);
            });

            const response = await apiFetch('/api/chat', {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("API error");

            const data = await response.json();
            const aiResponse = data.choices[0]?.message?.content || "I couldn't process that. Please try again.";

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    sender: "ai",
                    text: aiResponse,
                    timestamp: new Date(),
                    animated: true,
                },
            ]);

            // Clear uploaded files after successful send
            setUploadedFiles([]);
        } catch (error) {
            console.error("Chat API Error:", error);
            let errorMessage = "Failed to connect to the server. Please try again.";

            if (error.message.includes("fetch")) {
                errorMessage = "Network error: Unable to reach the server. Check your internet connection.";
            } else if (error.message.includes("CORS")) {
                errorMessage = "Connection blocked. Please refresh the page and try again.";
            } else if (error.message) {
                errorMessage = `Server error: ${error.message}`;
            }

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    sender: "ai",
                    text: `⚠️ **Error:** ${errorMessage}\n\nIf this problem continues, please contact support.`,
                    timestamp: new Date(),
                    animated: true,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const removeFile = (fileId) => {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    };

    const copyToClipboard = async (text, messageId) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedMessageId(messageId);
            setTimeout(() => setCopiedMessageId(null), 2000); // Reset after 2 seconds
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className="h-screen flex bg-gray-50 dark:bg-gray-950">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? "w-64" : "w-20"
                    } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 transform`}
            >
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    {isSidebarOpen && (
                        <span className="font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-red-400 text-transparent bg-clip-text font-['Cambria_Math']">
                            EzStudy AI
                        </span>
                    )}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        <MenuIcon size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-3 space-y-2">
                    <button className="w-full p-3 rounded-lg flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-md hover:bg-blue-100 dark:hover:bg-blue-900/30">
                        <Bot size={20} />
                        {isSidebarOpen && <span className="font-semibold">AI Tutor</span>}
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                    <button
                        onClick={() => setShowLearningPage(false)}
                        className="w-full p-2 flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-sm"
                    >
                        <Home size={20} />
                        {isSidebarOpen && <span className="text-sm">Exit Console</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shadow-sm">
                    <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-red-400 font-['Cambria_Math']">
                        AI Learning Console
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={newChat}
                            title="New Chat"
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            New Chat
                        </button>
                        <button
                            onClick={onLogout}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-md"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((msg, idx) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`}
                                style={{
                                    animationDelay: msg.animated ? `${idx * 50}ms` : "0ms",
                                }}
                            >
                                <div
                                    className={`w-full sm:max-w-3xl p-4 rounded-2xl shadow-lg transition-all hover:shadow-xl transform hover:scale-105 relative group text-base ${msg.sender === "user"
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none"
                                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-700"
                                        }`}
                                >
                                    <button
                                        onClick={() => copyToClipboard(msg.text, msg.id)}
                                        className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${msg.sender === "user"
                                            ? "hover:bg-white/20 text-white/70 hover:text-white"
                                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            }`}
                                        title="Copy message"
                                    >
                                        {copiedMessageId === msg.id ? (
                                            <Check size={14} className="text-green-500" />
                                        ) : (
                                            <Copy size={14} />
                                        )}
                                    </button>
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words pr-8">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                    </div>
                                    <p
                                        className={`text-xs mt-2 opacity-60 ${msg.sender === "user" ? "text-right" : "text-left"
                                            }`}
                                    >
                                        {msg.timestamp.toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start animate-in fade-in">
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-bl-none shadow-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex space-x-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* File Upload Display */}
                    {uploadedFiles.length > 0 && (
                        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 overflow-x-auto">
                            <div className="flex gap-2">
                                {uploadedFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-700 flex-shrink-0 animate-in fade-in slide-in-from-left-2 duration-300"
                                    >
                                        {file.type === "image" && <Image size={16} className="text-blue-500" />}
                                        {file.type === "pdf" && <FileText size={16} className="text-red-500" />}
                                        {file.type === "video" && <Play size={16} className="text-purple-500" />}
                                        <span className="text-xs font-medium truncate max-w-[100px]">{file.name}</span>
                                        <button
                                            onClick={() => removeFile(file.id)}
                                            className="hover:text-red-500 transition-all duration-200 hover:scale-125 active:scale-100 text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-0.5 rounded"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
                        <form onSubmit={handleSendMessage} className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    multiple
                                    accept="image/*,.pdf,video/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-11 w-11 flex items-center justify-center p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-all duration-300 hover:scale-110 active:scale-95 flex-shrink-0 hover:shadow-md"
                                    title="Upload files (images, PDFs, videos)"
                                >
                                    <Upload size={24} />
                                </button>

                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                        // Shift+Enter is handled naturally by textarea for new lines
                                    }}
                                    placeholder="Ask me anything or upload files... (Shift+Enter for new line)"
                                    disabled={isLoading}
                                    rows={1}
                                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/30 transition-all disabled:opacity-50 resize-none min-h-[44px] max-h-32 overflow-y-auto"
                                    style={{ height: 'auto' }}
                                    onInput={(e) => {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                                    }}
                                />

                                <button
                                    type="submit"
                                    disabled={!inputText.trim() || isLoading}
                                    className="h-11 w-11 flex items-center justify-center p-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 active:scale-95 flex-shrink-0 hover:shadow-lg hover:shadow-purple-500/30 disabled:hover:scale-100"
                                >
                                    {isLoading ? <Loader size={24} className="animate-spin" /> : <Send size={24} />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
                                💡 Tip: Upload images for OCR, PDFs for analysis, videos for transcription, or ask anything about your studies!
                            </p>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

const MenuIcon = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);

export default LearningPageSimple;
