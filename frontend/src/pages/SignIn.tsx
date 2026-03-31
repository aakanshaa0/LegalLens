import { SignIn } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

const SignInPage = () => {
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
            Welcome Back
          </h1>
          <p className="text-muted-foreground">
            Sign in to continue analyzing your legal documents
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-elegant p-2"
        >
          <SignIn 
            routing="path" 
            path="/sign-in" 
            signUpUrl="/sign-up" 
            afterSignInUrl="/dashboard"
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

export default SignInPage;
