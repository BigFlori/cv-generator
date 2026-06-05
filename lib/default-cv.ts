import {
  CV_SCHEMA_VERSION,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_MARGIN_X_MM,
  DEFAULT_MARGIN_Y_MM,
  DEFAULT_PHOTO_WIDTH_PX,
  DEFAULT_SECTION_INDENT_MM,
  DEFAULT_SECTION_TITLES,
  type CvData,
} from "./cv-types";

// Alapértelmezett CV — kitalált személy, bemutató célra.
// Ez tölti be magát, ha még nincs mentett adat a localStorage-ban.
export const defaultCv: CvData = {
  schemaVersion: CV_SCHEMA_VERSION,

  marginY: DEFAULT_MARGIN_Y_MM,
  marginX: DEFAULT_MARGIN_X_MM,
  sectionIndent: DEFAULT_SECTION_INDENT_MM,

  firstName: "BENCE",
  lastName: "VARGA",
  photoDataUrl: "",
  photoShape: "square",
  photoWidth: DEFAULT_PHOTO_WIDTH_PX,
  photoOffsetX: 0,
  contacts: [
    { id: "c-location", text: "H-1117 Budapest" },
    { id: "c-phone", text: "+36/20 413-7891" },
    {
      id: "c-email",
      text: "varga.bence@example.com",
      url: "mailto:varga.bence@example.com",
      newLine: true,
    },
    { id: "c-github", text: "github.com/bencevarga", url: "https://github.com/" },
    { id: "c-linkedin", text: "LinkedIn", url: "https://www.linkedin.com/" },
  ],

  summary:
    "Full-stack software engineer with 4 years of professional experience, specializing in cloud-native web applications. Passionate about clean architecture, developer experience, and building products that users actually enjoy. Comfortable leading small teams and mentoring junior developers.",

  experience: [
    {
      id: "exp-1",
      period: "2023. 03. – PRESENT",
      title: "SENIOR FULL-STACK DEVELOPER",
      organization: "NEXORA SOLUTIONS ZRT.",
      description:
        "Leading the frontend chapter of a SaaS analytics platform serving 50 000+ users. Migrated a legacy monolith to a React + Node.js microservices architecture, reducing average page load time by 40%. Conduct regular code reviews and onboard new team members.",
    },
    {
      id: "exp-2",
      period: "2021. 06. – 2023. 02.",
      title: "FULL-STACK DEVELOPER",
      organization: "BRIGHTLOOP KFT.",
      description:
        "Built and maintained customer-facing features for an e-commerce platform (Next.js, TypeScript, PostgreSQL). Introduced end-to-end testing with Playwright, cutting regression bugs by 60%. Collaborated in a cross-functional team using Scrum.",
    },
    {
      id: "exp-3",
      period: "2020. 09. – 2021. 05.",
      title: "JUNIOR FRONTEND DEVELOPER",
      organization: "WEBCRAFT STUDIO",
      description:
        "Developed responsive UI components for various client projects using React and Tailwind CSS. Participated in UX workshops and translated Figma designs into pixel-perfect implementations.",
    },
  ],

  projects: [
    {
      id: "proj-1",
      period: "2024 – PRESENT",
      title: "PULSEDESK",
      organization: "OPEN SOURCE / SIDE PROJECT",
      description:
        "Real-time team task board with WebSocket sync, built with Next.js 15, Drizzle ORM, and Supabase. Features drag-and-drop, role-based permissions, and Slack notifications. 200+ GitHub stars.",
    },
    {
      id: "proj-2",
      period: "2022",
      title: "INVOICEFLOW",
      organization: "FREELANCE",
      description:
        "Automated invoicing tool for Hungarian freelancers with Számlázz.hu API integration. Reduced invoice creation time from ~15 minutes to under 30 seconds. Used technologies: React, tRPC, Prisma, Railway.",
    },
  ],

  education: [
    {
      id: "edu-1",
      period: "2017 – 2021",
      title: "BSC COMPUTER SCIENCE",
      organization: "BUDAPESTI MŰSZAKI ÉS GAZDASÁGTUDOMÁNYI EGYETEM",
      description:
        "Graduated with distinction (GPA 4.62 / 5.00). Thesis: \"Performance comparison of server-side rendering strategies in modern JavaScript frameworks\". Relevant courses: Algorithms & Data Structures, Databases, Software Engineering, Computer Networks.",
    },
    {
      id: "edu-2",
      period: "2011 – 2017",
      title: "INFORMATICS",
      organization: "FAZEKAS MIHÁLY FŐGIMNÁZIUM, BUDAPEST",
      description:
        "Mathematics and informatics specialisation. National finalist in the Nemes Tihamér programming competition (2016, 2017). Graduated with 4.88 average.",
    },
  ],

  accentColor: DEFAULT_ACCENT_COLOR,
  sectionTitles: { ...DEFAULT_SECTION_TITLES },

  skills: [
    { id: "skill-1", text: "React, Next.js, TypeScript" },
    { id: "skill-2", text: "Node.js, Express, tRPC" },
    { id: "skill-3", text: "PostgreSQL, Prisma, Drizzle ORM" },
    { id: "skill-4", text: "Docker, CI/CD, GitHub Actions" },
    { id: "skill-5", text: "English – C1 (IELTS 7.5, 2021)" },
    { id: "skill-6", text: "Agile / Scrum, JIRA" },
    { id: "skill-7", text: "Figma, UI/UX fundamentals" },
    { id: "skill-8", text: "Category B driving licence" },
  ],
};
