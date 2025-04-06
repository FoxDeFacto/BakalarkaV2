// src/app/(dashboard)/dashboard/create-project/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { withRole } from '@/lib/auth';
import { Project } from '@/lib/types';
import { projectsApi } from '@/lib/api';
import { ProjectForm } from '@/components/Projects/ProjectForm';
import { Alert } from '@/components/ui/Alert';
import DashboardLayout from '@/components/layout/DashboardLayout';

function CreateProjectPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
  
    const handleSubmit = async (projectData: Partial<Project>) => {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
  
      try {
        await projectsApi.createProject(projectData);
        setSuccess('Projekt úspěšně založen!');
        
        // Redirect to the project page after a short delay
        setTimeout(() => {
          router.push(`/dashboard/my-projects`);
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create project. Please try again.');
        setIsSubmitting(false);
      }
    };
  
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Vytvořit nový projekt</h1>
          
          {error && (
            <div className="mb-4">
              <Alert variant="danger" message={error} />
            </div>
          )}
          
          {success && (
            <div className="mb-4">
              <Alert variant="success" message={success} />
            </div>
          )}
          
          <div className="bg-white shadow rounded-lg p-6">
            <ProjectForm onSubmit={handleSubmit} isLoading={isSubmitting} />
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  export default withRole(CreateProjectPage, ['student']);
  