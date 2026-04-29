/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ScrollText, 
  Users, 
  Swords, 
  Compass, 
  ChevronRight, 
  ChevronDown,
  Sparkles, 
  BookOpen, 
  Shield, 
  PenTool,
  History,
  TrendingUp,
  Map as MapIcon,
  X,
  Loader2,
  Plus,
  Trash2,
  Castle,
  Sword,
  Table,
  Flame,
  Camera,
  GripVertical,
  Upload,
  Mic,
  MicOff,
  Gem,
  Video,
  Wand2,
  ImageIcon,
  LayoutDashboard,
  Share2,
  User,
  UserPlus,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  Library,
  Save,
  Check,
  Download,
  WifiOff,
  Lock,
  Settings,
  Info,
  Clock,
  ArrowUp,
  Smartphone,
  RefreshCw,
  Zap,
  List,
  LogOut
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GoogleGenAI } from "@google/genai";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { 
  EPISODES, 
  STORY_ARCS, 
  CHARACTERS, 
  FACTIONS, 
  ARTIFACTS,
  WORLD_LOCATIONS 
} from './constants';
import { 
  Episode, 
  Character, 
  Faction, 
  SceneDetail, 
  Artifact, 
  StoryArc, 
  Weapon,
  WorldLocation 
} from './types';
import { auth, db, loginWithGoogle, logout as firebaseLogout } from './lib/firebase';
import { useAuth } from './context/AuthContext';
import { 
  generateScriptSuggestion, 
  generateSceneDetail, 
  generateVideoPrompt, 
  analyzeLogicConsistency, 
  extractCharacterChanges 
} from './services/geminiService';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  getDoc, 
  getDocs,
  setDoc as fbSetDoc, 
  updateDoc as fbUpdateDoc,
  deleteDoc as fbDeleteDoc,
  writeBatch as fbWriteBatch,
  serverTimestamp,
  or,
  getDocFromServer,
  orderBy,
  limit,
  addDoc as fbAddDoc
} from 'firebase/firestore';
import debounce from 'lodash.debounce';
import { getWuxiaDate } from './utils/wuxiaDate';

// --- Vietnamese Accent Removal Helpers ---
const removeVietnameseTones = (str: string): string => {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  // Some system combine normal characters with combine characters
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // huyền, sắc, ngã, hỏi, nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
  // Remove extra spaces
  str = str.replace(/ + /g, " ");
  str = str.trim();
  // Remove punctuations and special characters
  str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\\/g, " ");
  // Remove continuous spaces created by punctuation removal
  str = str.replace(/ + /g, " ");
  return str.trim();
};

const toSlug = (str: string): string => {
  if (!str) return '';
  return removeVietnameseTones(str)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove everything except alphanumeric, spaces, and hyphens/underscores
    .trim()
    .replace(/\s+/g, '-');
};

const capitalizeName = (name: string): string => {
  if (!name) return "";
  const parts = name.split(' ');
  return parts.map((word, index) => {
    if (word === "" && index === parts.length - 1) return "";
    const w = word.trim();
    if (!w) return "";
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
};

const getAbbreviation = (name: string): string => {
  if (!name) return "";
  return name
    .split(/\s+/)
    .filter(part => part.length > 0)
    .map(part => part[0])
    .join('')
    .toUpperCase();
};

const compressImage = (base64: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      resolve(base64); // Fallback to original if error
    };
  });
};
// ------------------------------------------

function FormattedText({ text, characters, artifacts, factions }: { text: string, characters: any[], artifacts: any[], factions: any[] }) {
  if (!text) return null;

  const processMentions = (input: string) => {
    const list = [...(characters || []), ...(artifacts || []), ...(factions || [])];
    const sortedList = [...list].sort((a, b) => (b?.name?.length || 0) - (a?.name?.length || 0));
    const elements: (string | React.ReactNode)[] = [];
    
    // Refined regex to match @name including Vietnamese characters and spaces
    const mentionRegex = /@([a-zA-Z0-9\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]+)/gi;
    
    let lastIdx = 0;
    let match;
    
    // We want to match against the sorted list names specifically
    // So we iterate through the input and check if any @mention matches a name in our list
    const findMatches = (str: string) => {
      if (!str) return [];
      let resultParts: (string | React.ReactNode)[] = [];
      let currentIdx = 0;
      
      while (currentIdx < str.length) {
        if (str[currentIdx] === '@') {
          // Look ahead to see if any name in our list follows this @
          let foundMatch = false;
          const remainingStr = str.substring(currentIdx + 1);
          
            for (const item of sortedList) {
              if (item?.name && remainingStr.toLowerCase().startsWith(item.name.toLowerCase())) {
                const nameInStr = remainingStr.substring(0, item.name.length);
              resultParts.push(
                <span key={`${currentIdx}-${item.name}`} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gold/20 text-wood border border-gold/30 mx-0.5 text-[0.9em] font-medium align-middle">
                  {(item.avatar || item.flagAvatar) ? (
                    <img src={item.avatar || item.flagAvatar} className="w-4 h-4 rounded-full object-cover border border-gold/50" alt="" />
                  ) : <Users size={10} />}
                  {item.name}
                </span>
              );
              currentIdx += item.name.length + 1;
              foundMatch = true;
              break;
            }
          }
          
          if (!foundMatch) {
            resultParts.push('@');
            currentIdx++;
          }
        } else {
          let nextAt = (str || '').indexOf('@', currentIdx);
          if (nextAt === -1) {
            resultParts.push(str.substring(currentIdx));
            break;
          } else {
            resultParts.push(str.substring(currentIdx, nextAt));
            currentIdx = nextAt;
          }
        }
      }
      return resultParts;
    };

    return findMatches(input);
  };

  const processBold = (input: string | React.ReactNode) => {
    if (typeof input !== 'string') return [input];
    let cleanedInput = input.replace(/#/g, '');
    const quoteRegex = /"(.*?)"/g;
    const elements: (string | React.ReactNode)[] = [];
    let lastIdx = 0;
    let match;
    while ((match = quoteRegex.exec(cleanedInput)) !== null) {
      elements.push(cleanedInput.substring(lastIdx, match.index));
      elements.push(<span key={`quote-${match.index}`} className="font-bold text-wood decoration-cinnabar underline underline-offset-2">"{match[1]}"</span>);
      lastIdx = match.index + match[0].length;
    }
    elements.push(cleanedInput.substring(lastIdx));

    const result: (string | React.ReactNode)[] = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    elements.forEach((part, i) => {
      if (typeof part === 'string') {
        let last = 0;
        let m;
        while ((m = boldRegex.exec(part)) !== null) {
          result.push(part.substring(last, m.index));
          result.push(<span key={`bold-${i}-${m.index}`} className="font-bold text-cinnabar text-xl uppercase tracking-wider block mt-4 mb-2">{m[1]}</span>);
          last = m.index + m[0].length;
        }
        result.push(part.substring(last));
      } else {
        result.push(part);
      }
    });
    return result;
  };

  const processAILabels = (input: string | React.ReactNode) => {
    if (typeof input !== 'string') return [input];
    const labels = ["Bối cảnh", "Hành động", "Góc quay", "Hiệu ứng", "Lời thoại", "Tâm lý", "Nhân vật có mặt", "Danh sách shot quay chi tiết"];
    const elements: (string | React.ReactNode)[] = [];
    
    // Split by lines to process headings
    const lines = input.split('\n');
    lines.forEach((line, idx) => {
      let lineProcessed = false;
      const trimmedLine = line.trim();
      for (const label of labels) {
        if (trimmedLine.toUpperCase().startsWith(label.toUpperCase() + ':')) {
          const colonIdx = (line || '').indexOf(':');
          const content = colonIdx !== -1 ? line.substring(colonIdx + 1) : '';
          elements.push(<div key={`ai-label-${idx}`} className="mt-4 mb-1"><span className="font-black text-ink uppercase tracking-wider">{label.toUpperCase()}</span>:</div>);
          elements.push(<div key={`ai-content-${idx}`} className="text-ink/80 mb-2 leading-relaxed font-bold">{content}</div>);
          lineProcessed = true;
          break;
        }
      }
      if (!lineProcessed) {
        elements.push(line + (idx < lines.length - 1 ? '\n' : ''));
      }
    });

    return elements;
  };

  let result: (string | React.ReactNode)[] = processBold(text);
  let intermediateResult: (string | React.ReactNode)[] = [];
  result.forEach((part, i) => {
    if (typeof part === 'string') {
      const processed = processAILabels(part);
      intermediateResult = [...intermediateResult, ...processed];
    } else {
      intermediateResult.push(part);
    }
  });

  let finalResult: (string | React.ReactNode)[] = [];
  intermediateResult.forEach((part, i) => {
    if (typeof part === 'string') {
      const mentioned = processMentions(part);
      finalResult = [...finalResult, ...mentioned];
    } else {
      finalResult.push(part);
    }
  });

  return <div className="formatted-content font-sans">{finalResult}</div>;
}


const INITIAL_CHAR_STATE: Character = {
  id: '',
  name: '',
  role: '',
  description: '',
  faction: 'Chính phái',
  past: '',
  weapon: '',
  weaponOrigin: '',
  weaponAvatar: '',
  fullBodyImage: '',
  abbreviation: '',
  personality: '',
  attire: '',
  relationships: '',
  martialArtsBeginner: '',
  martialArtsIntermediate: '',
  martialArtsAdvanced: '',
  martialArtsSpecial: '',
  avatar: '',
  status: 'appeared',
  stateTimeline: []
};

export default function App() {
  const [firebaseConnected, setFirebaseConnected] = useState<boolean | null>(null);

  // Firebase Connection Diagnostic
  useEffect(() => {
    async function testConnection() {
      try {
        console.log("Checking Firestore connection...");
        await getDocFromServer(doc(db, 'system', 'health'));
        setFirebaseConnected(true);
        console.log("Firestore connection verified.");
      } catch (error: any) {
        if (error?.message?.includes('the client is offline') || error?.code === 'unavailable') {
          console.warn("Firestore is operating in offline mode. Changes will sync once connection is restored.");
          setFirebaseConnected(false);
        } else {
          console.error("Firestore connectivity error:", error);
          // Even if permission denied, it means we reached the server
          setFirebaseConnected(true);
        }
      }
    }
    testConnection();
  }, []);

  const { user, loading: authLoading, login, loginAsGuest, logout } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
    } catch (e) {
      console.error("Login failed:", e);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // Cache user info for offline identity
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem('ghl_last_user_email', user.email.toLowerCase());
    }
    if (user?.uid) {
      localStorage.setItem('ghl_last_user_uid', user.uid);
    }
  }, [user]);

  const cachedEmail = localStorage.getItem('ghl_last_user_email');
  const cachedUid = localStorage.getItem('ghl_last_user_uid');
  const effectiveEmail = (user?.email?.toLowerCase() || cachedEmail || '').toLowerCase();
  const effectiveUid = user?.uid || cachedUid;

  // Security and Permissions (MOVED UP)
  const currentUserEmail = effectiveEmail;
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [collaboratorRoles, setCollaboratorRoles] = useState<Record<string, 'admin' | 'collaborator' | 'viewer'>>(() => {
    const local = localStorage.getItem(`ghl_project_doc_${new URLSearchParams(window.location.search).get('p') || ''}`);
    if (local) {
      try {
        const data = JSON.parse(local);
        return data.collaboratorRoles || {};
      } catch (e) { return {}; }
    }
    return {};
  });
  const [projectOwnerId, setProjectOwnerId] = useState<string | null>(() => {
    const local = localStorage.getItem(`ghl_project_doc_${new URLSearchParams(window.location.search).get('p') || ''}`);
    if (local) {
      try {
        const data = JSON.parse(local);
        return data.ownerId || null;
      } catch (e) { return null; }
    }
    return null;
  });

  const isProjectOwner = Boolean(effectiveUid && projectOwnerId && effectiveUid === projectOwnerId);

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const urlId = new URLSearchParams(window.location.search).get('p');
    if (urlId) return urlId;
    return localStorage.getItem('ghl_active_project_id');
  });

  const [projectsList, setProjectsList] = useState<any[]>(() => {
    const raw = localStorage.getItem('ghl_projects_list');
    return raw ? JSON.parse(raw) : [];
  });

  // Track active project ID changes

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('ghl_active_project_id', activeProjectId);
      // Update URL without refreshing
      const url = new URL(window.location.href);
      if (url.searchParams.get('p') !== activeProjectId) {
         url.searchParams.set('p', activeProjectId);
         window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activeProjectId]);

  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [quotaResetCountdown, setQuotaResetCountdown] = useState<string>('');

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      // Current date/time in PT
      const ptString = now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"});
      const ptDate = new Date(ptString);
      
      // Next midnight in PT
      const nextMidnightPT = new Date(ptDate);
      nextMidnightPT.setHours(24, 0, 0, 0);
      
      const diffMs = nextMidnightPT.getTime() - ptDate.getTime();
      
      if (diffMs <= 0) {
         setQuotaResetCountdown("00:00:00");
         return;
      }
      
      const h = Math.floor(diffMs / (1000 * 60 * 60)).toString().padStart(2, '0');
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const s = Math.floor((diffMs % (1000 * 60)) / 1000).toString().padStart(2, '0');
      
      setQuotaResetCountdown(`${h}:${m}:${s}`);
    };
    
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [quotaExceeded]);

  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [syncStatus, setSyncStatus] = useState("");
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [syncSuccessType, setSyncSuccessType] = useState<'upload' | 'download'>('upload');

  useEffect(() => {
    const handleOnline = () => setOfflineMode(false);
    const handleOffline = () => setOfflineMode(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isAdmin = Boolean(isProjectOwner || currentUserEmail === 'tanvuongvltkm@gmail.com');
  const _roleInProject = currentUserEmail ? collaboratorRoles[currentUserEmail] : null;
  const userRole = isAdmin ? 'admin' : (_roleInProject ? _roleInProject : (currentUserEmail && collaborators.includes(currentUserEmail) ? 'collaborator' : null));
  
  // Debug logging for permissions
  useEffect(() => {
    if (user) {
      console.log("[Auth Debug] User logged in:", currentUserEmail);
      console.log("[Auth Debug] Is Admin:", isAdmin);
      console.log("[Auth Debug] User Role:", userRole);
      console.log("[Auth Debug] Quota Exceeded:", quotaExceeded);
    }
  }, [user, currentUserEmail, isAdmin, userRole, quotaExceeded]);

  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const isPermissionError = error instanceof Error && (error.message.includes('permission-denied') || error.message.includes('insufficient permissions'));
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isQuota = errorMessage.includes('Quota') || errorMessage.includes('429') || errorMessage.includes('resource-exhausted') || (error as any)?.code === 'resource-exhausted';
    
    if (isQuota) {
      setQuotaExceeded(true);
      alert("Linh khí cạn kiệt! (Firestore Quota Exceeded). Nhiều tính năng sẽ tạm ngưng cho đến khi hồi phục (ngày mai).");
    }

    const errInfo = {
      error: errorMessage,
      operationType,
      path,
      authInfo: {
        userId: user?.uid,
        email: user?.email,
        emailVerified: user?.emailVerified,
        isAnonymous: user?.isAnonymous,
        tenantId: user?.tenantId,
        providerInfo: user?.providerData?.map(p => ({ providerId: p.providerId, email: p.email })) || []
      }
    };
    
    console.error(`[Firestore Error] ${operationType} on ${path}:`, errorMessage);

    if (isPermissionError) {
      throw new Error(JSON.stringify(errInfo));
    }
  };

  const handleFirebaseError = (error: any, contextStr: string) => {
    const errorMessage = error?.message || String(error);
    const isQuota = error?.code === 'resource-exhausted' || errorMessage.includes('Quota') || errorMessage.includes('resource-exhausted');
    
    if (isQuota) {
      setQuotaExceeded(true);
      setConfirmDialog({ message: "Linh khí cạn kiệt! (Firestore Quota Exceeded). Nhiều tính năng sẽ tạm ngưng cho đến khi hồi phục (ngày mai).", onConfirm: () => {} });
    } else {
      console.error(`Lỗi ${contextStr}:`, error);
      setConfirmDialog({ message: `Pháp thuật phản phệ khi ${contextStr}!\n\nĐã có dị số xảy ra trong lúc vận công: ${errorMessage}`, onConfirm: () => {} });
    }
  };

  const handleWuxiaException = (error: any, contextText: string) => {
    const errorMessage = error?.message || String(error);
    const isQuotaError = errorMessage.includes("429") || 
                        errorMessage.includes("Quota") || 
                        errorMessage.includes("RESOURCE_EXHAUSTED") ||
                        error?.code === 'resource-exhausted';

    if (isQuotaError) {
      setQuotaExceeded(true);
      if (errorMessage.includes('firestore')) {
         // Silently handled by state
      } else {
        setConfirmDialog({ message: `Cảnh báo: Chân khí đã cạn kiệt!\n\nThiên Cơ Các (Gemini API) thông báo hạn mức thi triển pháp thuật trong ngày đã tận. Mời đại hiệp nghỉ ngơi tĩnh dưỡng.\n\n(Lỗi: Vượt quá giới hạn Quota)`, onConfirm: () => {} });
      }
    } else {
      setConfirmDialog({ message: `Pháp thuật phản phệ khi ${contextText}!\n\nĐã có dị số xảy ra trong lúc vận công: ${errorMessage}`, onConfirm: () => {} });
    }
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'episodes' | 'side-stories' | 'character-memories' | 'characters' | 'factions' | 'artifacts' | 'weapons' | 'settings' | 'about' | 'updatesLog' | 'world-map'>('dashboard');
  const [storageMode, setStorageMode] = useState<'local' | 'cloud'>(() => {
    return (localStorage.getItem('ghl_storage_mode') as 'local' | 'cloud') || 'local';
  });
  
  // Custom wrappers for Firestore operations for offline capabilities
  const isEffectivelyOffline = offlineMode || quotaExceeded || storageMode === 'local';

  const canEdit = isAdmin || userRole === 'admin' || userRole === 'collaborator' || storageMode === 'local' || isEffectivelyOffline;
  const canDelete = isAdmin || userRole === 'admin' || storageMode === 'local' || isEffectivelyOffline;
  const canEditUI = isAdmin || userRole === 'admin' || storageMode === 'local' || isEffectivelyOffline;
  const canShare = isAdmin || userRole === 'admin' || storageMode === 'local';
  const canView = isAdmin || userRole === 'admin' || userRole === 'collaborator' || userRole === 'viewer' || storageMode === 'local' || isEffectivelyOffline;

  const setDoc = async (ref: any, data: any, options?: any) => {
    if (storageMode === 'local') return Promise.resolve();
    try {
      return await fbSetDoc(ref, data, options);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, ref.path || null);
      return Promise.resolve();
    }
  };
  const updateDoc = async (ref: any, data: any) => {
    if (storageMode === 'local') return Promise.resolve();
    try {
      return await fbUpdateDoc(ref, data);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, ref.path || null);
      return Promise.resolve();
    }
  };
  const deleteDoc = async (ref: any) => {
    if (storageMode === 'local') return Promise.resolve();
    try {
      return await fbDeleteDoc(ref);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.DELETE, ref.path || null);
      return Promise.resolve();
    }
  };
  const addDoc = async (ref: any, data: any) => {
    if (storageMode === 'local') return Promise.resolve({ id: `local-${Date.now()}` } as any);
    try {
      return await fbAddDoc(ref, data);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.CREATE, ref.path || null);
      return Promise.resolve({ id: `offline-${Date.now()}` } as any);
    }
  };

  const writeBatch = () => {
    const batch = fbWriteBatch(db);
    return {
      set: (ref: any, data: any, options?: any) => {
        if (!isEffectivelyOffline) batch.set(ref, data, options);
      },
      update: (ref: any, data: any) => {
        if (!isEffectivelyOffline) batch.update(ref, data);
      },
      delete: (ref: any) => {
        if (!isEffectivelyOffline) batch.delete(ref);
      },
      commit: async () => {
        if (isEffectivelyOffline) return Promise.resolve();
        try {
          return await batch.commit();
        } catch (e: any) {
          if (e?.message?.includes('Quota') || e?.message?.includes('offline') || e?.code === 'unavailable') {
            return Promise.resolve();
          }
          throw e;
        }
      }
    };
  };
  
  // React to storage mode changes
  useEffect(() => {
    localStorage.setItem('ghl_storage_mode', storageMode);
  }, [storageMode]);

  const [aboutContent, setAboutContent] = useState("Chào mừng bằng hữu đã đến với Giang Hồ Lục. Đây là nơi lưu giữ những hồi ức, những câu chuyện về các vị anh hùng, bang phái, và những bí bảo chấn động giang hồ. Hãy cùng nhau viết nên trang sử mới.");
  const [updatesLog, setUpdatesLog] = useState<any[]>([]);

  const fetchUpdatesLog = async (projectId: string) => {
    try {
      const q = query(collection(db, `projects/${projectId}/updates`), orderBy('timestamp', 'desc'), limit(5));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUpdatesLog(data);
      localStorage.setItem(`ghl_updates_log_${projectId}`, JSON.stringify(data));
    } catch (error) {
      console.error("Lỗi tải nhật ký cập nhật (Thử dùng bản địa):", error);
      const local = localStorage.getItem(`ghl_updates_log_${projectId}`);
      if (local) setUpdatesLog(JSON.parse(local));
    }
  };
  const [isEpisodesMenuOpen, setIsEpisodesMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [viewingRelationChar, setViewingRelationChar] = useState<Character | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [videoPrompt, setVideoPrompt] = useState<string | null>(null);
  const [isGeneratingVideoPrompt, setIsGeneratingVideoPrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedArcs, setExpandedArcs] = useState<string[]>([]);
  const [expandedEpisodeId, setExpandedEpisodeId] = useState<number | null>(null);
  const [editingEpisodeId, setEditingEpisodeId] = useState<number | null>(null);
  const [editingEpisodeTitle, setEditingEpisodeTitle] = useState('');
  const [editingArcId, setEditingArcId] = useState<string | null>(null);
  const [editingArcTitle, setEditingArcTitle] = useState('');
  const [editingPoint, setEditingPoint] = useState<{epId: number, idx: number, text: string} | null>(null);
  const [editingLogicWarningId, setEditingLogicWarningId] = useState<number | null>(null);
  const [logicWarningText, setLogicWarningText] = useState('');
  const [expandedPointIdx, setExpandedPointIdx] = useState<number | null>(null);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [characterSearchQuery, setCharacterSearchQuery] = useState('');
  const [isGeneratingVideoPromptForScene, setIsGeneratingVideoPromptForScene] = useState<Record<string, boolean>>({});
  const [editingSceneId, setEditingSceneId] = useState<{epId: number, point: string} | null>(null);
  const [editingSceneContent, setEditingSceneContent] = useState('');
  const [fullScreenScene, setFullScreenScene] = useState<{ep: Episode, point: string, scene: SceneDetail} | null>(null);
  
  // Mentions State
  const [mentionSuggestions, setMentionSuggestions] = useState<{name: string, avatar: string, type: string}[]>([]);
  const [mentionPosition, setMentionPosition] = useState<{top: number, left: number} | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [activeMentionInput, setActiveMentionInput] = useState<{epId: number, point: string} | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'admin' | 'collaborator' | 'viewer'>('collaborator');
  const [isSharing, setIsSharing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const lastProjectSyncRef = React.useRef<any>(null);
  const lastUISyncRef = React.useRef<any>(null);
  const [syncPercentage, setSyncPercentage] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncPopup, setShowSyncPopup] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(localStorage.getItem('ghl_last_synced'));

  const handleUpload = async () => {
    await handleManualSync();
  };

  const [hasServerUpdate, setHasServerUpdate] = useState(false);

  const checkServerUpdate = async () => {
    if (!activeProjectId || !navigator.onLine || storageMode !== 'cloud') return;
    
    // Do not show update if we just pulled within last 6 hours (21600000 ms)
    const lastPullStr = localStorage.getItem(`ghl_last_synced_pull_${activeProjectId}`);
    if (lastPullStr && Date.now() - parseInt(lastPullStr) < 21600000) {
      setHasServerUpdate(false);
      return;
    }

    try {
      const projectDoc = await getDoc(doc(db, 'projects', activeProjectId));
      if (projectDoc.exists()) {
        const serverData = projectDoc.data();
        const localLastSynced = localStorage.getItem('ghl_last_synced');
        if (serverData.lastUpdate && (!localLastSynced || serverData.lastUpdate > new Date(localLastSynced).getTime())) {
          setHasServerUpdate(true);
        } else {
          setHasServerUpdate(false);
        }
      }
    } catch (e) {
      console.error("Check server update error:", e);
    }
  };

  const handleDownload = async () => {
    await handleSyncPull();
  };

  useEffect(() => {
    if (activeProjectId) {
      checkServerUpdate();
      const interval = setInterval(checkServerUpdate, 300000); // Check every 5 mins
      return () => clearInterval(interval);
    }
  }, [activeProjectId]);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const CURRENT_VERSION = "1.0.3";

  // Logic for view-only/collaboration mode
  const [initialProjectsLoaded, setInitialProjectsLoaded] = useState(false);
  const [initialProjectLoaded, setInitialProjectLoaded] = useState(false);
  const isAccessDenied = user && !isAdmin && !userRole && activeProjectId && initialProjectLoaded;
  const [draggedPositions, setDraggedPositions] = useState<Record<string, {x: number, y: number}>>({});
  const [showNoAccessModal, setShowNoAccessModal] = useState(false);
  const [showReadOnlyModal, setShowReadOnlyModal] = useState(false);
  const [hasShownReadOnlyNotice, setHasShownReadOnlyNotice] = useState(false);

  useEffect(() => {
    if (!authLoading && user && !user.isAnonymous && !canEdit && !hasShownReadOnlyNotice && activeProjectId) {
      setShowReadOnlyModal(true);
      setHasShownReadOnlyNotice(true);
    }
  }, [user, canEdit, authLoading, hasShownReadOnlyNotice, activeProjectId]);

  const withCollaboration = (data: any) => ({
    ...data,
    ownerId: projectOwnerId || effectiveUid,
    collaborators: collaborators || [],
    collaboratorRoles: collaboratorRoles || {},
    lastModifiedBy: effectiveEmail || 'Anonymous',
    lastModifiedAt: Date.now()
  });

  // Side Stories & Character Memories
  const [sideStories, setSideStories] = useState<Episode[]>([]);
  const [characterMemories, setCharacterMemories] = useState<Episode[]>([]);
  const [expandedExtraType, setExpandedExtraType] = useState<'side' | 'memory' | null>(null);

  // Movie Title State
  const [movieTitle, setMovieTitle] = useState('Giang Hồ Lục');
  const [sidebarBgImage, setSidebarBgImage] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Character Tab Title State
  const [tabTitles, setTabTitles] = useState<Record<string, string>>({
    dashboard: 'Tổng Quan',
    episodes: 'Diễn Biến Cảnh Phim',
    'side-stories': 'Ngoại Truyện',
    'character-memories': 'Ký Ức Nhân Vật',
    characters: 'Hệ Thống Nhân Vật',
    factions: 'Thế Lực Bang Phái',
    'world-map': 'Thất Đại Thành Thị',
    artifacts: 'Giang Hồ Bí Bảo',
    weapons: 'Thần Binh Lợi Khí',
    settings: 'Thiết Lập Sở Hành',
    about: 'Giang Hồ Lục Ký',
    updatesLog: 'Môn Phái Ký'
  });
  const [tabIcons, setTabIcons] = useState<Record<string, string>>({});
  const [statIcons, setStatIcons] = useState<Record<string, string>>({});
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);

  // Characters & Factions State
  const [characters, setCharacters] = useState<Character[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [worldLocations, setWorldLocations] = useState<WorldLocation[]>(WORLD_LOCATIONS);
  const [arcs, setArcs] = useState<StoryArc[]>([]);

  // AUTO-SAVE to Local Storage (Offline capabilities)
  useEffect(() => {
    if (activeProjectId) {
      const stateMap: Record<string, any> = {
        characters,
        factions,
        artifacts,
        weapons,
        episodes,
        arcs,
        side_stories: sideStories,
        character_memories: characterMemories,
        world_locations: worldLocations,
        project_doc: { 
          title: movieTitle, 
          aboutContent, 
          collaborators, 
          collaboratorRoles, 
          ownerId: projectOwnerId 
        },
        ui_config: {
          tabIcons,
          tabTitles,
          appLogo,
          sidebarBgImage
        }
      };
      Object.entries(stateMap).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          localStorage.setItem(`ghl_${key}_${activeProjectId}`, JSON.stringify(val));
        }
      });
    }
  }, [characters, factions, artifacts, weapons, episodes, arcs, sideStories, characterMemories, activeProjectId, movieTitle, aboutContent, collaborators, collaboratorRoles, projectOwnerId, tabIcons, tabTitles, appLogo, sidebarBgImage]);

  // INITIAL LOAD from Local Storage
  useEffect(() => {
    if (activeProjectId) {
      setInitialProjectLoaded(false);
      const loadMap: Record<string, any> = {
        characters: setCharacters,
        factions: setFactions,
        artifacts: setArtifacts,
        weapons: setWeapons,
        episodes: setEpisodes,
        arcs: setArcs,
        side_stories: setSideStories,
        character_memories: setCharacterMemories,
        world_locations: setWorldLocations
      };

      Object.entries(loadMap).forEach(([key, setter]) => {
        const local = localStorage.getItem(`ghl_${key}_${activeProjectId}`);
        if (local) {
          try { setter(JSON.parse(local)); } catch (e) { console.error(e); }
        }
      });

      // Load project doc & UI config specifically
      const cachedDoc = localStorage.getItem(`ghl_project_doc_${activeProjectId}`);
      if (cachedDoc) {
        try {
          const data = JSON.parse(cachedDoc);
          setMovieTitle(data.title || 'Giang Hồ Lục');
          setAboutContent(data.aboutContent || "");
          setCollaborators(data.collaborators || []);
          setCollaboratorRoles(data.collaboratorRoles || {});
          setProjectOwnerId(data.ownerId || null);
        } catch (e) { console.error(e); }
      }

      const cachedUI = localStorage.getItem(`ghl_ui_config_${activeProjectId}`);
      if (cachedUI) {
        try {
          const data = JSON.parse(cachedUI);
          if (data.tabIcons) setTabIcons(data.tabIcons);
          if (data.tabTitles) setTabTitles(data.tabTitles);
          if (data.appLogo) setAppLogo(data.appLogo);
          if (data.sidebarBgImage) setSidebarBgImage(data.sidebarBgImage);
        } catch (e) { console.error(e); }
      }
    }
  }, [activeProjectId]);
  useEffect(() => {
    if (activeProjectId && (movieTitle !== 'Giang Hồ Lục' || aboutContent)) {
      localStorage.setItem(`ghl_project_doc_${activeProjectId}`, JSON.stringify({
        title: movieTitle,
        aboutContent: aboutContent,
        collaborators: collaborators,
        collaboratorRoles: collaboratorRoles,
        ownerId: projectOwnerId,
        worldLocations: worldLocations
      }));
    }
  }, [movieTitle, aboutContent, collaborators, collaboratorRoles, projectOwnerId, activeProjectId]);
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem(`ghl_ui_config_${activeProjectId}`, JSON.stringify({
        tabIcons,
        tabTitles,
        appLogo,
        sidebarBgImage
      }));
    }
  }, [tabIcons, tabTitles, appLogo, sidebarBgImage, activeProjectId]);

  useEffect(() => {
    // Update Checker Logic
    const checkForUpdates = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`);
        const data = await response.json();
        if (data.version && data.version !== CURRENT_VERSION) {
          setShowUpdateNotification(true);
          // Auto update after 5 seconds to give user time to see notice
          setTimeout(() => {
            window.location.reload();
          }, 5000);
        }
      } catch (e) {
        console.warn("Không thể kiểm tra mật tịch mới:", e);
      }
    };

    checkForUpdates();
    const updateInterval = setInterval(checkForUpdates, 300000); // 5 mins
    return () => clearInterval(updateInterval);
  }, []);

  // Sync active project data if activeProjectId exists (allows public viewing)
  const fetchProjectData = async () => {
    if (!activeProjectId) return;
    try {
        const snapshot = await getDoc(doc(db, 'projects', activeProjectId));                
        setInitialProjectLoaded(true);
        if (snapshot.exists()) {
            const projectData = { id: snapshot.id, ...snapshot.data() } as any;
            lastProjectSyncRef.current = projectData;
            
            setMovieTitle(prev => prev !== projectData.title ? (projectData.title || 'Giang Hồ Lục') : prev);
            if (projectData.aboutContent) setAboutContent(projectData.aboutContent);
            if (projectData.worldLocations) setWorldLocations(projectData.worldLocations);
            setCollaborators(projectData.collaborators || []);
            setCollaboratorRoles(projectData.collaboratorRoles || {});
            setProjectOwnerId(projectData.ownerId);                
            localStorage.setItem(`ghl_project_doc_${activeProjectId}`, JSON.stringify(projectData));
        }
    } catch (e: any) {
        setInitialProjectLoaded(true);
        handleFirebaseError(e, "tải dữ liệu dự án");
    }
  };

  useEffect(() => {
      fetchProjectData();
  }, [activeProjectId]);

  // Sync isProjectOwner separately since user might load after project data
  // (isProjectOwner is now a derived boolean)

  // Use ref to track active project ID for the projects listener to avoid redundant re-subscriptions
  const activeProjectIdRef = useRef(activeProjectId);
  useEffect(() => {
    activeProjectIdRef.current = activeProjectId;
  }, [activeProjectId]);

  // Sync User's projects
  const fetchProjects = async () => {
    // Try to load from local first for immediate UI responsiveness
    const cachedProjects = localStorage.getItem(`ghl_projects_list`);
    let finalProjects: any[] = [];
    if (cachedProjects) {
        try {
            finalProjects = JSON.parse(cachedProjects);
        } catch (e) {}
    }

    // Remove auto-select from cache to allow user to choose a project
    if (!activeProjectId && storageMode === 'local' && finalProjects.length === 0) {
      // Create a default local project if none exists in local mode
      const defaultId = 'local-master';
      const defaultProject = { id: defaultId, title: 'Hồ Sơ Bản Địa', ownerId: effectiveUid || 'local-hero' };
      finalProjects = [defaultProject];
      localStorage.setItem(`ghl_projects_list`, JSON.stringify(finalProjects));
      setProjectsList(finalProjects);
      setActiveProjectId(defaultId);
    } else {
      setProjectsList(finalProjects);
    }

    if (!user || storageMode !== 'cloud') {
      setInitialProjectsLoaded(true);
      return;
    }

    try {
        const q1 = query(collection(db, 'projects'), where('ownerId', '==', user.uid));
        const q2 = query(collection(db, 'projects'), where('collaborators', 'array-contains', user.email?.toLowerCase() || ''));
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        
        setInitialProjectsLoaded(true);
        const docsMap = new Map();
        snap1.docs.forEach(d => docsMap.set(d.id, { id: d.id, ...d.data() } as any));
        snap2.docs.forEach(d => docsMap.set(d.id, { id: d.id, ...d.data() } as any));
        const docs = Array.from(docsMap.values());
        
        const validDocs = [];
        for (const pd of docs) {
          if (pd.title === 'Giang Hồ Mới') {
             try { await deleteDoc(doc(db, 'projects', pd.id)); } catch (e) {}
          } else {
             validDocs.push(pd);
          }
        }
        
        localStorage.setItem(`ghl_projects_list`, JSON.stringify(validDocs));
        setProjectsList(validDocs);
        
        // Auto-select to skip project selection list (always select the first or only project)
        if (validDocs.length > 0) {
            if (validDocs[0].id !== activeProjectId) {
                setActiveProjectId(validDocs[0].id);
            }
        } else {
            // Fallback just in case they really have no project
            const newId = `project-${Date.now()}`;
            const newProject = {
               title: 'Giang Hồ Lục',
               ownerId: user.uid,
               ownerEmail: user.email,
               collaborators: [],
               collaboratorRoles: {},
               updatedAt: new Date().toISOString()
            };
            try { 
                await setDoc(doc(db, 'projects', newId), newProject); 
                setActiveProjectId(newId);
                setProjectsList([{id: newId, ...newProject}]);
            } catch (e) {
                console.error("Failed to init remote doc", e);
            }
        }
    } catch (error: any) {
        setInitialProjectsLoaded(true);
        const isOffline = error?.message?.includes('offline') || error?.code === 'unavailable';
        if (!isOffline) {
          handleFirebaseError(error, "tải danh sách dự án (Thử dùng bản địa)");
        }
    }
  };

  useEffect(() => {
      fetchProjects();
  }, [user]);

  // UI Assets Listener
  useEffect(() => {
    fetchUIConfigData();
  }, [activeProjectId]);

  // UI Assets Loader
  const fetchUIConfigData = async (force = false) => {
    if (!activeProjectId || (storageMode !== 'cloud' && !force)) return;
    try {
      const p = getDoc(doc(db, `projects/${activeProjectId}/config`, 'ui'));
      const snapshot = await Promise.race([
          p,
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout tải ui')), 5000))
      ]);
      if (snapshot.exists()) {
        const data = snapshot.data();
        lastUISyncRef.current = data;
        if (data.tabIcons) setTabIcons(data.tabIcons);
        if (data.tabTitles) setTabTitles(data.tabTitles);
        if (data.appLogo) setAppLogo(data.appLogo);
        if (data.sidebarBgImage) setSidebarBgImage(data.sidebarBgImage);
        localStorage.setItem(`ghl_ui_config_${activeProjectId}`, JSON.stringify(data));
      }
    } catch (error: any) {
      if (error?.message?.includes('Timeout')) {
        console.warn("UI tải chậm, tự động dùng bản địa:", error);
      } else {
        handleFirebaseError(error, "tải cấu hình UI (Thử dùng bản địa)");
      }
      // Fallback
      const cachedUI = localStorage.getItem(`ghl_ui_config_${activeProjectId}`);
      if (cachedUI) {
        try {
          const data = JSON.parse(cachedUI);
          if (data.tabIcons) setTabIcons(data.tabIcons);
          if (data.tabTitles) setTabTitles(data.tabTitles);
          if (data.appLogo) setAppLogo(data.appLogo);
          if (data.sidebarBgImage) setSidebarBgImage(data.sidebarBgImage);
        } catch (e) { console.error(e); }
      }
    }
  };

  const fetchProjectDocData = async (force = false) => {
    if (!activeProjectId || (storageMode !== 'cloud' && !force)) return;
    try {
      const p = getDoc(doc(db, 'projects', activeProjectId));
      const snapshot = await Promise.race([
          p,
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout tải dự án')), 5000))
      ]);
      if (snapshot.exists()) {
        const projectData = { id: snapshot.id, ...snapshot.data() } as any;
        lastProjectSyncRef.current = projectData;
        setMovieTitle(prev => prev !== projectData.title ? (projectData.title || 'Giang Hồ Lục') : prev);
        if (projectData.aboutContent) setAboutContent(projectData.aboutContent);

        const localDocRaw = localStorage.getItem(`ghl_project_doc_${activeProjectId}`);
        let localWorldLocations = null;
        if (!force && localDocRaw) {
          try {
            const data = JSON.parse(localDocRaw);
            if (data.worldLocations && data.worldLocations.length > 0) localWorldLocations = data.worldLocations;
          } catch (e) {}
        }
        
        if (localWorldLocations) {
            setWorldLocations(localWorldLocations);
        } else if (projectData.worldLocations) {
            setWorldLocations(projectData.worldLocations);
        }

        setCollaborators(projectData.collaborators || []);
        setCollaboratorRoles(projectData.collaboratorRoles || {});
        setProjectOwnerId(projectData.ownerId);
        localStorage.setItem(`ghl_project_doc_${activeProjectId}`, JSON.stringify(projectData));
      }
    } catch (error: any) {
      if (error?.message?.includes('Timeout')) {
        console.warn("Tải dự án chậm, tự động dùng bản địa:", error);
      } else {
        console.error("Lỗi tải dữ liệu dự án (Thử dùng bản địa):", error);
      }
      // Fallback
      const cachedDoc = localStorage.getItem(`ghl_project_doc_${activeProjectId}`);
      if (cachedDoc) {
        try {
          const data = JSON.parse(cachedDoc);
          setMovieTitle(data.title || 'Giang Hồ Lục');
          setAboutContent(data.aboutContent || "");
          setCollaborators(data.collaborators || []);
          setCollaboratorRoles(data.collaboratorRoles || {});
          setProjectOwnerId(data.ownerId || null);
        } catch (e) { console.error(e); }
      }
    }
  };

  // Essential Data Loader
  const fetchEssentialData = async (force = false) => {
    console.log("DEBUG: activeProjectId", activeProjectId);
    if (!activeProjectId || (storageMode !== 'cloud' && !force)) return;
    
    // Sync Episodes
    try {
      await fetchUpdatesLog(activeProjectId);
      const epSnapshot = await getDocs(query(collection(db, `projects/${activeProjectId}/episodes`)));
      const data = epSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as unknown as Episode));
      const mainEps = data.filter(e => e.arc !== 'NGOẠI TRUYỆN' && e.arc !== 'KÝ ỨC').sort((a, b) => a.id - b.id);
      const sideEps = data.filter(e => e.arc === 'NGOẠI TRUYỆN').sort((a, b) => a.id - b.id);
      const memoryEps = data.filter(e => e.arc === 'KÝ ỨC').sort((a, b) => a.id - b.id);
      
      setEpisodes(mainEps);
      setSideStories(sideEps);
      setCharacterMemories(memoryEps);
      
      localStorage.setItem(`ghl_episodes_${activeProjectId}`, JSON.stringify(mainEps));
      localStorage.setItem(`ghl_side_stories_${activeProjectId}`, JSON.stringify(sideEps));
      localStorage.setItem(`ghl_character_memories_${activeProjectId}`, JSON.stringify(memoryEps));
    } catch (error) {
      console.error("Lỗi tải tập phim (Thử dùng bản địa):", error);
      handleFirebaseError(error, "tải tập phim");
      // Fallback
      const localEps = localStorage.getItem(`ghl_episodes_${activeProjectId}`);
      if (localEps) setEpisodes(JSON.parse(localEps));
      const localSides = localStorage.getItem(`ghl_side_stories_${activeProjectId}`);
      if (localSides) setSideStories(JSON.parse(localSides));
      const localMemories = localStorage.getItem(`ghl_character_memories_${activeProjectId}`);
      if (localMemories) setCharacterMemories(JSON.parse(localMemories));
    }

    // Sync Characters
    try {
      const localCharsRaw = localStorage.getItem(`ghl_characters_${activeProjectId}`);
      let shouldFetchChars = true;
      if (!force && localCharsRaw) {
        const localChars = JSON.parse(localCharsRaw);
        if (localChars && localChars.length > 0) {
          setCharacters(localChars.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
          shouldFetchChars = false;
        }
      }

      if (shouldFetchChars) {
        const charSnapshot = await getDocs(query(collection(db, `projects/${activeProjectId}/characters`)));
        const data = charSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as unknown as Character));
        setCharacters(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
        localStorage.setItem(`ghl_characters_${activeProjectId}`, JSON.stringify(data));
      }
    } catch (error) {
      console.error("Lỗi tải nhân vật (Thử dùng bản địa):", error);
      handleFirebaseError(error, "tải nhân vật");
      // Fallback
      const local = localStorage.getItem(`ghl_characters_${activeProjectId}`);
      if (local) setCharacters(JSON.parse(local));
    }
  };

  const fetchSecondaryData = async (force = false) => {
    if (!activeProjectId || (storageMode !== 'cloud' && !force)) return;

    // Fetch all secondary data regardless of tab to simplify logic, 
    // or keep tab-based logic. Let's keep it robust as requested by user.
    const collections = ['arcs', 'factions', 'artifacts', 'weapons'];

    for (const colName of collections) {
      try {
        const localDataRaw = localStorage.getItem(`ghl_${colName}_${activeProjectId}`);
        if (!force && localDataRaw) {
          const localData = JSON.parse(localDataRaw);
          if (localData && localData.length > 0) {
            if (colName === 'arcs') setArcs(localData.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
            if (colName === 'factions') setFactions(localData.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
            if (colName === 'artifacts') setArtifacts(localData);
            if (colName === 'weapons') setWeapons(localData);
            continue; // Skip the cloud fetch to save quota
          }
        }
        
        const snapshot = await getDocs(query(collection(db, `projects/${activeProjectId}/${colName}`)));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        if (colName === 'arcs') setArcs(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
        if (colName === 'factions') setFactions(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
        if (colName === 'artifacts') setArtifacts(data);
        if (colName === 'weapons') setWeapons(data);
        localStorage.setItem(`ghl_${colName}_${activeProjectId}`, JSON.stringify(data));
      } catch (error) {
        console.error(`Lỗi tải ${colName} (Thử dùng bản địa):`, error);
        handleFirebaseError(error, `tải ${colName}`);
        // Fallback
        const local = localStorage.getItem(`ghl_${colName}_${activeProjectId}`);
        if (local) {
          const data = JSON.parse(local);
          if (colName === 'arcs') setArcs(data);
          if (colName === 'factions') setFactions(data);
          if (colName === 'artifacts') setArtifacts(data);
          if (colName === 'weapons') setWeapons(data);
        }
      }
    }
  };

  const hasLoadedRef = useRef(false);

  const handleManualSync = async () => {
    if (!activeProjectId || storageMode !== 'cloud' || !user) {
      alert("Hảo hán chưa đăng nhập hoặc chưa mở Thiên Thư (Vân Đoan), không thể Truyền Công!");
      return;
    }
    
    setIsSyncing(true);
    setSyncPercentage(0);
    setSyncStatus("Khởi tạo Truyền Công Đại Pháp...");
    console.log("Starting manual sync...");

    const withTimeout = <T,>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) => setTimeout(() => {
                const err = new Error(errorMessage);
                (err as any).isTimeout = true;
                (err as any).code = 'resource-exhausted';
                reject(err);
            }, ms))
        ]);
    };

    try {
        setSyncStatus("Đang thiết lập môn phái...");
        const projectListRaw = localStorage.getItem('ghl_projects_list');
        const projectList = JSON.parse(projectListRaw || '[]');
        const projectListDoc = projectList.find((p: any) => p.id === activeProjectId);

        const projectRef = doc(db, 'projects', activeProjectId);
        const remoteSnap = await withTimeout(getDoc(projectRef), 15000, "Timeout khi tải cấu hình môn phái (Quota hoặc Mất kết nối)");
        const remoteData = remoteSnap.exists() ? remoteSnap.data() : null;

        const cachedDocRaw = localStorage.getItem(`ghl_project_doc_${activeProjectId}`);
        let localData = cachedDocRaw ? JSON.parse(cachedDocRaw) : (projectListDoc || null);

        if (localData) {
            // Chép đè chớp nhoáng (force local overwrite)
            const resolver = (local: any, _remote: any) => local;

            const winningData = resolver(localData, remoteData);
            let shouldUpdate = false;
            
            if (!remoteData) {
                shouldUpdate = true;
            } else if (winningData === localData) {
                const cleanLocal = { ...localData };
                const cleanRemote = { ...remoteData };
                ['updatedAt', 'lastModifiedBy', 'projectId', 'ownerId', 'lastUpdate', 'updatedBy'].forEach(k => {
                    delete cleanLocal[k];
                    delete cleanRemote[k];
                });
                if (JSON.stringify(cleanLocal) !== JSON.stringify(cleanRemote)) {
                    shouldUpdate = true;
                }
            }

            if (shouldUpdate) {
                await withTimeout(fbSetDoc(projectRef, {
                    ...winningData,
                    updatedAt: serverTimestamp(),
                    lastUpdate: Date.now(),
                    ownerId: winningData.ownerId || user.uid,
                    collaborators: winningData.collaborators || [],
                    updatedBy: user.email || 'Hảo hán'
                }, { merge: true }), 35000, "Timeout khi lưu môn phái");
            }
        }

        const collectionsToSync = [
            { key: 'ghl_episodes', path: 'episodes' },
            { key: 'ghl_side_stories', path: 'episodes' }, 
            { key: 'ghl_character_memories', path: 'episodes' },
            { key: 'ghl_characters', path: 'characters' },
            { key: 'ghl_arcs', path: 'arcs' },
            { key: 'ghl_factions', path: 'factions' },
            { key: 'ghl_artifacts', path: 'artifacts' },
            { key: 'ghl_weapons', path: 'weapons' }
        ];

        let completed = 0;
        const total = collectionsToSync.length + 1; // +1 for project doc

        // Chép đè chớp nhoáng: luôn ưu tiên local khi Truyền Công
        const resolver = (local: any, _remote: any) => local;
        
        let batch = fbWriteBatch(db);
        let docsInBatch = 0;
        
        console.log(`Starting loop over ${collectionsToSync.length} collections`);
        for (const col of collectionsToSync) {
            setSyncStatus(`Đang thẩm định và truyền thụ: ${col.path}...`);
            console.log(`Syncing collection: ${col.path}`);
            const localDataStr = localStorage.getItem(`${col.key}_${activeProjectId}`);
            if (localDataStr) {
                const localItems = JSON.parse(localDataStr);
                console.log(`Collection ${col.path} has ${localItems.length} items`);
                
                // --- NEW OPTIMIZED LOGIC ---
                // Fetch all existing documents in this collection once
                const existingCollectionRef = collection(db, `projects/${activeProjectId}/${col.path}`);
                const querySnapshot = await withTimeout(getDocs(existingCollectionRef), 15000, `Timeout khi tải dữ liệu ${col.path} (Quota/Mất kết nối)`);
                const remoteDocs: Record<string, any> = {};
                querySnapshot.forEach((doc) => {
                    remoteDocs[doc.id] = doc.data();
                });
                
                for (const item of localItems) {
                    const id = item.id;
                    if (!id) continue;
                    
                    const remoteData = remoteDocs[id] || null;
                    const winningData = resolver(item, remoteData);
                    
                    // Only update if fundamentally different or if remote doesn't exist
                    let shouldUpdate = false;
                    if (!remoteData) {
                        shouldUpdate = true;
                    } else if (winningData === item) {
                        const cleanLocal = { ...item };
                        const cleanRemote = { ...remoteData };
                        ['updatedAt', 'lastModifiedBy', 'projectId', 'ownerId', 'lastUpdate'].forEach(k => {
                            delete cleanLocal[k];
                            delete cleanRemote[k];
                        });
                        if (JSON.stringify(cleanLocal) !== JSON.stringify(cleanRemote)) {
                            shouldUpdate = true;
                        }
                    }

                    if (shouldUpdate) {
                        const ref = doc(db, `projects/${activeProjectId}/${col.path}`, id);
                        batch.set(ref, { 
                            ...winningData, 
                            updatedAt: serverTimestamp(),
                            projectId: activeProjectId,
                            ownerId: user.uid,
                            lastModifiedBy: user.email || 'Vô Danh Hảo Hán'
                        }, { merge: true });
                        docsInBatch++;
                    }
                    
                    // Firestore batches have a limit of 500 operations, but large documents can cause payload size issues or timeouts
                    if (docsInBatch >= 2) {
                        try {
                            await withTimeout(batch.commit(), 90000, `Timeout khi ghi nhận ${docsInBatch} tài liệu (Quota/Network)`);
                        } catch (batchErr: any) {
                            console.error("Batch commit failed with " + docsInBatch + " docs", batchErr);
                            throw batchErr;
                        }
                        batch = fbWriteBatch(db);
                        docsInBatch = 0;
                    }
                }
                // --- END OPTIMIZED LOGIC ---
            }
            completed++;
            setSyncPercentage(Math.floor((completed / total) * 100));
        } 

        if (docsInBatch > 0) {
            try {
                await withTimeout(batch.commit(), 90000, `Timeout khi ghi nhận ${docsInBatch} tài liệu cuối (Quota/Network)`);
            } catch (batchErr: any) {
                console.error("Final batch commit failed with " + docsInBatch + " docs", batchErr);
                throw batchErr;
            }
        } 

        setSyncPercentage(100);
        setSyncStatus("Truyền Công Hoàn Tất!");
        
        setTimeout(() => {
            setIsSyncing(false);
            setSyncSuccessType('upload');
            setShowSyncSuccess(true);
            fetchEssentialData(true);
            fetchSecondaryData(true);
        }, 1000);
    } catch (e: any) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        if (errorMessage.includes("Timeout")) {
            console.warn("SYNC TIMEOUT:", errorMessage);
        } else {
            console.error("DEBUG SYNC ERROR:", e); // Enhanced debugging
        }
        
        const isQuotaError = errorMessage.includes("Quota") || errorMessage.includes("resource-exhausted") || e?.code === 'resource-exhausted';
        const stackTrace = e instanceof Error ? e.stack : "";
        let parsedErr = errorMessage.substring(0, 300);
        try {
            if (errorMessage.startsWith('{')) {
               const obj = JSON.parse(errorMessage);
               parsedErr = `Lỗi: ${obj.error} tại ${obj.path} (${obj.operationType})`;
            } else if (errorMessage.includes('{')) {
               const match = errorMessage.match(/(\{.*\})/);
               if (match) {
                 const obj = JSON.parse(match[1]);
                 parsedErr = `Lỗi: ${obj.error} tại ${obj.path} (${obj.operationType})`;
               }
            }
        } catch(e) {}

        if (isQuotaError) {
            setStorageMode('local');
            setConfirmDialog({ message: "Linh khí cạn kiệt (Quota Limit)! Đã ngắt kết nối (chuyển sang Lưu Bản Địa). Thiên Cơ Các đề nghị đại hiệp nghỉ ngơi tĩnh dưỡng và quay lại vào ngày mai.", onConfirm: () => {} });
        } else if (errorMessage.includes("permission-denied") || errorMessage.includes("insufficient permissions")) {
            setConfirmDialog({ message: `Truyền Công Lỗi: Không đủ quyền (Permission Denied)!\nChi tiết: ${parsedErr}`, onConfirm: () => {} });
        } else if (errorMessage.includes("offline") || errorMessage.includes("unavailable") || !navigator.onLine || errorMessage.includes("Timeout")) {
            setConfirmDialog({ message: `Mất kết nối tiên giới (${errorMessage.includes("Timeout") ? 'Kết nối chậm' : 'ngoại tuyến'})! Hệ thống đã chuyển sang chế độ tự vận công (Lưu bản địa).`, onConfirm: () => {} });
            setStorageMode('local');
        } else {
            setConfirmDialog({ message: "Truyền Công bị cản trở! Khí mạch Thiên Thư bị xung đột:\n" + parsedErr + "\n\nStack:\n" + (stackTrace || "").substring(0, 200), onConfirm: () => {} });
        }
        setIsSyncing(false);
        setSyncPercentage(0);
        setSyncStatus("Pháp thuật phản phệ!");
    }
  };

  const handleSyncPull = async () => {
    if (!activeProjectId || storageMode !== 'cloud' || !user) {
      setConfirmDialog({ message: "Kinh mạch chưa thông (chưa đăng nhập hoặc chưa mở Vân Đoan), không thể Nhận Truyền Công!", onConfirm: () => {} });
      return;
    }

    setConfirmDialog({
        message: "Hảo hán có chắc chắn muốn Nhận Truyền Công? Dữ liệu bản địa sẽ được dung hợp với Thiên Thư, giữ lại bản đầy đủ nhất.",
        onConfirm: async () => {
            setIsSyncing(true);
            setSyncPercentage(0);
            setSyncStatus("Đang thỉnh kinh từ Thiên Thư...");

            const withTimeout = <T,>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
                return Promise.race([
                    promise,
                    new Promise<T>((_, reject) => setTimeout(() => {
                        const err = new Error(errorMessage);
                        (err as any).isTimeout = true;
                        (err as any).code = 'resource-exhausted';
                        reject(err);
                    }, ms))
                ]);
            };

            try {
                const collectionsToSync = [
                    { path: 'episodes', localKeys: ['ghl_episodes', 'ghl_side_stories', 'ghl_character_memories'] },
                    { path: 'characters', localKeys: ['ghl_characters'] },
                    { path: 'arcs', localKeys: ['ghl_arcs'] },
                    { path: 'factions', localKeys: ['ghl_factions'] },
                    { path: 'artifacts', localKeys: ['ghl_artifacts'] },
                    { path: 'weapons', localKeys: ['ghl_weapons'] }
                ];

                let completed = 0;
                const total = collectionsToSync.length + 2; // +1 for project doc, +1 for UI config

                const resolver = (local: any, remote: any) => {
                    if (!local) return remote;
                    if (!remote) return local;
                    // Chuẩn hóa: Luôn ưu tiên dữ liệu local (thiết bị trước) để không bị đè mất update hình ảnh/text
                    return local;
                };

                for (const colConfig of collectionsToSync) {
                    setSyncStatus(`Đang tiếp nhận bí kiếp: ${colConfig.path}...`);
                    const q = query(collection(db, `projects/${activeProjectId}/${colConfig.path}`));
                    const snap = await withTimeout(getDocs(q), 15000, `Timeout tải ${colConfig.path} (Quota/Mạng yếu)`);
                    const remoteItems = snap.docs.map(d => ({ ...d.data(), id: d.id }));
                    
                    if (colConfig.path === 'episodes') {
                        // Special handling for episodes split by arc
                        const remoteEpisodes = remoteItems as unknown as Episode[];
                        
                        const processLocalKey = (key: string, filterFn: (e: Episode) => boolean) => {
                            const localDataStr = localStorage.getItem(`${key}_${activeProjectId}`);
                            const localItems = (localDataStr ? JSON.parse(localDataStr) : []) as Episode[];
                            const remoteItemsForThisKey = remoteEpisodes.filter(filterFn);
                            
                            const finalItems = [...remoteItemsForThisKey];
                            localItems.forEach(lItem => {
                                const idx = finalItems.findIndex(rItem => rItem.id === lItem.id);
                                if (idx === -1) {
                                    finalItems.push(lItem);
                                } else {
                                    finalItems[idx] = resolver(lItem, finalItems[idx]);
                                }
                            });
                            localStorage.setItem(`${key}_${activeProjectId}`, JSON.stringify(finalItems));
                        };

                        processLocalKey('ghl_episodes', (e) => e.arc !== 'NGOẠI TRUYỆN' && e.arc !== 'KÝ ỨC');
                        processLocalKey('ghl_side_stories', (e) => e.arc === 'NGOẠI TRUYỆN');
                        processLocalKey('ghl_character_memories', (e) => e.arc === 'KÝ ỨC');

                    } else {
                        const key = colConfig.localKeys[0];
                        const localDataStr = localStorage.getItem(`${key}_${activeProjectId}`);
                        const localItems = localDataStr ? JSON.parse(localDataStr) : [];
                        
                        const finalItems = [...remoteItems];
                        localItems.forEach((lItem: any) => {
                            const idx = finalItems.findIndex(rItem => rItem.id === lItem.id);
                            if (idx === -1) {
                                finalItems.push(lItem);
                            } else {
                                finalItems[idx] = resolver(lItem, finalItems[idx]);
                            }
                        });

                        localStorage.setItem(`${key}_${activeProjectId}`, JSON.stringify(finalItems));
                    }
                    
                    completed++;
                    setSyncPercentage(Math.floor((completed / total) * 100));
                }

                // Project Doc
                setSyncStatus("Đang dung hợp thông tin Môn Phái...");
                await fetchProjectDocData(true);
                completed++;
                setSyncPercentage(Math.floor((completed / total) * 100));

                // UI Config
                setSyncStatus("Đang tiếp nhận Cấu hình UI...");
                await fetchUIConfigData(true);
                completed++;
                setSyncPercentage(100);
                setSyncStatus("Nhận Truyền Công Hoàn Tất!");
                
                localStorage.setItem(`ghl_last_synced_pull_${activeProjectId}`, Date.now().toString());
                setHasServerUpdate(false);

                setTimeout(() => {
                    setIsSyncing(false);
                    setSyncSuccessType('download');
                    setShowSyncSuccess(true);
                    fetchEssentialData(true);
                    fetchSecondaryData(true);
                }, 1500);
            } catch (e: any) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                const isQuotaError = errorMessage.includes("Quota") || errorMessage.includes("resource-exhausted") || e?.code === 'resource-exhausted';
                if (isQuotaError) {
                    setStorageMode('local');
                    setConfirmDialog({ message: "Linh khí cạn kiệt (Quota Limit)! Đã ngắt kết nối vân đoan. Vui lòng quay lại vào ngày mai.", onConfirm: () => {} });
                } else {
                    setConfirmDialog({ message: "Lỗi khi Nhận Truyền Công: " + (errorMessage || "Kinh mạch bị đứt đoạn"), onConfirm: () => {} });
                }
                setIsSyncing(false);
                setSyncPercentage(0);
                setSyncStatus("Tẩu hỏa nhập ma!");
            }
        }
    });
  };

  useEffect(() => {
	  if (Capacitor.getPlatform() !== 'web') {
		  GoogleAuth.initialize();
	  }
  }, []);
  
  useEffect(() => {
    if (activeProjectId) {
        hasLoadedRef.current = false;
        fetchProjectDocData(); // Will respect storageMode
        fetchUIConfigData();  // Will respect storageMode
    }
  }, [activeProjectId]);

  useEffect(() => {
      if (user && activeProjectId && !hasLoadedRef.current && storageMode === 'cloud') {
          hasLoadedRef.current = true;
          
          const lastAutoSync = localStorage.getItem(`ghl_last_auto_sync_${activeProjectId}`);
          const isFresh = lastAutoSync && (Date.now() - parseInt(lastAutoSync) < 1000 * 60 * 120); // 120 minutes
          
          if (!isFresh) {
            console.log("Dữ liệu tự động tải từ mây...");
            Promise.all([fetchEssentialData(), fetchSecondaryData()])
              .then(() => {
                localStorage.setItem(`ghl_last_auto_sync_${activeProjectId}`, Date.now().toString());
              });
          } else {
            console.log("Sử dụng cache cục bộ để tiết kiệm Quota trong lúc Dev. Bấm 'Nhận Truyền Công' để bắt buộc đồng bộ.");
          }
      }
  }, [user, activeProjectId, storageMode]);

  useEffect(() => {
    // Initial Load - Check local storage first
    if (!activeProjectId) return;
    
    // Load from local storage
    const loadFromLocal = (key: string, setter: (data: any) => void) => {
        const local = localStorage.getItem(`${key}_${activeProjectId}`);
        if (local) {
            try {
                setter(JSON.parse(local));
            } catch (e) { console.error(e); }
        }
    };
    
    loadFromLocal('ghl_episodes', setEpisodes);
    loadFromLocal('ghl_side_stories', setSideStories);
    loadFromLocal('ghl_character_memories', setCharacterMemories);
    loadFromLocal('ghl_characters', setCharacters);
    loadFromLocal('ghl_arcs', setArcs);
    loadFromLocal('ghl_factions', setFactions);
    loadFromLocal('ghl_artifacts', setArtifacts);
    loadFromLocal('ghl_weapons', setWeapons);
    loadFromLocal('ghl_project_doc', (projectData) => {
        setMovieTitle(prev => prev !== projectData.title ? (projectData.title || 'Giang Hồ Lục') : prev);
        if (projectData.aboutContent) setAboutContent(projectData.aboutContent);
        setCollaborators(projectData.collaborators || []);
        setCollaboratorRoles(projectData.collaboratorRoles || {});
        setProjectOwnerId(projectData.ownerId);
    });
    loadFromLocal('ghl_ui_config', (data) => {
        if (data.tabIcons) setTabIcons(data.tabIcons);
        if (data.tabTitles) setTabTitles(data.tabTitles);
        if (data.appLogo) setAppLogo(data.appLogo);
        if (data.sidebarBgImage) setSidebarBgImage(data.sidebarBgImage);
    });

  }, [activeProjectId]);

  // AUTO-SYNC TO LOCAL STORAGE for Offline Robustness
  useEffect(() => {
    if (activeProjectId) localStorage.setItem(`ghl_episodes_${activeProjectId}`, JSON.stringify(episodes));
  }, [episodes, activeProjectId]);

  useEffect(() => {
    if (activeProjectId) localStorage.setItem(`ghl_side_stories_${activeProjectId}`, JSON.stringify(sideStories));
  }, [sideStories, activeProjectId]);

  useEffect(() => {
    if (activeProjectId) localStorage.setItem(`ghl_character_memories_${activeProjectId}`, JSON.stringify(characterMemories));
  }, [characterMemories, activeProjectId]);

  useEffect(() => {
    if (activeProjectId) localStorage.setItem(`ghl_characters_${activeProjectId}`, JSON.stringify(characters));
  }, [characters, activeProjectId]);

  useEffect(() => {
    if (activeProjectId) localStorage.setItem(`ghl_arcs_${activeProjectId}`, JSON.stringify(arcs));
  }, [arcs, activeProjectId]);

  useEffect(() => {
    if (activeProjectId) localStorage.setItem(`ghl_factions_${activeProjectId}`, JSON.stringify(factions));
  }, [factions, activeProjectId]);

  useEffect(() => {
    if (activeProjectId) localStorage.setItem(`ghl_artifacts_${activeProjectId}`, JSON.stringify(artifacts));
  }, [artifacts, activeProjectId]);

  useEffect(() => {
    if (activeProjectId) localStorage.setItem(`ghl_weapons_${activeProjectId}`, JSON.stringify(weapons));
  }, [weapons, activeProjectId]);

  useEffect(() => {
    if (activeProjectId) {
      const data = {
        title: movieTitle,
        aboutContent: aboutContent,
        collaborators: collaborators,
        collaboratorRoles: collaboratorRoles,
        ownerId: projectOwnerId
      };
      localStorage.setItem(`ghl_project_doc_${activeProjectId}`, JSON.stringify(data));
    }
  }, [movieTitle, aboutContent, collaborators, collaboratorRoles, projectOwnerId, activeProjectId]);

  useEffect(() => {
    if (activeProjectId) {
      const data = {
        tabIcons,
        tabTitles,
        appLogo,
        sidebarBgImage
      };
      localStorage.setItem(`ghl_ui_config_${activeProjectId}`, JSON.stringify(data));
    }
  }, [tabIcons, tabTitles, appLogo, sidebarBgImage, activeProjectId]);


   const migrateFromLocal = async () => {
    if (!user || !activeProjectId) return;
    if (!isProjectOwner) {
      alert("Chỉ chủ sở hữu mới có quyền chuyển gia dữ liệu vào đồ án này.");
      return;
    }
    
    setIsMigrating(true);
    setSyncPercentage(0);
    try {
      const batch = fbWriteBatch(db);
      let migrationCount = 0;
      
      const localEpsRaw = JSON.parse(localStorage.getItem(`ghl_episodes_${activeProjectId}`) || '[]');
      const localSideStoriesRaw = JSON.parse(localStorage.getItem(`ghl_side_stories_${activeProjectId}`) || '[]');
      const localMemoriesRaw = JSON.parse(localStorage.getItem(`ghl_character_memories_${activeProjectId}`) || '[]');
      const sourceEps = localEpsRaw.length > 0 || localSideStoriesRaw.length > 0 || localMemoriesRaw.length > 0 ? [...localEpsRaw, ...localSideStoriesRaw, ...localMemoriesRaw] : [...episodes, ...sideStories, ...characterMemories];

      const localChars = JSON.parse(localStorage.getItem(`ghl_characters_${activeProjectId}`) || '[]');
      const sourceChars = localChars.length > 0 ? localChars : characters;
      const localArcs = JSON.parse(localStorage.getItem(`ghl_arcs_${activeProjectId}`) || '[]');
      const sourceArcs = localArcs.length > 0 ? localArcs : arcs;
      const localFactions = JSON.parse(localStorage.getItem(`ghl_factions_${activeProjectId}`) || '[]');
      const sourceFactions = localFactions.length > 0 ? localFactions : factions;
      const localArtifacts = JSON.parse(localStorage.getItem(`ghl_artifacts_${activeProjectId}`) || '[]');
      const sourceArtifacts = localArtifacts.length > 0 ? localArtifacts : artifacts;
      const localWeapons = JSON.parse(localStorage.getItem(`ghl_weapons_${activeProjectId}`) || '[]');
      const sourceWeapons = localWeapons.length > 0 ? localWeapons : weapons;

      const totalItems = sourceEps.length + sourceChars.length + sourceArcs.length + sourceFactions.length + sourceArtifacts.length + sourceWeapons.length + 2;
      let processedItems = 0;

      // Sync Project Doc
      const localProjectDoc = JSON.parse(localStorage.getItem(`ghl_project_doc_${activeProjectId}`) || '{}');
      if (Object.keys(localProjectDoc).length > 0) {
        const ref = doc(db, 'projects', activeProjectId);
        batch.set(ref, localProjectDoc, { merge: true });
        migrationCount++;
      }
      processedItems++;
      setSyncPercentage(Math.round((processedItems / totalItems) * 100));

      // Sync UI Config
      const localUIConfig = JSON.parse(localStorage.getItem(`ghl_ui_config_${activeProjectId}`) || '{}');
      if (Object.keys(localUIConfig).length > 0) {
        const ref = doc(db, `projects/${activeProjectId}/config`, 'ui');
        batch.set(ref, localUIConfig, { merge: true });
        migrationCount++;
      }
      processedItems++;
      setSyncPercentage(Math.round((processedItems / totalItems) * 100));

      if (sourceEps.length > 0) {
        sourceEps.forEach((ep: Episode) => {
          const idStr = String(ep.id);
          const docId = idStr.startsWith('ep-') || idStr.startsWith('side-') || idStr.startsWith('memory-') ? idStr : (ep.arc === 'NGOẠI TRUYỆN' ? `side-${idStr}` : ep.arc === 'KÝ ỨC' ? `memory-${idStr}` : `ep-${idStr}`);
          const ref = doc(db, `projects/${activeProjectId}/episodes`, docId);
          batch.set(ref, withCollaboration({ ...ep, projectId: activeProjectId }));
          migrationCount++;
          processedItems++;
          setSyncPercentage(Math.round((processedItems / totalItems) * 100));
        });
      }

      if (sourceChars.length > 0) {
        sourceChars.forEach((c: Character) => {
          const ref = doc(db, `projects/${activeProjectId}/characters`, toSlug(c.name));
          batch.set(ref, withCollaboration({ ...c, projectId: activeProjectId }));
          migrationCount++;
          processedItems++;
          setSyncPercentage(Math.round((processedItems / totalItems) * 100));
        });
      }

      if (sourceArcs.length > 0) {
        sourceArcs.forEach((arc: StoryArc) => {
          const ref = doc(db, `projects/${activeProjectId}/arcs`, arc.id);
          batch.set(ref, withCollaboration({ ...arc, projectId: activeProjectId }));
          migrationCount++;
          processedItems++;
          setSyncPercentage(Math.round((processedItems / totalItems) * 100));
        });
      }

      if (sourceFactions.length > 0) {
        sourceFactions.forEach((fac: Faction) => {
          const ref = doc(db, `projects/${activeProjectId}/factions`, toSlug(fac.name));
          batch.set(ref, withCollaboration({ ...fac, projectId: activeProjectId }));
          migrationCount++;
          processedItems++;
          setSyncPercentage(Math.round((processedItems / totalItems) * 100));
        });
      }

      if (sourceArtifacts.length > 0) {
        sourceArtifacts.forEach((art: Artifact) => {
          const ref = doc(db, `projects/${activeProjectId}/artifacts`, toSlug(art.name));
          batch.set(ref, withCollaboration({ ...art, projectId: activeProjectId }));
          migrationCount++;
          processedItems++;
          setSyncPercentage(Math.round((processedItems / totalItems) * 100));
        });
      }

      if (sourceWeapons.length > 0) {
        sourceWeapons.forEach((wep: Weapon) => {
          const ref = doc(db, `projects/${activeProjectId}/weapons`, toSlug(wep.name));
          batch.set(ref, withCollaboration({ ...wep, projectId: activeProjectId }));
          migrationCount++;
          processedItems++;
          setSyncPercentage(Math.round((processedItems / totalItems) * 100));
        });
      }

      if (migrationCount === 0) {
        alert("Không tìm thấy dữ liệu để đồng bộ. Hãy đảm bảo bạn đã nhập dữ liệu trước khi thực hiện.");
      } else {
        await batch.commit();
        const now = new Date();
        // Format to GMT+7 (assuming local time is configured or just offset)
        const gmt7Time = now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        setLastSyncedTime(gmt7Time);
        alert(`Truyền Công thành công ${migrationCount} hạng mục dữ liệu!`);
      }
    } catch (e: any) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      const isQuotaError = errorMessage.includes("Quota") || errorMessage.includes("resource-exhausted") || e?.code === 'resource-exhausted';
      if (isQuotaError || errorMessage.includes("permission-denied")) {
        alert("Linh khí cạn kiệt (Quota Limit)! Thiên Cơ Các đề nghị đại hiệp nghỉ ngơi tĩnh dưỡng và quay lại vào ngày mai.");
      } else {
        alert(`Gặp lỗi khi đồng bộ dữ liệu: ${errorMessage}`);
      }
    } finally {
      setIsMigrating(false);
      setSyncPercentage(0);
    }
  };

  // Remove local storage effect hooks
  useEffect(() => {
    // Empty to suppress errors/warnings while I clean up
  }, []);

  // Forms State
  const [showAddChar, setShowAddChar] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState(getWuxiaDate());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimeStr(getWuxiaDate()), 60000);
    return () => clearInterval(timer);
  }, []);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [editingCharIdx, setEditingCharIdx] = useState<number | null>(null);
  const [showAddFaction, setShowAddFaction] = useState(false);
  const [showFactionMemberModal, setShowFactionMemberModal] = useState<{factionName: string, memberIdx?: number} | null>(null);
  const [newFactionMember, setNewFactionMember] = useState<{name: string, role: string, parentId?: string, row?: number}>({name: '', role: '', parentId: '', row: 1});
  const [showAddArtifact, setShowAddArtifact] = useState(false);
  const [editingArtifactIdx, setEditingArtifactIdx] = useState<number | null>(null);
  const [newArtifact, setNewArtifact] = useState<Artifact>({ id: '', name: '', origin: '', effect: '', avatar: '', abbreviation: '' });
  const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);
  const [conceptRefImage, setConceptRefImage] = useState<string>('');
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState<Record<string, boolean>>({});
  
  const [showAddWeapon, setShowAddWeapon] = useState(false);
  const [editingWeaponIdx, setEditingWeaponIdx] = useState<number | null>(null);
  const [newWeapon, setNewWeapon] = useState<Weapon>({ id: '', name: '', origin: '', effect: '', avatar: '', owner: '', abbreviation: '' });
  const [newChar, setNewChar] = useState<Character>(INITIAL_CHAR_STATE);
  const [newFaction, setNewFaction] = useState<Faction>({ 
    id: '',
    name: '', 
    description: '', 
    alignment: 'Chính phái', 
    flagAvatar: '', 
    leader: '',
    abbreviation: '',
    members: []
  });

  // Global Abbreviation Map for Text Expansion
  const abbreviationMap = useMemo(() => {
    const map: Record<string, string> = {};
    characters.forEach(c => { if (c.abbreviation) map[c.abbreviation.toLowerCase()] = c.name; });
    factions.forEach(f => { if (f.abbreviation) map[f.abbreviation.toLowerCase()] = f.name; });
    artifacts.forEach(a => { if (a.abbreviation) map[a.abbreviation.toLowerCase()] = a.name; });
    return map;
  }, [characters, factions, artifacts]);

  const applyAbbreviations = (text: string) => {
    let newText = text;
    Object.keys(abbreviationMap).forEach(abbr => {
      const regex = new RegExp(`@${abbr}\\b`, 'gi');
      newText = newText.replace(regex, abbreviationMap[abbr]);
    });
    return newText;
  };
  const [editingFactionIdx, setEditingFactionIdx] = useState<number | null>(null);

  const debouncedUpdateProject = useMemo(
    () => debounce((id: string, data: any) => {
      if (!id) return;
      updateDoc(doc(db, 'projects', id), {
        ...data,
        updatedAt: new Date().toISOString()
      }).catch(e => {
        console.error("Error updating project basic info:", e);
      });
    }, 2000),
    []
  );

  const debouncedUpdateProjectUI = useMemo(
    () => debounce((id: string, data: any) => {
      if (!id) return;
      setDoc(doc(db, `projects/${id}/config`, 'ui'), data, { merge: true })
        .catch(e => console.error("Error updating project UI assets:", e));
    }, 2000),
    []
  );

  useEffect(() => {
    if (!activeProjectId || !isProjectOwner || !lastProjectSyncRef.current) return;

    const changes: any = {};
    const uiChanges: any = {};
    const sync = lastProjectSyncRef.current;
    const uiSync = lastUISyncRef.current || {};

    if ((sync.title || 'Giang Hồ Lục') !== movieTitle) {
      changes.title = movieTitle;
    }
    
    if (sidebarBgImage && sidebarBgImage !== (uiSync.sidebarBgImage || null)) {
      uiChanges.sidebarBgImage = sidebarBgImage;
    }
    if (appLogo && appLogo !== (uiSync.appLogo || null)) {
      uiChanges.appLogo = appLogo;
    }
    if (Object.keys(tabIcons).length > 0 && JSON.stringify(tabIcons) !== JSON.stringify(uiSync.tabIcons || {})) {
      uiChanges.tabIcons = tabIcons;
    }
    if (JSON.stringify(tabTitles) !== JSON.stringify(uiSync.tabTitles || {})) {
      uiChanges.tabTitles = tabTitles;
    }

    if (Object.keys(changes).length > 0) {
      debouncedUpdateProject(activeProjectId, changes);
    }
    if (Object.keys(uiChanges).length > 0) {
      debouncedUpdateProjectUI(activeProjectId, uiChanges);
    }
  }, [movieTitle, sidebarBgImage, tabIcons, tabTitles, appLogo, isProjectOwner, activeProjectId, debouncedUpdateProject, debouncedUpdateProjectUI]);

  const handleLogout = async () => {
    setActiveProjectId(null);
    localStorage.removeItem('ghl_active_project_id');
    await logout();
    window.location.replace('/');
  };

  const stats = useMemo(() => {
    const allEpisodes = [...episodes, ...sideStories, ...characterMemories];
    const detailedCount = allEpisodes.filter(ep => ep.scenes && ep.scenes.length > 0).length;
    const latestDetailedEp = [...episodes].reverse().find(ep => ep.scenes && ep.scenes.length > 0);
    const latestPlot = (latestDetailedEp?.summary && latestDetailedEp.summary.length > 0) 
      ? latestDetailedEp.summary[latestDetailedEp.summary.length - 1] 
      : "Bắt đầu khởi tạo giang hồ...";

    return {
      totalEpisodes: 134,
      draftedEpisodes: allEpisodes.length,
      detailedEpisodes: detailedCount,
      latestPlot,
      totalCharacters: characters.length,
      appearedCharacters: characters.filter(c => c.status === 'appeared').length,
      upcomingCharacters: characters.filter(c => c.status === 'upcoming').length,
      discoveredArtifacts: artifacts.length, 
      factions: factions.length,
      arcs: arcs.length,
      progress: Math.round((detailedCount / 134) * 100)
    };
  }, [characters, factions, episodes, arcs, artifacts, sideStories, characterMemories]);

  const updateProject = async (data: any) => {
    if (!activeProjectId) return;
    try {
      await updateDoc(doc(db, 'projects', activeProjectId), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error(e);
    }
  };

  const [viewingWeapon, setViewingWeapon] = useState<boolean>(false);
  const [viewingFaction, setViewingFaction] = useState<Faction | null>(null);
  const [viewingLocation, setViewingLocation] = useState<WorldLocation | null>(null);
  const [isEditingFactionDiagram, setIsEditingFactionDiagram] = useState(false);

  useEffect(() => {
    if (viewingFaction) {
      const updated = factions.find(f => f.id === viewingFaction.id || f.name === viewingFaction.name);
      if (updated) {
        setViewingFaction(updated);
      }
    }
  }, [factions]);

  // Cleanup orphan faction members (characters that were deleted)
  useEffect(() => {
    if (!canEdit || characters.length === 0 || factions.length === 0 || !activeProjectId) return;
    
    const charNames = new Set(characters.map(c => c.name));
    let hasOrphans = false;
    
    for (const f of factions) {
      if (f.members?.some((m: any) => !charNames.has(m.name))) {
        hasOrphans = true;
        break;
      }
    }

    if (hasOrphans) {
      const cleanedFactions = factions.map(f => ({
        ...f,
        members: (f.members || []).filter((m: any) => charNames.has(m.name))
      }));
      setFactions(cleanedFactions);
      localStorage.setItem(`ghl_factions_${activeProjectId}`, JSON.stringify(cleanedFactions));
      if (viewingFaction) {
        const updatedViewing = cleanedFactions.find(f => f.id === viewingFaction.id || f.name === viewingFaction.name);
        if (updatedViewing) setViewingFaction(updatedViewing);
      }
    }
  }, [characters, factions, activeProjectId, canEdit, viewingFaction]);

  const [isGeneratingFlag, setIsGeneratingFlag] = useState(false);

  const [showAddArcModal, setShowAddArcModal] = useState(false);
  const [newArcTitle, setNewArcTitle] = useState('');

  const [showAddEpisodeModal, setShowAddEpisodeModal] = useState<string | null>(null);
  const [showAddSideStoryModal, setShowAddSideStoryModal] = useState(false);
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [newEpisodePayload, setNewEpisodePayload] = useState({ title: '', content: '', characterName: '' });
  const [isGeneratingEpisode, setIsGeneratingEpisode] = useState(false);
  const [isAnalyzingLogic, setIsAnalyzingLogic] = useState<number | null>(null);
  const [isExtractingChanges, setIsExtractingChanges] = useState<number | null>(null);
  const [isImportingDocx, setIsImportingDocx] = useState<number | null>(null);

  const handleAIAnalyzeLogic = async (ep: Episode) => {
    if (!canEdit) return;
    setIsAnalyzingLogic(ep.id);
    const allContext = [...episodes, ...sideStories, ...characterMemories];
    try {
      const result = await analyzeLogicConsistency(allContext, ep, characters);
      if (episodes.find(e => e.id === ep.id)) {
        setEpisodes(prev => prev.map(item => item.id === ep.id ? { ...item, logicWarnings: result } : item));
      } else if (sideStories.find(s => s.id === ep.id)) {
        setSideStories(prev => prev.map(item => item.id === ep.id ? { ...item, logicWarnings: result } : item));
      } else if (characterMemories.find(m => m.id === ep.id)) {
        setCharacterMemories(prev => prev.map(item => item.id === ep.id ? { ...item, logicWarnings: result } : item));
      }
    } catch (error) {
      console.error(error);
      handleWuxiaException(error, "soi xét logic");
    } finally {
      setIsAnalyzingLogic(null);
    }
  };

  const handleImportDocxForEpisode = async (e: React.ChangeEvent<HTMLInputElement>, ep: Episode) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImportingDocx(ep.id!);
    try {
      const mammothModule = await import('mammoth');
      const mammoth = mammothModule.default || mammothModule;
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      
      if (!text.trim()) {
        alert('File DOCX trống hoặc không đọc được nội dung.');
        return;
      }

      const { importDocxScript } = await import('./services/geminiService');
      const parsed = await importDocxScript(text);

      if (parsed && parsed.summary && parsed.scenes) {
        updateSubDoc('episodes', String(ep.id), { 
          summary: parsed.summary,
          scenes: parsed.scenes,
          status: 'detailed'
        });
        alert('Import và phân loại kịch bản thành công!');
      } else {
        alert('Không thể nhận diện định dạng kịch bản từ file. Vui lòng thử lại với nội dung rõ ràng hơn.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("quota")) {
         handleWuxiaException(err, "import kịch bản file DOCX");
      } else {
         alert('Lỗi import DOCX: ' + (err.message || String(err)));
      }
    } finally {
      setIsImportingDocx(null);
      // Reset input value to allow re-uploading the same file if needed
      e.target.value = '';
    }
  };

  const handleAIExtractChanges = async (ep: Episode) => {
    if (!canEdit) return;
    setIsExtractingChanges(ep.id);
    try {
      const data = await extractCharacterChanges(ep.id, ep.summary, characters);
      const changes = Array.isArray(data) ? data : data.changes || [];
      const newCharsFromAI = data.newCharacters || [];
      
      const updatedChars = [...characters];
      
      changes.forEach((changeData: any) => {
        const cIdx = updatedChars.findIndex(c => c.name === changeData.name);
        if (cIdx !== -1) {
          const char = updatedChars[cIdx];
          const timeline = char.stateTimeline ? [...char.stateTimeline] : [];
          const existingIdx = timeline.findIndex(t => t.episodeId === ep.id);
          
          if (existingIdx !== -1) {
            timeline[existingIdx] = { ...timeline[existingIdx], change: changeData.change };
          } else {
            timeline.push({ episodeId: ep.id, change: changeData.change });
          }
          updatedChars[cIdx] = { ...char, stateTimeline: timeline };
        }
      });

      let addedNewCount = 0;
      for (const newC of newCharsFromAI) {
        if (!updatedChars.find(c => c.name.toLowerCase() === newC.name.toLowerCase())) {
           addedNewCount++;
           
           const newCharSlug = newC.name.toLowerCase()
                     .normalize('NFD')
                     .replace(/[\u0300-\u036f]/g, '')
                     .replace(/\s+/g, '-')
                     .replace(/[^a-z0-9-]/g, '') || String(Date.now());
                     
           /*
           await setDoc(doc(db, `projects/${activeProjectId}/characters`, newCharSlug), {
             name: newC.name,
             role: newC.role,
             faction: ['Chính phái', 'Tà phái', 'Trung lập'].includes(newC.faction) ? newC.faction : 'Trung lập',
             description: newC.description || 'Hệ thống tự động phát hiện từ cốt truyện.',
             projectId: activeProjectId,
             _editorInfo: { userId: user ? user.uid : 'unknown', email: user ? user.email : '', timestamp: Date.now() },
             updatedAt: Date.now()
           });
           */
        }
      }

      if (addedNewCount > 0) {
         alert(`Đã tự động phát hiện và thêm ${addedNewCount} nhân vật mới từ tập này!`);
      }
      
      // Save changes to timelines
      for (const char of updatedChars) {
        if (changes.some((ch:any) => ch.name === char.name)) {
          const charSlug = char.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          // await updateDoc(doc(db, `projects/${activeProjectId}/characters`, charSlug), {
          //   stateTimeline: char.stateTimeline
          // }).catch(console.error);
        }
      }
    } catch (error) {
      console.error(error);
      handleWuxiaException(error, "chắt lọc dấu ấn tập phim");
    } finally {
      setIsExtractingChanges(null);
    }
  };

  const handleImportEpisodeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.docx')) {
        try {
          const mammothModule = await import('mammoth');
          const mammoth = mammothModule.default || mammothModule;
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          setNewEpisodePayload(prev => ({ ...prev, content: result.value }));
          alert('Import file DOCX thành công! Nhấn "Tạo bằng AI" để tiếp tục.');
        } catch (err) {
          console.error(err);
          alert('Lỗi đọc file DOCX: ' + String(err));
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          setNewEpisodePayload(prev => ({ ...prev, content: text }));
        };
        reader.readAsText(file);
      }
      e.target.value = '';
    }
  };

  const handleAICreateEpisode = async (arcTitle: string) => {
    if (!canEdit) return;
    if (!newEpisodePayload.title) {
      alert("Hãy nhập tên cảnh phim để AI có điểm tựa phóng bút!");
      return;
    }
    setIsGeneratingEpisode(true);
    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
      if (!apiKey) {
        alert("Thiếu cấu hình GEMINI_API_KEY.");
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const contextType = arcTitle === 'NGOẠI TRUYỆN' ? 'ngoại truyện' : (arcTitle === 'KÝ ỨC' ? 'hồi ức nhân vật' : 'cảnh phim');
      
      // Build world context
      const worldContext = `
Danh sách cao thủ:
${characters.map(c => `- ${c.name} (${c.role}, ${c.faction}): ${c.personality || 'Chưa rõ tính cách'}. Võ công: ${[c.martialArtsBeginner, c.martialArtsIntermediate, c.martialArtsAdvanced, c.martialArtsSpecial].filter(m => m).join(', ')}. Trang phục: ${c.attire || 'Chưa mô tả'}. Quá khứ: ${c.past || 'Chưa rõ'}`).join('\n')}

Phe phái bang phái:
${factions.map(f => `- ${f.name}: ${f.description}`).join('\n')}

Ký ức & Ngoại truyện đã biết:
${[...sideStories, ...characterMemories].map(s => `- ${s.title}: ${s.summary[0] || ''}`).join('\n')}
      `;

      const prompt = `Bạn là một nhà biên kịch kỳ cựu chuyên dòng phim kiếm hiệp. 
Dựa trên bối cảnh thế giới giang hồ sau:
${worldContext}

Hãy viết sườn diễn biến chi tiết cho ${contextType} có tên "${newEpisodePayload.title}" ${arcTitle !== 'KÝ ỨC' && arcTitle !== 'NGOẠI TRUYỆN' ? `thuộc tập "${arcTitle}"` : ''}.
YÊU CẦU QUAN TRỌNG:
1. Phải căn cứ chính xác vào tính cách, võ công, phe phái và phục trang của nhân vật đã mô tả.
2. Nếu là Ký ức hoặc Ngoại truyện, hãy đảm bảo các tình tiết liên kết logic với những gì đã xảy ra hoặc những cao thủ liên quan.
3. Chia nội dung thành 4 đến 6 "Phân đoạn" (Scene Components). Mỗi Phân đoạn viết thành một câu hoặc đoạn văn bản ngắn gọn, súc tích.
4. MỖI PHÂN ĐOẠN PHẢI MÔ TẢ MỘT HÀNH ĐỘNG HOẶC KHOẢNH KHẮC ĐẮT GIÁ, CÓ THỂ DIỄN RA TRONG KHOẢNG 15 GIÂY (để phục vụ việc tạo Prompt Video sau này).
5. Ngôn từ mang đậm phong vị kiếm hiệp, hành hiệp trượng nghĩa, oai hùng.
6. MỖI PHÂN ĐOẠN PHẢI ĐƯỢC TRÌNH BÀY SONG NGỮ (VIETNAMESE | ENGLISH). Ví dụ: "Như Ý dùng Mộc Lan Châm cứu Cát Tường | Nhu Y uses Mu Lan Needle to save Cat Tuong".
7. KHÔNG CẦN CÓ TIÊU ĐỀ LẶP LẠI. CHỈ IN RA DANH SÁCH CÁC PHÂN ĐOẠN (tách biệt bằng dấu xuống dòng hoặc gạch đầu dòng).`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", // Changed from 2.5-flash for better detail
        contents: prompt
      });
      
      const text = response.text;
      if (text) {
        setNewEpisodePayload(prev => ({ ...prev, content: text.replace(/\*/g, '').trim() }));
      }
    } catch (e) {
      console.error(e);
      handleWuxiaException(e, "chấp bút biên kịch");
    } finally {
      setIsGeneratingEpisode(false);
    }
  };

  
  const handleShareProject = async (targetEmail: string, action: 'add' | 'remove', role: 'admin' | 'collaborator' | 'viewer' = 'collaborator') => {
    if (!activeProjectId || !user) return;
    setIsSharing(true);
    try {
      const emailLower = targetEmail.toLowerCase().trim();
      if (!emailLower) return;
      
      const newCollaborators = action === 'add' 
        ? Array.from(new Set([...collaborators, emailLower]))
        : collaborators.filter(e => e !== emailLower);
        
      const newRoles = { ...collaboratorRoles };
      if (action === 'add') {
         newRoles[emailLower] = role;
      } else {
         delete newRoles[emailLower];
      }
      
      const batch = fbWriteBatch(db);
      const projectRef = doc(db, 'projects', activeProjectId);
      batch.update(projectRef, { 
        collaborators: newCollaborators,
        collaboratorRoles: newRoles,
        updatedAt: new Date().toISOString()
      });
      
      await batch.commit();
      setCollaborators(newCollaborators);
      setCollaboratorRoles(newRoles);
      setShareEmail('');
      setShowShareModal(false);
      if (action === 'add') alert(`Đã thiết lập quyền ${role === 'admin' ? 'Quản Sự (Admin)' : (role === 'collaborator' ? 'Cộng Tác Viên' : 'Khách Xem')} cho ${emailLower}.\n\nLƯU Ý QUAN TRỌNG: Hãy đảm bảo bạn đã vào [Thiết Lập Sở Hành] -> Nhấn [Truyền Công] để đẩy dữ liệu bản địa lên Thiên Thư. Chỉ khi nào bạn Truyền Công xong, bằng hữu này mới có thể [Nhận Truyền Công] mà thấy được nội dung!`);
    } catch (e) {
      console.error("Lỗi chia sẻ:", e);
      alert("Thiên Cơ Các gặp trục trặc khi thao tác: " + String(e));
    } finally {
      setIsSharing(false);
    }
  };

  const updateSubDoc = async (col: string, docId: string, data: any) => {
    if (!activeProjectId || !canEdit) return;
    
    const updatePayload = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    // Manual state sync for offline support FIRST
    const updateItem = (item: any) => {
      if (String(item.id) === String(docId)) {
        return { ...item, ...updatePayload };
      }
      return item;
    };

    switch (col) {
      case 'episodes':
        setEpisodes(prev => prev.map(updateItem));
        setSideStories(prev => prev.map(updateItem));
        setCharacterMemories(prev => prev.map(updateItem));
        break;
      case 'characters':
        setCharacters(prev => prev.map(updateItem));
        break;
      case 'factions':
        setFactions(prev => prev.map(updateItem));
        break;
      case 'arcs':
        setArcs(prev => prev.map(updateItem).sort((a, b) => (a.order || 0) - (b.order || 0)));
        break;
      case 'artifacts':
        setArtifacts(prev => prev.map(updateItem));
        break;
      case 'weapons':
        setWeapons(prev => prev.map(updateItem));
        break;
    }

    // Remote sync in background
    (async () => {
      try {
        const ref = doc(db, `projects/${activeProjectId}/${col}`, docId);
        // await setDoc(ref, updatePayload, { merge: true });
      } catch (e) {
        console.warn(`Error updating ${col}/${docId} on server, local only:`, e);
      }
    })();
  };

  const deleteSubDoc = async (col: string, docId: string) => {
    if (!activeProjectId || !canDelete) return;

    // Manual state sync for offline support FIRST
    const removeItem = (prev: any[]) => prev.filter(item => String(item.id) !== String(docId));

    switch (col) {
      case 'episodes':
        setEpisodes(removeItem);
        setSideStories(removeItem);
        setCharacterMemories(removeItem);
        break;
      case 'characters':
        setCharacters(removeItem);
        break;
      case 'factions':
        setFactions(removeItem);
        break;
      case 'arcs':
        setArcs(removeItem);
        break;
      case 'artifacts':
        setArtifacts(removeItem);
        break;
      case 'weapons':
        setWeapons(removeItem);
        break;
    }

    // Remote delete in background
    (async () => {
      try {
        const ref = doc(db, `projects/${activeProjectId}/${col}`, docId);
        // await deleteDoc(ref);
      } catch (e) {
        console.warn(`Error deleting ${col}/${docId} on server, local only:`, e);
      }
    })();
  };

  const [isListening, setIsListening] = useState(false);
  const [isTranslatingSpeech, setIsTranslatingSpeech] = useState(false);
  const [activeDictationPoint, setActiveDictationPoint] = useState<string | null>(null);
  const [characterDictationField, setCharacterDictationField] = useState<keyof Character | null>(null);
  const [genericDictationField, setGenericDictationField] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);
  const diagramContainerRef = React.useRef<HTMLDivElement>(null);

  const handleToggleGenericDictation = async (
    fieldId: string, 
    setter: (value: string) => void, 
    currentValue: string, 
    promptTemplate: string,
    useWuxiaStyle: boolean = true
  ) => {
    if (!canEdit) {
      alert("Chỉ Cộng Tác Viên hoặc Admin mới có quyền Truyền Âm Nhập Mật khố này!");
      return;
    }

    if (isListening && genericDictationField === fieldId) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setGenericDictationField(null);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ Truyền Âm Nhập Mật (Speech to Text)!");
      return;
    }
    
    setIsListening(true);
    setGenericDictationField(fieldId);
    
    // Explicitly request mic permission if needed (browser prompt)
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("Mic permission denied:", err);
      alert("Không thể truy cập Microphone. Vui lòng cấp quyền trong cài đặt trình duyệt.");
      setIsListening(false);
      setGenericDictationField(null);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setIsListening(false);
        setGenericDictationField(null);
        setIsTranslatingSpeech(true);
        try {
          if (useWuxiaStyle) {
             const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
             if (!apiKey) throw new Error("Missing API Key");
             const ai = new GoogleGenAI({ apiKey });
             const prompt = promptTemplate.replace('{{transcript}}', transcript);
             
             const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt
             });
             
             let translated = response.text || transcript;
             translated = translated.trim();
             setter(currentValue ? currentValue + "\n" + translated : translated);
          } else {
             setter(currentValue ? currentValue + "\n" + transcript : transcript);
          }
        } catch (e) {
          console.error(e);
          handleWuxiaException(e, "xử lý giọng nói (Truyền Âm)");
          setter(currentValue ? currentValue + "\n" + transcript : transcript);
        } finally {
          setIsTranslatingSpeech(false);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      if (genericDictationField === fieldId) {
         setIsListening(false);
         setGenericDictationField(null);
      }
    };

    recognition.onend = () => {
      if (genericDictationField === fieldId) {
         setIsListening(false);
         setGenericDictationField(null);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleToggleCharacterDictation = (field: keyof Character) => {
    if (isListening && characterDictationField === field) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setCharacterDictationField(null);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ Truyền Âm Nhập Mật (Speech to Text)!");
      return;
    }
    
    setIsListening(true);
    setCharacterDictationField(field);
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setIsListening(false);
        setCharacterDictationField(null);
        setIsTranslatingSpeech(true);
        try {
          const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
          if (!apiKey) throw new Error("Missing API Key");
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `Chuyển đổi lại đoạn văn sau sang ngôn từ mang đậm phong cách giang hồ kiếm hiệp (ngắn gọn, súc tích, văn phong cổ trang, phù hợp để miêu tả nhân vật trong tiểu thuyết kiếm hiệp). Trả về duy nhất kết quả đã được chuyển đổi:\n\n"${transcript}"`;
          
          const response = await ai.models.generateContent({
             model: "gemini-3-flash-preview",
             contents: prompt
          });
          
          let translated = response.text || transcript;
          translated = translated.trim();
          
          setNewChar(prev => ({ 
             ...prev, 
             [field]: prev[field] ? prev[field] + "\n" + translated : translated 
          }));
        } catch (e) {
          console.error(e);
          handleWuxiaException(e, "chuyển văn phong kiếm hiệp");
          setNewChar(prev => ({ 
             ...prev, 
             [field]: prev[field] ? prev[field] + "\n" + transcript : transcript 
          }));
        } finally {
          setIsTranslatingSpeech(false);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      if (characterDictationField === field) {
         setIsListening(false);
         setCharacterDictationField(null);
      }
    };

    recognition.onend = () => {
      if (characterDictationField === field) {
         setIsListening(false);
         setCharacterDictationField(null);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleToggleSceneDictation = (episode: Episode, point: string) => {
    if (isListening && activeDictationPoint === point) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setActiveDictationPoint(null);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ Truyền Âm Nhập Mật (Speech to Text)!");
      return;
    }
    
    setIsListening(true);
    setActiveDictationPoint(point);
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setIsListening(false);
        setActiveDictationPoint(null);
        setIsTranslatingSpeech(true);
        try {
          const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
          if (!apiKey) throw new Error("Missing API Key");
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `Chuyển đổi lại đoạn văn sau sang ngôn từ mang đậm phong cách giang hồ kiếm hiệp (ngắn gọn, súc tích, văn phong cổ trang tiểu thuyết kiếm hiệp). Đây là một đoạn chi tiết kịch bản, miêu tả hành động, cảm xúc nhân vật. Trả về duy nhất kết quả đã được chuyển đổi:\n\n"${transcript}"`;
          
          const response = await ai.models.generateContent({
             model: "gemini-3-flash-preview",
             contents: prompt
          });
          
          let translated = response.text || transcript;
          translated = translated.trim();
          
          setEpisodes(prev => prev.map(e => {
            if (e.id === episode.id) {
              const scenes = e.scenes ? [...e.scenes] : [];
              const existingIdx = scenes.findIndex(s => s.point === point);
              if (existingIdx !== -1) {
                // Append
                scenes[existingIdx] = { ...scenes[existingIdx], content: scenes[existingIdx].content + "\n\n" + translated };
              } else {
                scenes.push({ point, content: translated });
              }
              return { ...e, scenes };
            }
            return e;
          }));
        } catch (e) {
          console.error(e);
          handleWuxiaException(e, "chuyển văn phong kiếm hiệp");
          setEpisodes(prev => prev.map(e => {
            if (e.id === episode.id) {
              const scenes = e.scenes ? [...e.scenes] : [];
              const existingIdx = scenes.findIndex(s => s.point === point);
              if (existingIdx !== -1) {
                scenes[existingIdx] = { ...scenes[existingIdx], content: scenes[existingIdx].content + "\n\n" + transcript };
              } else {
                scenes.push({ point, content: transcript });
              }
              return { ...e, scenes };
            }
            return e;
          }));
        } finally {
          setIsTranslatingSpeech(false);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      if (activeDictationPoint === point) {
         setIsListening(false);
         setActiveDictationPoint(null);
      }
    };

    recognition.onend = () => {
      if (activeDictationPoint === point) {
         setIsListening(false);
         setActiveDictationPoint(null);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleToggleDictation = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ Truyền Âm Nhập Mật (Speech to Text)!");
      return;
    }
    
    setIsListening(true);
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setIsListening(false);
        setIsTranslatingSpeech(true);
        try {
          const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
          if (!apiKey) {
             alert("Thiếu cấu hình GEMINI_API_KEY.");
             return;
          }
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `Chuyển đổi lại đoạn hội thoại/văn xuôi sau sang ngôn từ mang đậm phong cách giang hồ kiếm hiệp (ngắn gọn, súc tích, văn phong cổ trang, có thể dùng từ Hán Việt phù hợp). Trả về duy nhất kết quả đã được chuyển đổi, không thêm lời giải thích nào:\n\nĐoạn văn: "${transcript}"`;
          
          const response = await ai.models.generateContent({
             model: "gemini-2.5-flash",
             contents: prompt
          });
          
          let translated = response.text || transcript;
          translated = translated.trim();
          
          setNewEpisodePayload(prev => ({ 
             ...prev, 
             content: prev.content ? prev.content + "\n" + translated : translated 
          }));
        } catch (e) {
          console.error(e);
          handleWuxiaException(e, "chuyển văn phong kiếm hiệp");
          setNewEpisodePayload(prev => ({ 
             ...prev, 
             content: prev.content ? prev.content + "\n" + transcript : transcript 
          }));
        } finally {
          setIsTranslatingSpeech(false);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      if (event.error === 'not-allowed') {
        alert("Quyền truy cập Micro bị từ chối. Hãy cho phép micro trong cài đặt trình duyệt để sử dụng tính năng Truyền Âm.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleSaveNewEpisode = async (arcTitle: string) => {
    if (!canEdit) return;
    if (!newEpisodePayload.title || !newEpisodePayload.content || !effectiveUid || !activeProjectId) {
       alert("Cần có dữ liệu và danh tính để khởi tạo tập phim.");
       return;
    }

    const nextId = [...episodes, ...sideStories, ...characterMemories].length > 0 ? 
      Math.max(...[...episodes, ...sideStories, ...characterMemories].filter(e => typeof e.id === 'number').map(e => e.id)) + 1 : 1;
    const splitted = newEpisodePayload.content.split('\n').map(s => s.replace(/^[-*]\s*/, '').trim()).filter(Boolean);

    const newEp: Episode = {
      id: nextId,
      title: newEpisodePayload.title,
      arc: arcTitle,
      summary: splitted,
      status: 'draft',
      scenes: []
    };

    // Update state manually FIRST for offline/local support
    if (arcTitle === 'NGOẠI TRUYỆN') {
      setSideStories(prev => [...prev, newEp].sort((a, b) => a.id - b.id));
    } else if (arcTitle === 'KÝ ỨC') {
      setCharacterMemories(prev => [...prev, newEp].sort((a, b) => a.id - b.id));
    } else {
      setEpisodes(prev => [...prev, newEp].sort((a, b) => a.id - b.id));
    }

    try {
      const dataToSave = {
        ...newEp,
        projectId: activeProjectId
      };

      // Background sync
      (async () => {
        try {
          // await setDoc(doc(db, `projects/${activeProjectId}/episodes`, `ep-${nextId}`), withCollaboration(dataToSave));
        } catch (e) {
          console.warn("Firebase sync failed, data saved locally:", e);
        }
      })();
      
      setShowAddEpisodeModal(null);
      setNewEpisodePayload({ title: '', content: '' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNewArc = async () => {
    if (!canEdit) return;
    if (!newArcTitle.trim() || !activeProjectId) {
      alert("Vui lòng nhập tên Hồi / Chương mới.");
      return;
    }
    const cleanTitle = newArcTitle.replace(/^(Phần|Hồi|Chương)\s*\d+[:\s]*/i, '').trim().toUpperCase();
    const arcTitle = `HỒI ${arcs.length + 1}: ${cleanTitle}`;
    
    const arcId = toSlug(arcTitle);
    const arcData = {
      title: arcTitle,
      order: arcs.length,
      id: arcId
    };

    // Update state manually FIRST
    setArcs(prev => [...prev, arcData].sort((a, b) => (a.order || 0) - (b.order || 0)));

    try {
      // Background sync
      (async () => {
        try {
          // await setDoc(doc(db, `projects/${activeProjectId}/arcs`, arcId), withCollaboration({
            /* (skipped) */
        } catch (e) {
          console.warn("Firebase sync failed, data saved locally:", e);
        }
      })();

      setShowAddArcModal(false);
      setNewArcTitle('');
    } catch (e) {
      console.error(e);
      handleWuxiaException(e, "ghi danh hồi phim");
    }
  };

  const handleSaveNewSideStory = async () => {
    if (!canEdit) return;
    if (!newEpisodePayload.title || !newEpisodePayload.content || !effectiveUid || !activeProjectId) {
       alert("Cần có dữ liệu và danh tính để khởi tạo ngoại truyện.");
       return;
    }
    const splitted = newEpisodePayload.content.split('\n').map(s => s.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
    const storyId = Date.now();
    const newEp: Episode = {
      id: storyId,
      title: newEpisodePayload.title,
      arc: 'NGOẠI TRUYỆN',
      summary: splitted,
      status: 'draft',
      scenes: []
    };
    
    try {
      const storyId = Date.now();
      const newEp: Episode = {
        id: storyId,
        title: newEpisodePayload.title,
        arc: 'NGOẠI TRUYỆN',
        summary: splitted,
        status: 'draft',
        scenes: []
      };

      // Update state manually FIRST
      setSideStories(prev => [...prev, newEp].sort((a, b) => a.id - b.id));

      // Background sync
      (async () => {
        try {
          // await setDoc(doc(db, `projects/${activeProjectId}/episodes`, `side-${storyId}`), withCollaboration({ ...newEp, projectId: activeProjectId }));
        } catch (e) {
          console.warn("Firebase sync failed, data saved locally:", e);
        }
      })();
      
      setShowAddSideStoryModal(false);
      setNewEpisodePayload({ title: '', content: '', characterName: '' });
    } catch (e) {
      console.error(e);
      handleWuxiaException(e, "lưu ngoại truyện");
    }
  };

  const handleSaveNewMemory = async () => {
    if (!canEdit) return;
    if (!newEpisodePayload.title || !newEpisodePayload.content || !effectiveUid || !activeProjectId) {
       alert("Cần có dữ liệu và danh tính để khởi tạo hồi ức.");
       return;
    }
    const splitted = newEpisodePayload.content.split('\n').map(s => s.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
    const memoryId = Date.now();
    const newEp: Episode = {
      id: memoryId,
      title: newEpisodePayload.title,
      arc: 'KÝ ỨC',
      summary: splitted,
      status: 'draft',
      scenes: [],
      characterName: newEpisodePayload.characterName
    };
    
    try {
      const memoryId = Date.now();
      const newEp: Episode = {
        id: memoryId,
        title: newEpisodePayload.title,
        arc: 'KÝ ỨC',
        summary: splitted,
        status: 'draft',
        scenes: [],
        characterName: newEpisodePayload.characterName
      };

      // Update state manually FIRST
      setCharacterMemories(prev => [...prev, newEp].sort((a, b) => a.id - b.id));
      
      // Background sync
      (async () => {
        try {
          // await setDoc(doc(db, `projects/${activeProjectId}/episodes`, `memory-${memoryId}`), withCollaboration({ ...newEp, projectId: activeProjectId }));
        } catch (e) {
          console.warn("Firebase sync failed, data saved locally:", e);
        }
      })();

      setShowAddMemoryModal(false);
      setNewEpisodePayload({ title: '', content: '', characterName: '' });
    } catch (e) {
      console.error(e);
      handleWuxiaException(e, "lưu hồi ức");
    }
  };

  const handleAIGenerateConceptArt = async () => {
    if (!canEdit) return;
    if (!selectedCharacter) return;
    setIsGeneratingConcept(true);
    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
      if (!apiKey) {
        alert("Thiếu cấu hình GEMINI_API_KEY.");
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Character concept art sheet of a Chinese Xianxia character, 3D semi-real animated movie style. The sheet must contain exactly 3 elements on a plain gray background: 1 full-body front view standing in an A-pose/T-pose with arms slightly spread, 1 full-body back view in the same pose, and 1 close-up combat portrait taking up about 20% of the composition.
      
Character Description:
- Appearance: ${selectedCharacter.attire || "Mặc y phục cổ trang kiếm hiệp"}
- Personality: ${selectedCharacter.personality || "Thần thái giang hồ rạo rực"}
- Faction: ${selectedCharacter.faction}
- Weapon: ${selectedCharacter.weapon || "Không dùng vũ khí"}
- Past/Goal: ${selectedCharacter.past || ""} ${selectedCharacter.description || ""}

IMPORTANT: Generate a single image containing all 3 views. Background must be solid gray. Quality must be 4k.`;
      
      let contents: any[] = [];
      if (conceptRefImage) {
         const baseStr = conceptRefImage;
         try {
           const mimeMatch = baseStr.match(/^data:(image\/[a-zA-Z0-9]+);base64,/);
           if (mimeMatch) {
             const mimeType = mimeMatch[1];
             const base64Data = baseStr.split(',')[1];
             contents = [
               { text: prompt },
               { inlineData: { data: base64Data, mimeType } }
             ];
           } else {
             contents = [{ text: prompt }];
           }
         } catch(e) {
           contents = [{ text: prompt }];
         }
      } else {
         contents = [{ text: prompt }];
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: { parts: contents },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "4K"
          }
        }
      });
      
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          const base64 = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || "image/png";
          const newImageRaw = `data:${mimeType};base64,${base64}`;
          const newImage = await compressImage(newImageRaw, 1024, 1024, 0.8);
          
          const updatedChar = { ...selectedCharacter, fullBodyImage: newImage };
          if (!updatedChar.avatar) updatedChar.avatar = newImage;
          
          setSelectedCharacter(updatedChar);
          const charId = updatedChar.id || toSlug(updatedChar.name);
          if (activeProjectId && charId) {
            updateSubDoc('characters', charId, { 
              fullBodyImage: updatedChar.fullBodyImage, 
              avatar: updatedChar.avatar 
            });
          }
          break;
        }
      }
    } catch (e: any) {
      console.error(e);
      handleWuxiaException(e, "họa ảnh nhân vật");
    } finally {
      setIsGeneratingConcept(false);
    }
  };

  const handleGenerateStoryboardImage = async (epId: number, point: string, sceneContent: string) => {
    if (!canEdit) return;
    const key = `${epId}-${point}`;
    setIsGeneratingStoryboard(prev => ({ ...prev, [key]: true }));

    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
      if (!apiKey) {
        alert("Vui lòng cấu hình GEMINI_API_KEY để sử dụng tính năng này!");
        return;
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Phác họa một phân cảnh storyboard hoạt hình (anime style, 3D semi-realistic, martial arts/xianxia) dựa trên mô tả sau:\n\n${sceneContent}\n\nPhong cách: storyboard phác thảo, tỷ lệ 16:9, thể hiện rõ bối cảnh và cảm xúc.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "4K"
          }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
           const base64 = part.inlineData.data;
           const mimeType = part.inlineData.mimeType || "image/png";
           const imageUrl = `data:${mimeType};base64,${base64}`;

           const updatedEpisodes = episodes.map(item => {
             if (item.id === epId) {
               const scenes = item.scenes ? [...item.scenes] : [];
               const idx = scenes.findIndex(s => s.point === point);
               if (idx !== -1) {
                 scenes[idx] = { ...scenes[idx], storyboardImage: imageUrl };
                 updateSubDoc('episodes', String(epId), { scenes });
               }
               return { ...item, scenes };
             }
             return item;
           });
           break;
        }
      }
    } catch (error: any) {
      console.error(error);
      handleWuxiaException(error, "dựng hình storyboard");
    } finally {
      setIsGeneratingStoryboard(prev => ({ ...prev, [key]: false }));
    }
  };

  const [isGeneratingFactionDesc, setIsGeneratingFactionDesc] = useState(false);

  const handleGenerateFactionDescAI = async () => {
    if (!canEdit) return;
    if (!newFaction.name) {
      alert("Cần nhập Tên Bang Hội trước khi nhờ AI gợi ý lịch sử!");
      return;
    }
    
    setIsGeneratingFactionDesc(true);
    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        alert("Thiếu cấu hình GEMINI_API_KEY.");
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Viết một đoạn mô tả (Tông chỉ và Lịch sử) thật xúc tích ngắn gọn cho một bang phái kiếm hiệp mang tên: "${newFaction.name}".
Nếu đây là một bang phái nổi tiếng có thật trong tiểu thuyết/game kiếm hiệp (ví dụ: Thiếu Lâm, Nga My, Võ Đang, Côn Lôn, Thiên Vương, Tàng Kiếm, Huyền Thuỷ, Trường Ca, Đường Môn, Ngũ Độc, Minh Giáo, Thiên Nhẫn, Tiêu Dao...), hãy viết đúng chuẩn lore gốc.
Nếu không, hãy tự sáng tạo một lịch sử hào hùng, thần bí và tông chỉ hoạt động.
Chỉ trả về nội dung đoạn mô tả (khoảng 3-5 câu), không thêm văn bản râu ria.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setNewFaction(prev => ({ ...prev, description: text.trim() }));
      }
    } catch (e) {
      console.error(e);
      alert("AI bị tẩu hỏa nhập ma khi suy nghĩ về bang phái này.");
    } finally {
      setIsGeneratingFactionDesc(false);
    }
  };

  const handleGenerateFlagAI = async () => {
    if (!canEdit) return;
    if (!newFaction.name || !newFaction.description) {
      alert("Cần nhập Tên Bang Hội và Tông Chỉ trước khi dùng AI vẽ cờ!");
      return;
    }
    
    setIsGeneratingFlag(true);
    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
      if (!apiKey) {
        alert("Thiếu cấu hình GEMINI_API_KEY.");
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `A wuxia style martial arts sect flag or emblem. Sect name: ${newFaction.name}. Description: ${newFaction.description}. The emblem should be an icon, symbol, or banner, fantasy wuxia style, high quality, standalone, centered on a neutral background, highly detailed.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
        // imageConfig is omitted to use defaults.
      });
      
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          const base64 = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || "image/png";
          setNewFaction(prev => ({ ...prev, flagAvatar: `data:${mimeType};base64,${base64}` }));
          break;
        }
      }
    } catch (e) {
      console.error(e);
      handleWuxiaException(e, "vẽ cờ hiệu bang phái");
    } finally {
      setIsGeneratingFlag(false);
    }
  };

  const syncWeaponFromCharacter = async (charName: string, weaponName?: string, weaponOrigin?: string, weaponAvatar?: string, forceSync: boolean = false) => {
    if (!weaponName || !activeProjectId) return;
    const wepId = toSlug(weaponName);
    
    // Check if weapon already exists in local state
    const existingWeapon = weapons.find(w => w.id === wepId || toSlug(w.name) === wepId);
    
    const newWeaponData: Partial<Weapon> = {
      id: wepId,
      name: weaponName,
      owner: charName
    };
    if (weaponOrigin !== undefined && weaponOrigin.trim() !== '') newWeaponData.origin = weaponOrigin;
    if (weaponAvatar !== undefined) newWeaponData.avatar = weaponAvatar;

    if (!existingWeapon) {
      newWeaponData.effect = '';
      try {
        const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
        if (apiKey && !(window as any).__geminiQuotaExceeded) {
           const ai = new GoogleGenAI({ apiKey });
           const char = characters.find(c => c.name === charName);
           const charDesc = char ? `Tên nhân vật: ${char.name}\nTiểu sử: ${char.description || ''}\nQuá khứ: ${char.past || ''}\nVõ công cao cấp: ${char.martialArtsAdvanced || ''}\nVõ công đặc biệt: ${char.martialArtsSpecial || ''}` : '';
           const prompt = `Bạn là một tiểu thuyết gia kiếm hiệp kỳ cựu. Viết Nguồn gốc và Công dụng cho thần binh "${weaponName}" của nhân vật "${charName}".
Dữ liệu nhân vật:
${charDesc}
Hãy suy luận logic từ dữ liệu nhân vật để gắn liền thần binh với xuất thân hoặc võ công của họ. Nếu không có thông tin, hãy sáng tạo một cách thuần kiếm hiệp.
YÊU CẦU DUY NHẤT: Trả về ĐÚNG MỘT CẤU TRÚC JSON, KHÔNG format thêm bất kỳ text nào khác, KHÔNG markdown code block.

{
  "origin": "Trích xuất/sáng tạo nguồn gốc...",
  "effect": "Trích xuất/sáng tạo công dụng..."
}`;
           const result = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: prompt
           });
           const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
           try {
             const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
             const parsed = JSON.parse(cleanText);
             if (!newWeaponData.origin && parsed.origin) newWeaponData.origin = parsed.origin;
             newWeaponData.effect = parsed.effect || '';
           } catch (parseError) {
             console.warn("Could not parse AI response", text);
           }
        }
      } catch (e: any) {
        console.error("AI weapon info generator failed:", e);
        if (e?.status === "RESOURCE_EXHAUSTED" || (e?.message && (e.message.includes("quota") || e.message.includes("429")))) {
           if (!(window as any).__geminiQuotaExceeded) {
             (window as any).__geminiQuotaExceeded = true;
             alert("Hệ thống AI vừa chạm giới hạn (Quota Exceeded). Tính năng tự động tạo tiểu sử bằng AI sẽ tạm ngưng. Bạn có thể thay đổi API key hoặc tự thiết lập.");
           }
        }
      }

      try {
        const finalNewWeaponData = {
          ...newWeaponData,
          projectId: activeProjectId
        };
        // await setDoc(doc(db, `projects/${activeProjectId}/weapons`, wepId), withCollaboration(finalNewWeaponData));
        setWeapons(prev => {
          const existingIdx = prev.findIndex(w => w.id === wepId);
          if (existingIdx === -1) {
            return [...prev, finalNewWeaponData as Weapon];
          } else {
            const newPrev = [...prev];
            const w = { ...newPrev[existingIdx] };
            const owners = w.owner ? w.owner.split(', ') : [];
            if (charName && !owners.includes(charName)) {
               owners.push(charName);
               w.owner = owners.join(', ');
               newPrev[existingIdx] = w;
            }
            return newPrev;
          }
        });
      } catch (e) {
        console.error("Lỗi đồng bộ vũ khí:", e);
      }
    } else {
      // Merge new data if provided and not empty
      const updateData: any = {};
      
      let shouldFetchAI = false;
      if (forceSync || (!existingWeapon.origin && !weaponOrigin)) shouldFetchAI = true;
      if (forceSync || !existingWeapon.effect) shouldFetchAI = true;

      // If user explicitly provided a weaponOrigin on the character, we prioritize it
      if (weaponOrigin && (forceSync || !existingWeapon.origin)) {
           updateData.origin = weaponOrigin;
           shouldFetchAI = false; // we have an explicit origin, no need for AI
      }

      if (shouldFetchAI) {
        try {
          const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
          if (apiKey && !(window as any).__geminiQuotaExceeded) {
             const ai = new GoogleGenAI({ apiKey });
             const char = characters.find(c => c.name === charName);
             const charDesc = char ? `Tên: ${char.name}\nTiểu sử: ${char.description || ''}\nQuá khứ: ${char.past || ''}` : '';
             const prompt = `Viết Nguồn gốc và Công dụng cho thần binh "${weaponName}" của nhân vật "${charName}".
Dữ liệu:
${charDesc}
Trả lại chuỗi JSON thuần: {"origin": "...", "effect": "..."}`;
             const result = await ai.models.generateContent({
               model: 'gemini-2.5-flash',
               contents: prompt
             });
             const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
             const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
             const parsed = JSON.parse(cleanText);
             if ((forceSync || !existingWeapon.origin) && !updateData.origin && parsed.origin) updateData.origin = parsed.origin;
             if ((forceSync || !existingWeapon.effect) && parsed.effect) updateData.effect = parsed.effect;
          }
        } catch (e: any) {
          console.warn("AI generation for existing weapon failed", e);
          if (e?.status === "RESOURCE_EXHAUSTED" || (e?.message && (e.message.includes("quota") || e.message.includes("429")))) {
             if (!(window as any).__geminiQuotaExceeded) {
               (window as any).__geminiQuotaExceeded = true;
               alert("Hệ thống AI vừa chạm giới hạn (Quota Exceeded). Tính năng tự động tạo tiểu sử bằng AI sẽ tạm ngưng. Bạn có thể thay đổi API key hoặc tự thiết lập.");
             }
          }
        }
      }

      if (weaponAvatar && (forceSync || !existingWeapon.avatar)) updateData.avatar = weaponAvatar;
      if (charName) {
         const owners = existingWeapon.owner ? existingWeapon.owner.split(', ') : [];
         if (!owners.includes(charName)) {
             owners.push(charName);
             updateData.owner = owners.join(', ');
         }
      }
      
      if (Object.keys(updateData).length > 0) {
        try {
          // await setDoc(doc(db, `projects/${activeProjectId}/weapons`, wepId), updateData, { merge: true });
          setWeapons(prev => prev.map(w => w.id === wepId ? { ...w, ...updateData } : w));
        } catch (e) {
          console.error("Lỗi đồng bộ vũ khí:", e);
        }
      }
    }
  };

  const handleAddCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert("Đại hiệp không có quyền hạn thực hiện việc này tại sơn trang này.");
      return;
    }
    if (!activeProjectId) {
      alert("Không tìm thấy mật phủ (Project ID). Vui lòng tải lại trang.");
      return;
    }

    if (!newChar.name.trim() || !newChar.role.trim()) {
      alert("Hành tẩu giang hồ cần có Danh Tính và Vị Thế! Vui lòng điền đủ Tên và Vị Thế nhân vật.");
      return;
    }
    
    try {
      const capitalizedNameValue = capitalizeName(newChar.name);
      const charId = toSlug(capitalizedNameValue);
      
      const updatedChar = {
        ...newChar,
        name: capitalizedNameValue,
        id: charId,
        projectId: activeProjectId
      };
      
      // Update state manually FIRST (Optimistic UI)
      setCharacters(prev => {
        let updated = [...prev];
        if (editingCharIdx !== null && newChar.id) {
          const oldCharId = newChar.id;
          updated = updated.filter(c => c.id !== oldCharId);
          updated.push(updatedChar as Character);
        } else {
          updated.push(updatedChar as Character);
        }
        const sorted = updated.sort((a, b) => (a.order || 0) - (b.order || 0));
        localStorage.setItem(`ghl_characters_${activeProjectId}`, JSON.stringify(sorted));
        return sorted;
      });
      
      // Attempt Firebase in background
      (async () => {
        try {
          if (editingCharIdx !== null && newChar.id) {
            const oldCharId = newChar.id;
            if (oldCharId !== charId) {
              // await deleteDoc(doc(db, `projects/${activeProjectId}/characters`, oldCharId));
            }
          }
          // await setDoc(doc(db, `projects/${activeProjectId}/characters`, charId), withCollaboration(updatedChar));
          
          if (newChar.weapon) {
            await syncWeaponFromCharacter(capitalizedNameValue, newChar.weapon, newChar.weaponOrigin, newChar.weaponAvatar);
          }
        } catch (e) {
          console.warn("Firebase sync missed, saved locally:", e);
        }
      })();
      
      alert(editingCharIdx !== null ? "Hồ Sơ đã được cập nhật bản địa." : "Anh hùng đã được ghi danh bản địa.");
      setNewChar(INITIAL_CHAR_STATE);
      setShowAddChar(false); // Close modal
      setEditingCharIdx(null);
    } catch (e) {
      console.error(e);
      handleWuxiaException(e, "ghi danh cao thủ");
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setNewChar({ ...newChar, avatar: compressed });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFactionAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setNewFaction(prev => ({...prev, flagAvatar: compressed}));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditFaction = (realIdx: number, alignment: Faction['alignment']) => {
    setNewFaction(factions[realIdx]);
    setEditingFactionIdx(realIdx);
    setShowAddFaction(true);
  };

  const handleEditCharacter = (idx: number) => {
    setNewChar(characters[idx]);
    setEditingCharIdx(idx);
    setShowAddChar(true);
  };

  const handleSaveCharacterDetail = async () => {
    console.log("Saving character detail:", {canEdit, selectedCharacter, activeProjectId});
    if (!canEdit) {
      alert("Đại hiệp không có quyền hạn thay đổi hồ sơ.");
      return;
    }
    if (!selectedCharacter || !activeProjectId) {
      alert("Dữ liệu chưa sẵn sàng hoặc không tìm thấy mật phủ.");
      return;
    }
    
    // Safety compression to ensure we don't hit 1MB limit
    const toUpdate = { ...selectedCharacter };
    try {
      if (toUpdate.avatar && toUpdate.avatar.length > 200000 && toUpdate.avatar.startsWith('data:image')) {
        toUpdate.avatar = await compressImage(toUpdate.avatar, 500, 500, 0.6);
      }
      if (toUpdate.weaponAvatar && toUpdate.weaponAvatar.length > 200000 && toUpdate.weaponAvatar.startsWith('data:image')) {
        toUpdate.weaponAvatar = await compressImage(toUpdate.weaponAvatar, 500, 500, 0.6);
      }
      if (toUpdate.fullBodyImage && toUpdate.fullBodyImage.length > 400000 && toUpdate.fullBodyImage.startsWith('data:image')) {
        toUpdate.fullBodyImage = await compressImage(toUpdate.fullBodyImage, 1000, 1000, 0.6);
      }
    } catch (err) {
      console.warn("Safety compression failed:", err);
    }

    // Determine IDs. If name changed, we might want to delete the old one
    const capitalizedNameValue = capitalizeName(toUpdate.name);
    const newCharId = toSlug(capitalizedNameValue);
    const oldCharId = toUpdate.id;
    
    const charToSave = {
      ...toUpdate,
      name: capitalizedNameValue,
      id: newCharId,
      projectId: activeProjectId
    };

    // Update state manually FIRST
    setCharacters(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(c => c.id === oldCharId);
      if (idx !== -1) {
        updated[idx] = charToSave as Character;
      } else {
        updated.push(charToSave as Character);
      }
      const sorted = updated.sort((a, b) => (a.order || 0) - (b.order || 0));
      localStorage.setItem(`ghl_characters_${activeProjectId}`, JSON.stringify(sorted));
      return sorted;
    });
    setSelectedCharacter(charToSave as Character);

    try {
      // Background Firebase update
      (async () => {
        try {
          if (toUpdate.weapon) {
            await syncWeaponFromCharacter(capitalizedNameValue, toUpdate.weapon, toUpdate.weaponOrigin || '', toUpdate.avatar || '');
          }
          
          if (oldCharId && oldCharId !== newCharId) {
            // await setDoc(doc(db, `projects/${activeProjectId}/characters`, newCharId), withCollaboration(charToSave));
            // await deleteDoc(doc(db, `projects/${activeProjectId}/characters`, oldCharId));
          } else {
            await updateSubDoc('characters', newCharId, charToSave);
          }
        } catch (e) {
          console.warn("Firebase sync missed, data saved locally:", e);
        }
      })();

      setIsEditingDetail(false); // Close editing mode after save
      alert("Hồ sơ đã được lưu giữ bản địa!");
    } catch (e) {
      console.error(e);
      handleWuxiaException(e, "lưu hồ sơ");
    }
  };

  const handleDetailAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (file && selectedCharacter) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setSelectedCharacter({ ...selectedCharacter, avatar: compressed });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteCharacter = async (id: string, name: string) => {
    if (!canDelete) return;
    if (!canDelete || !activeProjectId) return;
    setConfirmDialog({
      message: `Bạn có chắc muốn xóa nhân vật "${name}" khỏi giang hồ?`,
      onConfirm: async () => {
        try {
          // Optimistic Local State Updates first
          setCharacters(prev => {
            const updatedChars = prev.filter(c => {
               if (c.id && id) return c.id !== id;
               return c.name !== name;
            });
            localStorage.setItem(`ghl_characters_${activeProjectId}`, JSON.stringify(updatedChars));
            return updatedChars;
          });
          
          // Remove from factions locally
          const updatedFactions = JSON.parse(JSON.stringify(factions)); // deep copy instead of shallow to prevent mutating state directly
          let updatedAnyFaction = false;
          for (const f of updatedFactions) {
            if (f.members && f.members.some((m:any) => m.name === name || m.id === id)) {
              f.members = f.members.filter((m:any) => m.name !== name && m.id !== id);
              updatedAnyFaction = true;
            }
          }
          if (updatedAnyFaction) {
            setFactions(updatedFactions);
            localStorage.setItem(`ghl_factions_${activeProjectId}`, JSON.stringify(updatedFactions));
            if (viewingFaction) {
               const updatedViewingFaction = updatedFactions.find((f:any) => f.name === viewingFaction.name);
               if (updatedViewingFaction) setViewingFaction(updatedViewingFaction);
            }
          }

          setWeapons(prev => prev.map(w => w.owner === name ? { ...w, owner: '' } : w));
          setArtifacts(prev => prev.map(a => a.owner === name ? { ...a, owner: '' } : a));
          setEpisodes(prev => prev.filter(ep => ep.characterName !== name));
          
          setConfirmDialog(null); // Close dialog early

          // Remote Cloud Updates (may fail if quota is exceeded, but UI was already updated)
          // await deleteDoc(doc(db, `projects/${activeProjectId}/characters`, id));
          
          for (const f of updatedFactions) {
            // We re-check the original array here, or we can just update all factions that were updated
            const originalFaction = factions.find(o => o.name === f.name);
            if (originalFaction && originalFaction.members && originalFaction.members.length !== f.members.length) {
              // await setDoc(doc(db, `projects/${activeProjectId}/factions`, f.id || toSlug(f.name)), { members: f.members }, { merge: true }).catch(console.error);
            }
          }

          weapons.forEach(async w => {
            if (w.owner === name) {
              // await setDoc(doc(db, `projects/${activeProjectId}/weapons`, w.id as string), { owner: '' }, { merge: true }).catch(console.error);
            }
          });

          artifacts.forEach(async a => {
            if (a.owner === name) {
              // await setDoc(doc(db, `projects/${activeProjectId}/artifacts`, a.id as string), { owner: '' }, { merge: true }).catch(console.error);
            }
          });

          episodes.forEach(async ep => {
            if (ep.characterName === name) {
              // await deleteDoc(doc(db, `projects/${activeProjectId}/episodes`, String(ep.id))).catch(console.error);
            }
          });

        } catch (e) {
          console.error(e);
          handleWuxiaException(e, "đồng bộ hệ thống xóa bỏ nhân vật");
        }
      }
    });
  };

  const handleAddFaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert("Đại hiệp không có quyền hạn lập phái tại đây.");
      return;
    }
    if (!activeProjectId) {
      alert("Không tìm thấy mật phủ.");
      return;
    }
    if (!newFaction.name || !newFaction.description) {
      alert("Vui lòng nhập tên và miêu tả bang phái.");
      return;
    }
    
    try {
      let factionId = toSlug(newFaction.name);

      const factionData = {
        ...newFaction,
        id: factionId,
        projectId: activeProjectId
      };

      // Update state manually FIRST
      setFactions(prev => {
        const updated = [...prev];
        if (editingFactionIdx !== null) {
          updated[editingFactionIdx] = factionData as Faction;
        } else {
          updated.push(factionData as Faction);
        }
        localStorage.setItem(`ghl_factions_${activeProjectId}`, JSON.stringify(updated));
        return updated;
      });

      // Background Firebase update
      (async () => {
        try {
          if (editingFactionIdx !== null && newFaction.id) {
            const oldFactionId = newFaction.id;
            if (oldFactionId !== factionId) {
              // await deleteDoc(doc(db, `projects/${activeProjectId}/factions`, oldFactionId));
            }
          }
          // await setDoc(doc(db, `projects/${activeProjectId}/factions`, factionId), withCollaboration(factionData), { merge: true });
        } catch (e) {
          console.warn("Firebase sync missed, saved locally:", e);
        }
      })();

      alert(editingFactionIdx !== null ? "Môn phái đã được cập nhật bản địa." : "Môn phái đã được lập thám bản địa.");
      setNewFaction({ id: '', name: '', description: '', alignment: 'Chính phái', flagAvatar: '', leader: '' });
      setShowAddFaction(false);
      setEditingFactionIdx(null);
    } catch (e) {
      console.error(e);
      handleWuxiaException(e, "lập thám phái");
    }
  };

  const handleSaveFactionMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showFactionMemberModal || !canEdit || !activeProjectId) return;
    
    try {
      const fac = factions.find(f => f.name === showFactionMemberModal.factionName);
      if (!fac) return;
      
      const factionDocId = fac.id || toSlug(fac.name);
      let updatedMembers = fac.members ? [...fac.members] : [];
      
      const row = newFactionMember.row || 1;
      const targetY = newFactionMember.y ?? ((row - 0.5) * (100 / 8));

      let finalName = newFactionMember.name.trim();
      const charExists = characters.find(c => c.name.toLowerCase() === finalName.toLowerCase());
      if (charExists) {
        finalName = charExists.name;
      }

      if (showFactionMemberModal.memberIdx !== undefined) {
         updatedMembers[showFactionMemberModal.memberIdx] = { 
           ...updatedMembers[showFactionMemberModal.memberIdx], 
           ...newFactionMember,
           name: finalName,
           y: targetY
         };
      } else {
         const newMemberId = Date.now().toString();
         updatedMembers.push({
           id: newMemberId,
           name: finalName,
           role: newFactionMember.role,
           parentId: newFactionMember.parentId || null,
           row: row,
           x: newFactionMember.x ?? 50,
           y: targetY
         });
         
         if (!charExists && finalName) {
           const newCharId = toSlug(finalName);
           const newCharData = {
             name: finalName,
             faction: ['Chính phái', 'Tà phái', 'Trung lập'].includes(fac.alignment || '') ? fac.alignment : 'Trung lập',
             role: newFactionMember.role,
             past: "Được phát hiện gia nhập " + fac.name,
             avatar: '',
             projectId: activeProjectId
           };
           
           (async () => {
             try {
                // To actually save it on server, we should use setDoc directly since it's a new item
                await setDoc(doc(db, `projects/${activeProjectId}/characters`, newCharId), { ...newCharData, updatedAt: new Date().toISOString() }, { merge: true });
             } catch (e) {
                console.warn("Character sync failed, local only:", e);
             }
           })();
           
           setCharacters(prev => {
             // Avoid duplicate append
             if (prev.some(c => c.id === newCharId || c.name === finalName)) return prev;
             const updatedChars = [...prev, { ...newCharData, id: newCharId } as unknown as Character];
             localStorage.setItem(`ghl_characters_${activeProjectId}`, JSON.stringify(updatedChars));
             return updatedChars;
           });
         }
      }
      
      setFactions(prev => prev.map(f => f.id === factionDocId ? { ...f, members: updatedMembers } : f));
      if (viewingFaction && viewingFaction.id === factionDocId) {
        setViewingFaction({...viewingFaction, members: updatedMembers});
      }
      
      (async () => {
        try {
          await updateSubDoc('factions', factionDocId, { members: updatedMembers });
        } catch (e) {
          console.warn("Faction sync failed, local only:", e);
        }
      })();

      setShowFactionMemberModal(null);
      setNewFactionMember({name: '', role: '', parentId: '', row: 1});
    } catch(err) {
      console.error(err);
      alert("Thiên Cơ Các gặp trục trặc khi bố trí nhân lực.");
    }
  };


  const handleSuggestArtifactAI = async () => {
    if (!newArtifact.name) {
      alert('Vui lòng nhập tên bí bảo trước khi gọi AI gợi ý!');
      return;
    }
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        alert("Thiếu cấu hình GEMINI_API_KEY.");
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Hãy đóng vai một học giả uyên bác về truyện kiếm hiệp Kim Dung và Cổ Long.
Tên bí bảo/kỳ trân: "${newArtifact.name}"
Hãy gợi ý nguồn gốc xuất xứ (origin) và công dụng đặc biệt (effect) của bí bảo này dựa trên nguyên tác. Nếu tên này không có trong nguyên tác, hãy sáng tạo một cách logic theo phong cách kiếm hiệp.
TRẢ VỀ DUY NHẤT CHUỖI JSON THEO ĐỊNH DẠNG SAU, KHÔNG CÓ BẤT KỲ VĂN BẢN NÀO KHÁC:
{
  "origin": "nguồn gốc...",
  "effect": "công dụng..."
}`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      const text = response.text || '';
      let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonStr);
      setNewArtifact(prev => ({ ...prev, origin: data.origin || prev.origin, effect: data.effect || prev.effect }));
    } catch (e) {
      console.error(e);
    }
  };


  const handleAddWeapon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert("Đại hiệp không có quyền ghi danh thần binh tại đây.");
      return;
    }
    if (!activeProjectId) {
      alert("Không tìm thấy mật phủ.");
      return;
    }
    if (!newWeapon.name || !newWeapon.origin) {
      alert("Vui lòng điền tên và lai lịch của thần binh.");
      return;
    }
    
    try {
      const wepId = toSlug(newWeapon.name);

      const weaponToSave = {
        ...newWeapon,
        id: wepId,
        projectId: activeProjectId
      };

      // Update state manually FIRST
      setWeapons(prev => {
        const updated = [...prev];
        if (editingWeaponIdx !== null) {
          updated[editingWeaponIdx] = weaponToSave as any;
        } else {
          updated.push(weaponToSave as any);
        }
        localStorage.setItem(`ghl_weapons_${activeProjectId}`, JSON.stringify(updated));
        return updated;
      });

      // Background Firebase update
      (async () => {
        try {
          if (editingWeaponIdx !== null && newWeapon.id) {
            const oldWeaponId = newWeapon.id;
            if (oldWeaponId !== wepId) {
              // await deleteDoc(doc(db, `projects/${activeProjectId}/weapons`, oldWeaponId));
            }
          }
          // await setDoc(doc(db, `projects/${activeProjectId}/weapons`, wepId), withCollaboration(weaponToSave));
        } catch (e) {
          console.warn("Firebase sync missed, saved locally:", e);
        }
      })();

      alert(editingWeaponIdx !== null ? "Thần binh đã được cập nhật bản địa." : "Thần binh đã được ghi danh bản địa.");
      setNewWeapon({ id: '', name: '', origin: '', effect: '', avatar: '', owner: '' });
      setShowAddWeapon(false);
      setEditingWeaponIdx(null);
    } catch (e) {
      console.error(e);
      handleWuxiaException(e, "ghi danh vũ khí");
    }
  };

  const handleDeleteWeapon = async (id: string, name: string) => {
    if (!canDelete) return;
    if (!canDelete || !activeProjectId) return;
    setConfirmDialog({
      message: `Bạn có chắc chắn muốn hủy diệt vũ khí "${name}" khỏi võ lâm?`,
      onConfirm: async () => {
        // Update state manually FIRST
        setWeapons(prev => prev.filter(w => w.id !== id && w.name !== name));
        setConfirmDialog(null);

        try {
          // await deleteDoc(doc(db, `projects/${activeProjectId}/weapons`, id));
        } catch (error) {
          console.warn("Firebase sync failed, data deleted locally:", error);
        }
      }
    });
  };

  const handleAddArtifact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert("Đại hiệp không có quyền ghi danh bí bảo tại đây.");
      return;
    }
    if (!activeProjectId) {
      alert("Không tìm thấy mật phủ.");
      return;
    }
    if (!newArtifact.name || !newArtifact.origin) {
      alert("Vui lòng điền tên và lai lịch của bí bảo.");
      return;
    }
    
    try {
      const artId = toSlug(newArtifact.name);

      const artifactToSave = {
        ...newArtifact,
        id: artId,
        projectId: activeProjectId
      };

      // Update state manually FIRST
      setArtifacts(prev => {
        const updated = [...prev];
        if (editingArtifactIdx !== null) {
          updated[editingArtifactIdx] = artifactToSave as any;
        } else {
          updated.push(artifactToSave as any);
        }
        localStorage.setItem(`ghl_artifacts_${activeProjectId}`, JSON.stringify(updated));
        return updated;
      });

      // Background Firebase update
      (async () => {
        try {
          if (editingArtifactIdx !== null && newArtifact.id) {
            const oldArtifactId = newArtifact.id;
            if (oldArtifactId !== artId) {
              // await deleteDoc(doc(db, `projects/${activeProjectId}/artifacts`, oldArtifactId));
            }
          }
          // await setDoc(doc(db, `projects/${activeProjectId}/artifacts`, artId), withCollaboration(artifactToSave));
        } catch (e) {
          console.warn("Firebase sync missed, saved locally:", e);
        }
      })();

      alert(editingArtifactIdx !== null ? "Bí bảo đã được cập nhật bản địa." : "Bí bảo đã được ghi danh bản địa.");
      setNewArtifact({ id: '', name: '', origin: '', effect: '', avatar: '', abbreviation: '' });
      setShowAddArtifact(false);
      setEditingArtifactIdx(null);
    } catch (e) {
      console.error(e);
      handleWuxiaException(e, "ghi danh thần binh");
    }
  };

  const handleTabIconUpload = (tabId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEditUI) return;
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 100, 100, 0.6);
        setTabIcons(prev => ({ ...prev, [tabId]: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatIconUpload = (statId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEditUI) return;
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 100, 100, 0.6);
        setStatIcons(prev => ({ ...prev, [statId]: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAppLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEditUI) return;
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 200, 200, 0.7);
        setAppLogo(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteFaction = async (id: string, name: string) => {
    if (!canDelete) return;
    if (!canDelete || !activeProjectId) return;
    setConfirmDialog({
      message: `Bạn có chắc muốn giải tán bang phái "${name}"?`,
      onConfirm: async () => {
        // Update state manually FIRST
        setFactions(prev => prev.filter(f => f.id !== id && f.name !== name));
        setConfirmDialog(null);

        try {
          // await deleteDoc(doc(db, `projects/${activeProjectId}/factions`, id));
        } catch (e) {
          console.warn("Firebase sync failed, data deleted locally:", e);
        }
      }
    });
  };

  const handleDeleteArtifact = async (id: string, name: string) => {
    if (!canDelete) return;
    if (!canDelete || !activeProjectId) return;
    setConfirmDialog({
      message: `Bạn có chắc muốn tiêu hủy/xóa bỏ bí bảo "${name}"?`,
      onConfirm: async () => {
        // Update state manually FIRST
        setArtifacts(prev => prev.filter(a => a.id !== id && a.name !== name));
        setConfirmDialog(null);

        try {
          // await deleteDoc(doc(db, `projects/${activeProjectId}/artifacts`, id));
        } catch (e) {
          console.warn("Firebase sync failed, data deleted locally:", e);
        }
      }
    });
  };

  const handleGenerateScript = async (episode: Episode) => {
    if (!canEdit) return;
    setIsGenerating(true);
    setVideoPrompt(null);
    
    // Instead of AI, we aggregate the saved scene details (Phân đoạn)
    const episodesWithScenes = episode.scenes || [];
    if (episodesWithScenes.length > 0) {
      // Sort scenes by point order in summary to ensure correct sequence
    const fullScript = (episode.summary || []).map(point => {
        const scene = episodesWithScenes.find(s => s.point === point);
        if (scene) {
          return `【 ${point} 】\n\n${scene.content}`;
        }
        return `【 ${point} 】\n(Chưa có chi tiết cho phân đoạn này)`;
      }).join('\n\n---\n\n');
      
      setGeneratedScript(fullScript);
    } else {
      // Fallback to AI if no scenes exist, or just tell the user
      const script = await generateScriptSuggestion(episode, characters, factions);
      setGeneratedScript(script);
    }
    
    setIsGenerating(false);
    
    // Update episode status to detailed if it was draft
    if (episode.status === 'draft') {
      updateSubDoc('episodes', String(episode.id), { status: 'detailed' });
    }
  };

  const handleGenerateVideoPrompt = async (episode: Episode, content: string) => {
    if (!canEdit) return;
    setIsGeneratingVideoPrompt(true);
    setVideoPrompt(null);
    try {
      const prompt = await generateVideoPrompt(episode, content, characters);
      setVideoPrompt(prompt);
    } catch (e) {
      console.error(e);
      handleWuxiaException(e, "khởi tạo linh ảnh video");
    } finally {
      setIsGeneratingVideoPrompt(false);
    }
  };

  const handleGenerateSceneDetail = async (episode: Episode, point: string, pointIdx: number) => {
    if (!canEdit) return;
    setIsGeneratingScene(true);
    const detail = await generateSceneDetail(episode, point, characters);
    
    const updatedEpisodes = episodes.map(ep => {
      if (ep.id === episode.id) {
        const scenes = ep.scenes ? [...ep.scenes] : [];
        const existingIdx = scenes.findIndex(s => s.point === point);
        if (existingIdx !== -1) {
          scenes[existingIdx] = { ...scenes[existingIdx], content: detail };
        } else {
          scenes.push({ point, content: detail });
        }
        updateSubDoc('episodes', String(episode.id), { scenes });
        return { ...ep, scenes };
      }
      return ep;
    });
    
    setIsGeneratingScene(false);
  };

  const handleGenerateVideoPromptForScene = async (episode: Episode, scene: SceneDetail) => {
    if (!canEdit) return;
    const key = `${episode.id}-${scene.point}`;
    setIsGeneratingVideoPromptForScene(prev => ({ ...prev, [key]: true }));
    try {
      const prompt = await generateVideoPrompt(episode, scene.content, characters);
      const updatedEpisodes = episodes.map(ep => {
        if (ep.id === episode.id) {
          const scenes = ep.scenes ? [...ep.scenes] : [];
          const idx = scenes.findIndex(s => s.point === scene.point);
          if (idx !== -1) {
            scenes[idx] = { ...scenes[idx], videoPrompt: prompt };
            updateSubDoc('episodes', String(episode.id), { scenes });
          }
          return { ...ep, scenes };
        }
        return ep;
      });
      setEpisodes(updatedEpisodes);
    } catch (e) {
      console.error(e);
      handleWuxiaException(e, "khởi tạo linh ảnh video cho phân cảnh");
    } finally {
      setIsGeneratingVideoPromptForScene(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleMentionInput = (e: React.ChangeEvent<HTMLTextAreaElement>, epId: number, point: string) => {
    if (!canEdit) return;
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const atIndex = (typeof textBeforeCursor === 'string' ? textBeforeCursor : '').lastIndexOf('@');

    if (atIndex !== -1) {
      const textBeforeAt = textBeforeCursor.substring(0, atIndex).trim();
      const mentionedChar = characters.find(c => textBeforeAt.endsWith(c.name));
      const restText = textBeforeCursor.substring(atIndex + 1);
      
      // Only show suggestions if @ is at start of line or preceded by space, or if last word is a character name
      if (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ' || mentionedChar) {
        setMentionQuery(restText);
        setActiveMentionInput({ epId, point });
        
        let allItems: { name: string, avatar: string, type: string }[] = [];
        
        if (mentionedChar) {
          const skills = [
            ...mentionedChar.martialArtsBeginner.split('\n'),
            ...mentionedChar.martialArtsIntermediate.split('\n'),
            ...mentionedChar.martialArtsAdvanced.split('\n'),
            ...mentionedChar.martialArtsSpecial.split('\n')
          ].filter(s => s.trim() !== '');
          allItems = skills.map(s => ({ name: s.trim(), avatar: '', type: 'Chiêu Thức' }));
        } else {
          allItems = [
            ...characters.map(c => ({ name: c.name, avatar: c.avatar, type: 'Nhân Vật' })),
            ...artifacts.map(a => ({ name: a.name, avatar: a.avatar, type: 'Bí Bảo' })),
            ...factions.map(f => ({ name: f.name, avatar: f.flagAvatar, type: 'Bang Phái' }))
          ];
        }
        
        const filtered = allItems.filter(item => 
          item.name.toLowerCase().includes(restText.toLowerCase())
        ).slice(0, 5);
        
        setMentionSuggestions(filtered);
        
        const rect = e.target.getBoundingClientRect();
        setMentionPosition({ 
          top: rect.top + window.scrollY - 30, 
          left: rect.left + window.scrollX + Math.min(atIndex * 8, rect.width - 150)
        });
      } else {
        setActiveMentionInput(null);
      }
    } else {
      setActiveMentionInput(null);
    }
  };

  const insertMention = (item: { name: string, type: string }, epId: number, point: string) => {
    setEpisodes(prev => prev.map(ep => {
      if (ep.id === epId) {
        const scenes = ep.scenes ? [...ep.scenes] : [];
        const sceneIdx = scenes.findIndex(s => s.point === point);
        if (sceneIdx !== -1) {
          const content = scenes[sceneIdx].content;
          const atIdx = (typeof content === 'string' ? content : '').lastIndexOf('@');
          const replacement = item.type === 'Chiêu Thức' ? `${item.name} ` : `@${item.name} `;
          const newContent = (content || '').substring(0, atIdx) + replacement + (content || '').substring(atIdx + mentionQuery.length + 1);
          scenes[sceneIdx] = { ...scenes[sceneIdx], content: newContent };
        }
        return { ...ep, scenes };
      }
      return ep;
    }));
    setActiveMentionInput(null);
  };

  const handleSaveScene = (epId: number, point: string) => {
    if (!canEdit) return;
    if (!editingSceneId) return;
    setEpisodes(prev => prev.map(item => {
      if (item.id === epId) {
        const scenes = item.scenes ? [...item.scenes] : [];
        const sceneIdx = scenes.findIndex(s => s.point === point);
        if (sceneIdx !== -1) {
          scenes[sceneIdx] = { ...scenes[sceneIdx], content: editingSceneContent };
        }
        return { ...item, scenes };
      }
      return item;
    }));
    setEditingSceneId(null);
  };

  const onDragEnd = (result: any) => {
    if (!canEdit) return;
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === 'ARC') {
      const newArcs = [...arcs];
      const [movedArc] = newArcs.splice(source.index, 1);
      newArcs.splice(destination.index, 0, movedArc);
      
      // Map of old titles to new titles (with updated Phần numbers)
      const titleMapping: Record<string, string> = {};
      const updatedArcs = newArcs.map((arc, idx) => {
        const oldTitle = arc.title;
        const cleanTitle = oldTitle.replace(/^(Phần|Hồi|Chương)\s*\d+[:\s]*/i, '').trim().toUpperCase();
        const newTitle = `HỒI ${idx + 1}: ${cleanTitle}`;
        titleMapping[oldTitle] = newTitle;
        const updated = { ...arc, title: newTitle, order: idx };
        updateSubDoc('arcs', arc.id || toSlug(oldTitle), updated);
        return updated;
      });
      
      setArcs(updatedArcs);
      
      // Update episodes to use new arc titles
      setEpisodes(prev => prev.map(ep => ({
        ...ep,
        arc: titleMapping[ep.arc] || ep.arc
      })));
      
      // Update expanded arcs to use new titles
      setExpandedArcs(prev => prev.map(title => titleMapping[title] || title));
      
      return;
    }

    if (draggableId.startsWith('char-')) {
      // Character drag
      const draggedCharName = draggableId.replace('char-', '');
      const targetFaction = destination.droppableId as Character['faction'];
      
      setCharacters(prev => {
        const newChars = [...prev];
        const draggedIndex = newChars.findIndex(c => (c.id || c.name) === draggedCharName);
        if (draggedIndex === -1) return prev;

        const [movedChar] = newChars.splice(draggedIndex, 1);
        movedChar.faction = targetFaction;
        
        const charsInTargetFaction = newChars.filter(c => c.faction === targetFaction);
        
        let insertionIndex;
        if (destination.index >= charsInTargetFaction.length) {
          const lastIdx = newChars.map((c, i) => c.faction === targetFaction ? i : -1).reduce((a, b) => Math.max(a, b), -1);
          insertionIndex = lastIdx === -1 ? newChars.length : lastIdx + 1;
        } else {
          const targetChar = charsInTargetFaction[destination.index];
          insertionIndex = (targetChar && Array.isArray(newChars)) ? newChars.indexOf(targetChar) : newChars.length;
        }

        newChars.splice(insertionIndex, 0, movedChar);
        
        newChars.forEach((c, idx) => {
          c.order = idx;
          updateSubDoc('characters', c.id || toSlug(c.name), { faction: c.faction, order: idx });
        });
        
        return newChars;
      });
      return;
    }

    if (draggableId.startsWith('fac-')) {
      const draggedFactionIdName = draggableId.replace('fac-', '');
      const targetAlignment = destination.droppableId as Faction['alignment'];

      setFactions(prev => {
        const newFactions = [...prev];
        const draggedIndex = newFactions.findIndex(f => (f.id || f.name) === draggedFactionIdName);
        if (draggedIndex === -1) return prev;

        const [movedFaction] = newFactions.splice(draggedIndex, 1);
        movedFaction.alignment = targetAlignment;
        
        let newOrder = 0;
        const factionsInTarget = newFactions.filter(f => f.alignment === targetAlignment);
        
        let insertionIndex;
        if (destination.index >= factionsInTarget.length) {
          const lastIdx = newFactions.map((f, i) => f.alignment === targetAlignment ? i : -1).reduce((a, b) => Math.max(a, b), -1);
          insertionIndex = lastIdx === -1 ? newFactions.length : lastIdx + 1;
        } else {
          const targetFactionObj = factionsInTarget[destination.index];
          insertionIndex = (targetFactionObj && Array.isArray(newFactions)) ? newFactions.indexOf(targetFactionObj) : newFactions.length;
        }

        newFactions.splice(insertionIndex, 0, movedFaction);
        
        // Ensure ALL factions get updated order to keep consistency
        newFactions.forEach((f, idx) => {
          f.order = idx;
          updateSubDoc('factions', f.id || toSlug(f.name), { alignment: f.alignment, order: idx });
        });
        
        return newFactions;
      });
      return;
    }

    // Episode drag
    const draggedEpisodeId = parseInt(draggableId);
    const targetArcTitle = destination.droppableId;
    
    setEpisodes(prev => {
      const newEpisodes = [...prev];
      const draggedIndex = newEpisodes.findIndex(ep => ep.id === draggedEpisodeId);
      if (draggedIndex === -1) return prev;

      const [movedEpisode] = newEpisodes.splice(draggedIndex, 1);
      movedEpisode.arc = targetArcTitle;

      const episodesInTargetArc = newEpisodes.filter(ep => ep.arc === targetArcTitle);
      
      let insertionIndex;
      if (destination.index >= episodesInTargetArc.length) {
        const lastIdx = newEpisodes.map((ep, i) => ep.arc === targetArcTitle ? i : -1).reduce((a, b) => Math.max(a, b), -1);
        insertionIndex = lastIdx === -1 ? newEpisodes.length : lastIdx + 1;
      } else {
        const targetEp = episodesInTargetArc[destination.index];
        insertionIndex = (targetEp && Array.isArray(newEpisodes)) ? newEpisodes.indexOf(targetEp) : newEpisodes.length;
      }

      newEpisodes.splice(insertionIndex, 0, movedEpisode);
      return newEpisodes;
    });
  };

  const isUserEffectivelyLoggedIn = !!effectiveUid;

  const shouldShowLogin = (!isUserEffectivelyLoggedIn && authLoading === false) || 
    (isUserEffectivelyLoggedIn && activeProjectId && !canView && initialProjectLoaded && !quotaExceeded) ||
    (isUserEffectivelyLoggedIn && !activeProjectId && !quotaExceeded && authLoading === false);

  const isAppLoading = authLoading || (user && activeProjectId && !initialProjectLoaded && !quotaExceeded);

  const showLoginScreen = shouldShowLogin || (isUserEffectivelyLoggedIn && quotaExceeded && !initialProjectLoaded);

  if (isAppLoading) {
    return (
      <div className="fixed inset-0 bg-parchment flex items-center justify-center z-[9999]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-cinnabar" size={48} />
          <p className="font-display font-bold text-wood animate-pulse">Đang cảm ứng linh khí giang hồ...</p>
        </div>
      </div>
    );
  }
  
  if (showLoginScreen) {
    return (
      <div className="fixed inset-0 bg-scroll-inner flex items-center justify-center z-[9999] overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/parchment.png')]"></div>
        <div className="relative z-10 max-w-md w-full p-8 bg-white/80 backdrop-blur-xl border-4 border-gold shadow-2xl rounded-3xl text-center flex flex-col items-center gap-8">
           <div className={`w-24 h-24 ${quotaExceeded ? 'bg-amber-600' : 'bg-cinnabar'} rounded-2xl rotate-45 flex items-center justify-center shadow-2xl animate-bounce-slow`}>
              {quotaExceeded ? <AlertCircle className="text-white -rotate-45" size={48} /> : <Sword className="text-white -rotate-45" size={48} />}
           </div>
           
           <div>
             <h1 className="text-5xl font-display font-black text-ink tracking-tighter mb-2">GIANG HỒ LỤC</h1>
             <p className="text-wood/60 font-serif italic">Kế hoạch biên kịch, đồng bộ đa thiết bị</p>
           </div>

           <div className="w-full space-y-4">
             {quotaExceeded ? (
               <div className="space-y-4">
                 <div className="p-4 bg-amber-500/10 border-2 border-amber-500/20 rounded-2xl">
                   <h3 className="font-bold text-amber-700 mb-2">Linh Khí Cạn Kiệt</h3>
                   <p className="text-[11px] font-serif italic text-wood/80 leading-relaxed mb-2">
                     Linh khí (Firestore Quota) tại Thiên Cơ Các đã cạn vì có quá nhiều cao thủ cùng lúc truy cập. 
                     Mời đại hiệp tạm nghỉ ngơi, quay lại ngày mai để tiếp tục hành trình.
                   </p>
                   {quotaResetCountdown && (
                     <div className="bg-amber-100 text-amber-800 font-mono text-xs py-2 px-3 rounded-lg border border-amber-200 mt-2 mb-2 font-bold tracking-widest flex items-center justify-center gap-2">
                       <Clock size={14} /> Thời gian hồi phục: {quotaResetCountdown}
                     </div>
                   )}
                   <div className="mt-4 p-2 bg-black/5 rounded text-[9px] font-mono text-left text-wood/60">
                      Lỗi: Quota Limit Exceeded
                   </div>
                 </div>
                 <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all"
                >
                  <RotateCcw size={20} />
                  Thử Vận Lại (Reload)
                </button>
               </div>
             ) : !user ? (
                    <div className="w-full space-y-3">
                  <button 
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className={`w-full py-4 bg-cinnabar hover:bg-cinnabar-dark text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cinnabar/20 ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isLoggingIn ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                    {isLoggingIn ? 'Đang thỉnh cầu Thiên Cơ Các...' : 'Vào Sinh Ra Tử (Google Login)'}
                  </button>
                  <button 
                    onClick={() => {
                      setStorageMode('local');
                      const id = 'local-master';
                      const current = JSON.parse(localStorage.getItem('ghl_projects_list') || '[]');
                      if (!current.find((p:any) => p.id === id)) {
                         current.push({ id, title: 'Hồ Sơ Bản Địa', ownerId: 'local-hero' });
                         localStorage.setItem('ghl_projects_list', JSON.stringify(current));
                      }
                      setActiveProjectId(id);
                    }}
                    className="w-full py-3 bg-white/50 border-2 border-wood/20 text-wood hover:bg-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all text-sm"
                  >
                    <Smartphone size={18} />
                    Hành Tẩu Một Mình (Dùng Bản Địa)
                  </button>
                </div>
             ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto scroll-y-custom px-1 w-full">
                  {activeProjectId && !canView && (
                    <div className="p-4 bg-red-500/10 border-2 border-red-500/20 rounded-2xl text-left">
                      <h3 className="font-bold text-red-600 mb-2 whitespace-nowrap overflow-hidden text-ellipsis flex gap-2 items-center"><Lock size={16}/> Hành Tung Bất Định</h3>
                      <p className="text-[11px] font-serif italic text-wood/80 mb-3">
                        Huynh đài không có quyền truy cập thẻ môn phái này. Có thể Quản Sự đã thu hồi lệnh bài! Vui lòng trở về danh sách.
                      </p>
                      <button 
                         onClick={firebaseLogout}
                         className="w-full py-2.5 mt-2 bg-red-600 hover:bg-red-700 transition-colors text-white rounded-lg font-bold text-[11px] uppercase shadow flex justify-center items-center gap-2"
                      >Rời Khỏi</button>
                    </div>
                  )}
                  
                  {!activeProjectId && (
                     <div className="flex flex-col items-center justify-center py-8">
                         <Loader2 className="animate-spin text-cinnabar w-8 h-8 mb-4" />
                         <span className="text-sm font-serif italic text-wood">Đang tải hồ sơ...</span>
                     </div>
                  )}

                  <button 
                    onClick={() => handleLogout()}
                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all text-sm !mt-6 border border-red-500/20 group uppercase tracking-widest"
                  >
                    <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                    Cải Trang Dịch Dung
                  </button>
                </div>
             )}
             
             {!user && (
               <p className="text-[10px] text-wood/40 uppercase tracking-widest leading-loose">
                 Kết nối với Thiên Cơ Các để lưu trữ vĩnh viễn <br/> kịch bản của đại hiệp trên mây
               </p>
             )}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden text-ink relative bg-parchment" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')" }}>
      {quotaExceeded && (
        <div className="fixed top-0 left-0 right-0 z-[10001] bg-red-600 text-white py-1 px-4 text-[10px] flex items-center justify-between font-bold shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <AlertCircle size={12} />
            <span>LINH KHÍ CẠN KIỆT (QUOTA EXCEEDED): Một số tính năng có thể không hoạt động. Vui lòng quay lại sau 24h!</span>
          </div>
          <button onClick={() => setQuotaExceeded(false)} className="hover:text-white/70">✕</button>
        </div>
      )}
      
      {isAccessDenied && (
        <div className="fixed inset-0 z-[10000] bg-ink/95 backdrop-blur-md flex items-center justify-center p-6 text-center">
          <div className="bg-parchment p-8 rounded-2xl border-2 border-cinnabar/30 max-w-md shadow-2xl">
            <div className="w-16 h-16 bg-cinnabar/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="text-cinnabar" size={32} />
            </div>
            <h2 className="text-2xl font-display font-bold text-ink mb-4 italic">Hành Tung Bất Định</h2>
            <p className="text-wood/70 leading-relaxed mb-8">
              Huynh đài chưa nhận được lời mời tham gia dự án này. 
              Vui lòng liên hệ với Quản Sự (Admin) để được cấp quyền hành tẩu.
            </p>
            <button 
              onClick={() => firebaseLogout()}
              className="px-8 py-3 bg-cinnabar text-white font-bold rounded-full shadow-lg hover:bg-ink transition-all flex items-center justify-center gap-2 mx-auto"
            >
              Rời Khỏi
            </button>
          </div>
        </div>
      )}

      {quotaExceeded && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-cinnabar text-white px-4 py-2 text-center text-xs font-bold font-display shadow-lg animate-pulse flex items-center justify-center gap-2">
          <AlertCircle size={14} />
          <span>Linh khí cạn kiệt (Quota Firestore Exceeded). Một số tính năng sẽ tạm ngưng cho đến khi hồi phục (ngày mai).</span>
          <button onClick={() => setQuotaExceeded(false)} className="ml-4 opacity-50 hover:opacity-100"><X size={14} /></button>
        </div>
      )}
      {/* Background Decor Layer (optional) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#d1c0a8]/20 to-[#4a3629]/10 pointer-events-none z-0"></div>

      {/* Main Scroll Container */}
      <div id="app-container" className="flex w-full h-full relative z-10 overflow-hidden bg-white/5">
        
        {/* Sidebar Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className={`fixed top-4 left-4 z-40 p-3 bg-cinnabar text-white rounded-full shadow-lg hover:scale-110 transition-all active:scale-95 ${!isSidebarOpen ? 'block' : 'hidden'}`}
        >
          <GripVertical size={20} />
        </button>

        {/* Sidebar */}
        <aside 
          className={`relative inset-y-0 left-0 w-64 shrink-0 border-r border-[#8c6746] flex flex-col z-50 md:z-20 shadow-2xl md:shadow-[inset_-10px_0_20px_rgba(0,0,0,0.05)] border-y-0 transition-all duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '!translate-x-[-100%] !w-0 border-r-0 overflow-hidden'}`}
          style={{ 
            backgroundColor: sidebarBgImage ? 'transparent' : '#f4ead6' /* Using hardcoded bg-scroll-inner equivalent since background image overrides */ 
          }}
        >
          {sidebarBgImage && (
            <div 
              className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" 
              style={{ backgroundImage: `url(${sidebarBgImage})` }} 
            />
          )}
          <div className="absolute inset-0 bg-parchment/60 z-0"></div>
          
          <div className="p-3 sm:p-5 border-b border-gold/30 relative z-10 flex items-start justify-between">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-3 right-3 text-wood/40 hover:text-cinnabar transition-colors"
              title="Ẩn thanh bên"
            >
              <X size={18} />
            </button>
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center gap-3">
                <label className={`${(isAdmin || userRole === 'admin') ? 'cursor-pointer' : 'cursor-default group'} relative shrink-0`}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAppLogoUpload} 
                    disabled={!(isAdmin || userRole === 'admin')}
                  />
                  {appLogo ? (
                     <img src={appLogo} alt="Logo" className="w-8 h-8 object-cover rounded-sm border border-gold" />
                  ) : (
                     <div className="w-8 h-8 bg-cinnabar rounded-sm rotate-45 flex items-center justify-center shadow-md">
                       <Sword className="text-white -rotate-45" size={18} />
                     </div>
                  )}
                  {(isAdmin || userRole === 'admin') && (
                    <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-sm text-white">
                       <Upload size={12} />
                    </div>
                  )}
                </label>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-wood/80 font-serif mb-0.5 tracking-wider font-bold capitalize">
                    {currentTimeStr}
                  </div>
                  {isEditingTitle && (isAdmin || userRole === 'admin') ? (
                    <input
                      autoFocus
                      className="bg-white border border-gold rounded px-2 py-0.5 text-sm font-display font-bold w-full focus:outline-none focus:ring-1 focus:ring-cinnabar"
                      value={movieTitle}
                      onChange={(e) => setMovieTitle(e.target.value)}
                      onBlur={() => setIsEditingTitle(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                    />
                  ) : (
                    <h1 
                      onClick={() => (isAdmin || userRole === 'admin') && setIsEditingTitle(true)}
                      className={`text-lg font-display font-bold tracking-tight ${(isAdmin || userRole === 'admin') ? 'cursor-pointer hover:text-cinnabar' : 'cursor-default'} transition-colors truncate`}
                      title={(isAdmin || userRole === 'admin') ? "Nhấn để đổi tên phim" : ""}
                    >
                      {movieTitle}
                    </h1>
                  )}
                </div>
              </div>
              <p className="text-[9px] opacity-40 uppercase tracking-widest font-bold">Kế hoạch biên kịch</p>
              {canShare && (
                <button 
                  onClick={() => {
                    setShareEmail('');
                    setShowShareModal(true);
                  }}
                  className="mt-2 flex items-center gap-1.5 text-[10px] text-cinnabar/60 hover:text-cinnabar transition-colors font-bold uppercase tracking-widest"
                >
                  <Share2 size={12} /> Chia sẻ dự án
                </button>
              )}
            </div>
          </div>

          {/* Decorative month/date piece if wanted, skipping for now to rely on tabs */}
          <div className="px-6 py-4 flex justify-center hidden lg:flex">
             <div className="w-16 h-16 rounded-full border border-gold bg-pill-bg shadow-sm flex items-center justify-center flex-col relative text-wood">
                <span className="text-[10px] uppercase font-bold text-cinnabar/60 absolute -top-3 bg-scroll-inner px-1 border border-gold/30 rounded">Hôm nay</span>
                <span className="text-2xl font-display font-bold">{new Date().getDate()}</span>
             </div>
          </div>

          <nav className="flex-1 p-4 space-y-3 overflow-y-auto scroll-y-custom">
          {(() => {
            const desiredOrder = ['dashboard', 'episodes', 'world-map', 'factions', 'characters', 'weapons', 'artifacts', 'settings', 'updatesLog'];
            return [
              ...desiredOrder.filter(id => Object.keys(tabTitles).includes(id)),
              ...Object.keys(tabTitles).filter(id => !desiredOrder.includes(id) && !['side-stories', 'character-memories', 'about'].includes(id))
            ];
          })().map((tabId) => (
            <div key={tabId} className="space-y-1">
                 <NavItem 
                active={activeTab === tabId || (tabId === 'episodes' && (activeTab === 'side-stories' || activeTab === 'character-memories'))} 
                icon={
                  tabId === 'dashboard' ? <Compass size={20} /> :
                  tabId === 'episodes' ? <ScrollText size={20} /> :
                  tabId === 'world-map' ? <MapIcon size={20} /> :
                  tabId === 'characters' ? <Swords size={20} /> :
                  tabId === 'weapons' ? <Sword size={20} /> :
                  tabId === 'artifacts' ? <Gem size={20} /> :
                  tabId === 'settings' ? <Settings size={20} /> :
                  tabId === 'about' ? <Info size={20} /> :
                  tabId === 'updatesLog' ? <BookOpen size={20} /> :
                  <Castle size={20} />
                } 
                customIconUrl={tabIcons[tabId]}
                label={tabTitles[tabId]} 
                onClick={() => {
                  if (tabId === 'episodes') {
                    setIsEpisodesMenuOpen(!isEpisodesMenuOpen);
                    setActiveTab('episodes');
                  } else {
                    setActiveTab(tabId);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }
                }} 
                onEdit={(isAdmin || userRole === 'admin') ? () => setEditingTabId(tabId) : undefined}
                isEditing={(isAdmin || userRole === 'admin') && editingTabId === tabId}
                onLabelChange={(newLabel) => {
                  if (isAdmin || userRole === 'admin') setTabTitles({...tabTitles, [tabId]: newLabel});
                }}
                onStopEdit={() => setEditingTabId(null)}
                onRemove={(isAdmin || userRole === 'admin') ? () => {
                  const newTitles = { ...tabTitles };
                  delete newTitles[tabId];
                  setTabTitles(newTitles);
                  setEditingTabId(null);
                  if (activeTab === tabId) setActiveTab('dashboard');
                } : undefined}
              />
              
              {tabId === 'episodes' && isEpisodesMenuOpen && (
                <div className="space-y-2 mt-2 relative pl-8 pb-2">
                  <div className="absolute left-[2.2rem] top-0 bottom-0 w-px bg-gold/30 block"></div>
                  <div className="flex flex-col items-start gap-1">
                    <button 
                      onClick={() => {
                        setActiveTab('side-stories');
                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                      }}
                      className={`text-left pl-6 pr-4 py-3 transition-all flex items-center justify-between rounded-r-full border-l-2 ${activeTab === 'side-stories' ? 'bg-cinnabar/10 text-cinnabar border-cinnabar shadow-sm w-full' : 'text-ink/70 hover:text-cinnabar hover:bg-white/20 border-transparent inline-flex w-max'}`}
                    >
                      <span className="flex-1 flex items-center gap-2 text-sm font-serif tracking-wide truncate">
                        {tabIcons['side-stories'] ? (
                          <img src={tabIcons['side-stories']} className="w-5 h-5 object-cover rounded-sm border border-gold/30" />
                        ) : (
                          <Sparkles size={16} />
                        )}
                        {tabTitles['side-stories']}
                      </span>
                      {activeTab === 'side-stories' && <ChevronRight size={14} className="ml-2" />}
                    </button>
                    <button 
                      onClick={() => {
                        setActiveTab('character-memories');
                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                      }}
                      className={`text-left pl-6 pr-4 py-3 transition-all flex items-center justify-between rounded-r-full border-l-2 ${activeTab === 'character-memories' ? 'bg-cinnabar/10 text-cinnabar border-cinnabar shadow-sm w-full' : 'text-ink/70 hover:text-cinnabar hover:bg-white/20 border-transparent inline-flex w-max'}`}
                    >
                      <span className="flex-1 flex items-center gap-2 text-sm font-serif tracking-wide truncate">
                        {tabIcons['character-memories'] ? (
                          <img src={tabIcons['character-memories']} className="w-5 h-5 object-cover rounded-sm border border-gold/30" />
                        ) : (
                          <History size={16} />
                        )}
                        {tabTitles['character-memories']}
                      </span>
                      {activeTab === 'character-memories' && <ChevronRight size={14} className="ml-2" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gold/30 bg-white/5 relative z-10 flex flex-col gap-1.5">
          {canEdit ? (
            <div className="space-y-1">
                <button
                  onClick={handleManualSync}
                  disabled={!firebaseConnected || offlineMode || isSyncing || storageMode === 'local' || quotaExceeded}
                  className={`w-full py-1.5 bg-jade/90 text-white text-[9px] font-bold uppercase tracking-wider rounded border border-jade hover:bg-jade transition-all flex items-center justify-center gap-2 shadow-sm ${(!firebaseConnected || offlineMode || isSyncing || storageMode === 'local' || quotaExceeded) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                >
                  {tabIcons.uploadSuccess ? (
                    <div className="w-3 h-3 rounded-full overflow-hidden">
                        <img src={tabIcons.uploadSuccess} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    isSyncing ? <Loader2 className="animate-spin" size={12} /> : <Zap className="text-blue-200" size={12} />
                  )}
                  <span>{isSyncing ? `Đang Truyền (${syncPercentage}%)` : "Truyền Công"}</span>
                </button>
              
              {isSyncing && (
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-300" style={{ width: `${syncPercentage}%` }}></div>
                </div>
              )}

              {hasServerUpdate && !offlineMode && storageMode === 'cloud' && (
                <button
                  onClick={handleSyncPull}
                  disabled={!firebaseConnected || offlineMode || isSyncing || storageMode === 'local' || quotaExceeded}
                  className={`w-full py-1.5 bg-gold text-wood text-[9px] font-bold uppercase tracking-wider rounded border border-gold hover:bg-gold/80 transition-all flex items-center justify-center gap-2 shadow-sm mt-1 animate-bounce ${(!firebaseConnected || offlineMode || isSyncing || storageMode === 'local' || quotaExceeded) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                >
                  {tabIcons.downloadSuccess ? (
                    <div className="w-3 h-3 rounded-full overflow-hidden">
                        <img src={tabIcons.downloadSuccess} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <Download size={12} />
                  )}
                  <span>Lãnh Hội Tân Tri</span>
                </button>
              )}
              
              {(offlineMode || storageMode === 'local' || quotaExceeded) && (
                <div className="flex items-center gap-1 justify-center py-1 bg-cinnabar/10 rounded border border-cinnabar/20 animate-pulse">
                  <WifiOff size={10} className="text-cinnabar" />
                  <span className="text-[8px] font-bold text-cinnabar uppercase tracking-widest leading-none">
                    {offlineMode ? "Mất Tín Hiệu" : (quotaExceeded ? "Cạn Linh Khí" : "Bản Địa Mode")}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {hasServerUpdate && !offlineMode && storageMode === 'cloud' && (
                <button
                  onClick={handleDownload}
                  disabled={!firebaseConnected || offlineMode || isSyncing || storageMode === 'local' || quotaExceeded}
                  className={`w-full py-1.5 bg-gold text-wood text-[9px] font-bold uppercase tracking-wider rounded border border-gold hover:bg-gold/80 transition-all flex items-center justify-center gap-2 shadow-sm mb-1 animate-pulse ${(!firebaseConnected || offlineMode || isSyncing || storageMode === 'local' || quotaExceeded) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                >
                  <Download size={12} />
                  <span>Nhận Truyền Công</span>
                </button>
              )}
              {lastSyncedTime && (
                <p className="text-[8px] text-wood/60 text-center italic opacity-60">
                   Linh khí mây: {new Date(lastSyncedTime).toLocaleString('vi-VN')}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 p-1.5 bg-white/30 rounded border border-gold/10">
             <div className="flex items-center gap-1.5 min-w-0">
                {user?.photoURL ? <img src={user.photoURL} className="w-5 h-5 rounded-full border border-gold/50" /> : <div className="w-5 h-5 rounded-full border border-gold/50 bg-wood/10 flex items-center justify-center"><UserPlus size={10} className="text-wood/50" /></div>}
                <div className="flex flex-col min-w-0">
                  <span className="text-[7px] uppercase tracking-tighter opacity-50 font-bold -mb-0.5">
                    {user ? (isProjectOwner ? "Bản Chủ" : "Môn Khách") : "Khách Lãng Du"}
                  </span>
                  <p className="text-[9px] font-bold text-wood truncate font-sans">{user?.displayName || "Ẩn Danh"}</p>
                </div>
             </div>
             <div className="flex items-center gap-0.5">
               {canEditUI && (
                 <label className="cursor-pointer p-1 text-wood/40 hover:text-jade transition-colors" title="Thay Phông Nền">
                   <input 
                     type="file" 
                     accept="image/*" 
                     className="hidden" 
                     onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                         const reader = new FileReader();
                         reader.onloadend = async () => {
                           const compressed = await compressImage(reader.result as string, 1200, 1200, 0.6);
                           setSidebarBgImage(compressed);
                         };
                         reader.readAsDataURL(file);
                       }
                     }} 
                   />
                   <Camera size={12} />
                 </label>
               )}
               {user ? (
                 <div className="flex gap-1 items-center">
                   <button 
                     onClick={handleLogout}
                     className="px-2 py-1 flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded border border-red-500/20 transition-all font-bold group"
                     title="Cải Trang Dịch Dung"
                   >
                     <span className="text-[10px] uppercase tracking-wider">Dịch Dung</span>
                     <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                   </button>
                 </div>
               ) : (
                 <button 
                   onClick={handleLogin}
                   disabled={isLoggingIn}
                   className={`p-1 text-wood/40 hover:text-jade transition-colors ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                   title="Đăng nhập"
                 >
                   {isLoggingIn ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                 </button>
               )}
             </div>
          </div>
          
          <div className="flex items-center justify-between px-1 opacity-30">
            <span className="text-[8px] font-bold text-wood uppercase tracking-widest">{CURRENT_VERSION}</span>
            {lastSyncedTime && isProjectOwner && (
              <span className="text-[8px] text-wood font-bold">
                {lastSyncedTime.split(' ')[1]}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        id="main-content"
        className="flex-1 overflow-y-auto scroll-y-custom grid-bg-pattern min-w-0 relative"
        onScroll={(e) => {
          setShowBackToTop(e.currentTarget.scrollTop > 300);
        }}
      >
        {quotaExceeded && (
          <div className="sticky top-0 left-0 right-0 z-[60] bg-amber-50 border-b border-amber-200 p-2 text-[10px] sm:text-xs text-amber-800 flex items-center justify-center gap-2 shadow-md flex-wrap">
            <AlertTriangle size={14} className="text-amber-500" />
            <span>Chân khí cạn kiệt (Quota Firestore đã hết hạn). Hệ thống tự chuyển sang <b>Tàng Trữ Bản Địa (Offline)</b>. Bạn vẫn có thể tiếp tục sáng tác!</span>
            {quotaResetCountdown && (
              <span className="bg-amber-200 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold border border-amber-300">
                Hồi phục sau: {quotaResetCountdown}
              </span>
            )}
            <button onClick={() => setQuotaExceeded(false)} className="ml-2 px-2 py-0.5 bg-amber-200 rounded hover:bg-amber-300 transition-colors uppercase font-bold text-[8px]">Ẩn</button>
          </div>
        )}
        <div className={`mx-auto transition-all duration-300 w-full ${!isSidebarOpen ? 'max-w-full p-2 sm:p-4 lg:p-8' : 'max-w-full lg:max-w-7xl p-2 sm:p-4 md:p-6 lg:p-10'}`}>
          <AnimatePresence mode="wait">
            {/* Thất Đại Thành Thị & 14 Thôn Trấn */}
            {activeTab === 'world-map' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-4xl font-display font-medium text-emerald-600 brush-stroke inline-block">{tabTitles['world-map'] || 'Thất Đại Thành Thị'}</h2>
                    <p className="text-sm text-wood/60 font-serif italic mt-1">Khám phá thế giới võ lâm rộng lớn qua 7 thành thị và 14 thôn trấn</p>
                  </div>
                </div>

                <div className="space-y-12">
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200">
                        <Castle size={20} />
                      </div>
                      <h3 className="text-2xl font-display text-emerald-800">7 Đại Thành Thị</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {worldLocations.filter(loc => loc.type === 'city').map((city, idx) => (
                        <motion.div
                          key={city.name}
                          onClick={() => setViewingLocation(city)}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-gold/20 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                        >
                          <div className="flex gap-4">
                            <div className="relative w-20 h-20 flex-shrink-0">
                              <img 
                                src={city.avatar || `https://image.pollinations.ai/prompt/ancient%20chinese%20city%20${city.name}%20wuxia%20icon?nologo=true&width=512&height=512`}
                                alt={city.name}
                                className="w-full h-full object-cover rounded-xl border-2 border-emerald-100 group-hover:border-emerald-400 transition-colors"
                              />
                              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Thành</div>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-emerald-900 group-hover:text-emerald-600 transition-colors">{city.name}</h4>
                              <p className="text-sm text-wood/80 line-clamp-3 italic mt-1 leading-relaxed">{city.description}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 border border-amber-200">
                        <MapIcon size={20} />
                      </div>
                      <h3 className="text-2xl font-display text-amber-800">14 Thôn Trấn</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {worldLocations.filter(loc => loc.type === 'village').map((village, idx) => (
                        <motion.div
                          key={village.name}
                          onClick={() => setViewingLocation(village)}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + idx * 0.03 }}
                          className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-gold/10 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                        >
                          <div className="flex gap-3 items-center mb-2">
                            <img 
                              src={village.avatar || `https://image.pollinations.ai/prompt/ancient%20chinese%20village%20${village.name}%20wuxia%20icon?nologo=true&width=512&height=512`}
                              alt={village.name}
                              className="w-10 h-10 object-cover rounded-lg border border-amber-100 group-hover:border-amber-400 transition-colors"
                            />
                            <h4 className="text-base font-bold text-amber-900 group-hover:text-amber-600 transition-colors">{village.name}</h4>
                          </div>
                          <p className="text-xs text-wood/70 italic line-clamp-2 leading-relaxed">{village.description}</p>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                </div>
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 bg-white/40 p-4 sm:p-0 rounded-2xl sm:rounded-none border sm:border-0 border-gold/20 mb-6 sm:mb-12">
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className={`relative ${(isAdmin || userRole === 'admin') ? 'group cursor-pointer' : 'cursor-default'} shrink-0`}>
                      {(isAdmin || userRole === 'admin') && <input type="file" id="upload-tab-dashboard" accept="image/*" className="hidden" onChange={(e) => handleTabIconUpload('dashboard', e)} />}
                      <label htmlFor={(isAdmin || userRole === 'admin') ? "upload-tab-dashboard" : undefined} className={`w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white border sm:border-2 border-gold shadow-md flex items-center justify-center overflow-hidden ${(isAdmin || userRole === 'admin') ? 'cursor-pointer' : ''}`}>
                        {tabIcons['dashboard'] ? (
                          <img src={tabIcons['dashboard']} className="w-full h-full object-cover" />
                        ) : (
                          <LayoutDashboard className="text-gold/50 w-6 h-6 sm:w-8 sm:h-8" />
                        )}
                        {(isAdmin || userRole === 'admin') && (
                          <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera size={16} />
                          </div>
                        )}
                      </label>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-4xl font-display font-medium text-cinnabar brush-stroke inline-block">
                        {tabTitles.dashboard}
                      </h2>
                       <p className="text-stone-500 mt-0.5 sm:mt-2 font-serif italic text-[10px] sm:text-sm">Tổng quan kế hoạch biên soạn kịch bản.</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-1 w-full sm:w-auto">
                    {/* Always show "Nhận truyền công" (Download) */}
                    <button 
                      disabled={!firebaseConnected || offlineMode || isSyncing || storageMode === 'local' || quotaExceeded}
                      onClick={async () => {
                        try {
                          setQuotaExceeded(false); // Reset state to try again
                          await fetchProjectDocData(true);
                          await fetchUIConfigData(true);
                          await fetchEssentialData(true);
                          await fetchSecondaryData(true);
                          if (activeProjectId && user && canEdit) {
                              await addDoc(collection(db, `projects/${activeProjectId}/updates`), {
                                  timestamp: serverTimestamp(),
                                  message: "Đã nhận truyền công (tải về dữ liệu từ thiên vân)",
                                  type: "download",
                                  projectId: activeProjectId,
                                  ownerId: user.uid
                              });
                              await fetchUpdatesLog(activeProjectId);
                          }
                          alert('Tuyệt kỹ đã được tải về. Bây giờ bạn có thể tu luyện (xem) offline.');
                        } catch (e: any) {
                          alert(`Gặp khó khăn khi Nhận Truyền Công (Cần kết nối tiên giới / internet): ${e.message}`);
                        }
                      }}
                      className={`w-full sm:w-auto bg-jade text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg hover:bg-ink transition-all flex items-center justify-center gap-2 ${(!firebaseConnected || offlineMode || isSyncing || storageMode === 'local' || quotaExceeded) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                    >
                      {tabIcons.downloadSuccess ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full overflow-hidden">
                          <img src={tabIcons.downloadSuccess} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <History size={16} />
                      )}
                      Nhận Truyền Công
                    </button>

                    {/* Show "Truyền công" (Upload) only if Editor/Admin */}
                    {canEdit && (
                      <button 
                        onClick={handleUpload}
                        disabled={!firebaseConnected || offlineMode || isSyncing || storageMode === 'local' || quotaExceeded}
                        className={`w-full sm:w-auto bg-amber-600 text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg hover:bg-amber-800 transition-all flex items-center justify-center gap-2 mt-2 ${(!firebaseConnected || offlineMode || isSyncing || storageMode === 'local' || quotaExceeded) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                      >
                        {tabIcons.uploadSuccess ? (
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full overflow-hidden">
                            <img src={tabIcons.uploadSuccess} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <Zap size={16} className={`text-blue-300 ${isSyncing ? "animate-pulse" : ""}`} />
                        )}
                        {isSyncing ? `Đang Truyền (${syncPercentage}%)` : "Truyền Công"}
                      </button>
                    )}
                    {lastSyncedTime && (
                      <span className="text-[8px] sm:text-[10px] font-mono text-gold/60 italic w-full sm:w-auto text-center sm:text-right">
                        Cập nhật: {lastSyncedTime}
                      </span>
                    )}
                  </div>
                </header>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
                  {/* Biểu đồ Tập Chi Tiết */}
                  <div className="col-span-1 md:col-span-1 bg-white rounded-lg md:rounded-2xl border border-gold/40 shadow-sm flex flex-col items-center justify-center p-1 md:p-4 relative overflow-hidden h-20 sm:h-auto">
                    <h4 className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-cinnabar uppercase tracking-widest mb-1 text-center">Tập Chi Tiết</h4>
                    <div className="h-8 sm:h-14 md:h-24 w-full max-w-[40px] sm:max-w-[80px] md:max-w-[100px] mx-auto relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={[
                              { name: 'Đã Có kịch bản', value: stats.detailedEpisodes, fill: '#E63946' },
                              { name: 'Chưa Có', value: Math.max(0, stats.totalEpisodes - stats.detailedEpisodes), fill: '#F5E6D3' }
                            ]} 
                            dataKey="value" 
                            innerRadius={window.innerWidth < 640 ? 12 : 20} 
                            outerRadius={window.innerWidth < 640 ? 18 : 35} 
                            stroke="none"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[7px] md:text-[10px] font-bold uppercase tracking-widest mt-1"><span className="text-cinnabar text-[9px] md:text-sm">{stats.detailedEpisodes}</span><span className="hidden sm:inline"> / {stats.totalEpisodes} Tập</span></p>
                  </div>

                  {/* Biểu đồ Tiến Độ */}
                  <div className="col-span-1 md:col-span-1 bg-white rounded-lg md:rounded-2xl border border-gold/40 shadow-sm flex flex-col items-center justify-center p-1 md:p-4 relative overflow-hidden h-20 sm:h-auto">
                    <h4 className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-jade uppercase tracking-widest mb-1 text-center">Tiến Độ</h4>
                    <div className="h-8 sm:h-14 md:h-24 w-full max-w-[40px] sm:max-w-[80px] md:max-w-[100px] mx-auto relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={[
                              { name: 'Hoàn Thành', value: stats.progress, fill: '#2A9D8F' },
                              { name: 'Còn Lại', value: 100 - stats.progress, fill: '#F5E6D3' }
                            ]} 
                            dataKey="value" 
                            innerRadius={window.innerWidth < 640 ? 12 : 20} 
                            outerRadius={window.innerWidth < 640 ? 18 : 35} 
                            stroke="none"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[7px] md:text-[10px] font-bold uppercase tracking-widest mt-1"><span className="text-jade text-[9px] md:text-sm">{stats.progress}%</span></p>
                  </div>

                  {/* Tập Phát Triển Khai */}
                  <div className="col-span-1 md:col-span-1">
                    <StatCard 
                      id="stat_plot"
                      label="Triển Khai" 
                      value="Ghi nhận" 
                      subtext={stats.latestPlot} 
                      hideIcon
                      compact
                    />
                  </div>

                  {/* Bí Bảo Giang Hồ */}
                  <div className="col-span-1 md:col-span-1">
                    <StatCard 
                      id="stat_artifacts"
                      label="Bí Bảo" 
                      value={stats.discoveredArtifacts} 
                      subtext="Vật phẩm" 
                      hideIcon
                      compact
                    />
                  </div>

                  {/* NV Đã Xuất Hiện */}
                  <div className="col-span-1 md:col-span-1">
                    <StatCard 
                      id="stat_appeared"
                      label="NV Đã Có" 
                      value={stats.appearedCharacters} 
                      subtext="Hiện diện" 
                      hideIcon
                      compact
                    />
                  </div>

                  {/* NV Chưa Xuất Hiện */}
                  <div className="col-span-1 md:col-span-1">
                    <StatCard 
                      id="stat_upcoming"
                      label="NV Mới" 
                      value={stats.upcomingCharacters} 
                      subtext="Kế hoạch" 
                      hideIcon
                      compact
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mt-6 sm:mt-12">
                  <section className="lg:col-span-2 space-y-4 sm:space-y-8">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-xl border border-gold relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 text-cinnabar">
                        <ScrollText size={160} className="hidden sm:block" />
                        <ScrollText size={80} className="sm:hidden" />
                      </div>
                      <h3 className="text-lg sm:text-2xl font-display font-bold mb-4 sm:mb-8 flex items-center gap-2 sm:gap-3 text-ink">
                        <ScrollText className="text-cinnabar w-5 h-5 sm:w-6 sm:h-6" /> Chương mới nhất
                      </h3>
                      <div className="space-y-4 sm:space-y-6 relative ml-4 font-serif">
                        <div className="absolute left-[-17px] top-2 bottom-2 w-0.5 bg-gold/30"></div>
                        {arcs.map((arc, idx) => (
                          <div key={idx} className="relative group">
                            <div className="absolute left-[-22px] top-1.5 w-3 h-3 rounded-full bg-parchment border-2 border-cinnabar group-hover:scale-125 transition-transform"></div>
                            <div className="bg-parchment/40 p-3 sm:p-5 rounded-xl border border-gold/30 hover:border-cinnabar/30 transition-all cursor-pointer" onClick={() => setActiveTab('episodes')}>
                              <div className="flex justify-between items-start sm:items-center mb-1 sm:mb-3">
                                <h4 className="font-display font-bold text-sm sm:text-lg text-ink group-hover:text-cinnabar transition-colors uppercase truncate mr-2">{arc.title}</h4>
                                <span className="text-[8px] sm:text-[10px] font-bold text-cinnabar bg-cinnabar/5 px-1.5 sm:px-2 py-0.5 rounded uppercase tracking-widest whitespace-nowrap">{(arc.episodes || []).length} tập</span>
                              </div>
                              {arc.keyPoints && (
                                <div className="flex flex-wrap gap-1 sm:gap-2 mt-1 sm:mt-2">
                                  {arc.keyPoints.map((point, pIdx) => (
                                    <span key={pIdx} className="text-[8px] sm:text-[10px] bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-gold/20 text-wood italic">● {point}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gold">
                        <h4 className="text-xs sm:text-sm font-display font-bold mb-3 sm:mb-4 flex items-center gap-2 text-jade">
                          <Users size={16} sm:size={18} /> Nhân Vật Hiện Diện
                        </h4>
                        <div className="space-y-2 sm:space-y-3 max-h-[200px] sm:max-h-[300px] overflow-y-auto pr-2 scroll-y-custom">
                          {characters.filter(c => c.status === 'appeared').map((c, i) => (
                            <div key={i} className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-parchment/30 rounded-lg">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden border border-gold/30">
                                {c.avatar ? <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" /> : <Users size={12} className="text-wood/40" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] sm:text-xs font-bold text-ink truncate">{c.name}</p>
                                <p className="text-[8px] sm:text-[10px] text-wood opacity-60 italic truncate">{c.role}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gold">
                        <h4 className="text-xs sm:text-sm font-display font-bold mb-3 sm:mb-4 flex items-center gap-2 text-cinnabar">
                          <Sparkles size={16} sm:size={18} /> Nhân Vật Mới
                        </h4>
                        <div className="space-y-2 sm:space-y-3 max-h-[200px] sm:max-h-[300px] overflow-y-auto pr-2 scroll-y-custom">
                          {characters.filter(c => c.status === 'upcoming').map((c, i) => (
                            <div key={i} className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-parchment/30 rounded-lg">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-cinnabar/5 flex items-center justify-center overflow-hidden border border-cinnabar/10">
                                {c.avatar ? <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" /> : <Users size={12} className="text-cinnabar/30" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] sm:text-xs font-bold text-ink truncate">{c.name}</p>
                                <p className="text-[8px] sm:text-[10px] text-wood opacity-60 italic truncate">{c.role}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {canEdit && (
                  <div className="space-y-4 sm:space-y-8">
                    <section className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl border border-gold flex flex-col relative overflow-hidden">
                      <div className="absolute -bottom-4 -right-4 opacity-5 rotate-12">
                        <Sparkles size={80} className="hidden sm:block" />
                        <Sparkles size={40} className="sm:hidden" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-display font-bold mb-4 sm:mb-6 flex items-center gap-2 text-ink">
                        <Sparkles className="text-cinnabar w-4 h-4 sm:w-5 sm:h-5" /> Chấp Bút AI
                      </h3>
                      <div className="bg-parchment p-4 sm:p-6 rounded-lg italic text-wood text-xs sm:text-sm border-l-4 border-cinnabar leading-relaxed mb-4 sm:mb-6 font-serif">
                        Sử dụng Gemini 1.5 Flash để phác thảo diễn biến, phân cảnh một cách nhanh chóng và khơi nguồn cảm hứng.
                      </div>
                      <button 
                        onClick={() => setActiveTab('episodes')}
                        className="w-full py-3 sm:py-4 bg-cinnabar text-white font-bold rounded-full text-xs sm:text-sm hover:bg-ink transition-all shadow-lg shadow-cinnabar/20 flex items-center justify-center gap-2"
                      >
                        <PenTool size={16} sm:size={18} /> Phác Thảo Kịch Bản
                      </button>
                    </section>

                    <section className="bg-sand p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gold/50 border-dashed">
                      <h4 className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-wood opacity-50 mb-3 sm:mb-4">Ghi chú</h4>
                      <ul className="space-y-2 sm:space-y-3 text-[10px] sm:text-xs text-ink/80 font-serif italic">
                        <li className="flex gap-2"><span className="text-cinnabar">●</span> Hoàn thiện Hồi 1 trước khi sang Hồi 2.</li>
                        <li className="flex gap-2"><span className="text-cinnabar">●</span> Đảm bảo nhất quán tính cách nhân vật.</li>
                      </ul>
                    </section>
                  </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 sm:space-y-8 p-4"
              >
                <h2 className="text-xl sm:text-4xl font-display font-medium text-amber-600 brush-stroke inline-block">Giang Hồ Lục Ký</h2>
                <div className="bg-white/40 p-4 sm:p-6 rounded-2xl border border-gold/20 shadow-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {aboutContent}
                </div>
              </motion.div>
            )}

            {activeTab === 'updatesLog' && (
              <motion.div
                key="updatesLog"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 sm:space-y-8 p-4"
              >
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className={`relative ${canEditUI ? 'group cursor-pointer' : 'cursor-default'} shrink-0`}>
                      {canEditUI && (
                        <input 
                          type="file" 
                          id="upload-tab-updatesLog" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleTabIconUpload('updatesLog', e)} 
                        />
                      )}
                      <label 
                        htmlFor={canEditUI ? "upload-tab-updatesLog" : undefined} 
                        className={`w-12 h-12 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-amber-500 shadow-md flex items-center justify-center overflow-hidden ${canEditUI ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        {tabIcons.updatesLog ? (
                          <img src={tabIcons.updatesLog} alt="Tab Icon" className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="text-amber-500/50" size={32} />
                        )}
                        {canEdit && (
                          <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera size={20} />
                          </div>
                        )}
                      </label>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-4xl font-display font-medium text-amber-500 brush-stroke inline-block">{tabTitles.updatesLog}</h2>
                      <p className="text-[#8c6746]/60 mt-1 sm:mt-2 font-serif italic text-xs sm:text-sm">Lịch sử biến động và phát triển của môn phái.</p>
                    </div>
                  </div>
                </header>
                <div className="bg-white/40 p-4 sm:p-6 rounded-2xl border border-gold/20 shadow-sm space-y-4">
                  {updatesLog.length > 0 ? updatesLog.map(update => (
                    <div key={update.id} className="border-b border-gold/20 pb-3">
                      <p className="text-amber-900 text-sm font-bold">
                        {(() => {
                           const t = update.timestamp;
                           if (!t) return new Date().toLocaleString('vi-VN');
                           if (t.seconds) return new Date(t.seconds * 1000).toLocaleString('vi-VN');
                           if (typeof t.toMillis === 'function') return new Date(t.toMillis()).toLocaleString('vi-VN');
                           if (typeof t === 'number') return new Date(t).toLocaleString('vi-VN');
                           if (typeof t === 'string' && !isNaN(Date.parse(t))) return new Date(t).toLocaleString('vi-VN');
                           return new Date().toLocaleString('vi-VN');
                        })()}
                      </p>
                      <p className="text-stone-700 text-base">{update.message}</p>
                    </div>
                  )) : <p className="text-stone-500 italic">Chưa có lịch sử cập nhật.</p>}
                </div>
              </motion.div>
            )}
            {activeTab === 'episodes' && (
              <motion.div
                key="episodes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 sm:space-y-8"
              >
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white/40 p-4 sm:p-0 rounded-2xl sm:rounded-none border sm:border-0 border-gold/20">
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className={`relative ${canEditUI ? 'group cursor-pointer' : 'cursor-default'} shrink-0`}>
                      <input 
                        type="file" 
                        id="upload-tab-episodes" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleTabIconUpload('episodes', e)} 
                        disabled={!canEditUI}
                      />
                      <label htmlFor={canEditUI ? "upload-tab-episodes" : ""} className={`w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white border sm:border-2 border-gold shadow-md flex items-center justify-center overflow-hidden ${canEditUI ? 'cursor-pointer' : ''}`}>
                        {tabIcons['episodes'] ? (
                          <img src={tabIcons['episodes']} className="w-full h-full object-cover" />
                        ) : (
                          <ScrollText className="text-gold/50 w-6 h-6 sm:w-8 sm:h-8" />
                        )}
                        {canEditUI && (
                          <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera size={16} />
                          </div>
                        )}
                      </label>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-4xl font-display font-medium text-cinnabar brush-stroke inline-block">{tabTitles.episodes}</h2>
                      <p className="text-stone-500 mt-0.5 sm:mt-2 font-serif italic text-[10px] sm:text-sm">Diễn biến chi tiết kịch bản theo hồi.</p>
                    </div>
                  </div>
                  {canEdit && (
                    <button 
                      onClick={() => setShowAddArcModal(true)}
                      className="w-full sm:w-auto bg-cinnabar text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg hover:bg-ink transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Thêm Hồi Phim
                    </button>
                  )}
                </header>

                <div className="space-y-4 sm:space-y-6">
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="arcs-list" type="ARC">
                      {(providedMain) => (
                        <div 
                          {...providedMain.droppableProps} 
                          ref={providedMain.innerRef} 
                          className="space-y-4 sm:space-y-6"
                        >
                          {arcs.map((arc, arcIdx) => {
                            const isArcExpanded = expandedArcs.includes(arc.title);
                            const arcEpisodes = episodes.filter(ep => ep.arc === arc.title);
                            const DraggableArc = Draggable as any;
                            
                            return (
                              <DraggableArc key={`arc-${arcIdx}`} draggableId={`arc-${arcIdx}`} index={arcIdx} isDragDisabled={!canEdit}>
                                {(providedArc: any) => (
                                  <div 
                                    ref={providedArc.innerRef}
                                    {...providedArc.draggableProps}
                                    className="bg-white rounded-2xl sm:rounded-3xl border border-gold shadow-md overflow-hidden transition-all duration-500"
                                  >
                                    <div className="flex items-center">
                                      {canEdit && (
                                        <div 
                                          {...providedArc.dragHandleProps}
                                          className="px-2 sm:px-4 py-6 sm:py-8 cursor-grab hover:text-cinnabar transition-colors text-gold/50 flex-shrink-0"
                                          title="Kéo"
                                        >
                                          <GripVertical size={20} sm:size={24} />
                                        </div>
                                      )}
                                      
                                      <div 
                                        onClick={() => {
                                          setExpandedArcs(prev => 
                                            prev.includes(arc.title) ? prev.filter(t => t !== arc.title) : [...prev, arc.title]
                                          );
                                        }}
                                        className={`flex-1 flex items-center justify-between p-4 sm:p-8 pl-0 transition-colors cursor-pointer relative ${isArcExpanded ? 'bg-sand/30 border-b border-gold/20' : 'hover:bg-sand/10'}`}
                                      >
                                        {arc.coverImage && (
                                          <div 
                                            className="absolute inset-0 z-0 opacity-40 bg-cover bg-center pointer-events-none" 
                                            style={{ backgroundImage: `url(${arc.coverImage})` }} 
                                          />
                                        )}
                                        <div className="flex flex-1 items-center gap-3 sm:gap-6 text-left relative z-10 w-full min-w-0">
                                          <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 transition-all duration-500 flex-shrink-0 ${isArcExpanded ? 'bg-cinnabar border-cinnabar text-white scale-110 shadow-lg shadow-cinnabar/30' : 'border-gold text-wood bg-white/80'}`}>
                                            <span className="font-display font-bold text-base sm:text-xl">{arcIdx + 1}</span>
                                          </div>
                                           <div className="min-w-0 flex-1">
                                             {editingArcId === `arc-${arcIdx}` ? (
                                               <input
                                                 autoFocus
                                                 className="bg-white border border-gold rounded px-2 py-1 text-sm sm:text-lg font-display font-bold w-full focus:outline-none focus:ring-1 focus:ring-cinnabar"
                                                 value={editingArcTitle}
                                                 onChange={(e) => setEditingArcTitle(e.target.value)}
                                                 onBlur={() => {
                                                   if (editingArcTitle.trim()) {
                                                     updateSubDoc('arcs', arc.id || toSlug(arc.title), { title: editingArcTitle.toUpperCase() });
                                                   }
                                                   setEditingArcId(null);
                                                 }}
                                                 onKeyDown={(e) => {
                                                   if (e.key === 'Enter') {
                                                     if (editingArcTitle.trim()) {
                                                       updateSubDoc('arcs', arc.id || toSlug(arc.title), { title: editingArcTitle.toUpperCase() });
                                                     }
                                                     setEditingArcId(null);
                                                   }
                                                 }}
                                                 onClick={(e) => e.stopPropagation()}
                                               />
                                             ) : (
                                              <div className="flex items-center gap-2 group/arc flex-1">
                                                <h3 
                                                  onDoubleClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingArcId(`arc-${arcIdx}`);
                                                    setEditingArcTitle(arc.title);
                                                  }}
                                                  className="text-base sm:text-2xl font-display font-bold text-ink leading-tight select-none cursor-text hover:text-cinnabar transition-colors uppercase drop-shadow-sm whitespace-normal break-words py-1"
                                                >
                                                  {arc.title}
                                                </h3>
                                                {canEdit && (
                                                  <button 
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditingArcId(`arc-${arcIdx}`);
                                                      setEditingArcTitle(arc.title);
                                                    }}
                                                    className="p-1 sm:p-1.5 text-wood/50 hover:text-cinnabar transition-colors shrink-0"
                                                    title="Sửa tên Hồi"
                                                  >
                                                    <PenTool size={16} />
                                                  </button>
                                                )}
                                              </div>
                                            )}
                                            <p className="text-[8px] sm:text-[10px] uppercase font-bold text-cinnabar/60 tracking-widest mt-1 bg-white/50 inline-block px-2 py-0.5 rounded backdrop-blur-sm whitespace-normal break-words max-w-full">Quy tụ {arcEpisodes.length} tập</p>
                                          </div>
                                        </div>
                                          {canEdit && (
                                            <div className="flex flex-col gap-1.5 sm:gap-2 relative z-10 pl-2 sm:pl-3 pr-2 py-1.5 sm:py-2 bg-white/40 border-l border-gold/20 backdrop-blur-sm self-stretch justify-center">
                                              <label className="p-1 sm:p-2 text-wood/50 hover:text-jade cursor-pointer transition-colors bg-white/50 rounded-lg shadow-sm border border-gold/10" onClick={(e) => e.stopPropagation()}>
                                                <input 
                                                  type="file" 
                                                  accept="image/*" 
                                                  className="hidden" 
                                                  onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                      const reader = new FileReader();
                                                      reader.onloadend = async () => {
                                                        const compressed = await compressImage(reader.result as string, 800, 800, 0.7);
                                                        updateSubDoc('arcs', arc.id || toSlug(arc.title), { coverImage: compressed });
                                                      };
                                                      reader.readAsDataURL(file);
                                                    }
                                                  }} 
                                                />
                                                <Camera size={14} sm:size={18} />
                                              </label>
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setConfirmDialog({
                                                    message: `Bạn có chắc chắn muốn xóa "${arc.title}"?`,
                                                    onConfirm: () => deleteSubDoc('arcs', arc.id)
                                                  });
                                                }}
                                                className="p-1 sm:p-2 text-wood/50 hover:text-cinnabar transition-colors bg-white/50 rounded-lg shadow-sm border border-gold/10"
                                              >
                                                <Trash2 size={14} sm:size={18} />
                                              </button>
                                              <div 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setExpandedArcs(prev => 
                                                    prev.includes(arc.title) ? prev.filter(t => t !== arc.title) : [...prev, arc.title]
                                                  );
                                                }}
                                                className={`p-1 sm:p-2 rounded-lg border border-gold/30 transition-transform duration-500 bg-white shadow-sm cursor-pointer flex items-center justify-center ${isArcExpanded ? 'rotate-180 bg-cinnabar/5' : ''}`}
                                              >
                                                <ChevronDown size={14} sm:size={22} className={isArcExpanded ? 'text-cinnabar' : 'text-gold'} />
                                              </div>
                                            </div>
                                          )}
                                          {!canEdit && (
                                            <div className="flex flex-col relative z-10 pl-2 sm:pl-3 pr-2 py-1.5 sm:py-2 bg-white/40 border-l border-gold/20 backdrop-blur-sm self-stretch justify-center">
                                              <div 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setExpandedArcs(prev => 
                                                    prev.includes(arc.title) ? prev.filter(t => t !== arc.title) : [...prev, arc.title]
                                                  );
                                                }}
                                                className={`p-1 sm:p-2 rounded-lg border border-gold/30 transition-transform duration-500 bg-white shadow-sm cursor-pointer flex items-center justify-center ${isArcExpanded ? 'rotate-180 bg-cinnabar/5' : ''}`}
                                              >
                                                <ChevronDown size={14} sm:size={22} className={isArcExpanded ? 'text-cinnabar' : 'text-gold'} />
                                              </div>
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                    
                                    <AnimatePresence>
                                      {isArcExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="bg-parchment/40"
                                        >
                                          <Droppable droppableId={arc.title}>
                                            {(provided, snapshot) => (
                                              <div 
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className={`p-8 space-y-4 min-h-[50px] transition-colors ${snapshot.isDraggingOver ? 'bg-cinnabar/5' : ''}`}
                                              >
                                                {arcEpisodes.map((ep, index) => {
                                        const isEpExpanded = expandedEpisodeId === ep.id;
                                        const DraggableComp = Draggable as any;
                                        return (
                                          <DraggableComp key={ep.id} draggableId={ep.id.toString()} index={index} isDragDisabled={!canEdit}>
                                            {(providedDrag: any, snapshotDrag: any) => (
                                              <div 
                                                ref={providedDrag.innerRef}
                                                {...providedDrag.draggableProps}
                                                className={`rounded-2xl border transition-all duration-300 ${snapshotDrag.isDragging ? 'shadow-2xl z-50 ring-2 ring-cinnabar' : ''} ${isEpExpanded ? 'bg-white border-cinnabar/40 shadow-lg' : 'bg-white/60 border-gold/30 hover:border-cinnabar/20'} ${ep.isProduced ? 'bg-jade/5 border-jade/30 shadow-none' : ''}`}
                                              >
                                                <div className="flex items-center">
                                                  {canEdit && (
                                                    <div 
                                                      {...providedDrag.dragHandleProps}
                                                      className="px-3 text-gold/50 cursor-grab hover:text-cinnabar transition-colors"
                                                    >
                                                      <GripVertical size={20} />
                                                    </div>
                                                  )}
                                                  
                                                  <div className="flex items-center px-1" onClick={(e) => e.stopPropagation()}>
                                                    <input 
                                                      type="checkbox"
                                                      checked={!!ep.isProduced}
                                                      onChange={(e) => {
                                                        updateSubDoc('episodes', String(ep.id), { isProduced: e.target.checked });
                                                      }}
                                                      disabled={!canEdit}
                                                      className={`w-5 h-5 rounded border-gold/30 text-jade focus:ring-jade/40 ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                                                      title={canEdit ? "Đánh dấu đã sản xuất" : ""}
                                                    />
                                                  </div>

                                                  <div 
                                                    onClick={() => setExpandedEpisodeId(isEpExpanded ? null : ep.id)}
                                                    className="flex-1 flex items-center justify-between p-3 sm:p-5 pl-2 sm:pl-3 text-left cursor-pointer group/ep min-w-0"
                                                  >
                                                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 py-1">
                                                      <div className={`px-2 sm:px-3 py-1 rounded border text-[8px] sm:text-[10px] font-bold tracking-widest shrink-0 ${ep.isProduced ? 'bg-jade/10 border-jade/30 text-jade' : 'bg-cinnabar/5 border-cinnabar/20 text-cinnabar'}`}>
                                                        TẬP {index + 1}
                                                      </div>
                                                      {editingEpisodeId === ep.id ? (
                                                        <input 
                                                          autoFocus
                                                          className="font-bold text-ink bg-white border border-gold/50 rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-cinnabar w-full"
                                                          value={editingEpisodeTitle}
                                                          onChange={(e) => setEditingEpisodeTitle(e.target.value)}
                                                          onClick={(e) => e.stopPropagation()}
                                                          onBlur={() => {
                                                            if (editingEpisodeTitle.trim()) {
                                                              updateSubDoc('episodes', String(ep.id), { title: editingEpisodeTitle });
                                                            }
                                                            setEditingEpisodeId(null);
                                                          }}
                                                          onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                              if (editingEpisodeTitle.trim()) {
                                                                updateSubDoc('episodes', String(ep.id), { title: editingEpisodeTitle });
                                                              }
                                                              setEditingEpisodeId(null);
                                                            }
                                                          }}
                                                        />
                                                      ) : (
                                                        <h4 className={`font-bold transition-colors text-sm sm:text-base break-words whitespace-normal leading-tight ${ep.isProduced ? 'text-jade/80 group-hover:text-jade line-through opacity-70' : 'text-ink group-hover:text-cinnabar'}`}>{ep.title}</h4>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-1 sm:gap-3 shrink-0 ml-2">
                                                      {canEdit && (
                                                        <div className="flex items-center gap-1 opacity-0 group-hover/ep:opacity-100 transition-opacity">
                                                          <button 
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              setEditingEpisodeId(ep.id);
                                                              setEditingEpisodeTitle(ep.title);
                                                            }}
                                                            className="p-1.5 text-wood/40 hover:text-cinnabar transition-colors"
                                                            title="Sửa tên tập"
                                                          >
                                                            <PenTool size={14} />
                                                          </button>
                                                          <button 
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              setConfirmDialog({
                                                                message: `Bạn có chắc chắn muốn xóa cảnh "${ep.title}"?`,
                                                                onConfirm: () => deleteSubDoc('episodes', String(ep.id))
                                                              });
                                                            }}
                                                            className="p-1.5 text-wood/40 hover:text-cinnabar transition-colors"
                                                            title="Xóa cảnh"
                                                          >
                                                            <Trash2 size={14} />
                                                          </button>
                                                        </div>
                                                      )}
                                                      <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border ${ep.status === 'draft' ? 'text-wood/40 border-gold/20' : 'text-jade border-jade/20 bg-jade/5'}`}>
                                                        {ep.status === 'draft' ? 'Sơ thảo' : 'Hoàn thiện'}
                                                      </span>
                                                      <ChevronRight size={18} className={`text-gold transition-transform duration-300 ${isEpExpanded ? 'rotate-90 text-cinnabar' : ''}`} />
                                                    </div>
                                                  </div>
                                                </div>

                                                <AnimatePresence>
                                                  {isEpExpanded && (
                                                    <motion.div
                                                      initial={{ height: 0, opacity: 0 }}
                                                      animate={{ height: 'auto', opacity: 1 }}
                                                      exit={{ height: 0, opacity: 0 }}
                                                      className="border-t border-gold/10"
                                                    >
                                                      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                                                        <div className="flex items-start gap-2 sm:gap-4">
                                                          <div className="hidden sm:block w-1 h-32 bg-gradient-to-b from-cinnabar to-transparent opacity-20 rounded-full mt-2"></div>
                                                          <div className="flex-1 space-y-2 sm:space-y-4 min-w-0">
                                                            <div className="flex items-center justify-between gap-2">
                                                              <h5 className="text-[7px] sm:text-[10px] uppercase font-bold tracking-[0.2em] sm:tracking-[0.3em] text-wood opacity-50 flex items-center gap-2 truncate">
                                                                Sườn Mấu Chốt Diễn Biến
                                                              </h5>
                                                              {canEdit && (
                                                                <div className="flex shrink-0">
                                                                  <input type="file" id={`import-docx-${ep.id}`} accept=".docx" className="hidden" onChange={(e) => handleImportDocxForEpisode(e, ep)} />
                                                                  <button 
                                                                    onClick={() => document.getElementById(`import-docx-${ep.id}`)?.click()} 
                                                                    disabled={isImportingDocx === ep.id}
                                                                    className="px-2 py-1 bg-cinnabar/10 text-cinnabar rounded flex items-center gap-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest hover:bg-cinnabar hover:text-white transition-colors"
                                                                  >
                                                                    {isImportingDocx === ep.id ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />} Import DOCX
                                                                  </button>
                                                                </div>
                                                              )}
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-1.5 sm:gap-3">
                                                              {ep.summary.map((point, pIdx) => {
                                                                const isPointExpanded = expandedPointIdx === pIdx;
                                                                const scene = ep.scenes?.find(s => s.point === point);
                                                                
                                                                return (
                                                                  <div key={pIdx} className="space-y-1 sm:space-y-2 group/point">
                                                                    <div 
                                                                      onClick={() => setExpandedPointIdx(isPointExpanded ? null : pIdx)}
                                                                      className={`w-full flex items-center justify-between p-2 sm:p-4 rounded-lg sm:rounded-xl border transition-all text-left cursor-pointer ${isPointExpanded ? 'bg-sand/20 border-cinnabar/30' : 'bg-parchment/30 border-transparent hover:border-gold/50'}`}
                                                                    >
                                                                      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                                                                        <div className={`w-4 h-4 sm:w-6 sm:h-6 rounded sm:rounded-lg flex items-center justify-center text-[7px] sm:text-[10px] font-bold border transition-colors flex-shrink-0 ${isPointExpanded ? 'bg-cinnabar text-white border-cinnabar' : 'bg-white border-gold/50 text-wood opacity-40'}`}>
                                                                          {pIdx + 1}
                                                                        </div>
                                                                        {editingPoint?.epId === ep.id && editingPoint?.idx === pIdx ? (
                                                                          <input 
                                                                            autoFocus
                                                                            className="flex-1 text-[10px] sm:text-md font-serif font-bold text-ink bg-white border border-cinnabar/30 rounded sm:rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 focus:border-cinnabar focus:shadow-lg transition-all outline-none min-w-0"
                                                                            value={editingPoint.text}
                                                                            onChange={(e) => setEditingPoint({...editingPoint, text: e.target.value})}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            onBlur={() => {
                                                                              if (editingPoint) {
                                                                                const newSummary = [...ep.summary];
                                                                                newSummary[pIdx] = editingPoint.text;
                                                                                updateSubDoc('episodes', String(ep.id), { summary: newSummary });
                                                                                setEditingPoint(null);
                                                                              }
                                                                            }}
                                                                            onKeyDown={(e) => {
                                                                              if (e.key === 'Enter') {
                                                                                 e.currentTarget.blur();
                                                                              }
                                                                            }}
                                                                          />
                                                                        ) : (
                                                                          <p 
                                                                            onDoubleClick={(e) => {
                                                                              if (canEdit) {
                                                                                e.stopPropagation();
                                                                                setEditingPoint({ epId: ep.id, idx: pIdx, text: point });
                                                                              }
                                                                            }}
                                                                            className="text-[10px] sm:text-sm font-serif italic text-ink leading-snug sm:leading-relaxed font-bold cursor-text hover:text-cinnabar transition-colors flex-1 py-0.5 truncate"
                                                                          >
                                                                            PĐ {pIdx + 1}: <span className="font-normal">{point}</span>
                                                                          </p>
                                                                        )}
                                                                      </div>
                                                                      <div className="flex items-center gap-1.5 sm:gap-3 ml-2 shrink-0">
                                                                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover/point:opacity-100 transition-opacity">
                                                                          {canEdit && (
                                                                            <button 
                                                                              onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setEditingPoint({ epId: ep.id, idx: pIdx, text: point });
                                                                              }}
                                                                              className="p-1 text-wood/30 hover:text-cinnabar transition-colors"
                                                                            >
                                                                               <PenTool size={10} sm:size={12} />
                                                                            </button>
                                                                          )}
                                                                        </div>
                                                                        {scene ? (
                                                                          <button 
                                                                            onClick={(e) => {
                                                                              e.stopPropagation();
                                                                              setFullScreenScene({ ep, point, scene });
                                                                            }}
                                                                            className="text-[7px] sm:text-[10px] font-bold text-white bg-jade px-1.5 sm:px-3 py-0.5 sm:py-1 rounded shadow-sm hover:bg-jade/80 transition-colors uppercase tracking-tighter sm:tracking-widest flex items-center gap-1"
                                                                          >
                                                                            Xem
                                                                          </button>
                                                                        ) : (
                                                                          <button className="text-[7px] sm:text-[10px] font-bold text-white bg-wood/20 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded shadow-sm hover:bg-wood/60 transition-colors uppercase tracking-tighter sm:tracking-widest">Thiếu</button>
                                                                        )}
                                                                        <ChevronRight size={12} sm:size={14} className={`text-gold transition-transform duration-300 ${isPointExpanded ? 'rotate-90' : ''}`} />
                                                                      </div>
                                                                    </div>

                                                                    <AnimatePresence>
                                                                      {isPointExpanded && (
                                                                        <motion.div
                                                                          initial={{ height: 0, opacity: 0 }}
                                                                          animate={{ height: 'auto', opacity: 1 }}
                                                                          exit={{ height: 0, opacity: 0 }}
                                                                          className="sm:ml-2 overflow-hidden"
                                                                        >
                                                                          <div className="p-3 sm:p-5 bg-white rounded-xl border border-gold/20 shadow-sm relative pt-10 sm:pt-16">
                                                                            <div className="absolute top-0 left-0 w-1 h-full bg-cinnabar/20 rounded-l"></div>
                                                                            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex flex-wrap justify-end gap-1 sm:gap-2">
                                                                              {canEdit && (
                                                                                <>
                                                                                  <button 
                                                                                    onClick={() => handleGenerateSceneDetail(ep, point, pIdx)}
                                                                                    disabled={isGeneratingScene}
                                                                                    className="px-2 sm:px-4 py-1 sm:py-1.5 bg-cinnabar text-white rounded-md text-[7px] sm:text-[10px] font-bold hover:bg-ink transition-all shadow-sm flex items-center gap-1 sm:gap-2"
                                                                                  >
                                                                                    {isGeneratingScene ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                                                                                    Dựng Cảnh
                                                                                  </button>
                                                                                  <button 
                                                                                    onClick={() => scene && handleGenerateVideoPromptForScene(ep, scene)}
                                                                                    disabled={!scene || !scene.content || isGeneratingVideoPromptForScene[`${ep.id}-${point}`]}
                                                                                    className={`px-2 sm:px-4 py-1 sm:py-1.5 text-white rounded-md text-[7px] sm:text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 sm:gap-2 ${(!scene || !scene.content) ? 'bg-jade/30 cursor-not-allowed' : 'bg-jade hover:bg-jade/90'}`}
                                                                                  >
                                                                                    {isGeneratingVideoPromptForScene[`${ep.id}-${point}`] ? <Loader2 size={10} className="animate-spin" /> : <Video size={10} />}
                                                                                    Prompt
                                                                                  </button>
                                                                                </>
                                                                              )}
                                                                              {scene && (
                                                                                <button 
                                                                                  onClick={() => setFullScreenScene({ ep, point, scene })}
                                                                                  className="px-2.5 sm:px-4 py-1.5 bg-wood text-white rounded-md text-[8px] sm:text-[10px] font-bold hover:bg-ink transition-all shadow-sm flex items-center gap-1.5 sm:gap-2"
                                                                                >
                                                                                  <BookOpen size={10} /> Xem Lại
                                                                                </button>
                                                                              )}
                                                                            </div>
                                                                            {scene ? (
                                                                              <>
                                                                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                                                                                <div className="space-y-2 sm:space-y-4">
                                                                                  <h5 className="text-[8px] sm:text-[10px] font-bold text-cinnabar uppercase tracking-widest flex items-center gap-2">
                                                                                    <PenTool size={10} /> Chi Tiết Phân Cảnh
                                                                                  </h5>
                                                                                  {editingSceneId?.epId === ep.id && editingSceneId?.point === point ? (
                                                                                  <div className="relative">
                                                                                    <textarea
                                                                                      autoFocus
                                                                                      className="w-full bg-parchment p-3 sm:p-8 rounded-lg sm:rounded-2xl text-xs sm:text-lg font-serif leading-relaxed italic border sm:border-2 border-gold/40 focus:border-cinnabar focus:shadow-2xl transition-all min-h-[150px] sm:min-h-[700px] outline-none shadow-inner"
                                                                                      value={editingSceneContent}
                                                                                      onChange={(e) => {
                                                                                        const expanded = applyAbbreviations(e.target.value);
                                                                                        setEditingSceneContent(expanded);
                                                                                        handleMentionInput(e, ep.id, point);
                                                                                      }}
                                                                                      onBlur={() => {
                                                                                        // Small delay to allow clicking suggestions
                                                                                        setTimeout(() => {
                                                                                          if (!activeMentionInput) {
                                                                                            setEpisodes(prev => prev.map(item => {
                                                                                              if (item.id === ep.id) {
                                                                                                const scenes = item.scenes ? [...item.scenes] : [];
                                                                                                const sceneIdx = scenes.findIndex(s => s.point === point);
                                                                                                if (sceneIdx !== -1) {
                                                                                                  scenes[sceneIdx] = { ...scenes[sceneIdx], content: editingSceneContent };
                                                                                                }
                                                                                                return { ...item, scenes };
                                                                                              }
                                                                                              return item;
                                                                                            }));
                                                                                            setEditingSceneId(null);
                                                                                          }
                                                                                        }, 200);
                                                                                      }}
                                                                                      onKeyDown={(e) => {
                                                                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                                                                          handleSaveScene(ep.id, point);
                                                                                        }
                                                                                      }}
                                                                                    />
                                                                                  </div>
                                                                                ) : (
                                                                                  <div 
                                                                                    onDoubleClick={() => {
                                                                                      if (canEdit) {
                                                                                        setEditingSceneId({ epId: ep.id, point: point });
                                                                                        setEditingSceneContent(scene.content || "");
                                                                                      }
                                                                                    }}
                                                                                    className={`whitespace-pre-wrap text-[10px] sm:text-lg text-ink/90 font-serif leading-relaxed sm:leading-loose text-justify-viet italic ${canEdit ? 'cursor-text hover:bg-parchment/40' : 'cursor-default'} rounded-lg sm:rounded-2xl transition-all border sm:border-2 border-transparent ${canEdit ? 'hover:border-gold/30 group/scene' : ''} relative bg-white/60 shadow-md min-h-[100px] sm:min-h-[300px] p-3 sm:p-6`}
                                                                                  >
                                                                                    <FormattedText text={scene.content} characters={characters} artifacts={artifacts} factions={factions} />
                                                                                    {canEdit && (
                                                                                      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 opacity-0 group-hover/scene:opacity-100 transition-opacity bg-cinnabar text-white px-2 py-0.5 rounded text-[7px] sm:text-[10px] font-bold shadow-lg">
                                                                                        SỬA
                                                                                      </div>
                                                                                    )}
                                                                                  </div>
                                                                                )}
                                                                                {canEdit && (
                                                                                  <button 
                                                                                    onClick={() => handleToggleSceneDictation(ep, point)}
                                                                                    disabled={isTranslatingSpeech && activeDictationPoint !== point}
                                                                                    className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 sm:gap-2 transition-colors ${isListening && activeDictationPoint === point ? 'text-red-500 animate-pulse' : 'text-jade/60 hover:text-jade'}`}
                                                                                  >
                                                                                    {isListening && activeDictationPoint === point ? <MicOff size={10} sm:size={12} /> : <Mic size={10} sm:size={12} />} 
                                                                                    {isListening && activeDictationPoint === point ? 'Nghe...' : (isTranslatingSpeech && activeDictationPoint === point ? 'Dịch...' : 'Đọc thêm')}
                                                                                  </button>
                                                                                )}
                                                                              </div>

                                                                              <div className="space-y-2 sm:space-y-4 bg-jade/5 p-3 sm:p-5 rounded-lg sm:rounded-xl border border-jade/10">
                                                                                <div className="flex items-center justify-between">
                                                                                  <h5 className="text-[8px] sm:text-[10px] font-bold text-jade uppercase tracking-widest flex items-center gap-2">
                                                                                    <Video size={10} /> Video Prompt
                                                                                  </h5>
                                                                                  {scene.videoPrompt && (
                                                                                    <button 
                                                                                      onClick={() => {
                                                                                        navigator.clipboard.writeText(scene.videoPrompt || "");
                                                                                        alert("Đã sao chép prompt!");
                                                                                      }}
                                                                                      className="text-[7px] sm:text-[9px] font-bold text-jade hover:text-white hover:bg-jade px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors uppercase border border-jade/20"
                                                                                    >
                                                                                      Chép
                                                                                    </button>
                                                                                  )}
                                                                                </div>
                                                                                {scene.videoPrompt ? (
                                                                                <textarea 
                                                                                  readOnly={!canEdit}
                                                                                  value={scene.videoPrompt}
                                                                                  onBlur={(e) => {
                                                                                    if (!canEdit) return;
                                                                                    const scenes = ep.scenes ? [...ep.scenes] : [];
                                                                                    const idx = scenes.findIndex(s => s.point === point);
                                                                                    if (idx !== -1) {
                                                                                      scenes[idx] = { ...scenes[idx], videoPrompt: (e.target as HTMLTextAreaElement).value };
                                                                                      updateSubDoc('episodes', String(ep.id), { scenes });
                                                                                    }
                                                                                  }}
                                                                                  className={`w-full min-h-[100px] sm:min-h-[600px] bg-white/60 p-2 sm:p-6 rounded-lg sm:rounded-xl text-[10px] sm:text-md font-mono leading-snug sm:leading-relaxed border sm:border-2 ${canEdit ? 'border-jade/20 focus:border-jade focus:ring-4 focus:ring-jade/10' : 'border-transparent'} transition-all italic text-jade/80 scrollbar-hide shadow-inner outline-none`}
                                                                                />
                                                                                ) : (
                                                                                  <div className="h-[100px] sm:h-[600px] flex items-center justify-center border border-dashed border-jade/20 rounded-lg text-jade/30 text-[8px] sm:text-[10px] font-bold italic">
                                                                                    Thiếu prompt
                                                                                  </div>
                                                                                )}
                                                                              </div>
                                                                            </div>
                                                                            
                                                                            {/* Storyboard Render Row */}
                                                                            {scene.storyboardImage && (
                                                                              <div className="mt-3 sm:mt-6">
                                                                                <h5 className="text-[8px] sm:text-[10px] font-bold text-wood uppercase tracking-widest flex items-center gap-2 mb-2 sm:mb-4">
                                                                                  <ImageIcon size={10} className="text-wood" /> Storyboard Concept
                                                                                </h5>
                                                                                <div className="w-full bg-sand/10 rounded-xl sm:rounded-2xl border sm:border-2 border-gold/30 p-1 sm:p-2 shadow-inner">
                                                                                  <img src={scene.storyboardImage} alt="Storyboard" className="w-full h-auto rounded-lg sm:rounded-xl shadow-lg border border-gold/20" referrerPolicy="no-referrer" />
                                                                                </div>
                                                                              </div>
                                                                            )}
                                                                            </>
                                                                            ) : (
                                                                              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                                                                                <div className="w-12 h-12 rounded-full bg-cinnabar/5 border border-cinnabar/10 flex items-center justify-center text-cinnabar/30">
                                                                                  <PenTool size={20} />
                                                                                </div>
                                                                                <div className="space-y-3">
                                                                                  <p className="text-xs font-bold text-ink/60 italic font-serif">Chưa có chi tiết hành động & đối thoại</p>
                                                                                  <div className="flex justify-center gap-3">
                                                                                    {canEdit && (
                                                                                      <>
                                                                                        <button 
                                                                                          onClick={() => handleGenerateSceneDetail(ep, point, pIdx)}
                                                                                          disabled={isGeneratingScene}
                                                                                          className="px-6 py-2 bg-cinnabar text-white rounded-full text-[11px] font-bold hover:bg-ink transition-all shadow-md shadow-cinnabar/20 flex items-center gap-2"
                                                                                        >
                                                                                          {isGeneratingScene ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                                                          {isGeneratingScene ? 'AI Đang Mài...' : 'Khởi Tạo'}
                                                                                        </button>
                                                                                        <button 
                                                                                          onClick={() => handleToggleSceneDictation(ep, point)}
                                                                                          disabled={isTranslatingSpeech && activeDictationPoint !== point}
                                                                                          className={`px-6 py-2 text-white rounded-full text-[11px] font-bold transition-all shadow-md flex items-center gap-2 ${isListening && activeDictationPoint === point ? 'bg-red-500 shadow-red-500/20 animate-pulse' : 'bg-jade hover:bg-jade/90 shadow-jade/20'}`}
                                                                                        >
                                                                                          {isListening && activeDictationPoint === point ? <MicOff size={12} /> : <Mic size={12} />}
                                                                                          {isListening && activeDictationPoint === point ? 'Đang nghe...' : (isTranslatingSpeech && activeDictationPoint === point ? 'Đang dịch...' : 'Truyền Âm')}
                                                                                        </button>
                                                                                        <button 
                                                                                          onClick={() => {
                                                                                            const currentEp = episodes.find(e => e.id === ep.id);
                                                                                            const scenes = currentEp?.scenes ? [...currentEp.scenes] : [];
                                                                                            if (!scenes.find(s => s.point === point)) {
                                                                                              scenes.push({ point, content: '' });
                                                                                              updateSubDoc('episodes', String(ep.id), { scenes });
                                                                                            }
                                                                                            setEditingSceneId({ epId: ep.id, point: point });
                                                                                            setEditingSceneContent('');
                                                                                          }}
                                                                                          className="px-6 py-2 bg-blue-600 text-white rounded-full text-[11px] font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
                                                                                        >
                                                                                          <PenTool size={12} /> Tự Viết
                                                                                        </button>
                                                                                      </>
                                                                                    )}
                                                                                  </div>
                                                                                </div>
                                                                              </div>
                                                                            )}
                                                                          </div>
                                                                        </motion.div>
                                                                      )}
                                                                    </AnimatePresence>
                                                                  </div>
                                                                );
                                                              })}
                                                              {canEdit && (
                                                                <button 
                                                                  onClick={() => {
                                                                  const newSummary = [...ep.summary, 'Mấu chốt diễn biến mới...'];
                                                                  updateSubDoc('episodes', String(ep.id), { summary: newSummary });
                                                                }}
                                                                  className="w-full py-3 border border-dashed border-gold/30 rounded-xl text-wood/40 hover:text-cinnabar hover:border-cinnabar/30 transition-all font-bold uppercase tracking-widest text-[9px] flex items-center justify-center gap-2"
                                                                >
                                                                  <Plus size={12} /> Thêm Mấu Chốt
                                                                </button>
                                                              )}
                                                            </div>
                                                          </div>
                                                        </div>
                                                        
                                                        {/* Character State & Logic Warning Section */}
                                                        <div className="space-y-6 pt-6 border-t border-gold/10">
                                                          <div className="flex items-start gap-4">
                                                            <div className="w-1 h-20 bg-gradient-to-b from-cinnabar to-transparent opacity-20 rounded-full mt-2"></div>
                                                            <div className="flex-1 space-y-4">
                                                              <div className="flex items-center justify-between">
                                                                <h5 className="text-[10px] uppercase font-bold tracking-[0.3em] text-red-900 flex items-center gap-2">
                                                                  Cảnh Báo Logic & Đồng Nhất
                                                                </h5>
                                                                {canEdit && (
                                                                  <button 
                                                                    onClick={() => handleAIAnalyzeLogic(ep)}
                                                                    disabled={isAnalyzingLogic === ep.id}
                                                                    className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${isAnalyzingLogic === ep.id ? 'bg-red-50 text-red-300 border-red-100' : 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200'}`}
                                                                  >
                                                                    {isAnalyzingLogic === ep.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                                    {isAnalyzingLogic === ep.id ? 'Đang soi...' : 'AI Soi Xét Logic'}
                                                                  </button>
                                                                )}
                                                              </div>
                                                              <div className="bg-red-50/50 border border-cinnabar/20 rounded-xl p-4">
                                                                {editingLogicWarningId === ep.id ? (
                                                                  <textarea
                                                                    autoFocus
                                                                    className="w-full bg-white border border-red-200 rounded-lg p-3 text-sm text-ink focus:ring-1 focus:ring-red-400 outline-none min-h-[100px]"
                                                                    placeholder="Nhập các nhắc nhở về logic, tình tiết cần nhớ để tránh sai sót..."
                                                                    value={logicWarningText}
                                                                    onChange={(e) => setLogicWarningText(e.target.value)}
                                                                    onBlur={() => {
                                                                      updateSubDoc('episodes', String(ep.id), { logicWarnings: logicWarningText });
                                                                      setEditingLogicWarningId(null);
                                                                    }}
                                                                  />
                                                                ) : (
                                                                  <div 
                                                                    onClick={() => {
                                                                      if (canEdit) {
                                                                        setEditingLogicWarningId(ep.id);
                                                                        setLogicWarningText(ep.logicWarnings || '');
                                                                      }
                                                                    }}
                                                                    className={`${canEdit ? 'cursor-pointer' : 'cursor-default'} group relative`}
                                                                  >
                                                                    {ep.logicWarnings ? (
                                                                      <ul className="text-sm text-red-500 italic font-serif leading-relaxed font-bold list-disc pl-5">
                                                                        {ep.logicWarnings.split('\n').filter(line => line.trim() !== '').map((line, idx) => <li key={idx}>{line.trim()}</li>)}
                                                                      </ul>
                                                                    ) : (
                                                                      <p className="text-sm text-red-300 italic font-serif">
                                                                        {canEdit ? 'Chưa có cảnh báo logic nào. Nhấn để thêm nhắc nhở...' : 'Chưa có cảnh báo logic.'}
                                                                      </p>
                                                                    )}
                                                                    {canEdit && (
                                                                      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <div className="p-1 px-2 bg-red-100 text-red-600 text-[8px] font-bold rounded shadow-sm border border-red-200 uppercase">Chú ý</div>
                                                                      </div>
                                                                    )}
                                                                  </div>
                                                                )}
                                                              </div>
                                                            </div>
                                                          </div>

                                                          <div className="flex items-start gap-4">
                                                            <div className="w-1 h-32 bg-gradient-to-b from-blue-600 to-transparent opacity-20 rounded-full mt-2"></div>
                                                            <div className="flex-1 space-y-4">
                                                              <div className="flex items-center justify-between">
                                                                <h5 className="text-[10px] uppercase font-bold tracking-[0.3em] text-blue-900 flex items-center gap-2">
                                                                  Biến Động Trạng Thái Nhân Vật <Sparkles size={10} />
                                                                </h5>
                                                                {canEdit && (
                                                                  <button 
                                                                    onClick={() => handleAIExtractChanges(ep)}
                                                                    disabled={isExtractingChanges === ep.id}
                                                                    className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${isExtractingChanges === ep.id ? 'bg-blue-50 text-blue-300 border-blue-100' : 'bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200'}`}
                                                                  >
                                                                    {isExtractingChanges === ep.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                                    {isExtractingChanges === ep.id ? 'Đang chắt lọc...' : 'AI Chắt lọc Dấu Ấn'}
                                                                  </button>
                                                                )}
                                                              </div>
                                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {characters.filter(c => {
                                                                  if (!['Chính phái', 'Tà phái', 'Trung lập', 'NPC'].includes(c.faction) || c.status === 'upcoming') return false;
                                                                  const hasExistingChange = c.stateTimeline?.some(t => t.episodeId === ep.id && t.change?.trim() !== '');
                                                                  if (hasExistingChange) return true;
                                                                  const contentText = ((ep.summary || []).join(' ') + ' ' + (ep.title || '')).toLowerCase();
                                                                  return contentText.includes(c.name.toLowerCase());
                                                                }).map((char) => (
                                                                  <div key={char.id || char.name} className="bg-white border border-blue-100 rounded-xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                                                                    <div className="w-10 h-10 rounded-full border border-blue-200 overflow-hidden shrink-0">
                                                                      {char.avatar ? <img src={char.avatar} className="w-full h-full object-cover" /> : <Users className="text-blue-200 m-auto mt-2" size={20} />}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                      <div className="text-[10px] font-bold text-ink truncate mb-1">{char.name}</div>
                                                                      <input 
                                                                        type="text" 
                                                                        placeholder="Dấu ấn tập này (VD: Bị thương, ngộ võ công...)" 
                                                                        className="w-full bg-blue-50/50 border-none rounded text-xs px-2 py-1 placeholder:text-blue-800 focus:ring-1 focus:ring-blue-300 text-blue-950 font-bold"
                                                                        value={char.stateTimeline?.find(t => t.episodeId === ep.id)?.change || ''}
                                                                        onChange={(e) => {
                                                                          const newVal = e.target.value;
                                                                          const timeline = char.stateTimeline ? [...char.stateTimeline] : [];
                                                                          const existingIdx = timeline.findIndex(t => t.episodeId === ep.id);
                                                                          
                                                                          if (existingIdx !== -1) {
                                                                            if (newVal) timeline[existingIdx] = { ...timeline[existingIdx], change: newVal };
                                                                            else timeline.splice(existingIdx, 1);
                                                                          } else if (newVal) {
                                                                            timeline.push({ episodeId: ep.id, change: newVal });
                                                                          }
                                                                          
                                                                          setCharacters(prev => prev.map(c => c.id === char.id ? { ...c, stateTimeline: timeline } : c));
                                                                        }}
                                                                        onBlur={(e) => {
                                                                          updateSubDoc('characters', char.id as string, { stateTimeline: char.stateTimeline || [] });
                                                                        }}
                                                                      />
                                                                    </div>
                                                                  </div>
                                                                ))}
                                                              </div>
                                                              <p className="text-[9px] text-blue-400 italic">* Các thay đổi này sẽ tự động được AI và hồ sơ nhân vật kế thừa cho các diễn biến sau. Chỉ hiển thị diễn viên có tên xuất hiện trong Diễn Biến hoặc đã có dấu ấn.</p>
                                                            </div>
                                                          </div>
                                                        </div>
                                                          
                                                          <div className="pt-4 flex flex-wrap justify-between items-center gap-3 border-t border-gold/10">
                                                            <div className="flex gap-2">
                                                              {canEdit && (<button 
                                                                onClick={() => {
                                                                  setEditingEpisodeId(ep.id);
                                                                  setEditingEpisodeTitle(ep.title);
                                                                }}
                                                                className="px-3 py-1.5 bg-white border border-gold/30 text-wood/60 hover:text-cinnabar hover:border-cinnabar/30 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                                                              >
                                                                <PenTool size={12} /> Sửa Tên Cảnh
                                                              </button>)}
                                                              {canDelete && (<button 
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  if (!canDelete) { alert('Chỉ admin mới có quyền xóa!'); return; }
                                                                  setConfirmDialog({
                                                                    message: `Bạn có chắc chắn muốn xóa cảnh "${ep.title}"?`,
                                                                    onConfirm: () => deleteSubDoc('episodes', String(ep.id))
                                                                  });
                                                                }}
                                                                className="px-3 py-1.5 bg-white border border-gold/30 text-wood/60 hover:text-cinnabar hover:border-cinnabar/30 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                                                              >
                                                                <Trash2 size={12} /> Xóa Cảnh
                                                              </button>)}
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                              {canEdit && (
                                                                <div className="relative">
                                                                  <input type="file" id={`import-docx-main-${ep.id}`} accept=".docx" className="hidden" onChange={(e) => handleImportDocxForEpisode(e, ep)} />
                                                                  <button 
                                                                    onClick={() => document.getElementById(`import-docx-main-${ep.id}`)?.click()}
                                                                    disabled={isImportingDocx === ep.id}
                                                                    className="px-3 py-1.5 bg-white border border-gold/30 text-wood/60 rounded flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest hover:text-cinnabar hover:border-cinnabar/30 transition-all"
                                                                  >
                                                                    {isImportingDocx === ep.id ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} 
                                                                    Import Kịch Bản
                                                                  </button>
                                                                </div>
                                                              )}
                                                              <button 
                                                                onClick={() => setSelectedEpisode(ep)}
                                                                className="px-3 py-1.5 bg-ink/5 border border-ink/10 text-ink rounded hover:bg-ink hover:text-white transition-all flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest"
                                                              >
                                                                <BookOpen size={12} /> Kịch Bản
                                                              </button>
                                                            </div>
                                                          </div>
                                                      </div>
                                                  </motion.div>
                                                )}
                                              </AnimatePresence>
                                            </div>
                                          )}
                                        </DraggableComp>
                                      );
                                    })}
                                    {provided.placeholder}
                                    {canEdit && (
                                      <button 
                                        onClick={() => setShowAddEpisodeModal(arc.title)}
                                        className="w-full text-center py-4 bg-white border border-dashed border-gold/50 rounded-xl text-wood hover:border-gold hover:text-cinnabar transition-all font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 group mt-4 shadow-sm"
                                      >
                                        <Plus size={16} className="group-hover:scale-110 transition-transform" /> Thêm Tập Mới Vào Hồi Này
                                      </button>
                                    )}
                                  </div>
                                )}
                              </Droppable>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </DraggableArc>
                );
              })}
              {providedMain.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  </motion.div>
)}

            {activeTab === 'side-stories' && (
              <motion.div
                key="side-stories"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className={`relative ${(isAdmin || userRole === 'admin') ? 'group cursor-pointer' : 'cursor-default'} shrink-0`}>
                      {(isAdmin || userRole === 'admin') && (
                        <input 
                          type="file" 
                          id="upload-tab-side-stories" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleTabIconUpload('side-stories', e)} 
                        />
                      )}
                      <label 
                        htmlFor={(isAdmin || userRole === 'admin') ? "upload-tab-side-stories" : undefined} 
                        className={`w-12 h-12 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-gold shadow-md flex items-center justify-center overflow-hidden ${(isAdmin || userRole === 'admin') ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        {tabIcons['side-stories'] ? (
                          <img src={tabIcons['side-stories']} alt="Tab Icon" className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="text-gold/50" size={32} />
                        )}
                        {(isAdmin || userRole === 'admin') && (
                          <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera size={20} />
                          </div>
                        )}
                      </label>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-4xl font-display font-medium text-cinnabar brush-stroke inline-block">
                        {tabTitles['side-stories']}
                      </h2>
                      <p className="text-[#8c6746]/60 mt-1 sm:mt-2 font-serif italic text-xs sm:text-sm">Những câu chuyện ẩn giấu bên lề mạch truyện chính.</p>
                    </div>
                  </div>
                </header>

                <div className="bg-white rounded-3xl border border-gold/30 shadow-md overflow-hidden p-8 space-y-6">
                  {sideStories.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {sideStories.map((story) => (
                        <div key={story.id} className="bg-white rounded-2xl border border-gold/20 shadow-sm overflow-hidden">
                          <div className="p-6 flex justify-between items-center bg-white cursor-pointer group" onClick={() => setExpandedEpisodeId(expandedEpisodeId === story.id ? null : story.id)}>
                            <div className="flex-1 mr-4">
                              <h4 className="font-bold text-ink group-hover:text-cinnabar transition-colors">{story.title}</h4>
                              <p className="text-xs text-wood italic font-serif mt-1 line-clamp-1">{story.summary[0] || 'Chưa cập nhật tóm tắt...'}</p>
                            </div>
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  onClick={() => setExpandedEpisodeId(expandedEpisodeId === story.id ? null : story.id)}
                                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${expandedEpisodeId === story.id ? 'bg-cinnabar text-white' : 'bg-sand text-wood hover:bg-cinnabar hover:text-white'}`}
                                >
                                  {expandedEpisodeId === story.id ? 'Thu Gọn' : 'Thiết Kế'}
                                </button>
                                <button 
                                  onClick={() => setSelectedEpisode(story)}
                                  className="px-5 py-2.5 rounded-lg text-sm font-bold bg-ink text-white hover:bg-cinnabar transition-all shadow-md whitespace-nowrap"
                                >
                                  {tabTitles['side-stories']}
                                </button>
                                {canEdit && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!canDelete) { alert('Chỉ có Admin mới có quyền xóa!'); return; }
                                      setConfirmDialog({
                                        message: `Xóa ngoại truyện "${story.title}"?`,
                                        onConfirm: () => deleteSubDoc('episodes', story.id as string)
                                      });
                                    }}
                                    className="p-2 text-cinnabar/40 hover:text-cinnabar transition-all"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                          </div>
                          <AnimatePresence>
                            {expandedEpisodeId === story.id && (
                              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-gold/10 bg-sand/5 p-6">
                                <div className="grid grid-cols-1 gap-6">
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h5 className="text-[10px] uppercase font-bold tracking-[0.3em] text-red-900">Cảnh Báo Logic</h5>
                                      {canEdit && (
                                        <button 
                                          onClick={() => handleAIAnalyzeLogic(story)}
                                          disabled={isAnalyzingLogic === story.id}
                                          className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${isAnalyzingLogic === story.id ? 'bg-red-50 text-red-300 border-red-100' : 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200'}`}
                                        >
                                          {isAnalyzingLogic === story.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                          {isAnalyzingLogic === story.id ? 'Đang soi...' : 'AI Soi Xét'}
                                        </button>
                                      )}
                                    </div>
                                    <textarea 
                                      readOnly={!canEdit}
                                      className="w-full bg-white border border-gold/10 rounded-xl p-3 text-sm italic font-serif text-red-500 font-bold outline-none"
                                      value={story.logicWarnings || ''}
                                      onBlur={(e) => {
                                        const val = (e.target as HTMLTextAreaElement).value;
                                        updateSubDoc('episodes', story.id as string, { logicWarnings: val });
                                      }}
                                      placeholder="Cảnh báo logic cho ngoại truyện này..."
                                    />
                                  </div>
                                  <div className="space-y-4">
                                    <h5 className="text-[10px] uppercase font-bold tracking-[0.3em] text-cinnabar">Mấu Chốt Diễn Biến</h5>
                                    {story.summary.map((sum, sIdx) => (
                                      <input 
                                        key={sIdx}
                                        readOnly={!canEdit}
                                        className="w-full bg-white border border-gold/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-cinnabar"
                                        value={sum}
                                        onBlur={(e) => {
                                          const newSummary = [...story.summary];
                                          newSummary[sIdx] = (e.target as HTMLInputElement).value;
                                          updateSubDoc('episodes', story.id as string, { summary: newSummary });
                                        }}
                                      />
                                    ))}
                                    {canEdit && (
                                      <button 
                                        onClick={() => {
                                          const newSummary = [...story.summary, '...'];
                                          updateSubDoc('episodes', story.id as string, { summary: newSummary });
                                        }}
                                        className="text-[10px] font-bold text-cinnabar/60 hover:text-cinnabar uppercase tracking-widest pl-2"
                                      >
                                        + Thêm mấu chốt
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 border-2 border-dashed border-gold/30 rounded-3xl opacity-50 bg-parchment/20">
                      <BookOpen size={48} className="mx-auto text-gold/30 mb-4" />
                      <p className="text-sm font-serif italic text-wood">Thế gian chưa lưu lại những trang ngoại truyện đặc sắc...</p>
                    </div>
                  )}
                  {canEdit && (
                    <button 
                      onClick={() => {
                        setNewEpisodePayload({ title: '', content: '', characterName: '' });
                        setShowAddSideStoryModal(true);
                      }}
                      className="w-full py-6 bg-white border-2 border-dashed border-cinnabar/30 rounded-3xl text-cinnabar/60 hover:text-cinnabar hover:border-cinnabar/50 hover:bg-cinnabar/5 transition-all font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 group"
                    >
                      <Plus size={20} className="group-hover:scale-110 transition-transform" /> Thêm Ngoại Truyện Mới
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'character-memories' && (
              <motion.div
                key="character-memories"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 sm:space-y-8"
              >
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className={`relative ${(isAdmin || userRole === 'admin') ? 'group cursor-pointer' : 'cursor-default'} shrink-0`}>
                      {(isAdmin || userRole === 'admin') && (
                        <input 
                          type="file" 
                          id="upload-tab-character-memories" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleTabIconUpload('character-memories', e)} 
                        />
                      )}
                      <label 
                        htmlFor={(isAdmin || userRole === 'admin') ? "upload-tab-character-memories" : undefined} 
                        className={`w-12 h-12 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-gold shadow-md flex items-center justify-center overflow-hidden ${(isAdmin || userRole === 'admin') ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        {tabIcons['character-memories'] ? (
                          <img src={tabIcons['character-memories']} alt="Tab Icon" className="w-full h-full object-cover" />
                        ) : (
                          <History className="text-gold/50" size={32} />
                        )}
                        {(isAdmin || userRole === 'admin') && (
                          <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera size={20} />
                          </div>
                        )}
                      </label>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-4xl font-display font-medium text-cinnabar brush-stroke inline-block">
                        {tabTitles['character-memories']}
                      </h2>
                      <p className="text-[#8c6746]/60 mt-1 sm:mt-2 font-serif italic text-xs sm:text-sm">Những hồi ức quá khứ định hình nên con người.</p>
                    </div>
                  </div>
                </header>

                <div className="bg-white rounded-2xl sm:rounded-3xl border border-gold/30 shadow-md overflow-hidden p-3 sm:p-8 space-y-3 sm:space-y-6">
                  {characterMemories.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {characterMemories.map((memory) => {
                        const owner = characters.find(c => c.name === memory.characterName);
                        return (
                          <div key={memory.id} className="bg-white rounded-xl sm:rounded-2xl border border-gold/20 shadow-sm overflow-hidden">
                            <div className="p-3 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white cursor-pointer group gap-3" onClick={() => setExpandedEpisodeId(expandedEpisodeId === memory.id ? null : memory.id)}>
                              <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border sm:border-2 border-gold overflow-hidden bg-sand flex-shrink-0">
                                  {owner?.avatar ? (
                                    <img src={owner.avatar} alt={owner.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <History size={16} className="text-gold/30 m-auto mt-2.5 sm:mt-3" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                     <h4 className="font-bold text-ink text-sm sm:text-base group-hover:text-cinnabar transition-colors truncate">{memory.title}</h4>
                                     {owner && <span className="text-[7px] sm:text-[9px] font-bold text-cinnabar bg-cinnabar/5 px-2 py-0.5 rounded-full uppercase italic w-max">Ký ức của {owner.name}</span>}
                                  </div>
                                  <p className="text-[10px] sm:text-xs text-wood italic font-serif mt-0.5 sm:mt-1 line-clamp-1 opacity-70">{memory.summary[0] || 'Đang triển khai hồi ức...'}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  onClick={() => setExpandedEpisodeId(expandedEpisodeId === memory.id ? null : memory.id)}
                                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${expandedEpisodeId === memory.id ? 'bg-cinnabar text-white' : 'bg-sand text-wood hover:bg-cinnabar hover:text-white'}`}
                                >
                                  {expandedEpisodeId === memory.id ? 'Thu Gọn' : 'Thiết Kế'}
                                </button>
                                <button 
                                  onClick={() => setSelectedEpisode(memory)}
                                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold bg-ink text-white hover:bg-cinnabar transition-all shadow-md whitespace-nowrap"
                                >
                                  {tabTitles['character-memories']}
                                </button>
                                {canEdit && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!canDelete) { alert('Chỉ có Admin mới có quyền xóa!'); return; }
                                      setConfirmDialog({
                                        message: `Xóa ký ức "${memory.title}"?`,
                                        onConfirm: () => deleteSubDoc('episodes', memory.id as string)
                                      });
                                    }}
                                    className="p-1.5 sm:p-2 text-cinnabar/40 hover:text-cinnabar transition-all"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <AnimatePresence>
                              {expandedEpisodeId === memory.id && (
                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-gold/10 bg-sand/5 p-6">
                                  <div className="grid grid-cols-1 gap-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                          <h5 className="text-[10px] uppercase font-bold tracking-[0.3em] text-red-900">Cảnh Báo Logic</h5>
                                          {canEdit && (
                                            <button 
                                              onClick={() => handleAIAnalyzeLogic(memory)}
                                              disabled={isAnalyzingLogic === memory.id}
                                              className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${isAnalyzingLogic === memory.id ? 'bg-red-50 text-red-300 border-red-100' : 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200'}`}
                                            >
                                              {isAnalyzingLogic === memory.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                              {isAnalyzingLogic === memory.id ? 'Đang soi...' : 'AI Soi Xét'}
                                            </button>
                                          )}
                                        </div>
                                        <textarea 
                                          readOnly={!canEdit}
                                          className="w-full bg-white border border-gold/10 rounded-xl p-3 text-sm italic font-serif text-red-500 font-bold outline-none h-32"
                                          value={memory.logicWarnings || ''}
                                          onBlur={(e) => {
                                            const val = (e.target as HTMLTextAreaElement).value;
                                            updateSubDoc('episodes', memory.id as string, { logicWarnings: val });
                                          }}
                                          placeholder="Cảnh báo logic cho hồi ức này..."
                                        />
                                      </div>
                                      <div className="space-y-4">
                                        <h5 className="text-[10px] uppercase font-bold tracking-[0.3em] text-cinnabar">Gán Nhân Vật Chủ Thể</h5>
                                        <div className="relative">
                                          <select 
                                            disabled={!canEdit}
                                            value={memory.characterName || ""}
                                            onChange={(e) => updateSubDoc('episodes', memory.id as string, { characterName: e.target.value })}
                                            className="w-full bg-white border border-gold/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cinnabar appearance-none font-serif italic"
                                          >
                                            <option value="">-- Chọn nhân vật --</option>
                                            {characters.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                                          </select>
                                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gold">
                                            <Users size={16} />
                                          </div>
                                        </div>
                                        <p className="text-[10px] text-wood/40 italic">Mỗi ký ức nên được gán cho một nhân vật để AI phân tích logic chính xác hơn.</p>
                                      </div>
                                    </div>
                                    <div className="space-y-4">
                                      <h5 className="text-[10px] uppercase font-bold tracking-[0.3em] text-cinnabar">Mấu Chốt Hồi Ức</h5>
                                      {memory.summary.map((sum, sIdx) => (
                                        <input 
                                          key={sIdx}
                                          readOnly={!canEdit}
                                          className="w-full bg-white border border-gold/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-cinnabar"
                                          value={sum}
                                          onBlur={(e) => {
                                            const newSummary = [...memory.summary];
                                            newSummary[sIdx] = (e.target as HTMLInputElement).value;
                                            updateSubDoc('episodes', memory.id as string, { summary: newSummary });
                                          }}
                                        />
                                      ))}
                                      {canEdit && (
                                        <button 
                                          onClick={() => {
                                            const newSummary = [...memory.summary, '...'];
                                            updateSubDoc('episodes', memory.id as string, { summary: newSummary });
                                          }}
                                          className="text-[10px] font-bold text-cinnabar/40 hover:text-cinnabar uppercase tracking-widest pl-2"
                                        >
                                          + Thêm mấu chốt
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-20 border-2 border-dashed border-gold/20 rounded-3xl opacity-50 bg-parchment/20">
                      <History size={48} className="mx-auto text-gold/30 mb-4" />
                      <p className="text-sm font-serif italic text-wood">Giang hồ chưa có ký ức nào được ghi chép...</p>
                    </div>
                  )}
                  {canEdit && (
                    <button 
                      onClick={() => {
                        setNewEpisodePayload({ title: '', content: '', characterName: '' });
                        setShowAddMemoryModal(true);
                      }}
                      className="w-full py-6 bg-white border-2 border-dashed border-cinnabar/30 rounded-3xl text-cinnabar/60 hover:text-cinnabar hover:border-cinnabar/50 hover:bg-cinnabar/5 transition-all font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 group"
                    >
                      <Plus size={20} className="group-hover:scale-110 transition-transform" /> Thêm Ký Ức Mới
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'characters' && (
              <motion.div
                key="characters"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 sm:space-y-12"
              >
                 <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white/40 p-4 sm:p-0 rounded-2xl sm:rounded-none border sm:border-0 border-gold/20">
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className={`relative ${(isAdmin || userRole === 'admin') ? 'group cursor-pointer' : 'cursor-default'} shrink-0`}>
                      <input type="file" id="upload-tab-characters" accept="image/*" className="hidden" onChange={(e) => handleTabIconUpload('characters', e)} disabled={!(isAdmin || userRole === 'admin')} />
                      <label htmlFor={(isAdmin || userRole === 'admin') ? "upload-tab-characters" : ""} className={`w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white border sm:border-2 border-gold shadow-md flex items-center justify-center overflow-hidden ${(isAdmin || userRole === 'admin') ? 'cursor-pointer' : ''}`}>
                        {tabIcons['characters'] ? (
                          <img src={tabIcons['characters']} className="w-full h-full object-cover" />
                        ) : (
                          <Swords className="text-gold/50 w-6 h-6 sm:w-8 sm:h-8" />
                        )}
                        {(isAdmin || userRole === 'admin') && (
                          <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera size={16} />
                          </div>
                        )}
                      </label>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-4xl font-display font-medium text-cinnabar brush-stroke inline-block">
                        {tabTitles.characters}
                      </h2>
                      <p className="text-stone-500 mt-0.5 sm:mt-4 font-serif text-[10px] sm:text-base">Quản lý các cao thủ chia theo phe phái.</p>
                    </div>
                  </div>
                  {canEdit && (
                    <button 
                      onClick={() => {
                        setNewChar({ 
                          name: '', role: '', description: '', faction: 'Chính phái', past: '', weapon: '', 
                          weaponOrigin: '', weaponAvatar: '', personality: '', relationships: '', 
                          martialArtsBeginner: '', martialArtsIntermediate: '', martialArtsAdvanced: '', 
                          martialArtsSpecial: '', avatar: '', status: 'appeared' 
                        });
                        setEditingCharIdx(null);
                        setShowAddChar(true);
                      }}
                      className="w-full sm:w-auto bg-cinnabar text-white px-4 sm:px-8 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold shadow-lg hover:bg-ink transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Chiêu Mộ Cao Thủ
                    </button>
                  )}
                </header>

                <div className="px-4">
                  <input
                    type="text"
                    placeholder="Tìm kiếm cao thủ (tên, danh hiệu)..."
                    value={characterSearchQuery}
                    onChange={(e) => setCharacterSearchQuery(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/50 border border-gold/20 shadow-sm"
                  />
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {(['Chính phái', 'Tà phái', 'Trung lập', 'NPC'] as const).map((factionName) => (
                      <div key={factionName} className="flex flex-col h-full bg-sand/10 rounded-2xl sm:rounded-3xl border border-gold/30 overflow-hidden shadow-sm">
                        <div className={`p-2 sm:p-4 text-center border-b border-gold/20 ${
                          factionName === 'Chính phái' ? 'text-jade bg-jade/10' : 
                          factionName === 'Tà phái' ? 'text-cinnabar bg-cinnabar/10' : 
                          factionName === 'Trung lập' ? 'text-blue-600 bg-blue-600/10' : 'text-stone-500 bg-stone-500/10'
                        }`}>
                          <h3 className="font-display font-bold text-base sm:text-xl uppercase tracking-tighter">{factionName}</h3>
                        </div>
                        
                        <Droppable droppableId={factionName}>
                          {(provided, snapshot) => (
                            <div 
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={`flex-1 p-2 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-4 min-h-[150px] sm:min-h-[300px] transition-colors ${snapshot.isDraggingOver ? 'bg-cinnabar/5' : ''}`}
                            >
                              {characters.filter(c => c.faction === factionName && 
                                (c.name.toLowerCase().includes(characterSearchQuery.toLowerCase()) || 
                                (c.role && c.role.toLowerCase().includes(characterSearchQuery.toLowerCase())))
                              ).map((char, index) => {
                                const DraggableComp = Draggable as any;
                                return (
                                  <DraggableComp key={char.id || char.name} draggableId={`char-${char.id || char.name}`} index={index} isDragDisabled={!canEdit}>
                                    {(providedDrag: any, snapshotDrag: any) => (
                                      <div 
                                        ref={providedDrag.innerRef}
                                        {...providedDrag.draggableProps}
                                        {...(canEdit ? providedDrag.dragHandleProps : {})}
                                        className={`bg-stone-50 border border-gold/30 p-2 sm:p-5 rounded-xl sm:rounded-2xl group hover:border-gold hover:shadow-lg transition-all relative ${canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} flex flex-row sm:flex-col items-center sm:text-center gap-3 sm:gap-0 ${snapshotDrag.isDragging ? 'shadow-2xl ring-2 ring-gold z-50 bg-stone-100' : ''} h-full`}
                                        onClick={(e) => {
                                          if (!snapshotDrag.isDragging) setSelectedCharacter(char);
                                        }}
                                      >
                                        {canEdit && (
                                          <div className="absolute top-2 right-2 flex flex-col sm:flex-row gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditCharacter(characters.findIndex(c => c.name === char.name));
                                              }}
                                              className="p-1.5 text-jade hover:bg-jade/10 bg-white/80 backdrop-blur-sm rounded-full transition-colors border border-jade/20 shadow-sm"
                                              title="Sửa"
                                            >
                                              <PenTool size={12} />
                                            </button>
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCharacter(char.id || toSlug(char.name), char.name);
                                              }}
                                              className="p-1.5 text-cinnabar hover:bg-cinnabar/10 bg-white/80 backdrop-blur-sm rounded-full transition-colors border border-cinnabar/20 shadow-sm"
                                              title="Xóa"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        )}
                                        <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full border border-gold/50 overflow-hidden bg-parchment flex-shrink-0 sm:mb-3 shadow-inner flex items-center justify-center">
                                          {char.avatar ? (
                                            <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                          ) : (
                                            <Users size={16} className="text-gold/40 sm:w-10 sm:h-10" />
                                          )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 sm:w-full text-left sm:text-center flex flex-col h-full">
                                          <h4 className="font-bold text-ink text-xs sm:text-lg truncate leading-tight sm:leading-normal">{char.name}</h4>
                                          <p className="text-[8px] sm:text-[10px] text-sacred-orange font-bold uppercase sm:border-b border-gold/20 sm:pb-2 truncate">{char.role}</p>
                                          <p className="hidden md:block text-[11px] text-wood/60 font-serif italic line-clamp-3 mb-1 mt-2 bg-white/40 p-2 rounded leading-relaxed border border-gold/10 w-full flex-grow">
                                            {char.description ? (char.description.length > 80 ? char.description.substring(0, 80) + '...' : char.description) : "Chưa rõ trọng trách..."}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </DraggableComp>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    ))}
                  </div>
                </DragDropContext>
              </motion.div>
            )}

            {activeTab === 'factions' && (
              <motion.div
                key="factions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 sm:space-y-12"
              >
                 <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white/40 p-4 sm:p-0 rounded-2xl sm:rounded-none border sm:border-0 border-gold/20">
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className={`relative ${canEditUI ? 'group cursor-pointer' : 'cursor-default'} shrink-0`}>
                      <input type="file" id="upload-tab-factions" accept="image/*" className="hidden" onChange={(e) => handleTabIconUpload('factions', e)} disabled={!canEditUI} />
                      <label htmlFor={canEditUI ? "upload-tab-factions" : ""} className={`w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white border sm:border-2 border-gold shadow-md flex items-center justify-center overflow-hidden ${canEditUI ? 'cursor-pointer' : ''}`}>
                        {tabIcons['factions'] ? (
                          <img src={tabIcons['factions']} className="w-full h-full object-cover" />
                        ) : (
                          <Castle className="text-gold/50 w-6 h-6 sm:w-8 sm:h-8" />
                        )}
                        {canEditUI && (
                          <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera size={16} />
                          </div>
                        )}
                      </label>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-4xl font-display font-medium text-jade brush-stroke inline-block">{tabTitles.factions}</h2>
                      <p className="text-stone-500 mt-0.5 sm:mt-4 font-serif text-[10px] sm:text-base">Các bang phái, môn phái vang danh thiên hạ.</p>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <button 
                        onClick={async () => {
                          if (!activeProjectId || !canEdit) return;
                          setConfirmDialog({
                            message: "Bạn có chắc chắn muốn khôi phục lại Thập Đại Môn Phái (Thiếu Lâm, Nga My, Võ Đang...) vào giang hồ?",
                            onConfirm: async () => {
                              try {
                                const batch = writeBatch();
                                FACTIONS.forEach(fac => {
                                  const facId = toSlug(fac.name);
                                  const ref = doc(db, `projects/${activeProjectId}/factions`, facId);
                                  batch.set(ref, withCollaboration({ ...fac, projectId: activeProjectId }));
                                });
                                await batch.commit();
                              } catch (e) {
                                console.error("Lỗi khôi phục môn phái", e);
                              }
                            }
                          });
                        }}
                        className="w-full sm:w-auto bg-wood text-white px-4 lg:px-6 py-2 lg:py-3 rounded-full text-xs sm:text-sm font-bold shadow hover:bg-ink transition-all flex items-center justify-center gap-2"
                      >
                        <RotateCcw size={16} /> Thập Đại Môn Phái
                      </button>
                      <button 
                        onClick={() => {
                          setNewFaction({ name: '', description: '', alignment: 'Chính phái', leader: '', flagAvatar: '' });
                          setEditingFactionIdx(null);
                          setShowAddFaction(true);
                        }}
                        className="w-full sm:w-auto bg-jade text-white px-4 lg:px-8 py-2 lg:py-3 rounded-full text-xs sm:text-sm font-bold shadow-lg hover:bg-ink transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> Thêm Môn Phái
                      </button>
                    </div>
                  )}
                </header>

                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(['Chính phái', 'Tà phái', 'Trung lập'] as const).map((alignment) => (
                      <div key={alignment} className="flex flex-col bg-parchment/30 rounded-3xl border border-gold/30 overflow-hidden shadow-sm h-full">
                        <div className={`p-4 text-center border-b border-gold/20 ${
                           alignment === 'Chính phái' ? 'text-jade bg-jade/10' : 
                           alignment === 'Tà phái' ? 'text-cinnabar bg-cinnabar/10' : 'text-blue-600 bg-blue-600/10'
                        }`}>
                          <h3 className="font-display font-bold text-xl uppercase tracking-widest">{alignment}</h3>
                        </div>
                        
                        <Droppable droppableId={alignment}>
                          {(provided, snapshot) => (
                            <div 
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={`flex-1 p-4 space-y-4 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? 'bg-jade/5' : ''}`}
                            >
                              {factions.filter(f => f.alignment === alignment).map((fac, index) => {
                                const DraggableComp = Draggable as any;
                                const leaderChar = characters.find(c => c.name === fac.leader);
                                return (
                                  <DraggableComp key={fac.id || fac.name} draggableId={`fac-${fac.id || fac.name}`} index={index} isDragDisabled={!canEdit}>
                                    {(providedDrag: any, snapshotDrag: any) => (
                                      <div 
                                        ref={providedDrag.innerRef}
                                        {...providedDrag.draggableProps}
                                        {...(canEdit ? providedDrag.dragHandleProps : {})}
                                        className={`bg-white p-3 sm:p-5 rounded-2xl border border-gold shadow-sm group hover:shadow-md transition-all relative flex flex-row items-center gap-4 ${canEdit ? 'cursor-grab' : 'cursor-default'} ${snapshotDrag.isDragging ? 'shadow-2xl ring-2 ring-jade z-50 scale-105' : ''}`}
                                        onClick={() => setViewingFaction(fac)}
                                      >
                                        <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl bg-sand/20 border border-gold/30 flex items-center justify-center overflow-hidden shrink-0">
                                          {fac.flagAvatar ? (
                                            <img src={fac.flagAvatar} alt={fac.name} className="w-full h-full object-cover" />
                                          ) : (
                                            <Shield size={24} className="text-gold/40 sm:w-10 sm:h-10" />
                                          )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-display font-bold text-ink text-sm sm:text-xl truncate">{fac.name}</h4>
                                          <div className="flex items-center gap-2 mt-1">
                                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden border border-gold/30 bg-sand/10 shrink-0">
                                               {leaderChar?.avatar ? (
                                                 <img src={leaderChar.avatar} alt={leaderChar.name} className="w-full h-full object-cover" />
                                               ) : (
                                                 <Users size={10} className="text-gold m-auto mt-1" />
                                               )}
                                            </div>
                                            <p className="text-[10px] sm:text-xs font-serif italic text-wood truncate">
                                              Chưởng môn: <span className="text-cinnabar not-italic font-bold">{fac.leader || "Ẩn danh"}</span>
                                            </p>
                                          </div>
                                        </div>

                                        {canEdit && (
                                          <div className="flex flex-col gap-1 ml-auto">
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); handleEditFaction(factions.findIndex(f => f.name === fac.name), alignment); }}
                                              className="p-1.5 text-jade hover:bg-jade/10 rounded-lg transition-colors border border-transparent hover:border-jade/30"
                                              title="Sửa"
                                            >
                                              <PenTool size={14} />
                                            </button>
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); if (!canDelete) { alert('Chỉ admin mới có quyền xóa!'); return; } handleDeleteFaction(fac.id || toSlug(fac.name), fac.name); }}
                                              className="p-1.5 text-cinnabar hover:bg-cinnabar/10 rounded-lg transition-colors border border-transparent hover:border-cinnabar/30"
                                              title="Xóa"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </DraggableComp>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    ))}
                  </div>
                </DragDropContext>
              </motion.div>
            )}
            {activeTab === 'weapons' && (
              <motion.div
                key="weapons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 sm:space-y-12"
              >
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white/40 p-4 sm:p-0 rounded-2xl sm:rounded-none border sm:border-0 border-gold/20">
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className={`relative ${(isAdmin || userRole === 'admin') ? 'group cursor-pointer' : 'cursor-default'} shrink-0`}>
                      <input type="file" id="upload-tab-weapons" accept="image/*" className="hidden" onChange={(e) => handleTabIconUpload('weapons', e)} disabled={!(isAdmin || userRole === 'admin')} />
                      <label htmlFor={(isAdmin || userRole === 'admin') ? "upload-tab-weapons" : ""} className={`w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white border sm:border-2 border-gold shadow-md flex items-center justify-center overflow-hidden ${(isAdmin || userRole === 'admin') ? 'cursor-pointer' : ''}`}>
                        {tabIcons['weapons'] ? (
                          <img src={tabIcons['weapons']} className="w-full h-full object-cover" />
                        ) : (
                          <Sword className="text-gold/50 w-6 h-6 sm:w-8 sm:h-8" />
                        )}
                        {(isAdmin || userRole === 'admin') && (
                          <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera size={16} />
                          </div>
                        )}
                      </label>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-4xl font-display font-medium text-blue-600 brush-stroke inline-block">{tabTitles.weapons || 'Thần Binh Lợi Khí'}</h2>
                      <p className="text-stone-500 mt-0.5 sm:mt-2 font-serif italic text-[10px] sm:text-sm">Liệt kê tất cả các vũ khí của các nhân vật.</p>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <button 
                        onClick={async () => {
                          let count = 0;
                          setIsSyncing(true);
                          setSyncStatus("Đang thu thập thần binh từ các nhân sĩ...");
                          try {
                            for (let i = 0; i < characters.length; i++) {
                              const char = characters[i];
                              if (char.weapon && char.weapon.trim() !== '') {
                                count++;
                                setSyncPercentage(Math.round(((i + 1) / characters.length) * 100));
                                await syncWeaponFromCharacter(char.name, char.weapon, char.weaponOrigin, char.weaponAvatar, false); // changed from true to false
                              }
                            }
                            if (count > 0) {
                              alert(`Bẩm báo! Đã rà soát và đồng bộ ${count} Thần Binh từ tất cả nhân sĩ vào kho tàng!`);
                            } else {
                              alert("Hiện tại chưa có nhân sĩ nào điền thông tin Thần Binh.");
                            }
                          } catch (e) {
                            console.error("Sync weapon error:", e);
                            alert("Đã xảy ra lỗi trong quá trình đồng bộ Thần Binh.");
                          } finally {
                            setIsSyncing(false);
                            setSyncStatus("");
                            setSyncPercentage(0);
                          }
                        }}
                        className="w-full sm:w-auto bg-jade text-white px-4 sm:px-6 py-2 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg hover:bg-jade/80 transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={16} /> Đồng Bộ Thần Binh Từ Nhân Vật
                      </button>
                      <button 
                        onClick={() => {
                          setNewWeapon({ id: Date.now().toString(), name: '', origin: '', effect: '', avatar: '', owner: '' });
                          setEditingWeaponIdx(null);
                          setShowAddWeapon(true);
                        }}
                        className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg hover:bg-ink transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> Thêm Vũ Khí
                      </button>
                    </div>
                  )}
                </header>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                  {weapons.map((weapon, index) => (
                    <div 
                      key={weapon.id || index}
                      onClick={(e) => {
                         // Prevent click if we are clicking on the edit/delete buttons
                         if ((e.target as HTMLElement).closest('button')) return;
                         setSelectedWeapon(weapon);
                      }}
                      className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl lg:rounded-3xl border lg:border-2 border-gold/40 shadow-sm hover:shadow-md transition-all flex flex-row lg:flex-col items-start lg:items-center lg:text-center relative overflow-hidden group cursor-pointer h-full"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 lg:h-24 bg-gradient-to-b from-blue-600/20 to-transparent"></div>
                      
                      <div className="flex flex-col items-center shrink-0 z-10 w-24 sm:w-32 lg:w-auto mr-3 sm:mr-4 lg:mr-0 ml-0">
                        <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-28 lg:h-28 rounded-full bg-sand/30 border border-white lg:border-4 shadow-lg flex items-center justify-center overflow-hidden p-1 group-hover:border-blue-600/30 transition-colors">
                          <div className="w-full h-full rounded-full border border-gold/40 overflow-hidden bg-white flex items-center justify-center">
                            {weapon.avatar ? (
                              <img src={weapon.avatar} alt={weapon.name} className="w-full h-full object-cover" />
                            ) : (
                              <Sword size={24} className="text-gold/50 lg:w-10 lg:h-10" />
                            )}
                          </div>
                        </div>
                      
                        <div className="flex flex-row mt-2 sm:mt-3 gap-1 lg:gap-1.5 font-sans">
                           {canEdit && (
                             <>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setNewWeapon({...weapon}); setEditingWeaponIdx(index); setShowAddWeapon(true); }}
                                 className="p-1 lg:p-1.5 bg-white shadow-md rounded-lg text-jade border border-gold/20 hover:bg-jade hover:text-white transition-colors"
                               >
                                 <PenTool size={12} lg:size={12} />
                               </button>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); if (!canDelete) { alert('Chỉ admin mới có quyền xóa!'); return; } handleDeleteWeapon(weapon.id || toSlug(weapon.name), weapon.name); }}
                                 className="p-1 lg:p-1.5 bg-white shadow-md rounded-lg text-cinnabar border border-gold/20 hover:bg-cinnabar hover:text-white transition-colors"
                               >
                                 <Trash2 size={12} lg:size={12} />
                               </button>
                             </>
                           )}
                        </div>
                      </div>
                    
                      <div className="flex-1 text-left lg:text-center z-10 min-w-0 flex flex-col h-full pl-2 lg:pl-0">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-ink mb-1 sm:mb-2 leading-tight whitespace-normal break-words">{weapon.name}</h3>
                        {weapon.owner && <p className="text-sm font-bold text-blue-700">{weapon.owner}</p>}
                        <div className="hidden lg:block w-12 h-1 bg-blue-600/40 mb-4 rounded-full mx-auto mt-2"></div>
                      
                        <div className="w-full bg-sand/10 lg:bg-sand/20 p-2 sm:p-3 lg:p-4 rounded-lg lg:rounded-2xl border border-gold/10 lg:border-gold/20 flex-1">
                           <div className="flex items-center gap-1.5 lg:gap-2 mb-1 lg:mb-2 text-blue-600">
                             <Sparkles size={12} className="lg:w-[14px] lg:h-[14px]" />
                             <span className="text-[9px] lg:text-[10px] uppercase font-bold tracking-widest">Nguồn gốc</span>
                           </div>
                           <p className="text-[11px] lg:text-xs font-serif text-ink/80 italic leading-snug lg:leading-relaxed text-left line-clamp-2">{weapon.origin || "Chưa rõ lai lịch"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {weapons.length === 0 && (
                     <div className="col-span-full py-20 flex flex-col items-center justify-center text-wood/50">
                        <Sword size={64} className="mb-4 opacity-20" />
                        <p className="font-serif italic">Chưa có thần binh nào xuất thế...</p>
                     </div>
                  )}
                </div>
              </motion.div>
            )}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 bg-white/40 rounded-2xl border border-gold/20"
              >
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className={`relative ${canEditUI ? 'group cursor-pointer' : 'cursor-default'} shrink-0`}>
                      {canEditUI && (
                        <input 
                          type="file" 
                          id="upload-tab-settings" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleTabIconUpload('settings', e)} 
                        />
                      )}
                      <label 
                        htmlFor={canEditUI ? "upload-tab-settings" : undefined} 
                        className={`w-12 h-12 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-gold shadow-md flex items-center justify-center overflow-hidden ${canEditUI ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        {tabIcons.settings ? (
                          <img src={tabIcons.settings} alt="Tab Icon" className="w-full h-full object-cover" />
                        ) : (
                          <Settings className="text-gold/50" size={32} />
                        )}
                        {canEdit && (
                          <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera size={20} />
                          </div>
                        )}
                      </label>
                    </div>
                    <div>
                      <h2 className="text-2xl font-serif text-wood">{tabTitles.settings}</h2>
                      <p className="text-[#8c6746]/60 font-serif italic text-xs sm:text-sm">Điều chỉnh cơ cấu và kết nối Thiên Thư.</p>
                    </div>
                  </div>
                </header>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                    <span>Kết nối Thiên Thư:</span>
                    <div className="flex items-center gap-2 font-bold">
                        {storageMode === 'local' ? (
                             <span className="text-cinnabar flex items-center gap-1">
                                <WifiOff size={16} /> Gián Đoạn (Bản Địa)
                            </span>
                        ) : firebaseConnected === null ? (
                            <span className="text-gray-400 italic">Đang bói quẻ...</span>
                        ) : firebaseConnected ? (
                            <span className="text-jade flex items-center gap-1">
                                <Check size={16} /> Thông suốt
                            </span>
                        ) : (
                            <span className="text-cinnabar flex items-center gap-1">
                                <WifiOff size={16} /> Bị đứt đoạn
                            </span>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                    <span>Phương thức tàng trữ:</span>
                    <select 
                      value={storageMode} 
                      onChange={(e) => setStorageMode(e.target.value as 'local' | 'cloud')}
                      className="p-2 rounded border border-gold/20"
                    >
                      <option value="local">Tàng trữ bản địa</option>
                      <option value="cloud">Vân đoan đồng bộ</option>
                    </select>
                  </div>

                  {/* Đồng bộ section - Always visible but disabled in local mode */}
                  <div className="p-4 bg-white/50 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                          <h3 className="font-bold text-wood">Đồng bộ Đại Pháp</h3>
                          <div className="flex gap-2">
                              <button 
                                  disabled={!firebaseConnected || offlineMode || isSyncing || storageMode === 'local' || quotaExceeded}
                                  onClick={handleSyncPull}
                                  className={`bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-amber-700 transition-all ${( !firebaseConnected || offlineMode || isSyncing || storageMode === 'local' || quotaExceeded) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                              >
                                  {tabIcons.downloadSuccess ? (
                                    <div className="w-4 h-4 rounded-full overflow-hidden">
                                        <img src={tabIcons.downloadSuccess} className="w-full h-full object-cover" />
                                    </div>
                                  ) : (
                                    <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                                  )}
                                  Nhận Truyền Công
                              </button>
                              {canEdit && (
                                <button 
                                    disabled={!firebaseConnected || offlineMode || isSyncing || storageMode === 'local' || quotaExceeded}
                                    onClick={handleManualSync}
                                    className={`bg-jade text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-jade/80 transition-all ${( !firebaseConnected || offlineMode || isSyncing || storageMode === 'local' || quotaExceeded) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                >
                                    {tabIcons.uploadSuccess ? (
                                      <div className="w-4 h-4 rounded-full overflow-hidden">
                                          <img src={tabIcons.uploadSuccess} className="w-full h-full object-cover" />
                                      </div>
                                    ) : (
                                      <Zap size={16} className="text-blue-200 animate-pulse" />
                                    )}
                                    Truyền Công
                                </button>
                              )}
                          </div>
                      </div>
                      <p className="text-[11px] text-stone-500 italic">
                          * Sử dụng để đồng bộ dữ liệu giữa Bản Địa và Thiên Thư. Cần chuyển sang "Vân đoan đồng bộ" để kích hoạt.
                      </p>
                      {quotaResetCountdown && (
                        <p className="text-[11px] text-amber-700 italic font-bold">
                          * Linh khí (Quota Firebase) sẽ hoàn toàn hồi phục sau: [{quotaResetCountdown}] (00:00 theo giờ Thái Bình Dương).
                        </p>
                      )}
                  </div>
                  
                  {(isAdmin || userRole === 'admin') && (
                    <div className="p-4 bg-white/50 rounded-lg space-y-4">
                       <h3 className="font-bold text-wood">Thiết Lập Thông Báo</h3>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <label className="text-xs font-bold text-wood uppercase">Icon Truyền Công Thành Công</label>
                           <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-white border border-jade flex items-center justify-center overflow-hidden shrink-0">
                                {tabIcons.uploadSuccess ? (
                                  <img src={tabIcons.uploadSuccess} className="w-full h-full object-cover" />
                                ) : (
                                  <Sparkles className="text-jade" size={20} />
                                )}
                              </div>
                              <input type="file" id="success-upload-icon" className="hidden" accept="image/*" onChange={(e) => handleTabIconUpload('uploadSuccess', e)} />
                              <label htmlFor="success-upload-icon" className="bg-jade text-white px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer hover:bg-jade/80 transition-all">Đổi Icon</label>
                           </div>
                         </div>

                         <div className="space-y-2">
                           <label className="text-xs font-bold text-wood uppercase">Icon Nhận Truyền Công Thành Công</label>
                           <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-white border border-jade flex items-center justify-center overflow-hidden shrink-0">
                                {tabIcons.downloadSuccess ? (
                                  <img src={tabIcons.downloadSuccess} className="w-full h-full object-cover" />
                                ) : (
                                  <Sparkles className="text-jade" size={20} />
                                )}
                              </div>
                              <input type="file" id="success-download-icon" className="hidden" accept="image/*" onChange={(e) => handleTabIconUpload('downloadSuccess', e)} />
                              <label htmlFor="success-download-icon" className="bg-jade text-white px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer hover:bg-jade/80 transition-all">Đổi Icon</label>
                           </div>
                         </div>
                       </div>
                     </div>
                  )}

                  <div className="p-4 bg-white/50 rounded-lg space-y-4 mt-6">
                    <div className="pt-4 border-t border-gold/10">
                     <h3 className="font-bold text-wood mb-2">Biên soạn Giang Hồ Lục Ký</h3>
                     {!(isAdmin || userRole === 'admin') && (
                         <div className="text-xs text-jade font-bold mb-2 italic">Trạng thái: Đã xuất bản</div>
                     )}
                     <textarea 
                         value={aboutContent}
                         onChange={!(isAdmin || userRole === 'admin') ? undefined : (e) => setAboutContent(e.target.value)}
                         readOnly={!(isAdmin || userRole === 'admin')}
                         className={`w-full h-40 bg-white/50 text-stone-800 p-4 rounded-lg border border-gold/30 ${!(isAdmin || userRole === 'admin') ? 'opacity-70 cursor-not-allowed' : ''}`}
                     />
                     {(isAdmin || userRole === 'admin') && (
                       <button 
                           onClick={async () => {
                             if (!activeProjectId) return;
                             await updateDoc(doc(db, 'projects', activeProjectId), { aboutContent });
                             alert('Đã lưu Giang Hồ Lục Ký thành công!');
                           }}
                           className="bg-amber-800 text-white px-6 py-2 rounded-lg font-bold mt-2"
                       >
                           Lưu Giang Hồ Lục Ký
                       </button>
                     )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === 'artifacts' && (
              <motion.div
                key="artifacts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 sm:space-y-12"
              >
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white/40 p-4 sm:p-0 rounded-2xl sm:rounded-none border sm:border-0 border-gold/20">
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className={`relative ${(isAdmin || userRole === 'admin') ? 'group cursor-pointer' : 'cursor-default'} shrink-0`}>
                      <input type="file" id="upload-tab-artifacts" accept="image/*" className="hidden" onChange={(e) => handleTabIconUpload('artifacts', e)} disabled={!(isAdmin || userRole === 'admin')} />
                      <label htmlFor={(isAdmin || userRole === 'admin') ? "upload-tab-artifacts" : ""} className={`w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white border sm:border-2 border-gold shadow-md flex items-center justify-center overflow-hidden ${(isAdmin || userRole === 'admin') ? 'cursor-pointer' : ''}`}>
                        {tabIcons['artifacts'] ? (
                          <img src={tabIcons['artifacts']} className="w-full h-full object-cover" />
                        ) : (
                          <Gem className="text-gold/50 w-6 h-6 sm:w-8 sm:h-8" />
                        )}
                        {(isAdmin || userRole === 'admin') && (
                          <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera size={16} />
                          </div>
                        )}
                      </label>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-4xl font-display font-medium text-sacred-orange brush-stroke inline-block">{tabTitles.artifacts || 'Giang Hồ Bí Bảo'}</h2>
                      <p className="text-stone-500 mt-0.5 sm:mt-2 font-serif italic text-[10px] sm:text-sm">Danh sách các kỳ trân dị bảo trên giang hồ.</p>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <button 
                        onClick={async () => {
                          if (!activeProjectId || !canEdit) return;
                          setConfirmDialog({
                            message: "Bạn có chắc chắn muốn khôi phục lại các Bí Bảo Truyền Thuyết (Cửu Chuyển Hoàn Hồn Đan, Tẩy Tuỷ Kinh...) vào giang hồ?",
                            onConfirm: async () => {
                              try {
                                const batch = writeBatch();
                                ARTIFACTS.forEach(art => {
                                  const artId = toSlug(art.name);
                                  const ref = doc(db, `projects/${activeProjectId}/artifacts`, artId);
                                  batch.set(ref, withCollaboration({ ...art, id: artId, projectId: activeProjectId }));
                                });
                                await batch.commit();
                              } catch (e) {
                                console.error(e);
                                handleWuxiaException(e, "khôi phục bí bảo");
                              }
                            }
                          });
                        }}
                        className="w-full sm:w-auto bg-wood text-white px-4 lg:px-6 py-2 lg:py-3 rounded-full text-xs sm:text-sm font-bold shadow hover:bg-ink transition-all flex items-center justify-center gap-2"
                      >
                        <RotateCcw size={16} /> Bí Bảo Truyền Thuyết
                      </button>
                      <button 
                        onClick={() => {
                          setNewArtifact({ id: Date.now().toString(), name: '', origin: '', effect: '', avatar: '' });
                          setEditingArtifactIdx(null);
                          setShowAddArtifact(true);
                        }}
                        className="w-full sm:w-auto bg-sacred-orange text-white px-4 sm:px-6 py-2 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg hover:bg-ink transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> Thêm Bí Bảo
                      </button>
                    </div>
                  )}
                </header>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                  {artifacts.map((artifact, index) => (
                    <div 
                      key={artifact.id || index} 
                      onClick={() => setSelectedArtifact(artifact)}
                      className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl lg:rounded-3xl border lg:border-2 border-gold/40 shadow-sm hover:shadow-md transition-all flex flex-row lg:flex-col items-start lg:items-center lg:text-center relative overflow-hidden group cursor-pointer h-full"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 lg:h-24 bg-gradient-to-b from-sacred-orange/20 to-transparent"></div>
                      
                      <div className="flex flex-col items-center shrink-0 z-10 w-24 sm:w-32 lg:w-auto mr-3 sm:mr-4 lg:mr-0 ml-0">
                        <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-28 lg:h-28 rounded-full bg-sand/30 border border-white lg:border-4 shadow-lg flex items-center justify-center overflow-hidden p-1 group-hover:border-sacred-orange/30 transition-colors">
                          <div className="w-full h-full rounded-full border border-gold/40 overflow-hidden bg-white flex items-center justify-center">
                            {artifact.avatar ? (
                              <img src={artifact.avatar} alt={artifact.name} className="w-full h-full object-cover" />
                            ) : (
                              <Gem size={24} className="text-gold/50 lg:w-10 lg:h-10" />
                            )}
                          </div>
                        </div>
                      
                        <div className="flex flex-row mt-2 sm:mt-3 gap-1 lg:gap-1.5 font-sans">
                           {canEdit && (
                             <>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setNewArtifact({...artifact}); setEditingArtifactIdx(index); setShowAddArtifact(true); }}
                                 className="p-1 lg:p-1.5 bg-white shadow-md rounded-lg text-jade border border-gold/20 hover:bg-jade hover:text-white transition-colors"
                               >
                                 <PenTool size={12} lg:size={12} />
                               </button>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); if (!canDelete) { alert('Chỉ admin mới có quyền xóa!'); return; } handleDeleteArtifact(artifact.id || toSlug(artifact.name), artifact.name); }}
                                 className="p-1 lg:p-1.5 bg-white shadow-md rounded-lg text-cinnabar border border-gold/20 hover:bg-cinnabar hover:text-white transition-colors"
                               >
                                 <Trash2 size={12} lg:size={12} />
                               </button>
                             </>
                           )}
                        </div>
                      </div>
                    
                      <div className="flex-1 text-left lg:text-center z-10 min-w-0 flex flex-col h-full pl-2 lg:pl-0">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-ink mb-1 sm:mb-2 leading-tight whitespace-normal break-words">{artifact.name}</h3>
                        <div className="hidden lg:block w-12 h-1 bg-sacred-orange/40 mb-4 rounded-full mx-auto"></div>
                      
                        <div className="w-full bg-sand/10 lg:bg-sand/20 p-2 sm:p-3 lg:p-4 rounded-lg lg:rounded-2xl border border-gold/10 lg:border-gold/20 flex-1">
                           <div className="flex items-center gap-1.5 lg:gap-2 mb-1 lg:mb-2 text-sacred-orange">
                             <Sparkles size={12} className="lg:w-[14px] lg:h-[14px]" />
                             <span className="text-[9px] lg:text-[10px] uppercase font-bold tracking-widest">Nguồn gốc</span>
                           </div>
                           <p className="text-[11px] lg:text-xs font-serif text-ink/80 italic leading-snug lg:leading-relaxed text-left line-clamp-2">{artifact.origin || "Chưa rõ lai lịch"}</p>
                           
                           <div className="flex items-center gap-1.5 lg:gap-2 mb-1 lg:mb-2 mt-2 sm:mt-3 lg:mt-4 text-cinnabar">
                             <Flame size={12} className="lg:w-[14px] lg:h-[14px]" />
                             <span className="text-[9px] lg:text-[10px] uppercase font-bold tracking-widest">Công dụng</span>
                           </div>
                           <p className="text-[11px] lg:text-xs font-serif text-ink/90 leading-snug lg:leading-relaxed text-left line-clamp-2">{artifact.effect || "Chưa rõ kỳ thư"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {artifacts.length === 0 && (
                     <div className="col-span-full py-20 flex flex-col items-center justify-center text-wood/50">
                        <Gem size={64} className="mb-4 opacity-20" />
                        <p className="font-serif italic">Chưa có kỳ trân dị bảo nào xuất thế...</p>
                     </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sync Progress Overlay */}
        {isSyncing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 backdrop-blur-md p-4">
              <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-parchment rounded-3xl p-8 max-w-sm w-full shadow-2xl border-4 border-gold text-center relative overflow-hidden"
              >
                  {/* Decorative background */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none">
                      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold via-transparent to-transparent"></div>
                  </div>

                  <div className="mb-6 relative h-32 w-32 mx-auto flex items-center justify-center">
                      <svg className="transform -rotate-90 w-32 h-32">
                          <circle
                              cx="64"
                              cy="64"
                              r="58"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="transparent"
                              className="text-gold/10"
                          />
                          <circle
                              cx="64"
                              cy="64"
                              r="58"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={364.4}
                              strokeDashoffset={364.4 - (364.4 * syncPercentage) / 100}
                              className="text-gold transition-all duration-300"
                          />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-black text-wood font-mono">{syncPercentage}%</span>
                      </div>
                  </div>
                  
                  <h3 className="text-xl font-serif font-bold text-ink mb-2">Đang vận công...</h3>
                  <p className="text-sm text-wood italic mb-6 leading-relaxed">{syncStatus}</p>
                  
                  <div className="w-full bg-gold/10 rounded-full h-2 overflow-hidden border border-gold/20">
                      <motion.div 
                          className="h-full bg-gradient-to-r from-gold to-amber-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${syncPercentage}%` }}
                      />
                  </div>
                  
                  <p className="mt-6 text-[10px] text-stone-400 uppercase tracking-[0.2em] font-bold">Thiên Thư Đang Thủ Bản</p>
              </motion.div>
          </div>
        )}

        {/* Success Popup for Sync */}
        <AnimatePresence>
          {showSyncSuccess && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/60 backdrop-blur-md p-4"
            >
              <motion.div 
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className="bg-parchment rounded-3xl p-8 max-w-sm w-full shadow-2xl border-4 border-jade text-center relative overflow-hidden"
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-jade/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-jade/10 rounded-full blur-3xl"></div>
                
                <div className="mb-6 w-20 h-20 bg-jade/20 rounded-full mx-auto flex items-center justify-center border-2 border-jade/30 shadow-inner overflow-hidden">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.2 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {syncSuccessType === 'upload' ? (
                      tabIcons.uploadSuccess ? (
                        <img src={tabIcons.uploadSuccess} alt="Success" className="w-full h-full object-cover" />
                      ) : (
                        <Sparkles className="text-jade" size={40} />
                      )
                    ) : (
                      tabIcons.downloadSuccess ? (
                        <img src={tabIcons.downloadSuccess} alt="Success" className="w-full h-full object-cover" />
                      ) : (
                        <Sparkles className="text-jade" size={40} />
                      )
                    )}
                  </motion.div>
                </div>
                
                <h3 className="text-2xl font-display font-bold text-ink mb-2">Công Thành Danh Toại!</h3>
                
                <p className="text-sm text-wood italic mb-8 leading-relaxed px-4">
                  {syncSuccessType === 'upload' 
                    ? "Chúc mừng hảo hán! Truyền Công Đại Pháp đã hoàn tất, dữ liệu đã được ghi danh vào Thiên Thư mỹ mãn."
                    : "Đã hoàn tất nhận truyền công! Công lực của hảo hán hiện đã tăng tiến vượt bậc, vạn sự hanh thông."}
                </p>
                
                <button 
                  onClick={() => setShowSyncSuccess(false)}
                  className="w-full py-4 bg-jade text-white font-bold rounded-2xl hover:bg-ink transition-all shadow-xl shadow-jade/20 border border-jade/50 active:scale-95"
                >
                  Đóng (Thu Công)
                </button>
                
                <div className="mt-6 flex items-center justify-center gap-2 opacity-30">
                  <div className="h-[1px] w-8 bg-wood"></div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-wood">Chỉnh lý xong</span>
                  <div className="h-[1px] w-8 bg-wood"></div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Modal: Episode Detail & Script Gen */}
        <AnimatePresence>
          {selectedEpisode && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-md p-2 sm:p-4 md:p-12"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-parchment w-full max-w-6xl h-full rounded-xl sm:rounded-2xl shadow-2xl relative flex flex-col border border-gold overflow-hidden"
              >
                <button 
                  onClick={() => {
                    setSelectedEpisode(null);
                    setGeneratedScript(null);
                    setVideoPrompt(null);
                  }}
                  className="absolute top-3 right-3 sm:top-6 sm:right-6 p-2 hover:bg-cinnabar/10 text-cinnabar transition-colors z-50 rounded-full"
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  {/* Left Side: Summary */}
                  <div className="w-full md:w-1/3 p-4 sm:p-10 border-b md:border-b-0 md:border-r border-gold/30 overflow-y-auto scroll-y-custom bg-sand/30">
                    <span className="text-cinnabar font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">
                      Quá trình biên soạn · {selectedEpisode.arc === 'NGOẠI TRUYỆN' || selectedEpisode.arc === 'KÝ ỨC' ? selectedEpisode.arc : `Cảnh ${selectedEpisode.id}`}
                    </span>
                    <h3 className="text-xl sm:text-4xl font-display font-bold mt-1 sm:mt-4 leading-tight italic text-ink break-words whitespace-normal">{selectedEpisode.title}</h3>
                    
                    <div className="mt-4 sm:mt-10 space-y-4 sm:space-y-8">
                      <div>
                        <h4 className="text-[8px] sm:text-[10px] font-bold uppercase text-wood opacity-40 mb-3 sm:mb-6 tracking-widest flex items-center gap-2">
                          <div className="w-3 sm:w-4 h-[1px] bg-wood"></div> Sườn Chi Tiết Cảnh Phim
                        </h4>
                        <div className="space-y-3 sm:space-y-6 relative border-l border-gold/30 ml-2 pl-4 sm:pl-6">
                          {selectedEpisode.summary.map((s, i) => (
                            <div key={i} className="relative group">
                              <div className="absolute left-[-21px] sm:left-[-29px] top-1 sm:top-1.5 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-cinnabar/40 ring-2 sm:ring-4 ring-parchment"></div>
                              <p className="text-xs sm:text-sm text-ink/90 font-serif leading-relaxed italic group-hover:text-cinnabar transition-colors">{s}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 sm:pt-10 space-y-3 sm:space-y-4">
                        {canEdit && (
                          <button 
                            onClick={() => handleGenerateScript(selectedEpisode)}
                            disabled={isGenerating}
                            className="w-full py-3 sm:py-4 bg-cinnabar text-white font-bold rounded-full flex items-center justify-center gap-2 sm:gap-3 hover:bg-ink transition-all shadow-xl shadow-cinnabar/20 disabled:opacity-50 text-xs sm:text-base"
                          >
                            {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <BookOpen size={16} />}
                            {isGenerating ? "Đang chuẩn bị..." : "Xem Kịch Bản Toàn Bộ"}
                          </button>
                        )}
                        <p className="text-[8px] sm:text-[9px] text-center text-wood opacity-40 uppercase tracking-widest font-bold">Khởi tạo bởi Gemini 1.5 Flash</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Generated Content */}
                  <div className="flex-1 p-4 sm:p-6 lg:p-12 overflow-y-auto scroll-y-custom bg-white/40 font-serif">
                    {!generatedScript && !isGenerating && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 lg:p-12 space-y-4 sm:space-y-6 opacity-30">
                        <PenTool size={48} className="text-wood sm:w-20 sm:h-20" strokeWidth={1} />
                        <div className="space-y-1 sm:space-y-2">
                          <h3 className="text-lg sm:text-2xl font-display font-bold text-ink">Bản Thảo Chưa Khởi Tạo</h3>
                          <p className="text-[10px] sm:text-sm">Hãy nhấn nút bên trái để bắt đầu quá trình chấp bút.</p>
                        </div>
                      </div>
                    )}

                    {isGenerating && (
                      <div className="h-full flex flex-col items-center justify-center space-y-4 sm:space-y-6">
                        <Loader2 className="animate-spin text-cinnabar sm:w-12 sm:h-12" size={40} />
                        <div className="text-center space-y-1 sm:space-y-2">
                          <p className="font-display italic text-lg sm:text-xl text-ink">Đang tra từ điển, mài nghiên mực...</p>
                          <p className="text-[10px] sm:text-xs text-wood opacity-40 uppercase tracking-widest">Vui lòng đợi trong giây lát</p>
                        </div>
                      </div>
                    )}

                    {generatedScript && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-none font-serif text-justify-viet"
                      >
                        <div className="flex justify-between items-center mb-12 border-b-2 border-parchment pb-6">
                          <div>
                            <h4 className="text-2xl font-display font-bold m-0 text-ink italic">Toàn bộ Cảnh: {selectedEpisode.title}</h4>
                            <p className="text-xs text-wood opacity-50 mt-1 uppercase tracking-widest font-bold">Gợi ý từ AI Kiếm Hiệp</p>
                          </div>
                          <div className="flex gap-2">
                            <span className="bg-cinnabar text-white text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest shadow-md">Kịch Bản Chi Tiết</span>
                          </div>
                        </div>
                        <div className="whitespace-pre-wrap leading-loose text-ink/90 text-lg first-letter:text-7xl first-letter:font-display first-letter:text-cinnabar first-letter:mr-4 first-letter:float-left first-letter:mt-2">
                          <FormattedText text={generatedScript} characters={characters} artifacts={artifacts} factions={factions} />
                        </div>

                        {/* Video Prompt Section */}
                        <div className="mt-12 p-6 bg-jade/5 rounded-2xl border border-jade/10">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Video size={18} className="text-jade" />
                              <h5 className="text-[10px] uppercase font-black tracking-widest text-jade">AI Video Prompt (15s)</h5>
                            </div>
                            <button 
                              onClick={() => selectedEpisode && handleGenerateVideoPrompt(selectedEpisode, generatedScript || '')}
                              disabled={isGeneratingVideoPrompt}
                              className="px-4 py-1.5 bg-jade text-white text-[10px] font-bold rounded-full hover:bg-ink transition-all shadow-md shadow-jade/20 disabled:opacity-50"
                            >
                              {isGeneratingVideoPrompt ? "Đang tấu sớ..." : videoPrompt ? "Làm mới Prompt" : "Tạo Prompt Video"}
                            </button>
                          </div>
                          
                          {isGeneratingVideoPrompt ? (
                            <div className="flex items-center justify-center p-8 bg-white/40 rounded-xl border border-dashed border-jade/20">
                              <Loader2 className="animate-spin text-jade" size={24} />
                            </div>
                          ) : videoPrompt ? (
                            <div className="relative group/v">
                              <textarea 
                                value={videoPrompt}
                                onChange={(e) => setVideoPrompt(e.target.value)}
                                className="w-full p-4 bg-white/60 rounded-xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-jade/80 border border-jade/10 focus:ring-1 focus:ring-jade outline-none min-h-[200px]"
                              />
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(videoPrompt);
                                  alert("Đã sao chép nội dung vào bộ nhớ!");
                                }}
                                className="absolute top-2 right-2 p-2 bg-jade/10 text-jade rounded-lg opacity-0 group-hover/v:opacity-100 transition-opacity hover:bg-jade hover:text-white"
                                title="Sao chép"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                              </button>
                              <p className="mt-3 text-[9px] italic text-jade/60 text-center">Prompt này được tối ưu hóa cho Seedance 2.0 (15 giây). Bạn có thể chỉnh sửa trực tiếp phía trên.</p>
                            </div>
                          ) : (
                            <p className="text-[10px] text-wood/40 italic text-center p-4">Nhấn nút bên trên để tạo prompt video nghệ thuật cho phân cảnh này.</p>
                          )}
                        </div>
                        
                        <div className="mt-16 pt-8 border-t border-parchment flex items-center justify-center opacity-20">
                          <div className="w-24 h-[1px] bg-ink"></div>
                          <div className="mx-4 text-xs font-bold uppercase tracking-widest">Hết Bản Thảo</div>
                          <div className="w-24 h-[1px] bg-ink"></div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Character Modal */}
        <AnimatePresence>
          {showAddChar && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 overflow-y-auto">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-parchment p-8 rounded-2xl border border-gold max-w-2xl w-full shadow-2xl relative my-8">
                <button onClick={() => setShowAddChar(false)} className="absolute top-4 right-4 text-wood"><X size={20} /></button>
                <h3 className="text-2xl font-display font-bold text-cinnabar mb-6">
                  {editingCharIdx !== null ? 'Chỉnh Sửa Hồ Sơ' : 'Chiêu Mộ Cao Thủ'}
                </h3>
                <form onSubmit={handleAddCharacter} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto px-2">
                  <div className="space-y-4">
                    <div className="flex flex-col items-center mb-4 py-2 border-b border-gold/10">
                      <div 
                        className={`w-32 h-32 rounded-full bg-sand/30 border-2 border-dashed border-gold flex items-center justify-center relative overflow-hidden group/upload ${canEdit ? 'cursor-pointer' : 'cursor-default'} shadow-inner transition-all ${canEdit ? 'hover:border-cinnabar' : ''}`} 
                        onClick={() => canEdit && document.getElementById('avatar-upload')?.click()}
                      >
                        {newChar.avatar ? (
                          <img src={newChar.avatar} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                             <Plus className="text-gold" size={40} />
                             <span className="text-[10px] font-bold text-gold uppercase tracking-tighter">Chọn Ảnh</span>
                          </div>
                        )}
                        {canEdit && (
                          <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus className="text-white" size={32} />
                          </div>
                        )}
                      </div>
                      <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={!canEdit} />
                      {canEdit && (
                        <button 
                          type="button"
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                          className="mt-3 px-4 py-1.5 bg-sand border border-gold/50 rounded-full text-[10px] font-bold text-wood hover:bg-gold hover:text-white transition-all uppercase tracking-widest flex items-center gap-2"
                        >
                          <Camera size={12} /> Tải Ảnh Chân Dung
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 relative">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Tên Nhân Vật</label>
                        </div>
                        <input 
                          readOnly={!canEdit} 
                          autoFocus 
                          required 
                          value={newChar.name || ''} 
                          onChange={e => {
                            const name = capitalizeName(e.target.value);
                            const abbrev = getAbbreviation(name);
                            setNewChar({...newChar, name, abbreviation: newChar.abbreviation || abbrev});
                          }} 
                          type="text" 
                          className="w-full bg-white/50 backdrop-blur-sm border border-gold/30 rounded-xl px-4 py-3 text-ink placeholder:text-ink/40 focus:ring-2 focus:ring-cinnabar/30 focus:border-cinnabar/50 transition-all text-sm" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Viết Tắt</label>
                        <input readOnly={!canEdit} value={newChar.abbreviation || ''} onChange={e => setNewChar({...newChar, abbreviation: e.target.value})} placeholder="VD: TV" type="text" className="w-full bg-white/50 backdrop-blur-sm border border-gold/30 rounded-xl px-4 py-3 text-ink placeholder:text-ink/40 focus:ring-2 focus:ring-cinnabar/30 focus:border-cinnabar/50 transition-all text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Vị Thế / Chức Phận</label>
                        <input readOnly={!canEdit} required value={newChar.role || ''} onChange={e => setNewChar({...newChar, role: e.target.value})} placeholder="VD: Sư phụ, Đệ tử, Lãng khách..." type="text" className="w-full bg-white/50 backdrop-blur-sm border border-gold/30 rounded-xl px-4 py-3 text-ink placeholder:text-ink/40 focus:ring-2 focus:ring-cinnabar/30 focus:border-cinnabar/50 transition-all text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Gia tộc / Môn phái</label>
                        <select 
                          disabled={!canEdit}
                          value={newChar.faction} 
                          onChange={e => setNewChar({...newChar, faction: e.target.value as any})}
                          className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-cinnabar text-sm"
                        >
                          <option value="Chính phái">Chính phái</option>
                          <option value="Tà phái">Tà phái</option>
                          <option value="Trung lập">Trung lập</option>
                          <option value="NPC">NPC</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Tình Trạng</label>
                        <select 
                          disabled={!canEdit}
                          value={newChar.status || 'appeared'} 
                          onChange={e => setNewChar({...newChar, status: e.target.value as 'appeared' | 'upcoming'})}
                          className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-cinnabar text-sm"
                        >
                          <option value="appeared">Đã xuất hiện</option>
                          <option value="upcoming">Sắp xuất hiện</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1 relative">
                       <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Ngoại Hình / Y Phục</label>
                          {canEdit && (
                            <button 
                              type="button"
                              onClick={() => handleToggleGenericDictation('char_attire', (val) => setNewChar({...newChar, attire: val}), newChar.attire || "", "Mô tả lại ngoại hình và trang phục nhân vật kiếm hiệp sau cho sang trọng và đậm chất cổ phong:\n\n\"{{transcript}}\"")}
                              disabled={isTranslatingSpeech && genericDictationField !== 'char_attire'}
                              className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 px-2 py-0.5 rounded-full transition-all border ${isListening && genericDictationField === 'char_attire' ? 'bg-red-500 text-white animate-pulse border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'text-jade border-jade/20 hover:bg-jade/5'}`}
                            >
                              {isListening && genericDictationField === 'char_attire' ? <MicOff size={10} className="mr-1" /> : <Mic size={10} className="mr-1" />} 
                              {isListening && genericDictationField === 'char_attire' ? 'Đang nghe' : 'Truyền âm'}
                            </button>
                          )}
                       </div>
                       <textarea readOnly={!canEdit} value={newChar.attire || ''} onChange={e => setNewChar({...newChar, attire: e.target.value})} placeholder="Mô tả ngoại hình, y phục, phụ kiện..." className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-cinnabar h-20 text-sm" />
                    </div>
                    <div className="space-y-1 pt-2 relative">
                      <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Vũ Khí</label>
                        </div>
                       <input value={newChar.weapon || ''} onChange={e => setNewChar({...newChar, weapon: e.target.value})} placeholder="Tên vũ khí..." type="text" className="w-full bg-white/50 backdrop-blur-sm border border-gold/30 rounded-xl px-4 py-3 text-ink placeholder:text-ink/40 focus:ring-2 focus:ring-cinnabar/30 focus:border-cinnabar/50 transition-all text-sm" />
                    </div>
                    <div className="space-y-1 relative">
                       <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Nguồn Gốc Vũ Khí</label>
                          <button 
                            type="button"
                            onClick={() => handleToggleGenericDictation('char_weaponOrigin', (val) => setNewChar({...newChar, weaponOrigin: val}), newChar.weaponOrigin || "", "Chuyển văn bản sau nói về lai lịch truyền thuyết của bảo khí sang văn phong kiếm hiệp (phù hợp tiểu thuyết):\n\n\"{{transcript}}\"")}
                            disabled={isTranslatingSpeech && genericDictationField !== 'char_weaponOrigin'}
                            className={`text-[9px] font-bold uppercase flex items-center px-2 py-0.5 rounded-full transition-all border ${isListening && genericDictationField === 'char_weaponOrigin' ? 'bg-red-500 text-white animate-pulse border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'text-jade border-jade/20 hover:bg-jade/5'}`}
                          >
                            {isListening && genericDictationField === 'char_weaponOrigin' ? <MicOff size={10} className="mr-1" /> : <Mic size={10} className="mr-1" />} 
                            Truyền âm
                          </button>
                       </div>
                       <textarea value={newChar.weaponOrigin || ''} onChange={e => setNewChar({...newChar, weaponOrigin: e.target.value})} placeholder="Lai lịch truyền thuyết của bảo khí..." className="w-full bg-white/50 backdrop-blur-sm border border-gold/30 rounded-xl px-4 py-3 text-ink placeholder:text-ink/40 focus:ring-2 focus:ring-cinnabar/30 focus:border-cinnabar/50 transition-all text-sm h-20" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Ảnh Vũ Khí (Bảo Khí)</label>
                       <div 
                        className="w-full h-24 bg-sand/10 border-2 border-dashed border-gold flex items-center justify-center relative overflow-hidden group/wup cursor-pointer hover:border-cinnabar transition-all rounded-lg"
                        onClick={() => document.getElementById('weapon-avatar-upload')?.click()}
                       >
                         {newChar.weaponAvatar ? (
                           <img src={newChar.weaponAvatar} alt="Weapon" className="w-full h-full object-contain" />
                         ) : (
                           <div className="flex flex-col items-center gap-1 opacity-40">
                             <Sword size={24} />
                             <span className="text-[9px] font-bold uppercase">Tải ảnh vũ khí</span>
                           </div>
                         )}
                       </div>
                       <input id="weapon-avatar-upload" type="file" accept="image/*" className="hidden" onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                           const reader = new FileReader();
                           reader.onloadend = async () => {
                             const compressed = await compressImage(reader.result as string, 800, 800, 0.7);
                             setNewChar({...newChar, weaponAvatar: compressed});
                           };
                           reader.readAsDataURL(file);
                         }
                       }} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1 relative">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Mối Quan Hệ</label>
                        <button 
                          type="button"
                          onClick={() => handleToggleGenericDictation('char_relationships', (val) => setNewChar({...newChar, relationships: val}), newChar.relationships || "", "Chuyển các mối quan hệ sau sang phong cách giang hồ (VD: Sư phụ: Tên, Hồng nhan tri kỷ: Tên...):\n\n\"{{transcript}}\"")}
                          disabled={isTranslatingSpeech && genericDictationField !== 'char_relationships'}
                          className={`text-[9px] font-bold uppercase flex items-center px-2 py-0.5 rounded-full transition-all border ${isListening && genericDictationField === 'char_relationships' ? 'bg-red-500 text-white animate-pulse border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'text-jade border-jade/20 hover:bg-jade/5'}`}
                        >
                          {isListening && genericDictationField === 'char_relationships' ? <MicOff size={10} className="mr-1" /> : <Mic size={10} className="mr-1" />} 
                          Truyền âm
                        </button>
                      </div>
                      <textarea value={newChar.relationships || ''} onChange={e => setNewChar({...newChar, relationships: e.target.value})} placeholder="Kẻ thù: Tên&#10;Bạn bè: Tên&#10;Người yêu: Tên&#10;Sư phụ: Tên&#10;Đồ đệ: Tên..." className="w-full bg-white/50 backdrop-blur-sm border border-gold/30 rounded-xl px-4 py-3 text-ink placeholder:text-ink/40 focus:ring-2 focus:ring-cinnabar/30 focus:border-cinnabar/50 transition-all text-sm h-32" />
                    </div>
                    
                    <div className="space-y-3 bg-sand/10 p-3 rounded-xl border border-gold/20">
                      <h5 className="text-[10px] font-black uppercase text-cinnabar tracking-widest">Võ Công Tâm Đắc</h5>
                      <div className="space-y-2">
                        <div className="space-y-0.5 relative">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-wood opacity-60">Sơ Cấp</label>
                            <button 
                              type="button"
                              onClick={() => handleToggleGenericDictation('char_martialBeginner', (val) => setNewChar({...newChar, martialArtsBeginner: val}), newChar.martialArtsBeginner || "", "Chuyển tên/mô tả những võ công sau sang tên chiêu thức kiếm hiệp thật kêu (xuống dòng từng chiêu):\n\n\"{{transcript}}\"")}
                              disabled={isTranslatingSpeech && genericDictationField !== 'char_martialBeginner'}
                              className={`text-[9px] font-bold uppercase flex items-center px-2 py-0.5 rounded-full transition-all border ${isListening && genericDictationField === 'char_martialBeginner' ? 'bg-red-500 text-white animate-pulse border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'text-jade border-jade/20 hover:bg-jade/5'}`}
                            >
                              {isListening && genericDictationField === 'char_martialBeginner' ? <MicOff size={10} className="mr-1" /> : <Mic size={10} className="mr-1" />} 
                              Truyền âm
                            </button>
                          </div>
                          <textarea value={newChar.martialArtsBeginner || ''} onChange={e => setNewChar({...newChar, martialArtsBeginner: e.target.value})} placeholder="Kỹ năng 1&#10;Kỹ năng 2..." className="w-full bg-white border border-gold/30 rounded px-3 py-1.5 focus:ring-1 focus:ring-cinnabar text-xs h-14" />
                        </div>
                        <div className="space-y-0.5 relative">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-wood opacity-60">Trung Cấp</label>
                            <button 
                              type="button"
                              onClick={() => handleToggleGenericDictation('char_martialIntermediate', (val) => setNewChar({...newChar, martialArtsIntermediate: val}), newChar.martialArtsIntermediate || "", "Chuyển tên/mô tả những võ công sau sang tên chiêu thức kiếm hiệp cao siêu hơn (xuống dòng từng chiêu):\n\n\"{{transcript}}\"")}
                              disabled={isTranslatingSpeech && genericDictationField !== 'char_martialIntermediate'}
                              className={`text-[9px] font-bold uppercase flex items-center px-2 py-0.5 rounded-full transition-all border ${isListening && genericDictationField === 'char_martialIntermediate' ? 'bg-red-500 text-white animate-pulse border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'text-jade border-jade/20 hover:bg-jade/5'}`}
                            >
                              {isListening && genericDictationField === 'char_martialIntermediate' ? <MicOff size={10} className="mr-1" /> : <Mic size={10} className="mr-1" />} 
                              Truyền âm
                            </button>
                          </div>
                          <textarea value={newChar.martialArtsIntermediate || ''} onChange={e => setNewChar({...newChar, martialArtsIntermediate: e.target.value})} placeholder="Kỹ năng 1&#10;Kỹ năng 2..." className="w-full bg-white border border-gold/30 rounded px-3 py-1.5 focus:ring-1 focus:ring-cinnabar text-xs h-14" />
                        </div>
                        <div className="space-y-0.5 relative">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-wood opacity-60">Cao Cấp</label>
                            <button 
                              type="button"
                              onClick={() => handleToggleGenericDictation('char_martialAdvanced', (val) => setNewChar({...newChar, martialArtsAdvanced: val}), newChar.martialArtsAdvanced || "", "Chuyển tên/mô tả võ công sau sang tên tuyệt học, bí kíp võ công tối thượng của kiếm hiệp:\n\n\"{{transcript}}\"")}
                              disabled={isTranslatingSpeech && genericDictationField !== 'char_martialAdvanced'}
                              className={`text-[9px] font-bold uppercase flex items-center px-2 py-0.5 rounded-full transition-all border ${isListening && genericDictationField === 'char_martialAdvanced' ? 'bg-red-500 text-white animate-pulse border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'text-jade border-jade/20 hover:bg-jade/5'}`}
                            >
                              {isListening && genericDictationField === 'char_martialAdvanced' ? <MicOff size={10} className="mr-1" /> : <Mic size={10} className="mr-1" />} 
                              Truyền âm
                            </button>
                          </div>
                          <textarea value={newChar.martialArtsAdvanced || ''} onChange={e => setNewChar({...newChar, martialArtsAdvanced: e.target.value})} placeholder="Kỹ năng 1&#10;Kỹ năng 2..." className="w-full bg-white border border-gold/30 rounded px-3 py-1.5 focus:ring-1 focus:ring-cinnabar text-xs h-14" />
                        </div>
                        <div className="space-y-0.5 relative">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-wood opacity-60 font-display">Cơ Duyên</label>
                            <div className="flex items-center gap-2">
                              <select 
                                className="text-[9px] bg-white border border-gold/30 rounded px-1 outline-none font-serif italic text-cinnabar"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    const selectedArt = artifacts.find(a => a.id === e.target.value);
                                    if (selectedArt) {
                                      const detail = `[${selectedArt.name}] - Tác dụng: ${selectedArt.effect}`;
                                      setNewChar(prev => ({
                                        ...prev,
                                        martialArtsSpecial: (prev.martialArtsSpecial ? prev.martialArtsSpecial + '\n' : '') + detail
                                      }));
                                    }
                                    e.target.value = "";
                                  }
                                }}
                              >
                                <option value="">+ Chọn Bí Bảo</option>
                                {artifacts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                              </select>
                              <button 
                                type="button"
                                onClick={() => handleToggleGenericDictation('char_martialSpecial', (val) => setNewChar({...newChar, martialArtsSpecial: val}), newChar.martialArtsSpecial || "", "Chuyển mô tả cơ duyên sau sang văn phong kiếm hiệp (phong cách kỳ ngộ, rớt xuống vực nhặt bí kíp...):\n\n\"{{transcript}}\"")}
                                disabled={isTranslatingSpeech && genericDictationField !== 'char_martialSpecial'}
                                className={`text-[9px] font-bold uppercase flex items-center px-2 py-0.5 rounded-full transition-all border ${isListening && genericDictationField === 'char_martialSpecial' ? 'bg-red-500 text-white animate-pulse border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'text-jade border-jade/20 hover:bg-jade/5'}`}
                              >
                                {isListening && genericDictationField === 'char_martialSpecial' ? <MicOff size={10} className="mr-1" /> : <Mic size={10} className="mr-1" />} 
                                Truyền âm
                              </button>
                            </div>
                          </div>
                          <textarea value={newChar.martialArtsSpecial || ''} onChange={e => setNewChar({...newChar, martialArtsSpecial: e.target.value})} placeholder="Võ công kỳ ngộ..." className="w-full bg-white border border-gold/30 rounded px-3 py-1.5 focus:ring-1 focus:ring-cinnabar text-xs h-14" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 relative">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Trọng trách và ước mơ</label>
                        <button 
                          type="button"
                          onClick={() => handleToggleCharacterDictation('description')}
                          disabled={isTranslatingSpeech && characterDictationField !== 'description'}
                          className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors ${isListening && characterDictationField === 'description' ? 'text-red-500 animate-pulse' : 'text-jade hover:text-jade/80'}`}
                        >
                          {isListening && characterDictationField === 'description' ? <MicOff size={10} /> : <Mic size={10} />} 
                          {isTranslatingSpeech && characterDictationField === 'description' ? 'Đang dịch...' : (isListening && characterDictationField === 'description' ? 'Đang nghe...' : 'Truyền Âm')}
                        </button>
                      </div>
                      <textarea required value={newChar.description || ''} onChange={e => setNewChar({...newChar, description: e.target.value})} className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-cinnabar h-20 text-sm" />
                    </div>
                    <div className="space-y-1 relative">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Tính cách đặc biệt</label>
                        <button 
                          type="button"
                          onClick={() => handleToggleCharacterDictation('personality')}
                          disabled={isTranslatingSpeech && characterDictationField !== 'personality'}
                          className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors ${isListening && characterDictationField === 'personality' ? 'text-red-500 animate-pulse' : 'text-jade hover:text-jade/80'}`}
                        >
                          {isListening && characterDictationField === 'personality' ? <MicOff size={10} /> : <Mic size={10} />} 
                          {isTranslatingSpeech && characterDictationField === 'personality' ? 'Đang dịch...' : (isListening && characterDictationField === 'personality' ? 'Đang nghe...' : 'Truyền Âm')}
                        </button>
                      </div>
                      <textarea value={newChar.personality || ''} onChange={e => setNewChar({...newChar, personality: e.target.value})} placeholder="Miêu tả tính cách, khí độ..." className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-cinnabar h-20 text-sm" />
                    </div>
                    <div className="space-y-1 relative">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Xuất thân</label>
                        <button 
                          type="button"
                          onClick={() => handleToggleCharacterDictation('past')}
                          disabled={isTranslatingSpeech && characterDictationField !== 'past'}
                          className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors ${isListening && characterDictationField === 'past' ? 'text-red-500 animate-pulse' : 'text-jade hover:text-jade/80'}`}
                        >
                          {isListening && characterDictationField === 'past' ? <MicOff size={10} /> : <Mic size={10} />} 
                          {isTranslatingSpeech && characterDictationField === 'past' ? 'Đang dịch...' : (isListening && characterDictationField === 'past' ? 'Đang nghe...' : 'Truyền Âm')}
                        </button>
                      </div>
                      <textarea value={newChar.past || ''} onChange={e => setNewChar({...newChar, past: e.target.value})} placeholder="Kể về cuộc đời, biến cố quan trọng..." className="w-full bg-white/50 backdrop-blur-sm border border-gold/30 rounded-xl px-4 py-3 text-ink placeholder:text-ink/40 focus:ring-2 focus:ring-cinnabar/30 focus:border-cinnabar/50 transition-all text-sm h-32" />
                    </div>
                  </div>
                  {canEdit && (
                    <div className="md:col-span-2 flex flex-col md:flex-row gap-4 mt-4">
                      {editingCharIdx !== null && (
                        <button 
                          type="button" 
                          onClick={() => {
                            const charToDelete = characters[editingCharIdx];
                            handleDeleteCharacter(charToDelete.id || toSlug(charToDelete.name), charToDelete.name);
                            setShowAddChar(false);
                          }}
                          className="w-full py-4 bg-white border border-cinnabar/30 text-cinnabar font-bold rounded-full hover:bg-cinnabar/10 transition-all uppercase tracking-widest text-xs"
                        >
                           Xóa Cao Thủ
                        </button>
                      )}
                      <button type="submit" className="w-full py-4 bg-cinnabar text-white font-bold rounded-full shadow-lg hover:bg-ink transition-all">Ghi Vào Sử Sách</button>
                    </div>
                  )}
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Character Detail Modal (Book Layout) */}
        <AnimatePresence>
          {selectedCharacter && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-stone-200 w-full max-w-5xl my-auto rounded-2xl sm:rounded-3xl shadow-2xl relative border-2 sm:border-4 border-gold/40 scroll-y-custom">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] sm:w-[2px] h-full bg-gold/10 z-0 hidden md:block"></div>
                
                <button 
                  onClick={() => {
                    setSelectedCharacter(null);
                    setIsEditingDetail(false);
                    setViewingWeapon(false);
                  }} 
                  className="fixed top-4 right-4 sm:absolute sm:top-6 sm:right-6 p-2 hover:bg-cinnabar/10 text-cinnabar transition-colors rounded-full z-50 bg-white/60 shadow-md sm:bg-white/20"
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>

                {/* Remove Edit Button entirely per user request */}
                
                <div className="flex flex-col md:flex-row min-h-full relative z-10">
                  {/* Left Page content */}
                  <div className="w-full md:w-1/2 p-4 sm:p-6 lg:p-12 flex flex-col md:border-r border-gold/10">
                     <div className="flex flex-col items-center mb-8 sm:mb-10">
                        <div className="w-36 h-36 sm:w-48 sm:h-48 bg-white rounded-xl flex items-center justify-center shadow-xl border-2 sm:border-4 border-gold/30 mb-4 sm:mb-6 relative overflow-hidden transform -rotate-1">
                          {selectedCharacter.avatar ? (
                            <img src={selectedCharacter.avatar} alt={selectedCharacter.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Users size={48} className="text-sacred-orange/40 sm:w-16 sm:h-16" />
                          )}
                          {isEditingDetail && (
                             <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer">
                                <span className="text-white text-[8px] font-bold">SỬA</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleDetailAvatarChange} />
                             </label>
                          )}
                        </div>
                        {isEditingDetail ? (
                           <div className="space-y-2 w-full max-w-xs">
                             <input 
                               value={selectedCharacter.name} 
                               onChange={e => {
                                if (!selectedCharacter) return;
                                const name = capitalizeName(e.target.value);
                                const abbrev = getAbbreviation(name);
                                setSelectedCharacter({...selectedCharacter, name, abbreviation: selectedCharacter.abbreviation || abbrev});
                              }} 
                               className="w-full bg-white/50 border-b-2 border-cinnabar/30 text-xl sm:text-2xl font-display text-center focus:outline-none focus:border-cinnabar"
                             />
                             <div className="flex flex-col items-center mb-2">
                               <label className="text-[9px] font-bold uppercase text-wood opacity-50">Viết Tắt</label>
                               <input 
                                 value={selectedCharacter.abbreviation || ''} 
                                 onChange={e => setSelectedCharacter({...selectedCharacter, abbreviation: e.target.value})}
                                 placeholder="VD: TV"
                                 className="w-16 bg-white/20 border-b border-gold/30 text-[10px] text-ink text-center focus:outline-none"
                               />
                             </div>
                             <div className="flex items-center gap-2">
                               <input 
                                 value={selectedCharacter.role} 
                                 onChange={e => setSelectedCharacter({...selectedCharacter, role: e.target.value})}
                                 placeholder="Vị thế..."
                                 className="flex-1 bg-white/30 border-b border-gold/30 text-[10px] sm:text-xs text-ink text-center focus:outline-none"
                               />
                               <select 
                                 value={selectedCharacter.faction} 
                                 onChange={e => setSelectedCharacter({...selectedCharacter, faction: e.target.value as any})}
                                 className="flex-1 bg-white/30 border-b border-gold/30 text-[10px] sm:text-xs font-bold text-center focus:outline-none"
                               >
                                 <option value="Chính phái">Chính phái</option>
                                 <option value="Tà phái">Tà phái</option>
                                 <option value="Trung lập">Trung lập</option>
                                 <option value="NPC">NPC</option>
                               </select>
                             </div>
                           </div>
                        ) : (
                          <>
                            <h3 className="text-3xl sm:text-5xl font-display font-bold text-ink italic leading-tight text-center drop-shadow-sm">{selectedCharacter.name}</h3>
                            <div className="mt-2 sm:mt-4 flex items-center gap-2 sm:gap-3">
                               <span className="text-cinnabar font-bold uppercase tracking-widest text-[10px] sm:text-xs">{selectedCharacter.role}</span>
                               <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-gold/50"></div>
                               <span className={`font-bold uppercase tracking-widest text-[10px] sm:text-xs ${
                                 selectedCharacter.faction === 'Chính phái' ? 'text-jade' : 
                                 selectedCharacter.faction === 'Tà phái' ? 'text-cinnabar' : 
                                 selectedCharacter.faction === 'Trung lập' ? 'text-blue-600' : 'text-stone-500'
                               }`}>{selectedCharacter.faction}</span>
                            </div>
                          </>
                        )}
                     </div>

                     <div className="space-y-6 sm:space-y-10">
                        {/* Weapon Section */}
                        <div className="bg-white/80 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gold/20 shadow-sm relative overflow-hidden">
                          <div className="absolute top-[-5px] right-[-5px] sm:top-[-10px] sm:right-[-10px] opacity-10">
                             <Sword size={40} className="sm:w-20 sm:h-20" />
                          </div>
                          <p className="text-[8px] sm:text-[10px] uppercase font-black text-black mb-2 sm:mb-3 tracking-[0.2em] sm:tracking-[0.3em]">Bảo Khí / Vũ Khí</p>
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3 sm:gap-4">
                                {selectedCharacter.weaponAvatar && (
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border border-gold/30 bg-white p-1 overflow-hidden">
                                     <img src={selectedCharacter.weaponAvatar} alt="Weapon" className="w-full h-full object-contain" />
                                  </div>
                                )}
                                <p className="text-sm sm:text-lg font-serif italic text-black font-bold">{selectedCharacter.weapon || "Chưa rõ lai lịch"}</p>
                             </div>
                             {selectedCharacter.weapon && (
                               <button 
                                 onClick={() => setViewingWeapon(true)}
                                 className="text-[9px] sm:text-[10px] font-bold text-cinnabar border-b border-cinnabar/30 hover:border-cinnabar transition-all pb-0.5"
                               >
                                 Xem thêm
                               </button>
                             )}
                          </div>
                        </div>

                        {/* Martial Arts Section */}
                        <div className="space-y-4 sm:space-y-6 px-1 sm:px-2">
                           <div className="text-[8px] sm:text-[10px] uppercase font-black text-sacred-orange tracking-[0.2em] sm:tracking-[0.3em] flex items-center gap-3 sm:gap-4">
                              Võ Công Kỹ Năng <div className="flex-1 h-[1px] bg-gold/20"></div>
                           </div>
                           
                           <div className="grid grid-cols-1 gap-4 sm:gap-6">
                              {[
                                { title: 'Sơ Cấp', value: selectedCharacter.martialArtsBeginner },
                                { title: 'Trung Cấp', value: selectedCharacter.martialArtsIntermediate },
                                { title: 'Cao Cấp', value: selectedCharacter.martialArtsAdvanced },
                                { title: 'Cơ Duyên', value: selectedCharacter.martialArtsSpecial }
                              ].map((tier, idx) => tier.value ? (
                                <div key={idx} className="space-y-1 sm:space-y-2 group">
                                   <div className="flex items-center gap-2">
                                      <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-cinnabar"></div>
                                      <h5 className="text-[10px] sm:text-xs font-bold text-ink uppercase tracking-wider">{tier.title}</h5>
                                   </div>
                                   <div className="pl-3 sm:pl-3.5 border-l-2 border-gold/10 group-hover:border-cinnabar/40 transition-colors py-1">
                                      {tier.value?.split('\n').filter(s => s.trim()).map((skill, sIdx) => (
                                        <p key={sIdx} className="text-xs sm:text-sm font-serif italic text-wood leading-relaxed text-left">
                                           {skill}
                                        </p>
                                      ))}
                                   </div>
                                </div>
                              ) : null)}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Right Page content */}
                  <div className="flex-1 p-4 sm:p-6 lg:p-12 space-y-8 sm:space-y-12 bg-white/5 sm:bg-white/10">
                    
                    
                    
                    <section>
                      <h4 className="flex items-center gap-3 sm:gap-4 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-sacred-orange mb-4 sm:mb-6">
                        Quá Khứ Và Lai Lịch <div className="flex-1 h-[1px] bg-gold/20"></div>
                      </h4>
                      <p className="bg-white/80 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gold/20 shadow-sm relative overflow-hidden text-base sm:text-xl font-serif italic text-ink/90 leading-relaxed text-justify-viet indent-6 sm:indent-8 first-letter:text-4xl sm:first-letter:text-6xl first-letter:font-display first-letter:text-cinnabar first-letter:mr-2 sm:first-letter:mr-3 first-letter:float-left first-letter:mt-1 sm:first-letter:mt-2">
                        {selectedCharacter.past || "Lai lịch chưa rõ, giang hồ đồn đại vô vàn..."}
                      </p>
                    </section>
                    
                    <div className="grid grid-cols-1 gap-8 sm:gap-12">
                      <section className="pt-6 sm:pt-10 border-t border-gold/10">
                        <h4 className="flex items-center gap-3 sm:gap-4 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-sacred-orange mb-4 sm:mb-6">
                          Trọng Trách Và Ước Mơ <div className="flex-1 h-[1px] bg-gold/20"></div>
                        </h4>
                        <p className="bg-white/80 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gold/20 shadow-sm relative overflow-hidden text-xs sm:text-sm font-serif text-ink/80 leading-loose italic">
                          {selectedCharacter.description || "Chí hướng cao xa, người thường khó dò..."}
                        </p>
                      </section>

                      <section className="pt-6 sm:pt-10 border-t border-gold/10">
                        <h4 className="flex items-center gap-3 sm:gap-4 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-sacred-orange mb-4 sm:mb-6">
                          Tính Cách Đặc Biệt <div className="flex-1 h-[1px] bg-gold/20"></div>
                        </h4>
                        <p className="bg-white/80 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gold/20 shadow-sm relative overflow-hidden text-xs sm:text-sm font-serif text-ink/80 leading-loose italic">
                          {selectedCharacter.personality || "Khí độ bất phàm, tâm tính khó lường..."}
                        </p>
                      </section>

                      <section className="pt-6 sm:pt-10 border-t border-gold/10">
                        <h4 className="flex items-center gap-3 sm:gap-4 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-sacred-orange mb-4 sm:mb-6">
                          Mối Quan Hệ Giang Hồ <div className="flex-1 h-[1px] bg-gold/20"></div>
                        </h4>
                        <div className="grid grid-cols-1 gap-3 sm:gap-4 bg-white/80 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gold/20 shadow-sm relative overflow-hidden">
                          {(selectedCharacter.relationships || "Độc hành thiên hạ, chưa rõ bằng hữu...").split('\n').filter(s => s.trim()).map((line, i) => {
                            let foundChar: Character | null = null;
                            characters.forEach(c => {
                              if (c.name !== selectedCharacter.name && line.includes(c.name)) {
                                foundChar = c;
                              }
                            });

                            return (
                              <div 
                                key={i} 
                                onClick={() => {
                                  if (foundChar) {
                                    setViewingRelationChar(foundChar);
                                  }
                                }}
                                className={`flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl transition-all group/rel ${foundChar ? 'cursor-pointer bg-white/40 hover:bg-white/60 border border-gold/10 hover:border-sacred-orange/30 shadow-sm' : 'bg-sand/5 border border-transparent'}`}
                              >
                                {foundChar && (
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full border border-gold/30 overflow-hidden bg-sand/10 shadow-sm transform transition-transform group-hover/rel:scale-110">
                                    {foundChar.avatar ? (
                                      <img src={foundChar.avatar} alt={foundChar.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gold/30">
                                        <Users size={14} sm:size={18} />
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  {(() => {
                                    const parts = line.split(':');
                                    const title = parts.length > 1 ? parts[0].trim() : '';
                                    const content = parts.length > 1 ? parts.slice(1).join(':').trim() : line.trim();

                                    return (
                                      <div className="flex flex-col">
                                        {title && (
                                          <span className="text-[8px] sm:text-[10px] font-normal uppercase tracking-widest text-black mb-0.5 sm:mb-1">
                                            {title}
                                          </span>
                                        )}
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="text-xs sm:text-base font-serif text-wood italic leading-snug">
                                            <FormattedText text={content} characters={characters} artifacts={artifacts} factions={factions} />
                                          </div>
                                          {foundChar && <ChevronRight size={12} sm:size={14} className="text-gold" />}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>

                      {selectedCharacter.stateTimeline && selectedCharacter.stateTimeline.length > 0 && (
                        <section className="pt-6 sm:pt-10 border-t border-gold/10">
                          <h4 className="flex items-center gap-3 sm:gap-4 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-sacred-orange mb-4 sm:mb-6">
                            Quá Trình Phát Triển (Tập Phim) <div className="flex-1 h-[1px] bg-gold/20"></div>
                          </h4>
                          <div className="relative border-l-2 border-gold/30 pl-4 sm:pl-6 ml-2 sm:ml-4 space-y-6">
                            {[...selectedCharacter.stateTimeline].sort((a, b) => a.episodeId - b.episodeId).map((t, i) => {
                              const ep = episodes.find((e: any) => e.id === t.episodeId);
                              if (!ep || !t.change) return null;
                              return (
                                <div key={i} className="relative">
                                  <div className="absolute -left-[23px] sm:-left-[31px] top-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gold/50 border-2 border-stone-200 shadow-sm" />
                                  <div className="text-[10px] sm:text-xs font-bold text-cinnabar uppercase tracking-widest mb-1">
                                    {ep.arc} - {ep.title}
                                  </div>
                                  <p className="text-xs sm:text-sm font-serif italic text-ink/80 leading-relaxed bg-white/50 p-3 sm:p-4 rounded-xl border border-gold/10 shadow-sm">
                                    {t.change}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      )}
                    </div>
                  </div>
                </div>

                {/* Character Relation Popup */}
                {createPortal(
                  <AnimatePresence>
                    {viewingRelationChar && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 backdrop-blur-md p-4"
                      >
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="bg-parchment w-full max-w-lg p-0 rounded-2xl border-4 border-gold shadow-[0_0_100px_rgba(212,163,115,0.4)] relative overflow-hidden"
                        >
                        <button 
                          onClick={() => setViewingRelationChar(null)} 
                          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-cinnabar text-white flex items-center justify-center shadow-lg hover:bg-ink transition-colors"
                        >
                          <X size={24} />
                        </button>

                        <div className="p-8 bg-parchment/90 rounded-2xl">
                          <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-40 h-40 rounded-full border-4 border-gold p-1 shadow-2xl bg-white">
                              <div className="w-full h-full rounded-full overflow-hidden border-2 border-gold/20">
                                {viewingRelationChar.avatar ? (
                                  <img src={viewingRelationChar.avatar} alt={viewingRelationChar.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-sand/20 text-gold">
                                    <Users size={64} />
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <h3 className="text-3xl font-display font-bold text-cinnabar italic leading-none">{viewingRelationChar.name}</h3>
                              <div className="flex items-center justify-center gap-2">
                                <span className={`text-[10px] text-white px-3 py-1 rounded-full font-bold uppercase tracking-widest ${
                                  viewingRelationChar.faction === 'Chính phái' ? 'bg-jade' : 
                                  viewingRelationChar.faction === 'Tà phái' ? 'bg-cinnabar' : 
                                  viewingRelationChar.faction === 'Trung lập' ? 'bg-blue-600' : 'bg-stone-500'
                                }`}>{viewingRelationChar.faction}</span>
                                <span className="text-[10px] bg-sacred-orange text-white px-3 py-1 rounded-full font-bold uppercase tracking-widest">{viewingRelationChar.role}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 space-y-6">
                            <div>
                              <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sacred-orange mb-3">
                                <ScrollText size={14} /> Tiểu Sử Ngắn gọn <div className="flex-1 h-[1px] bg-gold/20"></div>
                              </h4>
                              <p className="text-sm font-serif text-ink/80 leading-relaxed italic text-center px-4">
                                {viewingRelationChar.description || "Một danh sĩ thần bí trên giang hồ..."}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                          <div className="bg-sand/30 p-4 rounded-xl border border-gold/20">
                                <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest text-wood opacity-80 mb-2">
                                  <Sword size={10} /> Vũ Khí
                                </div>
                                <p className="text-sm font-bold text-black">{viewingRelationChar.weapon || "Tay không"}</p>
                              </div>
                              <div className="bg-sand/30 p-4 rounded-xl border border-gold/20">
                                <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest text-wood opacity-80 mb-2">
                                  <Flame size={10} /> Tuyệt Kỹ
                                </div>
                                <p className="text-sm font-bold text-black line-clamp-1">{viewingRelationChar.martialArtsAdvanced || viewingRelationChar.martialArtsSpecial || "Đang ẩn giấu..."}</p>
                              </div>
                            </div>

                        <button 
                              onClick={() => {
                                setSelectedCharacter(viewingRelationChar);
                                setViewingRelationChar(null);
                              }}
                              className="w-full mt-4 py-4 bg-cinnabar text-white rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
                            >
                              <BookOpen size={18} /> Xem Hồ Sơ Chi Tiết
                            </button>
                          </div>
                        </div>
                        
                        {/* Decorative borders */}
                        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-gold/40 rounded-tl-2xl pointer-events-none"></div>
                        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-gold/40 rounded-br-2xl pointer-events-none"></div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>,
                document.body
              )}

                {/* Weapon Origin Sub-Modal (Popup) */}
                {createPortal(
                  <AnimatePresence>
                     {viewingWeapon && (
                       <motion.div 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 backdrop-blur-sm p-8"
                       >
                        <motion.div 
                          initial={{ scale: 0.9, rotateY: 90 }}
                          animate={{ scale: 1, rotateY: 0 }}
                          className="bg-parchment w-full max-w-2xl p-10 rounded-2xl border-2 border-gold shadow-[0_0_50px_rgba(212,163,115,0.3)] relative"
                        >
                           <button 
                             onClick={() => setViewingWeapon(false)}
                             className="absolute top-4 right-4 text-wood hover:text-cinnabar transition-colors"
                           >
                             <X size={20} />
                           </button>
                           
                           <div className="flex flex-col md:flex-row gap-10">
                              <div className="w-full md:w-32 flex flex-col items-center gap-4">
                                 <div className="w-32 h-32 bg-white rounded-xl border border-gold/40 p-2 flex items-center justify-center shadow-lg transform -rotate-3">
                                    {selectedCharacter.weaponAvatar ? (
                                      <img src={selectedCharacter.weaponAvatar} alt="Weapon" className="w-full h-full object-contain" />
                                    ) : (
                                      <Sword size={64} className="text-gold/30" />
                                    )}
                                 </div>
                                 <span className="text-center text-[10px] font-bold text-cinnabar uppercase tracking-widest leading-relaxed">
                                   Tuyệt Thế <br/> Bảo Khí
                                 </span>
                              </div>
                              <div className="flex-1">
                                 <h5 className="text-2xl font-display font-bold text-ink mb-1 italic">{selectedCharacter.weapon}</h5>
                                 <p className="text-[10px] font-bold text-sacred-orange uppercase tracking-[0.4em] mb-6 border-b border-gold/20 pb-2">Lai Lịch Truyền Thuyết</p>
                                 <div className="text-sm font-serif italic text-wood leading-loose text-justify-viet whitespace-pre-wrap">
                                    {selectedCharacter.weaponOrigin || "Lai lịch cuả bảo khí này chìm trong sương mù của lịch sử giang hồ. Chỉ biết rằng mỗi lần nó xuất hiện, ranh giới giữa chính và tà đều bị lay chuyển..."}
                                 </div>
                              </div>
                           </div>
                        </motion.div>
                     </motion.div>
                   )}
                </AnimatePresence>,
                document.body
              )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Location Modal */}
        <AnimatePresence>
          {viewingLocation && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 backdrop-blur-md p-2 sm:p-4">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-parchment w-full max-w-3xl max-h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl relative flex flex-col border-2 border-gold/40 overflow-hidden text-ink font-sans">
                <button 
                  onClick={() => setViewingLocation(null)} 
                  className="absolute top-4 right-4 p-2 hover:bg-cinnabar/10 text-cinnabar transition-colors rounded-full z-[70] bg-white/40 border border-cinnabar/10 shadow-sm"
                >
                  <X size={24} />
                </button>
                
                <div className="flex-1 overflow-y-auto scroll-y-custom relative z-10 flex flex-col items-center">
                   {/* Header / Avatar */}
                   <div className="w-full h-48 sm:h-64 relative">
                        <img 
                          src={viewingLocation.avatar || (viewingLocation.type === 'city' ? `https://image.pollinations.ai/prompt/ancient%20chinese%20city%20${viewingLocation.name}%20wuxia%20icon?nologo=true&width=1024&height=512` : `https://image.pollinations.ai/prompt/ancient%20chinese%20village%20${viewingLocation.name}%20wuxia%20icon?nologo=true&width=1024&height=512`)} 
                          alt={viewingLocation.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-parchment via-transparent to-transparent"></div>
                        <div className="absolute bottom-4 left-6 flex items-center gap-3">
                            <h2 className="text-3xl sm:text-5xl font-display font-medium text-amber-900 brush-stroke pb-2" style={{ textShadow: '2px 2px 4px rgba(255,255,255,0.8)' }}>
                                {viewingLocation.name}
                            </h2>
                            <span className="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md uppercase tracking-wide">
                                {viewingLocation.type === 'city' ? 'Thành Thị' : 'Thôn Trấn'}
                            </span>
                        </div>
                   </div>

                   {/* Content */}
                   <div className="p-6 sm:p-10 w-full">
                       <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center gap-2 border-b border-amber-200/50 pb-2">
                           <BookOpen size={20} className="text-amber-600" />
                           Giai Thoại
                       </h3>
                       <p className="text-lg text-wood/90 leading-relaxed italic whitespace-pre-wrap">
                           {viewingLocation.description || "Nơi đây chưa có nhiều sử liệu ghi chép..."}
                       </p>
                   </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Faction Modal */}
        <AnimatePresence>
          {viewingFaction && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 backdrop-blur-md p-2 sm:p-4">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-parchment w-full max-w-5xl h-[95vh] sm:h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl relative flex flex-col border-2 sm:border-4 border-gold/40 overflow-hidden text-ink font-sans">
                <button 
                  onClick={() => setViewingFaction(null)} 
                  className="absolute top-4 right-4 p-2 hover:bg-cinnabar/10 text-cinnabar transition-colors rounded-full z-[70] bg-white/40 border border-cinnabar/10 shadow-sm"
                >
                  <X size={24} />
                </button>
                
                <div className="flex-1 overflow-y-auto scroll-y-custom relative z-10 flex flex-col md:flex-row h-full">
                  {/* Left Column: Essential Info */}
                  <div className="w-full md:w-[40%] bg-white/50 p-4 sm:p-6 lg:p-10 border-b md:border-b-0 md:border-r border-gold/20 flex flex-col">
                    <header className="flex flex-row items-start gap-4 sm:gap-6 mb-6 md:mb-10">
                      <div className="w-20 h-20 sm:w-32 sm:h-32 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl border-2 sm:border-4 border-gold/30 shrink-0 relative overflow-hidden transform -rotate-1">
                        {viewingFaction.flagAvatar ? (
                          <img src={viewingFaction.flagAvatar} alt={viewingFaction.name} className="w-full h-full object-cover" />
                        ) : (
                          <Shield size={32} className="text-cinnabar/40 sm:w-16 sm:h-16" />
                        )}
                        <div className="absolute inset-x-0 bottom-0 py-0.5 sm:py-1 bg-ink/60 backdrop-blur-sm text-center">
                          <span className="text-[6px] sm:text-[10px] font-bold uppercase tracking-widest text-gold">{viewingFaction.alignment}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2 md:mb-4">
                          <h3 className="text-xl sm:text-3xl font-display font-bold text-ink italic leading-tight">{viewingFaction.name}</h3>
                        </div>
                        
                        {viewingFaction.leader && (
                          <div className="space-y-1 sm:space-y-2">
                            <p className="text-[6px] sm:text-[8px] uppercase font-black text-sacred-orange tracking-[0.2em] opacity-70">Thống Lĩnh</p>
                            <div 
                              onClick={() => {
                                const leader = characters.find(c => c.name === viewingFaction.leader);
                                if (leader) setSelectedCharacter(leader);
                              }}
                              className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/80 p-0.5 pr-2 sm:pr-3 rounded-full border border-gold/20 cursor-pointer hover:bg-sand/30 hover:shadow-md transition-all shadow-sm"
                            >
                              {(() => {
                                const leader = characters.find(c => c.name === viewingFaction.leader);
                                return leader ? (
                                  <>
                                    <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-gold bg-white shrink-0">
                                      {leader.avatar ? (
                                        <img src={leader.avatar} alt={leader.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <Users size={10} className="text-gold m-auto mt-0.5 sm:mt-1.5" />
                                      )}
                                    </div>
                                    <div className="text-left leading-none">
                                      <div className="text-[10px] sm:text-xs font-bold text-ink italic">{leader.name}</div>
                                      <div className="text-[6px] sm:text-[8px] uppercase font-bold text-cinnabar/60 mt-0.5">{leader.role || "Chưởng Môn"}</div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="px-2 py-0.5 text-[10px] text-wood italic font-bold">{viewingFaction.leader}</div>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </header>
                    
                    <div className="space-y-3 sm:space-y-6">
                      <div className="text-[8px] sm:text-[10px] uppercase font-black text-wood/40 tracking-[0.3em] flex items-center gap-2">
                        Tông Chỉ & Lịch Sử <div className="flex-1 h-[1px] bg-gold/10"></div>
                      </div>
                      <div className="bg-sand/10 p-3 sm:p-5 rounded-xl border border-gold/10 shadow-inner max-h-[150px] md:max-h-none overflow-y-auto">
                        <div className="text-xs sm:text-base font-serif italic text-ink/80 leading-relaxed text-justify-viet whitespace-pre-wrap">
                          <FormattedText text={viewingFaction.description || "Tông chỉ chưa rõ, lịch sử chìm trong màn sương giang hồ..."} characters={characters} artifacts={artifacts} factions={factions} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Organization Diagrams */}
                  <div className="flex-1 p-4 sm:p-8 lg:p-10 flex flex-col h-full bg-sand/5">
                    <div className="flex items-center justify-between mb-6 mt-8 sm:mt-4 md:mt-4 pr-16 md:pr-16 lg:pr-12">
                      <h4 className="flex items-center gap-2 sm:gap-4 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-cinnabar">
                        <Users size={16} className="text-cinnabar" /> <span className="hidden sm:inline">Sơ Đồ </span> Quyền Lực
                      </h4>
                      {canEdit && (
                        <button 
                           onClick={() => setIsEditingFactionDiagram(!isEditingFactionDiagram)}
                           className={`text-[7px] sm:text-[9px] font-bold uppercase py-1.5 px-4 rounded-full shadow transition-all flex items-center gap-1 shrink-0 ${isEditingFactionDiagram ? 'bg-cinnabar text-white hover:bg-cinnabar/80' : 'bg-jade text-white hover:bg-jade/80'}`}
                        >
                           {isEditingFactionDiagram ? (
                             <><Save size={12}/> Lưu</>
                           ) : (
                             <><Plus size={12} /> Bố Trí</>
                           )}
                        </button>
                      )}
                    </div>
                    
                    <div className="relative flex-1 diagram-container min-h-[500px] sm:min-h-[600px] w-full" id="faction-diagram-container" ref={diagramContainerRef}>
                      {/* Background container with rounded corners and overflow hidden */}
                      <div className="absolute inset-0 bg-white/60 border border-gold/20 rounded-2xl overflow-hidden shadow-inner pointer-events-none">
                        <div className="absolute inset-0 pointer-events-none z-0" style={{ 
                          backgroundImage: 'linear-gradient(to right, rgba(212, 163, 115, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(212, 163, 115, 0.05) 1px, transparent 1px)',
                          backgroundSize: '11.111% 12.5%'
                        }}>
                        </div>
                        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #D4A373 0.5px, transparent 0.5px)', backgroundSize: '11.111% 12.5%' }}></div>
                      </div>
                      
                      {/* Grid overlay for 8 rows x 9 columns */}
                      {isEditingFactionDiagram && (
                        <div className="absolute inset-0 grid grid-cols-9 grid-rows-8 z-10 pointer-events-auto">
                           {[1,2,3,4,5,6,7,8].map(row => (
                              [1,2,3,4,5,6,7,8,9].map(col => {
                                 const mX = (col - 0.5) * (100 / 9);
                                 const mY = (row - 0.5) * (100 / 8);
                                 const existingMemberIdx = (viewingFaction.members || []).findIndex((m: any) => {
                                    const mCol = Math.max(1, Math.min(9, Math.round(m.x / (100 / 9) + 0.5)));
                                    const mRow = Math.max(1, Math.min(8, Math.round(m.y / (100 / 8) + 0.5)));
                                    return mCol === col && mRow === row;
                                 });

                                 return (
                                    <div 
                                      key={`${row}-${col}`}
                                      onClick={() => {
                                         if (existingMemberIdx !== -1) {
                                            setNewFactionMember(viewingFaction.members[existingMemberIdx]);
                                            setShowFactionMemberModal({factionName: viewingFaction.name, memberIdx: existingMemberIdx});
                                         } else {
                                            setNewFactionMember({name: '', role: '', parentId: '', row, x: mX, y: mY});
                                            setShowFactionMemberModal({factionName: viewingFaction.name});
                                         }
                                      }}
                                      className="border-b border-r border-gold/20 border-dashed hover:bg-jade/20 cursor-pointer transition-colors relative group/cell flex items-center justify-center first:border-l first:border-t"
                                      style={{
                                        borderLeftWidth: col === 1 ? '1px' : '0',
                                        borderTopWidth: row === 1 ? '1px' : '0'
                                      }}
                                    >
                                      {col === 1 && (
                                        <span className="absolute left-1 text-[7px] sm:text-[9px] font-bold text-gold/40 uppercase tracking-tighter bg-parchment/80 px-1 rounded backdrop-blur-[1px] z-10 transition-opacity group-hover/cell:text-gold/80 pointer-events-none whitespace-nowrap">Vị Thế {row}</span>
                                      )}
                                      {row === 1 && (
                                        <span className="absolute top-1 text-[5px] sm:text-[7px] font-bold text-gold/40 uppercase bg-parchment/80 px-1 rounded backdrop-blur-[1px] z-10 transition-opacity group-hover/cell:text-gold/80 pointer-events-none">Cột {col}</span>
                                      )}
                                    </div>
                                 );
                              })
                           ))}
                        </div>
                      )}

                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                        <defs>
                          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <polygon points="0 0, 6 3, 0 6" fill="rgba(212, 163, 115, 0.8)" />
                          </marker>
                        </defs>
                      {(() => {
                          const getSnappedX = (x: number) => (Math.max(1, Math.min(9, Math.round(x / (100 / 9) + 0.5))) - 0.5) * (100 / 9);
                          const getSnappedY = (y: number) => (Math.max(1, Math.min(8, Math.round(y / (100 / 8) + 0.5))) - 0.5) * (100 / 8);
                          const snappedMembers = (viewingFaction.members || []).map((m: any) => ({
                             ...m,
                             x: getSnappedX(m.x ?? 50),
                             y: getSnappedY(m.y ?? 50)
                          }));
                          
                          return snappedMembers.filter((m: any) => characters.some(c => c.name === m.name)).map((m: any, idx: number) => {
                            if (!m.parentId) return null;
                            const parent = snappedMembers.filter((pm: any) => characters.some(c => c.name === pm.name)).find(p => p.id === m.parentId || p.name === m.parentId);
                            if (!parent) return null;
                            
                            const mPos = { x: m.x, y: m.y };
                            const pPos = { x: parent.x, y: parent.y };

                            const startY = pPos.y + 2;
                            const endY = mPos.y - 3; 
                            const midY = (startY + endY) / 2;

                            return (
                              <path 
                                key={`line-${m.id || idx}-${parent.id || parent.name}`}
                                d={`M ${pPos.x} ${startY} C ${pPos.x} ${midY}, ${mPos.x} ${midY}, ${mPos.x} ${endY}`}
                                stroke="rgba(212, 163, 115, 0.6)"
                                strokeWidth="1.5"
                                strokeDasharray={pPos.y < mPos.y ? "none" : "3 2"}
                                vectorEffect="non-scaling-stroke"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                              />
                            );
                          });
                      })()}
                      </svg>
                      
                      {(viewingFaction.members || []).filter((m: any) => characters.some(c => c.name === m.name)).map((mem, mIdx) => {
                         const getSnappedX = (x: number) => (Math.max(1, Math.min(9, Math.round(x / (100 / 9) + 0.5))) - 0.5) * (100 / 9);
                         const getSnappedY = (y: number) => (Math.max(1, Math.min(8, Math.round(y / (100 / 8) + 0.5))) - 0.5) * (100 / 8);
                         const member = { ...mem, x: getSnappedX(mem.x ?? 50), y: getSnappedY(mem.y ?? 50) };
                         return (
                         <div
                           key={`member-${mIdx}-${member.id}`}
                           id={`member-view-${mIdx}`}
                           style={{ 
                             left: `${member.x}%`, 
                             top: `${member.y}%`,
                             transform: "translate(-50%, -50%)",
                             position: "absolute"
                           }}
                           className={`flex flex-col items-center bg-transparent z-20 transition-transform group/mem ${isEditingFactionDiagram ? 'pointer-events-none' : ''}`}
                         >
                           <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full mb-1 border border-gold/40 flex items-center justify-center overflow-hidden pointer-events-none transition-colors border-gold bg-transparent">
                              {characters.find(c => c.name === member.name)?.avatar ? (
                                <img src={characters.find(c => c.name === member.name)?.avatar} className="w-full h-full object-cover" />
                              ) : (
                                <Users size={16} className="text-gold/40" />
                              )}
                           </div>
                           <div className="flex flex-col items-center pointer-events-none text-center bg-transparent px-1">
                             <h5 className="text-[7px] sm:text-[9px] font-bold text-ink truncate leading-tight drop-shadow-sm">{member.name}</h5>
                             <p className="text-[5px] sm:text-[7px] uppercase tracking-[0.1em] text-cinnabar/80 font-black truncate">{member.role}</p>
                           </div>
                           
                           {isEditingFactionDiagram && (
                             <div className="absolute -top-3 -right-6 flex flex-col gap-1 opacity-100 transition-opacity z-40 pointer-events-auto">
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setNewFactionMember(member);
                                   const existingIdx = viewingFaction.members.findIndex((m: any) => m.id === member.id && m.name === member.name);
                                   setShowFactionMemberModal({factionName: viewingFaction.name, memberIdx: existingIdx});
                                 }}
                                 className="w-5 h-5 bg-jade text-white rounded-full flex items-center justify-center cursor-pointer pointer-events-auto hover:bg-jade/80 shadow-md"
                               >
                                 <PenTool size={10} />
                               </button>
                               <button 
                                 onClick={async (e) => {
                                   e.stopPropagation();
                             setConfirmDialog({
                               message: 'Xóa nhân vật này khỏi sơ đồ? (Nhân vật vẫn tồn tại trong Cao Thủ)',
                               onConfirm: async () => {
                                 let updatedMembers;
                                 const updatedFactions = factions.map(f => {
                                   if (f.name === viewingFaction.name) {
                                     updatedMembers = (f.members || []).filter(m => m.id !== member.id && m.name !== member.name);
                                     return { ...f, members: updatedMembers };
                                   }
                                   return f;
                                 });
                                 setFactions(updatedFactions);
                                 setViewingFaction(updatedFactions.find(f => f.name === viewingFaction.name) || null);
                                 const vId2 = viewingFaction.id || toSlug(viewingFaction.name);
                                 if (updatedMembers && vId2 && activeProjectId) {
                                   await updateSubDoc('factions', vId2, { members: updatedMembers });
                                 }
                                 
                                 if (window.confirm("Bạn có muốn XÓA HOÀN TOÀN nhân vật này khỏi dữ liệu Cao Thủ không? (Nhấn OK để xóa)")) {
                                   handleDeleteCharacter(member.id || toSlug(member.name), member.name);
                                 }
                               }
                             });
                                 }}
                                 className="w-5 h-5 bg-cinnabar text-white rounded-full flex items-center justify-center cursor-pointer pointer-events-auto hover:bg-cinnabar/80 shadow-md"
                               >
                                 <X size={10} />
                               </button>
                             </div>
                           )}
                         </div>
                       );
                      })}

                      {(!viewingFaction.members || viewingFaction.members.length === 0) && !isEditingFactionDiagram && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-wood/30 italic text-[10px] sm:text-xs">
                           Chưa ghi nhận sơ đồ tổ chức...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Weapon Modal */}
        <AnimatePresence>
          {selectedWeapon && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 backdrop-blur-md p-2 sm:p-4">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-parchment w-full max-w-5xl h-[95vh] sm:h-[80vh] rounded-2xl sm:rounded-3xl shadow-2xl relative flex flex-col border-2 sm:border-4 border-blue-600/40 overflow-hidden text-ink font-sans">
                <button 
                  onClick={() => setSelectedWeapon(null)} 
                  className="absolute top-4 right-4 p-2 hover:bg-cinnabar/10 text-cinnabar transition-colors rounded-full z-[70] bg-white/40 border border-cinnabar/10 shadow-sm"
                >
                  <X size={24} />
                </button>
                
                <div className="flex-1 overflow-y-auto scroll-y-custom p-4 sm:p-8 lg:p-12 relative flex flex-col lg:flex-row gap-6 sm:gap-12">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                  
                  {/* Left Column - Avatar & Core Info */}
                  <div className="w-full lg:w-1/3 flex flex-col items-center gap-4 sm:gap-6 shrink-0 relative z-10">
                     <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-3xl sm:rounded-[3rem] bg-sand/30 border-2 sm:border-4 border-white shadow-2xl overflow-hidden p-1 sm:p-2 rotate-2 hover:rotate-0 transition-transform duration-500 bg-gradient-to-tr from-white to-sand">
                       <div className="w-full h-full rounded-2xl sm:rounded-[2.5rem] bg-white overflow-hidden shadow-inner flex items-center justify-center border border-gold/20 relative group">
                         {selectedWeapon.avatar ? (
                           <img src={selectedWeapon.avatar} alt={selectedWeapon.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                         ) : (
                           <Sword size={64} className="text-gold/20" />
                         )}
                         <div className="absolute inset-0 bg-gradient-to-t from-blue-600/40 to-transparent opacity-60"></div>
                       </div>
                     </div>
                     <div className="text-center w-full">
                       <h2 className="text-3xl sm:text-5xl font-display font-black text-blue-600 tracking-tighter brush-stroke mb-2 leading-none" style={{textShadow: '0 4px 12px rgba(37,99,235,0.2)'}}>{selectedWeapon.name}</h2>
                     </div>
                  </div>

                  {/* Right Column - Details */}
                  <div className="flex-1 flex flex-col gap-6 sm:gap-8 relative z-10 w-full min-w-0">
                     {/* Owners block */}
                     <div className="bg-white/60 p-5 sm:p-6 rounded-2xl shadow-sm border border-gold/10 w-full">
                       <div className="flex items-center gap-2 mb-4">
                         <Users size={16} className="text-blue-600" />
                         <span className="text-xs uppercase font-bold tracking-widest text-blue-600">Sở Yếu / Chủ Nhân</span>
                       </div>
                       
                       {(() => {
                         let ownerObj = characters.find(c => c.name.toLowerCase() === (selectedWeapon.owner || '').toLowerCase());
                         return ownerObj ? (
                           <div className="grid grid-cols-1 gap-3">
                               <div 
                                 onClick={() => { setSelectedCharacter(ownerObj); setSelectedWeapon(null); }} 
                                 className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-gold/10 hover:border-blue-600/40 hover:bg-white cursor-pointer transition-all shadow-sm group/owner"
                               >
                                 <div className="w-10 h-10 rounded-full overflow-hidden border border-gold shrink-0 transform group-hover/owner:rotate-6 transition-transform">
                                    {ownerObj.avatar ? <img src={ownerObj.avatar} className="w-full h-full object-cover" /> : <Users size={14} className="text-gold m-auto mt-2" />}
                                 </div>
                                 <span className="font-bold text-sm text-ink group-hover/owner:text-blue-700 transition-colors whitespace-nowrap overflow-hidden text-ellipsis">{ownerObj.name}</span>
                               </div>
                           </div>
                         ) : (
                           <p className="text-xs font-serif italic text-wood/60 px-2 break-words">{(selectedWeapon.owner) ? selectedWeapon.owner : "Vô chủ"}</p>
                         );
                       })()}
                     </div>

                     <div className="bg-white/80 p-5 sm:p-8 rounded-2xl shadow-sm border border-gold/20 w-full">
                       <div className="flex items-center gap-3 mb-3 sm:mb-4">
                         <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shrink-0">
                           <Sparkles className="text-blue-600" size={20} />
                         </div>
                         <h3 className="text-lg sm:text-xl font-display font-bold tracking-widest text-ink">Nguồn gốc</h3>
                       </div>
                       <div className="pl-0 sm:pl-14 max-w-full">
                          <p className="text-sm font-serif italic text-ink/80 leading-relaxed whitespace-pre-wrap break-words">{selectedWeapon.origin || "Chưa rõ lai lịch"}</p>
                       </div>
                     </div>

                     <div className="bg-gradient-to-br from-white to-sand/20 p-5 sm:p-8 rounded-2xl shadow-sm border border-gold/20 relative overflow-hidden w-full">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                       <div className="flex items-center gap-3 mb-3 sm:mb-4 relative z-10">
                         <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/40 shrink-0">
                           <Library className="text-gold" size={20} />
                         </div>
                         <h3 className="text-lg sm:text-xl font-display font-bold tracking-widest text-ink">Công dụng / Sức mạnh</h3>
                       </div>
                       <div className="pl-0 sm:pl-14 relative z-10 max-w-full">
                          <div className="text-sm font-sans text-ink leading-loose rounded-xl bg-white/40 p-4 border border-gold/10 overflow-hidden break-words">
                            {selectedWeapon.effect ? selectedWeapon.effect.split('\n').map((line, idx) => {
                                if (!line.trim()) return <br key={idx} />;

                                const parts = line.split(/(\*\*.*?\*\*)/g);
                                const lineContent = parts.map((part, pIdx) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                        return <span key={pIdx} className="font-bold text-blue-800">{part.slice(2, -2)}</span>;
                                    }
                                    return <span key={pIdx}>{part}</span>;
                                });

                                if (!line.includes('**')) {
                                    const colonMatch = line.match(/^(\s*(?:[-*]\s+|\d+\.\s*)?)([^:]+):(.*)$/);
                                    if (colonMatch && colonMatch[2].length < 40) {
                                        return (
                                            <div key={idx} className="mb-2 block">
                                                <span>{colonMatch[1]}</span>
                                                <span className="font-bold text-blue-800">{colonMatch[2]}:</span>
                                                <span>{colonMatch[3]}</span>
                                            </div>
                                        );
                                    }
                                }

                                return <div key={idx} className="mb-2 block">{lineContent}</div>;
                            }) : "Chưa rõ thần lực biên hạn..."}
                          </div>
                       </div>
                     </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Artifact Modal */}
        <AnimatePresence>
          {selectedArtifact && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 backdrop-blur-md p-2 sm:p-4">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-parchment w-full max-w-5xl h-[95vh] sm:h-[80vh] rounded-2xl sm:rounded-3xl shadow-2xl relative flex flex-col border-2 sm:border-4 border-gold/40 overflow-hidden text-ink font-sans">
                <button 
                  onClick={() => setSelectedArtifact(null)} 
                  className="absolute top-4 right-4 p-2 hover:bg-cinnabar/10 text-cinnabar transition-colors rounded-full z-[70] bg-white/40 border border-cinnabar/10 shadow-sm"
                >
                  <X size={24} />
                </button>
                
                <div className="flex-1 overflow-y-auto scroll-y-custom relative z-10 flex flex-col md:flex-row">
                  {/* Left Column: Avatar & Origin Summary */}
                  <div className="w-full md:w-[40%] bg-white/50 p-4 sm:p-6 lg:p-10 border-b md:border-b-0 md:border-r border-gold/20 flex flex-col">
                    <header className="flex flex-row md:flex-col gap-4 sm:gap-6 items-start mb-6 md:mb-10">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-56 md:h-56 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl border-2 md:border-4 border-gold/30 shrink-0 relative overflow-hidden transform rotate-2">
                         <div className="absolute inset-0 bg-gradient-to-tr from-sacred-orange/10 to-transparent"></div>
                         {selectedArtifact.avatar ? (
                           <img src={selectedArtifact.avatar} alt={selectedArtifact.name} className="w-full h-full object-cover" />
                         ) : (
                           <Gem size={32} className="text-sacred-orange/30 md:w-24 md:h-24" />
                         )}
                      </div>
                      
                      <div className="flex-1 text-left min-w-0">
                        <h3 className="text-xl sm:text-2xl md:text-5xl font-display font-bold text-ink italic leading-tight mb-2 md:mb-6">{selectedArtifact.name}</h3>
                        <div className="inline-flex items-center gap-2 bg-sacred-orange/10 px-3 py-1 rounded-full border border-sacred-orange/20">
                           <Sparkles size={12} className="text-sacred-orange" />
                           <span className="text-sacred-orange font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">Giang Hồ Kỳ Trân</span>
                        </div>
                      </div>
                    </header>
                    
                    <div className="space-y-3 sm:space-y-6">
                      <div className="text-[8px] sm:text-[10px] uppercase font-black text-wood/40 tracking-[0.3em] flex items-center gap-2">
                        Lai Lịch & Truyền Thuyết <div className="flex-1 h-[1px] bg-gold/10"></div>
                      </div>
                      <div className="bg-sand/10 p-3 sm:p-5 rounded-xl border border-gold/10 shadow-inner">
                         <div className="text-xs sm:text-base font-serif italic text-ink/80 leading-relaxed text-justify-viet whitespace-pre-wrap">
                           <FormattedText text={selectedArtifact.origin || "Lai lịch cuả bảo khí này chìm trong sương mù của lịch sử giang hồ..."} characters={characters} artifacts={artifacts} factions={factions} />
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Powers & Owners */}
                  <div className="flex-1 p-4 sm:p-8 lg:p-10 flex flex-col gap-8 sm:gap-12 bg-sand/5 text-left">
                    <section className="space-y-4">
                      <h4 className="flex items-center gap-4 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-cinnabar">
                        <Flame size={16} className="text-cinnabar" /> Uy Lực & Công Dụng
                      </h4>
                      <div className="bg-white/60 p-4 sm:p-8 rounded-2xl border border-gold/20 shadow-lg italic text-ink/90 font-serif text-xs sm:text-base leading-loose whitespace-pre-wrap">
                         <FormattedText text={selectedArtifact.effect || "Chưa rõ kỳ thư, thần lực ẩn giấu..."} characters={characters} artifacts={artifacts} factions={factions} />
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h4 className="flex items-center gap-4 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-wood">
                        <Users size={16} className="text-wood" /> Nhóm Sở Hữu
                      </h4>
                      {(() => {
                         const owners = characters.filter(c => c.weapon === selectedArtifact.name);
                         return owners.length > 0 ? (
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             {owners.map((owner, idx) => (
                               <div 
                                 key={idx} 
                                 onClick={() => { setSelectedCharacter(owner); setSelectedArtifact(null); }} 
                                 className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-gold/10 hover:border-cinnabar/40 hover:bg-white cursor-pointer transition-all shadow-sm group/owner"
                               >
                                 <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-gold shrink-0 transform group-hover/owner:rotate-6 transition-transform">
                                    {owner.avatar ? <img src={owner.avatar} className="w-full h-full object-cover" /> : <Users size={14} className="text-gold m-auto mt-2" />}
                                 </div>
                                 <div className="flex-1 overflow-hidden">
                                   <h5 className="text-xs sm:text-base font-bold text-ink italic truncate leading-none mb-1">{owner.name}</h5>
                                   <p className="text-[7px] sm:text-[9px] uppercase font-bold text-wood/60 tracking-wider">Chủ nhân hiện tại</p>
                                 </div>
                                 <ChevronRight size={14} className="text-gold" />
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="bg-sand/5 p-8 sm:p-12 rounded-2xl border border-dashed border-gold/20 text-center text-wood/40 italic font-serif text-sm">
                             Chưa tìm thấy chủ nhân hiện tại trong giới võ lâm...
                           </div>
                         );
                      })()}
                    </section>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        
      <AnimatePresence>
        {showFactionMemberModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-parchment w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden text-ink font-sans border-2 border-gold/40"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-jade to-transparent"></div>
              <div className="p-6">
                <h3 className="text-xl font-display font-medium text-jade mb-2">
                  Bố Trí Môn Đồ - {showFactionMemberModal.factionName}
                </h3>
                <p className="text-xs text-stone-500 font-serif italic mb-6">Thêm cao thủ vào môn phái này.</p>
                <form onSubmit={handleSaveFactionMember} className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest leading-loose">Danh Tính</label>
                      <select 
                        autoFocus
                        required
                        value={newFactionMember.name}
                        onChange={e => setNewFactionMember({...newFactionMember, name: e.target.value})}
                        className="w-full bg-white border border-gold/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jade/20"
                      >
                        <option value="">-- Chọn nhân vật (có trong mạch truyện) --</option>
                        {characters
                          .map(c => (
                          <option key={c.name} value={c.name}>{c.name} {c.role ? `(${c.role})` : ''}</option>
                        ))}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest leading-loose">Chức Vị / Vai Trò</label>
                      <input 
                        required
                        value={newFactionMember.role}
                        onChange={e => setNewFactionMember({...newFactionMember, role: e.target.value})}
                        className="w-full bg-white border border-gold/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jade/20"
                        placeholder="Ví dụ: Đại Đệ Tử, Trưởng Lão..."
                      />
                   </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest leading-loose">Trực Thuộc Suy Tôn</label>
                      <select
                        value={newFactionMember.parentId || ''}
                        onChange={e => setNewFactionMember({...newFactionMember, parentId: e.target.value})}
                        className="w-full bg-white border border-gold/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cinnabar/20"
                      >
                         <option value="">-- Trực tiếp từ Bang Phái --</option>
                         {factions.find(f => f.name === showFactionMemberModal.factionName)?.members?.filter((m: any) => m.id !== undefined && m.id !== "" && characters.some(c => c.name === m.name)).map((m: any, idx: number) => (
                           <option key={idx} value={m.id}>{m.name} - {m.role}</option>
                         ))}
                      </select>
                   </div>

                   <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest leading-loose">Hàng Ngang Bố Trí (1-8)</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setNewFactionMember({...newFactionMember, row: r})}
                            className={`w-10 h-10 rounded-lg font-bold border transition-all ${newFactionMember.row === r ? 'bg-jade text-white border-jade shadow-md scale-110' : 'bg-white text-wood border-gold/30 hover:border-gold'}`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                   </div>
                   
                   <div className="pt-4 flex justify-end gap-3">
                      <button type="button" onClick={() => setShowFactionMemberModal(null)} className="px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-wood/5 text-wood uppercase tracking-widest">
                        Hủy
                      </button>
                      <button type="submit" className="bg-gradient-to-r from-jade to-jade/80 text-white px-6 py-2.5 rounded-xl font-bold shadow hover:shadow-lg hover:scale-105 transition-all text-xs uppercase tracking-widest border border-jade/50">
                        {showFactionMemberModal.memberIdx !== undefined ? 'Cập Nhật' : 'Bố Trí'}
                      </button>
                   </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddFaction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-50 p-8 rounded-2xl border border-gold max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto scroll-y-custom">
                <button onClick={() => {
                  setShowAddFaction(false);
                  setEditingFactionIdx(null);
                  setNewFaction({ name: '', description: '', alignment: 'Chính phái', flagAvatar: '', leader: '' });
                }} className="absolute top-4 right-4 text-wood"><X size={20} /></button>
                <h3 className="text-2xl font-display font-bold text-jade mb-6">Khai Bang Lập Phái</h3>
                <form onSubmit={handleAddFaction} className="space-y-4">
                  <div className="flex gap-4 items-end mb-4">
                    <div className="w-24 h-24 flex-shrink-0 bg-white rounded-lg border-2 border-gold group/upload relative overflow-hidden flex items-center justify-center shadow-inner pt-2">
                       {newFaction.flagAvatar ? (
                          <img src={newFaction.flagAvatar} alt="Flag" className="w-full h-full object-cover" />
                       ) : (
                          <div className="flex flex-col items-center justify-center opacity-40">
                             <Shield size={32} />
                             <span className="text-[8px] font-bold mt-1 uppercase">Cờ Bang</span>
                          </div>
                       )}
                       <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus className="text-white" size={32} />
                       </div>
                    </div>
                    <div className="flex-1 flex flex-wrap gap-2">
                       <input id="faction-flag-upload" type="file" accept="image/*" className="hidden" onChange={handleFactionAvatarChange} />
                       <button 
                         type="button"
                         onClick={() => document.getElementById('faction-flag-upload')?.click()}
                         className="px-4 py-2 bg-sand border border-gold/50 rounded-lg text-xs font-bold text-wood hover:bg-gold hover:text-white transition-all uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                         disabled={isGeneratingFlag}
                       >
                         <Camera size={14} /> Tải Cờ / Biểu Tượng
                       </button>
                       <button 
                         type="button"
                         onClick={handleGenerateFlagAI}
                         className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 border border-indigo-400 rounded-lg text-xs font-bold text-white shadow-md hover:shadow-lg transition-all uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                         disabled={isGeneratingFlag}
                         title="Dựa vào Tên Bang và Tông Chỉ để vẽ cờ"
                       >
                         {isGeneratingFlag ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Vẽ Bằng AI
                       </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 relative">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase text-wood opacity-50">Tên Bang Hội</label>
                        {canEdit && (
                          <button 
                            type="button"
                            onClick={() => handleToggleGenericDictation('faction_name', (val) => setNewFaction({...newFaction, name: val}), newFaction.name || "", "Chuyển thành tên bang hội kiếm hiệp ngầu (chỉ trả về tên):\n\n\"{{transcript}}\"", true)}
                            disabled={isTranslatingSpeech && genericDictationField !== 'faction_name'}
                            className={`text-[9px] font-bold uppercase flex items-center px-2 py-0.5 rounded-full transition-all border ${isListening && genericDictationField === 'faction_name' ? 'bg-red-500 text-white animate-pulse border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'text-jade border-jade/20 hover:bg-jade/5'}`}
                          >
                            {isListening && genericDictationField === 'faction_name' ? <MicOff size={10} className="mr-1" /> : <Mic size={10} className="mr-1" />} 
                            Truyền âm
                          </button>
                        )}
                      </div>
                      <input 
                        autoFocus 
                        required 
                        readOnly={!canEdit}
                        value={newFaction.name} 
                        onChange={e => {
                          const name = e.target.value;
                          const abbrev = getAbbreviation(name);
                          setNewFaction({...newFaction, name, abbreviation: newFaction.abbreviation || abbrev});
                        }} 
                        type="text" 
                        className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-jade" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50">Viết Tắt</label>
                      <input 
                        readOnly={!canEdit}
                        value={newFaction.abbreviation || ''} 
                        onChange={e => setNewFaction({...newFaction, abbreviation: e.target.value})} 
                        type="text" 
                        placeholder="VD: TL, VĐ..."
                        className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-jade" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50">Phe Phái</label>
                      <select 
                        disabled={!canEdit}
                        value={newFaction.alignment} 
                        onChange={e => setNewFaction({...newFaction, alignment: e.target.value as any})} 
                        className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-jade"
                      >
                        <option value="Chính phái">Chính phái</option>
                        <option value="Tà phái">Tà phái</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-wood opacity-50">Bang Chủ / Chưởng Môn</label>
                    <select 
                      disabled={!canEdit}
                      value={newFaction.leader || ""} 
                      onChange={e => setNewFaction({...newFaction, leader: e.target.value})} 
                      className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-jade"
                    >
                      <option value="">-- Chưa Rõ --</option>
                      {characters.map(c => (
                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1 relative">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest mb-1.5">
                      <label>Tông Chỉ / Lịch Sử</label>
                      {canEdit && (
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => handleToggleGenericDictation('faction_desc', (val) => setNewFaction({...newFaction, description: val}), newFaction.description || "", "Chuyển đoạn miêu tả lịch sử và tông chỉ của bang hội sau sang phong cách kiếm hiệp:\n\n\"{{transcript}}\"", true)}
                            disabled={isTranslatingSpeech && genericDictationField !== 'faction_desc'}
                            className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 normal-case tracking-normal text-[9px] ${isListening && genericDictationField === 'faction_desc' ? 'bg-red-500 text-white border-red-500 animate-pulse' : 'bg-white text-jade border-jade/50 hover:bg-jade hover:text-white'}`}
                          >
                            {isListening && genericDictationField === 'faction_desc' ? <MicOff size={10} /> : <Mic size={10} />} Truyền âm
                          </button>
                          <button 
                            type="button"
                            onClick={handleGenerateFactionDescAI}
                            disabled={isGeneratingFactionDesc || !newFaction.name}
                            className="px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 border border-indigo-400 rounded text-white shadow-sm hover:shadow-md transition-all flex items-center gap-1 disabled:opacity-50 tracking-normal normal-case text-[9px]"
                            title="Để AI tự luận xuất thân bang phái này"
                          >
                            {isGeneratingFactionDesc ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} AI Gợi ý
                          </button>
                        </div>
                      )}
                    </div>
                    <textarea 
                      required 
                      readOnly={!canEdit}
                      value={newFaction.description} 
                      onChange={e => setNewFaction({...newFaction, description: e.target.value})} 
                      className="w-full bg-white border border-gold/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-jade h-32" 
                    />
                  </div>
                  {canEdit && (
                    <div className="flex flex-col md:flex-row gap-4">
                      {editingFactionIdx !== null && (
                        <button 
                          type="button" 
                          onClick={() => {
                            const factionToDelete = factions[editingFactionIdx];
                            handleDeleteFaction(factionToDelete.id || toSlug(factionToDelete.name), factionToDelete.name);
                            setShowAddFaction(false);
                          }}
                          className="w-full py-4 bg-white border border-cinnabar/30 text-cinnabar font-bold rounded-full hover:bg-cinnabar/10 transition-all uppercase tracking-widest text-xs"
                        >
                           Giải Tán
                        </button>
                      )}
                      <button type="submit" className="w-full py-4 bg-jade text-white font-bold rounded-full shadow-lg hover:bg-ink transition-all">Lập Đàn Bái Sư</button>
                    </div>
                  )}
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Artifact Modal */}
        <AnimatePresence>
          {showAddArtifact && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-parchment p-8 rounded-2xl border border-gold max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto scroll-y-custom">
                <button onClick={() => {
                  setShowAddArtifact(false);
                  setEditingArtifactIdx(null);
                  setNewArtifact({ id: '', name: '', origin: '', effect: '', avatar: '', abbreviation: '' });
                }} className="absolute top-4 right-4 text-wood"><X size={20} /></button>
                <h3 className="text-2xl font-display font-bold text-sacred-orange mb-6">
                  {editingArtifactIdx !== null ? 'Khảo Cứu Bí Bảo' : 'Ghi Nhận Bí Bảo Mới'}
                </h3>
                <form onSubmit={handleAddArtifact} className="space-y-4">
                  <div className="flex flex-col items-center mb-4 sticky top-0 bg-parchment z-10 py-2 border-b border-gold/10">
                    <div 
                      className={`w-32 h-32 rounded-full bg-sand/30 border-2 border-dashed border-gold flex items-center justify-center relative overflow-hidden group/upload ${canEdit ? 'cursor-pointer' : 'cursor-default'} shadow-inner transition-all hover:border-sacred-orange`} 
                      onClick={() => canEdit && document.getElementById('artifact-avatar-upload')?.click()}
                    >
                      {newArtifact.avatar ? (
                        <img src={newArtifact.avatar} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                           <Plus className="text-gold" size={40} />
                           <span className="text-[10px] font-bold text-gold uppercase tracking-tighter">Hình Ảnh Bí Bảo</span>
                        </div>
                      )}
                      {canEdit && (
                        <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus className="text-white" size={32} />
                        </div>
                      )}
                    </div>
                    <input id="artifact-avatar-upload" type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                         const compressed = await compressImage(reader.result as string);
                         setNewArtifact({...newArtifact, avatar: compressed});
                       };
                        reader.readAsDataURL(file);
                      }
                    }} disabled={!canEdit} />
                    {canEdit && (
                      <button 
                        type="button"
                        onClick={() => document.getElementById('artifact-avatar-upload')?.click()}
                        className="mt-3 px-4 py-1.5 bg-sand border border-gold/50 rounded-full text-[10px] font-bold text-wood hover:bg-gold hover:text-white transition-all uppercase tracking-widest flex items-center gap-2"
                      >
                        <Camera size={12} /> Tải Ảnh
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 relative">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Tên Bảo Vật</label>
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <button 
                            type="button"
                            onClick={handleSuggestArtifactAI}
                            className={`text-[9px] font-bold uppercase flex items-center transition-colors text-sacred-orange hover:text-sacred-orange/80`}
                            title="Gợi ý dữ liệu Kim Dung / Cổ Long từ Tên Bí Bảo"
                          >
                            <Sparkles size={10} className="mr-1" /> AI Gợi Ý
                          </button>
                        )}
                        {canEdit && (
                          <button 
                            type="button"
                            onClick={() => handleToggleGenericDictation('artifact_name', (val) => setNewArtifact({...newArtifact, name: val}), newArtifact.name || "", "Chuyển thành tên bảo vật/kỳ trân kiếm hiệp ngầu (chỉ trả về tên):\n\n\"{{transcript}}\"", true)}
                            disabled={isTranslatingSpeech && genericDictationField !== 'artifact_name'}
                            className={`text-[9px] font-bold uppercase flex items-center p-1 px-2 rounded transition-all ${isListening && genericDictationField === 'artifact_name' ? 'bg-red-500 text-white animate-pulse' : 'text-jade hover:bg-jade/10'}`}
                          >
                            {isListening && genericDictationField === 'artifact_name' ? <MicOff size={10} className="mr-1" /> : <Mic size={10} className="mr-1" />} 
                            Truyền âm
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Tên Bảo Vật</label>
                        <input 
                          autoFocus 
                          required 
                          readOnly={!canEdit}
                          value={newArtifact.name} 
                          onChange={e => {
                            const name = e.target.value;
                            const abbrev = getAbbreviation(name);
                            setNewArtifact({...newArtifact, name, abbreviation: newArtifact.abbreviation || abbrev});
                          }} 
                          type="text" 
                          placeholder="Tên Bí Bảo"
                          className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-sacred-orange text-sm" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Viết Tắt</label>
                        <input 
                          readOnly={!canEdit}
                          value={newArtifact.abbreviation || ''} 
                          onChange={e => setNewArtifact({...newArtifact, abbreviation: e.target.value})} 
                          type="text" 
                          placeholder="Viết Tắt"
                          className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-sacred-orange text-sm" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1 relative">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Nguồn Gốc Xuất Xứ</label>
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <button 
                            type="button"
                            onClick={handleSuggestArtifactAI}
                            className={`text-[9px] font-bold uppercase flex items-center transition-colors text-sacred-orange hover:text-sacred-orange/80`}
                          >
                            <Sparkles size={10} className="mr-1" /> Sáng tạo Lai Lịch
                          </button>
                        )}
                        {canEdit && (
                          <button 
                            type="button"
                            onClick={() => handleToggleGenericDictation('artifact_origin', (val) => setNewArtifact({...newArtifact, origin: val}), newArtifact.origin || "", "Chuyển đoạn miêu tả lai lịch, nguồn gốc bảo vật sau sang phong cách kiếm hiệp kỳ bí:\n\n\"{{transcript}}\"", true)}
                            disabled={isTranslatingSpeech && genericDictationField !== 'artifact_origin'}
                            className={`text-[9px] font-bold uppercase flex items-center px-2 py-0.5 rounded-full transition-all border ${isListening && genericDictationField === 'artifact_origin' ? 'bg-red-500 text-white animate-pulse border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'text-jade border-jade/20 hover:bg-jade/5'}`}
                          >
                            {isListening && genericDictationField === 'artifact_origin' ? <MicOff size={10} className="mr-1" /> : <Mic size={10} className="mr-1" />} 
                            Truyền âm
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea 
                      required 
                      readOnly={!canEdit}
                      value={newArtifact.origin} 
                      onChange={e => setNewArtifact({...newArtifact, origin: e.target.value})} 
                      className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-sacred-orange h-24 text-sm font-serif p-3 leading-relaxed" 
                    />
                  </div>

                  <div className="space-y-1 relative">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Công Dụng Đặc Biệt</label>
                      {canEdit && (
                        <button 
                          type="button"
                          onClick={() => handleToggleGenericDictation('artifact_effect', (val) => setNewArtifact({...newArtifact, effect: val}), newArtifact.effect || "", "Chuyển đoạn miêu tả công dụng tuyệt đỉnh của bảo vật sau sang phong cách kiếm hiệp:\n\n\"{{transcript}}\"", true)}
                          disabled={isTranslatingSpeech && genericDictationField !== 'artifact_effect'}
                          className={`text-[9px] font-bold uppercase flex items-center px-2 py-0.5 rounded-full transition-all border ${isListening && genericDictationField === 'artifact_effect' ? 'bg-red-500 text-white animate-pulse border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'text-jade border-jade/20 hover:bg-jade/5'}`}
                        >
                          {isListening && genericDictationField === 'artifact_effect' ? <MicOff size={10} className="mr-1" /> : <Mic size={10} className="mr-1" />} 
                          Truyền âm
                        </button>
                      )}
                    </div>
                    <textarea 
                      required 
                      readOnly={!canEdit}
                      value={newArtifact.effect} 
                      onChange={e => setNewArtifact({...newArtifact, effect: e.target.value})} 
                      className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-sacred-orange h-24 text-sm font-serif p-3 leading-relaxed" 
                    />
                  </div>
                  
                  {canEdit && (
                    <div className="flex flex-col md:flex-row gap-4 mt-6">
                      {editingArtifactIdx !== null && (
                        <button 
                          type="button" 
                          onClick={() => {
                            const artifactToDelete = artifacts[editingArtifactIdx];
                            handleDeleteArtifact(artifactToDelete.id || toSlug(artifactToDelete.name), artifactToDelete.name);
                            setShowAddArtifact(false);
                          }}
                          className="w-full py-4 bg-white border border-cinnabar/30 text-cinnabar font-bold rounded-full hover:bg-cinnabar/10 transition-all uppercase tracking-widest text-xs"
                        >
                           Tiêu Hủy
                        </button>
                      )}
                      <button type="submit" className="w-full py-4 bg-sacred-orange text-white font-bold rounded-full shadow-lg hover:bg-ink transition-all uppercase tracking-widest text-xs">
                        Lưu Bảo Vật
                      </button>
                    </div>
                  )}
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Weapon Modal */}
        <AnimatePresence>
          {showAddWeapon && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-parchment p-8 rounded-2xl border border-gold max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto scroll-y-custom">
                <button onClick={() => {
                  setShowAddWeapon(false);
                  setEditingWeaponIdx(null);
                  setNewWeapon({ id: '', name: '', origin: '', effect: '', avatar: '', owner: '', abbreviation: '' });
                }} className="absolute top-4 right-4 text-wood"><X size={20} /></button>
                <h3 className="text-2xl font-display font-bold text-blue-600 mb-6">
                  {editingWeaponIdx !== null ? 'Chi Tiết Thần Binh' : 'Tạo Thần Binh Mới'}
                </h3>
                <form onSubmit={handleAddWeapon} className="space-y-4">
                  <div className="flex flex-col items-center mb-4 sticky top-0 bg-parchment z-10 py-2 border-b border-gold/10">
                    <div 
                      className={`w-32 h-32 rounded-full bg-sand/30 border-2 border-dashed border-gold flex items-center justify-center relative overflow-hidden group/upload ${canEdit ? 'cursor-pointer' : 'cursor-default'} shadow-inner transition-all hover:border-blue-600`} 
                      onClick={() => canEdit && document.getElementById('weapon-avatar-upload')?.click()}
                    >
                      {newWeapon.avatar ? (
                        <img src={newWeapon.avatar} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                           <Plus className="text-gold" size={40} />
                           <span className="text-[10px] font-bold text-gold uppercase tracking-tighter">Hình Ảnh</span>
                        </div>
                      )}
                      {canEdit && (
                        <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus className="text-white" size={32} />
                        </div>
                      )}
                    </div>
                    <input id="weapon-avatar-upload" type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                         const compressed = await compressImage(reader.result as string);
                         setNewWeapon({...newWeapon, avatar: compressed});
                       };
                        reader.readAsDataURL(file);
                      }
                    }} disabled={!canEdit} />
                    {canEdit && (
                      <button 
                        type="button"
                        onClick={() => document.getElementById('weapon-avatar-upload')?.click()}
                        className="mt-3 px-4 py-1.5 bg-sand border border-gold/50 rounded-full text-[10px] font-bold text-wood hover:bg-gold hover:text-white transition-all uppercase tracking-widest flex items-center gap-2"
                      >
                        <Camera size={12} /> Tải Ảnh
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 relative">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Tên Thần Binh</label>
                        <input 
                          autoFocus 
                          required 
                          readOnly={!canEdit}
                          value={newWeapon.name} 
                          onChange={e => {
                            const name = e.target.value;
                            const abbrev = getAbbreviation(name);
                            setNewWeapon({...newWeapon, name, abbreviation: newWeapon.abbreviation || abbrev});
                          }} 
                          type="text" 
                          placeholder="Tên Thần Binh"
                          className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 text-sm" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Viết Tắt</label>
                        <input 
                          readOnly={!canEdit}
                          value={newWeapon.abbreviation || ''} 
                          onChange={e => setNewWeapon({...newWeapon, abbreviation: e.target.value})} 
                          type="text" 
                          placeholder="Viết Tắt"
                          className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 text-sm" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Chủ Nhân</label>
                    <input 
                      readOnly={!canEdit}
                      value={newWeapon.owner || ''} 
                      onChange={e => setNewWeapon({...newWeapon, owner: e.target.value})} 
                      type="text" 
                      className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 text-sm" 
                    />
                  </div>

                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Lai Lịch Nguồn Gốc</label>
                    <textarea 
                      required 
                      readOnly={!canEdit}
                      value={newWeapon.origin} 
                      onChange={e => setNewWeapon({...newWeapon, origin: e.target.value})} 
                      className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 h-24 text-sm font-serif p-3 leading-relaxed" 
                    />
                  </div>

                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Đặc tính / Uy lực</label>
                    <textarea 
                      readOnly={!canEdit}
                      value={newWeapon.effect} 
                      onChange={e => setNewWeapon({...newWeapon, effect: e.target.value})} 
                      className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 h-24 text-sm font-serif p-3 leading-relaxed" 
                    />
                  </div>
                  
                  {canEdit && (
                    <div className="flex flex-col md:flex-row gap-4 mt-6">
                      {editingWeaponIdx !== null && (
                        <button 
                          type="button" 
                          onClick={() => {
                            const weaponToDelete = weapons[editingWeaponIdx];
                            handleDeleteWeapon(weaponToDelete.id || toSlug(weaponToDelete.name), weaponToDelete.name);
                            setShowAddWeapon(false);
                          }}
                          className="w-full py-4 bg-white border border-cinnabar/30 text-cinnabar font-bold rounded-full hover:bg-cinnabar/10 transition-all uppercase tracking-widest text-xs"
                        >
                           Tiêu Hủy
                        </button>
                      )}
                      <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-full shadow-lg hover:bg-ink transition-all uppercase tracking-widest text-xs">
                        Lưu Thần Binh
                      </button>
                    </div>
                  )}
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Side Story Modal */}
        <AnimatePresence>
          {showAddSideStoryModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-parchment p-8 rounded-2xl border border-gold max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
                <button onClick={() => {
                  setShowAddSideStoryModal(false);
                  setNewEpisodePayload({ title: '', content: '', characterName: '' });
                }} className="absolute top-4 right-4 text-wood hover:text-cinnabar transition-colors"><X size={20} /></button>
                <h3 className="text-2xl font-display font-bold text-cinnabar mb-2">Thuyết Thư Ngoại Truyện</h3>
                <p className="text-sm font-serif text-wood/80 mb-6 italic">Ghi chép một chương truyện mới bên lề giang hồ.</p>
                
                <div className="space-y-4 flex-1 overflow-y-auto scroll-y-custom pr-2">
                  <div className="space-y-1 relative">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50">Tên Ngoại Truyện</label>
                      {canEdit && (
                        <button 
                          type="button"
                          onClick={() => handleToggleGenericDictation('side_story_title', (val) => setNewEpisodePayload({...newEpisodePayload, title: val}), newEpisodePayload.title || "", "Chuyển thành tên ngoại truyện kiếm hiệp thật kêu (chỉ trả về tên):\n\n\"{{transcript}}\"", true)}
                          disabled={isTranslatingSpeech && genericDictationField !== 'side_story_title'}
                          className={`text-[9px] font-bold uppercase flex items-center transition-colors ${isListening && genericDictationField === 'side_story_title' ? 'text-red-500 animate-pulse' : 'text-jade hover:text-jade/80'}`}
                        >
                          {isListening && genericDictationField === 'side_story_title' ? <MicOff size={10} /> : <Mic size={10} />} 
                        </button>
                      )}
                    </div>
                    <input 
                      autoFocus 
                      readOnly={!canEdit}
                      value={newEpisodePayload.title} 
                      onChange={e => setNewEpisodePayload({...newEpisodePayload, title: e.target.value})} 
                      type="text" 
                      placeholder="VD: Bí Mật Dưới Đáy Tuyệt Tình Cốc"
                      className="w-full bg-white border border-gold/30 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cinnabar" 
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 mb-2">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50">Sườn Diễn Biến</label>
                      {canEdit && (
                        <div className="flex gap-2">
                          <button 
                            onClick={handleToggleDictation}
                            disabled={isTranslatingSpeech}
                            className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all flex items-center gap-1 shrink-0 ${isListening ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-sand text-wood border-gold/30 hover:bg-gold/20'}`}
                          >
                            {isTranslatingSpeech ? <Loader2 size={12} className="animate-spin" /> : (isListening ? <MicOff size={12} /> : <Mic size={12} />)} 
                            {isListening ? 'Đang nghe...' : 'Truyền Âm'}
                          </button>
                          <button 
                            onClick={() => handleAICreateEpisode('NGOẠI TRUYỆN')}
                            disabled={isGeneratingEpisode || !newEpisodePayload.title}
                            className="px-3 py-1.5 bg-gradient-to-r from-cinnabar to-red-700 text-white rounded text-[10px] font-bold border border-gold/40 hover:shadow-lg transition-all flex items-center gap-1 disabled:opacity-50 shrink-0"
                          >
                            {isGeneratingEpisode ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI Phóng Bút
                          </button>
                        </div>
                      )}
                    </div>
                    <textarea 
                      readOnly={!canEdit}
                      value={newEpisodePayload.content} 
                      onChange={e => setNewEpisodePayload({...newEpisodePayload, content: e.target.value})} 
                      className="w-full bg-white border border-gold/30 rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-cinnabar h-48 font-serif leading-loose" 
                      placeholder="Mỗi dòng sẽ được tách thành một điểm mấu chốt của ngoại truyện..."
                    />
                  </div>
                </div>
                {canEdit && (
                  <div className="pt-6 mt-4 border-t border-gold/10">
                    <button 
                       onClick={handleSaveNewSideStory}
                       className="w-full py-4 bg-cinnabar text-white font-bold rounded-full shadow-lg hover:bg-ink transition-all uppercase tracking-widest text-xs"
                    >
                       Đóng Mộc Ngoại Truyện
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Character Memory Modal */}
        <AnimatePresence>
          {showAddMemoryModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-parchment p-8 rounded-2xl border border-gold max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
                <button onClick={() => {
                  setShowAddMemoryModal(false);
                  setNewEpisodePayload({ title: '', content: '', characterName: '' });
                }} className="absolute top-4 right-4 text-wood hover:text-cinnabar transition-colors"><X size={20} /></button>
                <h3 className="text-2xl font-display font-bold text-cinnabar mb-2">Truy Tìm Hồi Ức</h3>
                <p className="text-sm font-serif text-wood/80 mb-6 italic">Mỗi kỷ niệm là một phiến đá xây dựng nên tính cách cao thủ.</p>
                
                <div className="space-y-4 flex-1 overflow-y-auto scroll-y-custom pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 relative">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase text-wood opacity-50">Tên Hồi Ức</label>
                      </div>
                      <input 
                        autoFocus 
                        readOnly={!canEdit}
                        value={newEpisodePayload.title} 
                        onChange={e => setNewEpisodePayload({...newEpisodePayload, title: e.target.value})} 
                        type="text" 
                        placeholder="VD: Kiếp Nạn Năm 10 Tuổi"
                        className="w-full bg-white border border-gold/30 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cinnabar font-bold" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50">Chủ Thể Ký Ức</label>
                      <select 
                        disabled={!canEdit}
                        value={newEpisodePayload.characterName || ""}
                        onChange={(e) => setNewEpisodePayload({...newEpisodePayload, characterName: e.target.value})}
                        className="w-full bg-white border border-gold/30 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cinnabar text-sm font-serif italic"
                      >
                        <option value="">-- Chọn nhân vật --</option>
                        {characters.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 mb-2">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50">Chi Tiết Hồi Ức</label>
                      {canEdit && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAICreateEpisode('KÝ ỨC')}
                            disabled={isGeneratingEpisode || !newEpisodePayload.title}
                            className="px-3 py-1.5 bg-gradient-to-r from-cinnabar to-red-700 text-white rounded text-[10px] font-bold border border-gold/40 hover:shadow-lg transition-all flex items-center gap-1 disabled:opacity-50 shrink-0"
                          >
                            {isGeneratingEpisode ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI Phóng Bút
                          </button>
                        </div>
                      )}
                    </div>
                    <textarea 
                      readOnly={!canEdit}
                      value={newEpisodePayload.content} 
                      onChange={e => setNewEpisodePayload({...newEpisodePayload, content: e.target.value})} 
                      className="w-full bg-white border border-gold/30 rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-cinnabar h-48 font-serif leading-loose" 
                      placeholder="Mô tả lại sự kiện đã xa..."
                    />
                  </div>
                </div>
                {canEdit && (
                  <div className="pt-6 mt-4 border-t border-gold/10">
                    <button 
                       onClick={handleSaveNewMemory}
                       className="w-full py-4 bg-cinnabar text-white font-bold rounded-full shadow-lg hover:bg-ink transition-all uppercase tracking-widest text-xs"
                    >
                       Khắc Ghi Hồi Ức
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Episode Modal */}
        <AnimatePresence>
          {showAddEpisodeModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-parchment p-8 rounded-2xl border border-gold max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
                <button onClick={() => {
                  setShowAddEpisodeModal(null);
                  setNewEpisodePayload({ title: '', content: '' });
                }} className="absolute top-4 right-4 text-wood hover:text-cinnabar transition-colors"><X size={20} /></button>
                <h3 className="text-2xl font-display font-bold text-cinnabar mb-2">Thuyết Thư Lập Truyện</h3>
                <p className="text-sm font-serif text-wood/80 mb-6 italic">Thêm một diễn biến (tập phim) mới vào hồi <span className="font-bold text-jade">{showAddEpisodeModal}</span></p>
                
                <div className="space-y-4 flex-1 overflow-y-auto scroll-y-custom pr-2">
                  <div className="space-y-1 relative">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50">Tên Tập Phim</label>
                      {canEdit && (
                        <button 
                          type="button"
                          onClick={() => handleToggleGenericDictation('episode_title', (val) => setNewEpisodePayload({...newEpisodePayload, title: val}), newEpisodePayload.title || "", "Chuyển thành tên tập phim kiếm hiệp thật kêu (chỉ trả về tên):\n\n\"{{transcript}}\"", true)}
                          disabled={isTranslatingSpeech && genericDictationField !== 'episode_title'}
                          className={`text-[9px] font-bold uppercase flex items-center px-2 py-0.5 rounded-full transition-all border ${isListening && genericDictationField === 'episode_title' ? 'bg-red-500 text-white animate-pulse border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'text-jade border-jade/20 hover:bg-jade/5'}`}
                        >
                          {isListening && genericDictationField === 'episode_title' ? <MicOff size={10} className="mr-1" /> : <Mic size={10} className="mr-1" />} 
                          Truyền âm
                        </button>
                      )}
                    </div>
                    <input 
                      autoFocus 
                      readOnly={!canEdit}
                      value={newEpisodePayload.title} 
                      onChange={e => setNewEpisodePayload({...newEpisodePayload, title: e.target.value})} 
                      type="text" 
                      placeholder="VD: Huyết Chiến Quang Minh Đỉnh"
                      className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cinnabar" 
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 mb-2">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50">Sườn Diễn Biến (Text / Paste)</label>
                      {canEdit && (
                        <div className="flex gap-2">
                          <input type="file" id="import-episode-file" accept=".txt,.json,.docx" className="hidden" onChange={handleImportEpisodeFile} />
                          <button 
                            onClick={() => document.getElementById('import-episode-file')?.click()}
                            className="px-3 py-1.5 bg-sand rounded text-[10px] font-bold border border-gold/30 hover:border-gold hover:text-cinnabar transition-all flex items-center gap-1 object-cover"
                          >
                            <Upload size={12} /> Import File
                          </button>
                          <button 
                            onClick={handleToggleDictation}
                            disabled={isTranslatingSpeech}
                            className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all flex items-center gap-1 shrink-0 ${isListening ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-jade text-white border-jade/80 hover:bg-jade/90'}`}
                            title="Đọc cốt truyện, AI sẽ tự động phổ bằng văn phong kiếm hiệp"
                          >
                            {isTranslatingSpeech ? <Loader2 size={12} className="animate-spin" /> : (isListening ? <MicOff size={12} /> : <Mic size={12} />)} 
                            {isListening ? 'Đang nghe...' : 'Truyền Âm'}
                          </button>
                          <button 
                            onClick={() => handleAICreateEpisode(showAddEpisodeModal)}
                            disabled={isGeneratingEpisode || !newEpisodePayload.title}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded text-[10px] font-bold border border-indigo-400 hover:shadow-lg transition-all flex items-center gap-1 disabled:opacity-50 shrink-0"
                          >
                            {isGeneratingEpisode ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI Phóng Bút
                          </button>
                        </div>
                      )}
                    </div>
                    <textarea 
                      readOnly={!canEdit}
                      value={newEpisodePayload.content} 
                      onChange={e => setNewEpisodePayload({...newEpisodePayload, content: e.target.value})} 
                      className="w-full bg-white border border-gold/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-cinnabar h-48 font-serif leading-loose" 
                      placeholder="Mỗi dòng hoặc mỗi đoạn sẽ được tách thành một ý chính của tập phim..."
                    />
                  </div>
                </div>
                {canEdit && (
                  <div className="pt-6 mt-4 border-t border-gold/20">
                    <button 
                       onClick={() => handleSaveNewEpisode(showAddEpisodeModal)}
                       className="w-full py-4 bg-cinnabar text-white font-bold rounded-full shadow-lg hover:bg-ink transition-all uppercase tracking-widest text-xs"
                    >
                       Đóng Mộc Ban Hành
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Full Screen Scene View */}
        <AnimatePresence>
          {fullScreenScene && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-[70] bg-ink flex flex-col md:flex-row overflow-hidden"
            >
              {/* Left Side: Script/Content (Main focus) */}
              <div className="flex-1 overflow-y-auto bg-white p-6 sm:p-12 relative scroll-y-custom">
                <button 
                  onClick={() => setFullScreenScene(null)} 
                  className="hidden md:flex absolute top-8 right-8 w-12 h-12 bg-parchment rounded-full items-center justify-center border border-gold hover:bg-sand transition-all text-wood z-20"
                >
                  <X size={24} />
                </button>
                
                <div className="max-w-3xl mx-auto space-y-8 pb-20">
                  <div className="text-center space-y-2 mb-12 hidden md:block">
                    <h2 className="text-4xl font-display font-bold text-cinnabar underline decoration-gold/30 underline-offset-8 decoration-4">{fullScreenScene.ep.title}</h2>
                    <p className="text-sm font-bold opacity-40 uppercase tracking-[0.4em] text-wood">{fullScreenScene.point}</p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-8 top-0 bottom-0 w-px bg-gold/30 hidden lg:block"></div>
                    <div className="text-xl sm:text-2xl text-ink/90 font-serif leading-loose text-justify-viet italic whitespace-pre-wrap first-letter:text-5xl first-letter:float-left first-letter:mr-3 first-letter:font-bold first-letter:text-cinnabar">
                      <FormattedText text={fullScreenScene.scene.content} characters={characters} artifacts={artifacts} factions={factions} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side / Bottom: Prompt & Media */}
              <div className="w-full md:w-[400px] lg:w-[500px] shrink-0 bg-parchment/95 border-t md:border-t-0 md:border-l border-gold flex flex-col h-[50vh] md:h-screen overflow-hidden">
                <div className="p-4 bg-sand/30 border-b border-gold/20 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-jade flex items-center gap-2"><Video size={14} /> Tư Liệu AI</h3>
                  <button 
                    onClick={() => {
                       navigator.clipboard.writeText(fullScreenScene.scene.videoPrompt || "");
                       alert("Đã sao chép prompt!");
                    }}
                    className="text-[10px] font-bold bg-white px-3 py-1 rounded shadow-sm border border-gold/30 hover:border-jade hover:text-jade transition-all"
                  >
                    Sao chép Prompt
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-y-custom">
                  {fullScreenScene.scene.storyboardImage && (
                    <div className="space-y-2">
                       <p className="text-[10px] font-bold uppercase opacity-40 tracking-widest">Storyboard Visual</p>
                       <img src={fullScreenScene.scene.storyboardImage} className="w-full h-auto rounded-xl shadow-lg border border-gold" alt="Storyboard" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase opacity-40 tracking-widest">Video Prompt Context</p>
                    <div className="bg-white p-4 rounded-xl border border-gold/30 text-xs font-mono italic leading-relaxed text-jade/80 whitespace-pre-wrap">
                      {fullScreenScene.scene.videoPrompt || "Chưa có prompt video AI cho phân cảnh này."}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showAddArcModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-parchment p-8 rounded-2xl border border-gold max-w-lg w-full shadow-2xl relative">
                <button onClick={() => setShowAddArcModal(false)} className="absolute top-4 right-4 text-wood hover:text-cinnabar transition-colors"><X size={20} /></button>
                <h3 className="text-2xl font-display font-bold text-cinnabar mb-6">Mở Rộng Biên Niên Sử</h3>
                
                <div className="space-y-4">
                  <div className="space-y-1 relative">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Tên Hồi Phim</label>
                      <button 
                        type="button"
                        onClick={() => handleToggleGenericDictation('arc_title', (val) => setNewArcTitle(val), newArcTitle, "Chuyển thành tên Hồi/Chương tiểu thuyết võ hiệp (ví dụ: Tôn Hiệu Giang Hồ) - chỉ trả về tên:\n\n\"{{transcript}}\"", true)}
                        disabled={isTranslatingSpeech && genericDictationField !== 'arc_title'}
                        className={`text-[9px] font-bold uppercase flex items-center transition-colors ${isListening && genericDictationField === 'arc_title' ? 'text-red-500 animate-pulse' : 'text-jade hover:text-jade/80'}`}
                      >
                        {isListening && genericDictationField === 'arc_title' ? <MicOff size={10} /> : <Mic size={10} />} 
                      </button>
                    </div>
                    <input 
                      autoFocus 
                      readOnly={!canEdit}
                      value={newArcTitle} 
                      onChange={e => setNewArcTitle(e.target.value)} 
                      type="text" 
                      placeholder="VD: Hồi 8: Hoa Sơn Luận Kiếm"
                      className="w-full bg-white border border-gold/50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cinnabar" 
                    />
                  </div>
                </div>
                {canEdit && (
                  <button 
                    onClick={handleSaveNewArc}
                    className="w-full py-4 mt-6 bg-cinnabar text-white font-bold rounded-full shadow-lg hover:bg-ink transition-all uppercase tracking-widest text-xs"
                  >
                    Lưu Lại
                  </button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {confirmDialog && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-parchment w-full max-w-sm rounded-2xl shadow-2xl border border-gold/50 overflow-hidden"
              >
                <div className="p-4 border-b border-gold/30 bg-cinnabar/5 flex items-center justify-center">
                  <h3 className="text-lg font-display font-bold text-cinnabar">Cảnh Báo</h3>
                </div>
                <div className="p-6 text-center text-ink space-y-6">
                  <p className="font-serif italic text-sm">{confirmDialog.message}</p>
                  <div className="flex justify-center gap-3">
                    <button 
                      onClick={() => setConfirmDialog(null)}
                      className="px-6 py-2 bg-wood/10 text-wood hover:bg-wood hover:text-white rounded-lg font-bold uppercase tracking-widest text-xs transition-colors"
                    >
                      Bỏ Qua
                    </button>
                    <button 
                      onClick={() => {
                        confirmDialog.onConfirm();
                        setConfirmDialog(null);
                      }}
                      className="px-6 py-2 bg-cinnabar text-white hover:bg-red-700 rounded-lg font-bold uppercase tracking-widest text-xs transition-colors shadow-md"
                    >
                      Chấp Thuận
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showWelcomePopup && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm"
              onClick={() => setShowWelcomePopup(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-gray-900 to-amber-900 border-4 border-amber-500 w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-serif text-amber-100 mb-4">Hoan nghênh đại hiệp</h2>
                <p className="text-amber-200 mb-6 italic leading-relaxed">"Đã lâu rồi đại hiệp mới trở lại. Hãy nhận truyền công để tiếp thu linh khí."</p>
                <button 
                  onClick={async () => {
                    await fetchEssentialData();
                    await fetchSecondaryData();
                    setShowWelcomePopup(false);
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all"
                >
                  Nhận truyền công
                </button>
              </motion.div>
            </motion.div>
          )}


        </AnimatePresence>

        <AnimatePresence>
          {showReadOnlyModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-parchment w-full max-w-md rounded-2xl shadow-2xl border border-gold overflow-hidden"
              >
                <div className="p-6 border-b border-gold/30 bg-cinnabar/5 flex items-center justify-between">
                  <h3 className="text-xl font-display font-bold text-cinnabar">Cáo Thị Giang Hồ</h3>
                  <button onClick={() => setShowReadOnlyModal(false)} className="text-wood/40 hover:text-cinnabar transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 flex flex-col items-center text-center space-y-4">
                  <ScrollText size={48} className="text-gold/60" />
                  <p className="text-sm text-ink/80 font-serif leading-loose italic">
                    Các hạ không có quyền can thiệp vào bí tịch này, chỉ có thể làm khách mạc lãm thị toàn bộ điển tịch và dữ liệu. Hãy thong dong đứng ngoài quan sát càn khôn. Nếu muốn xuất thủ tương trợ, xin hãy báo danh Bản Chủ để được cấp quyền!
                  </p>
                  <button 
                    onClick={() => setShowReadOnlyModal(false)}
                    className="px-8 py-3 mt-4 bg-cinnabar text-white font-bold rounded-xl shadow-lg hover:bg-ink transition-all uppercase tracking-widest text-xs"
                  >
                    Đã Rõ, Tại Hạ Hiểu
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showShareModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-parchment w-full max-w-md rounded-2xl shadow-2xl border border-gold overflow-hidden"
              >
                <div className="p-6 border-b border-gold/30 bg-cinnabar/5 flex items-center justify-between">
                  <h3 className="text-xl font-display font-bold text-cinnabar">Chia sẻ quyền lực (Collaborators)</h3>
                  <button onClick={() => setShowShareModal(false)} className="text-wood/40 hover:text-cinnabar transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-wood/60 mb-2">Thêm bằng hữu (Email)</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="email"
                          readOnly={!canShare}
                          placeholder="email@vidu.com"
                          className="flex-1 min-w-0 bg-white border border-gold/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cinnabar/20"
                          value={shareEmail}
                          onChange={(e) => setShareEmail(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && canShare && handleShareProject(shareEmail, 'add', shareRole)}
                        />
                        <select
                          disabled={!canShare}
                          value={shareRole}
                          onChange={(e: any) => setShareRole(e.target.value)}
                          className="w-32 bg-white border border-gold/50 rounded-xl px-2 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-cinnabar/20 text-wood"
                        >
                           <option value="viewer">Khách Xem</option>
                           <option value="collaborator">Cộng Tác Viên</option>
                           <option value="admin">Quản Sự (Admin)</option>
                        </select>
                      </div>
                      {canShare && (
                        <button 
                          onClick={() => handleShareProject(shareEmail, 'add', shareRole)}
                          disabled={isSharing || !shareEmail}
                          className="px-6 py-3 bg-cinnabar text-white rounded-xl font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          {isSharing ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                          Mời
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-wood/60 mb-3">Danh sách đồng đạo ({collaborators.length})</label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scroll-y-custom">
                      {collaborators.length === 0 ? (
                        <p className="text-sm text-wood/40 italic">Chưa có ai cùng chấp bút.</p>
                      ) : (
                        collaborators.map(email => (
                          <div key={email} className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-gold/20 group">
                            <div className="flex flex-col">
    <span className="text-sm text-wood font-medium">{email}</span>
    {canShare ? (
      <select 
         value={collaboratorRoles[email] || 'collaborator'}
         onChange={(e: any) => handleShareProject(email, 'add', e.target.value)}
         className="text-[10px] uppercase text-jade bg-transparent border-none p-0 cursor-pointer focus:outline-none"
      >
         <option value="viewer">Khách Xem</option>
         <option value="collaborator">Cộng Tác Viên</option>
         <option value="admin">Quản Sự (Admin)</option>
      </select>
    ) : (
      <span className="text-[10px] uppercase text-jade">
        {collaboratorRoles[email] === 'admin' ? 'Quản Sự (Admin)' : (collaboratorRoles[email] === 'viewer' ? 'Khách Xem' : 'Cộng Tác Viên')}
      </span>
    )}
</div>
                            {canShare && (
                              <button 
                                onClick={() => { if (!canShare) { alert('Không có quyền chia sẻ!'); return; } handleShareProject(email, 'remove'); }}
                                className="p-1.5 text-wood/20 hover:text-cinnabar transition-all focus:opacity-100"
                                title="Xóa quyền truy cập"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-wood/5 border-t border-gold/30">
                  <p className="text-[10px] text-wood/60 italic leading-relaxed">
                    Lưu ý: Bằng hữu được mời có quyền truy cập dữ liệu dự án. Hãy cẩn trọng khi trao quyền.<br/>
                    <strong className="text-cinnabar">Quan trọng:</strong> Sau khi mời, bạn bắt buộc phải ấn Truyền Công (Thiết Lập Sở Hành) để đẩy tài liệu từ máy bạn lên Mây (Thiên Thư). Khi đó bằng hữu mới có thể Nhận Truyền Công về máy họ.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {showBackToTop && (
          <button 
            onClick={() => document.getElementById('main-content')?.scrollTo({top: 0, behavior: 'smooth'})}
            className="fixed bottom-6 lg:bottom-10 right-6 lg:right-10 p-3 bg-cinnabar text-white rounded-full shadow-[0_0_15px_rgba(230,57,70,0.5)] hover:bg-ink hover:scale-110 hover:-translate-y-1 transition-all z-[90] border border-gold/50 cursor-pointer"
            title="Cuộn lên đầu trang"
          >
            <ArrowUp size={24} />
          </button>
        )}
      </main>

      {/* Right Scroll Cap */}
      <div className="hidden 2xl:flex w-16 bg-wood rounded-r-md border-y-4 border-r-4 border-[#8c6746] items-center justify-center relative shadow-[4px_0_10px_rgba(0,0,0,0.5)] z-30">
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-[80%] right-3 border-r-4 border-double border-red-600/80 shadow-[2px_0_4px_rgba(0,0,0,0.3)]"></div>
        <div className="w-8 h-8 rounded-full border-2 border-red-500 bg-red-600 absolute top-1/2 -translate-y-1/2 right-1 flex items-center justify-center shadow-lg">
           <div className="w-2 h-2 rounded-full bg-gold"></div>
        </div>
      </div>
      
      {/* Update Notification Pop-over */}
      <AnimatePresence>
        {showUpdateNotification && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 z-[100] bg-ink border-2 border-gold p-4 rounded-xl shadow-2xl flex items-center gap-4 max-w-sm"
          >
            <div className="bg-gold/20 p-2 rounded-lg">
              <Sparkles className="text-gold animate-pulse" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Thiên Cơ Các vừa cập nhật Mật Tịch mới!</p>
              <p className="text-gold/60 text-[10px] italic">Đang tự động truyền công pháp mới nhất (5s)...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}

function NavItem({ 
  active, 
  icon, 
  customIconUrl,
  label, 
  onClick, 
  onEdit, 
  isEditing, 
  onLabelChange,
  onStopEdit,
  onRemove
}: { 
  active: boolean, 
  icon: React.ReactNode, 
  customIconUrl?: string,
  label: string, 
  onClick: () => void,
  onEdit?: () => void,
  isEditing?: boolean,
  onLabelChange?: (label: string) => void,
  onStopEdit?: () => void,
  onRemove?: () => void,
  key?: React.Key
}) {
  return (
    <div 
      onClick={isEditing ? undefined : onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group cursor-pointer ${
        active 
          ? 'bg-pill-bg text-cinnabar font-bold shadow-sm' 
          : 'text-wood/60 hover:text-wood hover:bg-white/20'
      }`}
    >
      <div className={`w-2 h-2 rounded-full transition-all ${active ? 'bg-cinnabar scale-125' : 'bg-wood/30'}`}></div>
      <div className="flex items-center gap-2 flex-1 text-left">
        {customIconUrl ? (
          <img src={customIconUrl} alt={label} className="w-5 h-5 object-cover rounded-sm border border-gold/30" />
        ) : (
          icon
        )}
        {isEditing ? (
          <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
            <input 
              autoFocus
              className="bg-white border-b border-cinnabar text-sm font-serif italic focus:outline-none flex-1 px-1 min-w-0"
              value={label}
              onChange={(e) => onLabelChange?.(e.target.value)}
              onBlur={() => onStopEdit?.()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  onStopEdit?.();
                }
              }}
            />
            {onRemove && (
              <button 
                onMouseDown={(e) => {
                   e.preventDefault(); 
                   e.stopPropagation();
                   onRemove();
                }}
                className="p-1 text-cinnabar hover:bg-cinnabar/10 rounded transition-colors shrink-0"
                title="Xóa tab"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ) : (
          <span className="text-sm font-serif tracking-wide truncate">{label}</span>
        )}
      </div>
      
      {!isEditing && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
          className={`ml-auto p-1 hover:text-cinnabar transition-opacity ${active ? 'opacity-40 hover:opacity-100' : 'opacity-0 group-hover:opacity-40'}`}
          title="Nhấn để sửa tên mục"
        >
          <PenTool size={12} />
        </button>
      )}
      {active && !isEditing && <ChevronRight size={16} className="ml-1 opacity-20" />}
    </div>
  );
}

function StatCard({ 
  id, 
  iconUrl, 
  defaultIcon, 
  onIconUpload, 
  label, 
  value, 
  subtext,
  hideIcon = false,
  compact = false
}: { 
  id: string, 
  iconUrl?: string, 
  defaultIcon?: React.ReactNode, 
  onIconUpload?: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void, 
  label: string, 
  value: string | number, 
  subtext: string,
  hideIcon?: boolean,
  compact?: boolean
}) {
  return (
    <div className={`bg-white border border-gold shadow-sm group hover:shadow-md transition-all relative overflow-hidden ${compact ? 'p-2 sm:p-3 rounded-xl h-full flex flex-col justify-center' : 'p-5 rounded-2xl'}`}>
      {!hideIcon && (
        <div className={`flex items-center gap-3 ${compact ? 'mb-2' : 'mb-4'}`}>
          <label className="cursor-pointer relative group-hover:bg-sand transition-colors p-2 bg-parchment rounded-lg">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onIconUpload?.(id, e)} />
            {iconUrl ? (
              <img src={iconUrl} alt={label} className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} object-cover rounded shadow-sm`} />
            ) : (
              defaultIcon
            )}
            <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg text-white">
               <Camera size={compact ? 8 : 12} />
            </div>
          </label>
          <span className={`${compact ? 'text-[6px] sm:text-[8px]' : 'text-[10px]'} font-bold uppercase text-ink opacity-40 tracking-widest`}>{label}</span>
        </div>
      )}
      {hideIcon && <span className={`block font-black uppercase text-cinnabar/60 tracking-[0.2em] ${compact ? 'text-[6px] sm:text-[8px] mb-1' : 'text-[8px] mb-2'}`}>{label}</span>}
      <div className={`${hideIcon ? (compact ? 'text-sm sm:text-lg' : 'text-xl') : (compact ? 'text-lg sm:text-xl' : 'text-2xl')} font-display font-bold text-ink mb-1 truncate`}>{value}</div>
      <p className={`${compact ? 'text-[6px] sm:text-[8px]' : 'text-[10px]'} text-wood opacity-70 italic font-serif leading-tight line-clamp-2`}>{subtext}</p>
    </div>
  );
}
