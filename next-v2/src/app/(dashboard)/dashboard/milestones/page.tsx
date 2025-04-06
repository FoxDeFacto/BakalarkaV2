// src/app/(dashboard)/dashboard/milestones/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { withAuth } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import { Milestone, Project } from '@/lib/types';
import { milestonesApi, projectsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { MilestoneCompletionUpdater } from '@/components/milestones/MilestoneCompletionUpdater';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  ClockIcon, 
  ExclamationCircleIcon, 
  CheckCircleIcon, 
  ArrowPathIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

// Helper functions
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

const isOverdue = (status: string, deadline: Date) => {
  return status !== 'completed' && deadline < new Date();
};

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

const getStatusBadgeColor = (status: string, deadline: string): 'gray' | 'blue' | 'green' | 'red' | 'yellow' => {
  const milestoneIsOverdue = isOverdue(status, new Date(deadline));
  
  if (milestoneIsOverdue) return 'red';
  
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

function MilestonesDashboard() {
  const { user, isTeacher, isAdmin } = useAuth();
  
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Record<number, Project>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<number | 'all'>('all');
  
  // Fetch all milestones for projects the user has access to
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all milestones without project filtering first
        const milestonesResponse = await milestonesApi.getMilestones();
        
        // Get unique project IDs from milestones
        const projectIds = [...new Set(milestonesResponse.results.map(m => m.project))];
        
        // Fetch project details for each project
        const projectsData: Record<number, Project> = {};
        
        for (const id of projectIds) {
          try {
            const project = await projectsApi.getProject(id);
            projectsData[id] = project;
          } catch (err) {
            console.error(`Error fetching project ${id}:`, err);
          }
        }
        
        setProjects(projectsData);
        setMilestones(milestonesResponse.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load milestones');
        console.error('Error fetching milestones:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleUpdateCompletion = async (id: number, completion: number) => {
    setError(null);
    
    try {
      await milestonesApi.updateCompletion(id, completion);
      setSuccess('Průběh úspěšně aktualizován');
      
      // Update the milestone in the state
      setMilestones(milestones.map(milestone => 
        milestone.id === id 
          ? { 
              ...milestone, 
              completion, 
              status: completion === 100 ? 'completed' : completion > 0 ? 'in_progress' : milestone.status 
            } 
          : milestone
      ));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se aktualizovat průběh');
    }
  };

  // Filter milestones
  const filteredMilestones = milestones.filter(milestone => {
    // Filter by status
    if (statusFilter !== 'all' && milestone.status !== statusFilter) {
      return false;
    }
    
    // Filter by project
    if (projectFilter !== 'all' && milestone.project !== projectFilter) {
      return false;
    }
    
    return true;
  });

  // Sort milestones by deadline, then by status
  const sortedMilestones = [...filteredMilestones].sort((a, b) => {
    // Sort by status priority: overdue first, then in_progress, then not_started, then completed
    const statusPriority = (status: string, deadline: Date): number => {
      if (status === 'overdue' || (isOverdue(status, deadline))) return 0;
      if (status === 'in_progress') return 1;
      if (status === 'not_started') return 2;
      return 3; // completed
    };
    
    const statusA = statusPriority(a.status, new Date(a.deadline));
    const statusB = statusPriority(b.status, new Date(b.deadline));
    
    if (statusA !== statusB) {
      return statusA - statusB;
    }
    
    // If same status, sort by deadline (earlier first)
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  // Group milestones by status for summary
  const milestonesByStatus = {
    overdue: milestones.filter(m => isOverdue(m.status, new Date(m.deadline)) && m.status !== 'completed').length,
    not_started: milestones.filter(m => m.status === 'not_started' && !isOverdue(m.status, new Date(m.deadline))).length,
    in_progress: milestones.filter(m => m.status === 'in_progress' && !isOverdue(m.status, new Date(m.deadline))).length,
    completed: milestones.filter(m => m.status === 'completed').length
  };

  // Unique list of projects for filter
  const projectOptions = Object.entries(projects).map(([id, project]) => ({
    id: Number(id),
    title: project.title
  }));

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Milníky</h1>
        
        {error && (
          <Alert variant="danger" message={error} />
        )}
        
        {success && (
          <Alert variant="success" message={success} />
        )}
        
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-red-50 border-red-100">
            <div className="p-4 flex items-center">
              <div className="rounded-full bg-red-100 p-3 mr-4">
                <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium">Po termínu</p>
                <p className="text-2xl font-bold text-red-800">{milestonesByStatus.overdue}</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-blue-50 border-blue-100">
            <div className="p-4 flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <ArrowPathIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">V průběhu</p>
                <p className="text-2xl font-bold text-blue-800">{milestonesByStatus.in_progress}</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gray-50 border-gray-100">
            <div className="p-4 flex items-center">
              <div className="rounded-full bg-gray-100 p-3 mr-4">
                <ClockIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Nezačaté</p>
                <p className="text-2xl font-bold text-gray-800">{milestonesByStatus.not_started}</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-green-50 border-green-100">
            <div className="p-4 flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Dokončené</p>
                <p className="text-2xl font-bold text-green-800">{milestonesByStatus.completed}</p>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Filters */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Stav:
                </label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">Všechny stavy</option>
                  <option value="not_started">Nezačaté</option>
                  <option value="in_progress">V průběhu</option>
                  <option value="completed">Dokončené</option>
                  <option value="overdue">Po termínu</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="projectFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Projekt:
                </label>
                <select
                  id="projectFilter"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">Všechny projekty</option>
                  {projectOptions.map(project => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="ml-auto">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStatusFilter('all');
                    setProjectFilter('all');
                  }}
                  className="h-9"
                >
                  Resetovat filtry
                </Button>
              </div>
            </div>
          </div>
        </Card>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
          </div>
        ) : sortedMilestones.length === 0 ? (
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
            <h3 className="mt-2 text-lg font-medium text-gray-900">Žádné milníky</h3>
            <p className="mt-1 text-sm text-gray-500">
              {statusFilter !== 'all' || projectFilter !== 'all'
                ? 'Pro zvolený filtr nebyly nalezeny žádné milníky. Zkuste změnit filtr.'
                : isTeacher || isAdmin
                  ? 'Nemáte přiřazené žádné milníky. Vytvořte milníky pro své projekty.'
                  : 'Nemáte přiřazené žádné milníky.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedMilestones.map((milestone) => {
              const project = projects[milestone.project];
              if (!project) return null;
              
              const milestoneIsOverdue = isOverdue(milestone.status, new Date(milestone.deadline));
              const displayStatus = milestoneIsOverdue && milestone.status !== 'overdue' ? 'overdue' : milestone.status;
              const daysMessage = getDaysMessage(milestone.deadline);
              
              return (
                <Card key={milestone.id}>
                  <div className="p-6">
                    {/* Project info and milestone header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                      <div>
                        <Link 
                          href={`/dashboard/projects/${project.id}`}
                          className="text-sm text-orange-600 hover:text-orange-800"
                        >
                          {project.title}
                        </Link>
                        <h2 className="text-lg font-semibold text-gray-900 mt-1">{milestone.title}</h2>
                      </div>
                      
                      <div className="mt-2 md:mt-0 flex flex-wrap gap-2">
                        <Badge variant={getStatusBadgeColor(displayStatus, milestone.deadline)}>
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
                    
                    {/* Milestone description */}
                    <div className="mb-6">
                      <p className="text-gray-700">{milestone.description}</p>
                    </div>
                    
                    {/* Completion progress */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <h3 className="text-md font-medium text-gray-900 mb-3">Průběh dokončení</h3>
                      
                      <MilestoneCompletionUpdater
                        milestoneId={milestone.id}
                        currentCompletion={milestone.completion || 0}
                        onUpdateCompletion={handleUpdateCompletion}
                        // Only allow updating if current user is teacher for this project or owner
                        disabled={false} // Logic for checking if can edit goes here
                      />
                      
                      {/* Show complete badge when milestone is completed */}
                      {milestone.status === 'completed' && (
                        <div className="mt-4 flex items-center text-green-600">
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          <span className="font-medium">Dokončený milník</span>
                        </div>
                      )}
                      
                      {/* Show alert for overdue milestones */}
                      {milestoneIsOverdue && milestone.status !== 'completed' && (
                        <div className="mt-4 flex items-center text-red-600">
                          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                          <span className="font-medium">Termín uplynul. Aktualizujte průběh nebo požádejte o prodloužení.</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="mt-4 flex justify-end">
                      <Link href={`/dashboard/projects/${project.id}/milestones`}>
                        <Button variant="outline">
                          Zobrazit všechny milníky projektu
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default withAuth(MilestonesDashboard);