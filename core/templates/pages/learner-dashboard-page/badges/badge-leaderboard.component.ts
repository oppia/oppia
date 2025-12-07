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
 * @fileoverview Component for displaying badge leaderboard.
 */

import {
  Component,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { LearnerBadgeService, LeaderboardEntry } from 'services/learner-badge.service';

@Component({
  selector: 'oppia-badge-leaderboard',
  templateUrl: './badge-leaderboard.component.html',
  styleUrls: ['./badge-leaderboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeLeaderboardComponent implements OnInit {
  leaderboardEntries: LeaderboardEntry[] = [];
  isLoading: boolean = true;
  hasError: boolean = false;
  sortBy: 'awards' | 'engagement' = 'awards';
  limit: number = 20;

  constructor(private badgeService: LearnerBadgeService) { }

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.isLoading = true;
    this.hasError = false;

    this.badgeService.getLeaderboard(this.limit).subscribe(
      (response: any) => {
        this.leaderboardEntries = this.sortEntries(response.leaderboard || []);
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading leaderboard:', error);
        this.hasError = true;
        this.isLoading = false;
      }
    );
  }

  sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
    return entries.sort((a, b) => {
      if (this.sortBy === 'engagement') {
        return (b.engagement_score || 0) - (a.engagement_score || 0);
      }
      return b.total_awards - a.total_awards;
    });
  }

  changeSortBy(sortOption: 'awards' | 'engagement'): void {
    this.sortBy = sortOption;
    this.leaderboardEntries = this.sortEntries(this.leaderboardEntries);
  }

  getRarityClass(rarity: string): string {
    return `rarity-${rarity}`;
  }

  getMedalEmoji(rank: number): string {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  }
}
