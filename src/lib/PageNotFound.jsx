import { useLocation, useNavigate } from 'react-router-dom';

export default function PageNotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-7xl font-light text-slate-600">404</h1>
        <h2 className="text-2xl font-medium">Page Not Found</h2>
        <p className="text-slate-400">The page <span className="font-medium text-slate-300">{pageName}</span> could not be found.</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 text-sm font-medium bg-blue-600 rounded-lg active:bg-blue-700">Go Home</button>
      </div>
    </div>
  );
}
