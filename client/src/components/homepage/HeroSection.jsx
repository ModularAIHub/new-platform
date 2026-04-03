import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../ui';
import { Zap, TrendingUp, PlayCircle, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';

const HeroSection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleWatchDemo = () => {
    navigate('/docs');
  };

  return (
    <section className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/40 pt-8 pb-16 overflow-hidden min-h-[80vh] flex items-center">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-cyan-200/20 rounded-full blur-3xl z-0 animate-pulse-slow"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-3xl z-0 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-slate-100/30 to-blue-100/20 rounded-full blur-2xl z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left animate-fade-in">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/90 px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm">
              <Sparkles className="h-4 w-4" />
              AI workflow for teams, creators, and agencies
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 mb-4 leading-tight animate-fade-in animate-stagger-2">
              Plan, write, approve, and publish social content.{` `}
              <span className="bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                From one calmer workspace.
              </span>
            </h1>
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 font-semibold px-4 py-2 rounded-full shadow-sm text-sm tracking-tight border border-blue-200/60">
                <Zap className="w-4 h-4" />
                Analyze / Generate / Approve / Publish
              </span>
            </div>
            <p className="text-lg sm:text-xl text-neutral-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-fade-in animate-stagger-3">
              SuiteGenie helps you move from idea to approved post faster with brand-aware AI, cleaner planning, client feedback, and multi-platform publishing built for modern Indian teams.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              <div className="rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800 font-medium">
                Brand-aware AI drafts
              </div>
              <div className="rounded-xl border border-success-200 bg-success-50 px-3 py-2 text-sm text-success-800 font-medium">
                Client approvals in flow
              </div>
              <div className="rounded-xl border border-secondary-200 bg-secondary-50 px-3 py-2 text-sm text-secondary-800 font-medium">
                Multi-platform publishing
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6">
              <Button
                variant="primary"
                size="xl"
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-800 hover:to-cyan-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                icon={<Zap className="w-5 h-5" />}
                iconPosition="left"
              >
                Start Free
              </Button>
              <Button
                variant="outline"
                size="xl"
                onClick={handleWatchDemo}
                className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                icon={<PlayCircle className="w-5 h-5" />}
                iconPosition="left"
              >
                See How It Works
              </Button>
            </div>

            <div className="animate-fade-in animate-stagger-5">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                <div className="flex -space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-8 h-8 bg-gradient-to-br from-slate-600 to-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{String.fromCharCode(65 + i)}</span>
                    </div>
                  ))}
                </div>
                <span className="text-sm font-medium text-neutral-600 ml-3">Used by creators, operators, and agency teams</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 text-sm text-neutral-500">
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />No-login client approvals</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />BYOK AI support</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Built for Indian pricing</span>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end mt-12 lg:mt-0 animate-fade-in animate-stagger-6">
            <div className="relative w-full max-w-lg">
              <Card variant="elevated" className="p-6 bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-2xl hover-lift">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-blue-700 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">SuiteGenie Workspace</h3>
                        <p className="text-xs text-neutral-500">Weekly content pipeline</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-success-600 font-medium">Live</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">This week</p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700 border border-blue-100">3 pending approvals</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-white p-3 border border-blue-100">
                        <p className="text-[11px] uppercase tracking-wide text-neutral-500">Drafts</p>
                        <p className="mt-1 text-xl font-bold text-neutral-900">12</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 border border-blue-100">
                        <p className="text-[11px] uppercase tracking-wide text-neutral-500">Scheduled</p>
                        <p className="mt-1 text-xl font-bold text-neutral-900">8</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 border border-blue-100">
                        <p className="text-[11px] uppercase tracking-wide text-neutral-500">Published</p>
                        <p className="mt-1 text-xl font-bold text-neutral-900">21</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-success-50 to-white rounded-xl p-6 border border-success-400 shadow-md transform transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-success-100 rounded-lg shadow-sm">
                          <TrendingUp className="w-8 h-8 text-success-700" />
                        </div>
                        <div>
                          <span className="block text-xl font-bold text-neutral-900 tracking-tight">Brand Context Ready</span>
                          <span className="block text-sm text-neutral-500 font-medium">tone, themes, competitors, and account signals</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-success-100/80 text-success-700 rounded-md text-xs font-bold uppercase tracking-wider animate-pulse border border-success-200">
                        AI Setup
                      </span>
                    </div>
                    <div className="text-6xl font-black text-neutral-900 mb-1 tracking-tighter">
                      4
                    </div>
                    <div className="text-sm text-success-700 font-medium bg-success-50 p-2 rounded-md border border-success-100">
                      Content pillars mapped and ready to feed your next drafts.
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-slate-200 mt-2 shadow-sm">
                    <h4 className="text-sm font-bold text-neutral-800 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-700" /> Approval + publishing flow
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 opacity-90">
                        <div className="w-5 h-5 rounded-full bg-success-100 flex items-center justify-center">
                          <svg className="w-3 h-3 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className="text-xs text-neutral-700 font-medium">Draft generated with saved brand guidance</span>
                      </div>
                      <div className="flex items-center gap-3 opacity-90">
                        <div className="w-5 h-5 rounded-full bg-success-100 flex items-center justify-center">
                          <svg className="w-3 h-3 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className="text-xs text-neutral-700 font-medium">Client feedback captured in one approval thread</span>
                      </div>
                      <div className="flex items-center gap-3 bg-blue-50 p-2 rounded-md border border-blue-100">
                        <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center animate-pulse shadow-sm">
                          <div className="w-2 h-2 bg-blue-700 rounded-full"></div>
                        </div>
                        <span className="text-xs text-neutral-900 font-bold">Approved content moving into this week's queue...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="absolute -top-6 -right-6 bg-success-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xl transform rotate-3 z-10">
                Client-ready drafts
              </div>
              <div className="absolute -bottom-6 -left-6 bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xl transform -rotate-2 border-2 border-white z-10">
                Approval flow
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
