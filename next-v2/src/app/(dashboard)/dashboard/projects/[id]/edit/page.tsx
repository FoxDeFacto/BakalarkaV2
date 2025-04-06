// src/app/(dashboard)/dashboard/projects/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { withAuth } from '@/lib/auth';
import { Project } from '@/lib/types';
import { projectsApi } from '@/lib/api';
import { ProjectForm } from '@/components/Projects/ProjectForm';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

function EditProjectPage() {
  const { id } = useParams();
  const projectId = Number(id);
  //const router = useRouter();
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await projectsApi.getProject(projectId);
        setProject(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
        console.error('Error fetching project:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId]);

  const handleSubmit = async (projectData: Partial<Project>) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await projectsApi.updateProject(projectId, projectData);
      setSuccess('Projekt úspěšně upraven!');
      
      // Refresh project data
      const updatedProject = await projectsApi.getProject(projectId);
      setProject(updatedProject);
      
      setIsSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !project) {
    return (
      <DashboardLayout>
        <div className="py-8">
          <Alert variant="danger" title="Error" message={error || 'Project not found'} />
          <div className="mt-4">
            <Link href="/dashboard/projects">
              <Button variant="primary">Zpátky</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6">
          <Link 
            href={`/dashboard/projects/${projectId}`} 
            className="inline-flex items-center text-orange-600 hover:text-orange-800"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Zpátky
          </Link>
        </div>
        
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Upravit projekt</h1>
        
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
          {project && (
            <ProjectForm 
              initialData={project} 
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(EditProjectPage);