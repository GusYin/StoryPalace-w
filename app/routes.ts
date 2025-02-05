import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  route("register", "routes/register.tsx"),
  route("about", "routes/about.tsx"),
  route("stories-showcase", "routes/stories-showcase.tsx"),
  route("voxbox-showcase", "routes/voxbox-showcase.tsx"),
  layout("components/protected-route.tsx", [
    index("routes/dashboard.tsx"),
    route("login", "routes/login.tsx"),
  ]),
] satisfies RouteConfig;
