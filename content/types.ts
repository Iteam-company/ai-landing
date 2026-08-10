// The content contract for this template — types only, no copy.
//
// `Site` is the marketing copy every section reads (the Storyblok-seedable shape);
// `Ui` is the interface chrome that is not marketing copy: button states, aria
// labels, form placeholders, API validation messages, the admin panel and the
// transactional emails.
//
// One implementation of each lives per locale in `content/<locale>/{site,ui}.ts`,
// and `content/index.ts` is the registry that resolves them by locale.

export interface NavItem {
  label: string;
  href: string;
}

export interface CtaLink {
  label: string;
  href: string;
}

export interface Stat {
  value: string;
  label: string;
}

/** A node in the hero's interactive n8n-style flow diagram. */
export interface FlowNode {
  id: string;
  label: string;
  /** Mono sub-label, e.g. "webhook" or "gpt-4o". */
  meta: string;
}

export interface PainCard {
  /** Mono category chip, e.g. "sales". */
  tag: string;
  /** Large, scannable process metric, e.g. "< 1 min". */
  metric: string;
  /** What the metric measures. */
  metricLabel: string;
  title: string;
  description: string;
  /** Concrete operational change delivered by automation. */
  outcome: string;
}

/** Lucide icon key for a Solution — kept as a serializable string (not a
 *  component) so the data stays CMS-friendly; components/sections/solutions
 *  resolves it to the actual icon. */
export type SolutionIcon = "radar" | "bot" | "library" | "workflow";

/** One stage of an agent's live demo sequence, played back in order. */
export interface SolutionStage {
  id: string;
  /** Short node title, e.g. "Reading message". 2–5 words. */
  label: string;
  /** One short line of example detail, e.g. "New message via Telegram". */
  detail: string;
  /** What kind of stage this is — drives the node/rail visual treatment. */
  tone: "input" | "agent" | "result";
  /** Plays a brief typing reveal on `detail` — use sparingly, at most once
   *  per sequence, only where the agent is visibly composing a response. */
  typing?: boolean;
}

export interface Solution {
  /** Stable key — drives the agent switcher's selection state. */
  id: string;
  index: string;
  /** Product/module name shown as a secondary label. */
  name: string;
  icon: SolutionIcon;
  /** Outcome-led headline. */
  title: string;
  description: string;
  /** The agent's live demo: a short, ordered sequence of stages. */
  demo: {
    caption: string;
    ariaLabel: string;
    stages: SolutionStage[];
  };
  /** Short mono tags — the services this agent touches. */
  tags: string[];
}

/** A stage of the showcased architecture (the animated pipeline). */
export interface PipelineStep {
  index: string;
  title: string;
  description: string;
  /** Mono metadata shown under the step, e.g. "~3 сек". */
  meta: string;
}

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  priceNote: string;
  /** Delivery time, e.g. "5–7 дней". */
  term: string;
  summary: string;
  items: string[];
  cta: CtaLink;
  recommended?: boolean;
}

export type ComparisonOptionId = "automation" | "staff" | "custom";

export interface ComparisonOption {
  id: ComparisonOptionId;
  name: string;
  price: string;
  priceNote: string;
  highlighted?: boolean;
}

