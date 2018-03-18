// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview unit tests for outcome object factory.
 */

describe('Outcome object factory', function() {
  var oof;
  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    oof = $injector.get('OutcomeObjectFactory');
  }));

  it('should correctly determine if an outcome is confusing given a ' +
    'source state',
  function() {
    var currentState = 'A';
    var testOutcome1 = oof.createNew('B', 'feedback', []);
    var testOutcome2 = oof.createNew('B', '', []);
    var testOutcome3 = oof.createNew('A', 'feedback', []);
    var testOutcome4 = oof.createNew('A', '', []);
    var testOutcome5 = oof.createNew('A', '   ', []);
    expect(testOutcome1.isConfusing(currentState)).toBe(false);
    expect(testOutcome2.isConfusing(currentState)).toBe(false);
    expect(testOutcome3.isConfusing(currentState)).toBe(false);
    expect(testOutcome4.isConfusing(currentState)).toBe(true);
    expect(testOutcome5.isConfusing(currentState)).toBe(true);
  }
  );

  it('should correctly output whether an outcome has nonempty feedback',
    function() {
      var testOutcome1 = oof.createNew('A', 'feedback', []);
      var testOutcome2 = oof.createNew('A', '', []);
      var testOutcome3 = oof.createNew('A', '   ', []);
      expect(testOutcome1.hasNonemptyFeedback()).toBe(true);
      expect(testOutcome2.hasNonemptyFeedback()).toBe(false);
      expect(testOutcome3.hasNonemptyFeedback()).toBe(false);
    }
  );
});
