import { formatFcfa } from "./format";

/** wa.me link; 8-digit numbers are treated as Malian (+223). */
export function waLink(phone: string, text: string): string {
  let digits = (phone || "").replace(/\D+/g, "");
  if (digits.length === 8) digits = `223${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function trackingUrl(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/suivi/${token}`;
}

function firstName(name: string): string {
  return (name || "").trim().split(/\s+/)[0] ?? "";
}

interface MessageInput {
  clientName: string;
  token: string;
  model?: string;
  balance?: number;
  shop?: string;
}

/** Ready-made messages the tailor sends in one tap. */
export const MESSAGES = {
  received: ({ clientName, token, model, shop }: MessageInput) =>
    `Bonjour ${firstName(clientName)}, votre commande${model ? ` « ${model} »` : ""} est bien enregistrée chez ${
      shop || "nous"
    }. Suivez son avancement ici : ${trackingUrl(token)}`,
  ready: ({ clientName, token, model, balance }: MessageInput) =>
    `Bonjour ${firstName(clientName)}, bonne nouvelle : votre tenue${model ? ` « ${model} »` : ""} est prête !${
      balance ? ` Reste à régler : ${formatFcfa(balance)}.` : ""
    } Détails : ${trackingUrl(token)}`,
  reminder: ({ clientName, token, balance }: MessageInput) =>
    `Bonjour ${firstName(clientName)}, petit rappel : il reste ${formatFcfa(balance)} à régler pour votre commande. Merci ! ${trackingUrl(
      token
    )}`,
  link: ({ clientName, token }: MessageInput) =>
    `Bonjour ${firstName(clientName)}, voici votre espace client (commandes et mesures) : ${trackingUrl(token)}`,
};
