import os
import uuid
from django.conf import settings
from rest_framework import viewsets, parsers, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, parser_classes, permission_classes


def get_file_path(instance, filename):
    """
    Generuje unikátní cestu pro nahrané soubory.
    """
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    
    if instance == 'thumbnails':
        return os.path.join('thumbnails', filename)
    elif instance == 'documents':
        return os.path.join('documents', filename)
    elif instance == 'posters':
        return os.path.join('posters', filename)
    elif instance == 'videos':
        return os.path.join('videos', filename)
    return filename


@api_view(['POST'])
@parser_classes([parsers.MultiPartParser, parsers.FormParser])
@permission_classes([IsAuthenticated])
def upload_file(request):
    """
    API view pro nahrávání souborů.
    Podporuje nahrávání obrázků (thumbnail, poster), dokumentů a videí.
    """
    if 'file' not in request.FILES:
        return Response({'error': 'Žádný soubor nebyl nahrán'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    file_type = request.data.get('type', '')
    
    # Kontrola velikosti souboru
    if file.size > settings.MAX_UPLOAD_SIZE:
        return Response(
            {'error': f'Soubor je příliš velký. Maximální povolená velikost je {settings.MAX_UPLOAD_SIZE / (1024 * 1024)} MB.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Kontrola typu souboru
    valid_file_types = {
        'thumbnail': ['jpg', 'jpeg', 'png', 'gif'],
        'document': ['pdf', 'doc', 'docx', 'odt'],
        'poster': ['jpg', 'jpeg', 'png', 'pdf'],
        'video': ['mp4', 'webm', 'ogg']
    }
    
    if file_type not in valid_file_types:
        return Response({'error': 'Neplatný typ souboru'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Kontrola přípony souboru
    ext = file.name.split('.')[-1].lower()
    if ext not in valid_file_types[file_type]:
        return Response(
            {'error': f'Neplatná přípona souboru. Povolené přípony jsou: {", ".join(valid_file_types[file_type])}.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Uložení souboru
    file_path = None
    if file_type == 'thumbnail':
        file_path = get_file_path('thumbnails', file.name)
        path = os.path.join(settings.MEDIA_ROOT, file_path)
    elif file_type == 'document':
        file_path = get_file_path('documents', file.name)
        path = os.path.join(settings.MEDIA_ROOT, file_path)
    elif file_type == 'poster':
        file_path = get_file_path('posters', file.name)
        path = os.path.join(settings.MEDIA_ROOT, file_path)
    elif file_type == 'video':
        file_path = get_file_path('videos', file.name)
        path = os.path.join(settings.MEDIA_ROOT, file_path)
    
    # Vytvoření adresáře, pokud neexistuje
    os.makedirs(os.path.dirname(path), exist_ok=True)
    
    # Zápis souboru
    with open(path, 'wb+') as destination:
        for chunk in file.chunks():
            destination.write(chunk)
    
    # Vrácení cesty k souboru
    file_url = f"{settings.MEDIA_URL.rstrip('/')}/{file_path}"
    return Response({'file_path': file_path, 'url': file_url}, status=status.HTTP_201_CREATED)