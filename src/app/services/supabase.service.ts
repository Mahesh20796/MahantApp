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
    { id: '1', name: 'Bhavin Patel', contact_details: '9876543210', role: 'Admin', status: 'Active', address: 'BAPS Mandir, Bharuch', sabha_name: 'Yuva Sabha' },
    { id: '2', name: 'Smit Patel', contact_details: '9123456780', role: 'Volunteer', status: 'Active', address: 'BAPS Mandir, Bharuch', sabha_name: 'Yuva Sabha' }
  ];

  private mockSabhas = [
    { id: 'S1', title: 'Yuva Sabha', sabha_type: 'Yuva', time_schedule: '08:00 PM', sabha_date: '2026-04-09' },
    { id: 'S2', title: 'Bal Sabha', sabha_type: 'Bal', time_schedule: '05:30 PM', sabha_date: '2026-04-09' }
  ];

  private mockAttendance: any[] = []; // In-memory persistence for testing in mock mode

  private async checkConnection() {
    try {
      const { data, error } = await this.supabase.from('sabhas').select('id').limit(1);
      if (error) {
         console.warn('⚠️ Supabase Connection Check Result:', error.message);
         // If table doesn't exist, we still want to try to use Supabase if credentials are valid
         if (error.code === 'PGRST116' || error.message.includes('not found')) {
            console.log('ℹ️ Table "sabhas" not found, but DB is reachable.');
            this.isMockMode = false;
            return;
         }
         throw error;
      }
      console.log('✅ Supabase Connection: Active (Live Data)');
      this.isMockMode = false;
    } catch (e: any) {
      console.error('❌ Supabase Unreachable:', e.message || e);
      console.warn('⚠️ Switching to Mock Data Mode for local development.');
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
      return { data: [newMember], error: null };
    }
    return await this.supabase.from('members').insert([member]).select();
  }

  async updateMember(id: string, member: any) {
    if (this.isMockMode) {
      const index = this.mockMembers.findIndex(m => m.id === id);
      if (index !== -1) {
        this.mockMembers[index] = { ...this.mockMembers[index], ...member };
      }
      return { data: null, error: null };
    }
    return await this.supabase.from('members').update(member).eq('id', id);
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
      // Basic mock persistence logic
      attendanceRecords.forEach(newItem => {
        const index = this.mockAttendance.findIndex(a => 
          a.member_id === newItem.member_id && 
          a.sabha_id === newItem.sabha_id && 
          a.attendance_date === newItem.attendance_date
        );
        if (index !== -1) {
          this.mockAttendance[index] = { ...this.mockAttendance[index], ...newItem };
        } else {
          this.mockAttendance.push(newItem);
        }
      });
      return attendanceRecords;
    }
    // Upsert acts as "Insert, or Update if it already exists"
    const { data, error } = await this.supabase
      .from('attendance')
      .upsert(attendanceRecords, { onConflict: 'member_id,sabha_id,attendance_date' })
      .select();
    if (error) {
      console.error('Supabase Upsert Error:', error);
      throw error;
    }
    return data;
  }

  async getAttendanceForSabha(sabhaId: string, date: string) {
    if (this.isMockMode) {
      return this.mockAttendance.filter(a => a.sabha_id === sabhaId && a.attendance_date === date);
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
    if (this.isMockMode) {
      const newRole = { ...role, id: 'R' + (this.mockMembers.length + 1) };
      // No local storage for roles in mock mode for now, just return
      return { data: [newRole], error: null };
    }
    return await this.supabase.from('roles').insert([role]).select();
  }

  async updateRole(id: string, role: any) {
    if (this.isMockMode) {
      return { data: null, error: null };
    }
    return await this.supabase.from('roles').update(role).eq('id', id);
  }

  // ------------------------------------
  // ORGANIZATIONS METHODS
  // ------------------------------------
  async getOrganizations() {
    if (this.isMockMode) {
      return [
        { id: 'O1', name: 'Annual Festival', activity_date: '2026-04-09' },
        { id: 'O2', name: 'Parsad', activity_date: '2026-04-10' }
      ];
    }
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
    return data || [];
  }

  async addOrganization(org: any) {
    if (this.isMockMode) {
      const newOrg = { ...org, id: 'O' + Date.now() };
      return { data: [newOrg], error: null };
    }
    return await this.supabase.from('organizations').insert([org]).select();
  }

  // ------------------------------------
  // WALLET & TRANSACTIONS METHODS
  // ------------------------------------
  async getWalletTransactions() {
    if (this.isMockMode) {
      return [
        { id: 'T1', date: new Date(), description: 'Monthly Subscription', reference: 'Bhavin Patel', category: 'Monthly Collection', amount: 100, type: 'deposit', status: 'COMPLETED' },
        { id: 'T2', date: new Date(), description: 'Admin Withdrawal', reference: 'General Expense', category: 'Maintenance', amount: 500, type: 'withdrawal', status: 'COMPLETED' }
      ];
    }
    const { data, error } = await this.supabase
      .from('wallet_transactions')
      .select(`
        *,
        members (name),
        organizations (name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(t => ({
      ...t,
      date: t.created_at,
      reference: t.members?.name || t.organizations?.name || t.reference || 'N/A'
    }));
  }

  async addTransaction(transaction: any) {
    if (this.isMockMode) {
      console.log('📝 Mock: Adding transaction', transaction);
      return { error: null };
    }

    const { data, error } = await this.supabase
      .from('wallet_transactions')
      .insert([transaction])
      .select();

    if (error) throw error;

    if (transaction.member_id) {
      const amountChange = transaction.type === 'deposit' ? transaction.amount : -transaction.amount;
      await this.updateMemberBalance(transaction.member_id, amountChange);
    }

    return data;
  }

  async deleteTransaction(id: string) {
    if (this.isMockMode) {
      console.log('📝 Mock: Deleting transaction', id);
      return { error: null };
    }

    // 1. Get the transaction first to see if it has a member_id
    const { data: transaction, error: fetchError } = await this.supabase
      .from('wallet_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Delete the transaction
    const { error: deleteError } = await this.supabase
      .from('wallet_transactions')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // 3. Reverse the balance update if member_id exists
    if (transaction && transaction.member_id) {
       const reverseAmount = transaction.type === 'deposit' ? -transaction.amount : transaction.amount;
       await this.updateMemberBalance(transaction.member_id, reverseAmount);
    }

    return { error: null };
  }

  async updateMemberBalance(memberId: string, amountChange: number) {
    if (this.isMockMode) {
      const member = this.mockMembers.find(m => m.id === memberId);
      if (member) {
        (member as any).wallet_balance = ((member as any).wallet_balance || 0) + amountChange;
      }
      return;
    }

    const { data: member, error: fetchError } = await this.supabase
      .from('members')
      .select('wallet_balance')
      .eq('id', memberId)
      .single();

    if (fetchError) throw fetchError;

    const newBalance = (member.wallet_balance || 0) + amountChange;

    const { error: updateError } = await this.supabase
      .from('members')
      .update({ wallet_balance: newBalance })
      .eq('id', memberId);

    if (updateError) throw updateError;
  }

  async processMonthlyCollection(amount: number = 100, memberIds?: string[]) {
    if (this.isMockMode) {
      console.log(`📝 Mock: Collecting ₹${amount} from selected members`);
      const targetIds = memberIds || this.mockMembers.map(m => m.id);
      this.mockMembers.filter(m => targetIds.includes(m.id)).forEach(m => {
        (m as any).wallet_balance = ((m as any).wallet_balance || 0) + amount;
      });
      return { success: true, count: targetIds.length };
    }

    const members = await this.getMembers();
    const activeMembers = members.filter(m => m.status === 'Active' && (!memberIds || memberIds.includes(m.id)));
    
    if (activeMembers.length === 0) return { success: true, count: 0 };

    const transactions = activeMembers.map(m => ({
      member_id: m.id,
      amount: amount,
      type: 'deposit',
      category: 'MONTHLY_COLLECTION',
      description: `Monthly Collection - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      status: 'COMPLETED'
    }));

    const { error: txError } = await this.supabase
      .from('wallet_transactions')
      .insert(transactions);
    
    if (txError) throw txError;

    for (const member of activeMembers) {
      await this.updateMemberBalance(member.id, amount);
    }

    return { success: true, count: transactions.length };
  }

  async getOrganizationStats() {
    if (this.isMockMode) {
      return {
        totalBalance: 125000,
        pendingCollections: 12450,
        memberCount: this.mockMembers.length
      };
    }

    // 1. Get transactions to calculate actual balance
    const { data: transactions, error: tError } = await this.supabase
      .from('wallet_transactions')
      .select('amount, type');
    
    if (tError) throw tError;

    const totalBalance = (transactions || []).reduce((sum, t) => {
      return t.type === 'deposit' ? sum + Number(t.amount) : sum - Number(t.amount);
    }, 0);

    // 2. Get member count
    const { count, error: cError } = await this.supabase
      .from('members')
      .select('*', { count: 'exact', head: true });

    if (cError) throw cError;
    
    return {
      totalBalance,
      pendingCollections: 0,
      memberCount: count || 0
    };
  }

  // ------------------------------------
  // REPORTING METHODS
  // ------------------------------------
  async getAttendanceSummaryReport(startDate: string, endDate: string, memberId?: string) {
    if (this.isMockMode) {
      return { P: 150, A: 20, L: 10 };
    }
    let query = this.supabase
      .from('attendance')
      .select('status')
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate);
      
    if (memberId) {
      query = query.eq('member_id', memberId);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).reduce((acc: any, curr: any) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, { P: 0, A: 0, L: 0 });
  }

  async getTopEarlyBirds(limit: number = 3, startDate?: string, endDate?: string) {
    if (this.isMockMode) {
      return this.mockMembers.slice(0, limit).map((m, i) => ({ ...m, name: m.name, count: 12 - i }));
    }

    let query = this.supabase
      .from('attendance')
      .select(`
        status,
        time_marked,
        members(id, name),
        sabhas(time_schedule)
      `)
      .eq('status', 'P');

    if (startDate) query = query.gte('attendance_date', startDate);
    if (endDate) query = query.lte('attendance_date', endDate);

    const { data, error } = await query;
    if (error) throw error;

    const results = (data || []).reduce((acc: any, curr: any) => {
        const mid = curr.members?.id;
        if (!mid) return acc;
        if (!acc[mid]) acc[mid] = { name: curr.members.name, count: 0 };
        acc[mid].count++;
        return acc;
    }, {});

    return Object.values(results)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, limit);
  }

  // ------------------------------------
  // DASHBOARD TRENDS METHODS
  // ------------------------------------
  async getWeeklyAttendanceTrends(limit: number = 7) {
    if (this.isMockMode) {
      return [
        { date: '2026-04-01', count: 145 },
        { date: '2026-04-08', count: 152 },
        { date: '2026-04-15', count: 148 },
        { date: '2026-04-22', count: 160 }
      ];
    }

    // Get the last N distinct dates from attendance
    const { data, error } = await this.supabase
      .from('attendance')
      .select('attendance_date, status')
      .eq('status', 'P')
      .order('attendance_date', { ascending: false });

    if (error) throw error;

    const trends = (data || []).reduce((acc: any, curr: any) => {
      const date = curr.attendance_date;
      if (!acc[date]) acc[date] = 0;
      acc[date]++;
      return acc;
    }, {});

    return Object.entries(trends)
      .map(([date, count]) => ({ date, count: count as number }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-limit);
  }

  async getFinancialTrends(limit: number = 6) {
    if (this.isMockMode) {
      return [
        { month: 'Nov', balance: 90000 },
        { month: 'Dec', balance: 95000 },
        { month: 'Jan', balance: 105000 },
        { month: 'Feb', balance: 110000 },
        { month: 'Mar', balance: 120000 },
        { month: 'Apr', balance: 125000 }
      ];
    }

    const { data, error } = await this.supabase
      .from('wallet_transactions')
      .select('amount, type, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;

    let runningBalance = 0;
    const monthlyData: any = {};

    (data || []).forEach(t => {
      const date = new Date(t.created_at);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      runningBalance += (t.type === 'deposit' ? Number(t.amount) : -Number(t.amount));
      monthlyData[monthKey] = runningBalance;
    });

    return Object.entries(monthlyData)
      .map(([month, balance]) => ({ month, balance: balance as number }))
      .slice(-limit);
  }

  async getLastSabhaStats() {
    if (this.isMockMode) {
      return {
        title: 'Yuva Sabha',
        date: '2026-04-22',
        present: 160,
        absent: 15,
        leave: 5,
        total: 180
      };
    }

    // 1. Get the latest attendance date
    const { data: latest, error: lError } = await this.supabase
      .from('attendance')
      .select('attendance_date, sabha_id')
      .order('attendance_date', { ascending: false })
      .limit(1)
      .single();

    if (lError || !latest) return null;

    // 2. Get counts for that date
    const { data: records, error: rError } = await this.supabase
      .from('attendance')
      .select('status')
      .eq('attendance_date', latest.attendance_date);

    if (rError) throw rError;

    // 3. Get Sabha title
    const { data: sabha } = await this.supabase
      .from('sabhas')
      .select('title')
      .eq('id', latest.sabha_id)
      .single();

    const counts = records.reduce((acc: any, curr: any) => {
      acc[curr.status === 'P' ? 'present' : (curr.status === 'A' ? 'absent' : 'leave')]++;
      return acc;
    }, { present: 0, absent: 0, leave: 0 });

    return {
      title: sabha?.title || 'Last Sabha',
      date: latest.attendance_date,
      ...counts,
      total: records.length
    };
  }

  async getActivityDistribution() {
    if (this.isMockMode) {
      return [
        { name: 'Parsad', count: 5, amount: 500 },
        { name: 'cricket tunamant', count: 12, amount: 1200 },
        { name: 'Yuva Sabha', count: 45, amount: 4500 }
      ];
    }

    // 1. Get all organizations/activities
    const orgs = await this.getOrganizations();

    if (!orgs) return [];

    // 2. Get all transactions
    const { data: transactions } = await this.supabase
      .from('wallet_transactions')
      .select('description, amount, type, member_id, organization_id');

    if (!transactions) return [];

    const distribution = orgs.map(org => {
      const orgTag = `[${org.name}]`;
      const relatedTx = transactions.filter(t => 
        (t.organization_id === org.id) ||
        (t.member_id === org.id) || 
        (t.description && t.description.includes(orgTag))
      );

      const uniqueMembers = new Set(relatedTx.filter(t => t.member_id && t.member_id !== org.id).map(t => t.member_id));
      const totalAmount = relatedTx.filter(t => t.type === 'deposit').reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        name: org.name,
        count: uniqueMembers.size,
        amount: totalAmount
      };
    }).filter(d => d.count > 0 || d.amount > 0);

    return distribution;
  }
}
