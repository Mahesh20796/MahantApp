import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Attendance } from '../models/attendance.model';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:5001/api/attendance'; 

  getAttendanceHistory(sabhaId?: string): Observable<Attendance[]> {
    const url = sabhaId ? `${this.apiUrl}?sabhaId=${sabhaId}` : this.apiUrl;
    return this.http.get<Attendance[]>(url);
  }

  markAttendance(attendance: Attendance[]): Observable<void> {
    return this.http.post<void>(this.apiUrl, attendance);
  }
}
