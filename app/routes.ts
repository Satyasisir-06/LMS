import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // Public landing page
  route("/", "routes/landing.tsx"),

  // Public auth section
  layout("routes/_auth.tsx", [
    route("login", "routes/_auth.login.tsx"),
    route("signup", "routes/_auth.signup.tsx"),
  ]),

  // Protected application shell
  layout("routes/_dashboard.tsx", [
    route("dashboard", "routes/_dashboard._index.tsx"),
    route("catalog", "routes/_dashboard.catalog.tsx"),
    route("wishlist", "routes/_dashboard.wishlist.tsx"),
    route("manage", "routes/_dashboard.manage.tsx"),
    route("circulation", "routes/_dashboard.circulation.tsx"),
    route("admin", "routes/_dashboard.admin.tsx"),
    route("profile", "routes/_dashboard.profile.tsx"),
    route("overdue", "routes/_dashboard.overdue.tsx"),
  ]),

  // Sign-out (POST)
  route("logout", "routes/logout.tsx"),
] satisfies RouteConfig;
