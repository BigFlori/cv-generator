import {
  CV_SCHEMA_VERSION,
  DEFAULT_MARGIN_X_MM,
  DEFAULT_MARGIN_Y_MM,
  DEFAULT_PHOTO_WIDTH_PX,
  DEFAULT_SECTION_INDENT_MM,
  DEFAULT_SECTION_TITLES,
  type CvData,
} from "./cv-types";

// Alapértelmezett CV — a cv-sample.png-ből kiolvasott tartalom.
// Ez tölti be magát, ha még nincs mentett adat a localStorage-ban.
export const defaultCv: CvData = {
  schemaVersion: CV_SCHEMA_VERSION,

  marginY: DEFAULT_MARGIN_Y_MM,
  marginX: DEFAULT_MARGIN_X_MM,
  sectionIndent: DEFAULT_SECTION_INDENT_MM,

  firstName: "FLÓRIÁN",
  lastName: "MOLNÁR",
  photoDataUrl: "",
  photoShape: "square",
  photoWidth: DEFAULT_PHOTO_WIDTH_PX,
  photoOffsetX: 0,
  contacts: [
    { id: "c-location", text: "H-9730 Kőszeg" },
    { id: "c-phone", text: "+36/30 250-8322" },
    {
      id: "c-email",
      text: "florian00m14@gmail.com",
      url: "mailto:florian00m14@gmail.com",
      newLine: true,
    },
    { id: "c-github", text: "GitHub", url: "https://github.com/" },
    { id: "c-linkedin", text: "LinkedIn", url: "https://www.linkedin.com/" },
  ],

  summary:
    "My goal is to pursue a full-time career as a web developer after completing my university studies. I began programming in 2016 with Java, and ever since, I've been passionate about building digital solutions. I'm eager to take on new challenges, continuously learn new technologies, and I'm willing to relocate for the right position.",

  experience: [
    {
      id: "exp-1",
      period: "2024. 08. – PRESENT",
      title: "JUNIOR JAVA BACKEND DEVELOPER",
      organization: "IVY TECHNOLOGY KFT.",
      description:
        "ERP system development, using microservices architecture with Spring Boot in an Agile environment. Collaborating closely with colleagues from diverse backgrounds.",
    },
    {
      id: "exp-2",
      period: "2024. 04. – 2024. 07.",
      title: "INTERN",
      organization: "IVY TECHNOLOGY KFT.",
      description:
        "Development of an ERP system based on Java. Participation in teamwork and trigger development. This was my professional internship.",
    },
  ],

  projects: [
    {
      id: "proj-1",
      period: "2023 – PRESENT",
      title: "TUJI-BOOKING",
      organization: "TUJIBUSZ.HU",
      description:
        "Reservation system used within businesses for organizing rentals. This project is also my university thesis. Used technologies: Next.js, TypeScript, Material UI, Firebase, Vercel.",
    },
    {
      id: "proj-2",
      period: "2023",
      title: "PORTFOLIO",
      organization: "ELTE – WEB DEVELOPMENT",
      description:
        "Introductory webpage created for web development course. Used technologies: HTML5, SASS, JavaScript, Bootstrap5.",
    },
  ],

  education: [
    {
      id: "edu-1",
      period: "2022 – PRESENT",
      title: "COMPUTER SCIENCE",
      organization: "EÖTVÖS LÓRÁND TUDOMÁNYEGYETEM",
      description:
        "I am a final year student. Relevant courses: Web development (HTML5, CSS, JavaScript, PHP), Object-oriented programming (C#, Java), Event-driven programming (Java, Agile methodology, Gantt, Use-case diagrams).",
    },
    {
      id: "edu-2",
      period: "2016 – 2022",
      title: "SOFTWARE DEVELOPER",
      organization: "VMISZC NÁDASDY TAMÁS TECHNIKUM ÉS KOLLÉGIUM",
      description:
        "I finished my final year with an average of 4.31. Relevant courses: Programming (Java, MySQL, HTML5, CSS, JavaScript), Programming paradigms (Python), Network fundamentals (Cisco CCNA).",
    },
  ],

  sectionTitles: { ...DEFAULT_SECTION_TITLES },

  skills: [
    { id: "skill-1", text: "English language exam (B2) – 2022" },
    { id: "skill-2", text: "React, Next.js, TypeScript" },
    { id: "skill-3", text: "Category B driving license – 2020" },
    { id: "skill-4", text: "Java, Spring Boot" },
    { id: "skill-5", text: "Agile software development" },
    { id: "skill-6", text: "Microservice architecture" },
    { id: "skill-7", text: "JIRA ticketing system" },
    { id: "skill-8", text: "Git/GitHub version control" },
  ],
};
