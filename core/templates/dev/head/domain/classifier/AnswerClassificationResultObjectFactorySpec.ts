// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the AnswerClassificationResultObjectFactory.
 */

import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory.ts';

require('domain/exploration/OutcomeObjectFactory.ts');
require(
  'pages/exploration-player-page/services/answer-classification.service.ts');

class MockSubtitledHtml {
  _html: string;
  _contentId: string;
  constructor(html: string, contentId: string) {
    this._html = html;
    this._contentId = contentId;
  }
}

class MockOutcome {
  dest: string;
  feedback: MockSubtitledHtml;
  labelledAsCorrect: boolean;
  paramChanges: any;
  refresherExplorationId: any;
  missingPrerequisiteSkillId: any;
  constructor(
      dest: string, feedback: MockSubtitledHtml, labelledAsCorrect: boolean,
      paramChanges: any, refresherExplorationId: any,
      missingPrerequisiteSkillId: any) {
    this.dest = dest;
    this.feedback = feedback;
    this.labelledAsCorrect = labelledAsCorrect;
    this.paramChanges = paramChanges;
    this.refresherExplorationId = refresherExplorationId;
    this.missingPrerequisiteSkillId = missingPrerequisiteSkillId;
  }
}

class MockOutcomeObjectFactory {
  createNew(
      dest: string, feedbackTextId: string, feedbackText: string,
      paramChanges: any) {
    return new MockOutcome(
      dest,
      new MockSubtitledHtml(feedbackText, feedbackTextId),
      false,
      paramChanges,
      null,
      null);
  }
}

describe('Answer classification result object factory', () => {
  let acrof: AnswerClassificationResultObjectFactory;
  let oof: MockOutcomeObjectFactory;
  let DEFAULT_OUTCOME_CLASSIFICATION: string;

  beforeEach(() => {
    acrof = new AnswerClassificationResultObjectFactory();
    oof = new MockOutcomeObjectFactory();
    DEFAULT_OUTCOME_CLASSIFICATION = 'default_outcome';
  });

  it('should create a new result', () => {
    var answerClassificationResult = acrof.createNew(
      oof.createNew('default', '', '', []), 1, 0, DEFAULT_OUTCOME_CLASSIFICATION
    );

    expect(answerClassificationResult.outcome).toEqual(
      oof.createNew('default', '', '', []));
    expect(answerClassificationResult.answerGroupIndex).toEqual(1);
    expect(answerClassificationResult.ruleIndex).toEqual(0);
    expect(answerClassificationResult.classificationCategorization).toEqual(
      DEFAULT_OUTCOME_CLASSIFICATION);
  });
});
