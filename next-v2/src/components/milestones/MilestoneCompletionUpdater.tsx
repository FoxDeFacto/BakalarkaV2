// src/components/milestones/MilestoneCompletionUpdater.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface MilestoneCompletionUpdaterProps {
  milestoneId: number;
  currentCompletion: number;
  onUpdateCompletion: (id: number, completion: number) => Promise<void>;
  disabled?: boolean;
}

export function MilestoneCompletionUpdater({
  milestoneId,
  currentCompletion = 0,
  onUpdateCompletion,
  disabled = false
}: MilestoneCompletionUpdaterProps) {
  const [completion, setCompletion] = useState(currentCompletion);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // Update internal state when props change
  useEffect(() => {
    setCompletion(currentCompletion);
    setHasPendingChanges(false);
  }, [currentCompletion]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setCompletion(newValue);
    setHasPendingChanges(newValue !== currentCompletion);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseInt(e.target.value);
    
    // Ensure value is in valid range
    if (isNaN(newValue)) {
      newValue = 0;
    } else if (newValue < 0) {
      newValue = 0;
    } else if (newValue > 100) {
      newValue = 100;
    }
    
    setCompletion(newValue);
    setHasPendingChanges(newValue !== currentCompletion);
  };

  const handleQuickSet = (value: number) => {
    setCompletion(value);
    setHasPendingChanges(value !== currentCompletion);
  };

  const handleSaveChanges = async () => {
    if (!hasPendingChanges) return;
    
    setIsUpdating(true);
    try {
      await onUpdateCompletion(milestoneId, completion);
      setHasPendingChanges(false);
    } catch (error) {
      console.error('Failed to update completion', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper function to get color based on completion percentage
  const getCompletionColor = (value: number) => {
    if (value === 100) return 'bg-green-600';
    if (value >= 75) return 'bg-green-500';
    if (value >= 50) return 'bg-orange-500';
    if (value >= 25) return 'bg-orange-400';
    if (value > 0) return 'bg-orange-300';
    return 'bg-gray-300';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Dokončení:</span>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="0"
            max="100"
            value={completion}
            onChange={handleInputChange}
            disabled={disabled}
            className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center"
          />
          <span className="text-sm text-gray-600">%</span>
        </div>
      </div>
      
      {/* Enhanced slider with better visual feedback */}
      <div className="relative pt-1">
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={completion}
          onChange={handleSliderChange}
          disabled={disabled}
          className="w-full h-2 appearance-none cursor-pointer bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          style={{
            background: `linear-gradient(to right, ${getCompletionColor(completion)} 0%, ${getCompletionColor(completion)} ${completion}%, #e5e7eb ${completion}%, #e5e7eb 100%)`
          }}
        />
        
        {/* Tick marks for the slider */}
        <div className="flex justify-between w-full px-2 mt-1">
          {[0, 25, 50, 75, 100].map((value) => (
            <div key={value} className="flex flex-col items-center">
              <div className={`h-1 w-1 rounded-full ${completion >= value ? 'bg-orange-600' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-gray-500">{value}%</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Quick set buttons */}
      <div className="flex justify-between mt-2">
        {[0, 25, 50, 75, 100].map((value) => (
          <Button
            key={value}
            variant={completion === value ? 'primary' : 'outline'}
            onClick={() => handleQuickSet(value)}
            disabled={disabled}
            className="min-w-[40px] text-xs px-2"
          >
            {value}%
          </Button>
        ))}
      </div>
      
      {/* Save button that appears when there are changes */}
      {hasPendingChanges && (
        <div className="flex justify-end mt-2">
          <Button
            variant="success"
            size="sm"
            onClick={handleSaveChanges}
            isLoading={isUpdating}
            disabled={isUpdating}
            className="min-w-[100px]"
          >
            Uložit změny
          </Button>
        </div>
      )}
    </div>
  );
}