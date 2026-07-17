import { createLocalizedPathnamesNavigation } from "next-intl/navigation";
import { locales } from "./request";

export const { Link, redirect, usePathname, useRouter } =
  createLocalizedPathnamesNavigation({
    locales,
    pathnames: {
      "/": "/",
      "/admin": "/admin",
      "/stats": "/stats",
      "/airdrops": "/airdrops",
      "/inbox": "/inbox",
      "/settings": "/settings",
      "/login": "/login",
      "/site-admin": "/site-admin",
    },
  });
