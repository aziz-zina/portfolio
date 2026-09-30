/** Roles shown in the Experience section, newest first. Also feeds the portfolio assistant. */
export interface ExperienceItem {
  title: string;
  company: string;
  logo: string;
  /** "YYYY-MM" */
  start: string;
  /** "YYYY-MM", or null while ongoing */
  end: string | null;
  current: boolean;
  /** One sentence of context, shown under the title. */
  summary: string;
  /** What you did; `tags` are the `skills` it used, linked on hover. */
  highlights: { text: string; tags: string[] }[];
  skills: string[];
}

export const EXPERIENCE_DATA: ExperienceItem[] = [
  {
    title: "Software Engineer",
    start: "2026-06",
    end: null,
    company: "Accent",
    logo: "companies/accent_logo.jfif",
    current: true,
    summary:
      "Building a fleet management platform end to end, from the Angular frontend to the Spring Boot backend.",
    highlights: [
      {
        text: "Building the fleet, vehicle, mission, maintenance, driver and expense modules.",
        tags: ["Angular", "TypeScript", "Spring Boot", "Java", "PostgreSQL"],
      },
      {
        text: "Shipping new features and fixing bugs across both the frontend and the backend.",
        tags: ["Angular", "TypeScript", "Spring Boot", "Git"],
      },
      {
        text: "Improving performance while keeping the platform scalable, secure and reliable.",
        tags: ["Spring Boot", "REST APIs", "PostgreSQL"],
      },
    ],
    skills: ["Angular", "Spring Boot", "Java", "TypeScript", "PostgreSQL", "REST APIs", "Git"],
  },
  {
    title: "Software Developer",
    start: "2024-01",
    end: "2026-06",
    company: "Inspark",
    logo: "companies/inspark.png",
    current: false,
    summary:
      "Maintained enterprise-grade Angular and Spring Boot applications for two and a half years.",
    highlights: [
      {
        text: "Kept the apps secure with Keycloak single sign-on and a modular component architecture.",
        tags: ["Angular", "Spring Boot", "Keycloak", "PostgreSQL"],
      },
      {
        text: "Refactored core services into reusable, domain-driven modules, making them 30% easier to maintain.",
        tags: ["Spring Boot"],
      },
      {
        text: "Added real-time messaging with RabbitMQ and WebSocket.",
        tags: ["RabbitMQ", "Spring Boot", "Angular"],
      },
      {
        text: "Deployed and monitored the apps on AWS and Azure.",
        tags: ["AWS", "Azure", "Docker"],
      },
    ],
    skills: ["Angular", "Spring Boot", "Keycloak", "RabbitMQ", "AWS", "Azure", "Docker", "PostgreSQL"],
  },
  {
    title: "Advanced Internship Trainee",
    start: "2022-01",
    end: "2022-02",
    company: "BNA - Banque Nationale Agricole",
    logo: "companies/bna.png",
    current: false,
    summary: "Built an expense management module for the bank's litigation management system.",
    highlights: [
      {
        text: "Designed and developed the module end to end, from the database to the user interface.",
        tags: ["Spring Boot", "Angular", "Oracle Database"],
      },
      {
        text: "Built the backend services that streamline expense tracking and validation.",
        tags: ["Spring Boot", "Oracle Database"],
      },
      {
        text: "Created the screens the litigation team uses to record and approve expenses.",
        tags: ["Angular"],
      },
    ],
    skills: ["Spring Boot", "Angular", "Oracle Database"],
  },
  {
    title: "Introductory Internship Trainee",
    start: "2021-07",
    end: "2021-08",
    company: "QNB - Qatar National Bank",
    logo: "companies/qnb.png",
    current: false,
    summary: "Supported the computer systems department with hardware and software maintenance.",
    highlights: [
      {
        text: "Maintained the bank's workstations, hardware and software alike.",
        tags: ["Hardware Maintenance", "Software Maintenance"],
      },
      {
        text: "Provided technical support for operating systems and internal IT infrastructure.",
        tags: ["IT Support", "Software Maintenance"],
      },
    ],
    skills: ["IT Support", "Hardware Maintenance", "Software Maintenance"],
  },
];
