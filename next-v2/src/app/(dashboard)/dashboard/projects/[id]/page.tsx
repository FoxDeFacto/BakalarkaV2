// src/app/(dashboard)/dashboard/projects/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { withAuth } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import { Project, User, TeacherRole } from '@/lib/types';
import { projectsApi, projectTeachersApi, usersApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChevronLeftIcon, PencilIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const router = useRouter();
  const { user, isStudent, isTeacher, isAdmin } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Teacher assignment state
  const [isAssignTeacherModalOpen, setIsAssignTeacherModalOpen] = useState(false);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<TeacherRole>('supervisor');
  const [assigningTeacher, setAssigningTeacher] = useState(false);
  
  // Project actions state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProject = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await projectsApi.getProject(projectId);
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);
  
  // Fetch teachers for assignment modal
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await usersApi.getUsers('teacher');
        setTeachers(response.results);
      } catch (err) {
        console.error('Error fetching teachers:', err);
      }
    };
    
    if (isAssignTeacherModalOpen) {
      fetchTeachers();
    }
  }, [isAssignTeacherModalOpen]);

  const handleAssignTeacher = async () => {
    if (!selectedTeacher) return;
    
    setAssigningTeacher(true);
    setError(null);
    
    try {
      await projectTeachersApi.assignTeacher({
        project: projectId,
        teacher: selectedTeacher,
        role: selectedRole,
      });
      
      // Refresh project data
      await fetchProject();
      setIsAssignTeacherModalOpen(false);
      setSuccess('Teacher assigned successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign teacher');
    } finally {
      setAssigningTeacher(false);
    }
  };

  const handleRemoveTeacher = async (teacherId: number) => {
    if (!confirm('Are you sure you want to remove this teacher from the project?')) {
      return;
    }
    
    setError(null);
    
    try {
      await projectTeachersApi.removeTeacher(teacherId);
      
      // Refresh project data
      await fetchProject();
      setSuccess('Teacher removed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove teacher');
    }
  };

  const handleAcceptAssignment = async (teacherId: number) => {
    setError(null);
    
    try {
      await projectTeachersApi.acceptAssignment(teacherId);
      
      // Refresh project data
      await fetchProject();
      setSuccess('Assignment accepted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept assignment');
    }
  };

  const handleSubmitProject = async () => {
    if (!confirm('Are you sure you want to submit this project? This action cannot be undone.')) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await projectsApi.submitProject(projectId);
      
      // Refresh project data
      await fetchProject();
      setSuccess('Project submitted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await projectsApi.deleteProject(projectId);
      setSuccess('Project deleted successfully');
      
      // Redirect to projects page after a short delay
      setTimeout(() => {
        router.push('/dashboard/projects');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      setIsSubmitting(false);
    }
  };

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
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

  // Check if current user is the owner of the project
  const isOwner = isStudent && user?.id === project.student;
  
  // Check if current user is a teacher assigned to the project
  const isAssignedTeacher = isTeacher && project.teachers?.some(t => t.teacher === user?.id);

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6 flex justify-between items-center">
          <Link 
            href="/dashboard/projects" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Back to Projects
          </Link>
          
          <div className="flex space-x-3">
            {(isOwner || isAdmin) && project.status !== 'submitted' && project.status !== 'evaluated' && project.status !== 'completed' && (
              <Link href={`/dashboard/projects/${projectId}/edit`}>
                <Button variant="outline" className="inline-flex items-center">
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit Project
                </Button>
              </Link>
            )}
            
            {isOwner && project.status === 'draft' && (
              <Button 
                variant="primary" 
                className="inline-flex items-center"
                onClick={() => projectsApi.updateProject(projectId, { status: 'in_progress' }).then(fetchProject)}
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Start Progress
              </Button>
            )}
            
            {isOwner && (project.status === 'draft' || project.status === 'in_progress') && (
              <Button
                variant="success"
                className="inline-flex items-center"
                onClick={handleSubmitProject}
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Submit Project
              </Button>
            )}
            
            {(isOwner || isAdmin) && (
              <Button
                variant="danger"
                className="inline-flex items-center"
                onClick={handleDeleteProject}
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
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
        
        {/* Project header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                <div className="mt-1 flex items-center">
                  <span className="text-sm text-gray-500 mr-2">By {project.student_name}</span>
                  <Badge variant={getStatusBadgeColor(project.status)}>
                    {project.status_display}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <Badge variant="gray" size="lg" className="mr-2">
                  {project.year}
                </Badge>
                <Badge variant="gray" size="lg">
                  {project.type_display}
                </Badge>
                {project.public_visibility ? (
                  <Badge variant="green" size="lg" className="ml-2">
                    Public
                  </Badge>
                ) : (
                  <Badge variant="gray" size="lg" className="ml-2">
                    Private
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Project content */}
          <div className="p-6">
            {/* Thumbnail/image */}
            {project.thumbnail && (
              <div className="mb-6">
                <img
                  src={`http://localhost:8000/media/${project.thumbnail}`}
                  alt={project.title}
                  className="w-full max-h-96 object-contain rounded"
                />
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{project.description}</p>
            </div>

            {/* Field and keywords */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Field & Keywords</h2>
              <div className="flex flex-col space-y-2">
                <div>
                  <span className="text-gray-500">Field: </span>
                  <span className="text-gray-900">{project.field}</span>
                </div>
                <div>
                  <span className="text-gray-500">Keywords: </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {project.keywords.map((keyword, i) => (
                      <Badge key={i} variant="gray" size="sm">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Files */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Project Files</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.document ? (
                  <a
                    href={`http://localhost:8000/media/${project.document}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <svg
                      className="h-6 w-6 text-gray-500 mr-2"
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
                    <span>Document</span>
                  </a>
                ) : (
                  <div className="flex items-center p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    <svg
                      className="h-6 w-6 text-gray-400 mr-2"
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
                    <span>No document uploaded</span>
                  </div>
                )}

                {project.poster ? (
                  <a
                    href={`http://localhost:8000/media/${project.poster}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <svg
                      className="h-6 w-6 text-gray-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Poster</span>
                  </a>
                ) : (
                  <div className="flex items-center p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    <svg
                      className="h-6 w-6 text-gray-400 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>No poster uploaded</span>
                  </div>
                )}

                {project.video ? (
                  <a
                    href={`http://localhost:8000/media/${project.video}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <svg
                      className="h-6 w-6 text-gray-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Video</span>
                  </a>
                ) : (
                  <div className="flex items-center p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    <svg
                      className="h-6 w-6 text-gray-400 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span>No video uploaded</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Teachers section */}
        <Card title="Project Teachers" className="mb-6">
          <div className="space-y-4">
            {project.teachers && project.teachers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {project.teachers.map((teacher) => (
                      <tr key={teacher.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                              {teacher.teacher_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{teacher.teacher_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{teacher.role_display}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {teacher.accepted ? (
                            <Badge variant="green">Accepted</Badge>
                          ) : (
                            <Badge variant="yellow">Pending</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {/* Show accept button for assigned teacher */}
                          {isTeacher && user?.id === teacher.teacher && !teacher.accepted && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleAcceptAssignment(teacher.id)}
                              className="mr-2"
                            >
                              Accept
                            </Button>
                          )}
                          
                          {/* Show remove button for project owner or admin */}
                          {(isOwner || isAdmin) && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemoveTeacher(teacher.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic py-4 text-center">No teachers assigned to this project yet.</p>
            )}
            
            {/* Show assign teacher button for project owner or admin */}
            {(isOwner || isAdmin) && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => setIsAssignTeacherModalOpen(true)}
                >
                  Assign Teacher
                </Button>
              </div>
            )}
          </div>
        </Card>
        
        {/* Project actions */}
        <div className="flex flex-wrap gap-4 mt-8">
          <Link href={`/dashboard/projects/${projectId}/milestones`}>
            <Button variant="outline">
              View Milestones
            </Button>
          </Link>
          
          <Link href={`/dashboard/projects/${projectId}/consultations`}>
            <Button variant="outline">
              View Consultations
            </Button>
          </Link>
          
          {(project.status === 'submitted' || project.status === 'evaluated' || project.status === 'completed') && (
            <Link href={`/dashboard/projects/${projectId}/evaluations`}>
              <Button variant="outline">
                View Evaluations
              </Button>
            </Link>
          )}
          
          <Link href={`/projects/${projectId}`} target="_blank">
            <Button variant="outline">
              View Public Page
            </Button>
          </Link>
        </div>
        
        {/* Assign Teacher Modal */}
        <Modal
          isOpen={isAssignTeacherModalOpen}
          onClose={() => setIsAssignTeacherModalOpen(false)}
          title="Assign Teacher to Project"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <Select
                label="Select Teacher"
                value={selectedTeacher?.toString() || ''}
                onChange={(e) => setSelectedTeacher(Number(e.target.value))}
                options={[
                  { value: '', label: 'Select a teacher...' },
                  ...teachers
                    .filter(t => !project.teachers?.some(pt => pt.teacher === t.id))
                    .map(t => ({ value: t.id.toString(), label: t.username }))
                ]}
                fullWidth
              />
            </div>
            
            <div>
              <Select
                label="Role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as TeacherRole)}
                options={[
                  { value: 'supervisor', label: 'Supervisor' },
                  { value: 'consultant', label: 'Consultant' },
                  { value: 'opponent', label: 'Opponent' },
                ]}
                fullWidth
              />
            </div>
            
            <div className="pt-4 flex justify-end space-x-3 border-t">
              <Button
                variant="outline"
                onClick={() => setIsAssignTeacherModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAssignTeacher}
                isLoading={assigningTeacher}
                disabled={assigningTeacher || !selectedTeacher}
              >
                Assign
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(ProjectDetailPage);