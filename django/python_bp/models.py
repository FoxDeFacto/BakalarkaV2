from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone


class User(AbstractUser):
    """
    Rozšířený uživatelský model pro studenty a učitele
    """
    USER_ROLES = (
        ('student', 'Student'),
        ('teacher', 'Učitel'),
        ('admin', 'Administrátor'),
    )
    
    role = models.CharField(max_length=10, choices=USER_ROLES, default='student')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Project(models.Model):
    """
    Model pro studentské projekty a seminární práce
    """
    STATUS_CHOICES = (
        ('draft', 'Koncept'),
        ('in_progress', 'Rozpracováno'),
        ('submitted', 'Odevzdáno'),
        ('evaluated', 'Hodnoceno'),
        ('completed', 'Dokončeno'),
    )
    
    WORK_TYPES = (
        ('SOČ', 'Středoškolská odborná činnost'),
        ('seminar', 'Seminární práce'),
        ('other', 'Jiný typ práce'),
    )
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    year = models.IntegerField()
    field = models.CharField(max_length=100)
    keywords = ArrayField(models.CharField(max_length=100))
    student = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='student_projects')
    thumbnail = models.CharField(max_length=255, blank=True, null=True)
    document = models.CharField(max_length=255, blank=True, null=True)
    poster = models.CharField(max_length=255, blank=True, null=True)
    video = models.CharField(max_length=255, blank=True, null=True)
    public_visibility = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    type_of_work = models.CharField(max_length=20, choices=WORK_TYPES, default='SOČ')
    deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'projects'
    
    def __str__(self):
        return f"{self.title} ({self.type_of_work}, {self.year})"


class ProjectTeacher(models.Model):
    """
    Vazební tabulka pro propojení projektů a učitelů s rolemi
    """
    TEACHER_ROLES = (
        ('supervisor', 'Vedoucí práce'),
        ('consultant', 'Konzultant'),
        ('opponent', 'Oponent'),
    )
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='teachers')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='supervised_projects')
    role = models.CharField(max_length=20, choices=TEACHER_ROLES)
    accepted = models.BooleanField(default=False)
    assigned_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'project_teachers'
    
    def __str__(self):
        return f"{self.teacher.username} - {self.project.title} ({self.get_role_display()})"


class Milestone(models.Model):
    """
    Milníky pro sledování postupu projektů
    """
    STATUS_CHOICES = (
        ('not_started', 'Nezahájeno'),
        ('in_progress', 'Rozpracováno'),
        ('completed', 'Dokončeno'),
        ('overdue', 'Po termínu'),
    )
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=255)
    description = models.TextField()
    completion = models.IntegerField(null=True, blank=True)
    deadline = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'milestones'
    
    def __str__(self):
        return f"{self.title} - {self.project.title}"


class Comment(models.Model):
    """
    Komentáře k projektům od studentů a učitelů
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='comments')
    comment_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'comments'
    
    def __str__(self):
        return f"Komentář od {self.user.username} k projektu {self.project.title}"


class Consultation(models.Model):
    """
    Záznamy o konzultacích k projektům
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='consultations')
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='consultations')
    notes = models.TextField(null=True, blank=True)
    consultation_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'consultations'
    
    def __str__(self):
        return f"Konzultace projektu {self.project.title} dne {self.consultation_date.strftime('%d.%m.%Y')}"


class ProjectEvaluation(models.Model):
    """
    Hodnocení projektů učiteli
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='evaluations')
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='evaluations')
    evaluation = models.TextField()
    score = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'project_evaluations'
    
    def __str__(self):
        return f"Hodnocení projektu {self.project.title} od {self.teacher.username}"