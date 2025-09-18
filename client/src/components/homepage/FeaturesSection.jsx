import { Card, CardContent } from '../ui';
import { Twitter, Linkedin, FileText, Zap } from 'lucide-react';

const FeaturesSection = () => {

  const platforms = [
    {
      icon: <Twitter className="w-8 h-8" />,
      title: "Tweet Genie",
      description: "AI-powered tweet and thread generation with smart scheduling. Connect via OAuth, create content in bulk with credits, and track performance with detailed analytics. Scale your X/Twitter presence effortlessly.",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      stats: "OAuth integration & bulk creation",
      features: ["OAuth Connection", "Bulk Content Creation", "Performance Analytics"],
      url: "https://tweet.suitegenie.in"
    },
    {
      icon: <Linkedin className="w-8 h-8" />,
      title: "LinkedIn Automator", 
      description: "Professional networking made effortless! Generate thought-leadership content, schedule industry insights, and build your professional brand.",
      color: "from-blue-600 to-blue-700",
      bgColor: "bg-blue-50",
      stats: "Professional networking made easy",
      features: ["Professional Content", "Industry Insights", "Brand Building"]
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "WordPress Automator",
      description: "Transform your blog into a content powerhouse! Auto-generate SEO-optimized posts, schedule publications, and keep your audience engaged.",
      color: "from-neutral-600 to-neutral-700",
      bgColor: "bg-neutral-50",
      stats: "SEO-optimized blog content",
      features: ["SEO Optimization", "Auto Publishing", "Content Calendar"]
    }
  ];

  return (
    <section className="pt-8 pb-24 bg-gradient-to-br from-neutral-50 via-primary-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Powerful AI Tools
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 tracking-tight">
            How SuiteGenie Works
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            Automate your content creation, scheduling, and publishing across all your favorite platforms—without losing your creative touch.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-16">
          {platforms.map((platform, index) => (
            <Card 
              key={index} 
              variant="interactive" 
              className={`text-center hover-lift animate-fade-in`}
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <CardContent className="p-8">
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${platform.color} rounded-xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg`}>
                  {platform.icon}
                </div>
                
                {/* Title */}
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">{platform.title}</h3>
                
                {/* Description */}
                <p className="text-neutral-600 leading-relaxed mb-6">
                  {platform.description}
                </p>
                
                {/* Stats */}
                <div className="bg-primary-50 rounded-lg p-3 mb-4">
                  <p className="text-sm font-semibold text-primary-700">{platform.stats}</p>
                </div>
                
                {/* Features List */}
                <div className="space-y-2">
                  {platform.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center justify-center gap-2 text-sm text-neutral-600">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                  {/* Add access button for Tweet Genie only */}
                  {platform.title === 'Tweet Genie' && platform.url && (
                    <div className="mt-6 flex justify-center">
                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        title="Open Tweet Genie"
                      >
                        Access Tweet Genie
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>


      </div>
    </section>
  );
};

export default FeaturesSection;
