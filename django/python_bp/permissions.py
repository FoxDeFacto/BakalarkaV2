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