export const localStorage = {
  medicalProfile: {
    get: (email) => {
      const data = window.localStorage.getItem(`medicalProfile_${email}`);
      return data ? JSON.parse(data) : null;
    },
    save: (email, data) => {
      window.localStorage.setItem(`medicalProfile_${email}`, JSON.stringify(data));
    }
  },
  
  chatHistory: {
    save: (data) => {
      const existing = JSON.parse(window.localStorage.getItem('chatHistory') || '[]');
      existing.push({ ...data, id: Date.now(), timestamp: new Date().toISOString() });
      window.localStorage.setItem('chatHistory', JSON.stringify(existing));
    }
  },
  
  healthMetrics: {
    get: (email) => {
      const data = window.localStorage.getItem(`healthMetrics_${email}`);
      return data ? JSON.parse(data) : [];
    },
    save: (email, data) => {
      window.localStorage.setItem(`healthMetrics_${email}`, JSON.stringify(data));
    }
  },
  
  healthTips: {
    get: (email) => {
      const data = window.localStorage.getItem(`healthTips_${email}`);
      return data ? JSON.parse(data) : [];
    },
    save: (email, data) => {
      window.localStorage.setItem(`healthTips_${email}`, JSON.stringify(data));
    }
  },
  
  medicationReminders: {
    get: (email) => {
      const data = window.localStorage.getItem(`medicationReminders_${email}`);
      return data ? JSON.parse(data) : [];
    },
    save: (email, data) => {
      window.localStorage.setItem(`medicationReminders_${email}`, JSON.stringify(data));
    },
    remove: (email, id) => {
      const data = JSON.parse(window.localStorage.getItem(`medicationReminders_${email}`) || '[]');
      const filtered = data.filter(item => item.id !== id);
      window.localStorage.setItem(`medicationReminders_${email}`, JSON.stringify(filtered));
    }
  },

  MedicationReminder: {
    get: (email) => {
      const data = window.localStorage.getItem(`medicationReminders_${email}`);
      return data ? JSON.parse(data) : [];
    },
    save: (email, data) => {
      window.localStorage.setItem(`medicationReminders_${email}`, JSON.stringify(data));
    },
    remove: (email, id) => {
      const data = JSON.parse(window.localStorage.getItem(`medicationReminders_${email}`) || '[]');
      const filtered = data.filter(item => item.id !== id);
      window.localStorage.setItem(`medicationReminders_${email}`, JSON.stringify(filtered));
    }
  },

  Task: {
    get: (email) => {
      const data = window.localStorage.getItem(`tasks_${email}`);
      return data ? JSON.parse(data) : [];
    },
    save: (email, data) => {
      window.localStorage.setItem(`tasks_${email}`, JSON.stringify(data));
    },
    remove: (email, id) => {
      const data = JSON.parse(window.localStorage.getItem(`tasks_${email}`) || '[]');
      const filtered = data.filter(item => item.id !== id);
      window.localStorage.setItem(`tasks_${email}`, JSON.stringify(filtered));
    }
  },

  Reminder: {
    get: (email) => {
      const data = window.localStorage.getItem(`reminders_${email}`);
      return data ? JSON.parse(data) : [];
    },
    save: (email, data) => {
      window.localStorage.setItem(`reminders_${email}`, JSON.stringify(data));
    },
    remove: (email, id) => {
      const data = JSON.parse(window.localStorage.getItem(`reminders_${email}`) || '[]');
      const filtered = data.filter(item => item.id !== id);
      window.localStorage.setItem(`reminders_${email}`, JSON.stringify(filtered));
    }
  }
};
