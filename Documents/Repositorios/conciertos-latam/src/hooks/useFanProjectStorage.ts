import { useState, useEffect } from 'react';

interface ColorBlock {
  start: number;
  end: number;
  color: string;
}

interface StoredSequence {
  projectId: string;
  songId: string;
  sectionId: string;
  sequence: ColorBlock[];
  mode: 'fixed' | 'strobe';
  timestamp: number;
}

const STORAGE_KEY_PREFIX = 'fan_project_';
const EXPIRY_DAYS = 30;

export const useFanProjectStorage = () => {
  const saveSequence = (
    projectId: string, 
    songId: string, 
    sectionId: string,
    sequence: ColorBlock[],
    mode: 'fixed' | 'strobe' = 'fixed'
  ) => {
    const key = `${STORAGE_KEY_PREFIX}${projectId}_${songId}_${sectionId}`;
    const data: StoredSequence = {
      projectId,
      songId,
      sectionId,
      sequence,
      mode,
      timestamp: Date.now(),
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving sequence to localStorage:', error);
      return false;
    }
  };

  const getSequence = (projectId: string, songId: string, sectionId: string): StoredSequence | null => {
    const key = `${STORAGE_KEY_PREFIX}${projectId}_${songId}_${sectionId}`;
    
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const data: StoredSequence = JSON.parse(stored);
      
      // Check if data is expired
      const daysSinceStored = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
      if (daysSinceStored > EXPIRY_DAYS) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error reading sequence from localStorage:', error);
      return null;
    }
  };

  const isPreloaded = (projectId: string, songId: string, sectionId: string): boolean => {
    return getSequence(projectId, songId, sectionId) !== null;
  };

  const clearOldData = () => {
    try {
      const keys = Object.keys(localStorage);
      const projectKeys = keys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));

      projectKeys.forEach(key => {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const data: StoredSequence = JSON.parse(stored);
            const daysSinceStored = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
            
            if (daysSinceStored > EXPIRY_DAYS) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Invalid data, remove it
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing old data:', error);
    }
  };

  const clearProjectData = (projectId: string) => {
    try {
      const keys = Object.keys(localStorage);
      const projectKeys = keys.filter(key => key.startsWith(`${STORAGE_KEY_PREFIX}${projectId}_`));
      projectKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing project data:', error);
    }
  };

  // Clear old data on mount
  useEffect(() => {
    clearOldData();
  }, []);

  return {
    saveSequence,
    getSequence,
    isPreloaded,
    clearOldData,
    clearProjectData,
  };
};
