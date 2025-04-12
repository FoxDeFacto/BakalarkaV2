from rest_framework import viewsets, permissions, filters, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import User, Project, ProjectTeacher, Milestone, Comment, Consultation, ProjectEvaluation
from .serializer import (
    UserSerializer, UserCreateSerializer, ProjectListSerializer, 
    ProjectDetailSerializer, ProjectCreateUpdateSerializer, ProjectTeacherSerializer,
    MilestoneSerializer, CommentSerializer, ConsultationSerializer, ProjectEvaluationSerializer,ProjectWithTeachersSerializer
)
from .permissions import IsTeacherOrAdminOrReadOnly, IsTeacherForProject, IsOwnerOrTeacherOrReadOnly, StudentCanAssignTeacherPermission



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


# Public API endpoints (no authentication required)
@swagger_auto_schema(
    method='get',
    operation_description="List all public projects (where public_visibility=True)",
    operation_summary="Get list of all public projects",
    manual_parameters=[
        openapi.Parameter('year', openapi.IN_QUERY, description="Filter by year", type=openapi.TYPE_INTEGER),
        openapi.Parameter('field', openapi.IN_QUERY, description="Filter by field of study", type=openapi.TYPE_STRING),
        openapi.Parameter('status', openapi.IN_QUERY, description="Filter by status", type=openapi.TYPE_STRING),
        openapi.Parameter('search', openapi.IN_QUERY, description="Search in title, description, and keywords", type=openapi.TYPE_STRING),
        openapi.Parameter('ordering', openapi.IN_QUERY, description="Order results by specified fields (e.g. -year,title)", type=openapi.TYPE_STRING),
    ],
    responses={200: ProjectListSerializer(many=True)}
)
@api_view(['GET'])
@permission_classes([AllowAny])
def public_projects_list(request):
    """
    List all public projects (where public_visibility=True)
    """
    projects = Project.objects.filter(public_visibility=True, deleted=False)
    
    # Apply filters if provided
    year = request.query_params.get('year', None)
    if year:
        projects = projects.filter(year=year)
        
    field = request.query_params.get('field', None)
    if field:
        projects = projects.filter(field=field)
    
    status_param = request.query_params.get('status', None)
    if status_param:
        projects = projects.filter(status=status_param)
    
    type_of_work = request.query_params.get('type_of_work', None)
    if type_of_work:
        projects = projects.filter(type_of_work=type_of_work)
    
    # Apply search if provided
    search = request.query_params.get('search', None)
    if search:
        projects = projects.filter(
            Q(title__icontains=search) | 
            Q(description__icontains=search) | 
            Q(keywords__contains=[search])
        )
    
    # Apply ordering
    ordering = request.query_params.get('ordering', '-year,title')
    if ordering:
        ordering_fields = ordering.split(',')
        projects = projects.order_by(*ordering_fields)
    
    # Apply pagination
    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    result_page = paginator.paginate_queryset(projects, request)
    
    serializer = ProjectListSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


