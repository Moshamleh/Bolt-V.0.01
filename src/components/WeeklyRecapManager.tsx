import React, { useState, useEffect } from 'react';
import WeeklyRecapModal from './WeeklyRecapModal';

const RECAP_INTERVAL_DAYS = 7;
const STORAGE_KEY = 'bolt_weekly_recap';

interface RecapStorage {
  lastShownDate: string;
  nextShowDate: string;
}

const WeeklyRecapManager: React.FC = () => {
  const [showRecap, setShowRecap] = useState(false);

  useEffect(() => {
    const checkIfShouldShowRecap = () => {
      // Get stored data
      const storedData = localStorage.getItem(STORAGE_KEY);
      const today = new Date();
      
      if (!storedData) {
        // First time user, set next show date to 7 days from now
        const nextShowDate = new Date();
        nextShowDate.setDate(today.getDate() + RECAP_INTERVAL_DAYS);
        
        const recapData: RecapStorage = {
          lastShownDate: today.toISOString(),
          nextShowDate: nextShowDate.toISOString()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recapData));
        return false;
      }
      
      // Parse stored data
      const recapData: RecapStorage = JSON.parse(storedData);
      const nextShowDate = new Date(recapData.nextShowDate);
      
      // Check if it's time to show the recap
      if (today >= nextShowDate) {
        // Update for next time
        const newNextShowDate = new Date();
        newNextShowDate.setDate(today.getDate() + RECAP_INTERVAL_DAYS);
        
        const updatedRecapData: RecapStorage = {
          lastShownDate: today.toISOString(),
          nextShowDate: newNextShowDate.toISOString()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecapData));
        return true;
      }
      
      return false;
    };
    
    // Check if we should show the recap
    const shouldShow = checkIfShouldShowRecap();
    
    // For development/testing purposes, you can force it to show
    // const shouldShow = true;
    
    if (shouldShow) {
      // Delay showing the modal slightly for better UX
      const timer = setTimeout(() => {
        setShowRecap(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseRecap = () => {
    setShowRecap(false);
  };

  return (
    <WeeklyRecapModal isOpen={showRecap} onClose={handleCloseRecap} />
  );
};

export default WeeklyRecapManager;