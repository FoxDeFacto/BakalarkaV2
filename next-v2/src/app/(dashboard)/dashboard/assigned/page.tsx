// src/app/(dashboard)/dashboard/assigned/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { withRole } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import { Project, ProjectTeacher } from '@/lib/types';
import { projectsApi, projectTeachersApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import DashboardLayout from '@/components/layout/DashboardLayout';

function AssignedProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<ProjectTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignedProjects = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);

      try {
        // First, get all teacher assignments
        const assignmentsResponse = await projectTeachersApi.getProjectTeachers();
        const teacherAssignments = assignmentsResponse.results.filter(
          assignment => assignment.teacher === user.id
        );
        setAssignments(teacherAssignments);
        
        // Then, fetch details for each project
        const projectIds = teacherAssignments.map(a => a.project);
        const uniqueProjectIds = [...new Set(projectIds)];
        
        const projectsData: Project[] = [];
        for (const id of uniqueProjectIds) {
          try {
            const project = await projectsApi.getProject(id);
            projectsData.push(project);
          } catch (err) {
            console.error(`Error fetching project ${id}:`, err);
          }
        }
        
        setProjects(projectsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assigned projects');
        console.error('Error fetching assignments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedProjects();
  }, [user]);

  const handleAcceptAssignment = async (assignmentId: number) => {
    setError(null);
    
    try {
      await projectTeachersApi.acceptAssignment(assignmentId);
      setSuccess('Assignment accepted successfully');
      
      // Update the local state
      setAssignments(prev => prev.map(a => 
        a.id === assignmentId ? { ...a, accepted: true } : a
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept assignment');
    }
  };

  // Group projects by role
  const projectsByRole: Record<string, Project[]> = {
    supervisor: [],
    consultant: [],
    opponent: [],
  };

  // Populate the groups
  projects.forEach(project => {
    const projectAssignments = assignments.filter(a => a.project === project.id);
    
    projectAssignments.forEach(assignment => {
      if (projectsByRole[assignment.role]) {
        // Avoid duplicates
        if (!projectsByRole[assignment.role].some(p => p.id === project.id)) {
          projectsByRole[assignment.role].push(project);
        }
      }
    });
  });

  // Define display order and labels for roles
  const roleDisplayOrder = [
    { key: 'supervisor', display: 'Supervisor' },
    { key: 'consultant', display: 'Consultant' },
    { key: 'opponent', display: 'Opponent' },
  ];

  // Helper function to get badge color based on status
  const getStatusBadgeColor = (status: string): 'gray' | 'blue' | 'green' | 'red' | 'yellow' => {
    switch (status) {
      case 'draft':
        return 'gray';
      case 'in_progress':
        return 'blue';
      case 'submitted':
        return 'yellow';
      case 'evaluated':
        return 'blue';
      case 'completed':
        return 'green';
      default:
        return 'gray';
    }
  };

  // Helper to get the assignment for a project and role
  const getAssignment = (projectId: number, role: string): ProjectTeacher | undefined => {
    return assignments.find(a => a.project === projectId && a.role === role);
  };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Přiřazený projekty</h1>
        
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
        ) : projects.length === 0 ? (
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
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Bez přiřezených projektů</h3>
            <p className="mt-1 text-sm text-gray-500">
              Zatím nemáte přiřezené žádné projekty.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {roleDisplayOrder.map(({ key, display }) => (
              projectsByRole[key] && projectsByRole[key].length > 0 && (
                <div key={key}>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Projekty jako {display}</h2>
                  <div className="overflow-x-auto bg-white shadow rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Název
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stav
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Druh přiřazení
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Akce
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {projectsByRole[key].map((project) => {
                          const assignment = getAssignment(project.id, key);
                          
                          return (
                            <tr key={`${project.id}-${key}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                  {project.title}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{project.student_name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={getStatusBadgeColor(project.status)}>
                                  {project.status_display}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {assignment ? (
                                  assignment.accepted ? (
                                    <Badge variant="green">Přijato</Badge>
                                  ) : (
                                    <Badge variant="yellow">Čeká</Badge>
                                  )
                                ) : (
                                  <Badge variant="gray">Neznámé</Badge>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <Link href={`/dashboard/projects/${project.id}`}>
                                    <Button variant="outline" size="sm">
                                      Zobrazit
                                    </Button>
                                  </Link>
                                  
                                  {assignment && !assignment.accepted && (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleAcceptAssignment(assignment.id)}
                                    >
                                      Příjmout
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default withRole(AssignedProjectsPage, ['teacher', 'admin']);