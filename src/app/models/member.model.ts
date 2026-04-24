export interface Member {
  id: string; // or number based on backend
  name: string;
  contactDetails: string;
  emailId?: string;
  photo?: string | null;
  address: string;
  role: string;
  sabhaName?: string;
  joiningDate: Date;
  status: 'Active' | 'Inactive';
  walletBalance: number;
  password?: string;
}
