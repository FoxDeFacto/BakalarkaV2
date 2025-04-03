// src/components/consultations/ConsultationForm.tsx
'use client';

import { useState } from 'react';
import { Consultation } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

interface ConsultationFormProps {
  projectId: number;
  initialData?: Partial<Consultation>;
  onSubmit: (data: Partial<Consultation>) => Promise<void>;
  isLoading?: boolean;
}

export function ConsultationForm({ projectId, initialData = {}, onSubmit, isLoading = false }: ConsultationFormProps) {
  const [formData, setFormData] = useState<Partial<Consultation>>({
    project: projectId,
    notes: '',
    consultation_date: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDThh:mm
    ...initialData,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.consultation_date) {
      newErrors.consultation_date = 'Date and time is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
            label="Datum a čas konzultace"
            name="consultation_date"
            type="datetime-local"
            value={formData.consultation_date ? formData.consultation_date.toString().slice(0, 16) : ''}
            onChange={handleInputChange}
            error={errors.consultation_date}
            fullWidth
            required
          />
        </div>

        <div>
          <Textarea
            label="Poznámky"
            name="notes"
            value={formData.notes || ''}
            onChange={handleInputChange}
            rows={4}
            fullWidth
            placeholder="Enter consultation notes, topics discussed, outcomes, etc."
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
          {initialData.id ? 'Update Consultation' : 'Schedule Consultation'}
        </Button>
      </div>
    </form>
  );
}