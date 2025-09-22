const fs = require('fs');
const path = require('path');

// LangChain-based RAG with Gemini embeddings using MemoryVectorStore
// We persist only raw chunks to disk (JSON) and rebuild the vector store on load.

function getIndexDir(userId, documentId) {
  const userDir = path.join(process.cwd(), 'uploads', `user-${userId}`);
  return path.join(userDir, `lc-index-${documentId}`);
}

async function ensureImports() {
  // Dynamic import to remain compatible with CommonJS environment
  const { RecursiveCharacterTextSplitter } = await import('langchain/text_splitter');
  const { GoogleGenerativeAIEmbeddings } = await import('@langchain/google-genai');
  const { MemoryVectorStore } = await import('langchain/vectorstores/memory');
  return { RecursiveCharacterTextSplitter, GoogleGenerativeAIEmbeddings, MemoryVectorStore };
}

async function buildIndex(userId, documentId, content, options = {}) {
  try {
    const { chunkSize = 1000, overlap = 150 } = options;
    const { RecursiveCharacterTextSplitter } = await ensureImports();

    if (!content || content.trim().length === 0) {
      throw new Error('No content provided for indexing');
    }

    const splitter = new RecursiveCharacterTextSplitter({ 
      chunkSize, 
      chunkOverlap: overlap,
      separators: ['\n\n', '\n', '. ', ' ', '']
    });
    
    const docs = await splitter.createDocuments([content]);
    
    if (docs.length === 0) {
      throw new Error('No chunks created from content');
    }

    const dir = getIndexDir(userId, documentId);
    await fs.promises.mkdir(dir, { recursive: true });
    const indexPath = path.join(dir, 'chunks.json');
    
    const chunks = docs.map(d => d.pageContent).filter(chunk => chunk.trim().length > 20);
    
    const data = { 
      createdAt: new Date().toISOString(), 
      chunkSize, 
      overlap, 
      chunks,
      totalChunks: chunks.length
    };
    
    await fs.promises.writeFile(indexPath, JSON.stringify(data, null, 2));
    console.log(`Built index with ${chunks.length} chunks for document ${documentId}`);
    return dir;
  } catch (error) {
    console.error('Error building index:', error);
    throw error;
  }
}

// In-process cache to avoid re-embedding on every call within one server run
const storeCache = new Map(); // key: dir, value: MemoryVectorStore

async function loadIndex(userId, documentId) {
  try {
    const { GoogleGenerativeAIEmbeddings, MemoryVectorStore } = await ensureImports();
    const dir = getIndexDir(userId, documentId);
    const indexPath = path.join(dir, 'chunks.json');
    
    if (!fs.existsSync(indexPath)) {
      console.log(`Index not found for document ${documentId}`);
      return null;
    }

    // Check cache first
    if (storeCache.has(dir)) {
      console.log(`Using cached index for document ${documentId}`);
      return storeCache.get(dir);
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found, cannot load embeddings');
      return null;
    }

    const raw = await fs.promises.readFile(indexPath, 'utf-8');
    const data = JSON.parse(raw);
    const chunks = Array.isArray(data.chunks) ? data.chunks : [];
    
    if (chunks.length === 0) {
      console.log(`No chunks found in index for document ${documentId}`);
      return null;
    }

    console.log(`Loading index with ${chunks.length} chunks for document ${documentId}`);

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'text-embedding-004',
    });

    const docs = chunks.map(c => ({ pageContent: c, metadata: {} }));
    const store = await MemoryVectorStore.fromDocuments(docs, embeddings);
    
    // Cache the store
    storeCache.set(dir, store);
    console.log(`Successfully loaded and cached index for document ${documentId}`);
    
    return store;
  } catch (error) {
    console.error(`Error loading index for document ${documentId}:`, error);
    return null;
  }
}

async function retrieveTopK(userId, documentId, question, k = 4) {
  try {
    const store = await loadIndex(userId, documentId);
    if (!store) {
      console.log(`No index available for document ${documentId}, cannot retrieve chunks`);
      return '';
    }
    
    if (!question || question.trim().length === 0) {
      console.log('Empty question provided for retrieval');
      return '';
    }
    
    console.log(`Retrieving top ${k} chunks for question: "${question.substring(0, 100)}..."`);
    
    const results = await store.similaritySearch(question, Math.max(1, k));
    
    if (results.length === 0) {
      console.log('No relevant chunks found');
      return '';
    }
    
    console.log(`Retrieved ${results.length} relevant chunks`);
    const context = results.map(r => r.pageContent).join('\n\n');
    
    return context;
  } catch (error) {
    console.error(`Error retrieving chunks for document ${documentId}:`, error);
    return '';
  }
}

module.exports = {
  buildIndex,
  loadIndex,
  retrieveTopK,
};
