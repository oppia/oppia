// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Pencil Code Editor Validation Service.
 */

import {
  AnswerGroup,
  AnswerGroupObjectFactory,
} from 'domain/exploration/AnswerGroupObjectFactory';
import {AppConstants} from 'app.constants';
import {OutcomeObjectFactory} from 'domain/exploration/OutcomeObjectFactory';
import {PencilCodeEditorValidationService} from 'interactions/PencilCodeEditor/directives/pencil-code-editor-validation.service';
import {Rule, RuleInputs} from 'domain/exploration/rule.model';
import {TestBed} from '@angular/core/testing';

describe('Pencil Code Editor Validation Service', () => {
  let pcevs: PencilCodeEditorValidationService;
  let oof: OutcomeObjectFactory;
  let inputBackend: RuleInputs;
  let agof: AnswerGroupObjectFactory;

  beforeEach(() => {
    oof = TestBed.inject(OutcomeObjectFactory);
    pcevs = TestBed.inject(PencilCodeEditorValidationService);
    agof = TestBed.inject(AnswerGroupObjectFactory);
  });

  describe('on calling getCustomizationArgsWarnings', () => {
    it('should return empty list when feedback is given', () => {
      var customizationArgs = {
        initialCode: {
          value: ' Add the initial code snippet here.↵code is here',
        },
      };

      expect(pcevs.getCustomizationArgsWarnings(customizationArgs)).toEqual([]);
    });
  });

  describe('on calling getAllWarnings', () => {
    it('should return error when no feedback is given', () => {
      var statename = 'Introduction';
      var customizationArgs = {
        initialCode: {
          value: ' Add the initial code snippet here.↵code is here',
        },
      };
      const testOutcome1 = oof.createNew(
        'Introduction',
        'default_outcome',
        '',
        []
      );
      var answergroup1: AnswerGroup[] = [];
      var partialWarningsList = [];
      partialWarningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message:
          'Please add feedback for the user in the [All other answers] ' +
          'rule.',
      });

      // It returns the error when feedback is not provided.
      expect(
        pcevs.getAllWarnings(
          statename,
          customizationArgs,
          answergroup1,
          testOutcome1
        )
      ).toEqual(partialWarningsList);

      inputBackend = {
        x: [['<p>one</p>']],
      };
      const testOutcome2 = oof.createNew(
        'Introduction',
        'feedback_0',
        '<p>YES</p>',
        []
      );
      let rulesDict = Rule.createNew('CodeEquals', inputBackend, {
        x: 'CodeString',
      });
      let answergroup2 = agof.createNew([rulesDict], testOutcome2, [], null);

      // It also returns the error when feedback is not provided.
      expect(
        pcevs.getAllWarnings(
          statename,
          customizationArgs,
          [answergroup2],
          testOutcome1
        )
      ).toEqual(partialWarningsList);
    });

    it('should not return error when feedback is given', () => {
      var statename = 'Introduction';
      var customizationArgs = {
        initialCode: {
          value: ' Add the initial code snippet here.↵code is here',
        },
      };
      inputBackend = {
        x: [['<p>one</p>']],
      };
      const testOutcome = oof.createNew(
        'Introduction',
        'feedback_0',
        '<p>YES</p>',
        []
      );
      let rulesDict = Rule.createNew('CodeEquals', inputBackend, {
        x: 'CodeString',
      });
      let answergroup2 = agof.createNew([rulesDict], testOutcome, [], null);
      const testOutcome2 = oof.createNew(
        'Introduction',
        'default_outcome',
        '<p>no</p>',
        []
      );

      // It returns the list when feedback is provided.
      expect(
        pcevs.getAllWarnings(
          statename,
          customizationArgs,
          [answergroup2],
          testOutcome2
        )
      ).toEqual([]);
    });

    it('should call getCustomizationArgsWarnings', () => {
      var statename = 'Introduction';
      var customizationArgs = {
        initialCode: {
          value: ' Add the initial code snippet here.↵code is here',
        },
      };
      const testOutcome1 = oof.createNew(
        'Introduction',
        'default_outcome',
        '',
        []
      );
      var answergroup1: AnswerGroup[] = [];

      spyOn(pcevs, 'getCustomizationArgsWarnings')
        .withArgs(customizationArgs)
        .and.returnValue([]);

      // It returns the error when feedback is not provided.
      pcevs.getAllWarnings(
        statename,
        customizationArgs,
        answergroup1,
        testOutcome1
      );

      // It checks the getCustomizationArgsWarnings has been called or not.
      expect(pcevs.getCustomizationArgsWarnings).toHaveBeenCalled();
    });

    it('should catch non-string value for initialCode', () => {
      var statename = 'Introduction';
      var customizationArgs = {
        initialCode: {
          value: 1,
        },
      };
      inputBackend = {
        x: [['<p>one</p>']],
      };
      const testOutcome = oof.createNew(
        'Introduction',
        'feedback_0',
        '<p>YES</p>',
        []
      );
      let rulesDict = Rule.createNew('CodeEquals', inputBackend, {
        x: 'CodeString',
      });
      let answergroup2 = agof.createNew([rulesDict], testOutcome, [], null);
      const testOutcome2 = oof.createNew(
        'Introduction',
        'default_outcome',
        '<p>no</p>',
        []
      );
      var partialWarningsList = [];
      partialWarningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: 'The initialCode must be a string.',
      });
      expect(
        pcevs.getAllWarnings(
          statename,
          // This throws "Type '1'. We need to suppress this error because is not
          // assignable to type 'string'." Here we are assigning the wrong type
          // of value to "customizationArguments" in order to test validations.
          // @ts-expect-error
          customizationArgs,
          [answergroup2],
          testOutcome2
        )
      ).toEqual(partialWarningsList);
    });
  });
});
