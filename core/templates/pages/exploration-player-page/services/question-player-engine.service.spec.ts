// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the question player engine service.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {fakeAsync, TestBed} from '@angular/core/testing';
import {AnswerClassificationResult} from '../../../domain/classifier/answer-classification-result.model';
import {Outcome} from '../../../domain/exploration/outcome.model';
import {AlertsService} from '../../../services/alerts.service';
import {AnswerClassificationService} from './answer-classification.service';
import {QuestionPlayerEngineService} from './question-player-engine.service';
import {TextInputRulesService} from 'interactions/TextInput/directives/text-input-rules.service';

describe('Question player engine service', () => {
  let alertsService: AlertsService;
  let answerClassificationService: AnswerClassificationService;
  let questionPlayerEngineService: QuestionPlayerEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        QuestionPlayerEngineService,
        AlertsService,
        AnswerClassificationService,
      ],
    });
    alertsService = TestBed.inject(AlertsService);
    answerClassificationService = TestBed.inject(AnswerClassificationService);
    questionPlayerEngineService = TestBed.inject(QuestionPlayerEngineService);
  });

  describe('on submitting answer', () => {
    it('should show warning message if the feedback content is empty', fakeAsync(() => {
      const result = new AnswerClassificationResult(
        Outcome.createNew('dest', 'id', {contentId: 'f', html: ''}, []),
        0,
        0,
        'explicit'
      );
      spyOn(
        answerClassificationService,
        'getMatchingClassificationResult'
      ).and.returnValue(result);
      const alertsSpy = spyOn(alertsService, 'addWarning').and.stub();

      const mockQuestion = {
        getInteraction: () => ({id: 'TextInput'}),
        getStateData: () => ({
          interaction: {id: 'TextInput', answerGroups: []},
          content: {html: 'Question 1', contentId: 'content_1'},
        }),
      } as unknown;

      (
        questionPlayerEngineService as unknown as {questions: unknown[]}
      ).questions = [mockQuestion];

      (
        questionPlayerEngineService as unknown as {currentIndex: number}
      ).currentIndex = 0;

      spyOn(
        questionPlayerEngineService as unknown as {
          makeFeedback: () => string;
        },
        'makeFeedback'
      ).and.returnValue('');

      questionPlayerEngineService.submitAnswer(
        'ans',
        TestBed.inject(TextInputRulesService),
        () => {}
      );

      expect(alertsSpy).toHaveBeenCalledWith(
        'Feedback content should not be empty.'
      );
    }));
  });
});
