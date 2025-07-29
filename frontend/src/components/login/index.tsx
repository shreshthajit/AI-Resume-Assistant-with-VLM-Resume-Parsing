'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';

const apiBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;


const LoginForm: React.FC = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorStatus, setErrorStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus('');

    if (!email || !password) {
      setErrorStatus('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // ✅ Save token and redirect
      localStorage.setItem('access_token', data.access_token);
      router.push('/home');
    } catch (error: any) {
      setErrorStatus(error.message || 'Login error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="h-screen gradient-form bg-gray-200 flex items-center justify-center">
      <div className="container py-12 px-6">
        <div className="flex justify-center items-center flex-wrap h-full text-gray-800">
          <div className="xl:w-10/12">
            <div className="bg-white shadow-lg rounded-lg">
              <div className="lg:flex">
                <div className="lg:w-6/12 px-4 md:px-0">
                  <div className="p-8 md:mx-6">
                    <div className="text-center">
                      <img
                        className="mx-auto w-48"
                        src="/images/floatingrobot.jpg"
                        alt="chatbot"
                      />
                      <h4 className="text-xl font-semibold mt-1 mb-6">AI Resume Parser</h4>
                    </div>

                    <form onSubmit={handleOnSubmit}>
                      <p className="mb-4">Please login to your account</p>

                      <div className="mb-4">
                        <input
                          type="text"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="mb-4">
                        <input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      {errorStatus && (
                        <p className="text-red-600 text-sm mb-4">{errorStatus}</p>
                      )}

                      <div className="text-center pt-1 mb-12 pb-1">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-gray-700 text-white py-2 px-4 rounded hover:opacity-90 transition"
                        >
                          {isLoading ? 'Logging in...' : 'Log in'}
                        </button>

                        <a className="text-gray-500 text-sm mt-2 inline-block" href="#">
                          Forgot password?
                        </a>
                      </div>

                      <div className="flex items-center justify-between pb-6">
                        <p className="mb-0 mr-2">Don’t have an account?</p>
                        <button
                          type="button"
                          onClick={() => router.push('/signup')}
                          className="px-4 py-1 rounded text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-gray-700 hover:opacity-90 transition border-0"
                        >
                          Sign up
                        </button>
                      </div>

                    </form>
                  </div>
                </div>

                <div
                  className="lg:w-6/12 flex items-center justify-center rounded-r-lg"
                  style={{
                    background: 'linear-gradient(135deg, #1e3c72, #2a5298, #38b2ac)',
                  }}
                >
                  <div className="flex flex-col justify-center items-center text-white px-8 py-20 text-center max-w-md mx-auto space-y-6">
                    <h4 className="text-3xl font-semibold tracking-wide drop-shadow-md leading-snug">
                      Empower Your Resume with Intelligence
                    </h4>
                    <p className="text-lg text-blue-100 bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/10 shadow-md leading-normal text-left mx-auto max-w-prose">
                      Upload your resume and let our AI, powered by <span className="text-teal-200 font-medium">VLM.run</span>, analyze every detail. Gain tailored insights, uncover skill gaps, and get expert suggestions — all in one intelligent assistant.
                    </p>

                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginForm;
