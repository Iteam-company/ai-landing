// Content registry — resolves the copy for a locale.
//
// Types live in `content/types.ts`; the copy itself lives per locale in
// `content/<locale>/site.ts` (marketing) and `content/<locale>/ui.ts` (interface
// chrome). Adding a language means adding one such folder and registering it in
// the two maps below, next to its entry in `LOCALES` (lib/lang.ts).
//
// CLIENT-SAFE plain data, so components and route handlers can both import it.

import { DEFAULT_LOCALE, type Locale } from "@/lib/lang";
import type { Site, Ui } from "./types";
import { site as ruSite } from "./ru/site";
import { ui as ruUi } from "./ru/ui";
import { site as enSite } from "./en/site";
import { ui as enUi } from "./en/ui";

/** Marketing copy per locale. */
export const content: Record<Locale, Site> = { ru: ruSite, en: enSite };

/** Interface strings per locale. */
export const uiContent: Record<Locale, Ui> = { ru: ruUi, en: enUi };

export function getContent(locale: Locale): Site {
  return content[locale];
}

export function getUi(locale: Locale): Ui {
  return uiContent[locale];
}

/**
 * The default locale's copy. For build-time consumers that have no route context
 * (metadata fallbacks, `lib/site-meta.ts`, the admin panel).
 */
export const site: Site = content[DEFAULT_LOCALE];
export const ui: Ui = uiContent[DEFAULT_LOCALE];

export type { Site, SiteContent, Ui } from "./types";
