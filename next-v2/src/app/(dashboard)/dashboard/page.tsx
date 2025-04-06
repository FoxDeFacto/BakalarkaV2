// src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { withAuth } from '@/lib/auth';
import { Project, Milestone, Consultation } from '@/lib/types';
import { projectsApi, milestonesApi, consultationsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';

function Dashboard() {
  const { user, isStudent, isTeacher } = useAuth();
  
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [upcomingMilestones, setUpcomingMilestones] = useState<Milestone[]>([]);
  const [upcomingConsultations, setUpcomingConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState({
    projects: true,
    milestones: true,
    consultations: true,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent projects
        setLoading(prev => ({ ...prev, projects: true }));
        const projectsResponse = await projectsApi.getProjects({ limit: '5' });
        setRecentProjects(projectsResponse.results);
        setLoading(prev => ({ ...prev, projects: false }));
        
        // Fetch upcoming milestones
        setLoading(prev => ({ ...prev, milestones: true }));
        const milestonesResponse = await milestonesApi.getMilestones();
        // Filter for upcoming milestones (next 30 days)
        const now = new Date();
        const thirtyDaysFromNow = new Date(now);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const upcoming = milestonesResponse.results.filter(milestone => {
          const deadlineDate = new Date(milestone.deadline);
          return (
            deadlineDate >= now && 
            deadlineDate <= thirtyDaysFromNow && 
            milestone.status !== 'completed'
          );
        }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
        
        setUpcomingMilestones(upcoming.slice(0, 5));
        setLoading(prev => ({ ...prev, milestones: false }));
        
        // Fetch upcoming consultations
        if (isStudent || isTeacher) {
          setLoading(prev => ({ ...prev, consultations: true }));
          const consultationsResponse = await consultationsApi.getConsultations();
          
          // Filter for upcoming consultations
          const upcomingConsultations = consultationsResponse.results
            .filter(consultation => new Date(consultation.consultation_date) >= now)
            .sort((a, b) => 
              new Date(a.consultation_date).getTime() - new Date(b.consultation_date).getTime()
            );
          
          setUpcomingConsultations(upcomingConsultations.slice(0, 5));
          setLoading(prev => ({ ...prev, consultations: false }));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading({
          projects: false,
          milestones: false,
          consultations: false,
        });
      }
    };

    fetchDashboardData();
  }, [isStudent, isTeacher]);

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Přehled</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vítej zpátky, {user?.username}! Taky je přehled Vašich projektů a aktivity.
        </p>
        
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Projects */}
          <Card title="Poslední projekty" className="col-span-1">
            <div className="space-y-4">
              {loading.projects ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-600"></div>
                </div>
              ) : recentProjects.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Žádné projekty nenalezeny.</p>
                  {isStudent && (
                    <div className="mt-2">
                      <Link href="/dashboard/create-project">
                        <Button variant="primary" size="sm">Vytvořit project</Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {recentProjects.map((project) => (
                    <div key={project.id} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <Link 
                          href={`/dashboard/projects/${project.id}`}
                          className="text-orange-600 hover:text-orange-800 font-medium"
                        >
                          {project.title}
                        </Link>
                        <Badge variant={
                          project.status === 'completed' ? 'green' : 
                          project.status === 'submitted' ? 'yellow' :
                          project.status === 'in_progress' ? 'blue' : 'gray'
                        }>
                          {project.status_display}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        <div className="flex justify-between">
                          <span>Student: {project.student_name}</span>
                          <span>Rok: {project.year}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 text-right">
                    <Link href="/dashboard/projects" className="text-orange-600 hover:text-orange-800 text-sm">
                      Zobrazit všechny projekty →
                    </Link>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Upcoming Milestones */}
          <Card title="Nadcházející milníky" className="col-span-1">
            <div className="space-y-4">
              {loading.milestones ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-600"></div>
                </div>
              ) : upcomingMilestones.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Žádné nadcházející milníky.</p>
                  {isTeacher && (
                    <div className="mt-2">
                      <Link href="/dashboard/milestones">
                        <Button variant="primary" size="sm">Vytvořit milník</Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {upcomingMilestones.map((milestone) => (
                    <div key={milestone.id} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link 
                            href={`/dashboard/projects/${milestone.project}/milestones`}
                            className="text-orange-600 hover:text-orange-800 font-medium"
                          >
                            {milestone.title}
                          </Link>
                          <div className="mt-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                <div 
                                  className="bg-orange-600 h-2.5 rounded-full" 
                                  style={{ width: `${milestone.completion || 0}%` }}
                                ></div>
                              </div>
                              <span>{milestone.completion || 0}%</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant={
                          milestone.status === 'completed' ? 'green' : 
                          milestone.status === 'in_progress' ? 'blue' :
                          milestone.status === 'overdue' ? 'red' : 'gray'
                        }>
                          {milestone.status_display}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        <div className="flex justify-between">
                          <span>Deadline:</span>
                          <span className={`font-medium ${
                            new Date(milestone.deadline) < new Date() ? 'text-red-600' : ''
                          }`}>
                            {new Date(milestone.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 text-right">
                    <Link href="/dashboard/milestones" className="text-orange-600 hover:text-orange-800 text-sm">
                     Přehled všech milníků →
                    </Link>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Upcoming Consultations */}
          {(isStudent || isTeacher) && (
            <Card title="Nahcházejí komzultace" className="col-span-1 lg:col-span-2">
              <div className="space-y-4">
                {loading.consultations ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-600"></div>
                  </div>
                ) : upcomingConsultations.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Žádné nadcházející konzultace.</p>
                    {isTeacher && (
                      <div className="mt-2">
                        <Link href="/dashboard/consultations">
                          <Button variant="primary" size="sm">Přidat konzultaci</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Datum
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Projekt
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Učitel
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Poznámky
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {upcomingConsultations.map((consultation) => (
                          <tr key={consultation.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(consultation.consultation_date).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Link 
                                href={`/dashboard/projects/${consultation.project}`}
                                className="text-orange-600 hover:text-orange-800"
                              >
                                Přehled všech projektů
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {consultation.teacher_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {consultation.notes || <span className="italic">Bez poznámek</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(Dashboard);
