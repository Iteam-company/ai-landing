// English marketing copy. Mirrors content/ru/site.ts — keep both in sync
// when editing copy.

import type { Site } from "../types";

export const site: Site = {
  meta: {
    title: "Neuroflow — Cut costs and respond to leads faster in 7 days",
    description:
      "We launch business automation in 7 days to cut operating costs by up to 40%, process every lead faster and keep sales moving 24/7.",
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
      // { label: "pricing", href: "#pricing" },
      { label: "about us", href: "#about" },
      { label: "contact", href: "#booking" },
    ],
    cta: { label: "Book a call", href: "#contact" },
  },
  hero: {
    eyebrow: "Cut costs · faster lead response · launch in 7 days",
    title: "Save money and process every lead faster - in just 7 days",
    subtitle:
      "We remove bottlenecks from sales, support and CRM—helping you cut operating costs by up to 40% while every new request gets an immediate response.",
    primaryCta: { label: "Book a call", href: "#contact" },
    secondaryCta: { label: "Send us a message", href: "#booking" },
    stats: [
      { value: "40%", label: "operating costs saved" },
      { value: "7", label: "days to launch" },
      { value: "24/7", label: "leads processed" },
    ],
    flow: {
      label: "lead-response.workflow",
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
      "Four measurable bottlenecks that drain time and revenue—and what changes when the routine is automated.",
    cards: [
      {
        tag: "sales",
        metric: "< 1 min",
        metricLabel: "target response time",
        title: "How many leads do you lose while they wait?",
        description:
          "When a reply takes hours, the conversation often starts with a competitor instead.",
        outcome:
          "Automation answers, qualifies and routes every new request immediately—24/7.",
      },
      {
        tag: "crm",
        metric: "HOURS",
        metricLabel: "lost every week",
        title: "How much selling time disappears into CRM updates?",
        description:
          "Managers copy notes, prepare follow-ups and fill in deal cards instead of speaking to customers.",
        outcome:
          "Call summaries, CRM fields, tasks and follow-ups are created automatically.",
      },
      {
        tag: "support",
        metric: "24/7",
        metricLabel: "routine support",
        title: "How much of the team’s day goes to repeat questions?",
        description:
          "Simple requests compete with complex cases for the same limited attention.",
        outcome:
          "A knowledge assistant responds instantly and links every answer back to its source.",
      },
      {
        tag: "analytics",
        metric: "LIVE",
        metricLabel: "operational visibility",
        title: "How much does yesterday’s data cost you?",
        description:
          "Manually assembled reports arrive after the moment to act has already passed.",
        outcome:
          "Sales and operational metrics update automatically as the underlying data changes.",
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
        id: "lead-qualifier",
        index: "01",
        name: "AI Lead Qualifier",
        icon: "radar",
        title: "More qualified calls—without manager involvement",
        description:
          "Responds in under a minute, asks the right questions and offers a meeting slot when the lead is ready.",
        demo: {
          caption: "Telegram · sample conversation",
          ariaLabel: "AI qualifier reading an inbound lead, qualifying it and booking a call",
          stages: [
            { id: "lead-in", label: "Lead in", detail: "New message via Telegram", tone: "input" },
            {
              id: "reading",
              label: "Reading message",
              detail: "Parsing intent and urgency",
              tone: "agent",
              typing: true,
            },
            { id: "captured", label: "Need, budget & timeline", detail: "Requirements captured", tone: "agent" },
            { id: "qualified", label: "Qualified", detail: "Scored as sales-ready", tone: "agent" },
            { id: "slot", label: "Slot offered", detail: "Open time proposed", tone: "agent" },
            {
              id: "booked",
              label: "Meeting booked · CRM updated",
              detail: "Call confirmed · deal created",
              tone: "result",
            },
          ],
        },
        tags: ["Telegram / WhatsApp", "BANT scoring", "Calendar", "CRM"],
      },
      {
        id: "crm-assistant",
        index: "02",
        name: "AI CRM Assistant",
        icon: "bot",
        title: "Returns selling hours to every manager, every week",
        description:
          "Turns every sales call into a clean summary, updated CRM fields and a ready-to-run follow-up task.",
        demo: {
          caption: "CRM · post-call workflow",
          ariaLabel: "AI assistant transcribing a sales call and updating the CRM",
          stages: [
            { id: "call-ended", label: "Call ended", detail: "Discovery call · 26 min", tone: "input" },
            { id: "transcribing", label: "Transcribing", detail: "Converting audio to text", tone: "agent" },
            {
              id: "extracting",
              label: "Extracting insights",
              detail: "Needs, objections, next step",
              tone: "agent",
              typing: true,
            },
            { id: "crm-updated", label: "CRM updated", detail: "Deal fields filled in", tone: "agent" },
            { id: "follow-up", label: "Follow-up created", detail: "Task scheduled for rep", tone: "agent" },
            { id: "summary", label: "Summary ready", detail: "One-page recap sent", tone: "result" },
          ],
        },
        tags: ["Transcription", "Summaries", "CRM tasks", "PDF proposals"],
      },
      {
        id: "knowledge-assistant",
        index: "03",
        name: "Knowledge Assistant",
        icon: "library",
        title: "Answers routine questions in seconds—with sources",
        description:
          "Finds the answer across your playbooks, PDFs and workspace, then shows exactly where it came from.",
        demo: {
          caption: "Knowledge base · sample query",
          ariaLabel: "Knowledge assistant searching company documents and answering with a source",
          stages: [
            { id: "question", label: "Question received", detail: "“What is our refund policy?”", tone: "input" },
            { id: "searching", label: "Searching knowledge base", detail: "Scanning docs and playbooks", tone: "agent" },
            { id: "source-found", label: "Source found", detail: "Policy.pdf · section 4.2", tone: "agent" },
            {
              id: "drafted",
              label: "Answer drafted",
              detail: "Response grounded in source",
              tone: "agent",
              typing: true,
            },
            { id: "source-attached", label: "Source attached", detail: "Link included in reply", tone: "agent" },
            { id: "answer-sent", label: "Answer sent", detail: "Delivered with citation", tone: "result" },
          ],
        },
        tags: ["RAG", "Vector store", "Playbooks", "Source links"],
      },
      {
        id: "workflow-automation",
        index: "04",
        name: "Workflow Automation",
        icon: "workflow",
        title: "Moves data between your tools without manual work",
        description:
          "Connects forms, CRM, messengers and spreadsheets so every routine step happens in the right system.",
        demo: {
          caption: "Operations · sample workflow",
          ariaLabel: "Automated workflow enriching, scoring and routing a new lead",
          stages: [
            { id: "submitted", label: "Form submitted", detail: "New enterprise request", tone: "input" },
            { id: "enriched", label: "Data enriched", detail: "Company and contact details added", tone: "agent" },
            { id: "scored", label: "Lead scored", detail: "Priority assigned", tone: "agent" },
            { id: "record", label: "CRM record created", detail: "Deal added to pipeline", tone: "agent" },
            { id: "notified", label: "Slack notified", detail: "Team alerted in #sales", tone: "agent" },
            { id: "assigned", label: "Task assigned", detail: "Owner set · due today", tone: "result" },
          ],
        },
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
  about: {
    eyebrow: "04 · about us",
    title: "AI architecture by entrepreneurs, for entrepreneurs",
    subtitle:
      "We implement automation with a deep understanding of business economics, P&L and operational processes.",
    trust: ["ROI-first", "Lean scale", "IT products", "Restaurants", "Agencies"],
    founder: {
      caption: "founder · operator perspective",
      name: "Dmytro Nych",
      role: "Founder · Neuroflow.ai",
      monogram: "DN",
      image: "/founder-dmytro-nych.jpg",
      imageAlt: "Portrait of Dmytro Nych, founder of Neuroflow.ai",
      quote:
        "The biggest mistake in AI adoption is entrusting it to people who have never run a business themselves.",
      description:
        "When you run a business, you quickly learn to account for every manager’s minute and every lost lead. We created Neuroflow.ai to give founders and C-level teams a transparent, secure AI system that works 24/7 without depending on manual execution.",
      delivery:
        "We take ownership of the entire journey—from a deep process audit to production-ready architecture delivered end to end.",
      stats: [
        { value: "5+", label: "years building products" },
        { value: "30+", label: "MVPs delivered" },
        { value: "US · EU", label: "project geography" },
      ],
      proof: {
        label: "selected result",
        project: "Gate-O1",
        results: ["up to 80% less manual processing", "60% faster case decisions"],
      },
      linkedin: {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/dmytro-nych/",
      },
    },
  },
  comparison: {
    eyebrow: "05 · cost comparison",
    title: "Three ways to handle the same operational workload",
    subtitle:
      "Add more people, build a custom platform, or automate the repetitive part of the process.",
    caption: "cost · comparison",
    criteriaLabel: "Comparison criterion",
    options: [
      {
        id: "automation",
        name: "AI automation",
        price: "from €3,900",
        priceNote: "one-time setup",
        highlighted: true,
      },
      {
        id: "staff",
        name: "Additional staff",
        price: "from €30,000",
        priceNote: "every year",
      },
      {
        id: "custom",
        name: "Custom development",
        price: "from €50,000",
        priceNote: "upfront",
      },
    ],
    rows: [
      {
        label: "Cost model",
        values: {
          automation: "One-time implementation with optional support",
          staff: "Recurring payroll and overhead",
          custom: "Upfront build plus ongoing maintenance",
        },
      },
      {
        label: "Launch",
        values: {
          automation: "First workflow in 7 days",
          staff: "Hiring and onboarding",
          custom: "Several months",
        },
      },
      {
        label: "Availability",
        values: {
          automation: "24/7",
          staff: "Business hours",
          custom: "Depends on implementation",
        },
      },
      {
        label: "Scaling",
        values: {
          automation: "Extend the workflow",
          staff: "Hire and onboard again",
          custom: "Start a new development cycle",
        },
      },
      {
        label: "Routine work",
        values: {
          automation: "Runs automatically",
          staff: "Remains manual",
          custom: "Must be specified and built",
        },
      },
      {
        label: "Best fit",
        values: {
          automation: "Proven processes ready to automate",
          staff: "Work requiring human judgment",
          custom: "Unique product-level requirements",
        },
      },
    ],
    note:
      "Illustrative comparison for a typical sales or operations workflow. Final costs depend on process scope, location, integrations and support requirements.",
    transition: "Questions about control or ongoing support?",
  },
  faq: {
    eyebrow: "05 · frequently asked questions",
    title: "What happens after the automation goes live?",
    subtitle: "Clear answers about control, reliability and ongoing support.",
    caption: "faq · operations",
    items: [
      {
        question: "What happens if the AI gets something wrong?",
        answer:
          "Critical actions never have to run blindly. We set confidence thresholds and route uncertain or high-risk cases to a manager in Telegram or CRM. Every decision is logged, so the workflow can be reviewed and corrected.",
      },
      {
        question: "Which actions can require human approval?",
        answer:
          "You decide where the agent can act independently. Routine replies may be automatic, while discounts, contracts, payments or sensitive customer decisions can require explicit approval.",
      },
      {
        question: "What is included in ongoing support?",
        answer:
          "The Business System includes one month of post-launch support. After that, you can request changes as needed or choose an optional monthly support plan agreed before handover.",
      },
      {
        question: "Can you work with our existing CRM and tools?",
        answer:
          "Usually, yes. We connect to your current CRM, messengers, calendar and data sources through APIs and webhooks. If a system has technical limitations, we identify them during the process review before development starts.",
      },
      {
        question: "Can the workflow be changed after launch?",
        answer:
          "Yes. Prompts, routing rules, approval steps and integrations can be updated as your process changes. You do not need to rebuild the entire system for every adjustment.",
      },
    ],
    transition: "Have a process in mind? Let’s review the risks and costs together",
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
    eyebrow: "07 · get in touch",
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
      { label: "about us", href: "#about" },
      { label: "contact", href: "#booking" },
    ],
    note: "Working remotely · timezone UTC+2",
  },
};
