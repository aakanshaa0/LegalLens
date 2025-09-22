import { UserButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Scale, FileText, Upload, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";

export const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/upload", label: "Upload", icon: Upload },
    { href: "/documents", label: "Documents", icon: FileText },
  ];

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">Legal Lens AI</span>
          </Link>

          <SignedIn>
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="relative flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute inset-0 bg-accent rounded-md"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                      />
                    )}
                    <Icon className={`h-4 w-4 relative z-10 ${isActive ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
                    <span className={`relative z-10 ${isActive ? 'text-accent-foreground' : 'text-muted-foreground'}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </SignedIn>

          <div className="flex items-center space-x-4">
            <SignedOut>
              <Button asChild variant="outline">
                <Link to="/sign-in">Sign In</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
};