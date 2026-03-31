import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { FileText, Mail, Twitter, Linkedin, Github } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
}

const Footer = () => (
  <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-16 relative overflow-hidden">
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

        <div className="md:col-span-1">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-amber-600 rounded-xl">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">Legal Lens</span>
          </div>

          <p className="text-gray-300 mb-6">
            Transforming complex legal documents into clear insights with AI.
          </p>

          <div className="flex space-x-4">
            <Twitter className="h-5 w-5" />
            <Linkedin className="h-5 w-5" />
            <Github className="h-5 w-5" />
            <Mail className="h-5 w-5" />
          </div>
        </div>

      </div>

      <div className="border-t border-gray-700 mt-12 pt-8 text-center">
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} Legal Lens
        </p>
      </div>

    </div>
  </footer>
);

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">

      <header className="bg-amber-600 sticky top-0 z-50 border-b border-amber-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex justify-between h-16 items-center">

            <Link to="/" className="flex items-center space-x-3">
              <div className="p-2 bg-amber-700 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>

              <span className="text-xl font-bold text-white">
                Legal Lens
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">

              <Link to="/" className="text-white font-bold hover:text-amber-200 transition">
                Home
              </Link>

              <Link to="/dashboard" className="text-white font-bold hover:text-amber-200 transition">
                Dashboard
              </Link>

              <Link to="/documents" className="text-white font-bold hover:text-amber-200 transition">
                Documents
              </Link>

              <Link to="/upload" className="text-white font-bold hover:text-amber-200 transition">
                Upload
              </Link>

              <SignedIn>
                <div className="ml-4">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>

              <SignedOut>
                <Link to="/sign-in">
                  <Button className="ml-4 bg-white text-amber-600 font-bold hover:bg-gray-100">
                    Sign In
                  </Button>
                </Link>
              </SignedOut>

            </nav>

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