/**
 * NotFound.jsx — 404 page with branded design.
 */
import { Link, useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Search, Building } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f4f6fa] flex flex-col">
      {/* Simple header */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Building size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900">NagrikSevaSetu</span>
        </div>
      </header>

      {/* 404 Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md animate-fade-in-up">
          {/* Visual */}
          <div className="relative inline-block mb-8">
            <div className="w-32 h-32 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center mx-auto">
              <Search size={48} className="text-indigo-300" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-red-100 border-2 border-white flex items-center justify-center text-xl font-bold text-red-500">
              !
            </div>
          </div>

          {/* Text */}
          <p className="text-7xl font-black text-gray-100 leading-none mb-2">404</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
            The page you're looking for doesn't exist or may have been moved.
            Please check the URL or return to the portal.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={15} /> Go Back
            </button>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-container transition-all shadow-sm hover:shadow-md"
            >
              <Home size={15} /> Return to Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
