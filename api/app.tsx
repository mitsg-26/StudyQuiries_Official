import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BrainCircuit,
  Check,
  CheckSquare,
  Plus,
  Trash2,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Clock,
  Milestone as MilestoneIcon,
  LayoutDashboard,
  FileText,
  ExternalLink,
  ChevronRight,
  Search,
  Database,
  UploadCloud,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronDown,
  Calendar,
  X,
  Undo,
  Save,
  HelpCircle,
  Info,
  Layers,
  Activity,
  ListFilter,
  CheckCircle2,
  Flame,
  ArrowRight,
  RefreshCw,
  Sun,
  Moon,
  SearchCode
} from 'lucide-react';
import { Document, ChatMessage, MindmapNode, Milestone, ToastMessage } from './types';

// Web Audio API custom synthesizer chime
const playAudioChime = (frequency = 880, type: OscillatorType = 'sine') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } catch (e) {
    console.warn("Audio chime skipped:", e);
  }
};

export default function App() {
  // Navigation
  const [activePage, setActivePage] = useState<'dashboard' | 'workspace' | 'roadmap'>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
  });

  // Theme effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = (message: string, type: 'success' | 'info' | 'milestone' = 'info') => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type
    };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 4500);
  };

  // API Key Handling
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('cosmos-api-key') || '';
  });
  useEffect(() => {
    localStorage.setItem('cosmos-api-key', apiKey);
  }, [apiKey]);

  const isLiveAPI = useMemo(() => apiKey.trim().length > 15, [apiKey]);

  // Documents / Active Workspace
  const [activeWorkspace, setActiveWorkspace] = useState<Document[]>(() => {
    const saved = localStorage.getItem('sq-documents');
    return saved ? JSON.parse(saved) : [
      {
        id: "attention-paper-2305",
        title: "Attention Is All You Need",
        authors: "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit",
        abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
        fullText: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Multi-head self-attention allows the model to jointly attend to information from different representation subspaces at different positions. Grounding with positional encodings is crucial for preserving sequence order.",
        size: "1.2 MB",
        url: "https://arxiv.org/abs/1706.03762",
        pdfUrl: "https://arxiv.org/pdf/1706.03762.pdf",
        date: "2017-06-12"
      },
      {
        id: "lora-paper-4412",
        title: "LoRA: Low-Rank Adaptation of Large Language Models",
        authors: "Edward J. Hu, Y some, Phillip Wallis, Zeyuan Allen-Zhu",
        abstract: "An important paradigm of natural language processing consists of large-scale pre-training on general domain data and adaptation to specific tasks. LoRA proposes to freeze the pre-trained model weights and inject trainable rank decomposition matrices into each layer of the Transformer architecture.",
        fullText: "LoRA proposes to freeze the pre-trained model weights and inject trainable rank decomposition matrices into each layer of the Transformer architecture, greatly reducing the number of trainable parameters for downstream tasks. This preserves model quality while dramatically optimizing deployment latency and active GPU memory footprints.",
        size: "0.8 MB",
        url: "https://arxiv.org/abs/2106.09685",
        pdfUrl: "https://arxiv.org/pdf/2106.09685.pdf",
        date: "2021-06-17"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('sq-documents', JSON.stringify(activeWorkspace));
  }, [activeWorkspace]);

  const [activeDocument, setActiveDocument] = useState<Document | null>(() => {
    return activeWorkspace[0] || null;
  });

  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processIncomingFiles(e.target.files);
    }
  };

  const processIncomingFiles = async (fileList: FileList) => {
    const loadedDocs: Document[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const text = await file.text();
      const id = `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      
      const newDoc: Document = {
        id,
        title: file.name.replace(/\.[^/.]+$/, ""),
        authors: "Local Upload",
        abstract: text.substring(0, 300) + "...",
        fullText: text,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        url: "#",
        date: new Date().toISOString().split('T')[0]
      };
      loadedDocs.push(newDoc);
    }
    
    if (loadedDocs.length > 0) {
      setActiveWorkspace(prev => [...loadedDocs, ...prev]);
      setActiveDocument(loadedDocs[0]);
      showToast(`Ingested ${loadedDocs.length} local files as context!`, 'success');
      playAudioChime(660, 'triangle');
    }
  };

  const removeFromWorkspace = (id: string) => {
    setActiveWorkspace(prev => prev.filter(d => d.id !== id));
    if (activeDocument?.id === id) {
      const remaining = activeWorkspace.filter(d => d.id !== id);
      setActiveDocument(remaining[0] || null);
    }
    showToast("Document removed from workspace", "info");
  };

  // Search Online Sources (formerly arXiv discovery)
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('sq-search-history');
    return saved ? JSON.parse(saved) : ["Self-Attention Transformers", "Low-Rank Adaptation", "Drizzle ORM Node", "arXiv grounding"];
  });

  useEffect(() => {
    localStorage.setItem('sq-search-history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistoryDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const performSearch = async (queryToSearch: string) => {
    const finalQuery = queryToSearch.trim();
    if (!finalQuery) return;

    // Add to history
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h.toLowerCase() !== finalQuery.toLowerCase());
      return [finalQuery, ...filtered].slice(0, 8); // Keep top 8 searches
    });

    setSearchQuery(finalQuery);
    setIsSearching(true);
    setShowHistoryDropdown(false);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(finalQuery)}`);
      if (!res.ok) throw new Error("Proxy response failed");
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
        showToast(`Harvested ${data.results.length} academic results!`, 'success');
      } else {
        setSearchResults([]);
        showToast("No active academic matches found.", "info");
      }
    } catch (e: any) {
      console.error(e);
      // Fallback search results if server search fails or is disconnected
      setSearchResults([
        {
          id: `fb-1-${Date.now()}`,
          title: `[Fallback] Grounded Transformer Analysis: ${finalQuery}`,
          authors: "Academic Community Preprint",
          abstract: `A theoretical evaluation detailing ${finalQuery} with multi-layered representations and parameter efficiency configurations. Built as a persistent contextual buffer for sandbox testing.`,
          size: "Online source",
          url: "https://arxiv.org",
          date: new Date().toISOString().split('T')[0]
        }
      ]);
      showToast("Grounded with sandbox datasets", "info");
    } finally {
      setIsSearching(false);
    }
  };

  const removeHistoryItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    setSearchHistory(prev => prev.filter(h => h !== item));
  };

  const clearAllHistory = () => {
    setSearchHistory([]);
    showToast("Search history log cleared", "info");
  };

  const injectIntoWorkspace = (doc: Document) => {
    if (activeWorkspace.some(d => d.id === doc.id)) {
      showToast("Document already active in workspace", "info");
      return;
    }
    setActiveWorkspace(prev => [doc, ...prev]);
    setActiveDocument(doc);
    showToast("Injected online source into current context", "success");
    playAudioChime(740, 'sine');
  };

  // AI Synthesis Chatbot
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'initial',
        role: 'bot',
        text: "Welcome to **StudyQueries** synthesis chat. I am StudyQueries AI, your advanced academic research workspace partner. Ask me questions about transformer embeddings, LoRA adapter structures, or query current online academic resources in real-time."
      }
    ];
  });
  const [userMessage, setUserMessage] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [chatContextMode, setChatContextMode] = useState<'all' | string>('all');
  const [useWebSearch, setUseWebSearch] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isBotThinking]);

  const sendChatMessage = async () => {
    const text = userMessage.trim();
    if (!text) return;

    setUserMessage('');
    const userMsgObj: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text
    };
    
    setChatMessages(prev => [...prev, userMsgObj]);
    setIsBotThinking(true);

    try {
      // Determine context documents
      let docsToInclude: Document[] = [];
      if (chatContextMode === 'all') {
        docsToInclude = activeWorkspace;
      } else {
        const found = activeWorkspace.find(d => d.id === chatContextMode);
        if (found) docsToInclude = [found];
      }

      // Prepare request payload
      const payload = {
        message: text,
        history: chatMessages.slice(1).map(m => ({ role: m.role, text: m.text })),
        contextDocs: docsToInclude.map(d => ({
          id: d.id,
          title: d.title,
          authors: d.authors,
          abstract: d.abstract,
          fullText: d.fullText
        })),
        useWebSearch: useWebSearch,
        customApiKey: apiKey
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      const responseData = await res.json();

      // Extract search grounding metadata if present
      const webBadges: Array<{ label: string; url: string }> = [];
      if (responseData.groundingMetadata?.groundingChunks) {
        responseData.groundingMetadata.groundingChunks.forEach((chunk: any, i: number) => {
          if (chunk.web) {
            webBadges.push({
              label: chunk.web.title || `Web Source ${i + 1}`,
              url: chunk.web.uri
            });
          }
        });
      }

      // Extract local workspace citations dynamically
      const citations: Array<{ ref: string; title: string }> = [];
      activeWorkspace.forEach(doc => {
        if (responseData.text.toLowerCase().includes(doc.title.split(' ')[0].toLowerCase())) {
          citations.push({ ref: doc.id, title: doc.title });
        }
      });

      const botMsgObj: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        role: 'bot',
        text: responseData.text,
        citations: citations.length > 0 ? citations : undefined,
        webBadges: webBadges.length > 0 ? webBadges : undefined,
        groundingMetadata: responseData.groundingMetadata
      };

      setChatMessages(prev => [...prev, botMsgObj]);
      playAudioChime(520, 'sine');

    } catch (err: any) {
      console.error(err);
      const errorMsgObj: ChatMessage = {
        id: `msg-${Date.now()}-bot-err`,
        role: 'bot',
        text: `### Connection Error
Failed to communicate with StudyQueries server. Make sure the backend server is running correctly.

**Details:** ${err.message || 'Unknown error'}`
      };
      setChatMessages(prev => [...prev, errorMsgObj]);
    } finally {
      setIsBotThinking(false);
    }
  };

  const handleLocalAnchorClick = (docId: string) => {
    const doc = activeWorkspace.find(d => d.id === docId);
    if (doc) {
      setActiveDocument(doc);
      setActivePage('dashboard');
      showToast(`Viewing: ${doc.title}`, 'info');
      playAudioChime(600, 'triangle');
    } else {
      showToast(`Document context ID "${docId}" is not loaded in current workspace.`, 'info');
    }
  };

  // Chat message inline citation custom renderer
  const renderMessageContent = (text: string) => {
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      parts.push({
        type: 'link',
        label: match[1],
        url: match[2]
      });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    if (parts.length === 0) {
      return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {parts.map((part, index) => {
          if (part.type === 'text') {
            return <span key={index}>{part.content}</span>;
          } else {
            const isLocal = part.url?.startsWith('#');
            if (isLocal) {
              const docId = part.url?.substring(1) || '';
              return (
                <button
                  key={index}
                  onClick={() => handleLocalAnchorClick(docId)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-bold transition-all align-middle cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {part.label}
                </button>
              );
            } else {
              return (
                <a
                  key={index}
                  href={part.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-semibold hover:underline bg-sky-50 dark:bg-sky-950/20 px-1 py-0.5 rounded border border-sky-100 dark:border-sky-900 mx-0.5 transition-all align-middle"
                >
                  {part.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              );
            }
          }
        })}
      </div>
    );
  };

  const clearChat = () => {
    setChatMessages([
      {
        id: 'initial',
        role: 'bot',
        text: "Dialogue log reset. The active local workspace context is fully preserved."
      }
    ]);
    showToast("Chat log cleared", "info");
  };

  // Concept Mindmap
  const [mindmapCoreHub, setMindmapCoreHub] = useState('Transformer Ecosystem');
  const [mindmapNodes, setMindmapNodes] = useState<MindmapNode[]>(() => {
    const saved = localStorage.getItem('sq-mindmap-nodes');
    return saved ? JSON.parse(saved) : [
      {
        id: "node-1",
        label: "Self-Attention Mechanism",
        description: "Computes alignment scores between Key, Query, and Value matrices to scale contextual weights for each token index dynamically.",
        x: 180,
        y: 110,
        theme: "lavender",
        expanded: false,
        parents: []
      },
      {
        id: "node-2",
        label: "Multi-Head Sublayer",
        description: "Projects sequence projections across multiple separate sub-spaces to capture rich parallel aspects of grammar and relational dependencies.",
        x: 480,
        y: 130,
        theme: "mist",
        expanded: false,
        parents: ["node-1"]
      },
      {
        id: "node-3",
        label: "Positional Encodings",
        description: "Injects sinusoidal frequencies or learnable positional offsets to enable structural sequence context order, replacing standard recurrent loops.",
        x: 160,
        y: 280,
        theme: "peach",
        expanded: false,
        parents: []
      },
      {
        id: "node-4",
        label: "Decoder Cross-Attention",
        description: "Directly bridges positional outputs of the encoder representation layer down into auto-regressive target query vectors.",
        x: 450,
        y: 290,
        theme: "lavender",
        expanded: false,
        parents: ["node-1", "node-3"] // Multi-parent mother nodes connection!
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('sq-mindmap-nodes', JSON.stringify(mindmapNodes));
  }, [mindmapNodes]);

  const [newConceptLabel, setNewConceptLabel] = useState('');
  const [selectedNode, setSelectedNode] = useState<MindmapNode | null>(null);
  
  // Drag-and-drop state inside container
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const mindmapContainerRef = useRef<HTMLDivElement>(null);

  const spawnMindmapNode = () => {
    const label = newConceptLabel.trim();
    if (!label) return;

    const id = `node-${Date.now()}`;
    const parentNodeIds = selectedNode ? [selectedNode.id] : [];
    
    // Position randomly near the center
    const newX = 200 + Math.random() * 200;
    const newY = 150 + Math.random() * 150;

    const newNode: MindmapNode = {
      id,
      label,
      description: "Click edit icon to customize details and assign multiple mother parent relationships.",
      x: newX,
      y: newY,
      theme: Math.random() > 0.6 ? 'peach' : Math.random() > 0.3 ? 'lavender' : 'mist',
      expanded: false,
      parents: parentNodeIds
    };

    setMindmapNodes(prev => [...prev, newNode]);
    setNewConceptLabel('');
    showToast(`Spawned node: "${label}"`, 'success');
    playAudioChime(620, 'triangle');
  };

  const removeMindmapNode = (id: string) => {
    setMindmapNodes(prev => prev.filter(n => n.id !== id).map(n => ({
      ...n,
      parents: n.parents.filter(p => p !== id)
    })));
    if (selectedNode?.id === id) {
      setSelectedNode(null);
    }
    showToast("Concept node removed", "info");
  };

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    setDraggingId(id);
    const rect = mindmapContainerRef.current?.getBoundingClientRect();
    if (rect) {
      const node = mindmapNodes.find(n => n.id === id);
      if (node) {
        setDragOffset({
          x: e.clientX - rect.left - node.x,
          y: e.clientY - rect.top - node.y
        });
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !mindmapContainerRef.current) return;
    const rect = mindmapContainerRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    // Boundary constraints
    const boundedX = Math.max(25, Math.min(rect.width - 25, newX));
    const boundedY = Math.max(25, Math.min(rect.height - 25, newY));

    setMindmapNodes(prev => prev.map(n => n.id === draggingId ? { ...n, x: boundedX, y: boundedY } : n));
  };

  const handlePointerUp = () => {
    setDraggingId(null);
  };

  // Focus Time (Pomodoro / Customizable Timer)
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'custom'>('pomodoro');
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [customInputMinutes, setCustomInputMinutes] = useState(45);
  const [customInputSeconds, setCustomInputSeconds] = useState(0);

  // Total seconds calculation for visual tracking
  const totalSecondsInitial = useMemo(() => {
    if (timerMode === 'pomodoro') return 25 * 60;
    return (customInputMinutes * 60) + customInputSeconds;
  }, [timerMode, customInputMinutes, customInputSeconds]);

  const currentSecondsLeft = (timerMinutes * 60) + timerSeconds;
  const timerDashoffset = useMemo(() => {
    const ratio = currentSecondsLeft / (totalSecondsInitial || 1);
    return 402 * (1 - ratio);
  }, [currentSecondsLeft, totalSecondsInitial]);

  // Handle timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive) {
      interval = setInterval(() => {
        if (timerSeconds === 0) {
          if (timerMinutes === 0) {
            setTimerActive(false);
            // Completed chime
            playAudioChime(880, 'sine');
            setTimeout(() => playAudioChime(1100, 'triangle'), 150);
            showToast("Focus Time session completed! Rest up and recharge.", "success");
            
            // Auto reset
            if (timerMode === 'pomodoro') {
              setTimerMinutes(25);
            } else {
              setTimerMinutes(customInputMinutes);
              setTimerSeconds(customInputSeconds);
            }
          } else {
            setTimerMinutes(prev => prev - 1);
            setTimerSeconds(59);
          }
        } else {
          setTimerSeconds(prev => prev - 1);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timerMinutes, timerSeconds]);

  const setTimerPreset = (mode: 'pomodoro' | 'custom') => {
    setTimerActive(false);
    setTimerMode(mode);
    if (mode === 'pomodoro') {
      setTimerMinutes(25);
      setTimerSeconds(0);
    } else {
      setTimerMinutes(customInputMinutes);
      setTimerSeconds(customInputSeconds);
    }
  };

  const applyCustomTimerConfig = () => {
    setTimerActive(false);
    setTimerMinutes(customInputMinutes);
    setTimerSeconds(customInputSeconds);
    showToast(`Configured custom study session: ${customInputMinutes}m ${customInputSeconds}s`, 'info');
  };

  const resetTimer = () => {
    setTimerActive(false);
    if (timerMode === 'pomodoro') {
      setTimerMinutes(25);
      setTimerSeconds(0);
    } else {
      setTimerMinutes(customInputMinutes);
      setTimerSeconds(customInputSeconds);
    }
    showToast("Session timer reset", "info");
  };

  // Milestone Roadmap
  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    const saved = localStorage.getItem('sq-milestones');
    return saved ? JSON.parse(saved) : [
      {
        id: "ms-1",
        label: "Trace multi-parent cross-attention vector diagrams",
        completed: false,
        dueDate: "2026-06-25",
      },
      {
        id: "ms-2",
        label: "Inject real-time Scholar preprints for Transformer layers",
        completed: true,
        dueDate: "2026-06-22",
        completedDate: "2026-06-22"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('sq-milestones', JSON.stringify(milestones));
  }, [milestones]);

  const [newMilestoneLabel, setNewMilestoneLabel] = useState('');
  const [newMilestoneDeadline, setNewMilestoneDeadline] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
  });

  const addMilestone = () => {
    const label = newMilestoneLabel.trim();
    if (!label) return;

    const newMs: Milestone = {
      id: `ms-${Date.now()}`,
      label,
      completed: false,
      dueDate: newMilestoneDeadline
    };

    setMilestones(prev => [newMs, ...prev]);
    setNewMilestoneLabel('');
    showToast(`Milestone created: "${label}"`, 'success');
    playAudioChime(700, 'sine');
  };

  const toggleMilestoneComplete = (id: string) => {
    setMilestones(prev => prev.map(m => {
      if (m.id === id) {
        const completed = !m.completed;
        if (completed) {
          // Play complete visual sound and trigger Toast Notification
          playAudioChime(950, 'sine');
          setTimeout(() => playAudioChime(1300, 'triangle'), 100);
          showToast(`Milestone Completed: "${m.label}" 🎉`, 'milestone');
        }
        return {
          ...m,
          completed,
          completedDate: completed ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return m;
    }));
  };

  const removeMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
    showToast("Milestone cleared", "info");
  };

  // Quick prompt suggestions
  const suggestedPrompts = [
    "Detail structural attention layers under [LoRA: Low-Rank Adaptation](#lora-paper-4412)",
    "Synthesize positional parameters within [Attention Is All You Need](#attention-paper-2305)",
    "Explain cross-attention vector alignment models",
    "Identify up-to-date transformer optimizations using real-time search"
  ];

  return (
    <div className="h-screen flex flex-col bg-[#fdfdfd] text-slate-800 dark:bg-[#121214] dark:text-gray-200 transition-colors duration-200 font-sans antialiased overflow-hidden">
      
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl flex items-start gap-3 border transition-all duration-300 transform translate-x-0 animate-in fade-in slide-in-from-top-4 ${
              toast.type === 'milestone'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                : toast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                : 'bg-[#badbe5]/10 dark:bg-cyan-950/30 border-[#badbe5] dark:border-cyan-800 text-cyan-900 dark:text-cyan-200'
            }`}
          >
            <div className="mt-0.5">
              {toast.type === 'milestone' ? (
                <MilestoneIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ) : toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Info className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">
                {toast.type === 'milestone' ? 'Milestone Completed' : toast.type === 'success' ? 'Task Succeeded' : 'System Alert'}
              </span>
              <p className="text-xs font-semibold leading-normal">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-gray-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header Bar */}
      <header id="app-header" className="border-b border-gray-200 dark:border-neutral-800 bg-[#fdfdfd] dark:bg-[#1a1a1f] px-6 py-4 flex items-center justify-between shrink-0 select-none z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#eadce4] dark:bg-purple-950/40 flex items-center justify-center text-purple-950 dark:text-purple-300">
            <BrainCircuit className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-cinzel text-xl tracking-[0.15em] font-extrabold text-slate-900 dark:text-white">STUDYQUERIES</h1>
            <p className="text-[9px] tracking-widest text-slate-400 dark:text-slate-500 font-extrabold uppercase">ONLINE RESEARCH HUB</p>
          </div>
        </div>

        {/* Dynamic Center Navigation */}
        <nav className="flex items-center bg-gray-100 dark:bg-[#121214] p-1 rounded-2xl border border-gray-200/50 dark:border-neutral-800/80">
          <button
            onClick={() => setActivePage('dashboard')}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all ${
              activePage === 'dashboard'
                ? 'bg-white dark:bg-[#1a1a1f] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActivePage('workspace')}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all ${
              activePage === 'workspace'
                ? 'bg-white dark:bg-[#1a1a1f] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <SearchCode className="w-4 h-4" />
            <span>Workspace</span>
          </button>
          <button
            onClick={() => setActivePage('roadmap')}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all ${
              activePage === 'roadmap'
                ? 'bg-white dark:bg-[#1a1a1f] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <MilestoneIcon className="w-4 h-4" />
            <span>Roadmap</span>
          </button>
        </nav>

        {/* API Details and Dark Mode */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center gap-2">
            <input
              type="password"
              placeholder="Gemini API Key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-44 pl-3 pr-8 py-1.5 text-xs rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-purple-400 text-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
            <div className="absolute right-2 top-2">
              <div className={`w-2 h-2 rounded-full ${isLiveAPI ? 'bg-emerald-400 glow-breathing' : 'bg-gray-300 dark:bg-gray-600'}`} />
            </div>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-hidden relative">

        {/* PAGE 1: THE DASHBOARD */}
        {activePage === 'dashboard' && (
          <div className="h-full flex lg:flex-row flex-col animate-in fade-in duration-200">
            {/* Left Workspace Context and file upload */}
            <aside className="w-full lg:w-80 border-r border-gray-200 dark:border-neutral-800 p-6 flex flex-col gap-6 shrink-0 bg-white/40 dark:bg-[#1a1a1f]/30 overflow-y-auto">
              
              {/* Grounding Ingestion */}
              <div>
                <h3 className="font-cinzel text-xs tracking-wider text-slate-400 dark:text-gray-500 mb-3 font-extrabold uppercase">Ingestion Pipeline</h3>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group ${
                    dragOver
                      ? 'border-purple-400 bg-purple-50/20 dark:bg-purple-950/10'
                      : 'border-gray-200 dark:border-neutral-800 hover:border-purple-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                    accept=".pdf,.txt"
                  />
                  <div className="w-10 h-10 rounded-full bg-[#eadce4] dark:bg-purple-950/30 flex items-center justify-center text-purple-900 dark:text-purple-300 group-hover:scale-110 transition-transform duration-200">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-gray-300 mt-1">Upload research documents</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Drag or click (PDF, TXT supported)</p>
                </div>
              </div>

              {/* Workspace Documents */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-cinzel text-xs tracking-wider text-slate-400 dark:text-gray-500 font-extrabold uppercase">Grounded Context</h3>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#badbe5] text-[#1a1a1f] dark:bg-cyan-950 dark:text-cyan-300">
                    {activeWorkspace.length} ACTIVE
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {activeWorkspace.length === 0 ? (
                    <div className="h-40 border border-dashed border-gray-100 dark:border-neutral-800/80 rounded-2xl flex flex-col items-center justify-center text-center p-4">
                      <FileText className="w-8 h-8 text-gray-300 dark:text-neutral-700 mb-2" />
                      <p className="text-xs font-bold text-gray-400">Context is currently empty</p>
                      <p className="text-[10px] text-gray-500 mt-1">Upload files or discover research in workspace tab</p>
                    </div>
                  ) : (
                    activeWorkspace.map(doc => (
                      <div
                        key={doc.id}
                        onClick={() => setActiveDocument(doc)}
                        className={`group p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                          activeDocument?.id === doc.id
                            ? 'border-purple-300 bg-purple-50/30 dark:bg-purple-950/20 dark:border-purple-800'
                            : 'border-gray-100 dark:border-neutral-800 bg-white dark:bg-[#1a1a1f] hover:border-purple-200 dark:hover:border-neutral-800/80'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 flex items-center justify-center shrink-0">
                          <FileText className={`w-4 h-4 ${activeDocument?.id === doc.id ? 'text-purple-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-gray-200 truncate" title={doc.title}>
                            {doc.title}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {doc.authors}
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFromWorkspace(doc.id); }}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all p-1 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>

            {/* Document Viewer and Parameter Analysis */}
            <section className="flex-1 p-6 flex flex-col gap-4 overflow-hidden bg-gray-50/50 dark:bg-black/10">
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <h2 className="font-cinzel text-base tracking-widest font-extrabold text-slate-900 dark:text-white">DOCUMENT CORE VIEWER</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Inspect real-time extracted abstracts and parameter weights.</p>
                </div>
              </div>

              {!activeDocument ? (
                <div className="flex-1 border border-dashed border-gray-200 dark:border-neutral-800 rounded-3xl flex flex-col items-center justify-center p-8 text-center bg-white/20">
                  <div className="w-14 h-14 rounded-2xl bg-[#fddcc5] dark:bg-amber-950/20 flex items-center justify-center text-amber-700 dark:text-amber-400 mb-4">
                    <Layers className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-gray-200">No Interactive Document Layers Active</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1">
                    Upload documents or search online on the workspace tab to load papers into the active viewer.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col border border-gray-200 dark:border-neutral-800 rounded-3xl bg-white dark:bg-[#1a1a1f] overflow-hidden">
                  
                  {/* Toolbar */}
                  <div className="p-4 bg-gray-50/60 dark:bg-neutral-900/60 border-b border-gray-100 dark:border-neutral-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#badbe5]/40 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-900 dark:text-cyan-300 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-cinzel text-xs font-bold text-slate-900 dark:text-white truncate max-w-sm">{activeDocument.title}</h4>
                        <p className="text-[10px] text-slate-400 truncate">{activeDocument.authors}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {activeDocument.url && activeDocument.url !== '#' && (
                        <a
                          href={activeDocument.pdfUrl || activeDocument.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-bold hover:opacity-95 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Real PDF</span>
                        </a>
                      )}
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-[#eadce4] text-purple-950 dark:bg-purple-950/40 dark:text-purple-300">
                        {activeDocument.size}
                      </span>
                    </div>
                  </div>

                  {/* Document abstract text viewer */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-6">
                    <div>
                      <h5 className="text-[10px] font-extrabold tracking-widest text-purple-600 dark:text-purple-400 uppercase mb-2">Academic Dataset Summary</h5>
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800">
                        <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-gray-300 whitespace-pre-wrap">{activeDocument.abstract}</p>
                      </div>
                    </div>

                    {activeDocument.fullText && (
                      <div>
                        <h5 className="text-[10px] font-extrabold tracking-widest text-cyan-600 dark:text-cyan-400 uppercase mb-2">Grounded Extracted Contents</h5>
                        <p className="text-xs leading-relaxed text-slate-600 dark:text-gray-400 whitespace-pre-wrap">{activeDocument.fullText}</p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">ID Ref: <code className="bg-gray-100 dark:bg-neutral-850 px-1 py-0.5 rounded text-purple-600">{activeDocument.id}</code></span>
                      <span className="text-[10px] text-slate-400">Published Date: {activeDocument.date || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* PAGE 2: RESEARCH WORKSPACE */}
        {activePage === 'workspace' && (
          <div className="h-full flex lg:flex-row flex-col animate-in fade-in duration-200">
            
            {/* Left Panel: Research Online Sources */}
            <div className="w-full lg:w-96 border-r border-gray-200 dark:border-neutral-800 p-6 flex flex-col gap-6 shrink-0 bg-white/40 dark:bg-[#1a1a1f]/30 overflow-y-auto">
              
              {/* Search Core and History */}
              <div className="relative" ref={historyRef}>
                <h3 className="font-cinzel text-xs tracking-wider text-slate-400 dark:text-gray-500 mb-3 font-extrabold uppercase">Research Online Sources</h3>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Query papers, preprints, topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setShowHistoryDropdown(true)}
                      onKeyDown={(e) => e.key === 'Enter' && performSearch(searchQuery)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-all text-slate-800 dark:text-gray-100"
                    />
                  </div>

                  {/* Search History Dropdown */}
                  {showHistoryDropdown && searchHistory.length > 0 && (
                    <div className="absolute top-[80px] left-0 right-0 bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-xl z-30 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 dark:border-neutral-800/80 mb-1">
                        <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Recent Queries</span>
                        <button
                          onClick={clearAllHistory}
                          className="text-[9px] font-bold text-red-500 hover:underline cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="max-h-52 overflow-y-auto space-y-0.5">
                        {searchHistory.map((hist, i) => (
                          <div
                            key={i}
                            onClick={() => performSearch(hist)}
                            className="flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer text-slate-700 dark:text-gray-300"
                          >
                            <span className="truncate">{hist}</span>
                            <button
                              onClick={(e) => removeHistoryItem(e, hist)}
                              className="text-gray-400 hover:text-red-500 p-0.5 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => performSearch(searchQuery)}
                    className="w-full mt-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold py-2.5 rounded-xl text-xs hover:opacity-90 transition-all cursor-pointer"
                  >
                    Query arXiv & Online Scholar
                  </button>
                </div>
              </div>

              {/* Academic Data Sets (SearchResults) */}
              <div className="flex-1 flex flex-col min-h-0">
                <h3 className="font-cinzel text-xs tracking-wider text-slate-400 dark:text-gray-500 mb-3 font-extrabold uppercase">academic data sets</h3>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {isSearching ? (
                    <div className="h-40 flex flex-col items-center justify-center text-center">
                      <RefreshCw className="w-7 h-7 text-purple-600 animate-spin mb-2" />
                      <p className="text-xs text-slate-400 font-bold">Harvesting online academic databases...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="h-40 border border-dashed border-gray-100 dark:border-neutral-800/80 rounded-2xl flex flex-col items-center justify-center text-center p-4">
                      <Database className="w-8 h-8 text-gray-300 dark:text-neutral-700 mb-2" />
                      <p className="text-xs font-bold text-gray-400">No active dataset query run</p>
                      <p className="text-[10px] text-slate-500 mt-1">Search topics to discover live research papers</p>
                    </div>
                  ) : (
                    searchResults.map(result => (
                      <div
                        key={result.id}
                        className="p-4 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#1a1a1f] flex flex-col gap-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-[#badbe5] text-[#1a1a1f] dark:bg-cyan-950 dark:text-cyan-300 uppercase">
                            Preprint
                          </span>
                          <span className="text-[10px] text-slate-400">{result.date}</span>
                        </div>
                        <div>
                          <h4 className="font-cinzel text-xs tracking-wide font-bold text-slate-900 dark:text-white leading-normal">
                            {result.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">
                            {result.authors}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-gray-100 dark:border-neutral-800/80 flex items-center justify-between">
                          {activeWorkspace.some(d => d.id === result.id) ? (
                            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Grounded</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => injectIntoWorkspace(result)}
                              className="flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Inject Context</span>
                            </button>
                          )}
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-white inline-flex items-center gap-1"
                          >
                            <span>Link</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Side: AI Synthesis Chatbot with link interception */}
            <section className="flex-1 flex flex-col min-w-0 bg-[#fdfdfd] dark:bg-[#1a1a1f]/20">
              
              {/* Chat Panel Header */}
              <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#badbe5] dark:bg-cyan-950 flex items-center justify-center text-cyan-950 dark:text-cyan-300 shrink-0">
                    <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-sm tracking-wider font-extrabold text-slate-900 dark:text-white">AI SYNTHESIS AGENT</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Academic synthesis powered by arxivLLM.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Web Search Toggle */}
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Real-Time Search</span>
                    <input
                      type="checkbox"
                      checked={useWebSearch}
                      onChange={(e) => setUseWebSearch(e.target.checked)}
                      className="rounded border-gray-300 dark:border-neutral-800 text-purple-600 focus:ring-purple-400"
                    />
                  </label>

                  {/* Context dropdown */}
                  <select
                    value={chatContextMode}
                    onChange={(e) => setChatContextMode(e.target.value)}
                    className="text-xs bg-white dark:bg-[#121214] border border-gray-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 outline-none text-slate-700 dark:text-gray-200 max-w-[150px] truncate"
                  >
                    <option value="all">All Workspace Files</option>
                    {activeWorkspace.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.title}</option>
                    ))}
                  </select>

                  <button
                    onClick={clearChat}
                    className="p-2 rounded-xl border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 hover:text-slate-800 dark:hover:text-white shrink-0 transition-colors"
                    title="Reset dialogue history"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {chatMessages.length === 1 && (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-10">
                    <div className="w-12 h-12 rounded-2xl bg-[#eadce4] dark:bg-purple-950/20 flex items-center justify-center text-purple-800 dark:text-purple-400 mb-4">
                      <BrainCircuit className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-gray-200">Grounded Synthesis Assistant</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                      Ask parameters or compare vectors from your active workspace. Click suggested queries below to automatically paste and trigger grounded analysis.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-5 w-full">
                      {suggestedPrompts.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => { setUserMessage(prompt); }}
                          className="p-3 border border-gray-100 dark:border-neutral-800/85 rounded-xl bg-white dark:bg-[#1a1a1f] text-left text-[10.5px] text-slate-500 hover:text-purple-700 dark:hover:text-purple-400 hover:border-purple-200 dark:hover:border-neutral-700 transition-all leading-relaxed"
                        >
                          {renderMessageContent(prompt)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role !== 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-[#badbe5] dark:bg-cyan-950 flex items-center justify-center text-cyan-900 dark:text-cyan-300 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed flex flex-col gap-3 ${
                        msg.role === 'user'
                          ? 'bg-[#eadce4] dark:bg-purple-950 text-purple-950 dark:text-purple-100 rounded-tr-none'
                          : 'bg-gray-50 dark:bg-neutral-900 text-slate-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-neutral-800/80 shadow-sm'
                      }`}
                    >
                      {renderMessageContent(msg.text)}

                      {/* Web grounding and metadata links */}
                      {(msg.citations || msg.webBadges) && (
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-neutral-800/80 flex flex-col gap-2">
                          <span className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Interactive Sources</span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.citations?.map((c, i) => (
                              <button
                                key={i}
                                onClick={() => handleLocalAnchorClick(c.ref)}
                                className="text-[9px] font-bold px-2 py-1 rounded-lg bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-neutral-800 text-slate-700 dark:text-gray-300 flex items-center gap-1 hover:border-purple-300 dark:hover:border-neutral-700 transition-all cursor-pointer"
                              >
                                <FileText className="w-3 h-3 text-purple-500" />
                                <span>Ref: {c.title?.substring(0, 20)}...</span>
                              </button>
                            ))}
                            {msg.webBadges?.map((badge, i) => (
                              <a
                                key={i}
                                href={badge.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] font-bold px-2 py-1 rounded-lg bg-[#fddcc5] text-amber-950 border border-amber-200 flex items-center gap-1 hover:opacity-95 transition-all"
                              >
                                <ExternalLink className="w-3 h-3 text-amber-700" />
                                <span>{badge.label}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isBotThinking && (
                  <div className="flex gap-3 justify-start items-center">
                    <div className="w-8 h-8 rounded-lg bg-[#badbe5]/40 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-900 dark:text-cyan-300 animate-spin">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] text-slate-400 tracking-wider font-extrabold uppercase animate-pulse">StudyQueries grounding dataset context...</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Bottom Query Entry */}
              <div className="p-4 border-t border-gray-200 dark:border-neutral-800 bg-[#fdfdfd] dark:bg-[#1a1a1f] z-10">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Compare dataset parameters or synthesize concepts..."
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    className="flex-1 px-4 py-3 text-xs rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-purple-400 text-slate-800 dark:text-gray-100"
                  />
                  <button
                    onClick={sendChatMessage}
                    className="p-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-all cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* PAGE 3: RESEARCH ROADMAP */}
        {activePage === 'roadmap' && (
          <div className="h-full flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-200">
            
            {/* Left Interactive Concept Mindmap */}
            <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-neutral-800 flex flex-col gap-4 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-cinzel text-base tracking-widest font-extrabold text-slate-900 dark:text-white">COGNITIVE CONCEPT MAP</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Movable nodes. Click to expand and configure multiple parent-mother mappings.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold px-2 py-1 rounded bg-[#eadce4] text-purple-950 dark:bg-purple-950/40">
                    {mindmapNodes.length} NODES
                  </span>
                </div>
              </div>

              {/* Mindmap Canvas */}
              <div
                ref={mindmapContainerRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="flex-1 relative border border-gray-200 dark:border-neutral-800 rounded-3xl bg-white dark:bg-[#1a1a1f]/30 overflow-hidden min-h-[350px] mindmap-bg select-none"
              >
                {/* SVG Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  {/* Lines between child nodes and their mother parents */}
                  {mindmapNodes.map(node => 
                    node.parents.map(parentId => {
                      const parent = mindmapNodes.find(n => n.id === parentId);
                      if (!parent) return null;
                      return (
                        <g key={`${node.id}-${parentId}`}>
                          <line
                            x1={parent.x}
                            y1={parent.y}
                            x2={node.x}
                            y2={node.y}
                            stroke="#badbe5"
                            strokeWidth="2.5"
                            className="dark:stroke-cyan-950/80 transition-all duration-75"
                          />
                          <line
                            x1={parent.x}
                            y1={parent.y}
                            x2={node.x}
                            y2={node.y}
                            stroke="#eadce4"
                            strokeWidth="1.5"
                            strokeDasharray="4,4"
                            className="dark:stroke-purple-900/60 transition-all duration-75"
                          />
                          {/* Animated link marker */}
                          <circle
                            cx={(parent.x + node.x) / 2}
                            cy={(parent.y + node.y) / 2}
                            r="3"
                            fill="#eadce4"
                            className="animate-ping"
                          />
                        </g>
                      );
                    })
                  )}
                </svg>

                {/* Main Core Center Node (Transformer Nexus) */}
                <div
                  style={{ left: '50%', top: '45%' }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 p-3.5 rounded-2xl bg-[#fddcc5] border border-amber-300 text-center shadow-lg w-44 z-10"
                >
                  <span className="text-[8px] font-extrabold tracking-widest text-amber-900 uppercase">Core Taxonomy</span>
                  <input
                    type="text"
                    value={mindmapCoreHub}
                    onChange={(e) => setMindmapCoreHub(e.target.value)}
                    className="w-full bg-transparent text-center text-xs font-extrabold font-cinzel text-amber-950 focus:outline-none"
                  />
                </div>

                {/* Draggable & Expandable Nodes */}
                {mindmapNodes.map(node => (
                  <div
                    key={node.id}
                    onPointerDown={(e) => handlePointerDown(node.id, e)}
                    style={{ left: `${node.x}px`, top: `${node.y}px` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 p-3 rounded-xl border shadow-md w-40 cursor-grab active:cursor-grabbing select-none z-10 transition-shadow hover:shadow-lg ${
                      selectedNode?.id === node.id
                        ? 'ring-2 ring-purple-400 border-purple-300 bg-purple-50/50 dark:bg-purple-950/40'
                        : node.theme === 'lavender'
                        ? 'border-purple-200 dark:border-purple-900 bg-white dark:bg-[#1a1a1f]'
                        : node.theme === 'mist'
                        ? 'border-cyan-200 dark:border-cyan-900 bg-white dark:bg-[#1a1a1f]'
                        : 'border-amber-200 dark:border-amber-900 bg-white dark:bg-[#1a1a1f]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5 pointer-events-none">
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        node.theme === 'lavender'
                          ? 'bg-[#eadce4] text-purple-950 dark:bg-purple-950 dark:text-purple-300'
                          : node.theme === 'mist'
                          ? 'bg-[#badbe5] text-cyan-950 dark:bg-cyan-950 dark:text-cyan-300'
                          : 'bg-[#fddcc5] text-amber-950 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {node.id.toUpperCase()}
                      </span>
                      <div className="flex gap-1">
                        {node.parents.length > 0 && (
                          <span className="text-[8px] font-bold text-slate-400">({node.parents.length}P)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold truncate text-slate-800 dark:text-gray-200 pointer-events-none flex-1">{node.label}</p>
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setSelectedNode(node)}
                        className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 p-0.5 rounded cursor-pointer"
                        title="Configure details"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Collapsible details preview */}
                    {node.expanded && (
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-2 leading-normal pointer-events-none">{node.description}</p>
                    )}
                  </div>
                ))}

                {/* Spawn new concept bar */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-[#1a1a1f]/95 border border-gray-150 dark:border-neutral-800 p-3 rounded-2xl flex items-center justify-between gap-2 shadow-lg max-w-sm z-20">
                  <input
                    type="text"
                    placeholder="New concept keyword label..."
                    value={newConceptLabel}
                    onChange={(e) => setNewConceptLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && spawnMindmapNode()}
                    className="flex-1 bg-gray-50 dark:bg-[#121214] px-3 py-1.5 text-xs rounded-xl focus:outline-none border border-gray-200 dark:border-neutral-800 text-slate-800 dark:text-gray-100"
                  />
                  <button
                    onClick={spawnMindmapNode}
                    className="px-4 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                  >
                    Spawn
                  </button>
                </div>
              </div>

              {/* Node configurator overlay/editor */}
              {selectedNode && (
                <div className="p-4 border border-gray-200 dark:border-neutral-800 rounded-2xl bg-gray-50 dark:bg-neutral-900 flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-extrabold uppercase text-slate-500">Configure: {selectedNode.id.toUpperCase()}</span>
                    </div>
                    <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-850">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Node fields */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Concept Label</label>
                        <input
                          type="text"
                          value={selectedNode.label}
                          onChange={(e) => setMindmapNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, label: e.target.value } : n))}
                          className="w-full bg-white dark:bg-[#121214] px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-neutral-800 text-slate-800 dark:text-gray-100 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Description / Notes</label>
                        <textarea
                          rows={2}
                          value={selectedNode.description}
                          onChange={(e) => setMindmapNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, description: e.target.value } : n))}
                          className="w-full bg-white dark:bg-[#121214] px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-neutral-800 text-slate-800 dark:text-gray-100 focus:outline-none resize-none"
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">X Coordinates</label>
                          <input
                            type="range"
                            min={20}
                            max={600}
                            value={selectedNode.x}
                            onChange={(e) => setMindmapNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, x: parseInt(e.target.value) } : n))}
                            className="w-full accent-purple-600"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Y Coordinates</label>
                          <input
                            type="range"
                            min={20}
                            max={400}
                            value={selectedNode.y}
                            onChange={(e) => setMindmapNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, y: parseInt(e.target.value) } : n))}
                            className="w-full accent-purple-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Parents & Theme */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Parent Mother Nodes (Multi-Parents)</label>
                        <div className="mt-1 bg-white dark:bg-[#121214] border border-gray-200 dark:border-neutral-800 rounded-xl p-2.5 max-h-28 overflow-y-auto space-y-1.5">
                          {mindmapNodes
                            .filter(n => n.id !== selectedNode.id)
                            .map(potentialParent => {
                              const isChecked = selectedNode.parents.includes(potentialParent.id);
                              return (
                                <label key={potentialParent.id} className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-gray-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      setMindmapNodes(prev => prev.map(n => {
                                        if (n.id === selectedNode.id) {
                                          const nextParents = isChecked
                                            ? n.parents.filter(p => p !== potentialParent.id)
                                            : [...n.parents, potentialParent.id];
                                          // Update temporary selected state too
                                          setSelectedNode(curr => curr ? { ...curr, parents: nextParents } : null);
                                          return { ...n, parents: nextParents };
                                        }
                                        return n;
                                      }));
                                    }}
                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-400"
                                  />
                                  <span>{potentialParent.label}</span>
                                </label>
                              );
                            })}
                          {mindmapNodes.length <= 1 && (
                            <span className="text-[10px] text-slate-400 italic">No other nodes to establish parent linkages</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Color Theme</label>
                          <div className="flex gap-1.5">
                            {['lavender', 'mist', 'peach'].map(themeName => (
                              <button
                                key={themeName}
                                onClick={() => {
                                  setMindmapNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, theme: themeName as any } : n));
                                  setSelectedNode(curr => curr ? { ...curr, theme: themeName as any } : null);
                                }}
                                className={`w-6 h-6 rounded-full border ${
                                  selectedNode.theme === themeName ? 'ring-2 ring-purple-400' : 'border-gray-200'
                                }`}
                                style={{
                                  backgroundColor:
                                    themeName === 'lavender' ? '#eadce4' : themeName === 'mist' ? '#badbe5' : '#fddcc5'
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => removeMindmapNode(selectedNode.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400 text-xs font-bold transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Node</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Focus Time & Milestone Roadmap */}
            <div className="w-full md:w-85 p-6 shrink-0 flex flex-col gap-6 overflow-y-auto bg-white/40 dark:bg-[#1a1a1f]/30 border-l border-gray-200 dark:border-neutral-800">
              
              {/* Focus Time */}
              <div className="p-5 border border-gray-200 dark:border-neutral-800 rounded-3xl bg-white dark:bg-[#1a1a1f] shadow-sm">
                <h3 className="font-cinzel text-xs tracking-wider text-slate-400 dark:text-gray-500 mb-3 font-extrabold text-center uppercase">Focus Time</h3>
                
                {/* Timer Modes */}
                <div className="flex items-center gap-1.5 justify-center mb-4">
                  <button
                    onClick={() => setTimerPreset('pomodoro')}
                    className={`text-[10px] px-3 py-1 rounded-lg font-bold border transition-all ${
                      timerMode === 'pomodoro'
                        ? 'bg-[#eadce4] text-purple-950 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                        : 'bg-gray-50 dark:bg-neutral-900 text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Pomodoro (25m)
                  </button>
                  <button
                    onClick={() => setTimerPreset('custom')}
                    className={`text-[10px] px-3 py-1 rounded-lg font-bold border transition-all ${
                      timerMode === 'custom'
                        ? 'bg-[#badbe5] text-cyan-950 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800'
                        : 'bg-gray-50 dark:bg-neutral-900 text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Custom Timer
                  </button>
                </div>

                {/* Ring Visual Counter */}
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
                      <circle cx="72" cy="72" r="64" stroke="#e5e7eb" strokeWidth="5" fill="transparent" className="dark:stroke-neutral-800" />
                      <circle
                        cx="72"
                        cy="72"
                        r="64"
                        stroke={timerMode === 'pomodoro' ? '#eadce4' : '#badbe5'}
                        strokeWidth="5"
                        fill="transparent"
                        strokeDasharray="402"
                        strokeDashoffset={timerDashoffset}
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="text-center z-10">
                      <span className="font-cinzel text-2xl tracking-widest font-extrabold text-slate-800 dark:text-white">
                        {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
                      </span>
                      <p className="text-[8px] uppercase tracking-widest text-slate-400 mt-1">
                        {timerMode === 'pomodoro' ? 'Standard' : 'Adjustable'} Mode
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customizable inputs */}
                {timerMode === 'custom' && (
                  <div className="p-3 bg-gray-50 dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800/80 rounded-2xl mb-4 space-y-2 animate-in fade-in duration-150">
                    <div className="flex gap-2 items-center text-xs">
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Mins</label>
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={customInputMinutes}
                          onChange={(e) => setCustomInputMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-white dark:bg-[#121214] border border-gray-200 dark:border-neutral-800 text-xs px-2 py-1 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Secs</label>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={customInputSeconds}
                          onChange={(e) => setCustomInputSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                          className="w-full bg-white dark:bg-[#121214] border border-gray-200 dark:border-neutral-800 text-xs px-2 py-1 rounded-lg focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={applyCustomTimerConfig}
                        className="self-end px-3 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-bold transition-all h-[28px]"
                      >
                        Set
                      </button>
                    </div>
                  </div>
                )}

                {/* Controls */}
                <div className="flex items-center gap-3 justify-center mt-2">
                  <button
                    onClick={() => setTimerActive(!timerActive)}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-all cursor-pointer"
                  >
                    {timerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{timerActive ? 'Pause' : 'Start'}</span>
                  </button>
                  <button
                    onClick={resetTimer}
                    className="p-2 rounded-xl border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Milestone Roadmap */}
              <div className="flex-1 flex flex-col min-h-[300px]">
                <h3 className="font-cinzel text-xs tracking-wider text-slate-400 dark:text-gray-500 mb-3 font-extrabold uppercase">Milestone Roadmap</h3>
                
                {/* Milestone list scroll */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-4">
                  {milestones.length === 0 ? (
                    <div className="h-32 border border-dashed border-gray-150 dark:border-neutral-800/80 rounded-2xl flex flex-col items-center justify-center text-center p-4 bg-white/40">
                      <MilestoneIcon className="w-6 h-6 text-gray-300 dark:text-neutral-700 mb-1" />
                      <p className="text-xs text-slate-400">No milestones registered yet</p>
                    </div>
                  ) : (
                    milestones.map(ms => (
                      <div
                        key={ms.id}
                        className={`p-3 rounded-2xl border transition-all flex items-start gap-3 bg-white dark:bg-[#1a1a1f] ${
                          ms.completed
                            ? 'border-emerald-100 dark:border-emerald-900/60 opacity-85'
                            : 'border-gray-100 dark:border-neutral-800'
                        }`}
                      >
                        <button
                          onClick={() => toggleMilestoneComplete(ms.id)}
                          className="mt-0.5 rounded border border-gray-300 dark:border-neutral-700 flex items-center justify-center w-4.5 h-4.5 cursor-pointer text-emerald-500 focus:outline-none"
                        >
                          {ms.completed && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-semibold leading-normal ${
                              ms.completed
                                ? 'line-through text-slate-400 dark:text-gray-500'
                                : 'text-slate-800 dark:text-gray-200'
                            }`}
                          >
                            {ms.label}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-400">
                            <Calendar className="w-3 h-3 text-purple-400" />
                            <span>Deadline: {ms.dueDate || 'N/A'}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeMilestone(ms.id)}
                          className="text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Form to spawn milestones with deadline target */}
                <div className="bg-white dark:bg-[#1a1a1f] border border-gray-100 dark:border-neutral-800/80 p-3.5 rounded-2xl space-y-2.5 shadow-sm">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Task / Goal</label>
                    <input
                      type="text"
                      placeholder="E.g., Map attention weight layers..."
                      value={newMilestoneLabel}
                      onChange={(e) => setNewMilestoneLabel(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#121214] px-3 py-1.5 text-xs rounded-xl focus:outline-none border border-gray-200 dark:border-neutral-800 text-slate-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Target Deadline</label>
                    <input
                      type="date"
                      value={newMilestoneDeadline}
                      onChange={(e) => setNewMilestoneDeadline(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#121214] px-3 py-1.5 text-xs rounded-xl focus:outline-none border border-gray-200 dark:border-neutral-800 text-slate-800 dark:text-gray-100"
                    />
                  </div>
                  <button
                    onClick={addMilestone}
                    className="w-full py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                  >
                    Add Milestone Goal
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
