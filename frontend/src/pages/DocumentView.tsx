import { useState, useEffect } from "react";
import { SignedIn, RedirectToSignIn, SignedOut } from "@clerk/clerk-react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useParams, Link } from "react-router-dom";
import { FileText, MessageCircle, Send, ArrowLeft, Sparkles, Clock, User, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { documentAPI, DocumentFile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

const DocumentView = () => {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<DocumentFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string>("");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [askingQuestion, setAskingQuestion] = useState(false);
  const { toast } = useToast();

  const loadDocument = async () => {
    if (!id) return;
    
    try {
      const response = await documentAPI.getDocument(id);
      setDocument(response.file);
    } catch (error: any) {
      toast({
        title: "Error Loading Document",
        description: error.response?.data?.error || "Failed to load document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!document) return;

    setGeneratingSummary(true);
    try {
      // Use the documentAPI to get the summary
      const response = await documentAPI.summarize(document.id);
      setSummary(response.summary);
      
      // Update the document with the new summary
      if (document) {
        setDocument({ ...document, summary: response.summary });
      }
      
      toast({
        title: "Summary Generated",
        description: "AI summary has been generated successfully.",
      });
    } catch (error: any) {
      console.error('Error generating summary:', error);
      toast({
        title: "Summary Failed",
        description: error.response?.data?.error || "Failed to generate document summary.",
        variant: "destructive",
      });
    } finally {
      setGeneratingSummary(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim() || !document) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setAskingQuestion(true);
    const currentQuestion = question;
    setQuestion("");

    try {
      // Use the documentAPI to ask a question
      const response = await documentAPI.askQuestion(document.id, currentQuestion);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: response.answer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      
      toast({
        title: "Question Answered",
        description: "AI has provided an answer based on your document.",
      });
    } catch (error: any) {
      console.error('Error asking question:', error);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: "I'm sorry, I encountered an error while processing your question. Please try again later.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Question Failed",
        description: error.response?.data?.error || "Failed to get answer from AI.",
        variant: "destructive",
      });
    } finally {
      setAskingQuestion(false);
    }
  };

  useEffect(() => {
    loadDocument();
    
    // Load summary if available when document loads
    if (document?.id) {
      documentAPI.summarize(document.id)
        .then(response => {
          setSummary(response.summary);
        })
        .catch(error => {
          console.error('Error loading summary:', error);
        });
    }
  }, [id, document?.id]);

  if (loading) {
    return (
      <>
        <SignedIn>
          <Layout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded mb-4 w-1/3"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="h-4 bg-muted rounded mb-4"></div>
                    <div className="h-20 bg-muted rounded"></div>
                  </Card>
                </div>
                <div>
                  <Card className="p-6">
                    <div className="h-4 bg-muted rounded mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      </>
    );
  }

  if (!document) {
    return (
      <>
        <SignedIn>
          <Layout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-card-foreground mb-4">
                Document Not Found
              </h1>
              <p className="text-muted-foreground mb-6">
                The document you're looking for doesn't exist or has been deleted.
              </p>
              <Button asChild>
                <Link to="/documents">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Documents
                </Link>
              </Button>
            </Card>
          </div>
        </Layout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      </>
    );
  }

  return (
    <>
      <SignedIn>
        <Layout>
        <div className="min-h-screen bg-gradient-subtle">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Enhanced Header */}
              <div className="mb-12">
                <div className="flex items-center space-x-4 mb-6">
                  <Button asChild variant="outline" size="sm" className="hover:shadow-md transition-all duration-300">
                    <Link to="/documents">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Documents
                    </Link>
                  </Button>
                </div>
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="inline-flex items-center justify-center p-4 bg-gradient-primary rounded-2xl shadow-glow mb-6"
                  >
                    <FileText className="h-8 w-8 text-white" />
                  </motion.div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4 truncate">
                    {document.originalName}
                  </h1>
                  <div className="flex items-center justify-center space-x-6 text-muted-foreground">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      <span>{document.fileType}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      <span>{document.sizeLabel}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                      <span>Uploaded {formatDistanceToNow(new Date(document.uploadDate), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Enhanced Document Summary */}
                <div className="space-y-8">
                  <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-elegant">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-card-foreground flex items-center">
                        <Sparkles className="h-6 w-6 mr-3 text-primary" />
                        AI Summary
                      </h2>
                      {!summary && (
                        <Button 
                          onClick={generateSummary}
                          disabled={generatingSummary}
                          size="lg"
                          className="shadow-glow hover:shadow-lg transition-all duration-300"
                        >
                          {generatingSummary ? (
                            <>
                              <Clock className="h-5 w-5 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-5 w-5 mr-2" />
                              Generate Summary
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {summary ? (
                      <div className="bg-gradient-to-br from-primary/5 via-primary-glow/5 to-primary/10 p-6 rounded-2xl border border-primary/20 shadow-inner">
                        <MarkdownRenderer content={summary} />
                      </div>
                    ) : generatingSummary ? (
                      <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                          <motion.div 
                            className="inline-flex p-6 bg-gradient-primary rounded-3xl shadow-glow mb-6"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <Clock className="h-12 w-12 text-white" />
                          </motion.div>
                          <h3 className="text-xl font-semibold text-card-foreground mb-2">Analyzing your document...</h3>
                          <p className="text-muted-foreground">Our AI is reading through the content and generating insights</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <motion.div 
                          className="inline-flex p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-6"
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Sparkles className="h-12 w-12 text-gray-400" />
                        </motion.div>
                        <h3 className="text-xl font-semibold text-card-foreground mb-3">Ready for AI Analysis</h3>
                        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                          Generate an intelligent summary that highlights key terms, parties, obligations, and important details from your document
                        </p>
                      </div>
                    )}
                </Card>

                  {/* Enhanced Document Details */}
                  <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-elegant">
                    <h3 className="text-2xl font-bold text-card-foreground mb-6 flex items-center">
                      <FileText className="h-6 w-6 mr-3 text-primary" />
                      Document Details
                    </h3>
                    <div className="space-y-4">
                      {[
                        { label: "File Name", value: document.originalName, icon: "📄" },
                        { label: "Type", value: document.fileType, icon: "🔖" },
                        { label: "Size", value: document.sizeLabel, icon: "📏" },
                        { label: "Uploaded", value: formatDistanceToNow(new Date(document.uploadDate), { addSuffix: true }), icon: "📅" }
                      ].map((detail, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-300"
                        >
                          <div className="flex items-center">
                            <span className="text-xl mr-3">{detail.icon}</span>
                            <span className="text-muted-foreground font-medium">{detail.label}:</span>
                          </div>
                          <span className="text-card-foreground font-semibold">{detail.value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
              </div>

                {/* Enhanced Q&A Chat */}
                <div>
                  <Card className="p-8 h-[700px] flex flex-col bg-white/80 backdrop-blur-sm border-0 shadow-elegant">
                    <div className="flex items-center mb-6">
                      <MessageCircle className="h-6 w-6 mr-3 text-primary" />
                      <h2 className="text-2xl font-bold text-card-foreground">Ask Questions</h2>
                    </div>

                    {/* Enhanced Chat Messages */}
                    <div className="flex-1 overflow-y-auto space-y-6 mb-6 scrollbar-thin">
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <motion.div 
                              className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl mb-6"
                              animate={{ y: [0, -10, 0] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <MessageCircle className="h-12 w-12 text-blue-500" />
                            </motion.div>
                            <h3 className="text-xl font-semibold text-card-foreground mb-3">
                              Start a conversation with your document 💬
                            </h3>
                            <p className="text-muted-foreground mb-4 max-w-md mx-auto leading-relaxed">
                              Ask any question about this document and get intelligent, contextual answers
                            </p>
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                              <p className="text-sm text-blue-700 font-medium mb-2">Try asking:</p>
                              <div className="space-y-1 text-sm text-blue-600">
                                <p>• "What's the main purpose of this document?"</p>
                                <p>• "Who are the parties involved?"</p>
                                <p>• "What are the key deadlines?"</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
                                message.type === 'user'
                                  ? 'bg-gradient-primary text-white'
                                  : 'bg-white border border-gray-200'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                {message.type === 'bot' && (
                                  <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm">
                                    <Bot className="h-4 w-4 text-white" />
                                  </div>
                                )}
                                {message.type === 'user' && (
                                  <div className="p-2 bg-white/20 rounded-xl">
                                    <User className="h-4 w-4 text-white" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  {message.type === 'bot' ? (
                                    <div className="text-sm text-gray-800">
                                      <MarkdownRenderer content={message.message} />
                                    </div>
                                  ) : (
                                    <p className="text-sm font-medium">{message.message}</p>
                                  )}
                                  <p className={`text-xs mt-2 ${
                                    message.type === 'user' ? 'text-white/70' : 'text-gray-500'
                                  }`}>
                                    {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                      {askingQuestion && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                          className="flex justify-start"
                        >
                          <div className="bg-white border border-gray-200 max-w-[85%] rounded-2xl p-4 shadow-md">
                            <div className="flex items-center space-x-3">
                              <motion.div 
                                className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                              >
                                <Bot className="h-4 w-4 text-white" />
                              </motion.div>
                              <div>
                                <p className="text-sm text-gray-800 font-medium">Analyzing your question...</p>
                                <p className="text-xs text-gray-500 mt-1">This may take a moment</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Enhanced Question Input */}
                    <div className="flex space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                      <Input
                        placeholder="Ask a question about this document..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
                        disabled={askingQuestion}
                        className="flex-1 border-0 bg-white shadow-sm focus:shadow-md transition-all duration-300 rounded-xl"
                      />
                      <Button
                        onClick={askQuestion}
                        disabled={!question.trim() || askingQuestion}
                        size="lg"
                        className="shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
        </div>
      </Layout>
    </SignedIn>
    <SignedOut>
      <RedirectToSignIn />
    </SignedOut>
    </>
  );
};

export default DocumentView;