export interface TechStack {
  name: string;
  icon: string;
  title: string;
}

export interface TechCategory {
  title: string;
  categoryIcon: string;
  skills: TechStack[];
}

export const techCategoriesData: TechCategory[] = [
  {
    title: 'Frontend Development',
    categoryIcon: 'lucideLayout',
    skills: [
      {
        name: 'Angular',
        icon: 'https://img.icons8.com/?size=48&id=6SWtW8hxZWSo&format=png',
        title: 'Angular - TypeScript-based web framework',
      },
      {
        name: 'Next.js',
        icon: 'https://img.icons8.com/?size=48&id=MWiBjkuHeMVq&format=png',
        title: 'Next.js - React framework for production',
      },
      {
        name: 'React',
        icon: 'https://img.icons8.com/?size=100&id=asWSSTBrDlTW&format=png&color=000000',
        title: 'React - JavaScript library for building UIs',
      },
      {
        name: 'TypeScript',
        icon: 'https://img.icons8.com/?size=48&id=uJM6fQYqDaZK&format=png',
        title: 'TypeScript - Typed JavaScript superset',
      },
      {
        name: 'Tailwind CSS',
        icon: 'https://img.icons8.com/?size=48&id=CIAZz2CYc6Kc&format=png',
        title: 'Tailwind CSS - Utility-first CSS framework',
      },
    ]
  },
  {
    title: 'Backend Development',
    categoryIcon: 'lucideServer',
    skills: [
      {
        name: 'Spring Boot',
        icon: 'https://img.icons8.com/?size=48&id=90519&format=png',
        title: 'Spring Boot - Java enterprise framework',
      },
      {
        name: 'Node.js',
        icon: 'https://img.icons8.com/?size=48&id=hsPbhkOH4FMe&format=png',
        title: 'Node.js - JavaScript runtime environment',
      },
      {
        name: 'Java',
        icon: 'https://img.icons8.com/?size=100&id=GPfHz0SM85FX&format=png&color=000000',
        title: 'Java - Programming language',
      },
      {
        name: 'Python',
        icon: 'https://img.icons8.com/?size=100&id=13441&format=png&color=000000',
        title: 'Python - Programming language',
      },
    ]
  },
  {
    title: 'Databases & Message Brokers',
    categoryIcon: 'lucideDatabase',
    skills: [
      {
        name: 'PostgreSQL',
        icon: 'https://img.icons8.com/?size=48&id=38561&format=png',
        title: 'PostgreSQL - Advanced relational database',
      },
      {
        name: 'MySQL',
        icon: 'https://img.icons8.com/?size=100&id=QeIg9siFKGgp&format=png&color=000000',
        title: 'MySQL - Relation database system',
      },
      {
        name: 'MongoDB',
        icon: 'https://img.icons8.com/?size=48&id=8rKdRqZFLurS&format=png',
        title: 'MongoDB - NoSQL document database',
      },
      {
        name: 'RabbitMQ',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rabbitmq/rabbitmq-original.svg',
        title: 'RabbitMQ - Message broker',
      },
    ]
  },
  {
    title: 'DevOps & Cloud',
    categoryIcon: 'lucideCloud',
    skills: [
      {
        name: 'Linux',
        icon: 'https://img.icons8.com/?size=48&id=17842&format=png',
        title: 'Linux - Operating System',
      },
      {
        name: 'Docker',
        icon: 'https://img.icons8.com/?size=48&id=cdYUlRaag9G9&format=png',
        title: 'Docker - Containerization platform',
      },
      {
        name: 'Kubernetes',
        icon: 'https://img.icons8.com/?size=100&id=cvzmaEA4kC0o&format=png&color=000000',
        title: 'Kubernetes - Container orchestration platform',
      },
      {
        name: 'AWS',
        icon: 'https://img.icons8.com/?size=100&id=G0CnLqqcRBXl&format=png&color=000000',
        title: 'AWS - Amazon Web Services cloud platform',
      },
      {
        name: 'Azure',
        icon: 'https://img.icons8.com/?size=48&id=VLKafOkk3sBX&format=png',
        title: 'Azure - Microsoft Azure cloud platform',
      }
    ]
  },
  {
    title: 'Tools & Security',
    categoryIcon: 'lucideShield',
    skills: [
      {
        name: 'Keycloak',
        icon: 'https://img.icons8.com/fluency/48/key-cloak.png',
        title: 'Keycloak - Identity and access management',
      },
      {
        name: 'Prometheus',
        icon: 'https://img.icons8.com/?size=48&id=lOqoeP2Zy02f&format=png',
        title: 'Prometheus - Monitoring and alerting toolkit',
      },
      {
        name: 'Grafana',
        icon: 'https://img.icons8.com/?size=48&id=9uVrNMu3Zx1K&format=png',
        title: 'Grafana - Analytics and monitoring platform',
      },
      {
        name: 'Git',
        icon: 'https://img.icons8.com/?size=48&id=20906&format=png',
        title: 'Git - Version control system',
      },
    ]
  },
  {
    title: 'Development Environments',
    categoryIcon: 'lucideCode',
    skills: [
      {
        name: 'IntelliJ IDEA',
        icon: 'https://img.icons8.com/?size=100&id=61466&format=png&color=000000',
        title: 'IntelliJ IDEA - Integrated development environment',
      },
      {
        name: 'VS Code',
        icon: 'https://img.icons8.com/?size=100&id=9OGIyU8hrxW5&format=png&color=000000',
        title: 'VS Code - Source-code editor',
      },
      {
        name: 'Jupyter Notebook',
        icon: 'https://img.icons8.com/?size=100&id=J0SgMWzAxqFj&format=png&color=000000',
        title: 'Jupyter Notebook - Notebook environment',
      },
    ]
  }
];
