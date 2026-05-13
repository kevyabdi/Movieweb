import { Link } from "wouter";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground px-6 text-center">
      <p className="text-7xl font-black text-foreground/10 mb-2 select-none">404</p>
      <h1 className="text-xl font-bold text-foreground mb-2">Page not found</h1>
      <p className="text-sm text-foreground/40 mb-8 max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <button className="flex items-center gap-2 h-11 px-6 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-85 active:scale-95 transition-all">
          <Home className="w-4 h-4" />
          Back to Home
        </button>
      </Link>
    </div>
  );
}
