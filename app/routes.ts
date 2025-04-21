import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("about", "routes/about.tsx"),
  route("stories-showcase", "routes/stories-showcase.tsx"),
  route("voxbox-showcase", "routes/voxbox-showcase.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("verify-email", "routes/verify-email.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  route("pricing", "routes/pricing.tsx"),
  layout("components/protected-route.tsx", [
    route("auth-redirect", "routes/auth-redirect.tsx"),
    route("my-account", "routes/my-account/my-account.tsx"),
    route(
      "subscribe-plan/:plan/:monthlyOrYearly",
      "routes/my-account/subscribe-plan.tsx"
    ),
    route("library", "routes/library.tsx"),
    route("library/:storyId", "routes/story-series-detail.tsx"),
    route("story-player", "routes/story-player.tsx"),
    route("name-your-voice", "routes/add-a-voice/name-your-voice.tsx"),
    route("upload-voice", "routes/add-a-voice/upload-voice.tsx"),
    route("confirm-save-voice", "routes/add-a-voice/confirm-save-voice.tsx"),
    route("add-voice-success", "routes/add-a-voice/add-voice-success.tsx"),
  ]),
] satisfies RouteConfig;
