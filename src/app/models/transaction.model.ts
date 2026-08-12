export interface Transaction {
  id: string;
  memberId: string;
  amount: number;
  type: 'Credit' | 'Debit';
  description: string;
  date: Date;
}

export interface FinancialReport {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  transactions: Transaction[];
}
