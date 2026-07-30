// English marketing copy. Mirrors content/ru/site.ts — keep both in sync
// when editing copy.

import type { Site } from "../types";

export const site: Site = {
  meta: {
    title: "Neuroflow — AI agents and n8n automation for business",
    description:
      "We automate business routine with AI agents and n8n: 24/7 lead qualification, a CRM assistant, a RAG knowledge base and seamless integrations. First results in 7–14 days.",
    url: "https://neuroflow.agency",
    ogImage:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop",
  },
  brand: {
    monogram: "NF",
    name: "Neuroflow",
    suffix: "ai",
  },
  nav: {
    items: [
      { label: "pains", href: "#pains" },
      { label: "solutions", href: "#solutions" },
      { label: "architecture", href: "#showcase" },
      { label: "pricing", href: "#pricing" },
      { label: "contact", href: "#contact" },
    ],
    cta: { label: "Book a call", href: "#contact" },
  },
  hero: {
    eyebrow: "AI agents · n8n · process automation",
    title: "We automate your business routine with AI agents and n8n",
    subtitle:
      "We take the human bottleneck out of sales, support and CRM — cutting operating costs by up to 40% in 7–14 days.",
    primaryCta: { label: "Book a call", href: "#contact" },
    secondaryCta: { label: "Send us a message", href: "#lead-form" },
    stats: [
      { value: "40%", label: "of operating costs" },
      { value: "7–14", label: "days to first results" },
      { value: "24/7", label: "agents on duty" },
    ],
    flow: {
      label: "lead-router.n8n",
      nodes: [
        { id: "lead", label: "Lead", meta: "webhook" },
        { id: "ai", label: "AI analysis", meta: "gpt · BANT" },
        { id: "crm", label: "CRM", meta: "deal + task" },
      ],
      status: "workflow active · average response time 40 sec",
    },
    marquee: [
      "n8n",
      "OpenAI",
      "Telegram",
      "amoCRM",
      "Bitrix24",
      "HubSpot",
      "Notion",
      "Google Sheets",
      "Slack",
      "Zoom",
      "WhatsApp",
      "Airtable",
      "Pipedrive",
      "Supabase",
    ],
  },
  pains: {
    eyebrow: "01 · business pains",
    title: "Where exactly your money leaks out",
    subtitle:
      "The four bottlenecks we close most often. Hover a card — we'll show what goes in its place.",
    cards: [
      {
        tag: "sales",
        title: "Slow response to new leads",
        description:
          "Leads go cold or move on to a competitor while your manager is busy on another conversation.",
      },
      {
        tag: "crm",
        title: "Managers live in spreadsheets",
        description:
          "Instead of selling, managers sit in spreadsheets, write follow-ups and fill in deal cards by hand.",
      },
      {
        tag: "support",
        title: "The same questions, every day",
        description:
          "The team drowns in repeat questions while the knowledge base gathers dust in Notion and Google Drive.",
      },
      {
        tag: "analytics",
        title: "Reports only land on Fridays",
        description:
          "Data is scattered across services — reports are assembled by hand and always arrive late.",
      },
    ],
  },
  solutions: {
    eyebrow: "02 · solutions",
    title: "AI agents that close these gaps",
    subtitle:
      "Not a website chatbot, but agents inside your processes: with access to your CRM, calendar and knowledge base.",
    items: [
      {
        index: "01",
        title: "AI Lead Qualifier (24/7)",
        description:
          "Picks up requests from messengers, forms and email. Asks BANT questions, filters out bad fits and drops your calendar link right into the chat.",
        tags: ["Telegram / WhatsApp", "BANT scoring", "Calendar", "CRM"],
      },
      {
        index: "02",
        title: "AI CRM Assistant",
        description:
          "Transcribes Zoom calls, summarises what was agreed, creates CRM tasks on its own and lays your proposal out as a PDF.",
        tags: ["Transcription", "Summaries", "CRM tasks", "PDF proposals"],
      },
      {
        index: "03",
        title: "Smart Knowledge Base (RAG)",
        description:
          "A bot trained on your playbooks and PDFs. Answers staff or customers instantly — in 3 seconds, with a link to the source.",
        tags: ["RAG", "Vector store", "Playbooks", "Source links"],
      },
      {
        index: "04",
        title: "Seamless n8n automations",
        description:
          "We wire any services together — CRM, messengers, ad platforms, spreadsheets — with no overpaying for extra software and no zoo of subscriptions.",
        tags: ["n8n", "Webhooks", "API", "Self-hosted"],
      },
    ],
  },
  showcase: {
    eyebrow: "03 · architecture demo",
    title: "How it works on a live lead",
    subtitle:
      "One inbound lead runs the whole route in a matter of seconds — without a single manager click.",
    steps: [
      {
        index: "01",
        title: "Inbound lead",
        description:
          "A website form, Telegram or email — everything arrives at a single n8n webhook.",
        meta: "~0.4 sec",
      },
      {
        index: "02",
        title: "AI analysis",
        description:
          "The agent parses the request, detects segment and budget, scores it and picks the reply scenario.",
        meta: "~3 sec",
      },
      {
        index: "03",
        title: "Deal in the CRM",
        description:
          "A deal is created with its fields and tags filled in, plus a task for the manager in charge.",
        meta: "~1 sec",
      },
      {
        index: "04",
        title: "Telegram alert",
        description:
          "The team gets the lead card with a summary and a recommendation — ready to call right away.",
        meta: "instant",
      },
    ],
    note: "Transparent architecture: the data belongs to you and the logic stays fully under your control.",
    caption: "pipeline · demo",
  },
  pricing: {
    eyebrow: "04 · pricing",
    title: "Ways to work with us",
    subtitle:
      "Start with a single agent or build the full system. The price is fixed before the work starts.",
    tiers: [
      {
        id: "express",
        name: "Express Start",
        price: "from €1,200",
        priceNote: "fixed price",
        term: "5–7 days",
        summary: "A fast launch of one agent, so you see the effect on your own data.",
        items: [
          "Express process audit",
          "1 AI agent (qualifier or knowledge base)",
          "2 n8n integrations + testing",
        ],
        cta: { label: "Order Express", href: "#lead-form" },
      },
      {
        id: "system",
        name: "Business System",
        price: "from €3,900",
        priceNote: "scoped by process volume",
        term: "2–3 weeks",
        summary: "A full automation loop: several agents and a connected n8n architecture.",
        items: [
          "Process map (Blueprint)",
          "3–4 AI agents + advanced n8n architecture",
          "Team training + 1 month of support",
        ],
        cta: { label: "Request a quote", href: "#lead-form" },
        recommended: true,
      },
      {
        id: "audit",
        name: "Audit & Consulting",
        price: "from €600",
        priceNote: "credited towards the project",
        term: "2–3 days",
        summary: "We review your current stack and show what to automate first.",
        items: [
          "Full review of your stack and processes",
          "Map of the bottlenecks",
          "Top-5 quick wins — what to ship right away",
        ],
        cta: { label: "Book an audit", href: "#contact" },
      },
    ],
    note: "Contract-based · NDA on request · staged payments",
  },
  contact: {
    eyebrow: "05 · get in touch",
    title: "Claim your 40% of operating costs",
    subtitle:
      "Pick a slot in the calendar or describe your task in the form — we reply within one business day.",
    calendar: {
      title: "Direct booking",
      description:
        "Pick a day and time — 30 minutes on Google Meet. The meeting link arrives right after booking.",
      placeholder:
        "The calendar is not connected yet. Set NEXT_PUBLIC_CAL_LINK (for example, “neuroflow/30min”) and the Cal.com widget will appear here.",
      caption: "cal.com · 30 min",
    },
    form: {
      title: "Send us a message",
      description: "Describe your task in a few lines — we'll come back with options and timelines.",
      name: "Name",
      contact: "Email or Telegram",
      task: "Describe your task (optional)",
      submit: "Send request",
      sending: "Sending…",
      success: "Request sent. We'll get back to you within one business day.",
      consent: "By submitting the form you agree to the processing of your personal data.",
      disabled:
        "The form is not wired to a webhook yet. Write to us directly — contacts below.",
    },
    channels: [
      { label: "email", value: "hello@neuroflow.agency", href: "mailto:hello@neuroflow.agency" },
      { label: "telegram", value: "@neuroflow", href: "https://t.me/neuroflow" },
    ],
  },
  booking: {
    eyebrow: "call · slot",
    title: "Book a process review",
    subtitle:
      "Pick a day and time that suit you — we'll confirm the booking by email and send the meeting link.",
    cta: "Book a slot",
    success: "Request received. The confirmation is on its way to your inbox.",
  },
  customers: {
    eyebrow: "clients · portal",
    title: "Client portal",
    subtitle:
      "Rollout status, call history and referral bonuses — sign in or create an account.",
  },
  footer: {
    tagline:
      "An AI-automation studio: agents, n8n workflows and integrations for sales and support teams.",
    copyright: "© {year} Neuroflow. Automation without magic — just processes and logs.",
    links: [
      { label: "solutions", href: "#solutions" },
      { label: "pricing", href: "#pricing" },
      { label: "contact", href: "#contact" },
    ],
    note: "Working remotely · timezone UTC+2",
  },
};
