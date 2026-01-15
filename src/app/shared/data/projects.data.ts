import { Project } from '../../components/home/project/components/project-card/project-card';

export const PROJECTS_DATA: Project[] = [
  {
    name: 'Keycloakify Custom Theme',
    type: 'Dev Tools',
    image: './projects/keycloakify.png',
    description:
      'A modern, responsive React-based theme for Keycloak Identity Server. Replaces the legacy FreeMarker templates with a clean Tailwind CSS interface.',
    techs: ['React', 'TypeScript', 'Keycloakify', 'Tailwind'],
    website: 'https://oussemasahbeni.github.io/keycloakify-shadcn-starter',
    highlights: [
      'React-based component architecture',
      'Full Dark Mode support',
      'Custom email template generation',
    ],
  },
  {
    name: 'One Saha',
    type: 'Health Tech',
    image: './projects/one_saha.png',
    description:
      'Community-driven public health data aggregation platform. Uses ML to classify and serve relevant health news and statistics to the public.',
    techs: ['Spring Cloud', 'Python', 'ML', 'Docker', 'Prometheus'],
    website: 'https://onesaha.org/home',
    highlights: [
      'Microservices architecture (10+ services)',
      'ML-powered news classification engine',
      'Real-time data processing pipeline',
    ],
  },
  {
    name: 'Ministry of Agriculture',
    type: 'Government',
    image: './projects/agriculture.png',
    description:
      'The official digital gateway for the Ministry. A high-traffic portal providing secure access to agricultural services, news, and regulatory data.',
    techs: ['Elasticsearch', 'Keycloak', 'Resilience4j', 'Tailwind'],
    website: 'https://staging-agri.agrinet.tn/home',
    highlights: [
      'Advanced search with Elasticsearch',
      'High-availability & Rate limiting',
      'WCAG Accessibility compliance',
    ],
  },
  {
    name: 'Talim',
    type: 'Education - XR',
    image: './projects/talim.png',
    description:
      'An immersive XR awareness project that educates children and teenagers about harassment, bullying, and unsafe behaviors through interactive virtual experiences.',
    techs: ['Next.js', 'TypeScript', 'Spring Boot', 'Tailwind'],
    website: 'https://talim-beder.inspark.tn/',
    highlights: [
      'Immersive XR-based learning experiences',
      'Interactive scenarios focused on real-life risk situations',
      'Educational content designed for children and adolescents',
      'Promotes safe decision-making and awareness through storytelling',
    ],
  },
  {
    name: 'Sabeel Platform',
    type: 'Social Impact',
    image: './projects/sabeel.png',
    description:
      'A comprehensive reintegration ecosystem for ex-prisoners. The platform bridges the gap between rehabilitation and society through tailored resource matching.',
    techs: ['Angular', 'Spring Boot', 'PostgreSQL', 'Keycloak', 'AWS'],
    website: null,
    highlights: [
      'Assisted 500+ individuals with reintegration',
      'Increased job placement rates by 40%',
      'Secure RBAC with Keycloak Identity',
    ],
  },
  {
    name: 'Inspark Forge',
    type: 'AI Recruitment',
    image: './projects/inspark_forge.png',
    description:
      'Next-gen talent matching for the Tunisian market. Leverages GPT-4o to analyze CVs and match candidates with opportunities based on semantic compatibility.',
    techs: ['OpenAI API', 'Spring Boot', 'DDD', 'RabbitMQ', 'Angular'],
    website: 'https://talent.inspark.tn/',
    highlights: [
      'Integrated GPT-4o for semantic matching',
      'Domain-Driven Design implementation',
      'Asynchronous event-driven architecture',
    ],
  },
  {
    name: 'Tech Professionals Survey Analytics',
    type: 'Big Data - Analytics',
    image:
      'https://private-user-images.githubusercontent.com/100224001/402820164-429c4626-c3f4-4b9f-9a1f-e858dff7ea69.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Njg0MzUwMzcsIm5iZiI6MTc2ODQzNDczNywicGF0aCI6Ii8xMDAyMjQwMDEvNDAyODIwMTY0LTQyOWM0NjI2LWMzZjQtNGI5Zi05YTFmLWU4NThkZmY3ZWE2OS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwMTE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDExNFQyMzUyMTdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1hZjk2OWMyZjFlMzVmOWQ2OWM1YTFjZDkzODllNzIyYWQyMTUzNmQwZDE4MWYxOTIyMDcyZTk5MTIzNTJjMThhJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.HuAKnNatnLRmn9BfHafBGgTsrl3T2YHcBc9d4IPeGOU',
    description:
      'A Big Data project that analyzes a survey of computer science and data science professionals. It focuses on data cleaning, analysis, and visualization to extract meaningful insights using Power BI and Python.',
    techs: ['Python', 'Power BI', 'Pandas', 'Matplotlib', 'Seaborn', 'Excel'],
    website:
      'https://github.com/aziz-zina/Tech-Professionals-Survey-Analytics',
    highlights: [
      'Real-world survey data analysis',
      'Comprehensive data cleaning and preparation',
      'Interactive dashboards built with Power BI',
      'Insightful visualizations using Python',
    ],
  },
];
