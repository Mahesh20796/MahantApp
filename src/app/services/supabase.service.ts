import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.checkConnection();
  }

  public isMockMode = false; // Primary mode is live database

  private mockMembers = [
    { id: '1', name: 'Bhavin Patel (Mock)', contact_details: '9876543210', role: 'Admin', status: 'Active', address: 'BAPS Mandir, Bharuch', sabha_name: 'Yuva Sabha (Mock)' },
    { id: '2', name: 'Smit Patel (Mock)', contact_details: '9123456780', role: 'Volunteer', status: 'Active', address: 'BAPS Mandir, Bharuch', sabha_name: 'Yuva Sabha (Mock)' }
  ];

  private mockSabhas = [
    { id: 'S1', title: 'Yuva Sabha (Mock)', sabha_type: 'Yuva', time_schedule: '08:00 PM', sabha_date: '2026-04-09' },
    { id: 'S2', title: 'Bal Sabha (Mock)', sabha_type: 'Bal', time_schedule: '05:30 PM', sabha_date: '2026-04-09' }
  ];

  private async checkConnection() {
    try {
      const { error } = await this.supabase.from('sabhas').select('id').limit(1);
      if (error) throw error;
      console.log('✅ Supabase Connection: Active');
      this.isMockMode = false;
    } catch (e) {
      console.warn('⚠️ Supabase Unreachable. Switching to Mock Data Mode for local development.');
      this.isMockMode = true;
    }
  }

  // ------------------------------------
  // GENERAL DATABASE GETTER
  // ------------------------------------
  get client(): SupabaseClient {
    return this.supabase;
  }

  // ------------------------------------
  // MEMBERS METHODS
  // ------------------------------------
  async getMembers() {
    if (this.isMockMode) {
      return [...this.mockMembers];
    }
    const { data, error } = await this.supabase
      .from('members')
      .select('*');
    if (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
    return data || [];
  }

  async addMember(member: any) {
    if (this.isMockMode) {
      const newMember = { ...member, id: (this.mockMembers.length + 1).toString() };
      this.mockMembers.push(newMember);
      console.log('📝 Mock: Added member locally', newMember);
      return [newMember];
    }
    const { data, error } = await this.supabase
      .from('members')
      .insert([member])
      .select();
    if (error) throw error;
    return data;
  }

  async getSabhas() {
    if (this.isMockMode) {
      return [...this.mockSabhas];
    }
    const { data, error } = await this.supabase
      .from('sabhas')
      .select('*');
    if (error) throw error;
    return data || [];
  }

  async saveSabha(sabha: any, id?: string) {
    if (this.isMockMode) {
      if (id) {
        const index = this.mockSabhas.findIndex(s => s.id === id);
        if (index !== -1) {
          this.mockSabhas[index] = { ...this.mockSabhas[index], ...sabha };
        }
      } else {
        const newSabha = { ...sabha, id: 'S' + (this.mockSabhas.length + 1) };
        this.mockSabhas.push(newSabha);
      }
      return { error: null };
    }
    
    if (id) {
      return await this.supabase.from('sabhas').update(sabha).eq('id', id);
    } else {
      return await this.supabase.from('sabhas').insert([sabha]);
    }
  }

  async deleteSabha(id: string) {
    if (this.isMockMode) {
      this.mockSabhas = this.mockSabhas.filter(s => s.id !== id);
      return { error: null };
    }
    return await this.supabase.from('sabhas').delete().eq('id', id);
  }

  // ------------------------------------
  // ATTENDANCE METHODS
  // ------------------------------------
  async saveAttendance(attendanceRecords: any[]) {
    if (this.isMockMode) {
      console.log('📝 Mock: Saving attendance records', attendanceRecords);
      return attendanceRecords;
    }
    // Upsert acts as "Insert, or Update if it already exists"
    const { data, error } = await this.supabase
      .from('attendance')
      .upsert(attendanceRecords, { onConflict: 'member_id,sabha_id,attendance_date' })
      .select();
    if (error) throw error;
    return data;
  }

  async getAttendanceForSabha(sabhaId: string, date: string) {
    if (this.isMockMode) {
      return []; // Start fresh in mock mode
    }
    const { data, error } = await this.supabase
      .from('attendance')
      .select('*')
      .eq('sabha_id', sabhaId)
      .eq('attendance_date', date);
    if (error) throw error;
    return data || [];
  }

  // ------------------------------------
  // ROLES METHODS
  // ------------------------------------
  async getRoles() {
    if (this.isMockMode) {
      return [
        { id: 'R1', name: 'Admin', description: 'System Admin' },
        { id: 'R2', name: 'Volunteer', description: 'Regular Helper' }
      ];
    }
    const { data, error } = await this.supabase
      .from('roles')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async addRole(role: any) {
    const { data, error } = await this.supabase
      .from('roles')
      .insert([role])
      .select();
    if (error) throw error;
    return data;
  }
}
