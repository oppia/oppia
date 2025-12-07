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
 * @fileoverview Component for displaying a list/grid of badge cards.
 */

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { LearnerBadgeService, Badge, UserBadge, BadgeListResponse, UserBadgesResponse } from 'services/learner-badge.service';

@Component({
  selector: 'oppia-badge-list',
  templateUrl: './badge-list.component.html',
  styleUrls: ['./badge-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeListComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput: ElementRef | undefined;

  // View settings
  viewMode: 'grid' | 'list' = 'grid';
  badgeSize: 'small' | 'medium' | 'large' = 'medium';

  // Filters
  selectedCategory = '';
  selectedRarity = '';
  selectedType = '';
  selectedTier = '';
  searchQuery = '';

  // Data
  badges: Badge[] = [];
  userBadges: UserBadge[] = [];
  userBadgeIds = new Set<string>();

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 1;

  // Loading states
  isLoading = false;
  isLoadingMore = false;
  hasError = false;
  errorMessage = '';

  // Filter options
  categories = [
    'LEARNING', 'PROGRAMMING', 'MATHEMATICS', 'SCIENCE',
    'LANGUAGES', 'ARTS', 'MOTIVATION', 'COMMUNITY', 'CREATIVITY'
  ];
  rarities = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
  types = [
    'STREAK', 'COURSE_COMPLETION', 'LESSON_COMPLETION',
    'QUIZ_PERFORMANCE', 'MASTERY', 'SOCIAL', 'CREATOR', 'CHALLENGE', 'MILESTONE'
  ];
  tiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

  // Streams
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(private badgeService: LearnerBadgeService) {
    // Setup search debouncing
    this.searchSubject$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.searchQuery = query;
        this.currentPage = 1;
        this.loadBadges();
      });
  }

  ngOnInit(): void {
    this.loadUserBadges();
    this.loadBadges();

    // Subscribe to badge events
    this.badgeService.badgeEarned$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadUserBadges();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load badges based on current filters.
   */
  loadBadges(): void {
    this.isLoading = true;
    this.hasError = false;

    const options: any = {
      page: this.currentPage,
      page_size: this.pageSize
    };

    if (this.selectedCategory) options.category = this.selectedCategory;
    if (this.selectedRarity) options.rarity = this.selectedRarity;
    if (this.selectedType) options.badge_type = this.selectedType;
    if (this.selectedTier) options.tier = this.selectedTier;
    if (this.searchQuery) options.search = this.searchQuery;

    this.badgeService.getAllBadges(options).subscribe(
      (response: BadgeListResponse) => {
        this.badges = response.badges;
        this.totalCount = response.pagination.total;
        this.totalPages = response.pagination.total_pages;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading badges:', error);
        this.hasError = true;
        this.errorMessage = 'Failed to load badges. Please try again.';
        this.isLoading = false;
      }
    );
  }

  /**
   * Load user's earned badges.
   */
  loadUserBadges(): void {
    this.badgeService.getUserBadges().subscribe(
      (response: UserBadgesResponse) => {
        this.userBadges = response.user_badges;
        this.userBadgeIds = new Set(response.user_badges.map(ub => ub.badge_id));
      },
      (error) => {
        console.error('Error loading user badges:', error);
      }
    );
  }

  /**
   * Reset all filters.
   */
  resetFilters(): void {
    this.selectedCategory = '';
    this.selectedRarity = '';
    this.selectedType = '';
    this.selectedTier = '';
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadBadges();
  }

  /**
   * Handle search input.
   */
  onSearchChange(query: string): void {
    this.searchSubject$.next(query);
  }

  /**
   * Clear search.
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.searchSubject$.next('');
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
  }

  /**
   * Change view mode.
   */
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  /**
   * Change badge size.
   */
  setBadgeSize(size: 'small' | 'medium' | 'large'): void {
    this.badgeSize = size;
  }

  /**
   * Go to specific page.
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadBadges();
      window.scrollTo(0, 0);
    }
  }

  /**
   * Handle filter change.
   */
  onFilterChange(): void {
    this.currentPage = 1;
    this.loadBadges();
  }

  /**
   * Check if a badge is earned by the user.
   */
  isEarned(badgeId: string): boolean {
    return this.userBadgeIds.has(badgeId);
  }

  /**
   * Get user badge data.
   */
  getUserBadge(badgeId: string): UserBadge | undefined {
    return this.userBadges.find(ub => ub.badge_id === badgeId);
  }

  /**
   * Calculate progress percentage for a badge.
   */
  getProgressPercentage(badge: Badge): number {
    if (!badge.criteria) return 0;
    const userBadge = this.getUserBadge(badge.badge_id);
    if (!userBadge) return 0;
    const progress = userBadge.progress_data?.current_progress || 0;
    return Math.min(100, Math.round((progress / badge.criteria.threshold) * 100));
  }

  /**
   * Handle badge click.
   */
  onBadgeClicked(badge: Badge): void {
    // Open details modal or navigate
    console.log('Badge clicked:', badge);
  }

  /**
   * Handle badge share.
   */
  onBadgeShared(badge: Badge): void {
    // Update share count in UI
    console.log('Badge shared:', badge);
  }

  /**
   * Handle badge favorite toggle.
   */
  onBadgeFavorited(event: { badgeId: string; favorite: boolean }): void {
    // Update favorite status in UI
    const badge = this.badges.find(b => b.badge_id === event.badgeId);
    if (badge) {
      const userBadge = this.getUserBadge(event.badgeId);
      if (userBadge) {
        userBadge.is_favorite = event.favorite;
      }
    }
  }

  /**
   * Get pagination page numbers.
   */
  getPageNumbers(): number[] {
    const maxPages = Math.min(5, this.totalPages);
    const startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    const endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  /**
   * Retry loading badges after error.
   */
  retryLoadBadges(): void {
    this.hasError = false;
    this.loadBadges();
  }

  /**
   * Get progress statistics by category.
   */
  getCategoryProgress(): { category: string; earned: number; total: number }[] {
    const progress: { [key: string]: { earned: number; total: number } } = {};

    // Initialize categories
    this.categories.forEach(cat => {
      progress[cat] = { earned: 0, total: 0 };
    });

    // Count badges by category
    this.badges.forEach(badge => {
      if (progress[badge.category]) {
        progress[badge.category].total++;
        if (this.isEarned(badge.badge_id)) {
          progress[badge.category].earned++;
        }
      }
    });

    return this.categories
      .filter(cat => progress[cat].total > 0)
      .map(cat => ({
        category: cat,
        earned: progress[cat].earned,
        total: progress[cat].total
      }));
  }

  /**
   * Get total earned badges count.
   */
  getTotalEarned(): number {
    return this.userBadges.length;
  }

  /**
   * Get overall progress percentage.
   */
  getOverallProgress(): number {
    if (this.totalCount === 0) return 0;
    return Math.round((this.getTotalEarned() / this.totalCount) * 100);
  }
}
