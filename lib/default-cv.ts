import {
  CV_SCHEMA_VERSION,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_MARGIN_BOTTOM_MM,
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
  marginBottom: DEFAULT_MARGIN_BOTTOM_MM,
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
    "Full-stack software engineer with 4 years of experience specializing in cloud-native web applications. Passionate about clean architecture and developer experience. Comfortable leading small teams and mentoring junior developers.",

  experience: [
    {
      id: "exp-1",
      period: "2023. 03. – PRESENT",
      title: "SENIOR FULL-STACK DEVELOPER",
      organization: "NEXORA SOLUTIONS ZRT.",
      description:
        "Leading the frontend chapter of a SaaS analytics platform (50 000+ users). Migrated legacy monolith to React + Node.js microservices, reducing page load by 40%. Code reviews and onboarding.",
    },
    {
      id: "exp-2",
      period: "2021. 06. – 2023. 02.",
      title: "FULL-STACK DEVELOPER",
      organization: "BRIGHTLOOP KFT.",
      description:
        "Built customer-facing features for an e-commerce platform (Next.js, TypeScript, PostgreSQL). Introduced Playwright E2E tests, cutting regression bugs by 60%.",
    },
    {
      id: "exp-3",
      period: "2020. 09. – 2021. 05.",
      title: "JUNIOR FRONTEND DEVELOPER",
      organization: "WEBCRAFT STUDIO",
      description:
        "Developed responsive UI components using React and Tailwind CSS. Translated Figma designs into pixel-perfect implementations.",
    },
  ],

  projects: [
    {
      id: "proj-1",
      period: "2024 – PRESENT",
      title: "PULSEDESK",
      organization: "OPEN SOURCE / SIDE PROJECT",
      description:
        "Real-time team task board (Next.js 15, Drizzle ORM, Supabase) with drag-and-drop, role-based permissions, and Slack notifications. 200+ GitHub stars.",
    },
    {
      id: "proj-2",
      period: "2022",
      title: "INVOICEFLOW",
      organization: "FREELANCE",
      description:
        "Invoicing tool for Hungarian freelancers with Számlázz.hu integration. Reduced invoice creation from ~15 min to under 30 sec. Stack: React, tRPC, Prisma.",
    },
  ],

  education: [
    {
      id: "edu-1",
      period: "2017 – 2021",
      title: "BSC COMPUTER SCIENCE",
      organization: "BUDAPESTI MŰSZAKI ÉS GAZDASÁGTUDOMÁNYI EGYETEM",
      description:
        "Graduated with distinction (GPA 4.62 / 5.00). Thesis: \"SSR performance comparison in modern JS frameworks\". Courses: Algorithms, Databases, Software Engineering.",
    },
    {
      id: "edu-2",
      period: "2011 – 2017",
      title: "INFORMATICS",
      organization: "FAZEKAS MIHÁLY FŐGIMNÁZIUM, BUDAPEST",
      description:
        "Maths and informatics specialisation. National finalist in the Nemes Tihamér programming competition (2016, 2017).",
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
  ],
};
