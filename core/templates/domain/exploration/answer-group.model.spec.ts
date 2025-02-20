// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview unit tests for answer group object factory.
 */

import {TestBed} from '@angular/core/testing';

import {AnswerGroupObjectFactory} from 'domain/exploration/AnswerGroupObjectFactory';
import {OutcomeObjectFactory} from 'domain/exploration/OutcomeObjectFactory';

describe('Outcome object factory', () => {
  let answerGroupObjectFactory: AnswerGroupObjectFactory;
  let outcomeObjectFactory: OutcomeObjectFactory;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AnswerGroupObjectFactory],
    });

    answerGroupObjectFactory = TestBed.get(AnswerGroupObjectFactory);
    outcomeObjectFactory = TestBed.get(OutcomeObjectFactory);
  });

  it('should be able to get contentId to html of an answer group', () => {
    const testAnswerGroup = answerGroupObjectFactory.createNew(
      [],
      outcomeObjectFactory.createNew('Hola', 'feedback_1', 'Feedback text', []),
      ['Training data text'],
      '0'
    );
    let contentIdToHtml = testAnswerGroup.getContentIdToHtml();

    expect(contentIdToHtml).toEqual({
      feedback_1: 'Feedback text',
    });
  });
});
