import "react-router";

declare module "react-router" {
  interface Register {
    params: Params;
  }
}

type Params = {
  "/": {};
  "/about": {};
  "/stories-showcase": {};
  "/voxbox-showcase": {};
  "/login": {};
  "/signup": {};
  "/verify-email": {};
  "/reset-password": {};
  "/pricing": {};
  "/my-account": {};
  "/upgrade-plan": {};
  "/subscribe-plan/:plan/:monthlyOrYearly": {
    "plan": string;
    "monthlyOrYearly": string;
  };
  "/name-your-voice": {};
  "/upload-voice": {};
  "/confirm-save-voice": {};
  "/add-voice-success": {};
};