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

import { TestBed } from '@angular/core/testing';

import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';

describe('Outcome object factory', () => {
  let oof: OutcomeObjectFactory;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OutcomeObjectFactory]
    });

    oof = TestBed.get(OutcomeObjectFactory);
  });

  it(
    'should correctly determine if an outcome is confusing given a ' +
    'source state',
    () => {
      var currentState = 'A';
      var testOutcome1 = oof.createNew('B', 'feedback_1', 'feedback', []);
      var testOutcome2 = oof.createNew('B', 'feedback_2', '', []);
      var testOutcome3 = oof.createNew('A', 'feedback_3', 'feedback', []);
      var testOutcome4 = oof.createNew('A', 'feedback_4', '', []);
      var testOutcome5 = oof.createNew('A', 'feedback_5', '   ', []);
      expect(testOutcome1.isConfusing(currentState)).toBe(false);
      expect(testOutcome2.isConfusing(currentState)).toBe(false);
      expect(testOutcome3.isConfusing(currentState)).toBe(false);
      expect(testOutcome4.isConfusing(currentState)).toBe(true);
      expect(testOutcome5.isConfusing(currentState)).toBe(true);
    }
  );

  it('should correctly output whether an outcome has nonempty feedback',
    () => {
      var testOutcome1 = oof.createNew('A', 'feedback_1', 'feedback', []);
      var testOutcome2 = oof.createNew('A', 'feedback_2', '', []);
      var testOutcome3 = oof.createNew('A', 'feedback_3', '   ', []);
      expect(testOutcome1.hasNonemptyFeedback()).toBe(true);
      expect(testOutcome2.hasNonemptyFeedback()).toBe(false);
      expect(testOutcome3.hasNonemptyFeedback()).toBe(false);
    }
  );

  it('should correctly set the destination of an outcome',
    () => {
      var testOutcome = oof.createNew('A', 'feedback_1', 'feedback', []);
      testOutcome.setDestination('B');
      expect(testOutcome.dest).toEqual('B');
    }
  );
});
