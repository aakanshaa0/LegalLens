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
    <nav className="border-b bg-amber-600 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex justify-between items-center h-16">

          <Link to="/" className="flex items-center space-x-2">
            <div className="p-2 bg-amber-700 rounded-lg">
              <Scale className="h-6 w-6 text-white" />
            </div>

            <span className="text-xl font-bold text-white">
              Legal Lens AI
            </span>
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
                    className="relative flex items-center space-x-2 px-3 py-2 text-sm font-bold text-white"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute inset-0 bg-amber-800 rounded-md"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                      />
                    )}

                    <Icon className="h-4 w-4 relative z-10 text-white" />

                    <span className="relative z-10 text-white font-bold">
                      {item.label}
                    </span>
                  </Link>
                );
              })}

            </div>
          </SignedIn>

          <div className="flex items-center space-x-4">

            <SignedOut>
              <Button asChild className="bg-white text-amber-700 font-bold">
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