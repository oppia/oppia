// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for improvements service.
 */

import { ImprovementsService } from 'services/ImprovementsService.ts';

describe('ImprovementsService', () => {
  let improvementsService: ImprovementsService;
  beforeEach(() => {
    improvementsService = new ImprovementsService();
  });

  describe('.isStateForcedToResolveOutstandingUnaddressedAnswers', () => {
    it('returns true for states with TextInput interactions', () => {
      var mockState = {interaction: {id: 'TextInput'}};

      expect(
        improvementsService
          .isStateForcedToResolveOutstandingUnaddressedAnswers(mockState)
      ).toBe(true);
    });

    it('returns false for states with FractionInput interactions', () => {
      var mockState = {interaction: {id: 'FractionInput'}};

      expect(
        improvementsService
          .isStateForcedToResolveOutstandingUnaddressedAnswers(mockState)
      ).toBe(false);
    });
  });
});
