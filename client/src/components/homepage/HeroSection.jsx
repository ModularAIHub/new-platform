import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../ui';
import { Zap, Users, TrendingUp, Star } from 'lucide-react';

const HeroSection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register');
  };



  return (
    <section className="relative bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 pt-8 pb-16 overflow-hidden min-h-[80vh] flex items-center">
      {/* Enhanced decorative shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-primary-200/30 to-primary-300/20 rounded-full blur-3xl z-0 animate-pulse-slow"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-blue-200/20 rounded-full blur-3xl z-0 animate-pulse-slow" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-primary-100/20 to-purple-100/20 rounded-full blur-2xl z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left animate-fade-in">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-neutral-900 mb-4 leading-tight animate-fade-in animate-stagger-2">
              Supercharge Your Content with{' '}
              <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                SuiteGenie
              </span>
            </h1>
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-100 to-purple-100 text-primary-700 font-semibold px-4 py-2 rounded-full shadow-sm text-sm tracking-tight border border-primary-200/50">
                <Zap className="w-4 h-4" />
                Automate your content, not your creativity
              </span>
            </div>
            <p className="text-lg sm:text-xl text-neutral-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-fade-in animate-stagger-3">
              The all-in-one AI suite for creators, marketers, and teams. Effortlessly generate, schedule, and manage content across every platform—so you can focus on what matters most: growing your brand.
            </p>

            <div className="flex justify-center lg:justify-start mb-6">
              <Button
                variant="primary"
                size="xl"
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                icon={<Zap className="w-5 h-5" />}
                iconPosition="left"
              >
                Start Creating for Free
              </Button>
            </div>

            {/* Social Proof */}
            <div className="animate-fade-in animate-stagger-5">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                <div className="flex -space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-8 h-8 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{String.fromCharCode(65 + i)}</span>
                    </div>
                  ))}
                </div>
                <span className="text-sm font-medium text-neutral-600 ml-3">Join creators worldwide</span>
              </div>
              <p className="text-sm text-neutral-500">Trusted by creators, marketers, and growing businesses worldwide</p>
            </div>
          </div>

          {/* Right Content - Enhanced Dashboard Preview */}
          <div className="relative flex justify-center lg:justify-end mt-12 lg:mt-0 animate-fade-in animate-stagger-6">
            <div className="relative w-full max-w-lg">
              {/* Main Dashboard Card */}
              <Card variant="elevated" className="p-6 bg-gradient-to-br from-white to-primary-50/50 border-primary-200/50 shadow-2xl hover-lift">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">SuiteGenie Dashboard</h3>
                        <p className="text-xs text-neutral-500">AI Content Suite</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-success-600 font-medium">Live</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/80 rounded-lg p-3 border border-primary-100">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-success-600" />
                        <span className="text-xs font-medium text-neutral-600">Content Created</span>
                      </div>
                      <div className="text-lg font-bold text-neutral-900">---</div>
                      <div className="text-xs text-success-600">Ready to start</div>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3 border border-primary-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-primary-600" />
                        <span className="text-xs font-medium text-neutral-600">Engagement</span>
                      </div>
                      <div className="text-lg font-bold text-neutral-900">---</div>
                      <div className="text-xs text-primary-600">Track your growth</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-white/80 rounded-lg p-4 border border-primary-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-700">AI Processing</span>
                      <span className="text-sm font-bold text-primary-600">87%</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-primary-500 to-purple-500 h-2 rounded-full transition-all duration-1000" style={{width: '87%'}}></div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-success-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg animate-bounce">
                Schedule posts
              </div>
              <div className="absolute -bottom-4 -left-4 bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg animate-pulse">
                AI generating...
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
