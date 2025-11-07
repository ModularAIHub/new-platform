import React from 'react';
import { FaChartLine, FaBullhorn, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const AgencyPreviewSection = () => {
  const navigate = useNavigate();
  return (
    <section className="max-w-5xl mx-auto py-16 px-4 text-center">
      <h2 className="text-4xl font-bold mb-4 text-black">SuiteGenie Agency</h2>
      <p className="text-lg text-neutral-700 mb-8">
        Unlock full-stack expertise, automation, and creative strategy for your brand. SuiteGenie Agency offers UI/UX, branding, marketing, SEO, and web development services—powered by the same tools behind SuiteGenie.
      </p>
      <div className="flex flex-wrap justify-center gap-8 mb-8">
        <div className="bg-white rounded-xl px-8 py-8 flex flex-col items-center min-w-[180px] shadow-md">
          <span className="text-blue-500 text-3xl mb-2"><FaChartLine /></span>
          <span className="font-semibold text-black">Growth Strategy</span>
        </div>
        <div className="bg-white rounded-xl px-8 py-8 flex flex-col items-center min-w-[180px] shadow-md">
          <span className="text-purple-500 text-3xl mb-2"><FaBullhorn /></span>
          <span className="font-semibold text-black">Marketing & SEO</span>
        </div>
        <div className="bg-white rounded-xl px-8 py-8 flex flex-col items-center min-w-[180px] shadow-md">
          <span className="text-pink-500 text-3xl mb-2"><FaUsers /></span>
          <span className="font-semibold text-black">Branding & UX</span>
        </div>
      </div>
      <button
        onClick={() => navigate('/agency')}
        className="px-8 py-3 bg-blue-700 text-white rounded-lg font-semibold shadow-lg hover:bg-blue-800 transition"
      >
        Learn More
      </button>
    </section>
  );
};

export default AgencyPreviewSection;