export interface ComparisonRow {
  label: string;
  values: Record<ComparisonOptionId, string>;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FounderProfile {
  /** Mono label in the founder panel's console bar. */
  caption: string;
  name: string;
  role: string;
  monogram: string;
  image?: string;
  imageAlt: string;
  quote: string;
  description: string;
  delivery: string;
  stats: Stat[];
  proof: {
    label: string;
    project: string;
    results: string[];
  };
  linkedin: CtaLink;
}

export interface ContactChannel {
  label: string;
  value: string;
  href: string;
}

export interface Site {
  meta: {
    title: string;
    description: string;
    url: string;
    ogImage: string;
  };
  brand: {
    /** Short glyph shown in the logo mark, e.g. "NF". */
    monogram: string;
    name: string;
    /** Mono suffix after the dot, e.g. "ai". */
    suffix: string;
  };
  nav: {
    items: NavItem[];
    cta: CtaLink;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: CtaLink;
    secondaryCta: CtaLink;
    stats: Stat[];
    flow: {
      /** Mono label on the diagram frame. */
      label: string;
      nodes: FlowNode[];
      /** Status line under the diagram. */
      status: string;
    };
    /** Integration names scrolled in the marquee strip. */
    marquee: string[];
  };
  pains: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cards: PainCard[];
  };
  solutions: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Solution[];
  };
  showcase: {
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: PipelineStep[];
    /** The "your data, your logic" note under the animation. */
    note: string;
    /** Mono caption on the player frame. */
    caption: string;
  };
  about: {
    eyebrow: string;
    title: string;
    subtitle: string;
    /** Short trust markers shown under the founder panel, e.g. "ROI-first". */
    trust: string[];
    founder: FounderProfile;
  };
  comparison: {
    eyebrow: string;
    title: string;
    subtitle: string;
    /** Mono label in the comparison panel's console bar. */
    caption: string;
    /** Screen-reader label for the empty criteria column header. */
    criteriaLabel: string;
    options: ComparisonOption[];
    rows: ComparisonRow[];
    note: string;
    /** Transition link into the booking block below. */
    transition: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    subtitle: string;
    /** Mono label in the FAQ panel's console bar. */
    caption: string;
    items: FaqItem[];
    /** Transition link into the booking block below. */
    transition: string;
  };
  pricing: {
    eyebrow: string;
    title: string;
    subtitle: string;
    tiers: PricingTier[];
    /** Mono footnote under the cards. */
    note: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    subtitle: string;
    calendar: {
      title: string;
      description: string;
      /** Shown when no Cal.com / Calendly link is configured yet. */
      placeholder: string;
      /** Mono caption over the embed. */
      caption: string;
    };
    form: {
      title: string;
      description: string;
      name: string;
      contact: string;
      task: string;
      submit: string;
      sending: string;
      success: string;
      consent: string;
      /** Shown instead of the form when no endpoint is configured. */
      disabled: string;
    };
    channels: ContactChannel[];
  };
  /** Copy for the optional Business Calendar block (feature: calendar). */
  booking: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta: string;
    success: string;
  };
  /** Copy for the optional customer-accounts block (feature: customers). */
  customers: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  footer: {
    tagline: string;
    /** Use {year} as a placeholder. */
    copyright: string;
    links: NavItem[];
    note: string;
  };
}

export interface Ui {
  a11y: {
    menu: string;
    language: string;
    close: string;
    diagram: string;
    /** Tablist label for the solutions section's agent switcher. */
    agents: string;
  };
  pricing: {
    recommended: string;
  };
  pains: {
    /** Toggle that reveals the automated outcome on touch/keyboard. */
    seeResult: string;
    hideResult: string;
  };
  form: {
    failed: string;
    notConnected: string;
  };
  booking: {
    date: string;
    time: string;
    name: string;
    email: string;
    phone: string;
    note: string;
    sending: string;
    failed: string;
  };
  portal: {
    account: string;
    bonuses: string;
    lastVisit: string;
    logout: string;
    tabLogin: string;
    tabSignup: string;
    password: string;
    passwordHint: string;
    phone: string;
    submitLogin: string;
    submitSignup: string;
    failed: string;
    /** Shown on a 409 from /api/auth/signup. */
    emailTaken: string;
    /** Shown on a 401 from /api/auth/login. */
    badCredentials: string;
  };
  admin: {
    loading: string;
    title: string;
    user: string;
    pass: string;
    signIn: string;
    badCredentials: string;
    dashboard: string;
    signOut: string;
    empty: string;
    leads: { heading: string; cols: string[]; empty: string };
    bookings: {
      heading: string;
      cols: string[];
      empty: string;
      confirm: string;
      cancel: string;
      status: { pending: string; confirmed: string; cancelled: string };
    };
    customers: { heading: string; cols: string[]; empty: string };
  };
  emails: {
    fields: {
      when: string;
      name: string;
      email: string;
      phone: string;
      note: string;
      contact: string;
      task: string;
      source: string;
    };
    bookingCustomer: { subject: string; title: string; intro: string; footer: string };
    bookingAdmin: { subject: string; title: string; intro: string; footer: string };
    bookingConfirmed: { subject: string; title: string; intro: string; footer: string };
    leadAdmin: { subject: string; title: string; intro: string; footer: string };
  };
}

export type { Site as SiteContent };
