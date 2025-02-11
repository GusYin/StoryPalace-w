import React from "react";
import { StoryPalaceLogo } from "~/components/icons/story-palace-logo";

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen  bg-white">
      {/* Sticky Navigation Bar */}
      <nav className="sticky h-[64px] top-0 bg-white shadow-sm z-50 relative">
        {/* Logo positioned absolutely */}
        <div className="absolute top-[15px] bottom-[14px]">
          <StoryPalaceLogo />
        </div>

        {/* Navigation buttons container */}
        <div className="container mx-auto px-4 pt-[15px] pb-[14px] flex justify-end items-center">
          <div className="flex space-x-4">
            <button className="hover:text-blue-600">Cart</button>
            <button className="hover:text-blue-600">Login</button>
            <button
              type="button"
              className="text-white bg-custom-teal hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
            >
              Get started
            </button>
          </div>
          <div className="flex space-x-4">
            <button className="hover:text-blue-600">Cart</button>
            <button className="hover:text-blue-600">Login</button>
            <button
              type="button"
              className="text-white bg-custom-teal hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
