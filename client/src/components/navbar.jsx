import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, Settings, User, Users, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui';

const NAV_LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/plans', label: 'Pricing' },
  { to: '/docs', label: 'Docs' },
  { to: '/blogs', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userPlanType = String(user?.planType || user?.plan_type || '').trim().toLowerCase();
  const hasPaidPlanBadge = userPlanType === 'pro' || userPlanType === 'agency';
  const isAgencyPlan = userPlanType === 'agency';
  const planBadgeLabel = userPlanType === 'agency' ? 'AGENCY' : userPlanType === 'pro' ? 'PRO' : '';
  const planBadgeClassName = userPlanType === 'agency'
    ? 'bg-slate-950 text-white'
    : 'bg-blue-600 text-white';

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((previous) => !previous);
  const toggleProfile = () => setIsProfileOpen((previous) => !previous);

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="border-b border-slate-100 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs sm:px-6 lg:px-8">
          <p className="font-medium text-slate-200">Built for Indian creators, operators, and agencies.</p>
          <p className="hidden text-slate-300 sm:block">BYOK multi-LLM, client approvals, and workspace-aware publishing.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between py-3 sm:h-[72px]">
          <Link to="/" className="group flex items-center gap-3" onClick={closeMenu}>
            <img src="/suitegenie-logo-icon.png" alt="SuiteGenie logo" className="h-11 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.03]" />
            <div>
              <span className="block text-lg font-semibold tracking-tight text-slate-950">SuiteGenie</span>
              <span className="block text-xs text-slate-500">AI social media operating system</span>
            </div>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<LayoutDashboard className="h-4 w-4" />}
                  iconPosition="left"
                  onClick={() => { window.location.href = isAgencyPlan ? '/agency' : '/dashboard'; }}
                  className="rounded-xl"
                >
                  {isAgencyPlan ? 'Agency' : 'Dashboard'}
                </Button>

                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={toggleProfile}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{user?.email}</span>
                        {hasPaidPlanBadge ? (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${planBadgeClassName}`}>
                            {planBadgeLabel}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>

                  {isProfileOpen ? (
                    <div className="absolute right-0 mt-3 w-64 rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
                      {!isAgencyPlan ? (
                        <Link
                          to="/team"
                          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Users className="h-4 w-4" />
                          Team
                        </Link>
                      ) : null}
                      <Link
                        to="/settings"
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-rose-700"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => { window.location.href = '/login'; }} className="rounded-xl">
                  Login
                </Button>
                <Button variant="primary" size="sm" onClick={() => { window.location.href = '/register'; }} className="rounded-xl bg-slate-950 hover:bg-slate-800">
                  Start Free
                </Button>
              </>
            )}
          </div>

          <div className="lg:hidden">
            <button
              type="button"
              onClick={toggleMenu}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <div className="border-t border-slate-200 py-4 lg:hidden">
            <div className="space-y-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              {isAuthenticated ? (
                <>
                  <div className="rounded-2xl bg-white px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{user?.email}</p>
                    {hasPaidPlanBadge ? (
                      <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${planBadgeClassName}`}>
                        {planBadgeLabel}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => { closeMenu(); window.location.href = isAgencyPlan ? '/agency' : '/dashboard'; }}
                      className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white"
                    >
                      {isAgencyPlan ? 'Open Agency' : 'Open Dashboard'}
                    </button>
                    {!isAgencyPlan ? (
                      <Link to="/team" onClick={closeMenu} className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                        Team
                      </Link>
                    ) : null}
                    <Link to="/settings" onClick={closeMenu} className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => { closeMenu(); handleLogout(); }}
                      className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-medium text-rose-700"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Button variant="ghost" size="md" fullWidth onClick={() => { closeMenu(); window.location.href = '/login'; }} className="rounded-2xl">
                    Login
                  </Button>
                  <Button variant="primary" size="md" fullWidth onClick={() => { closeMenu(); window.location.href = '/register'; }} className="rounded-2xl bg-slate-950 hover:bg-slate-800">
                    Start Free
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
};

export default Navbar;
