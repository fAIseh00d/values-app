export interface ValueCard {
  id: string;
  name: string;
  description: string;
}

export const values: ValueCard[] = [
  {
    id: "acceptance",
    name: "ACCEPTANCE",
    description: "To be open and accepting of myself, others, and life events",
  },
  {
    id: "adventure",
    name: "ADVENTURE",
    description: "To actively seek, create, or explore novel experiences",
  },
  {
    id: "aesthetics",
    name: "AESTHETICS",
    description: "To appreciate, create, nurture, and enjoy the arts",
  },
  {
    id: "assertiveness",
    name: "ASSERTIVENESS",
    description: "To stand up for my rights and proactively and respectfully request what I want",
  },
  {
    id: "authenticity",
    name: "AUTHENTICITY",
    description: "To act in ways that are consistent with my beliefs/desires despite external pressures",
  },
  {
    id: "caring",
    name: "CARING",
    description: "To be caring toward myself, others, and the environment",
  },
  {
    id: "challenge",
    name: "CHALLENGE",
    description: "To take on difficult tasks and encourage myself to grow, learn, and improve",
  },
  {
    id: "community",
    name: "COMMUNITY",
    description: "To take part in social or citizen groups and be part of something bigger than myself",
  },
  {
    id: "contribution",
    name: "CONTRIBUTION",
    description: "To help, assist, or make lasting positive differences to others or myself",
  },
  {
    id: "courage",
    name: "COURAGE",
    description: "To be brave and to persist in the face of fear, threat, or difficulty",
  },
  {
    id: "curiosity",
    name: "CURIOSITY",
    description: "To be open-minded and interested in discovering and learning new things",
  },
  {
    id: "diligence",
    name: "DILIGENCE",
    description: "To be thorough and conscientious in what I do",
  },
  {
    id: "faithfulness",
    name: "FAITHFULNESS",
    description: "To be loyal and true in my relationships with people and/or a higher power",
  },
  {
    id: "health",
    name: "HEALTH",
    description: "To maintain or improve the fitness and condition of my body and mind",
  },
  {
    id: "honesty",
    name: "HONESTY",
    description: "To be truthful and sincere with others and to have integrity in my actions",
  },
  {
    id: "humor",
    name: "HUMOR",
    description: "To see and appreciate the humorous side of life",
  },
  {
    id: "humility",
    name: "HUMILITY",
    description: "To be humble, modest, and unassuming",
  },
  {
    id: "independence",
    name: "INDEPENDENCE",
    description: "To be self-supportive, autonomous, and to choose my own way of doing things",
  },
  {
    id: "intimacy",
    name: "INTIMACY",
    description: "To open up and share myself emotionally and physically in my relationships",
  },
  {
    id: "justice",
    name: "JUSTICE",
    description: "To uphold fairness and righteousness for all",
  },
  {
    id: "knowledge",
    name: "KNOWLEDGE",
    description: "To learn, use, share, and contribute valuable knowledge",
  },
  {
    id: "leisure",
    name: "LEISURE",
    description: "To take time to pursue and enjoy various aspects of life",
  },
  {
    id: "mastery",
    name: "MASTERY",
    description: "To be competent in my everyday activities and pursuits",
  },
  {
    id: "order",
    name: "ORDER",
    description: "To live a life that is planned and organized",
  },
  {
    id: "persistence",
    name: "PERSISTENCE",
    description: "To continue resolutely despite difficulties and challenges",
  },
  {
    id: "power",
    name: "POWER",
    description: "To strongly influence or wield authority over others and projects",
  },
  {
    id: "respect",
    name: "RESPECT",
    description: "To treat others considerately and to be tolerant of those who differ from me",
  },
  {
    id: "self-control",
    name: "SELF-CONTROL",
    description: "To exercise discipline over my behaviors for a higher good",
  },
  {
    id: "self-esteem",
    name: "SELF-ESTEEM",
    description: "To feel good about my identity and to believe in my own worth",
  },
  {
    id: "spirituality",
    name: "SPIRITUALITY",
    description: "To grow and mature in the understanding of higher power(s)",
  },
  {
    id: "trust",
    name: "TRUST",
    description: "To be loyal, sincere, and reliable",
  },
  {
    id: "virtue",
    name: "VIRTUE",
    description: "To live a morally pure and honorable life",
  },
  {
    id: "wealth",
    name: "WEALTH",
    description: "To accumulate and possess financial prosperity",
  },
];

// Utility function to shuffle array (Fisher-Yates)
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Initialize three columns with 11 cards each
export function initializeColumns(): {
  mostImportant: string[];
  moderatelyImportant: string[];
  leastImportant: string[];
} {
  const shuffled = shuffleArray(values.map(v => v.id));
  
  return {
    mostImportant: shuffled.slice(0, 11),
    moderatelyImportant: shuffled.slice(11, 22),
    leastImportant: shuffled.slice(22, 33),
  };
}
