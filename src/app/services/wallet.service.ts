import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction, FinancialReport } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:5001/api/wallet'; 

  getTransactions(memberId?: string): Observable<Transaction[]> {
    const url = memberId ? `${this.apiUrl}/transactions?memberId=${memberId}` : `${this.apiUrl}/transactions`;
    return this.http.get<Transaction[]>(url);
  }

  addFunds(memberId: string, amount: number, description: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/add`, { memberId, amount, description });
  }

  recordExpense(amount: number, description: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/expense`, { amount, description });
  }

  getFinancialReport(): Observable<FinancialReport> {
    return this.http.get<FinancialReport>(`${this.apiUrl}/report`);
  }
}
