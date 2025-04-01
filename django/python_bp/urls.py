from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'project-teachers', views.ProjectTeacherViewSet)
router.register(r'milestones', views.MilestoneViewSet)
router.register(r'comments', views.CommentViewSet)
router.register(r'consultations', views.ConsultationViewSet)
router.register(r'evaluations', views.ProjectEvaluationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]