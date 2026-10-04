import {
  Sun,
  Users,
  Scissors,
  Package,
  Wallet,
  UserCog,
  Truck,
  BarChart3,
  MessageCircle,
  Store,
  Ruler,
  ClipboardList,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  ownerOnly?: boolean;
}

/** Bottom bar on phones (around the central mic) and top of the desktop sidebar. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/today", label: "Aujourd'hui", icon: Sun },
  { href: "/orders", label: "Commandes", icon: Scissors },
  { href: "/clients", label: "Clients", icon: Users },
];

/** Desktop sidebar + the mobile "Plus" sheet. */
export const SECONDARY_NAV: NavItem[] = [
  { href: "/finance", label: "Caisse", icon: Wallet, ownerOnly: true },
  { href: "/inventory", label: "Stock", icon: Package, ownerOnly: true },
  { href: "/measurement-templates", label: "Modèles de mesure", icon: Ruler, ownerOnly: true },
  { href: "/dashboard", label: "Statistiques", icon: BarChart3, ownerOnly: true },
  { href: "/staff", label: "Équipe", icon: UserCog, ownerOnly: true },
  { href: "/suppliers", label: "Fournisseurs", icon: Truck, ownerOnly: true },
  { href: "/inventory-form-templates", label: "Fiches de stock", icon: ClipboardList, ownerOnly: true },
  { href: "/commerce", label: "Boutique", icon: Store, ownerOnly: true },
  { href: "/communications", label: "Messages", icon: MessageCircle, ownerOnly: true },
  { href: "/settings", label: "Réglages", icon: Settings, ownerOnly: true },
];
