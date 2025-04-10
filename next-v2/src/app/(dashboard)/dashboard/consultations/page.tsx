// src/app/(dashboard)/dashboard/consultations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { withRole } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import { Project, Consultation } from '@/lib/types';
import { consultationsApi, projectsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConsultationForm } from '@/components/consultations/ConsultationForm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay, addDays } from 'date-fns';

function ConsultationsDashboardPage() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [projects, setProjects] = useState<Record<number, Project>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Date filters
  const today = new Date();
  const [selectedDateFilter, setSelectedDateFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  useEffect(() => {
    const fetchConsultations = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);

      try {
        // Fetch all consultations
        const consultationsResponse = await consultationsApi.getConsultations();
        
        // Filter consultations based on role
        let filteredConsultations: Consultation[];
        
        if (user.role === 'admin') {
          filteredConsultations = consultationsResponse.results;
        } else if (user.role === 'teacher') {
          filteredConsultations = consultationsResponse.results.filter(c => c.teacher === user.id);
        } else {
          // For students, we'll fetch their projects and filter consultations for those projects
          // But this page should only be accessible to teachers and admins
          filteredConsultations = [];
        }
        
        setConsultations(filteredConsultations);
        
        // Fetch project details for each consultation
        const projectIds = [...new Set(filteredConsultations.map(c => c.project))];
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load consultations');
        console.error('Error fetching consultations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, [user]);

  // Filter consultations based on the selected date filter
  const filteredConsultations = consultations.filter(consultation => {
    const consultationDate = parseISO(consultation.consultation_date);
    
    if (selectedDateFilter === 'upcoming') {
      return isAfter(consultationDate, startOfDay(today));
    } else if (selectedDateFilter === 'past') {
      return isBefore(consultationDate, endOfDay(today));
    } else {
      return true; // All consultations
    }
  });

  // Group consultations by date
  const groupConsultationsByDate = () => {
    const grouped: Record<string, Consultation[]> = {};
    
    filteredConsultations.forEach(consultation => {
      const date = format(parseISO(consultation.consultation_date), 'yyyy-MM-dd');
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      
      grouped[date].push(consultation);
    });
    
    // Sort consultations within each date
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        const dateA = parseISO(a.consultation_date);
        const dateB = parseISO(b.consultation_date);
        return dateA.getTime() - dateB.getTime();
      });
    });
    
    return grouped;
  };

  const consultationsByDate = groupConsultationsByDate();
  
  // Sort dates
  const sortedDates = Object.keys(consultationsByDate).sort((a, b) => {
    const dateA = parseISO(a);
    const dateB = parseISO(b);
    
    // For upcoming, sort ascending (nearest first)
    // For past, sort descending (most recent first)
    return selectedDateFilter === 'past'
      ? dateB.getTime() - dateA.getTime()
      : dateA.getTime() - dateB.getTime();
  });

  // Handle form submission
  const handleCreateConsultation = (projectId: number) => {
    setSelectedProjectId(projectId);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: Partial<Consultation>) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await consultationsApi.createConsultation(data);
      setSuccess('Konzultace úspěšně naplánována');
      setIsModalOpen(false);
      
      // Refresh consultations list
      const consultationsResponse = await consultationsApi.getConsultations();
      setConsultations(consultationsResponse.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule consultation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to format dates
  const formatDate = (dateStr: string): string => {
    const date = parseISO(dateStr);
    
    // Check if it's today, tomorrow, or within a week
    const formattedDate = (() => {
      if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
        return 'Today';
      } else if (format(date, 'yyyy-MM-dd') === format(addDays(today, 1), 'yyyy-MM-dd')) {
        return 'Tomorrow';
      } else {
        return format(date, 'EEEE, MMMM d, yyyy');
      }
    })();
    
    return formattedDate;
  };

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Konzultace</h1>
          
          <div className="flex space-x-2">
            <Button
              variant={selectedDateFilter === 'upcoming' ? 'primary' : 'outline'}
              onClick={() => setSelectedDateFilter('upcoming')}
            >
              Nadcházející
            </Button>
            <Button
              variant={selectedDateFilter === 'past' ? 'primary' : 'outline'}
              onClick={() => setSelectedDateFilter('past')}
            >
              Minulé
            </Button>
            <Button
              variant={selectedDateFilter === 'all' ? 'primary' : 'outline'}
              onClick={() => setSelectedDateFilter('all')}
            >
              Všechny
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="danger" message={error} />
        )}
        
        {success && (
          <Alert variant="success" message={success} />
        )}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
          </div>
        ) : sortedDates.length === 0 ? (
<div className="text-center py-8 bg-white shadow rounded-lg">
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
            <h3 className="mt-2 text-lg font-medium text-gray-900">Bez konzultací</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedDateFilter === 'upcoming' 
                ? "You don't have any upcoming consultations scheduled." 
                : selectedDateFilter === 'past' 
                ? "You don't have any past consultations." 
                : "You don't have any consultations scheduled."}
            </p>
            <div className="mt-6">
              <Link href="/dashboard/assigned">
                <Button variant="primary">
                  Všechny přiřazené projekty
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map(date => (
              <div key={date}>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-gray-500" />
                  {formatDate(date)}
                </h2>
                
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {consultationsByDate[date].map(consultation => {
                      const project = projects[consultation.project];
                      const consultationTime = parseISO(consultation.consultation_date);
                      const isPast = isBefore(consultationTime, today);
                      
                      if (!project) return null;
                      
                      return (
                        <div key={consultation.id} className={`px-6 py-4 ${isPast ? 'bg-gray-50' : ''}`}>
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                            <div>
                              <div className="flex items-center">
                                <div className="text-md font-medium text-gray-900">
                                  {format(consultationTime, 'h:mm a')}
                                </div>
                                {isPast && (
                                  <Badge variant="gray" className="ml-2">Past</Badge>
                                )}
                              </div>
                              
                              <div className="mt-2">
                                <Link 
                                  href={`/dashboard/projects/${project.id}`}
                                  className="text-orange-600 hover:text-orange-800 font-medium"
                                >
                                  {project.title}
                                </Link>
                                <div className="text-sm text-gray-500 mt-1">
                                  Student: {project.student_name}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 md:mt-0 md:ml-6 md:flex-shrink-0">
                              <div className="bg-gray-100 p-3 rounded-lg max-w-md">
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Poznámky:</h4>
                                <p className="text-sm text-gray-600">
                                  {consultation.notes || <span className="italic">No notes provided</span>}
                                </p>
                              </div>
                              
                              <div className="mt-3 flex justify-end">
                                <Link 
                                  href={`/dashboard/projects/${project.id}/consultations`}
                                  className="text-sm text-orange-600 hover:text-orange-800"
                                >
                                  Zobrazit všechny konzultace
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Quick add consultation section */}
            {selectedDateFilter !== 'past' && Object.keys(projects).length > 0 && (
              <div className="bg-white shadow rounded-lg p-6 mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <PlusIcon className="h-5 w-5 mr-2 text-gray-500" />
                  Nová konzultace
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.values(projects)
                    .filter(project => ['draft', 'in_progress'].includes(project.status))
                    .map(project => (
                      <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <h3 className="font-medium text-gray-900">{project.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">Student: {project.student_name}</p>
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleCreateConsultation(project.id)}
                          >
                            Naplánovat novou konzultaci
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Consultation Form Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Naplánovat novou konzultaci"
          size="md"
        >
          {selectedProjectId && (
            <ConsultationForm
              projectId={selectedProjectId}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
            />
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default withRole(ConsultationsDashboardPage, ['teacher', 'admin']);