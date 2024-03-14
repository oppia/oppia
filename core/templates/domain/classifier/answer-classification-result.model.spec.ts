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
 * @fileoverview Unit tests for the AnswerClassificationResult model.
 */

import {AnswerClassificationResult} from 'domain/classifier/answer-classification-result.model';
import {OutcomeObjectFactory} from 'domain/exploration/OutcomeObjectFactory';

describe('Answer classification result model', () => {
  let oof: OutcomeObjectFactory;
  let DEFAULT_OUTCOME_CLASSIFICATION: string;

  beforeEach(() => {
    oof = new OutcomeObjectFactory();
    DEFAULT_OUTCOME_CLASSIFICATION = 'default_outcome';
  });

  it('should create a new result', () => {
    var answerClassificationResult = new AnswerClassificationResult(
      oof.createNew('default', '', '', []),
      1,
      0,
      DEFAULT_OUTCOME_CLASSIFICATION
    );

    expect(answerClassificationResult.outcome).toEqual(
      oof.createNew('default', '', '', [])
    );
    expect(answerClassificationResult.answerGroupIndex).toEqual(1);
    expect(answerClassificationResult.classificationCategorization).toEqual(
      DEFAULT_OUTCOME_CLASSIFICATION
    );
  });
});
