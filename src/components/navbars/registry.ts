import type { ComponentType } from "react";
import { NAV_ITEMS, type NavbarProps, type NavItem } from "@/lib/nav-items";
import PillIndicator from "./PillIndicator";

export type VariantSurface = "dark" | "light" | "gradient";

export type Variant = {
  id: string;
  name: string;
  note: string;
  surface: VariantSurface;
  /** Extra padding around the bar inside the phone frame. */
  inset?: boolean;
  items: NavItem[];
  Component: ComponentType<NavbarProps>;
};

/** Add a new variant by dropping a component in this folder and appending here. */
export const VARIANTS: Variant[] = [
  {
    id: "pill",
    name: "Pill Indicator",
    note: "Shared-layout pill slides between tabs, label unrolls",
    surface: "light",
    inset: true,
    items: NAV_ITEMS,
    Component: PillIndicator,
  },
];
