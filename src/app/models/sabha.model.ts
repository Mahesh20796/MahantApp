export interface Sabha {
  id: string;
  title: string;
  sabhaType: 'Weekly Sabha' | 'Special Sabha' | 'Annual Sabha';
  sabhaDate: Date;
  timeSchedule: string;
  assignedMembers: string[]; // member IDs
}
