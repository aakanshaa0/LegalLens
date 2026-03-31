import { useState, useEffect } from "react";
import { SignedIn, RedirectToSignIn, SignedOut } from "@clerk/clerk-react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Upload, FileText, MessageCircle, Plus, Clock, Eye, Download } from "lucide-react";
import { motion } from "framer-motion";
import { documentAPI, DocumentFile } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const [documents, setDocuments] = useState<DocumentFile[] | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentAPI.getDocuments();
      // Sort by upload date and take the 5 most recent
      const sortedDocs = (response.files || [])
        .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
        .slice(0, 5);
      setDocuments(sortedDocs);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const quickActions = [
    {
      title: "Upload Document",
      description: "Upload a new legal document for analysis",
      icon: Upload,
      href: "/upload",
      color: "bg-gradient-to-r from-amber-500 to-amber-600"
    },
    {
      title: "View Documents",
      description: "Browse your uploaded documents",
      icon: FileText,
      href: "/documents",
      color: "bg-gradient-to-r from-amber-600 to-amber-700"
    }
  ];

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
                <div className="mb-12 text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="inline-flex items-center justify-center p-4 bg-gradient-primary rounded-2xl shadow-glow mb-6"
                  >
                    <FileText className="h-8 w-8 text-white" />
                  </motion.div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
                    Welcome back! 👋
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Manage your legal documents and unlock AI-powered insights with just a few clicks
                  </p>
                </div>

                {/* Enhanced Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.15 }}
                        whileHover={{ y: -5 }}
                        className="group"
                      >
                        <Card className="p-8 hover:shadow-elegant transition-all duration-500 cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:bg-white group-hover:scale-105">
                          <Link to={action.href} className="block">
                            <div className="text-center">
                              <div className={`inline-flex p-4 rounded-2xl ${action.color} shadow-glow mb-6 group-hover:shadow-lg transition-all duration-300`}>
                                <Icon className="h-8 w-8 text-white" />
                              </div>
                              <h3 className="text-xl font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors">
                                {action.title}
                              </h3>
                              <p className="text-muted-foreground leading-relaxed">
                                {action.description}
                              </p>
                            </div>
                          </Link>
                        </Card>
                      </motion.div>
                    );
                  })}

                  {/* Enhanced Coming Soon Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    whileHover={{ y: -5 }}
                    className="group"
                  >
                    <Card className="p-8 border-dashed border-2 border-amber-400/40 hover:border-amber-400/60 transition-all duration-500 bg-gradient-to-br from-amber-50/50 to-orange-50/50 hover:from-amber-50/80 hover:to-orange-50/80 group-hover:scale-105">
                      <div className="text-center">
                        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 shadow-glow mb-6 group-hover:shadow-lg transition-all duration-300">
                          <Clock className="h-8 w-8 text-white animate-pulse-slow" />
                        </div>
                        <h3 className="text-xl font-bold text-card-foreground mb-3 group-hover:text-amber-600 transition-colors">
                          Analytics Dashboard
                        </h3>
                        <div className="inline-flex items-center text-sm text-amber-600 font-medium">
                          <span className="w-2 h-2 bg-amber-400 rounded-full mr-2 animate-pulse"></span>
                          In Development
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </div>

                {/* Enhanced Recent Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-elegant">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-card-foreground flex items-center">
                        <MessageCircle className="h-6 w-6 mr-3 text-primary" />
                        Recent Activity
                      </h2>
                      <Button asChild variant="outline" size="sm" className="hover:shadow-md transition-all duration-300">
                        <Link to="/documents">View All</Link>
                      </Button>
                    </div>

                    {loading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, index) => (
                          <div key={index} className="flex items-center space-x-4 p-4 rounded-xl bg-gray-100 animate-pulse">
                            <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : documents && documents.length > 0 ? (
                      <div className="space-y-4">
                        {documents.map((doc, index) => (
                          <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-all duration-300 group cursor-pointer"
                          >
                            <div className="flex items-center space-x-4">
                              <div className={`p-3 rounded-lg bg-gradient-to-r ${doc.fileType.toLowerCase() === 'pdf' ? 'from-red-500 to-red-600' :
                                doc.fileType.toLowerCase() === 'word' ? 'from-blue-500 to-blue-600' :
                                  'from-gray-500 to-gray-600'
                                } shadow-md group-hover:shadow-lg transition-all duration-300`}>
                                <FileText className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-card-foreground group-hover:text-primary transition-colors truncate max-w-xs" title={doc.originalName}>
                                  {doc.originalName}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {doc.fileType} • {doc.sizeLabel} • Uploaded {formatDistanceToNow(new Date(doc.uploadDate), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Link to={`/documents/${doc.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <motion.div
                          className="inline-flex p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-6"
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <FileText className="h-12 w-12 text-gray-400" />
                        </motion.div>
                        <h3 className="text-xl font-semibold text-card-foreground mb-3">Ready to get started?</h3>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                          Upload your first legal document to unlock AI-powered summaries and intelligent Q&A capabilities
                        </p>
                        <Button asChild size="lg" className="shadow-glow hover:shadow-lg transition-all duration-300">
                          <Link to="/upload">
                            <Plus className="h-5 w-5 mr-2" />
                            Upload Your First Document
                          </Link>
                        </Button>
                      </div>
                    )}
                  </Card>
                </motion.div>
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

export default Dashboard;