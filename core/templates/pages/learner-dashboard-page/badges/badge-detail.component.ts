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
 * @fileoverview Component for displaying detailed badge information.
 */

import {
  Component,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LearnerBadgeService, Badge } from 'services/learner-badge.service';

@Component({
  selector: 'oppia-badge-detail',
  templateUrl: './badge-detail.component.html',
  styleUrls: ['./badge-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeDetailComponent implements OnInit {
  badge: Badge | null = null;
  isLoading: boolean = true;
  hasError: boolean = false;
  isFavorite: boolean = false;
  shareMessage: string = '';

  constructor(
    private badgeService: LearnerBadgeService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const badgeId = params['badgeId'];
      if (badgeId) {
        this.loadBadgeDetails(badgeId);
      }
    });
  }

  loadBadgeDetails(badgeId: string): void {
    this.isLoading = true;
    this.hasError = false;

    this.badgeService.getBadgeDetail(badgeId).subscribe(
      (response: any) => {
        this.badge = response.badge;
        this.shareMessage = `I earned the ${response.badge.name} badge on Oppia!`;
        this.isLoading = false;
        this.checkIfFavorite(badgeId);
      },
      (error) => {
        console.error('Error loading badge details:', error);
        this.hasError = true;
        this.isLoading = false;
      }
    );
  }

  checkIfFavorite(badgeId: string): void {
    this.badgeService.getUserBadges().subscribe(
      (response: any) => {
        const userBadge = response.user_badges.find(
          (ub: any) => ub.badge_id === badgeId
        );
        this.isFavorite = userBadge?.is_favorite || false;
      },
      (error) => {
        console.error('Error checking favorite status:', error);
      }
    );
  }

  toggleFavorite(): void {
    if (!this.badge) return;

    this.badgeService.toggleFavoriteBadge(this.badge.badge_id, !this.isFavorite).subscribe(
      () => {
        this.isFavorite = !this.isFavorite;
      },
      (error) => {
        console.error('Error toggling favorite:', error);
      }
    );
  }

  shareBadge(): void {
    if (!this.badge) return;

    this.badgeService.shareBadge(this.badge.badge_id).subscribe(
      () => {
        alert('Badge shared successfully!');
      },
      (error) => {
        console.error('Error sharing badge:', error);
      }
    );
  }

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.shareMessage).then(() => {
      alert('Copied to clipboard!');
    });
  }

  goBack(): void {
    this.router.navigate(['/learner-dashboard/badges']);
  }
}
