require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiAPI() {
  console.log('Testing Gemini API configuration...');
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ GEMINI_API_KEY found');
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Try with the smaller flash model first
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log('Testing text generation with gemini-1.5-flash...');
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: 'Say "test ok"' }]
      }],
      generationConfig: {
        maxOutputTokens: 10,
        temperature: 0.1
      }
    });
    
    const response = result.response.text();
    console.log('✅ Gemini API Response:', response);
    
    // Test embeddings
    console.log('Testing embeddings...');
    const { GoogleGenerativeAIEmbeddings } = await import('@langchain/google-genai');
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'text-embedding-004',
    });
    
    const testEmbedding = await embeddings.embedQuery('This is a test document');
    console.log('✅ Embeddings working, vector length:', testEmbedding.length);
    
    console.log('🎉 All tests passed! Gemini API is properly configured.');
    
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message);
    if (error.status === 400) {
      console.error('   This might be an API key issue or quota problem');
    }
  }
}

testGeminiAPI();