export interface Attendance {
  id: string;
  sabhaId: string;
  memberId: string;
  status: 'Present' | 'Absent' | 'Leave';
  date: Date;
}
