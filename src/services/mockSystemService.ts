export interface VirtualFile {
  name: string;
  content: string;
  type: 'text' | 'code' | 'log';
  createdAt: string;
}

class MockSystemService {
  private storageKey = 'jarvis_fs_v1';

  getFiles(): VirtualFile[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [
      { name: 'README.md', content: '# JARVIS AI\n\nSetup Guide:\n1. Open in Browser\n2. Allow Microphone access\n3. Speak commands or type in Terminal.\n\nOffline Mode: Voice interaction works offline. Local files persist in your browser.', type: 'text', createdAt: new Date().toISOString() },
      { name: 'requirements.txt', content: 'react\nmotion\nlucide-react\n@google/genai\ntailwindcss', type: 'text', createdAt: new Date().toISOString() },
      { name: 'system_log.txt', content: 'All systems operational. ARC Reactor at 84%.', type: 'log', createdAt: new Date().toISOString() }
    ];
  }

  saveFile(file: VirtualFile) {
    const files = this.getFiles();
    const index = files.findIndex(f => f.name === file.name);
    if (index >= 0) {
      files[index] = file;
    } else {
      files.push(file);
    }
    localStorage.setItem(this.storageKey, JSON.stringify(files));
  }

  deleteFile(name: string) {
    const files = this.getFiles().filter(f => f.name !== name);
    localStorage.setItem(this.storageKey, JSON.stringify(files));
  }

  getSystemMetrics() {
    return {
      cpu: Math.floor(Math.random() * 15) + 5,
      memory: Math.floor(Math.random() * 20) + 40,
      arcReactor: 84 + (Math.sin(Date.now() / 1000) * 2),
      uptime: Math.floor(performance.now() / 1000)
    };
  }
}

export const mockSystemService = new MockSystemService();
