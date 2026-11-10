/* ============================================================
   CONTENT LAYER — edit this file to update the portfolio.
   No HTML changes needed. Replace every "TODO" with your info.
   ============================================================ */
window.PORTFOLIO = {
  config: {
    // URL of the contact API. Leave "" to fall back to a mailto: link.
    // Local:  "http://localhost:3000/api/contact"
    // Hosted: "https://your-api.onrender.com/api/contact"
    apiUrl: ""
  },

  profile: {
    name: "Tim",
    headline: "BSIT Student · Web & Mobile Application Developer",
    intro: "I design and build responsive web apps and mobile-friendly systems, from clean interfaces to the APIs and databases behind them.",
    photo: "assets/profile.jpg"
  },

  about: {
    text: "I'm a Bachelor of Science in Information Technology student who enjoys turning ideas into working systems. I'm focused on web and mobile application development and I like thinking about the whole system: architecture, user experience, and maintainability. TODO: add 1–2 sentences about your goals and interests.",
    facts: [
      { label: "Location", value: "Laguna, Philippines" },
      { label: "Course", value: "BS Information Technology" },
      { label: "Focus", value: "Web & Mobile Development" },
      { label: "Languages", value: "English, Filipino" }
    ]
  },

  skills: {
    technical: [
      { name: "HTML & CSS", level: 85 },
      { name: "JavaScript", level: 75 },
      { name: "Python / Flask", level: 65 },
      { name: "SQL / Databases", level: 65 },
      { name: "Git & GitHub", level: 70 },
      { name: "Mobile (TODO: Flutter / React Native)", level: 50 }
    ],
    soft: ["Problem Solving", "Teamwork", "Communication", "Time Management", "Adaptability", "Attention to Detail"]
  },

  projects: [
    {
      title: "Phone Repair Shop Management & Booking System",
      category: "Web",
      description: "Web platform for repair shops with customer booking, technician job tracking, and owner management. Multi-actor design with a 5-layer architecture and Basic/Pro plans.",
      tech: ["JavaScript", "Python", "Flask", "SQL"],
      demo: "", repo: ""
    },
    {
      title: "Jobfy",
      category: "Web",
      description: "Local skilled-worker marketplace that connects customers with nearby tradespeople. Capstone project concept.",
      tech: ["Web", "Database"],
      demo: "", repo: ""
    },
    {
      title: "LabaGo",
      category: "Mobile",
      description: "Laundry pickup and delivery platform designed for dorm students. Capstone project concept.",
      tech: ["Mobile", "API"],
      demo: "", repo: ""
    }
    // TODO: add more projects. Add links like repo: "https://github.com/you/project"
  ],

  education: [
    { school: "TODO: Your University", degree: "Bachelor of Science in Information Technology", period: "TODO: 2023 – Present", details: "Major coursework: Web Development, Database Systems, Systems Analysis & Design." },
    { school: "TODO: Your Senior High School", degree: "TODO: Strand", period: "TODO: 2021 – 2023", details: "TODO: honors or activities." }
  ],

  achievements: [
    {
      title: "Cybersecurity Webinar Participant",
      issuer: "BlackStride Cyber",
      date: "May 8, 2026",
      image: "assets/badge.png"
    },
    {
      title: "Certificate of Attendance — BlackStride Cyber Webinar",
      issuer: "BlackStride Cyber",
      date: "May 8, 2026",
      image: "assets/participation cert.png"
    }
  ],

  contact: [
    { label: "Email", value: "timothytapado@gmail.com", href: "mailto:timothytapado@gmail.com" },
    { label: "GitHub", value: "github.com/TODO-username", href: "https://github.com/TODO-username" },
    { label: "LinkedIn", value: "TODO", href: "" }
  ]
};
