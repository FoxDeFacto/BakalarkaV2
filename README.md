# Student Project Management Portal

A web portal for managing student research projects and seminar papers.

## Features

- Student project submission and management
- Teacher supervision and evaluation
- Project milestones tracking
- Consultation scheduling
- Project evaluations
- Public project showcase

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Django, Django REST Framework
- **Database**: PostgreSQL

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Python (3.9+)
- PostgreSQL (14+)

### Backend Setup

1. Clone the repository
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Create PostgreSQL database
6. Update database settings in `settings.py`
7. Run migrations: `python manage.py migrate`
8. Create a superuser: `python manage.py createsuperuser`
9. Run the development server: `python manage.py runserver`

### Frontend Setup

1. Navigate to the frontend directory: `cd next-v2`
2. Install dependencies: `npm install` or `yarn install`
3. Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Start the development server: `npm run dev` or `yarn dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

### Frontend Structure

- `/src/app`: Page components using Next.js App Router
- `/src/components`: Reusable UI components
- `/src/lib`: Utilities, API services, and types

### Backend Structure

- `/python_bp`: Django project main directory
- `/python_bp/models.py`: Database models
- `/python_bp/views.py`: API views
- `/python_bp/serializer.py`: API serializers

## Deployment

### Backend Deployment

1. Update `settings.py` for production:
   - Set `DEBUG = False`
   - Update `ALLOWED_HOSTS`
   - Set up proper database settings
   - Configure static files

2. Collect static files: `python manage.py collectstatic`

3. Set up a production-ready web server like Gunicorn or uWSGI

4. Configure a reverse proxy like Nginx

### Frontend Deployment

1. Build the Next.js application: `npm run build` or `yarn build`

2. Start the production server: `npm start` or `yarn start`

Alternatively, deploy to Vercel or other Next.js-compatible hosting services.

## Autor

- Ondřej Liška ([@FoxDeFacto](https://github.com/FoxDeFacto))