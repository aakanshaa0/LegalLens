import { useState } from "react";
import { SignedIn, RedirectToSignIn, SignedOut } from "@clerk/clerk-react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDropzone } from "react-dropzone";
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { documentAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const Upload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const { toast } = useToast();

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);

      const result = await documentAPI.upload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadedFile(result.file);
      
      toast({
        title: "Upload Successful",
        description: "Your document has been uploaded and is ready for analysis.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.error || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  if (uploadedFile) {
    return (
      <>
        <SignedIn>
          <Layout>
          <div className="min-h-screen bg-gradient-subtle flex items-center">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                <Card className="p-12 text-center bg-white/90 backdrop-blur-sm border-0 shadow-elegant">
                  <motion.div 
                    className="inline-flex p-6 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl shadow-glow mb-8"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2, type: "spring", bounce: 0.4 }}
                  >
                    <CheckCircle className="h-16 w-16 text-white" />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-6">
                      Upload Successful! 🎉
                    </h1>
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-8 border border-gray-200">
                      <p className="text-xl font-semibold text-card-foreground mb-2">
                        {uploadedFile.originalName}
                      </p>
                      <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                          <span>Size: {uploadedFile.sizeLabel}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                          <span>Type: {uploadedFile.fileType}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                      Your document is ready for AI analysis! Generate summaries, ask questions, and unlock insights.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                      <Button asChild size="lg" className="shadow-glow hover:shadow-lg transition-all duration-300">
                        <Link to={`/documents/${uploadedFile.id}`}>
                          <FileText className="mr-2 h-5 w-5" />
                          Analyze Document
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                      <Button 
                        variant="outline"
                        size="lg"
                        onClick={() => setUploadedFile(null)}
                        className="hover:shadow-md transition-all duration-300"
                      >
                        <UploadIcon className="mr-2 h-5 w-5" />
                        Upload Another
                      </Button>
                    </div>
                  </motion.div>
                </Card>
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
  }

  return (
    <>
      <SignedIn>
        <Layout>
        <div className="min-h-screen bg-gradient-subtle">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="inline-flex items-center justify-center p-4 bg-gradient-primary rounded-2xl shadow-glow mb-6"
                >
                  <UploadIcon className="h-6 w-6 text-white" />
                </motion.div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
                  Upload Legal Document
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Transform your legal documents into clear, actionable insights. Our AI analyzes PDFs, Word documents, and text files up to 10MB.
                </p>
              </div>

              <Card className="p-10 bg-white/80 backdrop-blur-sm border-0 shadow-elegant">
                {uploading ? (
                  <div className="text-center py-16">
                    <motion.div 
                      className="inline-flex p-6 bg-gradient-primary rounded-3xl shadow-glow mb-8"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <UploadIcon className="h-12 w-12 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-semibold text-card-foreground mb-6">Processing your document...</h3>
                    <div className="max-w-md mx-auto mb-6">
                      <Progress value={uploadProgress} className="h-3 rounded-full" />
                    </div>
                    <p className="text-lg text-muted-foreground font-medium">{uploadProgress}% complete</p>
                    <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto">
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-500 cursor-pointer group
                        ${isDragActive 
                          ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 scale-105' 
                          : 'border-gray-300 hover:border-primary/60 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 hover:scale-102'
                        }`}
                    >
                    <input {...getInputProps()} />
                    <motion.div 
                      className={`inline-flex p-6 rounded-3xl shadow-glow mb-8 transition-all duration-300 ${
                        isDragActive ? 'bg-gradient-primary scale-110' : 'bg-gradient-primary group-hover:scale-110'
                      }`}
                      animate={isDragActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5, repeat: isDragActive ? Infinity : 0 }}
                    >
                      <UploadIcon className="h-12 w-12 text-white" />
                    </motion.div>
                    
                    {isDragActive ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="text-2xl font-bold text-primary mb-3">
                          Drop your document here! 🎯
                        </h3>
                        <p className="text-lg text-muted-foreground">
                          Release to start the magic
                        </p>
                      </motion.div>
                    ) : (
                      <div>
                        <h3 className="text-2xl font-bold text-card-foreground mb-4 group-hover:text-primary transition-colors">
                          Drag & drop your document here
                        </h3>
                        <p className="text-lg text-muted-foreground mb-8">
                          or click to browse and select a file
                        </p>
                        <Button size="lg" className="shadow-glow hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                          <FileText className="mr-2 h-5 w-5" />
                          Choose File
                        </Button>
                      </div>
                    )}
                    
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                          <span className="font-medium">PDF, DOCX, TXT</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                          <span className="font-medium">Up to 10MB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
              )}
            </Card>

              {/* Enhanced Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                {[
                  {
                    icon: FileText,
                    title: "AI-Powered Summary",
                    description: "Get instant, plain-English summaries that highlight key terms, parties, and obligations",
                    color: "from-blue-500 to-blue-600"
                  },
                  {
                    icon: CheckCircle,
                    title: "Enterprise Security",
                    description: "Bank-level encryption and secure storage with user-specific access controls",
                    color: "from-green-500 to-green-600"
                  },
                  {
                    icon: AlertCircle,
                    title: "Intelligent Q&A",
                    description: "Ask specific questions and get precise, contextual answers from your documents",
                    color: "from-amber-500 to-amber-600"
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                  </motion.div>
                ))}
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

export default Upload;