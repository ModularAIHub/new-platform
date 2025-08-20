import { Link } from 'react-router-dom';

const Navbar = () => (
  <nav className="bg-white shadow px-6 py-3 flex items-center justify-between">
    {/* Autoverse Brand */}
    <div className="flex items-center">
      <span className="font-extrabold text-2xl tracking-tight text-blue-700">Autoverse</span>
    </div>
    {/* Navigation Links */}
    <div className="flex items-center space-x-8">
      <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
      <Link to="/plans" className="text-gray-700 hover:text-blue-600 font-medium">Plans & Pricing</Link>
      <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium">About</Link>
      <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium">Contact</Link>
    </div>
    {/* Login/Signup Links */}
    <div className="flex items-center space-x-6">
      <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium">Login</Link>
      <Link to="/register" className="text-blue-600 hover:text-blue-800 font-semibold border border-blue-600 px-4 py-1 rounded transition">Sign Up</Link>
    </div>
  </nav>
);

export default Navbar;
