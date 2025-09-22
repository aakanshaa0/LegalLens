import { ReactNode } from "react";
import { Navigation } from "./Navigation";
import { Link } from "react-router-dom";
import { FileText, Mail, Twitter, Linkedin, Github } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/clerk-react";

interface LayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
}

const Footer = () => (
  <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-16 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-primary rounded-xl shadow-glow">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">Legal Lens</span>
          </div>
          <p className="text-gray-300 leading-relaxed mb-6">
            Transforming complex legal documents into clear, actionable insights with cutting-edge AI technology.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-white transition-colors transform hover:scale-110" aria-label="Twitter">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors transform hover:scale-110" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors transform hover:scale-110" aria-label="GitHub">
              <Github className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors transform hover:scale-110" aria-label="Email">
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-6 text-white">Quick Links</h3>
          <ul className="space-y-3">
            <li><Link to="/" className="text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-1">Home</Link></li>
            <li><Link to="/dashboard" className="text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-1">Dashboard</Link></li>
            <li><Link to="/documents" className="text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-1">Documents</Link></li>
            <li><Link to="/upload" className="text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-1">Upload</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-6 text-white">Resources</h3>
          <ul className="space-y-3">
            <li><a href="#" className="text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-1">Documentation</a></li>
            <li><a href="#" className="text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-1">API Reference</a></li>
            <li><a href="#" className="text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-1">Guides</a></li>
            <li><a href="#" className="text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-1">Support</a></li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-6 text-white">Stay Updated</h3>
          <p className="text-gray-300 mb-4">Get the latest updates and insights</p>
          <div className="space-y-4">
            <div className="flex rounded-lg overflow-hidden shadow-lg">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="px-4 py-3 bg-gray-800/50 text-white border-0 focus:outline-none focus:ring-2 focus:ring-primary/50 flex-grow placeholder-gray-400"
              />
              <button className="bg-gradient-primary hover:shadow-glow text-white px-6 py-3 transition-all duration-300 hover:scale-105">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-700/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
        <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Legal Lens. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">Privacy Policy</a>
          <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">Terms of Service</a>
          <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">Cookies</a>
        </div>
      </div>
    </div>
  </footer>
);

export const Layout = ({ children, showNavigation = true }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-subtle">
      <header className="bg-white/80 backdrop-blur-lg shadow-elegant sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="p-2 bg-gradient-primary rounded-xl shadow-glow group-hover:shadow-lg transition-all duration-300">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Legal Lens
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-primary transition-all duration-300 font-medium relative group">
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link to="/dashboard" className="text-gray-700 hover:text-primary transition-all duration-300 font-medium relative group">
                Dashboard
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link to="/documents" className="text-gray-700 hover:text-primary transition-all duration-300 font-medium relative group">
                Documents
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link to="/upload" className="text-gray-700 hover:text-primary transition-all duration-300 font-medium relative group">
                Upload
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
              
              <SignedIn>
                <div className="ml-4">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
              <SignedOut>
                <Link to="/sign-in">
                  <Button variant="outline" className="ml-4 hover:shadow-md transition-all duration-300">
                    Sign In
                  </Button>
                </Link>
              </SignedOut>
            </nav>
            
            <div className="md:hidden">
              {/* Mobile menu button */}
              <button className="text-gray-700 hover:text-primary transition-colors p-2 rounded-lg hover:bg-gray-100">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};