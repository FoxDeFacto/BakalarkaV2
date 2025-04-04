// src/app/(dashboard)/dashboard/projects/[id]/milestones/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { withAuth } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import { Project, Milestone, MilestoneStatus } from '@/lib/types';
import { projectsApi, milestonesApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { MilestoneForm } from '@/components/milestones/Milestone';
import { MilestoneCompletionUpdater } from '@/components/milestones/MilestoneCompletionUpdater';
import { Badge } from '@/components/ui/Badge';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChevronLeftIcon, PlusIcon, PencilIcon, TrashIcon, CheckIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';

function MilestonesPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const { user, isTeacher, isAdmin, isStudent } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if current user is owner of the project
  const isProjectOwner = user && project && project.student === user.id;

  // Fetch project and milestones
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch project details
      const projectData = await projectsApi.getProject(projectId);
      setProject(projectData);
      
      // Fetch milestones for this project
      const milestonesResponse = await milestonesApi.getMilestones(projectId);
      
      // Sort milestones by deadline
      const sortedMilestones = [...milestonesResponse.results].sort(
        (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );
      
      setMilestones(sortedMilestones);
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

  const handleCreateMilestone = () => {
    setCurrentMilestone(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setCurrentMilestone(milestone);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDeleteMilestone = async (id: number) => {
    if (!confirm('Are you sure you want to delete this milestone?')) {
      return;
    }
    
    setError(null);
    
    try {
      await milestonesApi.deleteMilestone(id);
      setSuccess('Milestone deleted successfully');
      
      // Refresh milestone list
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete milestone');
    }
  };

  const handleUpdateCompletion = async (id: number, completion: number) => {
    setError(null);
    
    try {
      await milestonesApi.updateCompletion(id, completion);
      setSuccess('Progress updated successfully');
      
      // Refresh milestone list
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update completion');
    }
  };

  const handleSubmit = async (data: Partial<Milestone>) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (isEditMode && currentMilestone) {
        await milestonesApi.updateMilestone(currentMilestone.id, data);
        setSuccess('Milestone updated successfully');
      } else {
        await milestonesApi.createMilestone(data);
        setSuccess('Milestone created successfully');
      }
      
      // Close modal and refresh milestone list
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save milestone');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get badge color based on status
  const getStatusBadgeColor = (status: MilestoneStatus): 'gray' | 'blue' | 'green' | 'red' | 'yellow' => {
    switch (status) {
      case 'not_started':
        return 'gray';
      case 'in_progress':
        return 'blue';
      case 'completed':
        return 'green';
      case 'overdue':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Function to check if a milestone is overdue
  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  // Function to calculate days left or days overdue
  const getDaysMessage = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'den' : diffDays < 5 ? 'dny' : 'dní'} zbývá`;
    } else if (diffDays < 0) {
      const absDiffDays = Math.abs(diffDays);
      return `${absDiffDays} ${absDiffDays === 1 ? 'den' : absDiffDays < 5 ? 'dny' : 'dní'} po termínu`;
    } else {
      return 'Dnes je termín';
    }
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
              <Button variant="primary">Zpět na projekty</Button>
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
            <h1 className="text-2xl font-semibold text-gray-900 mt-2">Milníky pro {project.title}</h1>
          </div>
          
          {(isTeacher || isAdmin) && (
            <Button 
              variant="primary"
              className="inline-flex items-center"
              onClick={handleCreateMilestone}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Přidat milník
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
        
        {/* Milestones list */}
        {milestones.length === 0 ? (
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Bez milníků</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isTeacher || isAdmin 
                ? 'Začněte vytvořením prvního milníku pro tento projekt.' 
                : 'Pro tento projekt zatím nebyly vytvořeny žádné milníky.'}
            </p>
            {(isTeacher || isAdmin) && (
              <div className="mt-6">
                <Button variant="primary" onClick={handleCreateMilestone}>
                  <PlusIcon className="h-4 w-4 mr-1 inline" />
                  Vytvořit první milník
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {milestones.map((milestone) => {
              const milestoneIsOverdue = isOverdue(milestone.deadline) && milestone.status !== 'completed';
              const displayStatus = milestoneIsOverdue && milestone.status !== 'overdue' ? 'overdue' : milestone.status;
              const daysMessage = getDaysMessage(milestone.deadline);
              
              return (
                <div key={milestone.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">{milestone.title}</h2>
                      <div className="mt-1 flex items-center flex-wrap gap-2">
                        <Badge variant={getStatusBadgeColor(displayStatus as MilestoneStatus)}>
                          {milestoneIsOverdue && milestone.status !== 'overdue' ? 'Po termínu' : milestone.status_display}
                        </Badge>
                        
                        <div className="flex items-center text-sm">
                          <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" />
                          <span className="text-gray-600">{formatDate(milestone.deadline)}</span>
                        </div>
                        
                        <div className={`flex items-center text-sm ${milestoneIsOverdue ? 'text-red-600' : 'text-blue-600'}`}>
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span>{daysMessage}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {(isTeacher || isAdmin) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="inline-flex items-center"
                            onClick={() => handleEditMilestone(milestone)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="inline-flex items-center"
                            onClick={() => handleDeleteMilestone(milestone.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-6">
                      <p className="text-gray-700">{milestone.description}</p>
                    </div>
                    
                    <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <h3 className="text-md font-medium text-gray-900 mb-3">Průběh dokončení</h3>
                      
                      {/* Use new MilestoneCompletionUpdater component */}
                      <MilestoneCompletionUpdater
                        milestoneId={milestone.id}
                        currentCompletion={milestone.completion || 0}
                        onUpdateCompletion={handleUpdateCompletion}
                        disabled={!(isTeacher || isAdmin || isProjectOwner)}
                      />
                      
                      {/* Show complete badge when milestone is completed */}
                      {milestone.status === 'completed' && (
                        <div className="mt-4 flex items-center text-green-600">
                          <CheckIcon className="h-5 w-5 mr-2" />
                          <span className="font-medium">Dokončený milník</span>
                        </div>
                      )}
                      
                      {/* Show alert for overdue milestones */}
                      {milestoneIsOverdue && milestone.status !== 'completed' && (
                        <div className="mt-4 flex items-center text-red-600">
                          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="font-medium">Termín uplynul. Aktualizujte průběh nebo požádejte o prodloužení.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Milestone Form Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isEditMode ? 'Upravit milník' : 'Vytvořit nový milník'}
          size="md"
        >
          <MilestoneForm
            projectId={projectId}
            initialData={currentMilestone || {}}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(MilestonesPage);