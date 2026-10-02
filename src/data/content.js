export const profile = {
  name: 'Shraddha Subedi',
  first: 'Shraddha',
  last: 'Subedi',
  role: 'Frontend & .NET developer',
  location: 'Baneshwor, Kathmandu, Nepal',
  email: 'shraddhaa.subedi@gmail.com',
  linkedin: 'https://www.linkedin.com/in/shraddha-subedi-810b6b19a/',
  linkedinLabel: 'linkedin.com/in/shraddha-subedi',
  github: 'https://github.com/subedisdha/',
  githubLabel: 'github.com/subedisdha',
};

export const about = {
  heading: 'Identity',
  paragraphs: [
    'I am a BSc.CSIT graduate from Tribhuvan University (2023) who likes building things for the web — and then taking them apart to see how they could be better.',
    'My comfort zone is the frontend: layout, interaction, the details that make an interface feel considered. Lately I have been going deeper into backend work — writing the .NET MVC API that feeds a React interface is what made the whole system finally make sense. I keep Laravel in the mix too, mostly through self-study.',
    'This site is my own small experiment — a place to keep what I build instead of letting it live in a folder.',
  ],
  facts: [
    ['Degree', 'BSc.CSIT'],
    ['University', 'Tribhuvan University'],
    ['Graduated', '2023'],
    ['Based in', 'Kathmandu, Nepal'],
    ['Focus', '.NET MVC · React · frontend'],
  ],
};

export const skills = [
  { group: 'FRONTEND', items: ['HTML', 'CSS', 'JavaScript', 'Bootstrap', 'React'], blurb: 'Layout systems, responsive structure and component thinking.' },
  { group: 'BACKEND', items: ['C#', '.NET MVC', 'PHP', 'Laravel'], blurb: 'MVC architecture, routing and auth in .NET MVC. PHP and Laravel through self-study.' },
  { group: 'DATABASE', items: ['SQL Server', 'MySQL'], blurb: 'Relational schema design and entity relationships — SQL Server for the quiz API, MySQL for the delivery schema.' },
  { group: 'TOOLS', items: ['GitHub'], blurb: 'Version control and project history.' },
  { group: 'CREATIVE', items: ['Adobe Premiere Pro', 'Adobe Lightroom'], blurb: 'Video editing and photo post-production on the side.' },
];

export const projects = [
  {
    id: 'gre-quiz',
    index: 'W.01',
    title: 'GRE MCQ Quiz App',
    short: 'GRE QUIZ · IN PROGRESS',
    stack: ['React', '.NET MVC', 'C#', 'SQL Server'],
    tagline: 'In production and still in progress — a React front end over a .NET MVC API.',
    status: 'wip',
    statusNote: 'In production — still in progress, not finished yet.',
    points: [
      'User registration and login implemented from scratch.',
      'Quiz attempts with every result stored in SQL Server.',
      'Admin panel for managing quizzes and questions.',
      'Performance review so users can study their own results.',
    ],
    role: 'Built independently — architecture, backend and interface.',
    artifact: 'terminal',
  },
  {
    id: 'food-delivery',
    index: 'W.02',
    title: 'Food Delivery App',
    short: 'FOOD DELIVERY SCHEMA',
    stack: ['.NET MVC', 'C#', 'MySQL'],
    tagline: 'Schema-first: the database designed before anything else.',
    points: [
      'Complete relational schema modelled before the application layer.',
      'Entity relationships for orders and user profiles.',
      'Menu categorization structure ready to scale.',
    ],
    role: 'Database architecture and relationship design.',
    artifact: 'schema',
  },
  {
    id: 'responsive-set',
    index: 'W.03',
    title: 'Responsive Frontend Websites',
    short: 'GYM + BOOK CLUB SITES',
    stack: ['HTML', 'CSS', 'JavaScript', 'Bootstrap'],
    tagline: 'A gym site and a book club site, built component-first.',
    points: [
      'Responsive layouts optimized for mobile.',
      'Clean UI with modular, reusable components.',
      'Cross-browser compatibility testing.',
    ],
    role: 'Design and development of both sites.',
    artifact: 'sites',
  },
];

export const experience = {
  role: 'Frontend Developer Intern',
  org: 'Digital Yeti Pvt. Ltd.',
  duration: '6 months',
  points: [
    'Enhanced website designs using Bootstrap, HTML and CSS.',
    'Integrated DataTables into client interfaces.',
    'Built interactive data visualization with Chart.js.',
    'Developed clean UI components.',
    'Improved cross-browser compatibility.',
    'The pull toward the backend started here — the .NET MVC work since grew directly out of it.',
  ],
};

export const achievement = {
  title: 'OSM Hackfest 2023',
  role: 'Team Leader',
  points: [
    'Led team coordination through the hackathon build.',
    'Worked on problem solving under time pressure.',
    'Implemented real-world APIs and features.',
  ],
};
