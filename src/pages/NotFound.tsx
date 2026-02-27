import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <h1 className="font-oswald text-8xl font-bold text-primary mb-2">404</h1>
        <h2 className="font-oswald text-2xl font-bold uppercase mb-3">Road Ends Here</h2>
        <p className="text-muted-foreground mb-8">
          Looks like you took a wrong turn. The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button className="gap-2 font-barlow-condensed font-semibold uppercase tracking-wider w-full">
              <Home className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" className="gap-2 font-barlow-condensed font-semibold uppercase tracking-wider w-full">
              <Search className="h-4 w-4" /> Browse Products
            </Button>
          </Link>
        </div>
        <button onClick={() => window.history.back()} className="mt-4 text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Go back
        </button>
      </motion.div>
    </div>
  );
}
