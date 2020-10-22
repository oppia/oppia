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
 * @fileoverview Unit tests for Pencil Code Editor Validation Service.
 */
import { TestBed } from '@angular/core/testing';

import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';

import { PencilCodeEditorValidationService } from
  // eslint-disable-next-line max-len
  'interactions/PencilCodeEditor/directives/pencil-code-editor-validation.service';
import { RuleObjectFactory, RuleInputs } from
  'domain/exploration/RuleObjectFactory';
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { AppConstants } from 'app.constants';


describe('Pencil Code Editor Validation Service', () => {
  let pcevs: PencilCodeEditorValidationService = null;
  let oof: OutcomeObjectFactory = null;
  let rof: RuleObjectFactory = null;
  let inputBackend: RuleInputs = null;
  let agof : AnswerGroupObjectFactory = null;

  beforeEach(() => {
    oof = TestBed.get(OutcomeObjectFactory);
    pcevs = TestBed.get(PencilCodeEditorValidationService);
    rof = TestBed.get(RuleObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);
  });

  it('should return empty list', () => {
    var customizationArgs = {
      initialCode: {
        value: ' Add the initial code snippet here.↵code is here'
      }
    };
    expect(pcevs.getCustomizationArgsWarnings(customizationArgs)).toEqual([]);
  });

  it('should return error or empty list if no error', () => {
    var statename = 'Introduction';

    var customizationArgs = {
      initialCode: {
        value: ' Add the initial code snippet here.↵code is here'
      }
    };

    const testOutcome1 = oof.createNew(
      'Introduction', 'default_outcome', '', []);

    var answergroup1 = [];
    var partialWarningsList = [];

    partialWarningsList.push({
      type: AppConstants.WARNING_TYPES.ERROR,
      message: (
        'Please add feedback for the user in the [All other answers] ' +
        'rule.')
    });

    spyOn(pcevs, 'getCustomizationArgsWarnings')
      .withArgs(customizationArgs).and.returnValue([]);

    // It returns the error when feedback is not provided.
    expect(pcevs.getAllWarnings(
      statename, customizationArgs, answergroup1, testOutcome1)
    ).toEqual(partialWarningsList);

    // It checks the getCustomizationArgsWarnings has been called or not.
    expect(pcevs.getCustomizationArgsWarnings).toHaveBeenCalled();

    inputBackend = {
      x: [['<p>one</p>']]
    };

    const testOutcome2 = oof.createNew(
      'Introduction', 'feedback_0', '<p>YES</p>', []);

    let rulesDict = rof.createNew('CodeString', inputBackend);

    let answergroup2 = agof.createNew([rulesDict], testOutcome2, [], null);

    // It also returns the error when feedback is not provided.
    expect(pcevs.getAllWarnings(
      statename, customizationArgs,
      [answergroup2], testOutcome1)
    ).toEqual(partialWarningsList);

    const testOutcome3 = oof.createNew(
      'Introduction', 'default_outcome',
      '<p>no</p>', []);

    // It returns the list when feedback is provided.
    expect(pcevs.getAllWarnings(
      statename, customizationArgs, [answergroup2], testOutcome3)
    ).toEqual([]);
  });
});

