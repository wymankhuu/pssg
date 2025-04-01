export interface GradeLevel {
  id: string;
  label: string;
  icon: string;
}

export const gradeLevels: GradeLevel[] = [
  {
    id: 'k',
    label: 'Kindergarten',
    icon: 'filter_none' /* Using filter_none as a 'K' icon */
  },
  {
    id: '1',
    label: 'Grade 1',
    icon: 'filter_1'
  },
  {
    id: '2',
    label: 'Grade 2',
    icon: 'filter_2'
  },
  {
    id: '3',
    label: 'Grade 3',
    icon: 'filter_3'
  },
  {
    id: '4',
    label: 'Grade 4',
    icon: 'filter_4'
  },
  {
    id: '5',
    label: 'Grade 5',
    icon: 'filter_5'
  },
  {
    id: '6',
    label: 'Grade 6',
    icon: 'filter_6'
  },
  {
    id: '7',
    label: 'Grade 7',
    icon: 'filter_7'
  },
  {
    id: '8',
    label: 'Grade 8',
    icon: 'filter_8'
  }
];

export function getGradeLevelById(id: string): GradeLevel | undefined {
  return gradeLevels.find(grade => grade.id === id);
}
