// src/app/(dashboard)/dashboard/evaluations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { withRole } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import { Project, ProjectEvaluation } from '@/lib/types';
import { evaluationsApi, projectsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PencilIcon } from '@heroicons/react/24/outline';

function EvaluationsDashboardPage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<ProjectEvaluation[]>([]);
  const [projects, setProjects] = useState<Record<number, Project>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);

      try {
        // Fetch all evaluations
        const evaluationsResponse = await evaluationsApi.getEvaluations();
        
        // If admin, get all evaluations; if teacher, filter for ones I created
        const filteredEvaluations = user.role === 'admin' 
          ? evaluationsResponse.results 
          : evaluationsResponse.results.filter(e => e.teacher === user.id);
        
        setEvaluations(filteredEvaluations);
        
        // Fetch project details for each evaluation
        const projectIds = [...new Set(filteredEvaluations.map(e => e.project))];
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
        setError(err instanceof Error ? err.message : 'Failed to load evaluations');
        console.error('Error fetching evaluations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [user]);

  // Group evaluations by project
  const evaluationsByProject: Record<number, ProjectEvaluation[]> = {};
  
  evaluations.forEach(evaluation => {
    if (!evaluationsByProject[evaluation.project]) {
      evaluationsByProject[evaluation.project] = [];
    }
    evaluationsByProject[evaluation.project].push(evaluation);
  });

  // Calculate average score for each project
  const getAverageScore = (projectEvaluations: ProjectEvaluation[]): number => {
    if (!projectEvaluations.length) return 0;
    const sum = projectEvaluations.reduce((acc, evaluation) => acc + evaluation.score, 0);
    return Math.round(sum / projectEvaluations.length);
  };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Hodnocení</h1>
        
        {error && (
          <Alert variant="danger" message={error} />
        )}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
          </div>
        ) : Object.keys(evaluationsByProject).length === 0 ? (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Bez hodnocení</h3>
            <p className="mt-1 text-sm text-gray-500">
              Zatím jste nepřidali žádné hodnocení
            </p>
            <div className="mt-6">
              <Link href="/dashboard/projects">
                <Button variant="primary">Procházet projekty</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(evaluationsByProject).map(([projectId, projectEvaluations]) => {
              const project = projects[Number(projectId)];
              if (!project) return null;
              
              const myEvaluation = user 
                ? projectEvaluations.find(e => e.teacher === user.id) 
                : undefined;
              const averageScore = getAverageScore(projectEvaluations);
              
              return (
                <Card key={projectId} className="overflow-hidden">
                  <div className="py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">{project.title}</h2>
                      <div className="text-sm text-gray-500">
                        Student: {project.student_name} | Druh: {project.type_display}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-4">
                        <div className="text-xs text-gray-500 uppercase">Průměrné hodnocené</div>
                        <div className="text-2xl font-bold text-orange-600">{averageScore}<span className="text-sm text-gray-500">/100</span></div>
                      </div>
                      <Badge variant={
                        project.status === 'completed' ? 'green' : 
                        project.status === 'evaluated' ? 'blue' :
                        project.status === 'submitted' ? 'yellow' : 'gray'
                      }>
                        {project.status_display}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-md font-medium text-gray-900 mb-2">Hodnocení ({projectEvaluations.length})</h3>
                      <div className="space-y-4">
                        {projectEvaluations.map(evaluation => {
                          const isMyEvaluation = user && evaluation.teacher === user.id;
                          
                          return (
                            <div 
                              key={evaluation.id} 
                              className={`p-4 rounded-lg ${isMyEvaluation ? 'bg-orange-50 border border-orange-100' : 'bg-gray-50'}`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-orange-600 rounded-full flex items-center justify-center text-white">
                                    {evaluation.teacher_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {evaluation.teacher_name}
                                      {isMyEvaluation && <span className="ml-2 text-orange-600">(You)</span>}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(evaluation.created_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <div className="text-xl font-bold text-orange-600">{evaluation.score}</div>
                                  <div className="text-sm text-gray-500 ml-1">/100</div>
                                </div>
                              </div>
                              <div className="mt-3 text-sm text-gray-700">
                                {evaluation.evaluation.length > 200 
                                  ? `${evaluation.evaluation.substring(0, 200)}...` 
                                  : evaluation.evaluation}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
                      <Link href={`/dashboard/projects/${projectId}`}>
                        <Button variant="outline">Zobrazit projekt</Button>
                      </Link>
                      
                      <div className="flex space-x-2">
                        <Link href={`/dashboard/projects/${projectId}/evaluations`}>
                          <Button variant="primary">
                            Zobrazit všechny hodnocení
                          </Button>
                        </Link>
                        
                        {myEvaluation ? (
                          <Link href={`/dashboard/projects/${projectId}/evaluations`}>
                            <Button variant="outline" className="inline-flex items-center">
                              <PencilIcon className="h-4 w-4 mr-1" />
                              Upravit moje hodnocení
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/dashboard/projects/${projectId}/evaluations`}>
                            <Button variant="outline">
                              Přidat hodnocení
                            </Button>
                          </Link>
                        )}
                      </div>
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

export default withRole(EvaluationsDashboardPage, ['teacher', 'admin']);