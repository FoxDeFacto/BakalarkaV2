from rest_framework import viewsets, permissions, filters, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import User, Project, ProjectTeacher, Milestone, Comment, Consultation, ProjectEvaluation
from .serializer import (
    UserSerializer, UserCreateSerializer, ProjectListSerializer, 
    ProjectDetailSerializer, ProjectCreateUpdateSerializer, ProjectTeacherSerializer,
    MilestoneSerializer, CommentSerializer, ConsultationSerializer, ProjectEvaluationSerializer
)
from .permissions import IsTeacherOrAdminOrReadOnly, IsTeacherForProject, IsOwnerOrTeacherOrReadOnly



class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated(), IsTeacherOrAdminOrReadOnly()]

    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        return queryset

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class ProjectViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['year', 'field', 'status', 'type_of_work']
    search_fields = ['title', 'description', 'keywords']
    ordering_fields = ['title', 'year', 'created_at', 'updated_at']
    ordering = ['-year', 'title']

    def get_permissions(self):
        if self.action in ['list', 'retrieve'] and not self.request.user.is_authenticated:
            # Allow anonymous access for listing and retrieving projects
            return [AllowAny()]
        return [IsAuthenticated(), IsOwnerOrTeacherOrReadOnly()]

    def get_queryset(self):
        # For anonymous users, only return public projects
        if not self.request.user.is_authenticated:
            return Project.objects.filter(public_visibility=True, deleted=False)
        
        # For authenticated users, apply role-based filtering
        user = self.request.user
        if user.role == 'admin':
            # Administrators see all non-deleted projects
            queryset = Project.objects.filter(deleted=False)
        elif user.role == 'teacher':
            # Teachers see projects where they're assigned and public projects
            teacher_projects = ProjectTeacher.objects.filter(teacher=user).values_list('project_id', flat=True)
            queryset = Project.objects.filter(
                Q(id__in=teacher_projects) | Q(public_visibility=True),
                deleted=False
            )
        else:  # student
            # Students see their own projects and public projects
            queryset = Project.objects.filter(
                Q(student=user) | Q(public_visibility=True),
                deleted=False
            )
        
        # Filter by keywords
        keywords = self.request.query_params.get('keywords', None)
        if keywords:
            keyword_list = keywords.split(',')
            for keyword in keyword_list:
                queryset = queryset.filter(keywords__contains=[keyword.strip()])
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProjectCreateUpdateSerializer
        return ProjectDetailSerializer
    
    # Rest of your methods remain the same
    def perform_create(self, serializer):
        # If created by a student, automatically assign them as author
        if self.request.user.role == 'student' and not serializer.validated_data.get('student'):
            serializer.save(student=self.request.user)
        else:
            serializer.save()
    
    def perform_destroy(self, instance):
        # Soft delete - only mark as deleted
        instance.deleted = True
        instance.save()
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def submit(self, request, pk=None):
        """Action for submitting a project"""
        project = self.get_object()
        
        # Check if user is the project owner
        if request.user.role == 'student' and project.student != request.user:
            return Response({"detail": "Nemáte oprávnění odevzdat tento projekt."}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Check if all required attachments are present
        if not project.document:
            return Response({"detail": "Nelze odevzdat projekt bez přiloženého dokumentu."}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        project.status = 'submitted'
        project.save()
        
        serializer = self.get_serializer(project)
        return Response(serializer.data)


class ProjectTeacherViewSet(viewsets.ModelViewSet):
    queryset = ProjectTeacher.objects.all()
    serializer_class = ProjectTeacherSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['project', 'teacher', 'role', 'accepted']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ProjectTeacher.objects.all()
        elif user.role == 'teacher':
            # Učitelé vidí všechny vazby, kde jsou jako učitelé, a vazby na veřejné projekty
            teacher_projects = ProjectTeacher.objects.filter(teacher=user).values_list('project_id', flat=True)
            public_projects = Project.objects.filter(public_visibility=True).values_list('id', flat=True)
            return ProjectTeacher.objects.filter(
                Q(teacher=user) | Q(project_id__in=public_projects)
            )
        else:  # student
            # Studenti vidí učitele na jejich projektech a na veřejných projektech
            student_projects = Project.objects.filter(student=user).values_list('id', flat=True)
            public_projects = Project.objects.filter(public_visibility=True).values_list('id', flat=True)
            return ProjectTeacher.objects.filter(
                Q(project_id__in=student_projects) | Q(project_id__in=public_projects)
            )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, pk=None):
        """Akce pro přijetí role učitelem"""
        project_teacher = self.get_object()
        
        # Pouze učitel, který je přiřazen, může přijmout roli
        if request.user.id != project_teacher.teacher.id:
            return Response({"detail": "Pouze přiřazený učitel může přijmout roli."}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        project_teacher.accepted = True
        project_teacher.save()
        
        serializer = self.get_serializer(project_teacher)
        return Response(serializer.data)


class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherForProject]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['project', 'status']
    ordering_fields = ['deadline', 'created_at']
    ordering = ['deadline']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Milestone.objects.all()
        elif user.role == 'teacher':
            # Učitelé vidí milníky projektů, kde jsou vedoucí/konzultanti, a veřejných projektů
            teacher_projects = ProjectTeacher.objects.filter(teacher=user).values_list('project_id', flat=True)
            public_projects = Project.objects.filter(public_visibility=True).values_list('id', flat=True)
            return Milestone.objects.filter(
                Q(project_id__in=teacher_projects) | Q(project_id__in=public_projects)
            )
        else:  # student
            # Studenti vidí milníky na svých projektech a na veřejných projektech
            student_projects = Project.objects.filter(student=user).values_list('id', flat=True)
            public_projects = Project.objects.filter(public_visibility=True).values_list('id', flat=True)
            return Milestone.objects.filter(
                Q(project_id__in=student_projects) | Q(project_id__in=public_projects)
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_completion(self, request, pk=None):
        """Akce pro aktualizaci stavu dokončení milníku"""
        milestone = self.get_object()
        project = milestone.project
        
        # Kontrola, zda je uživatel student, který vlastní projekt, nebo učitel projektu
        is_owner = request.user.role == 'student' and project.student == request.user
        is_teacher = request.user.role == 'teacher' and ProjectTeacher.objects.filter(
            project=project, teacher=request.user
        ).exists()
        
        if not (is_owner or is_teacher or request.user.role == 'admin'):
            return Response({"detail": "Nemáte oprávnění aktualizovat tento milník."}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        completion = request.data.get('completion', None)
        if completion is not None:
            try:
                completion_value = int(completion)
                if completion_value < 0 or completion_value > 100:
                    return Response({"detail": "Dokončení musí být mezi 0 a 100 procenty."}, 
                                  status=status.HTTP_400_BAD_REQUEST)
                
                milestone.completion = completion_value
                
                # Aktualizace stavu podle dokončení
                if completion_value == 100:
                    milestone.status = 'completed'
                elif completion_value > 0:
                    milestone.status = 'in_progress'
                
                milestone.save()
                serializer = self.get_serializer(milestone)
                return Response(serializer.data)
            
            except ValueError:
                return Response({"detail": "Dokončení musí být celé číslo."}, 
                              status=status.HTTP_400_BAD_REQUEST)
        
        return Response({"detail": "Chybí parametr 'completion'."}, 
                      status=status.HTTP_400_BAD_REQUEST)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['project', 'user']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Comment.objects.all()
        
        # Získání projektů, ke kterým má uživatel přístup
        if user.role == 'teacher':
            teacher_projects = ProjectTeacher.objects.filter(teacher=user).values_list('project_id', flat=True)
            visible_projects = Project.objects.filter(
                Q(id__in=teacher_projects) | Q(public_visibility=True),
                deleted=False
            ).values_list('id', flat=True)
        else:  # student
            visible_projects = Project.objects.filter(
                Q(student=user) | Q(public_visibility=True),
                deleted=False
            ).values_list('id', flat=True)
        
        return Comment.objects.filter(project_id__in=visible_projects)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = Consultation.objects.all()
    serializer_class = ConsultationSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherForProject]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['project', 'teacher']
    ordering_fields = ['consultation_date', 'created_at']
    ordering = ['-consultation_date']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Consultation.objects.all()
        elif user.role == 'teacher':
            # Učitelé vidí konzultace, kde jsou vedoucími, a konzultace veřejných projektů
            teacher_projects = ProjectTeacher.objects.filter(teacher=user).values_list('project_id', flat=True)
            public_projects = Project.objects.filter(public_visibility=True).values_list('id', flat=True)
            return Consultation.objects.filter(
                Q(teacher=user) | 
                Q(project_id__in=teacher_projects) | 
                Q(project_id__in=public_projects)
            )
        else:  # student
            # Studenti vidí konzultace svých projektů a veřejných projektů
            student_projects = Project.objects.filter(student=user).values_list('id', flat=True)
            public_projects = Project.objects.filter(public_visibility=True).values_list('id', flat=True)
            return Consultation.objects.filter(
                Q(project_id__in=student_projects) | 
                Q(project_id__in=public_projects)
            )

    def perform_create(self, serializer):
        if self.request.user.role == 'teacher':
            serializer.save(teacher=self.request.user)
        else:
            serializer.save()


class ProjectEvaluationViewSet(viewsets.ModelViewSet):
    queryset = ProjectEvaluation.objects.all()
    serializer_class = ProjectEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherForProject]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['project', 'teacher']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ProjectEvaluation.objects.all()
        elif user.role == 'teacher':
            # Učitelé vidí hodnocení projektů, kde jsou vedoucí/konzultanti/oponenti, a veřejné hodnocení
            teacher_projects = ProjectTeacher.objects.filter(teacher=user).values_list('project_id', flat=True)
            public_projects = Project.objects.filter(public_visibility=True).values_list('id', flat=True)
            return ProjectEvaluation.objects.filter(
                Q(teacher=user) | 
                Q(project_id__in=teacher_projects) | 
                Q(project_id__in=public_projects)
            )
        else:  # student
            # Studenti vidí hodnocení svých projektů a veřejných projektů
            student_projects = Project.objects.filter(student=user).values_list('id', flat=True)
            public_projects = Project.objects.filter(public_visibility=True).values_list('id', flat=True)
            return ProjectEvaluation.objects.filter(
                Q(project_id__in=student_projects) | 
                Q(project_id__in=public_projects)
            )

    def perform_create(self, serializer):
        if self.request.user.role == 'teacher':
            serializer.save(teacher=self.request.user)
        else:
            serializer.save()