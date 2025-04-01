export interface Standard {
  id: string;
  code: string;
  description: string;
  category: string;
}

export interface StandardCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  standards: Standard[];
}

// This is just a sample for the frontend
// The actual standards data will be loaded from the server
const standardsData: Record<string, StandardCategory[]> = {
  'k': [
    {
      id: 'k-rl',
      title: 'Reading: Literature',
      description: 'Key ideas, craft, and structure',
      icon: 'menu_book',
      color: 'bg-primary-light',
      standards: [
        {
          id: 'k-rl-1',
          code: 'RL.K.1',
          description: 'With prompting and support, ask and answer questions about key details in a text.',
          category: 'k-rl'
        },
        {
          id: 'k-rl-2',
          code: 'RL.K.2',
          description: 'With prompting and support, retell familiar stories, including key details.',
          category: 'k-rl'
        },
        {
          id: 'k-rl-3',
          code: 'RL.K.3',
          description: 'With prompting and support, identify characters, settings, and major events in a story.',
          category: 'k-rl'
        }
      ]
    }
  ],
  '1': [
    {
      id: '1-rl',
      title: 'Reading: Literature',
      description: 'Key ideas, craft, and structure',
      icon: 'menu_book',
      color: 'bg-primary-light',
      standards: [
        {
          id: '1-rl-1',
          code: 'RL.1.1',
          description: 'Ask and answer questions about key details in a text.',
          category: '1-rl'
        },
        {
          id: '1-rl-2',
          code: 'RL.1.2',
          description: 'Retell stories, including key details, and demonstrate understanding of their central message or lesson.',
          category: '1-rl'
        },
        {
          id: '1-rl-3',
          code: 'RL.1.3',
          description: 'Describe characters, settings, and major events in a story, using key details.',
          category: '1-rl'
        }
      ]
    },
    {
      id: '1-ri',
      title: 'Reading: Informational Text',
      description: 'Non-fiction reading standards',
      icon: 'article',
      color: 'bg-secondary',
      standards: [
        {
          id: '1-ri-1',
          code: 'RI.1.1',
          description: 'Ask and answer questions about key details in a text.',
          category: '1-ri'
        },
        {
          id: '1-ri-2',
          code: 'RI.1.2',
          description: 'Identify the main topic and retell key details of a text.',
          category: '1-ri'
        }
      ]
    },
    {
      id: '1-w',
      title: 'Writing',
      description: 'Text types and composition',
      icon: 'format_quote',
      color: 'bg-accent',
      standards: [
        {
          id: '1-w-3',
          code: 'W.1.3',
          description: 'Write narratives in which they recount two or more appropriately sequenced events, include some details regarding what happened, use temporal words to signal event order, and provide some sense of closure.',
          category: '1-w'
        }
      ]
    }
  ]
};

export function getStandardsForGrade(gradeId: string): Promise<StandardCategory[]> {
  // In a real app, this would fetch from the server
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(standardsData[gradeId] || []);
    }, 500);
  });
}
