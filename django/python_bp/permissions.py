from rest_framework import permissions
from .models import ProjectTeacher, Project


class IsTeacherOrAdminOrReadOnly(permissions.BasePermission):
    """
    Povoluje zápis pouze učitelům a administrátorům.
    Ostatní uživatelé mají pouze oprávnění pro čtení.
    """
    def has_permission(self, request, view):
        # Čtení je povoleno všem
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Zápis je povolen pouze přihlášeným učitelům a administrátorům
        return (
            request.user.is_authenticated and 
            (request.user.role in ['teacher', 'admin'])
        )


class IsTeacherForProject(permissions.BasePermission):
    """
    Povoluje zápis pouze učitelům přiřazeným k projektu nebo administrátorům.
    Ostatní uživatelé mají pouze oprávnění pro čtení.
    """
    def has_permission(self, request, view):
        # Čtení je povoleno všem přihlášeným uživatelům
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Administrátoři mají plný přístup
        if request.user.role == 'admin':
            return True
        
        # Učitelé mohou vytvářet nové záznamy
        if request.method == 'POST' and request.user.role == 'teacher':
            # U vytváření zkontrolujeme, zda je učitel přiřazen k projektu
            project_id = request.data.get('project')
            if project_id:
                return ProjectTeacher.objects.filter(
                    project_id=project_id, teacher=request.user
                ).exists()
            return False
        
        # Pro ostatní metody zkontrolujeme v has_object_permission
        return request.user.role == 'teacher'
    
    def has_object_permission(self, request, view, obj):
        # Čtení je povoleno všem přihlášeným uživatelům
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Administrátoři mají plný přístup
        if request.user.role == 'admin':
            return True
        
        # Učitelé mohou upravovat záznamy pouze pro projekty, ke kterým jsou přiřazeni
        if request.user.role == 'teacher':
            # Získání projektu podle typu objektu
            if hasattr(obj, 'project'):
                project = obj.project
            elif isinstance(obj, Project):
                project = obj
            else:
                return False
            
            return ProjectTeacher.objects.filter(
                project=project, teacher=request.user
            ).exists()
        
        return False


class IsOwnerOrTeacherOrReadOnly(permissions.BasePermission):
    """
    Povoluje zápis vlastníkům projektu, přiřazeným učitelům nebo administrátorům.
    Ostatní uživatelé mají pouze oprávnění pro čtení.
    """
    def has_permission(self, request, view):
        # Čtení je povoleno všem přihlášeným uživatelům
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Administrátoři mají plný přístup
        if request.user.role == 'admin':
            return True
        
        # Pro vytváření projektů mají přístup studenti a učitelé
        if request.method == 'POST':
            return request.user.is_authenticated and (
                request.user.role in ['student', 'teacher']
            )
        
        # Pro ostatní metody zkontrolujeme v has_object_permission
        return True
    
    def has_object_permission(self, request, view, obj):
        # Čtení je povoleno všem přihlášeným uživatelům
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Administrátoři mají plný přístup
        if request.user.role == 'admin':
            return True
        
        # Studenti mohou upravovat pouze své vlastní projekty
        if request.user.role == 'student':
            return obj.student == request.user
        
        # Učitelé mohou upravovat projekty, ke kterým jsou přiřazeni
        if request.user.role == 'teacher':
            return ProjectTeacher.objects.filter(
                project=obj, teacher=request.user
            ).exists()
        
        return False
    

class StudentCanAssignTeacherPermission(permissions.BasePermission):
    """
    Permission that allows:
    - Students to create teacher assignments for their own projects
    - Teachers to accept/reject assignments
    - Admins to have full access
    """
    def has_permission(self, request, view):
        # Read operations allowed for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated

        # POST requests (creating new assignments)
        if request.method == 'POST':
            # Admins can create any assignment
            if request.user.role == 'admin':
                return True
                
            # For students, check if they own the project
            if request.user.role == 'student':
                project_id = request.data.get('project')
                if project_id:
                    try:
                        project = Project.objects.get(id=project_id)
                        return project.student == request.user
                    except Project.DoesNotExist:
                        return False
                return False
                
            # Teachers can create assignments too (e.g., volunteering)
            return request.user.role == 'teacher'
            
        # For other methods (PUT, PATCH, DELETE), defer to has_object_permission
        return True
    
    def has_object_permission(self, request, view, obj):
        # Read operations always allowed
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Admins have full access
        if request.user.role == 'admin':
            return True
            
        # Students can only modify assignments for their own projects
        if request.user.role == 'student':
            return obj.project.student == request.user
            
        # Teachers can modify assignments where they are the teacher
        if request.user.role == 'teacher':
            return obj.teacher == request.user
            
        return False