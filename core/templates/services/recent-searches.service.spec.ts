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
 * @fileoverview Unit tests for RecentSearchesService.
 */

import { TestBed } from '@angular/core/testing';
import { LocalStorageService } from 'services/local-storage.service';
import { RecentSearchesService } from 'services/recent-searches.service';

describe('RecentSearchesService', () => {
  let recentSearchesService: RecentSearchesService;
  let localStorageService: LocalStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RecentSearchesService, LocalStorageService]
    });
    recentSearchesService = TestBed.inject(RecentSearchesService);
    localStorageService = TestBed.inject(LocalStorageService);
    
    // Clear recent searches from localStorage before each test
    if (localStorageService.isStorageAvailable()) {
      localStorage.removeItem('recent_searches');
    }
  });

  it('should be created', () => {
    expect(recentSearchesService).toBeTruthy();
  });

  it('should save search query correctly', () => {
    recentSearchesService.saveSearchQuery('addition');
    expect(recentSearchesService.getRecentSearches()).toEqual(['addition']);
  });

  it('should not save empty or whitespace-only queries', () => {
    recentSearchesService.saveSearchQuery('');
    recentSearchesService.saveSearchQuery('   ');
    expect(recentSearchesService.getRecentSearches()).toEqual([]);
  });

  it('should move existing query to the top', () => {
    recentSearchesService.saveSearchQuery('addition');
    recentSearchesService.saveSearchQuery('subtraction');
    recentSearchesService.saveSearchQuery('addition');
    
    expect(recentSearchesService.getRecentSearches()).toEqual(['addition', 'subtraction']);
  });

  it('should handle case-insensitive duplicates', () => {
    recentSearchesService.saveSearchQuery('Addition');
    recentSearchesService.saveSearchQuery('subtraction');
    recentSearchesService.saveSearchQuery('addition');
    
    // The implementation currently saves the exact query string that was passed last.
    expect(recentSearchesService.getRecentSearches()).toEqual(['addition', 'subtraction']);
  });

  it('should limit stored searches to 10 entries', () => {
    for (let i = 1; i <= 12; i++) {
      recentSearchesService.saveSearchQuery(`query ${i}`);
    }
    
    const recentSearches = recentSearchesService.getRecentSearches();
    expect(recentSearches.length).toBe(10);
    expect(recentSearches[0]).toBe('query 12');
    expect(recentSearches[9]).toBe('query 3');
  });

  it('should clear recent searches correctly', () => {
    recentSearchesService.saveSearchQuery('addition');
    recentSearchesService.clearRecentSearches();
    expect(recentSearchesService.getRecentSearches()).toEqual([]);
  });

  it('should handle corrupted localStorage data', () => {
    if (localStorageService.isStorageAvailable()) {
      localStorage.setItem('recent_searches', 'corrupted data');
    }
    expect(recentSearchesService.getRecentSearches()).toEqual([]);
  });

  it('should handle non-array data in localStorage', () => {
    if (localStorageService.isStorageAvailable()) {
      localStorage.setItem('recent_searches', JSON.stringify({query: 'addition'}));
    }
    expect(recentSearchesService.getRecentSearches()).toEqual([]);
  });

  it('should not save searches if storage is not available', () => {
    spyOn(localStorageService, 'isStorageAvailable').and.returnValue(false);
    recentSearchesService.saveSearchQuery('addition');
    // Since getRecentSearches also checks isStorageAvailable, it should return empty array.
    expect(recentSearchesService.getRecentSearches()).toEqual([]);
  });
});
