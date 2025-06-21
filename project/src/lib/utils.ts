import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1));
    }
    return file.type === type;
  });
}

// Sound effects
export function playPopSound() {
  try {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
    audio.volume = 0.2;
    audio.currentTime = 0;
    
    // Add vibration if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    return audio.play().catch(e => {
      console.log('Audio play failed:', e);
    });
  } catch (error) {
    console.error('Error playing sound:', error);
    return Promise.resolve();
  }
}

// Local storage helpers
export const hasCompletedFirstDiagnostic = (): boolean => {
  return localStorage.getItem('hasCompletedFirstDiagnostic') === 'true';
};

export const markFirstDiagnosticCompleted = (): void => {
  localStorage.setItem('hasCompletedFirstDiagnostic', 'true');
};

export const hasJoinedFirstClub = (): boolean => {
  return localStorage.getItem('hasJoinedFirstClub') === 'true';
};

export const markFirstClubJoined = (): void => {
  localStorage.setItem('hasJoinedFirstClub', 'true');
};

// Weekly recap helpers
export const getLastWeeklyRecapDate = (): Date | null => {
  const lastRecapStr = localStorage.getItem('lastWeeklyRecapDate');
  return lastRecapStr ? new Date(lastRecapStr) : null;
};

export const setLastWeeklyRecapDate = (date: Date = new Date()): void => {
  localStorage.setItem('lastWeeklyRecapDate', date.toISOString());
};

export const shouldShowWeeklyRecap = (): boolean => {
  const lastRecap = getLastWeeklyRecapDate();
  if (!lastRecap) return true;
  
  const now = new Date();
  const daysSinceLastRecap = Math.floor((now.getTime() - lastRecap.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysSinceLastRecap >= 7;
};