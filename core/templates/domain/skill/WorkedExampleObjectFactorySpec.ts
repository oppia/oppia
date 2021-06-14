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
 * @fileoverview Unit tests for WorkedExampleObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { WorkedExampleBackendDict, WorkedExampleObjectFactory } from 'domain/skill/WorkedExampleObjectFactory';

describe('Worked example object factory', () => {
  let workedExampleBackendDict: WorkedExampleBackendDict;
  let workedExampleObjectFactory: WorkedExampleObjectFactory;

  beforeEach(() => {
    workedExampleObjectFactory = TestBed.inject(WorkedExampleObjectFactory);

    workedExampleBackendDict = {
      question: {
        html: 'worked example question 1',
        content_id: 'worked_example_q_1'
      },
      explanation: {
        html: 'worked example explanation 1',
        content_id: 'worked_example_e_1'
      }
    };
  });

  it('should create a new worked example from a backend dictionary', () => {
    let workedExample = (
      workedExampleObjectFactory.createFromBackendDict(
        workedExampleBackendDict));
    expect(workedExample.getQuestion()).toEqual(
      SubtitledHtml.createDefault(
        'worked example question 1', 'worked_example_q_1'));
    expect(workedExample.getExplanation()).toEqual(
      SubtitledHtml.createDefault(
        'worked example explanation 1', 'worked_example_e_1'));
  });

  it('should convert to a backend dictionary', () => {
    let workedExample = (
      workedExampleObjectFactory.createFromBackendDict(
        workedExampleBackendDict));
    expect(workedExample.toBackendDict()).toEqual(workedExampleBackendDict);
  });
});
