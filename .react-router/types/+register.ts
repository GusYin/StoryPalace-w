import "react-router";

declare module "react-router" {
  interface Register {
    params: Params;
  }
}

type Params = {
  "/": {};
  "/about": {};
  "/login": {};
  "/signup": {};
  "/verify-email": {};
  "/reset-password": {};
  "/pricing": {};
  "/auth-redirect": {};
  "/my-account": {};
  "/order-summary/:plan/:monthlyOrYearly": {
    "plan": string;
    "monthlyOrYearly": string;
  };
  "/checkout/return": {};
  "/payment/:plan/:monthlyOrYearly": {
    "plan": string;
    "monthlyOrYearly": string;
  };
  "/library": {};
  "/library/:storyId": {
    "storyId": string;
  };
  "/story-player": {};
  "/name-your-voice": {};
  "/upload-voice": {};
  "/confirm-save-voice": {};
  "/add-voice-success": {};
  "/admin-story-upload": {};
};