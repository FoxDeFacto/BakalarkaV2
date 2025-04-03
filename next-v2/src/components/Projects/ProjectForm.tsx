// src/components/projects/ProjectForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ProjectFormProps {
  initialData?: Partial<Project>;
  onSubmit: (data: Partial<Project>) => Promise<void>;
  isLoading?: boolean;
}

export function ProjectForm({ initialData = {}, onSubmit, isLoading = false }: ProjectFormProps) {
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    description: '',
    year: new Date().getFullYear(),
    field: '',
    keywords: [],
    type_of_work: 'SOČ',
    public_visibility: false,
    ...initialData,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [keywordInput, setKeywordInput] = useState('');
  
  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      setFormData({
        title: '',
        description: '',
        year: new Date().getFullYear(),
        field: '',
        keywords: [],
        type_of_work: 'SOČ',
        public_visibility: false,
        ...initialData,
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Název je povinný';
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = 'Popis je povinný';
    }
    
    if (!formData.field?.trim()) {
      newErrors.field = 'Obor je povinný';
    }
    
    if (!formData.year) {
      newErrors.year = 'Rok je povinný';
    } else if (
      typeof formData.year === 'number' && 
      (formData.year < 2000 || formData.year > new Date().getFullYear() + 1)
    ) {
      newErrors.year = `Rok musí být mezi rokem 2000 a ${new Date().getFullYear() + 1}`;
    }
    
    if (!formData.keywords || formData.keywords.length === 0) {
      newErrors.keywords = 'Alespoň jedno klíčové slovo je vyžadováno';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: target.checked }));
    } else if (name === 'year') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;
    
    const newKeywords = [...(formData.keywords || [])];
    
    if (!newKeywords.includes(keywordInput.trim())) {
      newKeywords.push(keywordInput.trim());
      setFormData((prev) => ({ ...prev, keywords: newKeywords }));
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    const newKeywords = (formData.keywords || []).filter((k) => k !== keyword);
    setFormData((prev) => ({ ...prev, keywords: newKeywords }));
  };

  const handleFileUpload = (field: string) => (filePath: string) => {
    setFormData((prev) => ({ ...prev, [field]: filePath }));
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="col-span-1 md:col-span-2">
          <Input
            label="Název"
            name="title"
            value={formData.title || ''}
            onChange={handleInputChange}
            error={errors.title}
            fullWidth
            required
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <Textarea
            label="Popis"
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            error={errors.description}
            rows={5}
            fullWidth
            required
          />
        </div>

        <div>
          <Input
            label="Rok"
            name="year"
            type="number"
            min={2000}
            max={new Date().getFullYear() + 1}
            value={formData.year?.toString() || ''}
            onChange={handleInputChange}
            error={errors.year}
            fullWidth
            required
          />
        </div>

        <div>
          <Select
            label="Druh práce"
            name="type_of_work"
            value={formData.type_of_work || 'SOČ'}
            onChange={handleInputChange}
            options={[
              { value: 'SOČ', label: 'Středoškolská odborná činnost' },
              { value: 'seminar', label: 'Seminární práce' },
              { value: 'other', label: 'Jiný typ práce' },
            ]}
            fullWidth
            required
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <Input
            label="Obor"
            name="field"
            value={formData.field || ''}
            onChange={handleInputChange}
            error={errors.field}
            fullWidth
            required
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Keywords {errors.keywords && <span className="text-red-500">({errors.keywords})</span>}
          </label>
          <div className="flex">
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
          
          {formData.keywords && formData.keywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.keywords.map((keyword) => (
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

        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center">
            <input
              id="public_visibility"
              name="public_visibility"
              type="checkbox"
              checked={formData.public_visibility || false}
              onChange={(e) => setFormData((prev) => ({ ...prev, public_visibility: e.target.checked }))}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="public_visibility" className="ml-2 block text-sm text-gray-900">
              Udělat tento projekt veřejný
            </label>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Soubory</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FileUpload
                label="Úvodní obrázek"
                type="thumbnail"
                onUploadComplete={handleFileUpload('thumbnail')}
                accept="image/jpeg,image/png,image/gif"
                currentFile={formData.thumbnail}
              />
              <p className="mt-1 text-sm text-gray-500">
                Je doporučen čtvercový obrázek (max 10MB)
              </p>
            </div>
            
            <div>
              <FileUpload
                label="Hlavní dokument"
                type="document"
                onUploadComplete={handleFileUpload('document')}
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                currentFile={formData.document}
              />
              <p className="mt-1 text-sm text-gray-500">
               Nahrát dokument ve formátu (PDF, DOC, DOCX)
              </p>
            </div>
            
            <div>
              <FileUpload
                label="Plagát"
                type="poster"
                onUploadComplete={handleFileUpload('poster')}
                accept="image/jpeg,image/png,application/pdf"
                currentFile={formData.poster}
              />
              <p className="mt-1 text-sm text-gray-500">
                Nahrát plagát
              </p>
            </div>
            
            <div>
              <FileUpload
                label="Video"
                type="video"
                onUploadComplete={handleFileUpload('video')}
                accept="video/mp4,video/webm,video/ogg"
                currentFile={formData.video}
              />
              <p className="mt-1 text-sm text-gray-500">
               Nahrát video
              </p>
            </div>
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
          {initialData.id ? 'Upravit projekt' : 'Vytvořit projekt'}
        </Button>
      </div>
    </form>
  );
}