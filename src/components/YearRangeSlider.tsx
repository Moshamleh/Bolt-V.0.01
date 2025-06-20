import React, { useState, useEffect } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { cn } from '../lib/utils';

interface YearRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
}

const YearRangeSlider: React.FC<YearRangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  className = ''
}) => {
  const [localValue, setLocalValue] = useState<[number, number]>(value);
  const [inputMin, setInputMin] = useState<string>(value[0].toString());
  const [inputMax, setInputMax] = useState<string>(value[1].toString());

  // Update local state when props change
  useEffect(() => {
    setLocalValue(value);
    setInputMin(value[0].toString());
    setInputMax(value[1].toString());
  }, [value]);

  const handleSliderChange = (newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setLocalValue(newValue as [number, number]);
      setInputMin(newValue[0].toString());
      setInputMax(newValue[1].toString());
      onChange(newValue as [number, number]);
    }
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = e.target.value;
    setInputMin(newMin);
    
    if (newMin === '') return;
    
    const numValue = parseInt(newMin, 10);
    if (!isNaN(numValue) && numValue >= min && numValue <= localValue[1]) {
      const newValue: [number, number] = [numValue, localValue[1]];
      setLocalValue(newValue);
      onChange(newValue);
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = e.target.value;
    setInputMax(newMax);
    
    if (newMax === '') return;
    
    const numValue = parseInt(newMax, 10);
    if (!isNaN(numValue) && numValue >= localValue[0] && numValue <= max) {
      const newValue: [number, number] = [localValue[0], numValue];
      setLocalValue(newValue);
      onChange(newValue);
    }
  };

  const handleMinBlur = () => {
    if (inputMin === '' || isNaN(parseInt(inputMin, 10))) {
      setInputMin(localValue[0].toString());
      return;
    }
    
    let numValue = parseInt(inputMin, 10);
    if (numValue < min) numValue = min;
    if (numValue > localValue[1]) numValue = localValue[1];
    
    setInputMin(numValue.toString());
    const newValue: [number, number] = [numValue, localValue[1]];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleMaxBlur = () => {
    if (inputMax === '' || isNaN(parseInt(inputMax, 10))) {
      setInputMax(localValue[1].toString());
      return;
    }
    
    let numValue = parseInt(inputMax, 10);
    if (numValue > max) numValue = max;
    if (numValue < localValue[0]) numValue = localValue[0];
    
    setInputMax(numValue.toString());
    const newValue: [number, number] = [localValue[0], numValue];
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Slider
        range
        min={min}
        max={max}
        value={localValue}
        onChange={handleSliderChange}
        step={1}
        className="my-6"
        trackStyle={[{ backgroundColor: '#3b82f6' }]}
        handleStyle={[
          { 
            backgroundColor: '#3b82f6', 
            borderColor: '#3b82f6',
            boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'
          },
          { 
            backgroundColor: '#3b82f6', 
            borderColor: '#3b82f6',
            boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'
          }
        ]}
        railStyle={{ backgroundColor: '#e5e7eb' }}
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-gray-500 dark:text-gray-400 mr-2">From:</span>
          <input
            type="text"
            value={inputMin}
            onChange={handleMinInputChange}
            onBlur={handleMinBlur}
            className="w-20 px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center">
          <span className="text-gray-500 dark:text-gray-400 mr-2">To:</span>
          <input
            type="text"
            value={inputMax}
            onChange={handleMaxInputChange}
            onBlur={handleMaxBlur}
            className="w-20 px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default YearRangeSlider;