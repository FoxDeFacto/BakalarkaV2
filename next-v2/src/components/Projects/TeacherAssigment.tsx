// src/components/project/TeacherAssignment.tsx
import { useState, useEffect } from 'react';
import { User, ProjectTeacher, TeacherRole } from '@/lib/types';
import { usersApi, projectTeachersApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';

const TEACHER_ROLES: { value: TeacherRole; label: string }[] = [
  { value: 'supervisor', label: 'Vedoucí práce' },
  { value: 'consultant', label: 'Konzultant' },
  { value: 'opponent', label: 'Oponent' },
];

interface TeacherAssignmentProps {
  projectId: number;
  currentTeachers: ProjectTeacher[];
  onTeacherAssigned: () => void;
  isStudent: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
  currentUserId?: number;
}

export default function TeacherAssignment({
  projectId,
  currentTeachers,
  onTeacherAssigned,
  isStudent,
  isTeacher,
  isAdmin,
  currentUserId
}: TeacherAssignmentProps) {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState<TeacherRole>('supervisor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch available teachers
  useEffect(() => {
    async function fetchTeachers() {
      try {
        const response = await usersApi.getUsers('teacher');
        setTeachers(response.results);
      } catch (err) {
        setError('Nepodařilo se načíst seznam učitelů');
        console.error('Error fetching teachers:', err);
      }
    }

    fetchTeachers();
  }, []);

  // Filter out already assigned teachers
  const availableTeachers = teachers.filter(
    teacher => !currentTeachers.some(assigned => assigned.teacher === teacher.id)
  );

  const handleAssignTeacher = async () => {
    if (!selectedTeacher) {
      setError('Vyberte učitele');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await projectTeachersApi.assignTeacher({
        project: projectId,
        teacher: Number(selectedTeacher),
        role: selectedRole,
      });

      setSuccess('Učitel byl úspěšně přiřazen k projektu');
      setSelectedTeacher('');
      onTeacherAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se přiřadit učitele');
      console.error('Error assigning teacher:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTeacher = async (teacherId: number) => {
    if (!confirm('Opravdu chcete odebrat učitele z projektu?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await projectTeachersApi.removeTeacher(teacherId);
      setSuccess('Učitel byl úspěšně odebrán z projektu');
      onTeacherAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se odebrat učitele');
      console.error('Error removing teacher:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAssignment = async (assignmentId: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await projectTeachersApi.acceptAssignment(assignmentId);
      setSuccess('Role byla úspěšně přijata');
      onTeacherAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se přijmout roli');
      console.error('Error accepting assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineAssignment = async (assignmentId: number) => {
    if (!confirm('Opravdu chcete odmítnout tuto roli?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await projectTeachersApi.declineAssignment(assignmentId);
      setSuccess('Role byla odmítnuta');
      onTeacherAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se odmítnout roli');
      console.error('Error declining assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="danger" message={error} onClose={() => setError(null)} />
      )}
      
      {success && (
        <Alert variant="success" message={success} onClose={() => setSuccess(null)} />
      )}

      {/* List of current teachers */}
      <div className="space-y-2">
        {currentTeachers.length > 0 ? (
          currentTeachers.map(teacher => (
            <div 
              key={teacher.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  {teacher.teacher_name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="font-medium">{teacher.teacher_name}</p>
                  <p className="text-sm text-gray-500">{teacher.role_display}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={teacher.accepted ? 'green' : 'gray'}>
                  {teacher.accepted ? 'Přijato' : 'Čeká na schválení'}
                </Badge>
                
                {/* Actions for teachers to accept/decline */}
                {isTeacher && currentUserId === teacher.teacher && !teacher.accepted && (
                  <div className="flex space-x-2">
                    <Button 
                      variant="success" 
                      size="sm"
                      onClick={() => handleAcceptAssignment(teacher.id)}
                      disabled={loading}
                    >
                      Přijmout
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleDeclineAssignment(teacher.id)}
                      disabled={loading}
                    >
                      Odmítnout
                    </Button>
                  </div>
                )}
                
                {/* Remove button for students (only for non-accepted assignments) or admins */}
                {((isStudent && !teacher.accepted) || isAdmin) && (
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => handleRemoveTeacher(teacher.id)}
                    disabled={loading}
                  >
                    <UserMinusIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">Žádní učitelé zatím nejsou přiřazeni</p>
        )}
      </div>

      {/* Assignment form for students */}
      {isStudent && availableTeachers.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-3">Přiřadit nového učitele</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 mb-1">
                Učitel
              </label>
              <select
                id="teacher"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value ? Number(e.target.value) : '')}
                disabled={loading}
              >
                <option value="">Vyberte učitele</option>
                {availableTeachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.username}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as TeacherRole)}
                disabled={loading}
              >
                {TEACHER_ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <Button
                variant="primary"
                className="w-full flex items-center justify-center"
                onClick={handleAssignTeacher}
                disabled={loading || !selectedTeacher}
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Přiřadit učitele
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {isStudent && availableTeachers.length === 0 && teachers.length > 0 && (
        <div className="mt-2 text-center">
          <p className="text-gray-500">Všichni dostupní učitelé již byli přiřazeni k projektu.</p>
        </div>
      )}
    </div>
  );
}