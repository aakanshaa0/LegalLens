import heroBackground from "@/assets/hero-bg.jpg";
import Image from "@/assets/image.png";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import { Upload, FileText, MessageCircle, ArrowRight, Scale, Shield, Zap, Play } from "lucide-react";
import { motion } from "framer-motion";

const Index = () => {
  const features = [
    {
      icon: Upload,
      title: "Smart Document Upload",
      description: "Drag and drop PDFs, Word docs, and text files with secure, user-specific storage."
    },
    {
      icon: FileText,
      title: "Instant AI Summary",
      description: "Get clear, one-paragraph summaries of your legal documents in plain English."
    },
    {
      icon: MessageCircle,
      title: "Intelligent Q&A",
      description: "Ask specific questions about your documents and get precise, contextual answers."
    }
  ];

  return (
    <Layout showNavigation={false}>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section 
          className="relative bg-gradient-hero text-white py-32 lg:py-48 overflow-hidden min-h-[95vh] flex items-center"
          style={{ 
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url(${heroBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-gradient-hero/60" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
              >
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Understand Legal Documents
                  <span className="block text-amber-400 bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent"> Instantly</span>
                </h1>
                <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Upload any legal document and get AI-powered summaries and answers in plain English. 
                  No legal jargon, just clear insights.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4"
              >
                <SignedOut>
                  <Button asChild size="lg" variant="hero" className="px-8 py-4 text-lg">
                    <Link to="/sign-in">
                      Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </SignedOut>
                <SignedIn>
                  <Button asChild size="lg" variant="hero" className="px-8 py-4 text-lg">
                    <Link to="/dashboard">
                      Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </SignedIn>
                <Button variant="hero-outline" size="lg" className="px-8 py-4 text-lg">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Three Simple Steps to Legal Clarity
              </h2>
              <p className="text-xl text-muted-foreground">
                Our AI transforms complex legal documents into clear, actionable insights
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                  >
                    <Card className="p-8 h-full bg-card hover:shadow-elegant transition-all duration-300 border-border/50">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 bg-gradient-primary rounded-xl shadow-glow">
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-card-foreground">{feature.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-20 bg-accent/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                  See Legal Lens AI in Action
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Watch how our AI analyzes complex legal documents and provides instant, 
                  understandable summaries and answers to your questions.
                </p>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <Shield className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Enterprise Security</h3>
                      <p className="text-muted-foreground">Your documents are encrypted and stored securely with user-specific access controls.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Lightning Fast</h3>
                      <p className="text-muted-foreground">Get instant summaries and answers. No waiting around for manual reviews.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-warning/10 rounded-lg">
                      <FileText className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Multiple Formats</h3>
                      <p className="text-muted-foreground">Support for PDF, Word documents, and plain text files up to 10MB.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="relative overflow-hidden rounded-2xl shadow-card-custom bg-gradient-to-br from-primary/5 to-primary-glow/5 p-2">
                  <img 
                    src={Image} 
                    alt="Legal Lens AI Dashboard Preview" 
                    className="w-full rounded-lg shadow-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-32 bg-gradient-primary text-white">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Ready to Transform Your Legal Document Analysis?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of legal professionals who use Legal Lens AI to understand 
                complex documents instantly and get precise answers to their questions.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <SignedOut>
                  <Button asChild variant="hero" size="lg" className="px-8 py-4 text-lg">
                    <Link to="/sign-in">
                      Start Analyzing Documents <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </SignedOut>
                <SignedIn>
                  <Button asChild variant="hero" size="lg" className="px-8 py-4 text-lg">
                    <Link to="/upload">
                      Upload Your First Document <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </SignedIn>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
