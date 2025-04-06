// src/app/(dashboard)/dashboard/projects/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { withAuth } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import { Project, ProjectTeacher } from '@/lib/types';
import { projectsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TeacherAssignment from '@/components/Projects/TeacherAssigment';
import { 
  PencilIcon, 
  ChatBubbleLeftIcon, 
  ClockIcon, 
  CalendarIcon, 
  DocumentTextIcon,
  AcademicCapIcon,
  StarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const router = useRouter();
  const { user, isTeacher, isAdmin, isStudent } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is assigned to this project (for teachers)
  const isAssignedTeacher = isTeacher && user && project?.teachers?.some(
    teacher => teacher.teacher === user.id && teacher.accepted
  );
  
  // Check if user is the owner of this project (for students)
  const isProjectOwner = isStudent && user && project?.student === user.id;
  
  // Check if project can be evaluated (submitted status or later)
  const canBeEvaluated = project && 
    ['submitted', 'evaluated', 'completed'].includes(project.status);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const projectData = await projectsApi.getProject(projectId);
        setProject(projectData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
        console.error('Error fetching project:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId]);

  const handleSubmitProject = async () => {
    if (!project) return;
    
    if (!confirm('Are you sure you want to submit this project? This cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await projectsApi.submitProject(projectId);
      
      // Refresh project data
      const updatedProject = await projectsApi.getProject(projectId);
      setProject(updatedProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit project');
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('cs-CZ', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }).format(date);
  };

  // Handler when a teacher is assigned or removed
  const handleTeacherUpdated = async () => {
    try {
      const updatedProject = await projectsApi.getProject(projectId);
      setProject(updatedProject);
    } catch (err) {
      console.error('Error refreshing project data:', err);
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
              <Button variant="primary">Zpátky na projekty</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        {/* Project header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <Link href="/dashboard/projects" className="text-orange-600 hover:text-orange-800">
              &larr; Zpět na projekty
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">{project.title}</h1>
            <div className="flex flex-wrap items-center mt-2 gap-2">
              <Badge 
                variant={
                  project.status === 'completed' ? 'green' : 
                  project.status === 'evaluated' ? 'blue' :
                  project.status === 'submitted' ? 'yellow' :
                  project.status === 'in_progress' ? 'orange' : 'gray'
                }
              >
                {project.status_display}
              </Badge>
              <span className="text-gray-500">|</span>
              <span className="text-gray-600">{project.type_display}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-600">{project.field}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-600">Rok: {project.year}</span>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            {/* Evaluations button for teachers and admins */}
            {(isTeacher || isAdmin) && (
              <Link href={`/dashboard/projects/${projectId}/evaluations`}>
                <Button 
                  variant="primary"
                  className="flex items-center gap-1"
                  disabled={!canBeEvaluated}
                >
                  <StarIcon className="h-5 w-5" />
                  {project.evaluations && project.evaluations.length > 0 ? 'Zobrazit hodnocení' : 'Přidat hodnocení'}
                </Button>
              </Link>
            )}
            
            {/* Edit button for owners and assigned teachers */}
            {(isProjectOwner || isAssignedTeacher || isAdmin) && (
              <Link href={`/dashboard/projects/${projectId}/edit`}>
                <Button variant="outline" className="flex items-center gap-1">
                  <PencilIcon className="h-5 w-5" />
                  Upravit projekt
                </Button>
              </Link>
            )}
            
            {/* Submit button for students (owners) if project is not yet submitted */}
            {isProjectOwner && project.status === 'draft' && (
              <Button 
                variant="success" 
                className="flex items-center gap-1"
                onClick={handleSubmitProject}
                disabled={!project.document}
              >
                <DocumentTextIcon className="h-5 w-5" />
                Odevzdat projekt
              </Button>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mb-4">
            <Alert variant="danger" message={error} />
          </div>
        )}
        
        {/* Project information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Description card */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Popis projektu</h2>
                <p className="text-gray-700 whitespace-pre-line">{project.description}</p>
                
                {/* Keywords */}
                {project.keywords && project.keywords.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Klíčová slova:</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.keywords.map((keyword, index) => (
                        <Badge key={index}>{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Teacher Assignment Card - New Section */}
            {(isProjectOwner || isTeacher || isAdmin) && (
              <Card>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Učitelé projektu</h2>
                  </div>
                  
                  <TeacherAssignment
                    projectId={projectId}
                    currentTeachers={project.teachers || []}
                    onTeacherAssigned={handleTeacherUpdated}
                    isStudent={isProjectOwner || false}
                    isTeacher={isTeacher}
                    isAdmin={isAdmin}
                    currentUserId={user?.id}
                  />
                </div>
              </Card>
            )}
            
            {/* Documents and files */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Dokumenty a soubory</h2>
                
                <div className="space-y-4">
                  {project.document ? (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-6 w-6 text-gray-500 mr-3" />
                        <span className="font-medium">Dokument projektu</span>
                      </div>
                      <a 
                        href={`${process.env.NEXT_PUBLIC_BACKEND_URL}${project.document}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-800"
                      >
                        Zobrazit
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <DocumentTextIcon className="h-6 w-6 text-gray-400 mr-3" />
                      <span className="text-gray-500">Žádný dokument</span>
                    </div>
                  )}
                  
                  {project.poster && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <svg className="h-6 w-6 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Plakát projektu</span>
                      </div>
                      <a 
                        href={`${process.env.NEXT_PUBLIC_BACKEND_URL}${project.poster}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-800"
                      >
                        Zobrazit
                      </a>
                    </div>
                  )}
                  
                  {project.video && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <svg className="h-6 w-6 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Video projektu</span>
                      </div>
                      <a 
                        href={`${process.env.NEXT_PUBLIC_BACKEND_URL}${project.video}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-800"
                      >
                        Zobrazit
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </Card>
            
            {/* Recent evaluations - for submitted, evaluated, and completed projects */}
            {(project.status === 'submitted' || project.status === 'evaluated' || project.status === 'completed') && (
              <Card>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Hodnocení projektu</h2>
                    <Link href={`/dashboard/projects/${projectId}/evaluations`}>
                      <Button variant="outline" size="sm">
                        {project.evaluations && project.evaluations.length > 0 
                          ? 'Zobrazit všechna hodnocení' 
                          : (isTeacher || isAdmin) ? 'Přidat hodnocení' : 'Detaily'}
                      </Button>
                    </Link>
                  </div>
                  
                  {project.evaluations && project.evaluations.length > 0 ? (
                    <div className="space-y-4">
                      {/* Show latest evaluation or one created by current teacher */}
                      {project.evaluations.slice(0, 1).map(evaluation => (
                        <div key={evaluation.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center text-white">
                                {evaluation.teacher_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-3">
                                <p className="font-medium">{evaluation.teacher_name}</p>
                                <p className="text-sm text-gray-500">{formatDate(evaluation.created_at)}</p>
                              </div>
                            </div>
                            <div className="flex items-baseline">
                              <span className="text-2xl font-bold text-orange-600">{evaluation.score}</span>
                              <span className="text-sm text-gray-500 ml-1">/100</span>
                            </div>
                          </div>
                          <p className="text-gray-700">
                            {evaluation.evaluation.length > 200 
                              ? `${evaluation.evaluation.substring(0, 200)}...` 
                              : evaluation.evaluation}
                          </p>
                        </div>
                      ))}
                      
                      {/* Show average score if multiple evaluations */}
                      {project.evaluations.length > 1 && (
                        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                          <p className="text-gray-700">
                            Celkem {project.evaluations.length} hodnocení s průměrným skóre{' '}
                            <span className="font-bold text-orange-600">
                              {Math.round(project.evaluations.reduce((acc, e) => acc + e.score, 0) / project.evaluations.length)}
                              </span>
                            <span className="text-sm text-gray-500"> / 100</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <StarIcon className="h-12 w-12 text-gray-300 mx-auto"/>
                      <p className="mt-2 text-gray-500">
                        {isTeacher || isAdmin 
                          ? 'Zatím nebylo přidáno žádné hodnocení. Přidejte první hodnocení projektu.' 
                          : 'Zatím nebylo přidáno žádné hodnocení.'}
                      </p>
                      {(isTeacher || isAdmin) && (
                        <div className="mt-4">
                          <Link href={`/dashboard/projects/${projectId}/evaluations`}>
                            <Button variant="primary">Přidat hodnocení</Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}
            
            {/* Project milestones */}
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Milníky projektu</h2>
                  <Link href={`/dashboard/projects/${projectId}/milestones`}>
                    <Button variant="outline" size="sm">
                      {project.milestones && project.milestones.length > 0 
                        ? 'Spravovat milníky' 
                        : (isTeacher || isAdmin) ? 'Přidat milníky' : 'Detaily'}
                    </Button>
                  </Link>
                </div>
                
                {project.milestones && project.milestones.length > 0 ? (
                  <div className="space-y-3">
                    {project.milestones.slice(0, 3).map(milestone => {
                      const now = new Date();
                      const deadline = new Date(milestone.deadline);
                      const isOverdue = deadline < now && milestone.status !== 'completed';
                      
                      return (
                        <div key={milestone.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className={`h-3 w-3 rounded-full flex-shrink-0 ${
                            milestone.status === 'completed' ? 'bg-green-500' :
                            isOverdue ? 'bg-red-500' : 
                            milestone.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{milestone.title}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              <span>{formatDate(milestone.deadline)}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    (milestone.completion || 0) === 100 ? 'bg-green-500' : 'bg-orange-500'
                                  }`}
                                  style={{ width: `${milestone.completion || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 ml-2">{milestone.completion || 0}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {project.milestones.length > 3 && (
                      <Link href={`/dashboard/projects/${projectId}/milestones`} className="block text-center text-orange-600 hover:text-orange-800 text-sm mt-2">
                        Zobrazit všech {project.milestones.length} milníků
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClockIcon className="h-12 w-12 text-gray-300 mx-auto"/>
                    <p className="mt-2 text-gray-500">
                      {isTeacher || isAdmin 
                        ? 'Zatím nebyly přidány žádné milníky. Přidejte milníky ke sledování postupu.' 
                        : 'Zatím nebyly přidány žádné milníky.'}
                    </p>
                    {(isTeacher || isAdmin) && (
                      <div className="mt-4">
                        <Link href={`/dashboard/projects/${projectId}/milestones`}>
                          <Button variant="primary">Přidat milníky</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
            
            {/* Project comments */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Komentáře</h2>
                
                {project.comments && project.comments.length > 0 ? (
                  <div className="space-y-4">
                    {project.comments.slice(0, 3).map(comment => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white
                            ${comment.user_role === 'teacher' ? 'bg-blue-600' : 
                              comment.user_role === 'admin' ? 'bg-red-600' : 'bg-orange-600'}`}>
                            {comment.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <p className="font-medium">
                                {comment.user_name}
                                <span className="ml-2 text-xs text-gray-500">
                                  ({comment.user_role === 'teacher' ? 'Učitel' : 
                                     comment.user_role === 'admin' ? 'Admin' : 'Student'})
                                </span>
                              </p>
                              <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
                            </div>
                            <p className="mt-1 text-gray-700">{comment.comment_text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {project.comments.length > 3 && (
                      <Link href="#" className="block text-center text-orange-600 hover:text-orange-800 text-sm mt-2">
                        Zobrazit všech {project.comments.length} komentářů
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ChatBubbleLeftIcon className="h-12 w-12 text-gray-300 mx-auto"/>
                    <p className="mt-2 text-gray-500">Zatím nebyly přidány žádné komentáře.</p>
                  </div>
                )}
                
                {/* Comment form will go here */}
              </div>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project details */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Detaily projektu</h2>
                
                <div className="space-y-4">
                  {/* Student info */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Student:</h3>
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center text-white">
                        {project.student_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="ml-2 font-medium">{project.student_name}</span>
                    </div>
                  </div>
                  
                  {/* Teachers */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Učitelé:</h3>
                    {project.teachers && project.teachers.length > 0 ? (
                      <div className="space-y-2">
                        {project.teachers.map(teacher => (
                          <div key={teacher.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                                {teacher.teacher_name.charAt(0).toUpperCase()}
                              </div>
                              <span className="ml-2">{teacher.teacher_name}</span>
                            </div>
                            <Badge variant={teacher.accepted ? 'green' : 'gray'}>
                              {teacher.role_display}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Žádní učitelé zatím nejsou přiřazeni</p>
                    )}
                  </div>
                  
                  {/* Created date */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Vytvořeno:</h3>
                    <p>{formatDate(project.created_at)}</p>
                  </div>
                  
                  {/* Last updated */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Poslední aktualizace:</h3>
                    <p>{formatDate(project.updated_at)}</p>
                  </div>
                  
                  {/* Public visibility */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Veřejná viditelnost:</h3>
                    <Badge variant={project.public_visibility ? 'green' : 'gray'}>
                      {project.public_visibility ? 'Veřejné' : 'Soukromé'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Actions card */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Akce</h2>
                
                <div className="space-y-2">
                
                  <Link href={`/dashboard/projects/${projectId}/milestones`} className="block w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <ClockIcon className="h-5 w-5 mr-2" />
                      Spravovat milníky
                    </Button>
                  </Link>
                  
                  <Link href={`/dashboard/projects/${projectId}/consultations`} className="block w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-5 w-5 mr-2" />
                      Konzultace
                    </Button>
                  </Link>
                  
                  {(canBeEvaluated) && (isTeacher || isAdmin) && (
                    <Link href={`/dashboard/projects/${projectId}/evaluations`} className="block w-full">
                      <Button variant="primary" className="w-full justify-start">
                        <StarIcon className="h-5 w-5 mr-2" />
                        {project.evaluations && project.evaluations.some(
                          e => user && e.teacher === user.id
                        ) ? 'Upravit hodnocení' : 'Přidat hodnocení'}
                      </Button>
                    </Link>
                  )}
                  
                  {isProjectOwner && project.status === 'draft' && (
                    <Button 
                      variant="success" 
                      className="w-full justify-start"
                      onClick={handleSubmitProject}
                      disabled={!project.document}
                    >
                      <DocumentTextIcon className="h-5 w-5 mr-2" />
                      Odevzdat projekt
                    </Button>
                  )}
                </div>
              </div>
            </Card>
            
            {/* Thumbnail preview if available */}
            {project.thumbnail && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Náhled</h2>
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL}${project.thumbnail}`} 
                    alt={project.title}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(ProjectDetailPage);