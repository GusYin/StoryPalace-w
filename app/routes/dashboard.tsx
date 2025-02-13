import React from "react";
import AuthHeader from "~/components/auth-header";
import { StoryPalaceLogo } from "~/components/icons/story-palace-logo";

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen  bg-white">
      <AuthHeader />
    </div>
  );
};

export default Dashboard;
