import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80" 
            alt="Campus Background" 
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#82001A]/70 to-black/50 mix-blend-multiply" />
        </div>
        
        <div className="relative px-4 py-24 sm:px-6 sm:py-32 lg:py-40 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              VJLNF
            </h1>
            <p className="mt-6 text-xl text-white max-w-2xl mx-auto">
              The easiest way to report and recover lost items on campus. Our platform connects the campus community to help return lost belongings to their rightful owners.
            </p>
            <div className="mt-10 flex gap-x-6 justify-center">
              {currentUser ? (
                <>
                  <Link
                    to="/report/lost"
                    className="rounded-md bg-white px-6 py-3 text-base font-medium text-[#82001A] shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white/75"
                  >
                    Report Lost Item
                  </Link>
                  <Link
                    to="/report/found"
                    className="rounded-md bg-[#82001A] px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-[#82001A]/90 focus:outline-none focus:ring-2 focus:ring-[#82001A]/75"
                  >
                    Report Found Item
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-md bg-white px-6 py-3 text-base font-medium text-[#82001A] shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white/75"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="rounded-md bg-[#82001A] px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-[#82001A]/90 focus:outline-none focus:ring-2 focus:ring-[#82001A]/75"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-lg font-semibold text-[#82001A]">How It Works</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Reunite with your lost items in just a few steps
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl sm:mt-16 lg:mt-20 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-[#82001A]">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  Report Your Item
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Create a detailed listing for your lost item or an item you've found on campus. Include photos, location, date, and description.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-[#82001A]">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  Browse Listings
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Search through our database of lost and found items. Use filters to narrow down your search by category, location, or date.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-[#82001A]">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                  </div>
                  Get Connected
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  When a match is found, our system connects you with the finder/owner to arrange a safe return of your belongings.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      
      {/* Statistics Section */}
      <div className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="text-center">
              <h2 className="text-lg font-semibold leading-8 text-[#82001A]">
                Trusted by the entire campus community
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Helping students reconnect with their belongings
              </p>
            </div>
            <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col bg-white p-8">
                <dt className="text-sm font-semibold leading-6 text-gray-600">Items returned</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-[#82001A]">500+</dd>
              </div>
              <div className="flex flex-col bg-white p-8">
                <dt className="text-sm font-semibold leading-6 text-gray-600">Active users</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-[#82001A]">2,000+</dd>
              </div>
              <div className="flex flex-col bg-white p-8">
                <dt className="text-sm font-semibold leading-6 text-gray-600">Items currently listed</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-[#82001A]">150+</dd>
              </div>
              <div className="flex flex-col bg-white p-8">
                <dt className="text-sm font-semibold leading-6 text-gray-600">Success rate</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-[#82001A]">85%</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl py-16 px-6 lg:px-8">
          <div className="overflow-hidden rounded-lg bg-[#82001A] shadow-xl lg:grid lg:grid-cols-2 lg:gap-4">
            <div className="px-6 pt-10 pb-12 sm:px-16 sm:pt-16 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
              <div className="lg:self-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  <span className="block">Ready to recover your lost items?</span>
                  <span className="block">Start using our platform today.</span>
                </h2>
                <p className="mt-4 text-lg leading-6 text-white">
                  Join thousands of campus members who have successfully recovered their lost belongings through our easy-to-use platform.
                </p>
                <div className="mt-8">
                  {currentUser ? (
                    <Link
                      to="/lost-items"
                      className="inline-block rounded-md border border-transparent bg-white px-6 py-3 text-base font-medium text-[#82001A] shadow hover:bg-gray-50"
                    >
                      Browse Lost Items
                    </Link>
                  ) : (
                    <Link
                      to="/signup"
                      className="inline-block rounded-md border border-transparent bg-white px-6 py-3 text-base font-medium text-[#82001A] shadow hover:bg-gray-50"
                    >
                      Get started
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <div className="-mt-6 aspect-w-5 aspect-h-3 md:aspect-w-2 md:aspect-h-1 relative hidden lg:block">
              <img
                className="translate-x-6 translate-y-6 rounded-md object-cover object-left-top sm:translate-x-16 lg:translate-y-20"
                src="https://images.unsplash.com/photo-1620533003284-47d02aedd408?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80"
                alt="Students on campus"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;