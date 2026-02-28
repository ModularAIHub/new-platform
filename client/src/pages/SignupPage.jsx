import React from "react";
import PublicSeo from '../components/PublicSeo';

const SignupPage = () => (
  <>
    <PublicSeo
      title="Sign Up | SuiteGenie"
      description="Create your SuiteGenie account to get started with AI social media automation, BYOK, analytics, and scheduling."
      canonicalPath="/register"
      noIndex
    />
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Create Your SuiteGenie Account</h1>
        <form>
          <label className="block mb-2 text-gray-700">Email</label>
          <input type="email" className="w-full mb-4 p-2 border rounded" placeholder="you@email.com" />
          <label className="block mb-2 text-gray-700">Password</label>
          <input type="password" className="w-full mb-6 p-2 border rounded" placeholder="Password" />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition">Sign Up</button>
        </form>
        <p className="mt-4 text-sm text-gray-500">Already have an account? <a href="/login" className="text-blue-600 underline">Log in</a></p>
      </div>
    </div>
  </>
);

export default SignupPage;
