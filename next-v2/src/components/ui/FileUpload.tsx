// src/components/ui/FileUpload.tsx
import { useRef, useState } from 'react';
import { fileApi } from '@/lib/api';

interface FileUploadProps {
  label?: string;
  type: 'thumbnail' | 'document' | 'poster' | 'video';
  onUploadComplete: (filePath: string) => void;
  error?: string;
  accept?: string;
  maxSize?: number; // in MB
  currentFile?: string | null;
}

export function FileUpload({
  label,
  type,
  onUploadComplete,
  error,
  accept,
  maxSize = 10, // Default to 10MB
  currentFile,
}: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(
    currentFile ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${currentFile}` : null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Supported file types map
  const acceptMap = {
    thumbnail: 'image/jpeg,image/png,image/gif',
    document: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text',
    poster: 'image/jpeg,image/png,application/pdf',
    video: 'video/mp4,video/webm,video/ogg',
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
  
    const file = e.target.files[0];
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setUploadError(`File size must be less than ${maxSize}MB`);
      return;
    }
  
    setIsLoading(true);
    setUploadError(null);
  
    try {
      console.log('Uploading file:', file.name, 'type:', type);
      
      const result = await fileApi.uploadFile(file, type);
      console.log('Upload successful:', result);
      
      onUploadComplete(result.file_path);
      
      // Update preview if it's an image
      if (type === 'thumbnail' || type === 'poster') {
        setPreview(result.url);
      } else {
        setPreview(null);
      }
    } catch (err) {
      console.error('Upload error details:', err);
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      
      <div className="mt-1 flex flex-col items-center justify-center">
        {preview && (type === 'thumbnail' || type === 'poster') && (
          <div className="mb-3">
            <img src={preview} alt="Náhled" className="h-32 object-contain" />
          </div>
        )}
        
        {currentFile && type === 'document' && (
          <div className="mb-3 text-sm text-gray-600">
            Aktulní dokument: {currentFile.split('/').pop()}
          </div>
        )}
        
        {currentFile && type === 'video' && (
          <div className="mb-3 text-sm text-gray-600">
            Aktuální video: {currentFile.split('/').pop()}
          </div>
        )}
        
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor={`file-upload-${type}`}
            className="w-full flex flex-col items-center px-4 py-6 bg-white text-orange-500 rounded-lg shadow-lg tracking-wide uppercase border border-orange-500 cursor-pointer hover:bg-orange-500 hover:text-white"
          >
            <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
            </svg>
            <span className="mt-2 text-base leading-normal">
              {isLoading ? 'Nahrávání...' : 'Vyberte soubor'}
            </span>
            <input
              id={`file-upload-${type}`}
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept={accept || acceptMap[type]}
              disabled={isLoading}
            />
          </label>
        </div>
      </div>
      
      {(uploadError || error) && (
        <p className="mt-2 text-sm text-red-600">
          {uploadError || error}
        </p>
      )}
    </div>
  );
}