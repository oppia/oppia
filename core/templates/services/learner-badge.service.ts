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
 * @fileoverview Service for badge-related API calls and utilities.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { map, shareReplay, catchError, tap } from 'rxjs/operators';

export interface BadgeCriteria {
  condition_type: string;
  threshold: number;
  current_progress: number;
  prerequisites: string[];
  cooldown_seconds: number;
}

export interface Badge {
  badge_id: string;
  name: string;
  description: string;
  icon_svg: string;
  rarity: string;
  badge_type: string;
  tier: string;
  criteria: BadgeCriteria;
  category: string;
  xp_reward: number;
  points: number;
  evolution_chain: string[];
  collection_id?: string;
  total_awards: number;
  created_on?: string;
  last_updated?: string;
}

export interface UserBadge {
  user_badge_id: string;
  user_id: string;
  badge_id: string;
  awarded_date: string;
  times_earned: number;
  progress_data: Record<string, any>;
  share_count: number;
  is_favorite: boolean;
}

export interface BadgeListResponse {
  badges: Badge[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface UserBadgesResponse {
  user_badges: UserBadge[];
  badge_details: Badge[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface UserStatistics {
  total_badges: number;
  total_xp: number;
  total_points: number;
  by_rarity: Record<string, number>;
  by_tier: Record<string, number>;
  favorite_count: number;
}

export interface LeaderboardEntry {
  rank: number;
  badge_id: string;
  name: string;
  total_awards: number;
  total_shares: number;
  total_favorites: number;
  engagement_score: number;
}

@Injectable({
  providedIn: 'root'
})
export class LearnerBadgeService {
  // Cache for all badges
  private badgesCache$ = new BehaviorSubject<Badge[]>([]);
  private userBadgesCache$ = new BehaviorSubject<UserBadge[]>([]);

  // Subjects for real-time updates
  badgeEarned$ = new Subject<Badge>();
  badgeShared$ = new Subject<UserBadge>();
  badgeFavorited$ = new Subject<UserBadge>();

  // Rarity and tier color mappings
  readonly rarityColors: Record<string, string> = {
    'Common': '#757575',
    'Rare': '#2196F3',
    'Epic': '#9C27B0',
    'Legendary': '#FF9800',
    'Mythic': '#E91E63'
  };

  readonly tierColors: Record<string, string> = {
    'Bronze': '#CD7F32',
    'Silver': '#C0C0C0',
    'Gold': '#FFD700',
    'Platinum': '#E5E4E2',
    'Diamond': '#B9F2FF'
  };

  readonly rarityStyles: Record<string, { gradient: string; glow: boolean }> = {
    'Common': { gradient: 'linear-gradient(135deg, #757575, #9E9E9E)', glow: false },
    'Rare': { gradient: 'linear-gradient(135deg, #2196F3, #1976D2)', glow: true },
    'Epic': { gradient: 'linear-gradient(135deg, #9C27B0, #7B1FA2)', glow: true },
    'Legendary': { gradient: 'linear-gradient(135deg, #FF9800, #F57C00)', glow: true },
    'Mythic': { gradient: 'linear-gradient(135deg, #E91E63, #AD1457)', glow: true }
  };

  constructor(private http: HttpClient) { }

  /**
   * Get all badges with optional filtering and pagination.
   * @param options Filter and pagination options
   * @returns Observable of badge list response
   */
  getAllBadges(options: {
    category?: string;
    rarity?: string;
    badge_type?: string;
    tier?: string;
    search?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    page_size?: number;
  } = {}): Observable<BadgeListResponse> {
    let params = new HttpParams();

    if (options.category) params = params.set('category', options.category);
    if (options.rarity) params = params.set('rarity', options.rarity);
    if (options.badge_type) params = params.set('badge_type', options.badge_type);
    if (options.tier) params = params.set('tier', options.tier);
    if (options.search) params = params.set('search', options.search);
    if (options.sort_by) params = params.set('sort_by', options.sort_by);
    if (options.sort_order) params = params.set('sort_order', options.sort_order);

    const page = options.page || 1;
    const pageSize = options.page_size || 20;
    params = params.set('page', page.toString());
    params = params.set('page_size', pageSize.toString());

    return this.http.get<BadgeListResponse>('/badgehandler/list', { params }).pipe(
      tap(response => {
        // Cache the badges
        if (response && response.badges) {
          this.badgesCache$.next(response.badges);
        }
      }),
      shareReplay(1)
    );
  }

  /**
   * Get badge details by ID.
   * @param badgeId The badge ID
   * @returns Observable of badge details
   */
  getBadgeDetail(badgeId: string): Observable<{ badge: Badge }> {
    return this.http.get<{ badge: Badge }>(`/badgehandler/${badgeId}`);
  }

  /**
   * Get badges by category.
   * @param category The category to filter by
   * @returns Observable of badges in the category
   */
  getBadgesByCategory(category: string): Observable<BadgeListResponse> {
    return this.getAllBadges({ category });
  }

  /**
   * Get badges by rarity.
   * @param rarity The rarity level
   * @returns Observable of badges with the rarity
   */
  getBadgesByRarity(rarity: string): Observable<BadgeListResponse> {
    return this.getAllBadges({ rarity });
  }

  /**
   * Search badges by keyword.
   * @param keyword The search keyword
   * @returns Observable of matching badges
   */
  searchBadges(keyword: string): Observable<BadgeListResponse> {
    return this.getAllBadges({ search: keyword });
  }

  /**
   * Get all badges earned by the current user.
   * @param options Filtering and pagination options
   * @returns Observable of user badges response
   */
  getUserBadges(options: {
    only_favorites?: boolean;
    category?: string;
    page?: number;
    page_size?: number;
  } = {}): Observable<UserBadgesResponse> {
    let params = new HttpParams();

    if (options.only_favorites) params = params.set('only_favorites', 'true');
    if (options.category) params = params.set('category', options.category);

    const page = options.page || 1;
    const pageSize = options.page_size || 20;
    params = params.set('page', page.toString());
    params = params.set('page_size', pageSize.toString());

    return this.http.get<UserBadgesResponse>('/badgehandler/userbadges', { params }).pipe(
      tap(response => {
        if (response && response.user_badges) {
          this.userBadgesCache$.next(response.user_badges);
        }
      }),
      shareReplay(1)
    );
  }

  /**
   * Get user's favorite badges.
   * @param page Page number for pagination
   * @param pageSize Number of results per page
   * @returns Observable of user's favorite badges
   */
  getUserFavoriteBadges(page: number = 1, pageSize: number = 20): Observable<UserBadgesResponse> {
    return this.getUserBadges({ only_favorites: true, page, page_size: pageSize });
  }

  /**
   * Get badge progress for current user.
   * @param badgeId Optional specific badge ID
   * @returns Observable of progress data
   */
  getBadgeProgress(badgeId?: string): Observable<{
    statistics: UserStatistics;
    badge_progress?: {
      badge_id: string;
      current_progress: number;
      threshold: number;
      progress_percentage: number;
      progress_data: Record<string, any>;
    };
  }> {
    let params = new HttpParams();
    if (badgeId) params = params.set('badge_id', badgeId);

    return this.http.get<any>('/badgehandler/progress', { params });
  }

  /**
   * Toggle favorite status of a badge.
   * @param badgeId The badge ID
   * @param isFavorite Whether to mark as favorite
   * @returns Observable of updated user badge
   */
  toggleFavoriteBadge(badgeId: string, isFavorite: boolean): Observable<{
    status: string;
    user_badge: UserBadge;
  }> {
    return this.http.post<any>(
      `/badgehandler/favorite/${badgeId}`,
      { is_favorite: isFavorite }
    ).pipe(
      tap(response => {
        if (response && response.user_badge) {
          this.badgeFavorited$.next(response.user_badge);
        }
      })
    );
  }

  /**
   * Share a badge.
   * @param badgeId The badge ID
   * @returns Observable of updated share count
   */
  shareBadge(badgeId: string): Observable<{
    status: string;
    share_count: number;
  }> {
    return this.http.post<any>(
      `/badgehandler/share/${badgeId}`,
      {}
    ).pipe(
      tap(response => {
        this.badgeShared$.next(response);
      })
    );
  }

  /**
   * Share badge via Web Share API if available.
   * @param badge The badge to share
   * @returns Promise that resolves when sharing is complete
   */
  async shareViaNativeShare(badge: Badge): Promise<void> {
    if (!navigator.share) {
      console.warn('Web Share API not available');
      return;
    }

    try {
      await navigator.share({
        title: `I earned the ${badge.name} badge!`,
        text: badge.description,
        url: window.location.href
      });
      // Track the share
      this.shareBadge(badge.badge_id).subscribe();
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing badge:', error);
      }
    }
  }

  /**
   * Copy badge to clipboard.
   * @param badge The badge to copy
   * @param text The text to copy
   */
  async copyBadgeToClipboard(badge: Badge, text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      // Track the share
      this.shareBadge(badge.badge_id).subscribe();
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }

  /**
   * Update badge progress.
   * @param badgeId The badge ID
   * @param currentProgress Current progress value
   * @param progressData Additional progress data
   * @param eventType Type of event for auto-awarding
   * @returns Observable of update result
   */
  updateProgress(
    badgeId: string,
    currentProgress: number,
    progressData: Record<string, any> = {},
    eventType: string = ''
  ): Observable<{
    status: string;
    awarded_badges: string[];
  }> {
    return this.http.post<any>(
      '/badgehandler/progress',
      {
        badge_id: badgeId,
        current_progress: currentProgress,
        progress_data: progressData,
        event_type: eventType
      }
    ).pipe(
      tap(response => {
        if (response && response.awarded_badges && response.awarded_badges.length > 0) {
          // Could trigger notification here
          response.awarded_badges.forEach((badgeId: string) => {
            console.log(`Badge earned: ${badgeId}`);
          });
        }
      })
    );
  }

  /**
   * Get badge leaderboard.
   * @param limit Number of badges to return
   * @returns Observable of leaderboard data
   */
  getLeaderboard(limit: number = 20): Observable<{ leaderboard: LeaderboardEntry[] }> {
    let params = new HttpParams().set('limit', limit.toString());
    return this.http.get<{ leaderboard: LeaderboardEntry[] }>('/badgehandler/leaderboard', { params });
  }

  /**
   * Get rarity color for styling.
   * @param rarity The rarity level
   * @returns Color hex string
   */
  getRarityColor(rarity: string): string {
    return this.rarityColors[rarity] || this.rarityColors['Common'];
  }

  /**
   * Get tier color for styling.
   * @param tier The tier level
   * @returns Color hex string
   */
  getTierColor(tier: string): string {
    return this.tierColors[tier] || this.tierColors['Bronze'];
  }

  /**
   * Get rarity styling object.
   * @param rarity The rarity level
   * @returns Styling object with gradient and glow properties
   */
  getRarityStyle(rarity: string): { gradient: string; glow: boolean } {
    return this.rarityStyles[rarity] || this.rarityStyles['Common'];
  }

  /**
   * Get badge rarity badge class.
   * @param rarity The rarity level
   * @returns CSS class name
   */
  getRarityClass(rarity: string): string {
    return `rarity-${rarity.toLowerCase()}`;
  }

  /**
   * Get badge tier badge class.
   * @param tier The tier level
   * @returns CSS class name
   */
  getTierClass(tier: string): string {
    return `tier-${tier.toLowerCase()}`;
  }

  /**
   * Clear all caches.
   */
  clearCache(): void {
    this.badgesCache$.next([]);
    this.userBadgesCache$.next([]);
  }
}