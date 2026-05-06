export interface AutomationTask {
  id: string;
  type: 'reminder' | 'data_process' | 'system_check' | 'data_backup';
  description: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  details?: any;
}

class AutomationService {
  private storageKey = 'jarvis_automation_v1';

  getTasks(): AutomationTask[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  addTask(task: Omit<AutomationTask, 'id' | 'status' | 'timestamp'>): AutomationTask {
    const tasks = this.getTasks();
    const newTask: AutomationTask = {
      ...task,
      id: Math.random().toString(36).substring(2, 9),
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    tasks.push(newTask);
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
    return newTask;
  }

  completeTask(id: string) {
    const tasks = this.getTasks().map(t => 
      t.id === id ? { ...t, status: 'completed' as const } : t
    );
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
  }

  deleteTask(id: string) {
    const tasks = this.getTasks().filter(t => t.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
  }

  // Predefined data processing
  processData(input: string): string {
    // Simple mock: count words, characters, or extract emails
    const words = input.trim().split(/\s+/).length;
    const chars = input.length;
    return `Data Processed: ${words} words, ${chars} characters detected. Analysis complete.`;
  }

  // New automation logic: System Check
  runSystemCheck(): string {
    const diagnostics = [
      "ARC Reactor Core: Stable (84.2%)",
      "Neural Mesh Interface: Low Latency",
      "Peripheral Arrays: Active",
      "Local Storage Integrity: Verified",
      "AI Core Temperature: Nominal (42°C)"
    ];
    return `Full System Diagnostic Complete: \n- ${diagnostics.join('\n- ')}`;
  }

  // New automation logic: Data Backup
  runDataBackup(fileCount: number): string {
    const backupId = `BU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    return `Data Backup Initialized. ID: ${backupId}. Buffered ${fileCount} files to secondary virtual vault. Integrity check passed.`;
  }
}

export const automationService = new AutomationService();
