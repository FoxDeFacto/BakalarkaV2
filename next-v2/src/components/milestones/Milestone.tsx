// src/components/milestones/MilestoneForm.tsx
'use client';

import { useState } from 'react';
import { Milestone } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

interface MilestoneFormProps {
  projectId: number;
  initialData?: Partial<Milestone>;
  onSubmit: (data: Partial<Milestone>) => Promise<void>;
  isLoading?: boolean;
}

export function MilestoneForm({ projectId, initialData = {}, onSubmit, isLoading = false }: MilestoneFormProps) {
  const [formData, setFormData] = useState<Partial<Milestone>>({
    project: projectId,
    title: '',
    description: '',
    completion: 0,
    deadline: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDThh:mm
    status: 'not_started',
    ...initialData,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'completion') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <Input
            label="Název milníku"
            name="title"
            value={formData.title || ''}
            onChange={handleInputChange}
            error={errors.title}
            fullWidth
            required
          />
        </div>

        <div>
          <Textarea
            label="Popis"
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            error={errors.description}
            rows={3}
            fullWidth
            required
          />
        </div>

        <div>
          <Input
            label="Lhůta"
            name="deadline"
            type="datetime-local"
            value={formData.deadline ? formData.deadline.toString().slice(0, 16) : ''}
            onChange={handleInputChange}
            error={errors.deadline}
            fullWidth
            required
          />
        </div>

        <div>
          <Select
            label="Stav"
            name="status"
            value={formData.status || 'not_started'}
            onChange={handleInputChange}
            options={[
              { value: 'not_started', label: 'Nezačal' },
              { value: 'in_progress', label: 'Rozpracováno' },
              { value: 'completed', label: 'Dokočeno' },
              { value: 'overdue', label: 'Přetahuje' },
            ]}
            fullWidth
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dokončení ({formData.completion || 0}%)
          </label>
          <input
            type="range"
            name="completion"
            min="0"
            max="100"
            step="5"
            value={formData.completion || 0}
            onChange={handleInputChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end space-x-3 border-t">
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {initialData.id ? 'Update Milestone' : 'Create Milestone'}
        </Button>
      </div>
    </form>
  );
}