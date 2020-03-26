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
 * @fileoverview Unit tests for Answer Groups Cache Service.
 */

/* eslint-disable max-len */
import { AnswerGroupsCacheService } from
  'pages/exploration-editor-page/editor-tab/services/answer-groups-cache.service';
/* eslint-enable max-len */

describe('Answer Groups Cache Service', () => {
  describe('AnswerGroupsCache', () => {
    var answerGroup = {
      rule_specs: [],
      outcome: {
        dest: 'default',
        feedback: {
          content_id: 'feedback_1',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null
      }
    };

    var agcs: AnswerGroupsCacheService = null;
    beforeEach(() => {
      agcs = new AnswerGroupsCacheService();
    });

    it('sets a value in the cache', () => {
      agcs.set('InteractionId', answerGroup);
      expect(agcs.contains('InteractionId')).toBe(true);
    });

    it('returns null when value isnt available in the cache', () => {
      expect(agcs.get('NonPresentInteractionId')).toEqual(null);
    });

    it('gets a value from the cache', () => {
      agcs.set('InteractionId', answerGroup);
      expect(agcs.get('InteractionId')).toEqual(answerGroup);
    });

    it('successfully checks if the value is available in cache', () => {
      agcs.set('InteractionId', answerGroup);
      expect(agcs.contains('InteractionId')).toBe(true);
      expect(agcs.contains('NonPresentInteractionId')).toBe(false);
      expect(agcs.contains('')).toBe(false);
      expect(agcs.contains('1')).toBe(false);
    });

    it('resets the cache', () => {
      agcs.set('InteractionId', answerGroup);
      expect(agcs.contains('InteractionId')).toBe(true);
      agcs.reset();
      expect(agcs.contains('InteractionId')).toBe(false);
    });
  });
});