@swagger_auto_schema(
    method='get',
    operation_description="Retrieve a public project by id",
    operation_summary="Get public project details by ID",
    responses={
        200: ProjectDetailSerializer(),
        404: "Project not found or not public"
    }
)
@api_view(['GET'])
@permission_classes([AllowAny])
def public_project_detail(request, pk):
    """
    Retrieve a public project by id
    """
    try:
        project = Project.objects.get(pk=pk, public_visibility=True, deleted=False)
    except Project.DoesNotExist:
        return Response({"detail": "Project not found or not public."}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = ProjectDetailSerializer(project)
    return Response(serializer.data)


@swagger_auto_schema(
    method='get',
    operation_description="List all projects visible to current user (own projects + public projects)",
    operation_summary="Get list of all visible projects",
    manual_parameters=[
        openapi.Parameter('year', openapi.IN_QUERY, description="Filter by year", type=openapi.TYPE_INTEGER),
        openapi.Parameter('field', openapi.IN_QUERY, description="Filter by field of study", type=openapi.TYPE_STRING),
        openapi.Parameter('status', openapi.IN_QUERY, description="Filter by status", type=openapi.TYPE_STRING),
        openapi.Parameter('search', openapi.IN_QUERY, description="Search in title, description, and keywords", type=openapi.TYPE_STRING),
        openapi.Parameter('type_of_work', openapi.IN_QUERY, description="Filter by type of work", type=openapi.TYPE_STRING),
        openapi.Parameter('keywords', openapi.IN_QUERY, description="Filter by keywords (comma separated)", type=openapi.TYPE_STRING),
        openapi.Parameter('ordering', openapi.IN_QUERY, description="Order results by specified fields (e.g. -year,title)", type=openapi.TYPE_STRING),
    ],
    responses={200: ProjectWithTeachersSerializer(many=True)}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def visible_projects_list(request):
    """
    List all projects visible to current user (own projects + public projects)
    """
    user = request.user
    
    # Get projects based on user role
    if user.role == 'admin':
        # Administrators see all non-deleted projects
        projects = Project.objects.filter(deleted=False)
    elif user.role == 'teacher':
        # Teachers see projects they're assigned to + public projects
        teacher_projects = ProjectTeacher.objects.filter(teacher=user).values_list('project_id', flat=True)
        projects = Project.objects.filter(
            Q(id__in=teacher_projects) | Q(public_visibility=True),
            deleted=False
        )
    else:  # student or any other role
        # Students see their own projects + public projects
        projects = Project.objects.filter(
            Q(student=user) | Q(public_visibility=True),
            deleted=False
        )
    
    # Apply filters if provided
    year = request.query_params.get('year', None)
    if year:
        projects = projects.filter(year=year)
        
    field = request.query_params.get('field', None)
    if field:
        projects = projects.filter(field=field)
    
    status_param = request.query_params.get('status', None)
    if status_param:
        projects = projects.filter(status=status_param)
    
    type_of_work = request.query_params.get('type_of_work', None)
    if type_of_work:
        projects = projects.filter(type_of_work=type_of_work)
    
    # Apply search if provided
    search = request.query_params.get('search', None)
    if search:
        projects = projects.filter(
            Q(title__icontains=search) | 
            Q(description__icontains=search) | 
            Q(keywords__contains=[search])
        )
    
    # Filter by keywords
    keywords = request.query_params.get('keywords', None)
    if keywords:
        keyword_list = keywords.split(',')
        for keyword in keyword_list:
            projects = projects.filter(keywords__contains=[keyword.strip()])
    
    # Apply ordering
    ordering = request.query_params.get('ordering', '-year,title')
    if ordering:
        ordering_fields = ordering.split(',')
        projects = projects.order_by(*ordering_fields)
    
    # Předběžně načteme učitele projektů (optimalizace dotazů)
    projects = projects.prefetch_related('teachers__teacher')
    
    # Apply pagination
    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    result_page = paginator.paginate_queryset(projects, request)
    
    serializer = ProjectWithTeachersSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing projects. 
    
    Requires authentication. Access is controlled based on user roles:
    - Admin: sees all non-deleted projects
    - Teacher: sees projects they're assigned to
    - Student: sees their own projects 
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['year', 'field', 'status', 'type_of_work']
    search_fields = ['title', 'description', 'keywords']
    ordering_fields = ['title', 'year', 'created_at', 'updated_at']
    ordering = ['-year', 'title']

    def get_permissions(self):
        """
        For authenticated endpoints, apply appropriate permissions.
        Unauthenticated users have no access to these endpoints - they must use public endpoints instead.
        """
        return [IsAuthenticated(), IsOwnerOrTeacherOrReadOnly()]

    def get_queryset(self):
        """
        Return projects based on user role
        - Admin: all non-deleted projects
        - Teacher: only projects they're assigned to
        - Student: only their own projects
        """
        user = self.request.user
        
        # Force evaluation of user role to ensure it's properly detected
        user_role = getattr(user, 'role', None)
        
        if user_role == 'admin':
            # Administrators see all non-deleted projects
            queryset = Project.objects.filter(deleted=False)
        elif user_role == 'teacher':
            # Teachers see only projects where they're assigned
            teacher_projects = ProjectTeacher.objects.filter(teacher=user).values_list('project_id', flat=True)
            queryset = Project.objects.filter(
                id__in=teacher_projects,
                deleted=False
            )
        else:  # student or any other role
            # Students see only their own projects
            queryset = Project.objects.filter(
                student=user,
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
    
    @swagger_auto_schema(
        method='post',
        operation_description="Set project visibility (public or private)",
        operation_summary="Change project visibility status",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['public_visibility'],
            properties={
                'public_visibility': openapi.Schema(
                    type=openapi.TYPE_BOOLEAN,
                    description='Boolean value to set project visibility'
                )
            }
        ),
        responses={
            200: ProjectDetailSerializer(),
            400: "Missing 'public_visibility' parameter",
            403: "Only project teachers or administrators can change project visibility"
        }
    )
    @action(detail=True, methods=['post'])
    def set_visibility(self, request, pk=None):
        """
        Action to set project visibility (public or private)
        Only teachers associated with the project or admins can change this
        """
        project = self.get_object()
        user = request.user
        
        # Check if user is admin or a teacher assigned to this project
        is_admin = user.role == 'admin'
        is_project_teacher = user.role == 'teacher' and ProjectTeacher.objects.filter(
            project=project, teacher=user
        ).exists()
        
        if not (is_admin or is_project_teacher):
            return Response(
                {"detail": "Only project teachers or administrators can change project visibility."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the visibility parameter
        visibility = request.data.get('public_visibility')
        if visibility is None:
            return Response(
                {"detail": "Missing 'public_visibility' parameter."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the project visibility
        project.public_visibility = visibility
        project.save()
        
        serializer = self.get_serializer(project)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        method='post',
        operation_description="Submit a project (changes status to 'submitted')",
        operation_summary="Submit a project",
        responses={
            200: ProjectDetailSerializer(),
            400: "Cannot submit project without attached document",
            403: "You don't have permission to submit this project"
        }
    )
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Action for submitting a project"""
        project = self.get_object()
        
        # Check if user is the project owner
        if request.user.role == 'student' and project.student != request.user:
            return Response({"detail": "You don't have permission to submit this project."}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Check if all required attachments are present
        if not project.document:
            return Response({"detail": "Cannot submit project without attached document."}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        project.status = 'submitted'
        project.save()
        
        serializer = self.get_serializer(project)
        return Response(serializer.data)


class ProjectTeacherViewSet(viewsets.ModelViewSet):
    queryset = ProjectTeacher.objects.all()
    serializer_class = ProjectTeacherSerializer
    permission_classes = [permissions.IsAuthenticated, StudentCanAssignTeacherPermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['project', 'teacher', 'role', 'accepted']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ProjectTeacher.objects.all()
        elif user.role == 'teacher':
            # Teachers see only relationships where they are teachers
            return ProjectTeacher.objects.filter(teacher=user)
        else:  # student
            # Students see only teachers on their projects
            student_projects = Project.objects.filter(student=user).values_list('id', flat=True)
            return ProjectTeacher.objects.filter(project_id__in=student_projects)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, pk=None):
        """Action for a teacher to accept their role"""
        project_teacher = self.get_object()
        
        # Only the assigned teacher can accept the role
        if request.user.id != project_teacher.teacher.id:
            return Response({"detail": "Only the assigned teacher can accept this role."}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        project_teacher.accepted = True
        project_teacher.save()
        
        serializer = self.get_serializer(project_teacher)
        return Response(serializer.data)

    @swagger_auto_schema(
    method='post',
    operation_description="Decline a teacher assignment for a project",
    operation_summary="Decline teacher assignment",
    responses={
        200: openapi.Response(
            description="Assignment declined",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'detail': openapi.Schema(
                        type=openapi.TYPE_STRING,
                        description='Status message'
                    )
                }
            )
        ),
        403: "Only the assigned teacher can decline this role",
        404: "Assignment not found"
    }
    ) 
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def decline(self, request, pk=None):
        """Action for a teacher to decline their role"""
        project_teacher = self.get_object()
        
        # Only the assigned teacher can decline the role
        if request.user.id != project_teacher.teacher.id:
            return Response({"detail": "Only the assigned teacher can decline this role."}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Delete the assignment instead of just marking it as declined
        project_teacher.delete()
        
        return Response({"detail": "Assignment declined and removed."}, 
                      status=status.HTTP_200_OK)


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
            # Učitelé vidí pouze milníky projektů, kde jsou vedoucí/konzultanti
            teacher_projects = ProjectTeacher.objects.filter(teacher=user).values_list('project_id', flat=True)
            return Milestone.objects.filter(project_id__in=teacher_projects)
        else:  # student
            # Studenti vidí pouze milníky na svých projektech
            student_projects = Project.objects.filter(student=user).values_list('id', flat=True)
            return Milestone.objects.filter(project_id__in=student_projects)

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
                id__in=teacher_projects,
                deleted=False
            ).values_list('id', flat=True)
        else:  # student
            visible_projects = Project.objects.filter(
                student=user,
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
            # Učitelé vidí konzultace, kde jsou vedoucími
            teacher_projects = ProjectTeacher.objects.filter(teacher=user).values_list('project_id', flat=True)
            return Consultation.objects.filter(
                Q(teacher=user) | 
                Q(project_id__in=teacher_projects)
            )
        else:  # student
            # Studenti vidí konzultace pouze svých projektů
            student_projects = Project.objects.filter(student=user).values_list('id', flat=True)
            return Consultation.objects.filter(project_id__in=student_projects)

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
            # Učitelé vidí hodnocení projektů, kde jsou vedoucí/konzultanti/oponenti
            teacher_projects = ProjectTeacher.objects.filter(teacher=user).values_list('project_id', flat=True)
            return ProjectEvaluation.objects.filter(
                Q(teacher=user) | 
                Q(project_id__in=teacher_projects)
            )
        else:  # student
            # Studenti vidí hodnocení pouze svých projektů
            student_projects = Project.objects.filter(student=user).values_list('id', flat=True)
            return ProjectEvaluation.objects.filter(project_id__in=student_projects)

    def perform_create(self, serializer):
        if self.request.user.role == 'teacher':
            serializer.save(teacher=self.request.user)
        else:
            serializer.save()