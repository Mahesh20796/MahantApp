import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  // 🔴 IMPORTANT: Replace these with your actual Supabase Project URL and Anon Key
  private supabaseUrl = 'https://bnntozilollusgewlabn.supabase.co';
  private supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubnRvemlsb2xsdXNnZXdsYWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyOTM1ODQsImV4cCI6MjA5MDg2OTU4NH0.9BBU_pbfyrsn5DarnpPNqI5v3ZCm3tInY9oYL6B7WnI';

  constructor() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
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
