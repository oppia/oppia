// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Logic Proof rules.
 */

import { LogicProofRulesService } from
  'interactions/LogicProof/directives/logic-proof-rules.service';

interface Answer {
  'assumptions_string': string,
  'target_string': string,
  'proof_string': string,
  'correct': boolean,
  'error_category'?: string,
  'error_code'?: string,
  'error_message'?: string,
  'error_line_number'?: number
}

describe('Logic Proof rules service', () => {
  let lprs: LogicProofRulesService;
  beforeEach(() => {
    lprs = new LogicProofRulesService();
  });

  var CORRECT_EXAMPLE: Answer = {
    assumptions_string: 'p',
    target_string: 'q',
    proof_string: 'a proof',
    correct: true
  };
  var INCORRECT_EXAMPLE_PARSING: Answer = {
    assumptions_string: 'p',
    target_string: 'q',
    proof_string: 'a proof',
    correct: false,
    error_category: 'parsing',
    error_code: 'a code',
    error_message: 'a message',
    error_line_number: 3
  };
  var INCORRECT_EXAMPLE_TYPING: Answer = {
    assumptions_string: 'p',
    target_string: 'q',
    proof_string: 'a proof',
    correct: false,
    error_category: 'typing',
    error_code: 'a code',
    error_message: 'a message',
    error_line_number: 4
  };

  it('should have a correct \'correct\' rule', () => {
    expect(lprs.Correct(CORRECT_EXAMPLE)).toBe(true);
    expect(lprs.Correct(INCORRECT_EXAMPLE_PARSING)).toBe(false);
    expect(lprs.Correct(INCORRECT_EXAMPLE_TYPING)).toBe(false);
  });

  it('should have a correct \'not correct\' rule', () => {
    expect(lprs.NotCorrect(CORRECT_EXAMPLE)).toBe(false);
    expect(lprs.NotCorrect(INCORRECT_EXAMPLE_PARSING)).toBe(true);
    expect(lprs.NotCorrect(INCORRECT_EXAMPLE_TYPING)).toBe(true);
  });

  it('should have a correct \'not correct by category\' rule', () => {
    var RULE_INPUT: {c: string} = {
      c: 'typing'
    };
    expect(lprs.NotCorrectByCategory(CORRECT_EXAMPLE, RULE_INPUT)).toBe(false);
    expect(lprs.NotCorrectByCategory(
      INCORRECT_EXAMPLE_PARSING, RULE_INPUT)).toBe(false);
    expect(lprs.NotCorrectByCategory(
      INCORRECT_EXAMPLE_TYPING, RULE_INPUT)).toBe(true);
  });
});
