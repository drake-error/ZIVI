import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b84f09d0`;

export const api = {
  // Auth
  async signup(email: string, password: string, name: string) {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email, password, name }),
    });
    return response.json();
  },

  // Medicines
  async getMedicines(accessToken: string) {
    const response = await fetch(`${API_BASE}/medicines`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.json();
  },

  async addMedicine(accessToken: string, medicine: any) {
    const response = await fetch(`${API_BASE}/medicines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(medicine),
    });
    return response.json();
  },

  async deleteMedicine(accessToken: string, id: string) {
    const response = await fetch(`${API_BASE}/medicines/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.json();
  },

  // Reports
  async getReports(accessToken: string) {
    const response = await fetch(`${API_BASE}/reports`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.json();
  },

  async addReport(accessToken: string, report: any) {
    const response = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(report),
    });
    return response.json();
  },

  async deleteReport(accessToken: string, id: string) {
    const response = await fetch(`${API_BASE}/reports/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.json();
  },

  // Reminders
  async getReminders(accessToken: string) {
    const response = await fetch(`${API_BASE}/reminders`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.json();
  },

  async addReminder(accessToken: string, reminder: any) {
    const response = await fetch(`${API_BASE}/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(reminder),
    });
    return response.json();
  },

  async toggleReminder(accessToken: string, id: string) {
    const response = await fetch(`${API_BASE}/reminders/${id}/toggle`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.json();
  },

  async deleteReminder(accessToken: string, id: string) {
    const response = await fetch(`${API_BASE}/reminders/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.json();
  },

  // Emergency Contacts & Medical Info
  async getEmergencyContacts(accessToken: string) {
    const response = await fetch(`${API_BASE}/emergency-contacts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.json();
  },

  async updateEmergencyContacts(accessToken: string, contacts: any[]) {
    const response = await fetch(`${API_BASE}/emergency-contacts`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ contacts }),
    });
    return response.json();
  },

  async getMedicalInfo(accessToken: string) {
    const response = await fetch(`${API_BASE}/medical-info`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.json();
  },

  async updateMedicalInfo(accessToken: string, medicalInfo: any) {
    const response = await fetch(`${API_BASE}/medical-info`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(medicalInfo),
    });
    return response.json();
  },

  // Blood Donation
  async getBloodRequests() {
    const response = await fetch(`${API_BASE}/blood-requests`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    return response.json();
  },

  async createBloodRequest(accessToken: string, request: any) {
    const response = await fetch(`${API_BASE}/blood-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    });
    return response.json();
  },

  // Emergency Fund
  async getFundRequests() {
    const response = await fetch(`${API_BASE}/fund-requests`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    return response.json();
  },

  async createFundRequest(accessToken: string, request: any) {
    const response = await fetch(`${API_BASE}/fund-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    });
    return response.json();
  },
};
