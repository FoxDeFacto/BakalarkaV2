// src/components/evaluations/EvaluationForm.tsx
'use client';

import { useState } from 'react';
import { ProjectEvaluation } from '@/lib/types';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

interface EvaluationFormProps {
  projectId: number;
  initialData?: Partial<ProjectEvaluation>;
  onSubmit: (data: Partial<ProjectEvaluation>) => Promise<void>;
  isLoading?: boolean;
}

export function EvaluationForm({ projectId, initialData = {}, onSubmit, isLoading = false }: EvaluationFormProps) {
  const [formData, setFormData] = useState<Partial<ProjectEvaluation>>({
    project: projectId,
    evaluation: '',
    score: 0,
    ...initialData,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.evaluation?.trim()) {
      newErrors.evaluation = 'Evaluation text is required';
    }
    
    if (formData.score === undefined || formData.score === null) {
      newErrors.score = 'Score is required';
    } else if (formData.score < 0 || formData.score > 100) {
      newErrors.score = 'Score must be between 0 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'score') {
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
          <Textarea
            label="Hodnocení"
            name="evaluation"
            value={formData.evaluation || ''}
            onChange={handleInputChange}
            error={errors.evaluation}
            rows={6}
            fullWidth
            required
            placeholder="Enter your evaluation of the project..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Body ({formData.score}/100)
          </label>
          <input
            type="range"
            name="score"
            min="0"
            max="100"
            step="1"
            value={formData.score || 0}
            onChange={handleInputChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          {errors.score && <p className="mt-1 text-sm text-red-600">{errors.score}</p>}
          <div className="mt-2 flex justify-between">
            <span className="text-sm text-gray-500">0</span>
            <span className="text-sm text-gray-500">25</span>
            <span className="text-sm text-gray-500">50</span>
            <span className="text-sm text-gray-500">75</span>
            <span className="text-sm text-gray-500">100</span>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end space-x-3 border-t">
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {initialData.id ? 'Update Evaluation' : 'Submit Evaluation'}
        </Button>
      </div>
    </form>
  );
}