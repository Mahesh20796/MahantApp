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
    const { data, error } = await this.supabase
      .from('members')
      .insert([member])
      .select();
    if (error) throw error;
    return data;
  }

  // ------------------------------------
  // SABHAS METHODS
  // ------------------------------------
  async getSabhas() {
    const { data, error } = await this.supabase
      .from('sabhas')
      .select('*');
    if (error) throw error;
    return data || [];
  }

  // ------------------------------------
  // ATTENDANCE METHODS
  // ------------------------------------
  async saveAttendance(attendanceRecords: any[]) {
    // Upsert acts as "Insert, or Update if it already exists"
    // We explicitly tell it to check for conflicts on the member, sabha, and date combination
    const { data, error } = await this.supabase
      .from('attendance')
      .upsert(attendanceRecords, { onConflict: 'member_id,sabha_id,attendance_date' })
      .select();
    if (error) throw error;
    return data;
  }

  // ------------------------------------
  // ROLES METHODS
  // ------------------------------------
  async getRoles() {
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
