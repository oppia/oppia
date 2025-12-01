import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'oppia-interaction-chatbot-input',
  templateUrl: './ChatbotInput.html',
  styleUrls: ['./ChatbotInput.css']
})
export class ChatbotInputComponent {
  userMessage = '';
  messages: any[] = [];

  constructor(private http: HttpClient) {}

  sendMessage() {
    if (!this.userMessage.trim()) return;

    this.messages.push({ from: 'user', text: this.userMessage });

    const payload = { message: this.userMessage };
    this.userMessage = '';

    this.http.post('/chatbot-api', payload).subscribe((res: any) => {
      this.messages.push({ from: 'bot', text: res.reply });
    });
  }
}
