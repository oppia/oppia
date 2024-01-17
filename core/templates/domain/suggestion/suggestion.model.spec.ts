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
 * @fileoverview Unit tests for SuggestionDataModel.
 */

import { Suggestion } from 'domain/suggestion/suggestion.model';

describe('Suggestion data model', () => {
  it('should create a new suggestion from a backend dict.', () => {
    let suggestionBackendDict = {
      suggestion_id: 'exploration.exp1.thread1',
      suggestion_type: 'edit_exploration_state_content',
      target_type: 'exploration',
      target_id: 'exp1',
      target_version_at_submission: 1,
      status: 'accepted',
      author_name: 'author',
      change_cmd: {
        skill_id: 'skill_id',
        cmd: 'edit_state_property',
        property_name: 'content',
        state_name: 'state_1',
        content_id: 'interaction_0',
        new_value: {
          html: 'new suggestion content'
        },
        old_value: {
          html: 'old suggestion content'
        }
      },
      last_updated_msecs: 1000
    };
    let suggestion = Suggestion.createFromBackendDict(suggestionBackendDict);
    expect(suggestion.suggestionType).toEqual('edit_exploration_state_content');
    expect(suggestion.targetType).toEqual('exploration');
    expect(suggestion.targetId).toEqual('exp1');
    expect(suggestion.suggestionId).toEqual('exploration.exp1.thread1');
    expect(suggestion.status).toEqual('accepted');
    expect(suggestion.authorName).toEqual('author');
    expect(suggestion.stateName).toEqual('state_1');
    expect(suggestion.newValue.html).toEqual('new suggestion content');
    expect(suggestion.oldValue.html).toEqual('old suggestion content');
    expect(suggestion.lastUpdatedMsecs).toEqual(1000);
    expect(suggestion.getThreadId()).toEqual('exploration.exp1.thread1');
  });
});
