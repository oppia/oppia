import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'oppia-badge-progression',
  templateUrl: './badge-progression.component.html',
  styleUrls: ['./badge-progression.component.css']
})
export class BadgeProgressionComponent implements OnInit {
  @Input() badges: any[] = [];

  constructor() {}

  ngOnInit(): void {}

  shareBadge(badge: any): void {
    const text = `I just unlocked ${badge.name} on Oppia!`;
    const url = 'https://www.oppia.org';
    const twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitter, '_blank');
  }

  getBadgeClass(level: string): string {
    return `oppia-badge-${level}`;
  }
}
