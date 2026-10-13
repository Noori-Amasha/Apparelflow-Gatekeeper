import {
  Scissors,
  ClipboardCheck,
  Shirt,
  ChartNoAxesCombined,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "../../types/auth";

export type NavItem = {
  label: string;
  path?: string;
  icon: LucideIcon;
  roles?: Role[];
  disabled?: boolean;
};

export const roleHome: Record<Role, string> = {
  cutting_supervisor: "/cutting/orders",
  cutting_verifier: "/verification",
  sewing_supervisor: "/sewing",
};

export const navigation: NavItem[] = [
  {
    label: "Cutting Orders",
    icon: Scissors,
    path: roleHome.cutting_supervisor,
    roles: ["cutting_supervisor"],
  },
  {
    label: "Verify Batches",
    icon: ClipboardCheck,
    path: roleHome.cutting_verifier,
    roles: ["cutting_verifier"],
  },
  {
    label: "Sewing Operations",
    icon: Shirt,
    path: roleHome.sewing_supervisor,
    roles: ["sewing_supervisor"],
  },
  {
    label: "Reports",
    icon: ChartNoAxesCombined,
    disabled: true,
  },
  {
    label: "Settings",
    icon: Settings,
    disabled: true,
  },
];
