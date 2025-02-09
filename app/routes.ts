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
  layout("components/protected-route.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
  ]),
] satisfies RouteConfig;
