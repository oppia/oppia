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
 * @fileoverview Component for displaying individual badge cards.
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LearnerBadgeService, Badge, UserBadge } from 'services/learner-badge.service';

@Component({
  selector: 'oppia-badge-card',
  templateUrl: './badge-card.component.html',
  styleUrls: ['./badge-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeCardComponent implements OnInit {
  @Input() badge!: Badge;
  @Input() userBadge: UserBadge | undefined;
  @Input() showProgress = true;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() interactive = true;
  @Input() progressPercentage = 0;

  @Output() badgeClicked = new EventEmitter<Badge>();
  @Output() badgeShared = new EventEmitter<Badge>();
  @Output() badgeFavorited = new EventEmitter<{ badgeId: string; favorite: boolean }>();

  @ViewChild('badgeCard') badgeCardRef: ElementRef | undefined;

  isHovered = false;
  isFavorite = false;
  isSharing = false;
  showNotification = false;
  notificationMessage = '';

  constructor(
    private badgeService: LearnerBadgeService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    if (this.userBadge) {
      this.isFavorite = this.userBadge.is_favorite;
    }
  }

  /**
   * Get sanitized SVG icon.
   */
  get iconSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.badge.icon_svg);
  }

  /**
   * Get rarity color.
   */
  get rarityColor(): string {
    return this.badgeService.getRarityColor(this.badge.rarity);
  }

  /**
   * Get badge styling class.
   */
  get badgeClass(): string {
    const classes = [
      `badge-card-${this.size}`,
      this.badgeService.getRarityClass(this.badge.rarity),
      this.badgeService.getTierClass(this.badge.tier)
    ];

    if (this.userBadge) {
      classes.push('badge-earned');
    } else {
      classes.push('badge-locked');
    }

    if (this.isFavorite) {
      classes.push('badge-favorite');
    }

    return classes.join(' ');
  }

  /**
   * Get badge gradient styling.
   */
  get badgeStyle(): { [key: string]: string } {
    const rarityStyle = this.badgeService.getRarityStyle(this.badge.rarity);
    return {
      background: rarityStyle.gradient,
      boxShadow: rarityStyle.glow ? `0 0 20px ${this.rarityColor}` : 'none'
    };
  }

  /**
   * Handle badge click.
   */
  onBadgeClick(): void {
    if (this.interactive) {
      this.badgeClicked.emit(this.badge);
    }
  }

  /**
   * Handle favorite toggle.
   */
  toggleFavorite(event: Event): void {
    event.stopPropagation();
    if (!this.userBadge) {
      this.showNotificationMessage('Cannot favorite a locked badge');
      return;
    }

    this.isFavorite = !this.isFavorite;
    this.badgeService.toggleFavoriteBadge(this.badge.badge_id, this.isFavorite).subscribe(
      (response) => {
        this.badgeFavorited.emit({
          badgeId: this.badge.badge_id,
          favorite: this.isFavorite
        });
        this.showNotificationMessage(
          this.isFavorite ? 'Added to favorites' : 'Removed from favorites'
        );
      },
      (error) => {
        this.isFavorite = !this.isFavorite; // Revert on error
        this.showNotificationMessage('Failed to update favorite status');
        console.error('Error toggling favorite:', error);
      }
    );
  }

  /**
   * Handle share action.
   */
  async shareBadge(event: Event): Promise<void> {
    event.stopPropagation();
    if (!this.userBadge) {
      this.showNotificationMessage('Cannot share a locked badge');
      return;
    }

    this.isSharing = true;
    const shareText = `I just earned the ${this.badge.name} badge on Oppia! 🎉\n\n${this.badge.description}`;

    try {
      // Try native share first
      if (navigator.share) {
        await this.badgeService.shareViaNativeShare(this.badge);
      } else {
        // Fallback to clipboard
        await this.badgeService.copyBadgeToClipboard(this.badge, shareText);
        this.showNotificationMessage('Badge copied to clipboard!');
      }
      this.badgeShared.emit(this.badge);
    } catch (error) {
      console.error('Error sharing badge:', error);
      this.showNotificationMessage('Failed to share badge');
    } finally {
      this.isSharing = false;
    }
  }

  /**
   * Show temporary notification message.
   */
  private showNotificationMessage(message: string): void {
    this.notificationMessage = message;
    this.showNotification = true;
    setTimeout(() => {
      this.showNotification = false;
    }, 2000);
  }

  /**
   * Get progress text.
   */
  get progressText(): string {
    if (!this.showProgress || !this.badge.criteria) {
      return '';
    }
    return `${this.progressPercentage}%`;
  }

  /**
   * Check if badge is earned.
   */
  get isEarned(): boolean {
    return !!this.userBadge;
  }

  /**
   * Get tooltip text.
   */
  get tooltipText(): string {
    if (this.isEarned && this.userBadge) {
      return `Earned on ${new Date(this.userBadge.awarded_date).toLocaleDateString()}`;
    }
    return `Earn ${this.badge.criteria?.threshold || '?'} ${this.badge.criteria?.condition_type || 'points'}`;
  }
}
