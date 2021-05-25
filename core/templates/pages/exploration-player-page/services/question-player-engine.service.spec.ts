// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for the question player engine service.
 */

import { TestBed } from '@angular/core/testing';
import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { StateCardObjectFactory } from 'domain/state_card/StateCardObjectFactory';
import { ExpressionInterpolationService } from 'expressions/expression-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { AnswerClassificationService } from './answer-classification.service';
import { QuestionPlayerEngineService } from './question-player-engine.service';

fdescribe('Question player engine service ', () => {
  let alertsService: AlertsService;
  let answerClassificationService: AnswerClassificationService;
  let contextService: ContextService;
  let explorationHtmlFormatterService: ExplorationHtmlFormatterService;
  let expressionInterpolationService: ExpressionInterpolationService;
  let focusManagerService: FocusManagerService;
  let questionObjectFactory: QuestionObjectFactory;
  let readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService;
  let stateCardObjectFactory: StateCardObjectFactory;
  let questionPlayerEngineService: QuestionPlayerEngineService;
  let urlService: UrlService;

  let questionBackendDict = [{
    id: 'id1',
    question_state_data: {
      classifier_model_id: null,
      param_changes: [],
      next_content_id_index: 1,
      solicit_answer_details: false,
      content: {
        content_id: '1',
        html: 'Question 1'
      },
      written_translations: {
        translations_mapping: {
          1: {},
          ca_placeholder_0: {},
          feedback_id: {},
          solution: {},
          hint_1: {}
        }
      },
      interaction: {
        answer_groups: [],
        default_outcome: {
          dest: null,
          labelled_as_correct: true,
          missing_prerequisite_skill_id: null,
          refresher_exploration_id: null,
          param_changes: [],
          feedback: {
            content_id: 'feedback_id',
            html: '<p>Dummy Feedback</p>'
          }
        },
        id: 'TextInput',
        customization_args: {
          rows: {
            value: 1
          },
          placeholder: {
            value: {
              unicode_str: '',
              content_id: 'ca_placeholder_0'
            }
          }
        },
        confirmed_unclassified_answers: [],
        hints: [
          {
            hint_content: {
              content_id: 'hint_1',
              html: '<p>This is a hint.</p>'
            }
          }
        ],
        solution: {
          correct_answer: 'Solution',
          explanation: {
            content_id: 'solution',
            html: '<p>This is a solution.</p>'
          },
          answer_is_exclusive: false
        }
      },
      linked_skill_id: null,
      card_is_checkpoint: true,
      recorded_voiceovers: {
        voiceovers_mapping: {
          1: {},
          ca_placeholder_0: {},
          feedback_id: {},
          solution: {},
          hint_1: {}
        }
      }
    },
    question_state_data_schema_version: 45,
    language_code: 'en',
    version: 1,
    linked_skill_ids: [],
    inapplicable_skill_misconception_ids: [],
  }];

  beforeEach(() => {
    alertsService = TestBed.inject(AlertsService);
    answerClassificationService = TestBed.inject(AnswerClassificationService);
    contextService = TestBed.inject(ContextService);
    explorationHtmlFormatterService =
      TestBed.inject(ExplorationHtmlFormatterService);
    expressionInterpolationService =
      TestBed.inject(ExpressionInterpolationService);
    focusManagerService = TestBed.inject(FocusManagerService);
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService);
    stateCardObjectFactory = TestBed.inject(StateCardObjectFactory);
    questionPlayerEngineService = TestBed.inject(QuestionPlayerEngineService);
    urlService = TestBed.inject(UrlService);
  });

  it('should load questions on initialization', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = {
      version: '1'
    } as unknown as FetchExplorationBackendResponse;

    let quesitonPlayerSpy =
      spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    let explorationIdSpy =
      spyOn(contextService, 'getExplorationId').and.returnValue('id1');
    let questionPlayerModeSpy =
      spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);
    let versionSpy =
      spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    let readOnlySpy =
      spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
        .and.returnValue(Promise.resolve(exploration));

    questionPlayerEngineService.init(
      questionBackendDict, successHandler, failHandler);

    expect(quesitonPlayerSpy).toHaveBeenCalled();
    expect(explorationIdSpy).toHaveBeenCalled();
    expect(questionPlayerModeSpy).toHaveBeenCalled();
    expect(versionSpy).toHaveBeenCalled();
    expect(readOnlySpy).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();

    // eslint-disable-next-line dot-notation
    expect(questionPlayerEngineService['explorationId']).toBe('id1');
    // eslint-disable-next-line dot-notation
    expect(questionPlayerEngineService['questionPlayerMode']).toBe(false);
    // eslint-disable-next-line dot-notation
    expect(questionPlayerEngineService['version']).toBe(1);
    // eslint-disable-next-line dot-notation
    expect(questionPlayerEngineService['questions'].length).toBe(1);
  });

  it('should submit answer correctly', () => {
    
  });
});
