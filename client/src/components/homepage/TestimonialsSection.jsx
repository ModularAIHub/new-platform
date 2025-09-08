import React from 'react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Annette Black",
      role: "Founder at GreenFox", 
      initials: "AB",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
      stars: 5,
      quote: "This platform transformed how we manage our social media. The AI-powered content creation saves us hours every week, and our engagement has never been better."
    },
    {
      name: "Savannah Nguyen",
      role: "Founder at GreenFox",
      initials: "SN", 
      bgColor: "bg-green-100",
      textColor: "text-green-600",
      stars: 5,
      quote: "The analytics insights are incredible. We can now predict which content will perform best and optimize our strategy accordingly. Game-changer for our business."
    },
    {
      name: "Darlene Robertson", 
      role: "Founder at GreenFox",
      initials: "DR",
      bgColor: "bg-purple-100", 
      textColor: "text-purple-600",
      stars: 5,
      quote: "Simple, intuitive, and powerful. Our small team can now compete with larger companies in terms of social media presence. Highly recommended!"
    },
    {
      name: "Savannah Nguyen",
      role: "Marketing Director", 
      initials: "SN",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-600", 
      stars: 5,
      quote: "The automation features are fantastic. We can schedule weeks of content in advance while maintaining our brand voice. It's like having a social media manager that never sleeps."
    },
    {
      name: "Darlene Robertson",
      role: "CEO at TechStart",
      initials: "DR", 
      bgColor: "bg-red-100",
      textColor: "text-red-600",
      stars: 5,
      quote: "ROI has been exceptional. We've seen a 300% increase in social media engagement and our customer acquisition costs have dropped significantly."
    },
    {
      name: "Annette Black", 
      role: "Creative Director",
      initials: "AB",
      bgColor: "bg-indigo-100",
      textColor: "text-indigo-600",
      stars: 5, 
      quote: "The cross-platform integration is seamless. We can manage Twitter, LinkedIn, and our upcoming WordPress content all from one dashboard. Brilliant!"
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light text-gray-900 mb-6">
            Trusted by Families and Small Business
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
              {/* Stars */}
              <div className="flex items-center mb-6">
                {[...Array(testimonial.stars)].map((_, starIndex) => (
                  <svg key={starIndex} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-600 leading-relaxed mb-6">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center">
                <div className={`w-12 h-12 ${testimonial.bgColor} rounded-full flex items-center justify-center mr-4`}>
                  <span className={`${testimonial.textColor} font-semibold`}>
                    {testimonial.initials}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
