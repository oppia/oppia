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
 * @fileoverview Unit test for the PencilCodeEditorValidationService.
 */

import { TestBed } from '@angular/core/testing';

/* eslint-disable max-len */
import { PencilCodeEditorValidationService } from
  'interactions/PencilCodeEditor/directives/pencil-code-editor-validation.service.ts';
/* eslint-enable max-len */
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';


describe('Pencil Code Editor Validation Service', () => {
  let pcevs: PencilCodeEditorValidationService = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PencilCodeEditorValidationService]
    });

    pcevs = TestBed.get(PencilCodeEditorValidationService);
  });

  it('should tests the warning properties.', () => {
    let array = [];
    let stateName = 'Introduction';
    let customizationArgs = {
      initial_code: '# Add the initial code snippet here.↵',
    };
    let answerGroups = [];
    let defaultOutcome: Outcome;
    expect(pcevs.getCustomizationArgsWarnings(customizationArgs))
      .toEqual(array);
    expect(pcevs.getAllWarnings(
    stateName, customizationArgs, answerGroups,
    defaultOutcome)).toEqual(array);
  });
});
