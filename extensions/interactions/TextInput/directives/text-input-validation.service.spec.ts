// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for text input validation service.
 */

import { TestBed } from '@angular/core/testing';

import { AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { AppConstants } from 'app.constants';
import { InteractionSpecsConstants } from 'pages/interaction-specs.constants';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { Rule, RuleObjectFactory } from
  'domain/exploration/RuleObjectFactory';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';
import { TextInputValidationService } from
  'interactions/TextInput/directives/text-input-validation.service';

describe('TextInputValidationService', () => {
  let validatorService, WARNING_TYPES;
  let INTERACTION_SPECS, customizationArgSpecs, rowsSpecs, minRows, maxRows;

  let currentState, customizationArguments;
  let goodAnswerGroups, goodDefaultOutcome;
  let oof, agof, rof;

  let createAnswerGroupByRules: (rules: Rule[]) => AnswerGroup;

  beforeEach(() => {
    validatorService = TestBed.get(TextInputValidationService);
    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);
    rof = TestBed.get(RuleObjectFactory);
    WARNING_TYPES = AppConstants.WARNING_TYPES;
    INTERACTION_SPECS = InteractionSpecsConstants.INTERACTION_SPECS;
    customizationArgSpecs = INTERACTION_SPECS.TextInput.customization_arg_specs;
    rowsSpecs = customizationArgSpecs[1];
    minRows = rowsSpecs.schema.validators[0].min_value;
    maxRows = rowsSpecs.schema.validators[1].max_value;

    currentState = 'First State';
    goodDefaultOutcome = oof.createFromBackendDict({
      dest: 'Second State',
      feedback: {
        html: '',
        audio_translations: {}
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    });

    customizationArguments = {
      placeholder: {
        value: new SubtitledUnicode('', '')
      },
      rows: {
        value: 1
      }
    };

    goodAnswerGroups = [agof.createNew([], goodDefaultOutcome, null, null)];
    createAnswerGroupByRules = (rules) => agof.createNew(
      rules,
      goodDefaultOutcome,
      null,
      null
    );
  });

  it('should be able to perform basic validation', () => {
    let warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });

  it('should catch non-string value for placeholder', () => {
    customizationArguments.placeholder.value = 1;
    let warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: ('Placeholder text must be a string.')
    }]);
  });

  it('should catch non-string value for placeholder', () => {
    customizationArguments.placeholder.value = (
      new SubtitledUnicode(undefined, undefined));
    let warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: ('Placeholder text must be a string.')
    }]);
  });

  it('should catch non-integer value for # rows', () => {
    customizationArguments.rows.value = 1.5;
    let warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: ('Number of rows must be integral.')
    }]);
  });

  it('should catch an out of range value for # rows', () => {
    customizationArguments.rows.value = -1;
    let warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, goodAnswerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: (
        'Number of rows must be between ' + minRows + ' and ' +
        maxRows + '.')
    }]);
  });

  it('should catch redundancy of contains rules with matching inputs', () => {
    let answerGroups = [createAnswerGroupByRules(
      [rof.createFromBackendDict({
        rule_type: 'Contains',
        inputs: {
          x: 'xyz'
        }
      }), rof.createFromBackendDict({
        rule_type: 'Contains',
        inputs: {
          x: 'xyza'
        }
      })]
    )];

    let warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because it' +
      ' is preceded by a \'Contains\' rule with a matching input.'
    }]);

    answerGroups = [createAnswerGroupByRules(
      [rof.createFromBackendDict({
        rule_type: 'Contains',
        inputs: {
          x: ''
        }
      }),
      rof.createFromBackendDict({
        rule_type: 'Contains',
        inputs: {
          x: 'abc'
        }
      })]
    )];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because it' +
      ' is preceded by a \'Contains\' rule with a matching input.'
    }]);

    answerGroups = [createAnswerGroupByRules(
      [rof.createFromBackendDict({
        rule_type: 'Contains',
        inputs: {
          x: 'xyz'
        }
      }),
      rof.createFromBackendDict({
        rule_type: 'Contains',
        inputs: {
          x: 'xyz'
        }
      })]
    )];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because it' +
      ' is preceded by a \'Contains\' rule with a matching input.'
    }]);
  });

  it('should catch redundancy of startsWith rules with matching inputs', () => {
    let answerGroups = [createAnswerGroupByRules(
      [rof.createFromBackendDict({
        rule_type: 'StartsWith',
        inputs: {
          x: 'xyz'
        }
      }),
      rof.createFromBackendDict({
        rule_type: 'StartsWith',
        inputs: {
          x: 'xyza'
        }
      })]
    )];

    let warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because it' +
      ' is preceded by a \'StartsWith\' rule with a matching prefix.'
    }]);

    answerGroups = [createAnswerGroupByRules(
      [rof.createFromBackendDict({
        rule_type: 'StartsWith',
        inputs: {
          x: ''
        }
      }),
      rof.createFromBackendDict({
        rule_type: 'StartsWith',
        inputs: {
          x: 'abc'
        }
      })]
    )];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because it' +
      ' is preceded by a \'StartsWith\' rule with a matching prefix.'
    }]);

    answerGroups = [createAnswerGroupByRules(
      [rof.createFromBackendDict({
        rule_type: 'Contains',
        inputs: {
          x: 'xyz'
        }
      }),
      rof.createFromBackendDict({
        rule_type: 'StartsWith',
        inputs: {
          x: 'xyzy'
        }
      })]
    )];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because it' +
      ' is preceded by a \'StartsWith\' rule with a matching prefix.'
    }]);
  });

  it('should catch redundancy of equals rules with matching inputs', () => {
    let answerGroups = [createAnswerGroupByRules(
      [rof.createFromBackendDict({
        rule_type: 'Equals',
        inputs: {
          x: 'xyz'
        }
      }),
      rof.createFromBackendDict({
        rule_type: 'Equals',
        inputs: {
          x: 'xyz'
        }
      })]
    )];

    let warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because it' +
      ' is preceded by a \'Equals\' rule with a matching input.'
    }]);

    answerGroups = [createAnswerGroupByRules(
      [rof.createFromBackendDict({
        rule_type: 'FuzzyEquals',
        inputs: {
          x: 'xyz'
        }
      })]),
    createAnswerGroupByRules(
      [rof.createFromBackendDict({
        rule_type: 'Equals',
        inputs: {
          x: 'xya'
        }
      })]
    )];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 1 from answer group 2 will never be matched because it' +
      ' is preceded by a \'FuzzyEquals\' rule with a matching input.'
    }]);
  });

  it('should catch redundancy of fuzzyEquals rules with matching input', () => {
    let answerGroups = [createAnswerGroupByRules(
      [rof.createFromBackendDict({
        rule_type: 'FuzzyEquals',
        inputs: {
          x: 'xyz'
        }
      }),
      rof.createFromBackendDict({
        rule_type: 'FuzzyEquals',
        inputs: {
          x: 'xyz'
        }
      })]
    )];

    let warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because it' +
      ' is preceded by a \'FuzzyEquals\' rule with a matching input.'
    }]);

    answerGroups = [createAnswerGroupByRules(
      [rof.createFromBackendDict({
        rule_type: 'FuzzyEquals',
        inputs: {
          x: 'xyz'
        }
      }),
      rof.createFromBackendDict({
        rule_type: 'FuzzyEquals',
        inputs: {
          x: 'xya'
        }
      })]
    )];

    warnings = validatorService.getAllWarnings(
      currentState, customizationArguments, answerGroups,
      goodDefaultOutcome);
    expect(warnings).toEqual([{
      type: WARNING_TYPES.ERROR,
      message: 'Rule 2 from answer group 1 will never be matched because it' +
      ' is preceded by a \'FuzzyEquals\' rule with a matching input.'
    }]);
  });
});
