import { SignUp } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { FileText, Sparkles } from "lucide-react";

const SignUpPage = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center justify-center p-4 bg-gradient-primary rounded-2xl shadow-glow mb-6"
          >
            <FileText className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            Get Started Today
          </h1>
          <p className="text-muted-foreground mb-4">
            Join thousands who use Legal Lens AI to understand complex documents
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Sparkles className="h-4 w-4 mr-1 text-primary" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
              <span>Secure</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
              <span>Free to Start</span>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-elegant p-2"
        >
          <SignUp 
            routing="path" 
            path="/sign-up" 
            signInUrl="/sign-in"
            afterSignUpUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 bg-transparent",
              }
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default SignUpPage;
