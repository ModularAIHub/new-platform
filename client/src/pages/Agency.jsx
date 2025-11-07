import React, { useRef } from 'react';
import { FaPaintBrush, FaUsers, FaBullhorn, FaCode, FaChartLine } from 'react-icons/fa';
import Footer from '../components/Footer';

const services = [
	{
		icon: <FaPaintBrush size={32} className="text-blue-400" />,
		title: 'UI/UX Design',
		description: 'Custom interfaces, user flows, wireframes, prototyping',
	},
	{
		icon: <FaUsers size={32} className="text-purple-400" />,
		title: 'Logo & Branding',
		description: 'Logo design, color palette, brand guidelines',
	},
	{
		icon: <FaBullhorn size={32} className="text-pink-400" />,
		title: 'Digital Marketing & SEO',
		description: 'SEO strategy, blog writing, content creation',
	},
	{
		icon: <FaCode size={32} className="text-green-400" />,
		title: 'Website Development',
		description: 'WordPress builds, custom dev, maintenance',
	},
	{
		icon: <FaChartLine size={32} className="text-yellow-400" />,
		title: 'Social Media Management',
		description: 'Automation, analytics, growth, SuiteGenie platform',
	},
];

const portfolio = [
	{
		name: 'AniCafe',
		metric: '100,000+ users in 2023',
		description:
			'Full-stack dev, UX improvements, digital marketing for exponential growth.',
	},
	{
		name: 'Fotographiya',
		metric: '30% organic traffic boost',
		description:
			'SEO strategy, website management, top keyword rankings.',
	},
	{
		name: 'Code & Conscience',
		metric: 'Exponential traffic growth',
		description:
			'Scalable site, advanced SEO, quality content strategies.',
	},
];

