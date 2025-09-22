import { useEffect, useState } from "react";
import { SignedIn, RedirectToSignIn, SignedOut } from "@clerk/clerk-react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Plus, Trash2, Eye, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { documentAPI, DocumentFile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const Documents = () => {
  const [documents, setDocuments] = useState<DocumentFile[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentAPI.getDocuments();
      setDocuments(response.files || []);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error Loading Documents",
        description: error.response?.data?.error || "Failed to load documents",
        variant: "destructive",
      });
      setDocuments([]); // Set to empty array on error to prevent undefined errors
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await documentAPI.deleteDocument(id);
      setDocuments(docs => docs?.filter(doc => doc.id !== id) || []);
      toast({
        title: "Document Deleted",
        description: "Document has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.response?.data?.error || "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const getFileIcon = (fileType: string) => {
    return <FileText className="h-8 w-8" />;
  };

  const getFileColor = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf': return 'text-red-500';
      case 'word': return 'text-blue-500';
      case 'text': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

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
              className="flex items-center justify-between mb-12"
            >
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
                  Your Documents 📁
                </h1>
                <p className="text-xl text-muted-foreground">
                  Manage and analyze your uploaded legal documents with AI-powered insights
                </p>
              </div>
              <Button asChild size="lg" className="shadow-glow hover:shadow-lg transition-all duration-300">
                <Link to="/upload">
                  <Plus className="h-5 w-5 mr-2" />
                  Upload Document
                </Link>
              </Button>
            </motion.div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="p-8 animate-pulse bg-white/80 backdrop-blur-sm border-0 shadow-elegant">
                    <div className="h-12 w-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl mb-6"></div>
                    <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-3"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-6 w-2/3"></div>
                    <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
                  </Card>
                ))}
              </div>
            ) : !documents || documents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="flex items-center justify-center min-h-[60vh]"
              >
                <Card className="p-16 text-center bg-white/90 backdrop-blur-sm border-0 shadow-elegant max-w-2xl">
                  <motion.div 
                    className="inline-flex p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-8"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <FileText className="h-16 w-16 text-gray-400" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-card-foreground mb-6">
                    Ready to get started? 🚀
                  </h2>
                  <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                    Upload your first legal document to unlock AI-powered summaries, intelligent Q&A, and instant insights that make complex documents easy to understand.
                  </p>
                  <Button asChild size="lg" className="shadow-glow hover:shadow-lg transition-all duration-300">
                    <Link to="/upload">
                      <Plus className="h-5 w-5 mr-2" />
                      Upload Your First Document
                    </Link>
                  </Button>
                </Card>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {documents.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="group"
                  >
                    <Card className="p-8 hover:shadow-elegant transition-all duration-500 bg-white/80 backdrop-blur-sm border-0 group-hover:scale-105">
                      <div className="flex items-start justify-between mb-6">
                        <div className={`p-4 rounded-2xl bg-gradient-to-r ${
                          doc.fileType.toLowerCase() === 'pdf' ? 'from-red-500 to-red-600' :
                          doc.fileType.toLowerCase() === 'word' ? 'from-blue-500 to-blue-600' :
                          'from-gray-500 to-gray-600'
                        } shadow-glow group-hover:shadow-lg transition-all duration-300`}>
                          <FileText className="h-8 w-8 text-white" />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDocument(doc.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-red-50 transition-all duration-300 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <h3 className="text-xl font-bold text-card-foreground mb-4 truncate group-hover:text-primary transition-colors" title={doc.originalName}>
                        {doc.originalName}
                      </h3>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-muted-foreground bg-gray-50 rounded-lg p-2">
                          <FileText className="h-4 w-4 mr-2" />
                          <span className="font-medium">{doc.fileType}</span>
                          <span className="mx-2">•</span>
                          <span>{doc.sizeLabel}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground bg-gray-50 rounded-lg p-2">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Uploaded {formatDistanceToNow(new Date(doc.uploadDate), { addSuffix: true })}</span>
                        </div>
                      </div>

                      <Button asChild className="w-full shadow-md hover:shadow-lg transition-all duration-300" size="lg">
                        <Link to={`/documents/${doc.id}`}>
                          <Eye className="h-5 w-5 mr-2" />
                          View & Analyze
                        </Link>
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
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

export default Documents;