// src/app/(dashboard)/dashboard/projects/[id]/evaluations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { withAuth } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import { Project, ProjectEvaluation } from '@/lib/types';
import { projectsApi, evaluationsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { EvaluationForm } from '@/components/evaluations/EvaluationForm';
import { Card } from '@/components/ui/Card';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChevronLeftIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

function EvaluationsPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const { user, isTeacher, isAdmin } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [evaluations, setEvaluations] = useState<ProjectEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<ProjectEvaluation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if the project can be evaluated (submitted status or later)
  const canBeEvaluated = project && 
    ['submitted', 'evaluated', 'completed'].includes(project.status);
  
  // Check if the current teacher has already submitted an evaluation
  const hasSubmittedEvaluation = isTeacher && user && 
    evaluations.some(e => e.teacher === user.id);

  // Fetch project and evaluations
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch project details
      const projectData = await projectsApi.getProject(projectId);
      setProject(projectData);
      
      // Fetch evaluations for this project
      const evaluationsResponse = await evaluationsApi.getEvaluations(projectId);
      
      // Sort evaluations by date, most recent first
      const sortedEvaluations = [...evaluationsResponse.results].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setEvaluations(sortedEvaluations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleCreateEvaluation = () => {
    setCurrentEvaluation(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditEvaluation = (evaluation: ProjectEvaluation) => {
    setCurrentEvaluation(evaluation);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDeleteEvaluation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this evaluation?')) {
      return;
    }
    
    setError(null);
    
    try {
      await evaluationsApi.deleteEvaluation(id);
      setSuccess('Evaluation deleted successfully');
      
      // Refresh evaluation list
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete evaluation');
    }
  };

  const handleSubmit = async (data: Partial<ProjectEvaluation>) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (isEditMode && currentEvaluation) {
        await evaluationsApi.updateEvaluation(currentEvaluation.id, data);
        setSuccess('Evaluation updated successfully');
      } else {
        await evaluationsApi.createEvaluation(data);
        setSuccess('Evaluation submitted successfully');
      }
      
      // Close modal and refresh evaluation list
      setIsModalOpen(false);
      
      // If the project is in 'submitted' status, update it to 'evaluated'
      if (project && project.status === 'submitted') {
        await projectsApi.updateProject(projectId, { status: 'evaluated' });
      }
      
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save evaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAverageScore = () => {
    if (!evaluations.length) return 0;
    
    const sum = evaluations.reduce((acc, evaluation) => acc + evaluation.score, 0);
    return Math.round(sum / evaluations.length);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
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
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Link 
              href={`/dashboard/projects/${projectId}`} 
              className="inline-flex items-center text-orange-600 hover:text-orange-800"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Zpátky
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900 mt-2">Hodnocení pro {project.title}</h1>
          </div>
          
          {(isTeacher || isAdmin) && canBeEvaluated && !hasSubmittedEvaluation && (
            <Button 
              variant="primary"
              className="inline-flex items-center"
              onClick={handleCreateEvaluation}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Přidat hodnocení
            </Button>
          )}
        </div>
        
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
        
        {!canBeEvaluated && (
          <div className="mb-4">
            <Alert 
              variant="info" 
              message="This project cannot be evaluated yet. The project must be submitted before evaluations can be added." 
            />
          </div>
        )}
        
        {/* Evaluations summary */}
        {evaluations.length > 0 && (
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Shrnutí hodnocení</h2>
                <p className="text-sm text-gray-500">
                  {evaluations.length} Hodnocení odevzdáno
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="flex items-center">
                  <div className="text-2xl font-bold text-orange-600">{calculateAverageScore()}</div>
                  <div className="text-sm text-gray-500 ml-1">/100</div>
                </div>
                <p className="text-sm text-gray-500 text-center">Průměrné body</p>
              </div>
            </div>
          </Card>
        )}
        
        {/* Evaluations list */}
        {evaluations.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Bez hodnocení</h3>
            <p className="mt-1 text-sm text-gray-500">
              {canBeEvaluated 
                ? (isTeacher || isAdmin)
                  ? hasSubmittedEvaluation
                    ? 'Už jste ohodnotili tento projekt.'
                    : 'Tento projekt zatím nemá žádná hodnocení..'
                  : 'Tento projekt zatím nemá žádná hodnocení.'
                : 'Tento projekt ještě není odevzdán, aby mohl být ohodnocen'
              }
            </p>
            {canBeEvaluated && (isTeacher || isAdmin) && !hasSubmittedEvaluation && (
              <div className="mt-6">
                <Button variant="primary" onClick={handleCreateEvaluation}>
                  <PlusIcon className="h-4 w-4 mr-1 inline" />
                  Odeslat hodnocení
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {evaluations.map((evaluation) => (
              <div key={evaluation.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-orange-600 rounded-full flex items-center justify-center text-white">
                      {evaluation.teacher_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-medium text-gray-900">{evaluation.teacher_name}</h2>
                      <div className="text-sm text-gray-500">
                        {new Date(evaluation.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-2xl font-bold text-orange-600">{evaluation.score}</div>
                    <div className="text-sm text-gray-500 ml-1">/100</div>
                    
                    {/* Edit/Delete actions for the teacher who submitted the evaluation or admin */}
                    {(isAdmin || (isTeacher && user && evaluation.teacher === user.id)) && (
                      <div className="ml-4 flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center"
                          onClick={() => handleEditEvaluation(evaluation)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="inline-flex items-center"
                          onClick={() => handleDeleteEvaluation(evaluation.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 whitespace-pre-line">{evaluation.evaluation}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Evaluation Form Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isEditMode ? 'Upravit hodnocení' : 'Odeslat hodnocení'}
          size="md"
        >
          <EvaluationForm
            projectId={projectId}
            initialData={currentEvaluation || {}}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(EvaluationsPage);