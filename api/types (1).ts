export interface Document {
  id: string;
  title: string;
  authors: string;
  abstract: string;
  fullText?: string;
  size: string;
  url: string;
  pdfUrl?: string;
  date?: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  citations?: Array<{ ref: string; title?: string }>;
  webBadges?: Array<{ label: string; url: string }>;
  groundingMetadata?: {
    groundingChunks?: GroundingChunk[];
    webSearchQueries?: string[];
  };
}

export interface MindmapNode {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
  theme: 'lavender' | 'mist' | 'peach';
  expanded: boolean;
  parents: string[]; // Mother node IDs
}

export interface Milestone {
  id: string;
  label: string;
  completed: boolean;
  dueDate: string;
  completedDate?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'milestone';
}
