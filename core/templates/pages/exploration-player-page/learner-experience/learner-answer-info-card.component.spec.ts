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
 * @fileoverview Unit tests for LearnerAnswerInfoCard
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {BackgroundMaskService} from 'services/stateful/background-mask.service';
import {LearnerAnswerInfoCard} from './learner-answer-info-card.component';
import {ExplorationEngineService} from '../services/exploration-engine.service';
import {StateObjectFactory} from 'domain/state/StateObjectFactory';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {PlayerTranscriptService} from '../services/player-transcript.service';
import {LearnerAnswerInfoService} from '../services/learner-answer-info.service';

describe('LearnerAnswerInfoCard', () => {
  let component: LearnerAnswerInfoCard;
  let fixture: ComponentFixture<LearnerAnswerInfoCard>;
  let explorationHtmlFormatter: ExplorationHtmlFormatterService;
  let explorationEngineService: ExplorationEngineService;
  let stateObjectFactory: StateObjectFactory;
  let playerTranscriptService: PlayerTranscriptService;
  let learnerAnswerInfoService: LearnerAnswerInfoService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [LearnerAnswerInfoCard],
      providers: [
        BackgroundMaskService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    stateObjectFactory = TestBed.get(StateObjectFactory);
    explorationHtmlFormatter = TestBed.get(ExplorationHtmlFormatterService);
    learnerAnswerInfoService = TestBed.get(LearnerAnswerInfoService);
    playerTranscriptService = TestBed.get(PlayerTranscriptService);
    explorationEngineService = TestBed.get(ExplorationEngineService);
    spyOn(explorationEngineService, 'getState').and.returnValue(
      stateObjectFactory.createFromBackendDict('stateName', {
        classifier_model_id: null,
        content: {
          html: '',
          content_id: 'content',
        },
        interaction: {
          id: 'FractionInput',
          customization_args: {
            requireSimplestForm: {value: false},
            allowImproperFraction: {value: true},
            allowNonzeroIntegerPart: {value: true},
            customPlaceholder: {
              value: {
                content_id: '',
                unicode_str: '',
              },
            },
          },
          answer_groups: [],
          default_outcome: {
            dest: 'Introduction',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: '',
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          confirmed_unclassified_answers: [],
          hints: [],
          solution: null,
        },
        linked_skill_id: null,
        param_changes: [],
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
          },
        },
        solicit_answer_details: false,
        card_is_checkpoint: false,
      })
    );

    fixture = TestBed.createComponent(LearnerAnswerInfoCard);
    component = fixture.componentInstance;
  });

  it('should display current answer', () => {
    spyOn(explorationHtmlFormatter, 'getAnswerHtml').and.returnValue(
      '<p> Answer </p>'
    );

    expect(component.displayCurrentAnswer()).toBe('<p> Answer </p>');
  });

  it('should submit learner answer information', () => {
    spyOn(playerTranscriptService, 'addNewInput').and.stub();
    spyOn(playerTranscriptService, 'addNewResponse').and.stub();
    spyOn(learnerAnswerInfoService, 'recordLearnerAnswerInfo').and.stub();
    spyOn(component.submitAnswer, 'emit');

    component.submitLearnerAnswerInfo();

    expect(component.submitAnswer.emit).toHaveBeenCalled();
  });
});
