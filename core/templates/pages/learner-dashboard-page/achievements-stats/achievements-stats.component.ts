import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'oppia-achievements-stats',
  templateUrl: './achievements-stats.component.html',
  styleUrls: ['./achievements-stats.component.css']
})
export class AchievementsStatsComponent implements OnInit {
  @Input() stats: any = null;

  constructor() {}

  ngOnInit(): void {}
}
