import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VoiceAssistantService {
  private recognition: any;
  private isListening = false;
  
  public command$ = new Subject<string>();
  public transcript$ = new Subject<string>();
  public listening$ = new Subject<boolean>();

  constructor(private zone: NgZone) {
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = true;

    this.recognition.onstart = () => {
      this.zone.run(() => {
        this.isListening = true;
        this.listening$.next(true);
      });
    };

    this.recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');

      this.zone.run(() => {
        this.transcript$.next(transcript);
        if (event.results[0].isFinal) {
          this.processCommand(transcript.toLowerCase());
        }
      });
    };

    this.recognition.onerror = (event: any) => {
      this.zone.run(() => {
        this.isListening = false;
        this.listening$.next(false);
        console.error('Speech recognition error:', event.error);
      });
    };

    this.recognition.onend = () => {
      this.zone.run(() => {
        this.isListening = false;
        this.listening$.next(false);
      });
    };
  }

  public startListening() {
    if (this.isListening) return;
    try {
      this.recognition.start();
    } catch (e) {
      console.error('Error starting recognition:', e);
    }
  }

  public stopListening() {
    if (!this.isListening) return;
    this.recognition.stop();
  }

  private processCommand(transcript: string) {
    console.log('Processing command:', transcript);
    this.command$.next(transcript);
    
    // Simple voice response logic
    if (transcript.includes('attendance')) {
      this.speak('Navigating to Attendance module');
    } else if (transcript.includes('member')) {
      this.speak('Opening Member Registry');
    } else if (transcript.includes('dashboard')) {
      this.speak('Going back to Dashboard');
    } else if (transcript.includes('hello') || transcript.includes('hey')) {
      this.speak('Hello! How can I help you manage the Sabha today?');
    }
  }

  public speak(text: string) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1;
    utterance.rate = 1;
    synth.speak(utterance);
  }
}
