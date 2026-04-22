import React, { useState, useRef, useEffect } from "react";
import {
  Home,
  Upload,
  Send,
  BookOpen,
  FileText,
  Menu,
  X,
  Plus,
  MessageSquare,
  Trash2,
  MoreVertical,
  LogOut,
  User,
  Layout,
  Library,
  Copy,
  Check,
  Sparkles,
  Brain,
  Zap,
  GraduationCap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Sub-components moved to top to avoid initialization errors
const StatCard = ({ label, value, sub, color }) => {
  const colorMap = {
    blue: 'border-blue-100 bg-blue-50/30 text-blue-600',
    purple: 'border-purple-100 bg-purple-50/30 text-purple-600',
    green: 'border-green-100 bg-green-50/30 text-green-600',
  };

  return (
    <div className={`p-6 bg-white dark:bg-gray-800 rounded-3xl border ${colorMap[color] || 'border-gray-100'} dark:${colorMap[color] || 'border-gray-700'} shadow-sm`}>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium font-['Inter']">{label}</p>
      <p className="text-2xl font-black mt-1 text-gray-900 dark:text-white">{value}</p>
      <p className="text-[10px] text-gray-400 mt-2">{sub}</p>
    </div>
  );
};

const SidebarLink = ({ active, onClick, icon, label, collapsed }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-500 ease-in-out hover:scale-105 active:scale-95 ${active
      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 shadow-md hover:shadow-lg"
      : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 hover:shadow-sm"
      } ${collapsed ? 'justify-center' : ''}`}
  >
    {icon}
    {!collapsed && <span className="text-sm font-bold">{label}</span>}
  </button>
);

const LearningPage = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat"); // 'chat', 'docs', 'stats'

  // Use user-specific keys for localStorage to ensure separation
  // Prefer non-sensitive `id` when available. Do NOT use email/username (PII) or credentials.
  const userPrefix = user?.id || 'guest';
  const CHAT_HISTORY_KEY = `ez_chat_history_${userPrefix}`;
  const ACTIVE_CHAT_KEY = `ez_active_chat_id_${userPrefix}`;
  const FILES_KEY = `ez_files_${userPrefix}`;

  const [aiConfig, setAiConfig] = useState({
    tone: "balanced",
    mode: "tutor",
    personality: "friendly",
  });
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [storedFiles, setStoredFiles] = useState([]); // persisted per-user metadata
  const [lastDocSummary, setLastDocSummary] = useState("");
  const [useFileContext, setUseFileContext] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileClosing, setProfileClosing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [compactChat, setCompactChat] = useState(false);
  const [showMobileOptions, setShowMobileOptions] = useState(false);

  // Initialize with the default chat if no history exists
  const getDefaultChat = () => ({
    id: `chat-${Date.now()}`,
    title: "New Study Session",
    preview: "Ready to help you excel!",
    date: new Date(),
    isActive: true,
    messages: [
      {
        id: Date.now(),
        sender: "ai",
        text: `Hello ${user?.name || "there"}! I'm your personalized study assistant. I can help you summarize notes, explain complex topics, or quiz you on your materials. What should we focus on today?`,
        timestamp: new Date(),
      },
    ],
  });

  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const profileRef = useRef(null);
  const textareaRef = useRef(null);

  // Helper function to format timestamps
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(date.getTime())) return "";
      return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (error) {
      console.error("Error formatting time:", error);
      return "";
    }
  };

  // Helper function to format dates for chat history
  const formatDate = (date) => {
    if (!date) return "";
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return "";
      const now = new Date();
      if (d.toDateString() === now.toDateString()) return "Today";
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Get device context (date/time, timezone, geolocation)
  const getDeviceContext = async () => {
    const now = new Date();
    const deviceDate = now.toLocaleDateString();
    const deviceTime = now.toLocaleTimeString();
    const deviceYear = now.getFullYear();
    const deviceMonth = now.toLocaleString('default', { month: 'long' });
    const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    const location = { label: null, lat: null, lon: null, accuracy: null };
    if (navigator && navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 5000 });
        });
        if (pos && pos.coords) {
          location.lat = pos.coords.latitude;
          location.lon = pos.coords.longitude;
          location.accuracy = pos.coords.accuracy;
        }
      } catch (e) {
        // Geolocation failed or denied — silently ignore
      }
    }

    return {
      deviceDate,
      deviceTime,
      deviceYear,
      deviceMonth,
      deviceTimezone,
      location
    };
  };
  // Get preview text from messages
  const getPreviewText = (msgs) => {
    if (!Array.isArray(msgs) || msgs.length === 0) return "New session";
    try {
      const lastUserMessage = [...msgs].reverse().find((msg) => msg?.sender === "user");
      if (lastUserMessage) {
        return lastUserMessage.text.length > 40
          ? lastUserMessage.text.substring(0, 40) + "..."
          : lastUserMessage.text;
      }
      const lastAiMessage = [...msgs].reverse().find((msg) => msg?.sender === "ai");
      if (lastAiMessage) {
        return lastAiMessage.text.length > 40
          ? lastAiMessage.text.substring(0, 40) + "..."
          : lastAiMessage.text;
      }
    } catch (e) {
      console.error("Error generating preview:", e);
    }
    return "New conversation";
  };

  // Load chat history and messages from localStorage on component mount
  useEffect(() => {
    try {
      const savedChatHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      const savedFiles = localStorage.getItem(FILES_KEY);
      if (savedFiles) {
        try {
          const parsed = JSON.parse(savedFiles);
          if (Array.isArray(parsed)) setStoredFiles(parsed);
        } catch (e) {
          console.error('Error parsing stored files:', e);
        }
      }
      if (savedChatHistory) {
        const restoredHistory = JSON.parse(savedChatHistory);

        if (Array.isArray(restoredHistory) && restoredHistory.length > 0) {
          setChatHistory(restoredHistory);

          const activeChatId = localStorage.getItem(ACTIVE_CHAT_KEY);
          const chatToLoad = restoredHistory.find((chat) => chat.id === activeChatId) || restoredHistory[0];

          if (chatToLoad) {
            setCurrentChatId(chatToLoad.id);
            setMessages(Array.isArray(chatToLoad.messages) ? chatToLoad.messages : []);
          }
        } else {
          // Empty array in storage, initialize
          const initialChat = getDefaultChat();
          setChatHistory([initialChat]);
          setCurrentChatId(initialChat.id);
          setMessages(initialChat.messages);
        }
      } else {
        // No history for this user, create first chat
        const initialChat = getDefaultChat();
        setChatHistory([initialChat]);
        setCurrentChatId(initialChat.id);
        setMessages(initialChat.messages);
      }
    } catch (error) {
      console.error("Error restoring chat history:", error);
      // Fallback in case of parse error
      const initialChat = getDefaultChat();
      setChatHistory([initialChat]);
      setCurrentChatId(initialChat.id);
      setMessages(initialChat.messages);
    }
  }, [CHAT_HISTORY_KEY]);

  // Persist storedFiles metadata per user
  useEffect(() => {
    try {
      localStorage.setItem(FILES_KEY, JSON.stringify(storedFiles || []));
    } catch (e) {
      console.error('Error saving stored files:', e);
    }
  }, [storedFiles, FILES_KEY]);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      try {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
      } catch (error) {
        console.error("Error saving chat history:", error);
      }
    }
  }, [chatHistory, CHAT_HISTORY_KEY]);

  // Save active chat ID to localStorage
  useEffect(() => {
    if (currentChatId) {
      try {
        localStorage.setItem(ACTIVE_CHAT_KEY, currentChatId);
      } catch (error) {
        console.error("Error saving active chat ID:", error);
      }
    }
  }, [currentChatId, ACTIVE_CHAT_KEY]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add a subtle parallax effect to the background
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!chatContainerRef.current) return;
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      chatContainerRef.current.style.backgroundPosition = `${x * 5}px ${y * 5
        }px`;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        handleCloseProfile();
      }
    };
    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  // Update chat history when messages change - with proper dependency management
  useEffect(() => {
    // Debounce the update to prevent excessive re-renders
    const timeoutId = setTimeout(() => {
      setChatHistory((prevHistory) => {
        // Find the current chat
        const currentChatIndex = prevHistory.findIndex(
          (chat) => chat.id === currentChatId
        );

        if (currentChatIndex === -1) return prevHistory;

        // Create a new array to avoid direct state mutation
        const updatedHistory = [...prevHistory];

        // Update only the current chat
        updatedHistory[currentChatIndex] = {
          ...updatedHistory[currentChatIndex],
          messages: messages, // Store messages in chat history object
          preview: messages.length > 0 ? getPreviewText(messages) : "New chat",
          date: new Date(),
        };

        return updatedHistory;
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [messages, currentChatId]);

  // Close mobile options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMobileOptions && !event.target.closest('.mobile-options-menu')) {
        setShowMobileOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileOptions]);

  // Handle closing profile with pop-out animation
  const handleCloseProfile = () => {
    setProfileClosing(true);
    setTimeout(() => {
      setIsProfileOpen(false);
      setProfileClosing(false);
    }, 400);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const messageText = inputText.trim();
    if (!messageText || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Update chat title if this is the first user message
    const updatedMessages = [...messages, userMessage];
    updateChatTitle(currentChatId, updatedMessages);

    setInputText("");
    setIsLoading(true);
    setShowAnimation(true);

    const formData = new FormData();

    // Format previous messages for history (exclude current user message)
    const historyMessages = messages.map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    }));

    formData.append('messages', JSON.stringify(historyMessages));
    formData.append('userMessage', messageText);
    // Attach device context (date/time and geolocation) to config
    try {
      const deviceCtx = await getDeviceContext();
      const combinedConfig = { ...aiConfig, deviceContext: deviceCtx };
      formData.append('config', JSON.stringify(combinedConfig));
    } catch (e) {
      formData.append('config', JSON.stringify(aiConfig));
    }

    // Add files to the request if any are stored or recently uploaded
    // Note: In this version, we're sending the current batch of files
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      // Extract response content - backend seems to return a structure with choices
      const aiContent = data.choices ? data.choices[0]?.message?.content : data.response;

      const aiResponse = {
        id: Date.now(),
        sender: "ai",
        text: aiContent || "I'm not sure how to respond to that.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      const errorResponse = {
        id: Date.now(),
        sender: "ai",
        text: "Sorry, I couldn't process your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    }
    setIsLoading(false);
    setShowAnimation(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || isLoading) return;

    setFiles((prev) => [...prev, file]);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "user",
        text: `📎 **File uploaded:** ${file.name}`,
        timestamp: new Date(),
      },
    ]);
    setIsLoading(true);
    setShowAnimation(true);

    const formData = new FormData();
    formData.append("files", file);
    formData.append("userMessage", `Analyze this file: ${file.name}`);
    formData.append("messages", JSON.stringify([{ role: "user", content: `Analyze this file: ${file.name}` }]));
    // attach device context for file analysis
    try {
      const deviceCtx = await getDeviceContext();
      const combinedConfig = { ...aiConfig, deviceContext: deviceCtx };
      formData.append("config", JSON.stringify(combinedConfig));
    } catch (e) {
      formData.append("config", JSON.stringify(aiConfig));
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      const aiContent = data.choices ? data.choices[0]?.message?.content : data.response;

      const aiMsg = {
        id: Date.now(),
        sender: "ai",
        text: aiContent || "I've analyzed your file, but couldn't generate a summary.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // If it's a document, store the summary for context
      const allowedExtensions = [".pdf", ".ppt", ".pptx", ".doc", ".docx", ".txt"];
      if (allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))) {
        setLastDocSummary(aiContent || "");
      }

      // Persist file metadata for this user so it appears in Library
      const meta = { name: file.name, size: file.size, type: file.type || 'application/octet-stream', uploadedAt: new Date().toISOString() };
      setStoredFiles((prev) => {
        const deduped = [meta, ...prev.filter(f => f.name !== meta.name)];
        return deduped;
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: "Sorry, I couldn't process your file. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setShowAnimation(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Create a new chat session
  const createNewChat = () => {
    const newChat = getDefaultChat();
    setChatHistory((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages(newChat.messages);
    setActiveTab('chat');
    setLastDocSummary("");
    setFiles([]);
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  // Start a focused discussion for a specific file
  const discussFile = (file) => {
    if (!file) return;
    // Create a fresh chat session and attach the file for context
    const newChat = getDefaultChat();
    setChatHistory((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages(newChat.messages);
    setActiveTab('chat');
    // If we have the actual File object in `files`, move it to front; otherwise use metadata only
    if (file instanceof File) {
      setFiles((prev) => [file, ...prev.filter(f => f.name !== file.name)]);
    } else {
      // push metadata to storedFiles head (already persisted) to surface it
      setStoredFiles((prev) => [file, ...prev.filter(f => f.name !== file.name)]);
    }
    setUseFileContext(true);
    setInputText(`Please analyze and discuss this file: ${file.name}`);
    if (window.innerWidth < 768) setShowSidebar(false);
    // focus the input shortly after switching tabs
    setTimeout(() => textareaRef.current?.focus(), 120);
  };

  // Generate chat title from first user message
  const generateChatTitle = (messages) => {
    const firstUserMessage = messages.find((msg) => msg.sender === "user");
    if (firstUserMessage) {
      const text = firstUserMessage.text;
      const title = text.length > 30 ? text.substring(0, 30) + "..." : text;
      return title.replace(/[^\w\s]/g, "").trim() || "New Chat";
    }
    return "New Chat";
  };

  // Update chat title when first message is sent
  const updateChatTitle = (chatId, messages) => {
    setChatHistory((prev) =>
      prev.map((chat) =>
        chat.id === chatId && chat.title === "New Study Session"
          ? { ...chat, title: generateChatTitle(messages) }
          : chat
      )
    );
  };

  // Switch to a different chat session
  const switchChat = (chatId) => {
    const selectedChat = chatHistory.find((chat) => chat.id === chatId);
    if (selectedChat) {
      setCurrentChatId(chatId);
      setMessages(selectedChat.messages || []);
      setActiveTab('chat');
      if (window.innerWidth < 768) setShowSidebar(false);
    }
  };

  const deleteChat = (chatId, e) => {
    e.stopPropagation();

    setChatHistory((prev) => {
      const updatedHistory = prev.filter((chat) => chat.id !== chatId);

      // If we deleted the current chat, switch to the next available one or create a new one
      if (chatId === currentChatId) {
        if (updatedHistory.length > 0) {
          const nextChat = updatedHistory[0];
          setCurrentChatId(nextChat.id);
          setMessages(nextChat.messages || []);
        } else {
          const newChat = getDefaultChat();
          setCurrentChatId(newChat.id);
          setMessages(newChat.messages);
          return [newChat];
        }
      }
      return updatedHistory;
    });
  };

  const NavItem = ({ id, label, icon: Icon, active, onClick }) => (
    <button
      onClick={onClick}
      className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-400 ease-in-out ${active
        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10"
        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
        }`}
    >
      <Icon size={18} className={`transition-all duration-400 ease-in-out ${active ? 'text-white' : 'group-hover:scale-110 group-hover:-rotate-6'}`} />
      <span className={`font-semibold text-sm font-['Cambria_Math'] transition-colors duration-200 ${active ? 'text-white' : 'group-hover:text-gray-900 dark:group-hover:text-white'}`}>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a1a] overflow-hidden font-['Inter'] transition-colors duration-500">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Sidebar — Glassmorphism */}
      <div
        className={`${showSidebar ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 fixed md:relative z-50 h-full w-[280px] bg-white/80 dark:bg-[#0d0d20]/80 backdrop-blur-2xl border-r border-gray-200/50 dark:border-gray-800/50 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        {/* Brand & Toggle */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <BookOpen size={18} />
            </div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-blue-600 via-purple-500 to-rose-500 text-transparent bg-clip-text hover:scale-105 transition-transform duration-200 font-['Cambria_Math']">EzStudy</span>
          </div>
          <button onClick={() => setShowSidebar(false)} className="md:hidden p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Global Navigation */}
        <div className="px-4 space-y-1 mb-4">
          <NavItem
            id="home"
            label="Go to Home"
            icon={Home}
            active={false}
            onClick={() => navigate('/')}
          />
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700/50 to-transparent my-3 mx-2"></div>
          <NavItem
            id="chat"
            label="AI Chat"
            icon={MessageSquare}
            active={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
          />
          <NavItem
            id="docs"
            label="Library"
            icon={Library}
            active={activeTab === 'docs'}
            onClick={() => setActiveTab('docs')}
          />
        </div>

        {/* Dynamic Context Section based on Nav */}
        <div className="flex-1 flex flex-col min-h-0 border-t border-gray-100/50 dark:border-gray-800/30">
          {activeTab === 'chat' && (
            <>
              <div className="p-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] pl-1 font-['Cambria_Math']">Recent Chats</span>
                <button
                  onClick={createNewChat}
                  className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all hover:scale-110 active:scale-90"
                  title="New Chat"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 space-y-1">
                {chatHistory.length === 0 ? (
                  <div className="py-8 text-center px-4">
                    <p className="text-xs text-gray-400 dark:text-gray-500">No recent activity</p>
                  </div>
                ) : (
                  chatHistory
                    .filter((chat) =>
                      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((chat) => (
                      <div
                        key={chat.id}
                        className={`group relative rounded-xl border transition-all duration-300 ${chat.id === currentChatId
                          ? "bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-800/30 shadow-sm"
                          : "bg-transparent border-transparent hover:bg-gray-50/80 dark:hover:bg-gray-800/30"
                          }`}
                      >
                        <button
                          onClick={() => switchChat(chat.id)}
                          className="w-full text-left p-2.5 pr-8 focus:outline-none"
                        >
                          <h3 className={`text-sm font-semibold truncate ${chat.id === currentChatId ? "text-indigo-700 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300"} font-['Cambria_Math']`}>
                            {chat.title}
                          </h3>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{chat.preview}</p>
                        </button>
                        <button
                          onClick={(e) => deleteChat(chat.id, e)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                )}
              </div>
            </>
          )}

          {activeTab === 'docs' && (
            <div className="p-4">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] pl-1 font-['Cambria_Math']">Knowledge Base</span>
              <div className="mt-4 p-5 bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700/50 text-center">
                <Library size={20} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-[10px] text-gray-500 dark:text-gray-500 font-medium font-['Cambria_Math']">Your uploaded study materials will appear here</p>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Area */}
        <div className="p-4 border-t border-gray-100/50 dark:border-gray-800/30">
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="group w-full flex items-center space-x-3 p-2.5 hover:bg-gray-50/80 dark:hover:bg-gray-800/30 rounded-xl transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-lg shadow-purple-500/20">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.[0] || user?.username?.[0] || "U"
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate font-['Cambria_Math']">{user?.name || user?.username || "Guest"}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate font-['Cambria_Math']">{user?.email || "No email"}</p>
              </div>
              <MoreVertical size={14} className="text-gray-400 dark:text-gray-500" />
            </button>

            {(isProfileOpen || profileClosing) && (
              <div className={`absolute bottom-full left-0 w-full mb-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-gray-100/50 dark:border-gray-700/30 py-1 z-50 will-change-transform-opacity ${profileClosing ? 'animate-popOut' : 'animate-fadeIn'
                }`}>
                <div className="px-2 py-1">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all rounded-lg"
                  >
                    <LogOut size={14} />
                    <span className="font-['Cambria_Math']">Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0a0a1a] relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 right-10 w-[400px] h-[400px] bg-gradient-to-br from-indigo-400/[0.03] to-purple-400/[0.03] dark:from-indigo-500/[0.04] dark:to-purple-500/[0.04] rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute bottom-40 left-10 w-[350px] h-[350px] bg-gradient-to-br from-purple-400/[0.03] to-pink-400/[0.03] dark:from-purple-500/[0.03] dark:to-pink-500/[0.03] rounded-full blur-3xl animate-float-reverse"></div>
          <div className="hidden md:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/[0.02] to-indigo-400/[0.02] dark:from-blue-500/[0.03] dark:to-indigo-500/[0.03] rounded-full blur-3xl animate-float"></div>
          {/* Subtle dot grid */}
          <div className="hidden lg:block absolute top-10 right-10 opacity-[0.015] dark:opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '30px 30px',
              width: '200px',
              height: '200px'
            }}
          ></div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100/50 dark:border-gray-800/30 bg-white/80 dark:bg-[#0d0d20]/80 backdrop-blur-xl sticky top-0 z-40">
          <button onClick={() => setShowSidebar(true)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all">
            <Menu size={18} />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <BookOpen size={12} />
            </div>
            <span className="font-extrabold text-base tracking-tight font-['Cambria_Math']">
              <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-rose-500 text-transparent bg-clip-text">EzStudy</span>
              <span className="ml-1 text-gray-700 dark:text-gray-300"> AI</span>
            </span>
          </div>
          <button onClick={() => navigate('/')} className="p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all">
            <Home size={18} />
          </button>
        </div>

        {/* Backdrop for mobile */}
        {showSidebar && (
          <div
            className="md:hidden fixed inset-0 bg-gray-900/20 dark:bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setShowSidebar(false)}
          />
        )}

        <div className="flex-1 flex flex-col relative overflow-hidden z-10">
          {/* Main Content Render */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-3 py-4 md:px-10 lg:px-20"
          >
            {activeTab === 'chat' && (
              <div className="max-w-4xl mx-auto w-full">
                {/* Home / Greeting Screen — Enhanced */}
                {messages.length <= 1 && (
                  <div className="py-10 md:py-16 animate-fadeIn">
                    {/* Greeting badge */}
                    <div className="flex justify-center md:justify-start mb-4">
                      <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[11px] font-semibold border border-indigo-100 dark:border-indigo-800/30 backdrop-blur-sm">
                        <Sparkles size={12} className="animate-pulse" />
                        <span className="font-['Cambria_Math']">AI-Powered Study Assistant</span>
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight font-['Cambria_Math'] text-center md:text-left">
                      What are we{" "}
                      <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-rose-500 text-transparent bg-clip-text">learning</span>{" "}
                      today?
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base mb-10 max-w-lg leading-relaxed font-medium font-['Cambria_Math'] text-center md:text-left">
                      Upload lectures, summarize notes, or start a quiz.
                      I'm here to make studying effortless.
                    </p>

                    {/* Quick Action Cards — Enhanced */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                      <button
                        onClick={() => setInputText("Explain Quantum Physics like I'm five years old.")}
                        className="group p-5 bg-white/70 dark:bg-gray-900/40 backdrop-blur-sm border border-gray-100 dark:border-gray-800/40 rounded-2xl text-left hover:border-indigo-300 dark:hover:border-indigo-700/50 hover:shadow-lg hover:shadow-indigo-100/50 dark:hover:shadow-indigo-900/10 transition-all duration-300 card-hover"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                            <Brain size={18} className="text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform duration-300" />
                          </div>
                          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-['Cambria_Math']">Concept Quiz</p>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors font-['Cambria_Math']">"Explain Quantum Physics like I'm 5..."</p>
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="group p-5 bg-white/70 dark:bg-gray-900/40 backdrop-blur-sm border border-gray-100 dark:border-gray-800/40 rounded-2xl text-left hover:border-purple-300 dark:hover:border-purple-700/50 hover:shadow-lg hover:shadow-purple-100/50 dark:hover:shadow-purple-900/10 transition-all duration-300 card-hover"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">
                            <FileText size={18} className="text-purple-600 dark:text-purple-400 group-hover:rotate-12 transition-transform duration-300" />
                          </div>
                          <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider font-['Cambria_Math']">Note Summary</p>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors font-['Cambria_Math']">Upload PDF to generate study notes</p>
                      </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-6 text-center md:text-left">
                      {[
                        { icon: Zap, label: "Instant Answers", value: "AI" },
                        { icon: GraduationCap, label: "Personalized", value: "100%" },
                        { icon: BookOpen, label: "Available", value: "24/7" }
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                          <Icon size={14} className="text-indigo-400" />
                          <span className="text-[11px] font-semibold font-['Cambria_Math']">{value} {label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages — Enhanced */}
                <div className="space-y-6">
                  {Array.isArray(messages) && messages.map((message, index) => {
                    if (!message) return null;
                    const isGreeting = message.sender === "ai" && message.text.startsWith("Hello");
                    return (
                      <div
                        key={message.id || `message-${index}`}
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} animate-fadeIn group`}
                      >
                        <div className={`max-w-[95%] md:max-w-[85%] relative ${message.sender === "user"
                          ? "bg-gradient-to-br from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/20 dark:to-purple-950/10 border border-indigo-100/60 dark:border-indigo-800/20 rounded-2xl rounded-br-md p-4 shadow-sm"
                          : "w-full"
                          }`}>
                          {message.sender === "ai" && (
                            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-gray-100/50 dark:border-gray-800/30">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                                  <BookOpen size={12} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500 font-['Cambria_Math']">EzStudy Assistant</span>
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(message.text);
                                  setCopiedId(message.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-1.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg"
                              >
                                {copiedId === message.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                              </button>
                            </div>
                          )}
                          <div className={`${isGreeting ? "prose-sm md:prose-base" : "prose-sm"} max-w-none break-words ${message.sender === "user" ? "text-gray-800 dark:text-gray-100 text-[13px]" : `text-gray-800 dark:text-gray-200 ${isGreeting ? "text-sm md:text-base" : "text-[13px] md:text-sm"} leading-relaxed`}`} style={message.sender === "ai" ? { fontFamily: "'Cambria Math', 'Times New Roman', serif" } : {}}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.text || ""}
                            </ReactMarkdown>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="text-[9px] text-gray-400 dark:text-gray-500 font-medium font-['Cambria_Math']">
                              {formatTime(message.timestamp)}
                            </div>
                            {message.sender === "user" && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(message.text);
                                  setCopiedId(message.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-all duration-300 ml-2 p-1 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg"
                              >
                                {copiedId === message.id ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex justify-start animate-fadeIn">
                      <div className="flex items-center space-x-2 px-4 py-3">
                        <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                          <BookOpen size={12} />
                        </div>
                        <div className="flex space-x-1.5">
                          <div className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-purple-400 dark:bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-pink-400 dark:bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}

            {activeTab === 'docs' && (
              <div className="max-w-5xl mx-auto py-10 px-4">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white font-['Cambria_Math']">Study Library</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-['Cambria_Math']">Manage your uploaded materials and AI summaries</p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all btn-shine"
                  >
                    <Plus size={18} />
                    <span className="font-['Cambria_Math']">Add Material</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {storedFiles.length > 0 ? storedFiles.map((file, idx) => (
                    <div key={file.name || `file-${idx}`} className="group bg-white/70 dark:bg-gray-900/40 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-sm card-hover">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-gradient-to-br group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white transition-all duration-300">
                        <FileText size={24} />
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white truncate mb-1 font-['Cambria_Math']">{file.name}</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 font-['Cambria_Math']">{file.size ? (file.size / 1024).toFixed(1) : '—'} KB • Document</p>
                      <button type="button" onClick={() => discussFile(file)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-['Cambria_Math'] flex items-center gap-1 group-hover:gap-2">
                        Discuss this file <span className="transition-all">→</span>
                      </button>
                    </div>
                  )) : (
                    <div className="col-span-full py-20 text-center">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Library size={36} className="text-gray-200 dark:text-gray-700" />
                      </div>
                      <p className="text-gray-400 dark:text-gray-500 font-medium font-['Cambria_Math']">Your library is currently empty</p>
                      <p className="text-xs text-gray-300 dark:text-gray-600 mt-1 font-['Cambria_Math']">Upload PDFs, documents, or lecture notes to get started</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chat Input — Enhanced with glow effect */}
          {activeTab === 'chat' && (
            <div className="px-3 pb-6 md:px-10 lg:px-20 bg-transparent relative z-20">
              <div className="max-w-3xl mx-auto relative">
                <form
                  onSubmit={handleSendMessage}
                  className={`relative flex items-end transition-all duration-500 rounded-2xl border outline-none focus:outline-none ${compactChat ? 'py-2 px-3' : ''} ${isLoading
                    ? 'bg-gray-50/80 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800/30'
                    : 'bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/30 shadow-lg shadow-black/[0.03] dark:shadow-black/20 focus-within:shadow-xl focus-within:shadow-indigo-500/[0.05] dark:focus-within:shadow-indigo-500/[0.08] focus-within:border-indigo-200 dark:focus-within:border-indigo-800/40'
                    }`}
                >
                  <div className="flex-1 min-h-[60px] sm:min-h-[52px] flex flex-col justify-center px-4 sm:px-5 py-3 sm:py-3">
                    {/* Context Badge if using files */}
                    {files.length > 0 && useFileContext && (
                      <div className="flex items-center space-x-1.5 mb-2 bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded-full w-fit border border-indigo-100 dark:border-indigo-800/30 animate-fadeIn">
                        <Library size={10} className="animate-pulse" />
                        <span className="text-[9px] font-bold uppercase tracking-widest italic font-['Cambria_Math']">Smart Context</span>
                      </div>
                    )}
                    <textarea
                      ref={textareaRef}
                      rows="2"
                      value={inputText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, window.innerWidth < 640 ? 300 : 200) + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Ask the AI anything..."
                      className={`w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 ${compactChat ? 'text-sm py-0' : 'text-[14px] py-1'} text-gray-800 dark:text-gray-100 resize-none max-h-48 sm:max-h-48 placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium`}
                    />
                  </div>

                  <div className="flex items-center space-x-1 md:space-x-1 pr-3 pb-3">
                    {/* Mobile options menu */}
                    <div className="relative md:hidden">
                      <button
                        type="button"
                        onClick={() => setShowMobileOptions(!showMobileOptions)}
                        className="mobile-options-menu p-3 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 rounded-xl transition-all duration-200"
                        title="More options"
                      >
                        <MoreVertical size={20} />
                      </button>
                      {showMobileOptions && (
                        <div className="mobile-options-menu absolute bottom-full right-0 mb-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/30 p-2 min-w-[160px] animate-fadeIn">
                          <button
                            type="button"
                            onClick={() => {
                              fileInputRef.current?.click();
                              setShowMobileOptions(false);
                            }}
                            className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                          >
                            <Upload size={18} />
                            <span className="text-sm font-medium font-['Cambria_Math']">Upload File</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUseFileContext(!useFileContext);
                              setShowMobileOptions(false);
                            }}
                            className={`w-full flex items-center space-x-3 p-3 text-left rounded-lg transition-colors ${useFileContext ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                          >
                            <Library size={18} />
                            <span className="text-sm font-medium font-['Cambria_Math']">Library Context</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCompactChat(!compactChat);
                              setShowMobileOptions(false);
                            }}
                            className={`w-full flex items-center space-x-3 p-3 text-left rounded-lg transition-colors ${compactChat ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                          >
                            <Layout size={18} />
                            <span className="text-sm font-medium font-['Cambria_Math']">Compact Chat</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Desktop buttons */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="hidden md:flex p-2.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 rounded-xl transition-all duration-200"
                      title="Upload Study Material"
                    >
                      <Upload size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseFileContext(!useFileContext)}
                      className={`hidden md:flex p-2.5 rounded-xl transition-all duration-200 ${useFileContext ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20'}`}
                      title="Library Context"
                    >
                      <Library size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompactChat(!compactChat)}
                      className={`hidden md:flex p-2.5 rounded-xl transition-all duration-200 ${compactChat ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20'}`}
                      title="Toggle compact chat"
                    >
                      <Layout size={18} />
                    </button>
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isLoading}
                      className={`p-3 md:p-2.5 text-white rounded-xl transition-all duration-300 ${!inputText.trim() || isLoading
                        ? 'bg-gray-300 dark:bg-gray-700 opacity-40 scale-95 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30'
                        }`}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={18} className="transition-transform" />
                      )}
                    </button>
                  </div>
                </form>
                <div className="flex justify-center items-center space-x-4 mt-3 text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold font-['Cambria_Math']">
                  <span>Enter to send</span>
                  <span className="w-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <span>Shift+Enter for new line</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningPage;
