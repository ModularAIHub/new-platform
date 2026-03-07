import { useNavigate } from 'react-router-dom';

const CTASection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register');
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl text-blue-700 font-extrabold mb-6">
          Ready to Run AI Content Ops?
        </h2>
        <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
          Move from strategy and competitor analysis to platform-specific content, automated planning, and cross-post execution in one workspace.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={handleGetStarted}
            className="bg-primary-600 text-white hover:bg-primary-700 font-semibold px-8 py-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Start Free
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
