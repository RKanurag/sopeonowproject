# SOPEONOW1 Django Project

A Django web application with reporting dashboard functionality.

## Local Development

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Migrations**
   ```bash
   python manage.py migrate
   ```

3. **Start Development Server**
   ```bash
   python manage.py runserver
   ```

4. **Access Application**
   - Open browser to: `http://127.0.0.1:8000/`

## Deployment to Railway

### Prerequisites
- Git repository
- Railway account (https://railway.app)

### Steps to Deploy

1. **Push to Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will automatically detect Django and deploy

3. **Set Environment Variables** (Optional)
   - In Railway dashboard, go to your project
   - Click "Variables" tab
   - Add: `DEBUG=False` for production

4. **Access Your Live Application**
   - Railway will provide a URL like: `https://your-app-name.railway.app`

## Project Structure

```
SOPEONOW1/
├── manage.py
├── requirements.txt
├── Procfile
├── runtime.txt
├── SOPEONOW1/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── Reporting/
│   ├── views.py
│   ├── urls.py
│   ├── models.py
│   ├── static/
│   └── templates/
└── media/
    └── management.json
```

## Features

- Dashboard with data visualization
- JSON data processing
- Static file serving
- Media file handling

## Notes

- Uses SQLite database (suitable for small applications)
- Static files handled by WhiteNoise
- Configured for Railway deployment
- Local functionality preserved
