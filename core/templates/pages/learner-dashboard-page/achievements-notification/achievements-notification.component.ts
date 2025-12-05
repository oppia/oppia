import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'oppia-achievements-notification',
  templateUrl: './achievements-notification.component.html',
  styleUrls: ['./achievements-notification.component.css']
})
export class AchievementsNotificationComponent implements OnInit {
  @Input() achievements: any[] = [];
  @Output() notificationViewed = new EventEmitter<void>();

  showNotifications: boolean = true;

  constructor() {}

  ngOnInit(): void {}

  markAllViewed(): void {
    this.showNotifications = false;
    this.notificationViewed.emit();
  }
}
