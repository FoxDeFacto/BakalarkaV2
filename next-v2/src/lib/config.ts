// src/lib/config.ts
// Configuration file for the application

export const config = {
    // API configuration
    api: {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    },
    
    // Project status configuration
    projectStatus: {
      draft: {
        label: 'Draft',
        color: 'gray',
        description: 'Initial project state, not yet started',
      },
      in_progress: {
        label: 'In Progress',
        color: 'blue',
        description: 'Project is actively being worked on',
      },
      submitted: {
        label: 'Submitted',
        color: 'yellow',
        description: 'Project has been submitted for evaluation',
      },
      evaluated: {
        label: 'Evaluated',
        color: 'indigo',
        description: 'Project has been evaluated by teachers',
      },
      completed: {
        label: 'Completed',
        color: 'green',
        description: 'Project is fully completed and approved',
      },
    },
    
    // Project types
    projectTypes: {
      'SOČ': 'Středoškolská odborná činnost',
      'seminar': 'Seminární práce',
      'other': 'Jiný typ práce',
    },
    
    // File upload configurations
    fileUpload: {
      maxSize: 10 * 1024 * 1024, // 10MB
      acceptedTypes: {
        thumbnail: ['image/jpeg', 'image/png', 'image/gif'],
        document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        poster: ['image/jpeg', 'image/png', 'application/pdf'],
        video: ['video/mp4', 'video/webm', 'video/ogg'],
      },
    },
    
    // Default fields for students to choose from
    fields: [
      'Computer Science',
      'Biology',
      'Chemistry',
      'Physics',
      'Mathematics',
      'Social Sciences',
      'Humanities',
      'Engineering',
      'Arts',
      'Medicine',
      'Environmental Science',
      'Business',
      'Education',
      'Other',
    ],
  };
  