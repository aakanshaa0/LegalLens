# Legal Lens AI - Document Analysis System

A full-stack application for document analysis using RAG (Retrieval-Augmented Generation) with LangChain and Google's Gemini AI.

## Features

- **Document Upload & Processing**: Support for PDF, DOCX, TXT, and other document formats
- **AI-Powered Summarization**: Generate comprehensive summaries using Gemini AI
- **Intelligent Q&A**: Ask questions about your documents with RAG-enhanced responses
- **Vector Search**: Efficient document chunking and similarity search using embeddings
- **User Authentication**: Secure authentication with Clerk
- **Modern UI**: React frontend with Tailwind CSS and shadcn/ui components

## Architecture

- **Backend**: Node.js with Express
- **Frontend**: React with TypeScript and Vite
- **AI/ML**: Google Gemini AI for text generation and embeddings
- **RAG**: LangChain for document processing and vector search
- **Authentication**: Clerk for user management
- **File Processing**: Support for PDF, DOCX, TXT files

## Setup Instructions

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Google AI API Key** (Gemini)
3. **Clerk Account** for authentication

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Clerk Authentication
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # Google Generative AI
   GEMINI_API_KEY=your_gemini_api_key

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:8080
   ```

5. Test your Gemini API configuration:
   ```bash
   npm run test-gemini
   ```

6. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   VITE_API_URL=http://localhost:3001
   ```

5. Start the frontend development server:
   ```bash
   npm run dev
   ```

### Getting API Keys

#### Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env` file

#### Clerk Authentication

1. Sign up at [Clerk.dev](https://clerk.dev)
2. Create a new application
3. Copy the publishable key and secret key to your `.env` files

## Usage

1. **Upload Documents**: Upload PDF, DOCX, or TXT files through the web interface
2. **Generate Summaries**: Click "Generate Summary" to get AI-powered document analysis
3. **Ask Questions**: Use the Q&A interface to ask specific questions about your documents
4. **View Results**: Get contextual answers based on document content using RAG

## Key Improvements Made

### 1. Fixed Document Processing
- ✅ Fixed DOCX text extraction using mammoth library
- ✅ Improved error handling for unsupported file types
- ✅ Better text extraction pipeline

### 2. Enhanced RAG System
- ✅ Proper document chunking with RecursiveCharacterTextSplitter
- ✅ Improved vector store management with caching
- ✅ Better error handling for embedding failures
- ✅ Optimized chunk retrieval for Q&A

### 3. Improved AI Integration
- ✅ Better Gemini API configuration and error handling
- ✅ Enhanced prompt engineering for summaries and Q&A
- ✅ Fallback to extractive methods when AI fails
- ✅ Rate limiting and caching for API calls

### 4. Better Q&A System
- ✅ Uses RAG retrieval instead of full document content
- ✅ Improved extractive fallback with keyword detection
- ✅ Enhanced answer formatting and context handling
- ✅ Better error messages and user feedback

### 5. Frontend Improvements
- ✅ Fixed API response handling
- ✅ Better error display and user feedback
- ✅ Improved loading states and UI interactions

## Troubleshooting

### Common Issues

1. **"GEMINI_API_KEY not found"**
   - Ensure your `.env` file has the correct API key
   - Run `npm run test-gemini` to verify the configuration

2. **Document processing fails**
   - Check file format is supported (PDF, DOCX, TXT)
   - Ensure file is not corrupted
   - Check server logs for specific errors

3. **Q&A not working properly**
   - Verify document has been processed successfully
   - Check if RAG index was built (look for console logs)
   - Ensure Gemini API is working with the test script

4. **Authentication issues**
   - Verify Clerk keys are correctly set in both frontend and backend
   - Check CORS configuration in backend

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your backend `.env` file.

## API Endpoints

- `POST /documents/upload` - Upload a document
- `GET /documents` - Get all user documents
- `GET /documents/:id` - Get specific document
- `GET /documents/:id/summary` - Generate/get document summary
- `POST /documents/:id/ask` - Ask a question about the document
- `DELETE /documents/:id` - Delete a document

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.