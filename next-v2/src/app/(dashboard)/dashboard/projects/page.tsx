// src/app/(dashboard)/dashboard/projects/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { withAuth } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import { Project, ProjectFilters } from '@/lib/types';
import { visibleProjectsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ProjectFilters as ProjectFiltersComponent } from '@/components/Projects/ProjectFilters';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

function ProjectsPage() {
  const { user, isAdmin, isTeacher, isStudent } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProjects, setTotalProjects] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  // Funkce pro načtení projektů bez useCallback - nezávisí na filtrech v závislosti
  const fetchProjects = async (pageNum: number, newFilters: ProjectFilters) => {
    setLoading(true);
    setError(null);

    try {
      // Convert filters to query params
      const params: Record<string, string> = {
        page: pageNum.toString(),
      };

      if (newFilters.search) params.search = newFilters.search;
      if (newFilters.year) params.year = newFilters.year.toString();
      if (newFilters.field) params.field = newFilters.field;
      if (newFilters.status) params.status = newFilters.status;
      if (newFilters.type_of_work) params.type_of_work = newFilters.type_of_work;
      if (newFilters.keywords && newFilters.keywords.length) {
        params.keywords = newFilters.keywords.join(',');
      }

      const response = await visibleProjectsApi.getProjects(params);
      
      // If it's page 1, replace projects; otherwise, append
      if (pageNum === 1) {
        setProjects(response.results);
      } else {
        setProjects((prev) => [...prev, ...response.results]);
      }
      
      setTotalProjects(response.count);
      setHasMorePages(response.results.length === 20 && response.count > pageNum * 20);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load - only run once
  useEffect(() => {
    fetchProjects(1, {});
  }, []);

  // Použijeme memoizovaný callback, který bude stabilní a nebude se měnit
  const handleFilterChange = useCallback((newFilters: ProjectFilters) => {
    setFilters(newFilters);
    fetchProjects(1, newFilters);
  }, []);

  const handleLoadMore = () => {
    fetchProjects(page + 1, filters);
  };

  const toggleRowExpand = (projectId: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const isAssignedToProject = (project: Project) => {
    if (!user || !isTeacher) return false;
    return project.teachers?.some(teacher => 
      teacher.teacher === user.id
    );
  };

  // Function to determine the path based on user role, project assignment, and action (view or edit)
  const getProjectPath = (project: Project, toEdit: boolean) => {
    // If admin, assigned teacher, or project owner (student), use normal path
    if ((isAdmin || isAssignedToProject(project) || project.student === user?.id) && toEdit) {
      return `/dashboard/projects/${project.id}/edit`;
    } else if (isAdmin || isAssignedToProject(project) || project.student === user?.id) {
      return `/dashboard/projects/${project.id}`;
    }
    
    // Otherwise, use public path
    return toEdit 
      ? `/projects-public/${project.id}` 
      : `/projects-public/${project.id}`;
  };

  const renderProjectCards = () => (
    <div className="space-y-3">
      {projects.map((project) => (
        <div key={project.id} className="bg-white shadow rounded-lg overflow-hidden">
          <div 
            className="p-4 border-b border-gray-200 flex justify-between items-center cursor-pointer"
            onClick={() => toggleRowExpand(project.id)}
          >
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 text-sm">{project.title}</h3>
              <div className="text-xs text-gray-500 mt-1">
                Student: {project.student_name}
              </div>
            </div>
            <div className="ml-4">
              {expandedRows[project.id] ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
          
          {expandedRows[project.id] && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500">Rok</div>
                  <div className="text-sm">{project.year}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Druh</div>
                  <div className="text-sm">{project.type_display}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Obor</div>
                  <div className="text-sm truncate max-w-[150px]">{project.field}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Stav</div>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${project.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      project.status === 'in_progress' ? 'bg-orange-100 text-orange-800' : 
                      project.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'}`}
                  >
                    {project.status_display}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between pt-3 border-t border-gray-100">
                <Link 
                  href={getProjectPath(project, false)}
                  className="text-orange-600 hover:text-orange-900 text-sm"
                >
                  Zobrazit
                </Link>
                <Link href={getProjectPath(project, true)}>
                  <Button variant="outline" size="sm">Upravit</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Projekty</h1>
            <p className="mt-1 text-sm text-gray-500">
              Procházejte projekty
            </p>
          </div>
          <div className="mt-3 sm:mt-0 flex gap-2">
            <Button 
              variant="outline" 
              className="lg:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Skrýt filtry' : 'Zobrazit filtry'}
            </Button>
            
            {isStudent && (
              <Link href="/dashboard/create-project">
                <Button variant="primary">Vytvořit projekt</Button>
              </Link>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="danger" message={error} />
        )}

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Filters sidebar - mobile/tablet version */}
          <div className={`w-full lg:hidden ${showFilters ? 'block' : 'hidden'} mb-4`}>
            <ProjectFiltersComponent onFilterChange={handleFilterChange} initialFilters={filters} />
          </div>
          
          {/* Filters sidebar - desktop version */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <ProjectFiltersComponent onFilterChange={handleFilterChange} initialFilters={filters} />
          </div>

          {/* Projects content */}
          <div className="flex-1">
            <div className="mb-3">
              <p className="text-sm text-gray-500">
                {totalProjects} {totalProjects === 1 ? 'projekt' : 'projektů'} nalezeno
              </p>
            </div>

            {loading && projects.length === 0 ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-600"></div>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-6 bg-white shadow rounded-lg">
                <svg
                  className="mx-auto h-10 w-10 text-gray-400"
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
                <h3 className="mt-2 text-lg font-medium text-gray-900">Žádné projekty nenalezeny</h3>
                <p className="mt-1 text-sm text-gray-500">
                 Zkuste upravit vyhledávání
                </p>
                {isStudent && (
                  <div className="mt-4">
                    <Link href="/dashboard/create-project">
                      <Button variant="primary">Vytvořit nový projekt</Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Karty projektů - vždy se zobrazí na malých zařízeních, ale také na středních (až do 1500px) */}
                <div className="xl:hidden">
                  {renderProjectCards()}
                </div>

                {/* Tabulka projektů - pouze pro větší obrazovky (1500px a více) */}
                <div className="hidden xl:block overflow-x-auto bg-white shadow rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Název
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rok
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Obor
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stav
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Druh
                        </th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Akce
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.map((project) => (
                        <tr key={project.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs font-medium text-gray-900 truncate max-w-[140px]">
                              {project.title}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-500 truncate max-w-[100px]">{project.student_name}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-500">{project.year}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-500 truncate max-w-[100px]">{project.field}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${project.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                project.status === 'in_progress' ? 'bg-orange-100 text-orange-800' : 
                                project.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'}`}
                            >
                              {project.status_display}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-500 truncate max-w-[100px]">{project.type_display}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                            <div className="flex justify-end items-center space-x-1">
                              <Link 
                                href={getProjectPath(project, false)}
                                className="text-orange-600 hover:text-orange-900 text-xs mr-2"
                              >
                                Zobrazit
                              </Link>
                              <Link href={getProjectPath(project, true)}>
                                <Button variant="outline">Upravit</Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {hasMorePages && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      onClick={handleLoadMore}
                      variant="outline"
                      isLoading={loading}
                      disabled={loading}
                    >
                      Načíst více
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(ProjectsPage);