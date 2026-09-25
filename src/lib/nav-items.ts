import { Home, Search, Heart, User, Plus, Compass, Bell, ShoppingBag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

/** Shared item set so every variant renders the same content. */
export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "search", label: "Search", icon: Search },
  { id: "saved", label: "Saved", icon: Heart, badge: 3 },
  { id: "profile", label: "Profile", icon: User },
];

export const NAV_ITEMS_5: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "create", label: "Create", icon: Plus },
  { id: "alerts", label: "Alerts", icon: Bell, badge: 9 },
  { id: "cart", label: "Cart", icon: ShoppingBag, badge: 2 },
];

export type NavbarProps = {
  items?: NavItem[];
  active: string;
  onChange: (id: string) => void;
};
