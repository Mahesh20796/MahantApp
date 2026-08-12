import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly WA_BASE_URL = 'https://wa.me/';

  constructor() {}

  /**
   * Generates a WhatsApp share link with a pre-filled message
   */
  private generateWALink(phone: string, message: string): string {
    // Clean phone number: remove non-digits, ensure it has country code (India 91 default)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    
    const encodedMsg = encodeURIComponent(message);
    return `${this.WA_BASE_URL}${cleanPhone}?text=${encodedMsg}`;
  }

  /**
   * Opens WhatsApp to send an attendance confirmation
   */
  sendAttendanceConfirmation(memberName: string, phone: string, status: string, sabhaTitle: string) {
    const date = new Date().toLocaleDateString('en-IN');
    const statusText = status === 'P' ? 'PRESENT ✅' : (status === 'L' ? 'ON LEAVE 🏠' : 'ABSENT ❌');
    
    const message = `*Attendance Confirmation* 📝\n\n` +
                    `Jai Swaminarayan!\n` +
                    `Member: *${memberName}*\n` +
                    `Sabha: ${sabhaTitle}\n` +
                    `Date: ${date}\n` +
                    `Status: *${statusText}*\n\n` +
                    `_Thank you for being part of our Sabha._`;

    window.open(this.generateWALink(phone, message), '_blank');
  }

  /**
   * Opens WhatsApp to send a donation/monthly collection receipt
   */
  sendDonationReceipt(memberName: string, phone: string, amount: number, category: string, description: string) {
    const date = new Date().toLocaleDateString('en-IN');
    const txnId = 'TXN' + Math.random().toString(36).substring(7).toUpperCase();

    const message = `*Payment Receipt* 💰\n\n` +
                    `Jai Swaminarayan!\n` +
                    `We have received your payment of *₹${amount}*.\n\n` +
                    `Member: *${memberName}*\n` +
                    `Category: ${category}\n` +
                    `Description: ${description}\n` +
                    `Date: ${date}\n` +
                    `Transaction ID: ${txnId}\n\n` +
                    `_Your contribution is highly appreciated. Radhe Radhe!_`;

    window.open(this.generateWALink(phone, message), '_blank');
  }
}
