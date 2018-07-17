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
* @fileoverview Unit tests for SuggestionObjectFactory.
*/

describe('Suggestion object factory', function() {
  beforeEach(module('oppia'));
  var SuggestionObjectFactory = null;

  beforeEach(inject(function($injector) {
    SuggestionObjectFactory = $injector.get('SuggestionObjectFactory');
  }));

  it('should create a new suggestion from a backend dict.', function(){
    suggestionBackendDict = {
      suggestion_id: 'exploration.exp1.thread1',
      suggestion_type: 'edit_exploration_state_content',
      target_type: 'exploration',
      target_id: 'exp1',
      target_version_at_submission: 1,
      status: 'accepted',
      author_name: 'author',
      change_cmd: {
        cmd: 'edit_state_property',
        property_name: 'content',
        state_name: 'state_1',
        new_value: 'new suggestion content',
        old_value: 'old suggestion content'
      },
      last_updated: 1000
    };

    suggestion = SuggestionObjectFactory.createFromBackendDict(
      suggestionBackendDict);
    expect(suggestion.suggestionType).toEqual('edit_exploration_state_content');
    expect(suggestion.targetType).toEqual('exploration');
    expect(suggestion.targetId).toEqual('exp1');
    expect(suggestion.suggestionId).toEqual('exploration.exp1.thread1');
    expect(suggestion.status).toEqual('accepted');
    expect(suggestion.authorName).toEqual('author');
    expect(suggestion.newValue).toEqual('new suggestion content');
    expect(suggestion.oldValue).toEqual('old suggestion content');
    expect(suggestion.lastUpdated).toEqual(1000);
    expect(suggestion.threadId()).toEqual('exp1.thread1');
  });
})
