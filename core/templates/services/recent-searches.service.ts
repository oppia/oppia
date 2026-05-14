// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for managing recent searches in localStorage.
 */

import { Injectable } from '@angular/core';
import { LocalStorageService } from 'services/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class RecentSearchesService {
  private readonly RECENT_SEARCHES_KEY = 'recent_searches';
  private readonly MAX_RECENT_SEARCHES = 10;

  constructor(private localStorageService: LocalStorageService) {}

  /**
   * Saves a search query to localStorage.
   * @param {string} query - The search query to save.
   */
  saveSearchQuery(query: string): void {
    if (!query || query.trim().length === 0) {
      return;
    }

    const trimmedQuery = query.trim();
    let recentSearches = this.getRecentSearches();

    // Case-insensitive duplicate handling: if the same query exists, remove it
    // so we can move it to the top.
    const existingIndex = recentSearches.findIndex(
      (item) => item.toLowerCase() === trimmedQuery.toLowerCase()
    );

    if (existingIndex !== -1) {
      recentSearches.splice(existingIndex, 1);
    }

    recentSearches.unshift(trimmedQuery);

    if (recentSearches.length > this.MAX_RECENT_SEARCHES) {
      recentSearches = recentSearches.slice(0, this.MAX_RECENT_SEARCHES);
    }

    if (this.localStorageService.isStorageAvailable()) {
      localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
    }
  }

  /**
   * Fetches the list of recent searches from localStorage.
   * @returns {string[]} The list of recent searches.
   */
  getRecentSearches(): string[] {
    if (this.localStorageService.isStorageAvailable()) {
      const storedSearches = localStorage.getItem(this.RECENT_SEARCHES_KEY);
      if (storedSearches) {
        try {
          const parsedSearches = JSON.parse(storedSearches);
          if (Array.isArray(parsedSearches)) {
            return parsedSearches.filter(item => typeof item === 'string');
          }
        } catch (e) {
          // Handle corrupted localStorage data by returning an empty list.
          return [];
        }
      }
    }
    return [];
  }

  /**
   * Clears all recent searches from localStorage.
   */
  clearRecentSearches(): void {
    if (this.localStorageService.isStorageAvailable()) {
      localStorage.removeItem(this.RECENT_SEARCHES_KEY);
    }
  }
}
