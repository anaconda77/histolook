import React, { createContext, useContext, useRef, useCallback } from 'react';
import { ArchiveDetail } from '../services/archive.api';

interface CachedArchive {
  data: ArchiveDetail;
  timestamp: number;
}

interface ArchiveCacheContextType {
  getCache: (archiveId: string) => ArchiveDetail | null;
  setCache: (archiveId: string, data: ArchiveDetail) => void;
  clearCache: () => void;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10분

const ArchiveCacheContext = createContext<ArchiveCacheContextType | undefined>(undefined);

export function ArchiveCacheProvider({ children }: { children: React.ReactNode }) {
  // useRef를 사용하여 리렌더링 시에도 캐시 유지
  const cacheRef = useRef<Map<string, CachedArchive>>(new Map());

  const getCache = useCallback((archiveId: string): ArchiveDetail | null => {
    const cached = cacheRef.current.get(archiveId);
    
    if (!cached) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - cached.timestamp > CACHE_DURATION;

    if (isExpired) {
      cacheRef.current.delete(archiveId);
      return null;
    }

    const elapsedMinutes = Math.floor((now - cached.timestamp) / 60000);
    return cached.data;
  }, []);

  const setCacheData = useCallback((archiveId: string, data: ArchiveDetail) => {
    cacheRef.current.set(archiveId, {
      data,
      timestamp: Date.now(),
    });
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return (
    <ArchiveCacheContext.Provider value={{ getCache, setCache: setCacheData, clearCache }}>
      {children}
    </ArchiveCacheContext.Provider>
  );
}

export function useArchiveCache() {
  const context = useContext(ArchiveCacheContext);
  if (context === undefined) {
    throw new Error('useArchiveCache must be used within ArchiveCacheProvider');
  }
  return context;
}

