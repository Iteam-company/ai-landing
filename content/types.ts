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

export interface FlowNode {
  id: string;
  label: string;
  meta: string;
}

export interface AutomationNetworkNode {
  id: string;
  label: string;
  actionStatus?: string;
  workflowSteps: string[];
}

export interface WorkflowDataPoint {
  label: string;
  value: string;
  emphasis?: boolean;
}

export interface LeadWorkflowContent {
  kind: "lead";
  input: { eyebrow: string; name: string; quote: string; source: string };
  analysis: { eyebrow: string; points: WorkflowDataPoint[] };
  qualified: { eyebrow: string; score: number; scoreMax: number };
  action: { eyebrow: string; items: string[] };
}

export interface EmailWorkflowContent {
  kind: "email";
  input: { eyebrow: string; from: string; subject: string; quote: string };
  analysis: { eyebrow: string; points: WorkflowDataPoint[] };
  context: { eyebrow: string; points: WorkflowDataPoint[] };
  action: { eyebrow: string; items: string[] };
}

export interface CrmWorkflowContent {
  kind: "crm";
  input: { eyebrow: string; duration: string };
  analysis: { eyebrow: string; points: WorkflowDataPoint[] };
  result: { eyebrow: string; points: WorkflowDataPoint[] };
}

export interface KnowledgeWorkflowContent {
  kind: "knowledge";
  input: { eyebrow: string; quote: string };
  search: { eyebrow: string; points: WorkflowDataPoint[] };
  answer: { eyebrow: string; text: string; sources: string[] };
}

export type HeroWorkflowContent =
  | LeadWorkflowContent
  | EmailWorkflowContent
  | CrmWorkflowContent
  | KnowledgeWorkflowContent;

export interface HeroScenario {
  id: string;
  title: string;
  subtitle: string;
  flow: {
    label: string;
    workflow: HeroWorkflowContent;
    status: string;
  };
}

export interface PainCard {
  tag: string;
  metric: string;
  metricLabel: string;
  title: string;
  description: string;
  outcome: string;
}

export type SolutionIcon = "radar" | "bot" | "library" | "workflow";

export interface SolutionStage {
  id: string;
  label: string;
  detail: string;
  tone: "input" | "agent" | "result";
  typing?: boolean;
}

export interface Solution {
  id: string;
  index: string;
  name: string;
  icon: SolutionIcon;
  title: string;
  description: string;
  demo: {
    caption: string;
    ariaLabel: string;
    stages: SolutionStage[];
  };
  tags: string[];
}

export interface PipelineStep {
  index: string;
  title: string;
  description: string;
  meta: string;
}

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  priceNote: string;
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
    name: string;
    suffix: string;
  };
  nav: {
    items: NavItem[];
    cta: CtaLink;
  };
  automationNetwork: {
    nodes: AutomationNetworkNode[];
    processingStatuses: string[];
    completeMessage: string;
    exploreHint: { title: string; subtitle: string; mobileSubtitle: string };
    intro: { headline: string; subline: string; hint: string };
  };
  hero: {
    eyebrow: string;
    primaryCta: CtaLink;
    secondaryCta: CtaLink;
    stats: Stat[];
    scenarios: HeroScenario[];
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
    note: string;
    caption: string;
  };
  about: {
    eyebrow: string;
    title: string;
    subtitle: string;
    trust: string[];
    founder: FounderProfile;
  };
  comparison: {
    eyebrow: string;
    title: string;
    subtitle: string;
    caption: string;
    criteriaLabel: string;
    options: ComparisonOption[];
    rows: ComparisonRow[];
    note: string;
    transition: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    subtitle: string;
    caption: string;
    items: FaqItem[];
    transition: string;
  };
  pricing: {
    eyebrow: string;
    title: string;
    subtitle: string;
    tiers: PricingTier[];
    note: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    subtitle: string;
    calendar: {
      title: string;
      description: string;
      placeholder: string;
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
      disabled: string;
    };
    channels: ContactChannel[];
  };
  booking: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta: string;
    success: string;
  };
  customers: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  footer: {
    tagline: string;
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
    agents: string;
  };
  pricing: {
    recommended: string;
  };
  pains: {
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
    slotTaken: string;
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
    emailTaken: string;
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
    bookingConfirmed: {
      subject: string;
      title: string;
      /** No Meet link yet / fallback. */
      intro: string;
      /** Shown when the email includes the "Join Google Meet" button. */
      introWithMeet: string;
      footer: string;
      meetCta: string;
    };
    bookingReminder: { subject: string; title: string; intro: string; footer: string };
    leadAdmin: { subject: string; title: string; intro: string; footer: string };
  };
}

export type { Site as SiteContent };
