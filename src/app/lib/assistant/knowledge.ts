import { techCategoriesData } from '../../components/home/about-me/data';
import { EXPERIENCE_DATA, type ExperienceItem } from '../../shared/data/experience.data';
import { PROJECTS_DATA } from '../../shared/data/projects.data';
import type { SpotifyNowPlaying } from '../spotify/spotify.service';

/**
 * Everything the portfolio assistant can answer.
 *
 * Each entry lists a few ways a visitor might ask the question. Every phrasing
 * is embedded in the browser, and a question matches the entry whose closest
 * phrasing is most similar in meaning — so wording doesn't have to be exact,
 * but the answers are always these pre-written ones (nothing is generated, so
 * nothing can be made up). Answers are built from the site's own data, so they
 * stay in sync with the Experience and Projects sections.
 *
 * To teach it something new, add an entry: 3–6 varied phrasings work best.
 */

export interface AnswerContext {
  nowPlaying: SpotifyNowPlaying;
}

export interface KnowledgeEntry {
  id: string;
  /** Ways to ask it. The first one is also used as a suggestion chip. */
  questions: string[];
  answer: string | ((ctx: AnswerContext) => string);
  link?: { label: string; href: string };
  /** Entry ids to offer as follow-ups. */
  followUps?: string[];
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const month = (value: string) => {
  const [year, m] = value.split('-').map(Number);
  return `${MONTHS[m - 1]} ${year}`;
};

const period = (item: ExperienceItem) =>
  item.end ? `from ${month(item.start)} to ${month(item.end)}` : `since ${month(item.start)}`;

const list = (items: string[]) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const current = EXPERIENCE_DATA.find((item) => item.current) ?? EXPERIENCE_DATA[0];
const skillsIn = (title: string) => techCategoriesData.find((c) => c.title === title)?.skills.map((s) => s.name) ?? [];

const EMAIL = 'aziz.zina2001@gmail.com';
const PHONE = '+216 93 505 147';

const roleEntries: KnowledgeEntry[] = EXPERIENCE_DATA.map((item) => {
  const company = item.company.split(' - ')[0];
  return {
    id: `role-${slug(company)}`,
    questions: [
      `What did Aziz do at ${company}?`,
      `Tell me about his time at ${company}`,
      `His role at ${item.company}`,
      `${company} experience`,
    ],
    answer:
      `At ${item.company}, Aziz ${item.current ? 'works' : 'worked'} as ${item.title} ${period(item)}. ${item.summary}\n` +
      item.highlights.map((h) => `• ${h.text}`).join('\n') +
      `\nStack: ${list(item.skills)}.`,
    link: { label: 'See experience', href: '/#experience' },
    followUps: ['experience', 'projects'],
  };
});

const projectEntries: KnowledgeEntry[] = PROJECTS_DATA.map((project) => ({
  id: `project-${project.slug ?? slug(project.name)}`,
  questions: [
    `Tell me about the ${project.name} project`,
    `What is ${project.name}?`,
    `How was ${project.name} built?`,
    `${project.name}`,
  ],
  answer:
    `${project.name} (${project.type}): ${project.description}\n` +
    project.highlights.map((h) => `• ${h}`).join('\n') +
    `\nBuilt with ${list(project.techs)}.`,
  link: project.hasDetails && project.slug
    ? { label: 'Read the case study', href: `/projects/${project.slug}` }
    : project.website
      ? { label: 'Visit the project', href: project.website }
      : { label: 'See all projects', href: '/projects' },
  followUps: ['projects', 'skills'],
}));

export const KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'greeting',
    questions: ['Hi', 'Hello there', 'Hey, how are you?', 'Good morning'],
    answer:
      "Hi! I'm Aziz's portfolio assistant. Ask me about his experience, projects, skills, or how to get in touch.",
    followUps: ['about', 'current-role', 'projects'],
  },
  {
    id: 'about',
    questions: ['Who is Aziz?', 'Tell me about Aziz', 'Introduce yourself', 'Who are you?', 'What does Aziz do?'],
    answer:
      'Aziz Zina is a full-stack developer from Tunisia who specializes in Angular, Spring Boot and FastAPI. ' +
      'He builds scalable, secure and AI-powered web applications with clean architecture and modern frameworks, ' +
      `and he's currently a ${current.title} at ${current.company}.`,
    followUps: ['experience', 'skills', 'contact'],
  },
  {
    id: 'current-role',
    questions: ['Where does Aziz work now?', 'Where does he work these days?', 'What is his current job?', 'Who is he working for at the moment?', 'Is he employed right now?', "What's his current position?"],
    answer: `Aziz is currently a ${current.title} at ${current.company}, ${period(current)}. ${current.summary}`,
    link: { label: 'See experience', href: '/#experience' },
    followUps: [`role-${slug(current.company)}`, 'experience'],
  },
  {
    id: 'experience',
    questions: ['What is his work experience?', 'Tell me about his career', 'Where has he worked before?', 'What companies has he worked for?', 'Show me his resume'],
    answer:
      'Here is his path so far:\n' +
      EXPERIENCE_DATA.map((item) => `• ${item.title} at ${item.company}, ${period(item)}`).join('\n'),
    link: { label: 'See experience', href: '/#experience' },
    followUps: ['years', 'current-role'],
  },
  {
    id: 'years',
    questions: ['How many years of experience does he have?', 'How long has he been a developer?', 'How experienced is Aziz?', 'Is he a senior or junior developer?'],
    answer:
      `Aziz has 3+ years of professional experience shipping production web apps, plus internships at banks back in 2021 and 2022. ` +
      `He's been building enterprise Angular and Spring Boot applications since ${month(EXPERIENCE_DATA.find((i) => i.company === 'Inspark')?.start ?? '2024-01')}.`,
    followUps: ['experience', 'skills'],
  },
  ...roleEntries,
  {
    id: 'projects',
    questions: ['What projects has he built?', 'Show me his work', 'What has he worked on?', 'What are his best projects?', 'Portfolio projects'],
    answer:
      'A few highlights:\n' +
      PROJECTS_DATA.map((p) => `• ${p.name} — ${p.type}`).join('\n') +
      '\nAsk me about any of them by name.',
    link: { label: 'See all projects', href: '/projects' },
    followUps: [`project-${PROJECTS_DATA[1]?.slug ?? ''}`, 'ai'],
  },
  ...projectEntries,
  {
    id: 'skills',
    questions: ['What are his skills?', 'What technologies does he use?', "What's his tech stack?", 'Which programming languages does he know?', 'What tools does he work with?'],
    answer:
      techCategoriesData
        .filter((c) => c.title !== 'Development Environments')
        .map((c) => `• ${c.title}: ${list(c.skills.map((s) => s.name))}`)
        .join('\n'),
    link: { label: 'See skills', href: '/#about' },
    followUps: ['frontend', 'backend', 'devops'],
  },
  {
    id: 'frontend',
    questions: ['Does he do frontend development?', 'What frontend frameworks does he use?', 'Which frameworks does he use for the frontend?', 'Does he know Angular?', 'Does he know React?', 'Can he build user interfaces?'],
    answer:
      `Yes — frontend is a big part of his work. He uses ${list(skillsIn('Frontend Development'))}, ` +
      'with Angular as his main framework. He also built the Spartan Admin Dashboard, an open-source Angular dashboard on spartan/ui.',
    followUps: ['backend', 'this-site'],
  },
  {
    id: 'backend',
    questions: ['Does he do backend development?', 'What backend frameworks does he use?', 'Does he know Spring Boot?', 'Can he build APIs?', 'Does he know Java?'],
    answer:
      `Yes. On the backend he works with ${list(skillsIn('Backend Development'))}, mostly Spring Boot, ` +
      `with ${list(skillsIn('Databases & Message Brokers'))} for data and messaging. ` +
      'He has built microservices, event-driven systems with RabbitMQ, and domain-driven designs.',
    followUps: ['devops', 'projects'],
  },
  {
    id: 'devops',
    questions: ['Does he know DevOps?', 'Does he work with the cloud?', 'Does he know Docker and Kubernetes?', 'Can he deploy applications?'],
    answer:
      `He works with ${list(skillsIn('DevOps & Cloud'))}, and uses ${list(skillsIn('Tools & Security'))} for security, monitoring and version control. ` +
      'At Inspark he deployed and monitored applications on AWS and Azure.',
    followUps: ['backend', 'experience'],
  },
  {
    id: 'ai',
    questions: ['Does he work with AI?', 'Has he built anything with machine learning?', 'Does he know AI and LLMs?', 'AI projects'],
    answer:
      'Yes, AI shows up across his work:\n' +
      '• Inspark Forge uses GPT-4o to match CVs with job opportunities\n' +
      '• One Saha uses machine learning to classify public health news\n' +
      '• The Spartan Admin Dashboard includes an AI assistant\n' +
      "• And me — a small AI model running right here in your browser.",
    followUps: ['assistant', 'projects'],
  },
  {
    id: 'contact',
    questions: ['How can I contact Aziz?', "What's his email?", 'How do I reach him?', 'What is his phone number?', 'Can I hire him?', 'Is he open to work?'],
    answer:
      `The best way to reach Aziz is by email at ${EMAIL}, or by phone and WhatsApp at ${PHONE}. ` +
      "You can also connect on LinkedIn or use the contact form — he'll get back to you.",
    link: { label: 'Go to contact', href: '/#contact' },
    followUps: ['socials', 'location'],
  },
  {
    id: 'socials',
    questions: ['What is his GitHub?', 'Is he on LinkedIn?', 'Where can I see his code?', 'Social media links'],
    answer: 'You can find his code on GitHub at github.com/aziz-zina, and connect on LinkedIn at linkedin.com/in/aziz-zina.',
    link: { label: 'Open GitHub', href: 'https://github.com/aziz-zina' },
    followUps: ['contact', 'projects'],
  },
  {
    id: 'location',
    questions: ['Where is Aziz based?', 'Where does he live?', 'Which country is he from?', 'What is his location?'],
    answer: 'Aziz is based in Tunisia.',
    followUps: ['contact', 'current-role'],
  },
  {
    id: 'blog',
    questions: ['Does he have a blog?', 'Does he write articles?', 'Where can I read his posts?'],
    answer: 'Yes, he writes about development on his blog.',
    link: { label: 'Open the blog', href: '/blog' },
    followUps: ['projects'],
  },
  {
    id: 'this-site',
    questions: ['How was this website built?', 'What is this portfolio built with?', 'What framework does this site use?', 'Is this site made with Angular?'],
    answer:
      'This portfolio is built with Analog, the Angular meta-framework, on Angular 21 with server-side rendering and prerendering. ' +
      'It uses Tailwind CSS and spartan/ui for the interface, GSAP and Lenis for motion, Three.js for the hero, and it runs on Vercel.',
    followUps: ['assistant', 'frontend'],
  },
  {
    id: 'assistant',
    questions: ['How do you work?', 'Are you ChatGPT?', 'What AI model are you?', 'Do you have a backend?', 'How does this assistant work?'],
    answer:
      "I run entirely in your browser — there's no server and no API key. A small embedding model, all-MiniLM-L6-v2, turns your question into a vector, " +
      'and I pick the closest match from a knowledge base written from this site. Voice uses the Web Speech API. ' +
      "Because I only ever give pre-written answers, I can't make things up about Aziz.",
    followUps: ['this-site', 'ai'],
  },
  {
    id: 'music',
    questions: ['What music does Aziz listen to?', 'What is he listening to right now?', 'Is he on Spotify?', 'What song is playing?'],
    answer: ({ nowPlaying }) =>
      nowPlaying.isPlaying && nowPlaying.title
        ? `Right now he's listening to ${nowPlaying.title} by ${nowPlaying.artist} on Spotify.`
        : "He's not listening to anything right now, but the Spotify widget in the navbar shows what's playing whenever he is.",
    followUps: ['about'],
  },
  {
    id: 'thanks',
    questions: ['Thank you', 'Thanks, that helps', 'Great, thanks!', 'Goodbye'],
    answer: "You're welcome! If you'd like to talk to Aziz directly, the contact section is the fastest way.",
    link: { label: 'Go to contact', href: '/#contact' },
  },
];

/** Shown before the first question. */
export const STARTERS = ['about', 'current-role', 'projects', 'contact'];

export const FALLBACK =
  "I'm not sure about that one — I only know about Aziz's work, skills and projects. Try one of these:";
