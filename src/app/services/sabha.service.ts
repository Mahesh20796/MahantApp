import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sabha } from '../models/sabha.model';

@Injectable({
  providedIn: 'root'
})
export class SabhaService {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:5001/api/sabhas'; // update based on backend url

  getSabhas(): Observable<Sabha[]> {
    return this.http.get<Sabha[]>(this.apiUrl);
  }

  getSabha(id: string): Observable<Sabha> {
    return this.http.get<Sabha>(`${this.apiUrl}/${id}`);
  }

  createSabha(sabha: Sabha): Observable<Sabha> {
    return this.http.post<Sabha>(this.apiUrl, sabha);
  }

  updateSabha(id: string, sabha: Sabha): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, sabha);
  }

  deleteSabha(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
