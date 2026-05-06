export class VoiceService {
  private recognition: any = null;
  private synthesis = window.speechSynthesis;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  isSupported() {
    return !!this.recognition;
  }

  startListening(onResult: (text: string) => void, onError?: (err: any) => void) {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    if (onError) {
      this.recognition.onerror = onError;
    }

    try {
      this.recognition.start();
    } catch (e) {
      console.warn("Recognition already started or failed", e);
    }
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  speak(text: string, onEnd?: () => void) {
    // Stop any current speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to find a "Jarvis-like" British voice
    const voices = this.synthesis.getVoices();
    const britishVoice = voices.find(v => v.lang.includes('en-GB')) || voices[0];
    if (britishVoice) {
      utterance.voice = britishVoice;
    }

    utterance.pitch = 0.9;
    utterance.rate = 1.0;

    if (onEnd) {
      utterance.onend = onEnd;
    }

    this.synthesis.speak(utterance);
  }
}

export const voiceService = new VoiceService();
