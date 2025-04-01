// src/app/(dashboard)/dashboard/projects/[id]/consultations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { withAuth } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import { Project, Consultation } from '@/lib/types';
import { projectsApi, consultationsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { ConsultationForm } from '@/components/consultations/ConsultationForm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChevronLeftIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

function ConsultationsPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const { isTeacher, isAdmin } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentConsultation, setCurrentConsultation] = useState<Consultation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch project and consultations
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch project details
      const projectData = await projectsApi.getProject(projectId);
      setProject(projectData);
      
      // Fetch consultations for this project
      const consultationsResponse = await consultationsApi.getConsultations(projectId);
      
      // Sort consultations by date, most recent first
      const sortedConsultations = [...consultationsResponse.results].sort(
        (a, b) => new Date(b.consultation_date).getTime() - new Date(a.consultation_date).getTime()
      );
      
      setConsultations(sortedConsultations);
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

  const handleCreateConsultation = () => {
    setCurrentConsultation(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditConsultation = (consultation: Consultation) => {
    setCurrentConsultation(consultation);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDeleteConsultation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this consultation?')) {
      return;
    }
    
    setError(null);
    
    try {
      await consultationsApi.deleteConsultation(id);
      setSuccess('Consultation deleted successfully');
      
      // Refresh consultation list
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete consultation');
    }
  };

  const handleSubmit = async (data: Partial<Consultation>) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (isEditMode && currentConsultation) {
        await consultationsApi.updateConsultation(currentConsultation.id, data);
        setSuccess('Consultation updated successfully');
      } else {
        await consultationsApi.createConsultation(data);
        setSuccess('Consultation scheduled successfully');
      }
      
      // Close modal and refresh consultation list
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save consultation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
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
              <Button variant="primary">Back to Projects</Button>
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
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Back to Project
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900 mt-2">Consultations for {project.title}</h1>
          </div>
          
          {(isTeacher || isAdmin) && (
            <Button 
              variant="primary"
              className="inline-flex items-center"
              onClick={handleCreateConsultation}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Schedule Consultation
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
        
        {/* Consultations list */}
        {consultations.length === 0 ? (
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No consultations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isTeacher || isAdmin 
                ? 'Get started by scheduling a consultation for this project.' 
                : 'No consultations have been scheduled for this project yet.'}
            </p>
            {(isTeacher || isAdmin) && (
              <div className="mt-6">
                <Button variant="primary" onClick={handleCreateConsultation}>
                  <PlusIcon className="h-4 w-4 mr-1 inline" />
                  Schedule First Consultation
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consultations.map((consultation) => {
                    const isPast = new Date(consultation.consultation_date) < new Date();
                    
                    return (
                      <tr key={consultation.id} className={isPast ? 'bg-gray-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(consultation.consultation_date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(consultation.consultation_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {isPast && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                              Past
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{consultation.teacher_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-md break-words">
                            {consultation.notes || <span className="text-gray-500 italic">No notes</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {(isTeacher || isAdmin) && (
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="inline-flex items-center"
                                onClick={() => handleEditConsultation(consultation)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                className="inline-flex items-center"
                                onClick={() => handleDeleteConsultation(consultation.id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Consultation Form Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isEditMode ? 'Edit Consultation' : 'Schedule New Consultation'}
          size="md"
        >
          <ConsultationForm
            projectId={projectId}
            initialData={currentConsultation || {}}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(ConsultationsPage);