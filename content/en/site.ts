import type { Site } from "../types";

export const site: Site = {
  meta: {
    title: "AI Team — Never lose a lead again",
    description:
      "AI Team replies to every lead, updates your CRM, and books the call — automatically.",
    url: "https://neuroflow.agency",
    ogImage:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop",
  },
  brand: {
    name: "AI",
    suffix: "Team",
  },
  nav: {
    items: [
      { label: "pains", href: "#pains" },
      { label: "solutions", href: "#solutions" },
      { label: "how it works", href: "#showcase" },
      { label: "about us", href: "#about" },
      { label: "contact", href: "#booking" },
    ],
    cta: { label: "Book a call", href: "#booking" },
  },
  automationNetwork: {
    nodes: [
      {
        id: "crm",
        label: "CRM",
        actionStatus: "LEAD CREATED",
        workflowSteps: ["Lead captured", "Qualified", "CRM updated", "Follow-up created"],
      },
      {
        id: "email",
        label: "Email",
        actionStatus: "FOLLOW-UP READY",
        workflowSteps: ["Email received", "Intent detected", "Reply drafted", "Follow-up scheduled"],
      },
      {
        id: "telegram",
        label: "Telegram",
        workflowSteps: ["Lead received", "Message parsed", "Sent to AI"],
      },
      {
        id: "calendar",
        label: "Calendar",
        actionStatus: "SLOT FOUND",
        workflowSteps: ["Availability checked", "Slot selected", "Meeting booked"],
      },
      {
        id: "docs",
        label: "Docs",
        actionStatus: "CONTEXT SAVED",
        workflowSteps: ["Context extracted", "Knowledge stored", "Available to AI"],
      },
    ],
    processingStatuses: ["ANALYZING", "QUALIFYING", "EXTRACTING DATA"],
    completeMessage: "One lead. Zero manual steps.",
    exploreHint: {
      title: "Explore the system",
      subtitle: "Hover a node to see what happens.",
      mobileSubtitle: "Tap a node to see what happens.",
    },
    intro: {
      headline: "Watch a lead become a booked call.",
      subline: "No manual steps.",
      hint: "Scroll down",
    },
  },
  hero: {
    eyebrow: "Lead response, automated",
    primaryCta: { label: "Book a call", href: "#booking" },
    secondaryCta: { label: "Send us a message", href: "#booking" },
    stats: [
      { value: "24/7", label: "always answering leads" },
      { value: "Auto", label: "CRM & follow-ups" },
      { value: "Sync", label: "calendar, CRM & inbox" },
    ],
    scenarios: [
      {
        id: "lead-response",
        title: "Never lose a lead again.",
        subtitle: "Reply while they're still interested.",
        flow: {
          label: "lead-response.workflow",
          workflow: {
            kind: "lead",
            input: {
              eyebrow: "new lead",
              name: "Sarah Miller",
              quote: "We need an AI assistant for our sales team...",
              source: "web form",
            },
            analysis: {
              eyebrow: "ai analysis",
              points: [
                { label: "intent", value: "Sales automation" },
                { label: "budget", value: "$5k–10k" },
                { label: "timeline", value: "This month" },
                { label: "priority", value: "High", emphasis: true },
              ],
            },
            qualified: { eyebrow: "qualified", score: 92, scoreMax: 100 },
            action: {
              eyebrow: "action",
              items: ["Reply sent", "CRM deal created", "Follow-up scheduled"],
            },
          },
          status: "workflow active · AI handling it now",
        },
      },
      {
        id: "email-handling",
        title: "Every message gets handled.",
        subtitle: "AI understands the request and responds automatically.",
        flow: {
          label: "email-handling.workflow",
          workflow: {
            kind: "email",
            input: {
              eyebrow: "incoming email",
              from: "alex@acme.com",
              subject: "Invoice issue",
              quote: "We were charged twice for...",
            },
            analysis: {
              eyebrow: "ai router",
              points: [
                { label: "category", value: "Billing" },
                { label: "sentiment", value: "Frustrated" },
                { label: "urgency", value: "High", emphasis: true },
              ],
            },
            context: {
              eyebrow: "context",
              points: [
                { label: "refund policy", value: "Found", emphasis: true },
                { label: "invoice #10284", value: "Found", emphasis: true },
                { label: "customer history", value: "Found", emphasis: true },
              ],
            },
            action: {
              eyebrow: "action",
              items: ["Reply drafted", "Finance notified", "Follow-up task created"],
            },
          },
          status: "inbox monitored · AI drafting replies",
        },
      },
      {
        id: "meeting-booking",
        title: "Turn interest into booked calls.",
        subtitle: "AI checks availability and books the next step.",
        flow: {
          label: "meeting-booking.workflow",
          workflow: {
            kind: "knowledge",
            input: {
              eyebrow: "lead reply",
              quote: "Can we jump on a call this week?",
            },
            search: {
              eyebrow: "checking calendar",
              points: [
                { label: "calendar", value: "Checked", emphasis: true },
                { label: "slot", value: "Thu · 2:00 PM", emphasis: true },
                { label: "duration", value: "30 min" },
              ],
            },
            answer: {
              eyebrow: "confirmation sent",
              text: "You're booked for Thursday at 2:00 PM. Calendar invite sent, CRM updated.",
              sources: ["Calendar", "CRM"],
            },
          },
          status: "meeting confirmed · calendar & CRM updated",
        },
      },
      {
        id: "follow-up",
        title: "Never forget the follow-up.",
        subtitle: "AI keeps the conversation moving.",
        flow: {
          label: "follow-up.workflow",
          workflow: {
            kind: "crm",
            input: { eyebrow: "no reply", duration: "3 days" },
            analysis: {
              eyebrow: "ai detection",
              points: [
                { label: "last contact", value: "Email" },
                { label: "channel", value: "Telegram" },
                { label: "tone", value: "Friendly" },
                { label: "next step", value: "Follow-up", emphasis: true },
              ],
            },
            result: {
              eyebrow: "follow-up sent",
              points: [
                { label: "message", value: "Sent", emphasis: true },
                { label: "CRM status", value: "Updated", emphasis: true },
                { label: "reminder", value: "Scheduled", emphasis: true },
                { label: "lead", value: "Re-engaged", emphasis: true },
              ],
            },
          },
          status: "silence detected · lead re-engaged automatically",
        },
      },
    ],
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
    eyebrow: "01 · the cost of slow replies",
    title: "Where leads get lost",
    subtitle: "Four moments most businesses lose control of a lead.",
    cards: [
      {
        tag: "response",
        metric: "HOURS",
        metricLabel: "to the first reply",
        title: "Slow replies",
        description: "Good leads go cold while they wait.",
        outcome: "AI replies the moment a lead comes in — day or night.",
      },
      {
        tag: "follow-up",
        metric: "SILENT",
        metricLabel: "no second touch",
        title: "Missed follow-ups",
        description: "Interested prospects disappear without a second touch.",
        outcome: "AI follows up automatically until the lead replies.",
      },
      {
        tag: "crm",
        metric: "MANUAL",
        metricLabel: "CRM data entry",
        title: "Manual CRM work",
        description: "Your team copies the same information between tools.",
        outcome: "AI updates the CRM the moment something happens.",
      },
      {
        tag: "channels",
        metric: "SCATTERED",
        metricLabel: "across your tools",
        title: "Scattered conversations",
        description: "Email, CRM and calendar never stay in sync.",
        outcome: "AI keeps every system in sync, automatically.",
      },
    ],
  },
  solutions: {
    eyebrow: "02 · what AI Team does",
    title: "One system. Four capabilities.",
    subtitle: "Everything your leads need, in one connected flow.",
    items: [
      {
        id: "reply",
        index: "01",
        name: "Reply",
        icon: "bot",
        title: "Replies to every lead automatically",
        description: "Reads the message, understands the request, and replies — day or night.",
        demo: {
          caption: "Telegram · sample conversation",
          ariaLabel: "AI reading an inbound message and replying automatically",
          stages: [
            { id: "lead-in", label: "Message in", detail: "New message received", tone: "input" },
            {
              id: "reading",
              label: "Reading message",
              detail: "Understanding the request",
              tone: "agent",
              typing: true,
            },
            { id: "context", label: "Context checked", detail: "Previous conversation reviewed", tone: "agent" },
            { id: "reply-drafted", label: "Reply drafted", detail: "Personalized response ready", tone: "agent" },
            { id: "sent", label: "Reply sent", detail: "Delivered automatically", tone: "result" },
          ],
        },
        tags: ["Telegram / WhatsApp / Web", "Any channel"],
      },
      {
        id: "qualify",
        index: "02",
        name: "Qualify",
        icon: "radar",
        title: "Scores every lead automatically",
        description: "Asks the right questions and ranks leads by fit — no manager needed.",
        demo: {
          caption: "CRM · lead scoring",
          ariaLabel: "AI asking qualifying questions and scoring the lead",
          stages: [
            { id: "lead-in", label: "Lead in", detail: "New conversation started", tone: "input" },
            {
              id: "asking",
              label: "Asking questions",
              detail: "Need, budget, timeline",
              tone: "agent",
              typing: true,
            },
            { id: "captured", label: "Answers captured", detail: "Requirements recorded", tone: "agent" },
            { id: "scored", label: "Lead scored", detail: "Ranked by fit", tone: "agent" },
            { id: "routed", label: "Routed to CRM", detail: "Ready for your team", tone: "result" },
          ],
        },
        tags: ["Lead scoring", "CRM-ready"],
      },
      {
        id: "act",
        index: "03",
        name: "Act",
        icon: "workflow",
        title: "Books the call, updates the CRM",
        description: "Checks availability, books the meeting, and fills in the CRM record.",
        demo: {
          caption: "Calendar · booking a call",
          ariaLabel: "AI checking availability and booking a meeting",
          stages: [
            { id: "ready", label: "Lead ready", detail: "Qualified and interested", tone: "input" },
            {
              id: "checking",
              label: "Checking calendar",
              detail: "Finding an open slot",
              tone: "agent",
              typing: true,
            },
            { id: "slot", label: "Slot offered", detail: "Time proposed to the lead", tone: "agent" },
            { id: "booked", label: "Meeting booked", detail: "Confirmed and added", tone: "agent" },
            { id: "synced", label: "CRM updated", detail: "Deal and details filled in", tone: "result" },
          ],
        },
        tags: ["Calendar", "CRM", "No manual entry"],
      },
      {
        id: "follow-up",
        index: "04",
        name: "Follow up",
        icon: "library",
        title: "Never lets a lead go quiet",
        description: "Notices no reply and follows up automatically until the lead responds.",
        demo: {
          caption: "CRM · automatic follow-up",
          ariaLabel: "AI detecting silence and sending a follow-up",
          stages: [
            { id: "quiet", label: "Lead went quiet", detail: "No reply in a few days", tone: "input" },
            {
              id: "detected",
              label: "Silence detected",
              detail: "Follow-up triggered",
              tone: "agent",
              typing: true,
            },
            { id: "drafted", label: "Message drafted", detail: "Personalized, not generic", tone: "agent" },
            { id: "sent", label: "Follow-up sent", detail: "Delivered automatically", tone: "agent" },
            { id: "updated", label: "CRM updated", detail: "Status and next step logged", tone: "result" },
          ],
        },
        tags: ["Auto follow-up", "CRM logged"],
      },
    ],
  },
  showcase: {
    eyebrow: "03 · how it works",
    title: "From new lead to booked call",
    subtitle: "One flow. No manual steps.",
    steps: [
      {
        index: "01",
        title: "Lead comes in",
        description: "From your site, Telegram, WhatsApp or email.",
        meta: "instant",
      },
      {
        index: "02",
        title: "AI understands it",
        description: "Reads the message, qualifies the lead, decides what happens next.",
        meta: "qualified",
      },
      {
        index: "03",
        title: "AI takes action",
        description: "Replies, books a meeting, updates your CRM.",
        meta: "automatic",
      },
      {
        index: "04",
        title: "Your team stays in control",
        description: "Every step is logged. Step into any conversation, any time.",
        meta: "always",
      },
    ],
    note: "Every action is logged — you can step in any time.",
    caption: "lead flow · demo",
  },
  about: {
    eyebrow: "04 · about us",
    title: "Built for how teams actually work.",
    subtitle: "We've run the P&L. We know exactly what a lost lead costs.",
    trust: ["ROI-first", "Fixed scope", "EU · US"],
    founder: {
      caption: "founder · operator perspective",
      name: "Dmytro Nych",
      role: "Founder · AI Team",
      monogram: "DN",
      image: "/founder-dmytro-nych.jpg",
      imageAlt: "Portrait of Dmytro Nych, founder of AI Team",
      quote:
        "The biggest mistake in AI adoption is entrusting it to people who have never run a business themselves.",
      description:
        "We built AI Team so every lead gets answered and the CRM updates itself — without anyone watching it 24/7.",
      delivery:
        "We handle it end to end — from audit to a live system running in your CRM.",
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
    eyebrow: "05 · faq",
    title: "What happens after it goes live?",
    subtitle: "Control, reliability, and what changes after launch.",
    caption: "faq · operations",
    items: [
      {
        question: "What happens if the AI gets something wrong?",
        answer:
          "High-risk actions never run blindly. Uncertain cases route to a manager, and every decision is logged so you can review it.",
      },
      {
        question: "Which actions need human approval?",
        answer:
          "You decide. Routine replies can be automatic; discounts or sensitive decisions can require approval.",
      },
      {
        question: "What's included after launch?",
        answer:
          "One month of support is included. After that, support is optional and agreed upfront.",
      },
      {
        question: "Will it work with our CRM and tools?",
        answer:
          "Usually, yes — we connect to your existing CRM, messengers, calendar and inbox through APIs and webhooks.",
      },
      {
        question: "Can we change it after launch?",
        answer:
          "Yes. Rules, replies and integrations can be updated any time — no rebuild required.",
      },
    ],
    transition: "Have a process in mind? Let’s talk.",
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
        cta: { label: "Book an audit", href: "#booking" },
      },
    ],
    note: "Contract-based · NDA on request · staged payments",
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
      "AI that replies to every lead, updates your CRM, and books the call — automatically.",
    copyright: "© {year} AI Team. All rights reserved.",
    links: [
      { label: "solutions", href: "#solutions" },
      { label: "how it works", href: "#showcase" },
      { label: "about us", href: "#about" },
      { label: "contact", href: "#booking" },
    ],
    note: "Working remotely · timezone UTC+2",
  },
};
