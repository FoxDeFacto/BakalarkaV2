from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
from django.conf import settings
from django.conf.urls.static import static
from . import views
from .file_upload import upload_file

# Create router for ViewSets
router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'project-teachers', views.ProjectTeacherViewSet)
router.register(r'milestones', views.MilestoneViewSet)
router.register(r'comments', views.CommentViewSet)
router.register(r'consultations', views.ConsultationViewSet)
router.register(r'evaluations', views.ProjectEvaluationViewSet)

# Define all URL patterns first (before creating schema_view)
urlpatterns = [
    # Public API endpoints (no authentication required)
    path('public/projects/', views.public_projects_list, name='public-projects-list'),
    path('public/projects/<int:pk>/', views.public_project_detail, name='public-project-detail'),
    path('visible-projects/', views.visible_projects_list, name='visible-projects-list'),
    
    # Authenticated API endpoints
    path('', include(router.urls)),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('upload/', upload_file, name='upload_file'),
]

# Create schema view for Swagger (after defining urlpatterns)
schema_view = get_schema_view(
    openapi.Info(
        title="Projects API",
        default_version='v1',
        description="API for student projects management",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="your-email@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

# Add Swagger URLs to urlpatterns
urlpatterns += [
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Add this at the end of the file to serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)