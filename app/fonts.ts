import { Geologica, Martian_Mono, Golos_Text } from "next/font/google";

// Shared by both root layouts (the localized site and /admin). All three carry
// Cyrillic *and* Latin — this template ships Russian and English content.

// Display headlines: technical, slightly condensed grotesque.
export const display = Geologica({
  variable: "--font-display-src",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Mono: eyebrows, labels, metadata, node captions. Deliberately wide and blocky.
export const mono = Martian_Mono({
  variable: "--font-mono-src",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Body copy.
export const sans = Golos_Text({
  variable: "--font-sans-src",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

/** The three font variables, ready for the <html> className. */
export const fontVariables = `${sans.variable} ${display.variable} ${mono.variable}`;
