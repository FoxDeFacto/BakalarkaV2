from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Project, ProjectTeacher, Milestone, Comment, Consultation, ProjectEvaluation


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'date_joined', 'created_at', 'updated_at']
        read_only_fields = ['id', 'date_joined', 'created_at', 'updated_at']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'role']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Hesla se neshodují."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role']
        )
        return user


class ProjectTeacherSerializer(serializers.ModelSerializer):
    teacher_name = serializers.ReadOnlyField(source='teacher.username')
    role_display = serializers.ReadOnlyField(source='get_role_display')

    class Meta:
        model = ProjectTeacher
        fields = ['id', 'project', 'teacher', 'teacher_name', 'role', 'role_display', 'accepted', 'assigned_at', 'updated_at']
        read_only_fields = ['id', 'assigned_at', 'updated_at']


class MilestoneSerializer(serializers.ModelSerializer):
    status_display = serializers.ReadOnlyField(source='get_status_display')

    class Meta:
        model = Milestone
        fields = ['id', 'project', 'title', 'description', 'completion', 'deadline', 'status', 'status_display', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    user_role = serializers.ReadOnlyField(source='user.role')

    class Meta:
        model = Comment
        fields = ['id', 'project', 'user', 'user_name', 'user_role', 'comment_text', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ConsultationSerializer(serializers.ModelSerializer):
    teacher_name = serializers.ReadOnlyField(source='teacher.username')

    class Meta:
        model = Consultation
        fields = ['id', 'project', 'teacher', 'teacher_name', 'notes', 'consultation_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectEvaluationSerializer(serializers.ModelSerializer):
    teacher_name = serializers.ReadOnlyField(source='teacher.username')

    class Meta:
        model = ProjectEvaluation
        fields = ['id', 'project', 'teacher', 'teacher_name', 'evaluation', 'score', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectDetailSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.username')
    status_display = serializers.ReadOnlyField(source='get_status_display')
    type_display = serializers.ReadOnlyField(source='get_type_of_work_display')
    teachers = ProjectTeacherSerializer(many=True, read_only=True)
    milestones = MilestoneSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    consultations = ConsultationSerializer(many=True, read_only=True)
    evaluations = ProjectEvaluationSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'year', 'field', 'keywords', 
            'student', 'student_name', 'thumbnail', 'document', 
            'poster', 'video', 'public_visibility', 'status', 
            'status_display', 'type_of_work', 'type_display', 
            'created_at', 'updated_at', 'teachers', 'milestones', 
            'comments', 'consultations', 'evaluations'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectListSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.username')
    status_display = serializers.ReadOnlyField(source='get_status_display')
    type_display = serializers.ReadOnlyField(source='get_type_of_work_display')

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'year', 'field', 'keywords',
            'student', 'student_name', 'thumbnail', 'status',
            'status_display', 'type_of_work', 'type_display',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            'title', 'description', 'year', 'field', 'keywords',
            'student', 'thumbnail', 'document', 'poster', 'video',
            'public_visibility', 'status', 'type_of_work'
        ]

    def validate_year(self, value):
        import datetime
        current_year = datetime.datetime.now().year
        if value < 2000 or value > current_year + 1:
            raise serializers.ValidationError(f"Rok musí být mezi 2000 a {current_year + 1}")
        return value

# Přidejte tento nový serializér do souboru serializer.py

class ProjectTeacherSimpleSerializer(serializers.ModelSerializer):
    teacher_name = serializers.ReadOnlyField(source='teacher.username')
    role_display = serializers.ReadOnlyField(source='get_role_display')

    class Meta:
        model = ProjectTeacher
        fields = ['teacher', 'teacher_name', 'role', 'role_display']


class ProjectWithTeachersSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.username')
    status_display = serializers.ReadOnlyField(source='get_status_display')
    type_display = serializers.ReadOnlyField(source='get_type_of_work_display')
    teachers = ProjectTeacherSimpleSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'year', 'field', 'keywords',
            'student', 'student_name', 'thumbnail', 'status',
            'status_display', 'type_of_work', 'type_display',
            'created_at', 'updated_at', 'teachers'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']