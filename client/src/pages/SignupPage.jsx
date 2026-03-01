import React from "react";
import { Navigate, useLocation } from 'react-router-dom';
import PublicSeo from '../components/PublicSeo';

const SignupPage = () => {
  const location = useLocation();
  const search = location?.search || '';

  return (
    <>
      <PublicSeo
        title="Sign Up | SuiteGenie"
        description="Create your SuiteGenie account to get started with AI social media automation, BYOK, analytics, and scheduling."
        canonicalPath="/register"
        noIndex
      />
      <Navigate to={`/register${search}`} replace />
    </>
  );
};

export default SignupPage;
