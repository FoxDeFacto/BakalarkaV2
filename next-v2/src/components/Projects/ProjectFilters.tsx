// src/components/projects/ProjectFilters.tsx
'use client';

import { useState, useEffect } from 'react';
import { ProjectFilters as FilterTypes } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ProjectFiltersProps {
  onFilterChange: (filters: FilterTypes) => void;
  initialFilters?: FilterTypes;
}

export function ProjectFilters({ onFilterChange, initialFilters = {} }: ProjectFiltersProps) {
  const [filters, setFilters] = useState<FilterTypes>(initialFilters);
  const [keywordInput, setKeywordInput] = useState('');

  // Set initial filters state from props, but only on initial mount
  useEffect(() => {
    setFilters(initialFilters);
  }, []);  // Only run once on mount

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value || undefined };
    
    // Remove empty filters
    if (!value) {
      delete newFilters[name as keyof FilterTypes];
    }
    
    setFilters(newFilters);
  };

  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;
    
    const currentKeywords = filters.keywords || [];
    if (!currentKeywords.includes(keywordInput.trim())) {
      const newKeywords = [...currentKeywords, keywordInput.trim()];
      const newFilters = { ...filters, keywords: newKeywords };
      setFilters(newFilters);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    if (!filters.keywords) return;
    
    const newKeywords = filters.keywords.filter(k => k !== keyword);
    const newFilters = { ...filters, keywords: newKeywords.length ? newKeywords : undefined };
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    // Directly pass the current filters state
    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    setKeywordInput('');
    onFilterChange(emptyFilters);
  };

  return (
    <div className="bg-white p-4 shadow rounded-lg">
      <h3 className="text-lg font-medium mb-4">Vyhledávání</h3>
      
      <div className="space-y-4">
        <div>
          <Input
            label="Hledat"
            name="search"
            placeholder="Název, popis......"
            value={filters.search || ''}
            onChange={handleInputChange}
            fullWidth
          />
        </div>
        
        <div>
          <Select
            label="Rok"
            name="year"
            value={filters.year?.toString() || ''}
            onChange={handleInputChange}
            options={[
              { value: '', label: 'Všechny roky' },
              ...Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return { value: year.toString(), label: year.toString() };
              }),
            ]}
            fullWidth
          />
        </div>
        
        <div>
          <Select
            label="Oblast"
            name="field"
            value={filters.field || ''}
            onChange={handleInputChange}
            options={[
              { value: '', label: 'Všechny oblasti' },
              { value: 'Computer Science', label: 'Computer Science' },
              { value: 'Biology', label: 'Biology' },
              { value: 'Chemistry', label: 'Chemistry' },
              { value: 'Physics', label: 'Physics' },
              { value: 'Mathematics', label: 'Mathematics' },
              { value: 'Social Sciences', label: 'Social Sciences' },
              { value: 'Humanities', label: 'Humanities' },
              { value: 'Engineering', label: 'Engineering' },
              { value: 'Arts', label: 'Arts' },
              { value: 'Other', label: 'Other' },
            ]}
            fullWidth
          />
        </div>
        
        <div>
          <Select
            label="Stav"
            name="status"
            value={filters.status || ''}
            onChange={handleInputChange}
            options={[
              { value: '', label: 'Všechny stavy' },
              { value: 'draft', label: 'Draft' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'evaluated', label: 'Evaluated' },
              { value: 'completed', label: 'Completed' },
            ]}
            fullWidth
          />
        </div>
        
        <div>
          <Select
            label="Druh práce"
            name="type_of_work"
            value={filters.type_of_work || ''}
            onChange={handleInputChange}
            options={[
              { value: '', label: 'Všechny druhy' },
              { value: 'SOČ', label: 'Středoškolská odborná činnost' },
              { value: 'seminar', label: 'Seminární práce' },
              { value: 'other', label: 'Jiný typ práce' },
            ]}
            fullWidth
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Keywords
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="Klíčové slovo..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              className="rounded-r-none"
              fullWidth
            />
            <Button
              type="button"
              onClick={handleAddKeyword}
              className="rounded-l-none"
              disabled={!keywordInput.trim()}
            >
              Přidat
            </Button>
          </div>
          
          {filters.keywords && filters.keywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.keywords.map((keyword) => (
                <div
                  key={keyword}
                  className="bg-orange-100 text-orange-800 rounded-full px-3 py-1 text-sm flex items-center"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="ml-1.5 text-orange-600 hover:text-orange-800"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 pt-2">
          <Button
            type="button"
            variant="primary"
            onClick={handleApplyFilters}
            fullWidth
          >
            Použít
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleResetFilters}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}