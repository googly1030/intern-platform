import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-text-primary mb-4">404</h1>
        <p className="text-text-muted mb-6">Page not found</p>
        <Link to="/" className="text-orchid-500 hover:underline">
          Go back home
        </Link>
      </div>
    </div>
  );
}