const Agency = () => {
	const servicesRef = useRef(null);
	const handleScrollToServices = () => {
		if (servicesRef.current) {
			servicesRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	};

	return (
		<div className="bg-white">
			{/* Hero Section */}
			<section className="relative min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 overflow-hidden">
				<div className="absolute inset-0 pointer-events-none">
					<div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/40 to-purple-400/20 rounded-full blur-3xl"></div>
					<div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-400/40 to-blue-400/20 rounded-full blur-3xl"></div>
				</div>
				<div className="relative z-10 w-full max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
					{/* Left: Headline & CTA */}
					<div className="text-center md:text-left flex flex-col justify-center">
						<span className="inline-block mb-4 px-4 py-2 rounded-full bg-white/10 text-white font-semibold text-sm tracking-wide shadow">
							SuiteGenie Agency
						</span>
						<h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-4">
							<span className="block text-white">
								Comprehensive Digital Solutions
							</span>
							<span className="block text-yellow-300">for Ambitious Brands</span>
						</h1>
						<p className="text-lg text-white/90 mb-8 max-w-xl mx-auto md:mx-0">
							We help brands scale and thrive in the digital age. UI/UX, branding,
							marketing, SEO, and custom web development—SuiteGenie is your partner
							for growth, leveraging automation and analytics to deliver measurable
							results.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
							<button
								onClick={handleScrollToServices}
								className="px-8 py-3 bg-blue-700 text-white rounded-lg font-semibold shadow-lg hover:bg-blue-800 transition"
							>
								Explore Services
							</button>
							<a
								href="/contact"
								className="px-8 py-3 bg-white text-blue-700 rounded-lg font-semibold shadow-lg hover:bg-blue-100 transition border border-blue-200"
							>
								Contact Us
							</a>
						</div>
					</div>
					{/* Right: Visual Card */}
					<div className="flex justify-center md:justify-end">
						<div className="relative w-[320px] h-[220px] bg-white rounded-2xl shadow-xl flex items-center justify-center overflow-hidden">
							<span className="absolute top-4 left-4 px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-full shadow">
								Agency Expertise
							</span>
							<img
								src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80"
								alt="SuiteGenie Agency Teamwork"
								className="w-full h-full object-cover rounded-2xl"
							/>
							<span className="absolute bottom-4 right-4 px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-full shadow">
								Strategy & Growth
							</span>
						</div>
					</div>
				</div>
			</section>

			{/* Services Slider */}
			<section id="services" ref={servicesRef} className="max-w-5xl mx-auto py-12">
				<h3 className="text-3xl font-bold text-center mb-8 text-black">
					Our Services
				</h3>
				<div className="relative">
					<div className="flex overflow-x-auto no-scrollbar gap-8 px-2 pb-4">
						{services.map((service, idx) => (
							<div
								key={service.title}
								className="min-w-[260px] max-w-xs flex-shrink-0 bg-white rounded-xl p-8 flex flex-col items-center shadow-lg"
							>
								{service.icon}
								<h4 className="mt-4 text-xl font-semibold text-black">
									{service.title}
								</h4>
								<p className="mt-2 text-black text-opacity-80 text-center">
									{service.description}
								</p>
							</div>
						))}
					</div>
					{/* Optional: Add left/right arrow buttons for navigation if needed */}
				</div>
			</section>

			{/* Portfolio Highlights */}
			<section className="max-w-5xl mx-auto py-12">
				<h3 className="text-3xl font-bold text-center mb-8 text-black">
					Portfolio Highlights
				</h3>
				<p className="text-center text-lg text-black mb-10">
					Here are some of the brands and projects where I was employed and
					contributed directly to their growth and success.
				</p>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div className="bg-white bg-opacity-80 rounded-xl p-6 shadow-lg">
						<div className="text-2xl font-bold text-black mb-2">Fotographiya</div>
						<div className="text-lg text-blue-700 mb-2">
							SEO & Traffic Boost for Startup
						</div>
						<div className="text-black text-opacity-80">
							Employed as SEO strategist and web assistant. Set up SEO, selected
							keywords, and assisted in website development. Achieved ~30% increase in
							organic traffic and top rankings for selected keywords.
						</div>
					</div>
					<div className="bg-white bg-opacity-80 rounded-xl p-6 shadow-lg">
						<div className="text-2xl font-bold text-black mb-2">Code & Conscience</div>
						<div className="text-lg text-blue-700 mb-2">
							SEO, Blogging & Website Setup
						</div>
						<div className="text-black text-opacity-80">
							Employed as technical lead. Assisted in setting up website in Framer,
							implemented SEO and blogging, managed Google Search Console, and drove
							end-to-end growth. Achieved over 500 impressions and 30 clicks in 55
							days.
						</div>
					</div>
					<div className="bg-white bg-opacity-80 rounded-xl p-6 shadow-lg">
						<div className="text-2xl font-bold text-black mb-2">AniCafe</div>
						<div className="text-lg text-blue-700 mb-2">
							Anime Streaming & Blogging
						</div>
						<div className="text-black text-opacity-80">
							My own website and anime community (Telegram). Built and scaled AniCafe to 100,000+ users in 2023 through full-stack development, user experience improvements, and digital marketing strategies.
						</div>
					</div>
				</div>
			</section>

			{/* Why Choose Us */}
			<section className="max-w-4xl mx-auto py-16 px-4 bg-blue-50 rounded-xl">
				<h3 className="text-3xl font-bold text-center mb-6 text-black">
					Why Choose Us
				</h3>
				<p className="text-center text-lg text-black mb-10">
					While building SuiteGenie, I developed powerful tools for social media
					automation and management. But I realized our expertise could help brands
					even further,so we decided to offer our services directly. SuiteGenie
					Agency combines deep technical skills, creative vision, and our own advanced
					tools to deliver measurable results for your brand. Partner with us to
					scale your digital presence and achieve real growth.
				</p>
				<div className="flex flex-wrap justify-center gap-8">
					<div className="bg-white rounded-xl px-8 py-8 flex flex-col items-center min-w-[220px] shadow-md">
						<span className="text-blue-500 text-3xl mb-2">
							<i className="fas fa-code"></i>
						</span>
						<span className="font-semibold text-black">Full-stack expertise</span>
					</div>
					<div className="bg-white rounded-xl px-8 py-8 flex flex-col items-center min-w-[220px] shadow-md">
						<span className="text-purple-500 text-3xl mb-2">
							<i className="fas fa-chart-line"></i>
						</span>
						<span className="font-semibold text-black">
							SuiteGenie tool advantage
						</span>
					</div>
					<div className="bg-white rounded-xl px-8 py-8 flex flex-col items-center min-w-[220px] shadow-md">
						<span className="text-pink-500 text-3xl mb-2">
							<i className="fas fa-bullhorn"></i>
						</span>
						<span className="font-semibold text-black">Proven performance</span>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="text-center py-16">
				<h3 className="text-3xl font-bold text-black mb-4">
					Ready to elevate your brand?
				</h3>
				<a
					href="/contact"
					className="inline-block px-8 py-3 bg-pink-600 text-white rounded-lg font-semibold shadow-lg hover:bg-pink-700 transition"
				>
					Contact Us
				</a>
			</section>
			<Footer />
		</div>
	);
};

export default Agency;
