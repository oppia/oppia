// Copyright 2024 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Component for displaying badge summary on dashboard.
 */

import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { Router } from '@angular/router';
import { LearnerBadgeService, Badge, UserStatistics } from 'services/learner-badge.service';

@Component({
  selector: 'oppia-badge-summary',
  templateUrl: './badge-summary.component.html',
  styleUrls: ['./badge-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeSummaryComponent implements OnInit {
  @Input() compact: boolean = false;

  badgeSummary: UserStatistics | null = null;
  recentBadges: Badge[] = [];
  favoriteBadges: Badge[] = [];
  isLoading: boolean = true;
  hasError: boolean = false;

  constructor(
    private badgeService: LearnerBadgeService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadBadgeStats();
  }

  loadBadgeStats(): void {
    this.isLoading = true;
    this.hasError = false;

    this.badgeService.getBadgeProgress().subscribe(
      (response: any) => {
        this.badgeSummary = response.statistics;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading badge summary:', error);
        this.hasError = true;
        this.isLoading = false;
      }
    );

    this.badgeService.getUserBadges({ page: 1, page_size: 5 }).subscribe(
      (response: any) => {
        this.recentBadges = response.user_badges || [];
      },
      (error) => {
        console.error('Error loading recent badges:', error);
      }
    );

    this.badgeService.getUserFavoriteBadges(1, 3).subscribe(
      (response: any) => {
        this.favoriteBadges = response.user_badges || [];
      },
      (error) => {
        console.error('Error loading favorite badges:', error);
      }
    );
  }

  navigateToBadges(): void {
    this.router.navigate(['/learner-dashboard/badges']);
  }

  getProgressPercentage(): number {
    if (!this.badgeSummary) {
      return 0;
    }
    // Calculate progress based on badges earned vs available badges
    // This is a simple calculation - can be enhanced based on requirements
    return Math.min(100, (this.badgeSummary.total_badges / 10) * 100);
  }

  get progressStyle(): string {
    return `${this.getProgressPercentage()}%`;
  }

  get nextMilestoneCount(): number {
    const current = this.badgeSummary?.total_badges || 0;
    const milestones = [1, 5, 10, 20, 50];
    return milestones.find(m => m > current) || current + 10;
  }
}
