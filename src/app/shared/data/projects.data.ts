import { Project } from "../../components/home/project/components/project-card/project-card";

export const PROJECTS_DATA: Project[] = [
  {
    name: "Keycloakify Custom Theme",
    slug: "keycloakify-custom-theme",
    type: "Dev Tools",
    image: "./projects/keycloakify-1.png",
    images: [
      "./projects/keycloakify-2.png",
      "./projects/keycloakify-3.png",
      "./projects/keycloakify-4.png",
      "./projects/keycloakify-5.png",
      "./projects/keycloakify-6.png",
    ],
    description:
      "A modern, responsive React-based theme for Keycloak Identity Server. Replaces the legacy FreeMarker templates with a clean Tailwind CSS interface.",
    techs: ["React", "TypeScript", "Keycloakify", "Tailwind"],
    website: "https://oussemasahbeni.github.io/keycloakify-shadcn-starter",
    highlights: [
      "React-based component architecture",
      "Full Dark Mode support",
      "Custom email template generation",
    ],
    hasDetails: true,
  },
  {
    name: "One Saha",
    slug: "one-saha",
    type: "Health Tech",
    image: "./projects/one_saha.png",
    description:
      "Community-driven public health data aggregation platform. Uses ML to classify and serve relevant health news and statistics to the public.",
    techs: ["Spring Cloud", "Python", "ML", "Docker", "Prometheus"],
    website: "https://onesaha.org/home",
    highlights: [
      "Microservices architecture (10+ services)",
      "ML-powered news classification engine",
      "Real-time data processing pipeline",
    ],
    hasDetails: false,
  },
  {
    name: "Ministry of Agriculture",
    slug: "ministry-of-agriculture",
    type: "Government",
    image: "./projects/agriculture.png",
    description:
      "The official digital gateway for the Ministry. A high-traffic portal providing secure access to agricultural services, news, and regulatory data.",
    techs: ["Elasticsearch", "Keycloak", "Resilience4j", "Tailwind"],
    website: "https://staging-agri.agrinet.tn/home",
    highlights: [
      "Advanced search with Elasticsearch",
      "High-availability & Rate limiting",
      "WCAG Accessibility compliance",
    ],
    hasDetails: false,
  },
  {
    name: "Talim",
    slug: "talim",
    type: "Education - XR",
    image: "./projects/talim.png",
    description:
      "An immersive XR awareness project that educates children and teenagers about harassment, bullying, and unsafe behaviors through interactive virtual experiences.",
    techs: ["Next.js", "TypeScript", "Spring Boot", "Tailwind"],
    website: "https://talim-beder.inspark.tn/",
    highlights: [
      "Immersive XR-based learning experiences",
      "Interactive scenarios focused on real-life risk situations",
      "Educational content designed for children and adolescents",
      "Promotes safe decision-making and awareness through storytelling",
    ],
    hasDetails: false,
  },
  {
    name: "Sabeel Platform",
    slug: "sabeel-platform",
    type: "Social Impact",
    image: "./projects/sabeel.png",
    description:
      "A comprehensive reintegration ecosystem for ex-prisoners. The platform bridges the gap between rehabilitation and society through tailored resource matching.",
    techs: ["Angular", "Spring Boot", "PostgreSQL", "Keycloak", "AWS"],
    website: null,
    highlights: [
      "Assisted 500+ individuals with reintegration",
      "Increased job placement rates by 40%",
      "Secure RBAC with Keycloak Identity",
    ],
    hasDetails: false,
  },
  {
    name: "Inspark Forge",
    slug: "inspark-forge",
    type: "AI Recruitment",
    image: "./projects/inspark_forge.png",
    description:
      "Next-gen talent matching for the Tunisian market. Leverages GPT-4o to analyze CVs and match candidates with opportunities based on semantic compatibility.",
    techs: ["OpenAI API", "Spring Boot", "DDD", "RabbitMQ", "Angular"],
    website: "https://talent.inspark.tn/",
    highlights: [
      "Integrated GPT-4o for semantic matching",
      "Domain-Driven Design implementation",
      "Asynchronous event-driven architecture",
    ],
    hasDetails: false,
  },
  {
    name: "Tech Professionals Survey Analytics",
    slug: "tech-professionals-survey",
    type: "Big Data - Analytics",
    image: "./projects/data_survery.png",
    description:
      "A Big Data project that analyzes a survey of computer science and data science professionals. It focuses on data cleaning, analysis, and visualization to extract meaningful insights using Power BI and Python.",
    techs: ["Python", "Power BI", "Pandas", "Matplotlib", "Seaborn", "Excel"],
    website: "https://github.com/aziz-zina/Tech-Professionals-Survey-Analytics",
    highlights: [
      "Real-world survey data analysis",
      "Comprehensive data cleaning and preparation",
      "Interactive dashboards built with Power BI",
      "Insightful visualizations using Python",
    ],
    hasDetails: true,
  },
];
