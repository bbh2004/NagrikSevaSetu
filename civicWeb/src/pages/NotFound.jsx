import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-surface p-6 text-center">
      <AlertTriangle className="h-24 w-24 text-error mb-6" />
      <h1 className="text-6xl font-bold text-on-surface mb-2">404</h1>
      <h2 className="text-2xl font-semibold text-on-surface-variant mb-4">Page Not Found</h2>
      <p className="text-on-surface-variant max-w-md mb-8">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        <Home className="h-5 w-5" />
        Return to Home
      </Link>
    </div>
  );
}
