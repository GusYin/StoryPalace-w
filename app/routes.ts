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
  layout("components/protected-route.tsx", [
    route("my-account", "routes/my-account.tsx"),
    route("name-your-voice", "routes/add-a-voice/name-your-voice.tsx"),
    route("upload-voice", "routes/add-a-voice/upload-voice.tsx"),
  ]),
] satisfies RouteConfig;
