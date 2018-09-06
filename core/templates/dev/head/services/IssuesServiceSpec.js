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
 * @fileoverview Factory for domain object which holds the list of top answer
 * statistics for a particular state.
 */

describe('IssuesService', function() {
  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    this.is = $injector.get('IssuesService');
  }));

  describe('.isStateRequiredToResolveUnaddressedAnswers', function() {
    it('returns true for TextInput interactions', function() {
      var textInputState = {interaction: {id: 'TextInput'}};
      expect(
        this.is.isStateRequiredToResolveUnaddressedAnswers(textInputState)
      ).toBe(true);
    });

    it('returns false for FractionInput interactions', function() {
      var fractionInputState = {interaction: {id: 'FractionInput'}};
      expect(
        this.is.isStateRequiredToResolveUnaddressedAnswers(fractionInputState)
      ).toBe(false);
    });
  });
});
