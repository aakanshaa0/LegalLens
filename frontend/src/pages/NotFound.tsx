import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-2xl mx-auto"
      >
        <Card className="p-12 bg-white/80 backdrop-blur-sm border-0 shadow-elegant">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center justify-center p-6 bg-gradient-to-r from-gray-400 to-gray-500 rounded-3xl shadow-glow mb-8"
          >
            <FileText className="h-16 w-16 text-white" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h1 className="text-6xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">
              404
            </h1>
            <h2 className="text-2xl font-semibold text-card-foreground mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Oops! The page you're looking for seems to have wandered off. 
              Don't worry, even the best legal documents sometimes get misfiled.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button asChild size="lg" className="shadow-glow hover:shadow-lg transition-all duration-300">
                <Link to="/">
                  <Home className="h-5 w-5 mr-2" />
                  Return Home
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="hover:shadow-md transition-all duration-300">
                <Link to="/dashboard">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>
            
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Lost?</strong> Try uploading a document or browsing your existing files to get back on track.
              </p>
            </div>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};

export default NotFound;
