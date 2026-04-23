# EzStudy Frontend

## 📝 Description
EzStudy is an AI-powered learning platform (React + Vite) that provides an intelligent learning console with AI-driven insights, personalized study plans, and document analysis.

## ✨ Features
-- **AI Learning Assistant**: Interactive chatbot using Google Gemini as primary with Groq fallback
- **Document Analysis**: Upload and analyze PDF, DOC, PPT files with AI-powered summarization
-- **Chat History Persistence**: Save and restore conversations across sessions (localStorage)
-- **User Authentication**: Local auth modal (sample). Credentials are hashed client-side and only masked user info is stored in `localStorage`.
- **Chat History Persistence**: Save and restore conversations across sessions using MongoDB Atlas, with localStorage fallback
- **User Authentication**: Manual sign in/sign up and Google sign in/sign up backed by MongoDB Atlas
- **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS with special optimizations for mobile
- **Smooth Navigation**: Elegant 1.5-second smooth scroll animation when clicking EzStudy logo
- **Gradient UI Effects**: Beautiful gradient color effects on EzStudy branding throughout the app
- **Mobile-Optimized AI Console**: Enhanced chat input with mobile-friendly options menu (Upload, Library Context, Compact Chat)
- **Cambria Math Typography**: Elegant serif fonts applied to key UI labels for premium feel
- **Real-time Chat**: Interactive learning conversations with markdown support
- **File Upload & Library**: Support for multiple document formats with local file management

## 🔧 Technologies Used
- **Frontend**: React (Functional Components), Vite, Tailwind CSS, Lucide React icons
- **Routing**: React Router DOM for SPA navigation
- **Backend Integration**: Express.js API integration with Google Gemini (primary) and Groq fallback
- **AI/ML**: Groq API (Llama 3.3 70B model) for chat completions and document analysis
- **Authentication**: Custom auth backed by MongoDB Atlas and Google OAuth
- **Markdown Rendering**: React Markdown with GitHub Flavored Markdown support
- **Animations**: CSS animations (popOut, fadeIn, smooth scroll) and Tailwind transitions
- **State Management**: React Hooks (useState, useEffect, useRef, useContext)

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Setup Instructions (local dev)

1. Install frontend dependencies and start Vite (default port 5178):

```bash
cd EzStudyFrontend
npm install
npm run dev
```

2. Backend (separate terminal):

```bash
cd ../EzStudyBackend
npm install --legacy-peer-deps
npm start    # or `node server.js`
```

3. Environment variables (frontend): Create `EzStudyFrontend/.env` with:

```env
VITE_BACKEND_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

4. Important backend env variables (see backend README): `GROQ_API_KEY` (required), `MONGODB_URI` (required), `MONGODB_DB_NAME=EzStudyDB` (recommended), `GOOGLE_CLIENT_ID` (required for Google auth).

## 🚀 Usage
1. Open the app and sign in using the authentication modal or Google button.
2. Click "Go to AI Learning Console" to access the main interface.
3. Upload documents for AI analysis or start chatting with the AI assistant.
4. Create multiple chat sessions and switch between them.
5. Chat history is persisted in MongoDB Atlas per user id; localStorage is only used as a fallback cache.

## 🤝 Contribution
We welcome contributions! Here's how you can contribute:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes and commit them
4. Push your changes to your fork
5. Submit a pull request

---

Built with ❤️ for the EzStudy learning platform. Updated as of January 21, 2026.

