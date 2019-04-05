// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for hint object factory.
 */

describe('Hint object factory', function() {
  beforeEach(module('oppia'));
  var hof = null;

  beforeEach(inject(function($injector) {
    hof = $injector.get('HintObjectFactory');
  }));

  it('should create a Hint from dict and convert a Hint Object to' +
     'backend dict correctly', inject(function() {
    var testHint = hof.createNew('content_id', '<p>Some Hint</p>');
    expect(testHint.toBackendDict()).toEqual({
      hint_content: {
        html: '<p>Some Hint</p>',
        content_id: 'content_id'
      }
    });
    expect(hof.createFromBackendDict({
      hint_content: {
        html: '<p>Some Hint</p>',
        content_id: 'content_id'
      }
    })).toEqual(hof.createNew('content_id', '<p>Some Hint</p>'));
  }));

  it('should be able to create a new hint object', inject(function() {
    expect(hof.createNew('content_id', '<p>Some Hint</p>')).toEqual(
      hof.createFromBackendDict({
        hint_content: {
          html: '<p>Some Hint</p>',
          content_id: 'content_id'
        }
      })
    );
  }));
});
