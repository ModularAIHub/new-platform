

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const modules = [
  {
    name: 'Twitter Genie',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="h-10 w-10 mx-auto mb-2"><circle cx="16" cy="16" r="16" fill="#1DA1F2"/><path d="M22.46 12.46c.01.15.01.31.01.46 0 4.66-3.55 10.04-10.04 10.04-2 0-3.86-.59-5.43-1.61.28.03.56.05.85.05 1.66 0 3.19-.57 4.41-1.53-1.55-.03-2.86-1.05-3.31-2.45.22.04.44.07.67.07.32 0 .63-.04.93-.12-1.62-.33-2.84-1.76-2.84-3.48v-.04c.48.27 1.03.44 1.62.46-.96-.64-1.59-1.73-1.59-2.97 0-.65.17-1.26.47-1.78 1.71 2.1 4.27 3.48 7.16 3.63-.06-.26-.09-.53-.09-.81 0-1.95 1.58-3.53 3.53-3.53 1.02 0 1.94.43 2.59 1.13.81-.16 1.57-.46 2.25-.87-.27.85-.85 1.56-1.6 2.01.72-.09 1.41-.28 2.05-.57-.48.72-1.08 1.35-1.77 1.85z" fill="#fff"/></svg>
    ),
    desc: 'Generate, schedule, and analyze tweets & threads.'
  },
  {
    name: 'LinkedIn Genie',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="h-10 w-10 mx-auto mb-2"><circle cx="16" cy="16" r="16" fill="#0077B5"/><rect x="10" y="13" width="2" height="7" fill="#fff"/><rect x="15" y="13" width="2" height="7" fill="#fff"/><rect x="20" y="13" width="2" height="7" fill="#fff"/><circle cx="11" cy="11" r="1" fill="#fff"/></svg>
    ),
    desc: 'Bulk post, edit, and schedule LinkedIn content.'
  },
  {
    name: 'WordPress Genie',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="h-10 w-10 mx-auto mb-2"><circle cx="16" cy="16" r="16" fill="#21759B"/><path d="M16 8a8 8 0 100 16 8 8 0 000-16zm0 1.5a6.5 6.5 0 016.5 6.5c0 2.13-1.04 4.02-2.65 5.19l-2.85-7.8c-.13-.36-.47-.59-.85-.59-.38 0-.72.23-.85.59l-2.85 7.8A6.5 6.5 0 0116 9.5zm-1.5 1.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm3 0c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5z" fill="#fff"/></svg>
    ),
    desc: 'Automate WordPress publishing and scheduling.'
  }
];

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
      <h1 className="text-5xl font-extrabold mb-4 text-blue-700 drop-shadow">Welcome to Autoverse</h1>
      <p className="text-xl text-gray-700 mb-8">Automate your content, not your creativity.</p>
      <div className="flex flex-wrap justify-center gap-8 mb-10">
        {modules.map((mod) => (
          <div key={mod.name} className="bg-white rounded-2xl shadow-lg p-8 w-72 flex flex-col items-center hover:scale-[1.04] hover:shadow-2xl transition-all duration-200">
            {mod.icon}
            <h2 className="font-bold text-lg mb-2 text-gray-800">{mod.name}</h2>
            <p className="text-gray-500 text-sm mb-2">{mod.desc}</p>
          </div>
        ))}
      </div>
      <button
        onClick={handleCTA}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-xl transition disabled:opacity-50"
      >
        Get Started
      </button>
      <p className="mt-6 text-gray-400 text-sm max-w-xl mx-auto">
        Choose your AI key: OpenAI, Gemini, or Perplexity. Free and enterprise plans available. Access all modules from your dashboard.
      </p>
    </section>
  );
};

export default HomePage;
