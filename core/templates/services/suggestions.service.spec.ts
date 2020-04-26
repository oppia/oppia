// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SuggestionsService.
 */

import { TestBed } from '@angular/core/testing';

import { SuggestionsService } from 'services/suggestions.service';

describe('SuggestionsService', () => {
  beforeEach(() => {
    this.service = TestBed.get(SuggestionsService);
  });

  describe('getThreadIdFromSuggestionBackendDict', () => {
    it('should return the suggestion id of the backend dict', () => {
      expect(this.service.getThreadIdFromSuggestionBackendDict({
        suggestion_id: 'exploration.exp1.abc1'
      })).toEqual('exploration.exp1.abc1');
    });
  });
});
