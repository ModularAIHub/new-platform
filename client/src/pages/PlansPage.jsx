const PlansPage = () => (
  <div className="max-w-2xl mx-auto py-16 px-4 text-center">
    <h1 className="text-3xl font-bold mb-4">Plans & Pricing</h1>
    <p className="text-gray-600 mb-8">Choose the plan that fits your needs. Simple, transparent pricing for every user.</p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-2">Starter</h2>
        <p className="text-gray-500 mb-4">Free basic access</p>
        <span className="text-2xl font-bold">$0</span>
      </div>
      <div className="bg-white shadow rounded-xl p-6 border-2 border-blue-500">
        <h2 className="text-xl font-semibold mb-2">Pro</h2>
        <p className="text-gray-500 mb-4">Advanced features</p>
        <span className="text-2xl font-bold">$19/mo</span>
      </div>
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-2">Enterprise</h2>
        <p className="text-gray-500 mb-4">Custom solutions</p>
        <span className="text-2xl font-bold">Contact Us</span>
      </div>
    </div>
  </div>
);

export default PlansPage;
