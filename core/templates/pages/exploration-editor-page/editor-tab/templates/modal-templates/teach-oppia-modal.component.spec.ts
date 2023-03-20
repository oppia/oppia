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
 * @fileoverview Unit tests for TeachOppiaModalComponent.
 */

import { EventEmitter, Injector, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateBackendDict, StateObjectFactory } from 'domain/state/StateObjectFactory';
import { TrainingDataService } from '../../training-panel/training-data.service';
import { TrainingModalService } from '../../training-panel/training-modal.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { ResponsesService } from '../../services/responses.service';
import { TeachOppiaModalComponent, UnresolvedAnswer } from './teach-oppia-modal.component';
import { TruncateInputBasedOnInteractionAnswerTypePipe } from 'filters/truncate-input-based-on-interaction-answer-type.pipe';
import { AnswerClassificationResult } from 'domain/classifier/answer-classification-result.model';
import { AnswerClassificationService } from 'pages/exploration-player-page/services/answer-classification.service';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { TeachOppiaModalBackendApiService } from './teach-oppia-modal-backend-api.service';
import { AnswerGroup } from 'domain/exploration/AnswerGroupObjectFactory';
import { InteractionAnswer } from 'interactions/answer-defs';

describe('Teach Oppia Modal Component', () => {
  let component: TeachOppiaModalComponent;
  let fixture: ComponentFixture<TeachOppiaModalComponent>;
  let alertsService: AlertsService;
  let contextService: ContextService;
  let explorationHtmlFormatterService: ExplorationHtmlFormatterService;
  let stateEditorService: StateEditorService;
  let stateInteractionIdService: StateInteractionIdService;
  let stateObjectFactory: StateObjectFactory;
  let explorationStatesService: ExplorationStatesService;
  let responsesService: ResponsesService;
  let trainingDataService: TrainingDataService;
  let trainingModalService: TrainingModalService;
  let answerClassificationService: AnswerClassificationService;
  let teachOppiaModalBackendApiService: TeachOppiaModalBackendApiService;
  let explorationId = 'exp1';
  let stateName = 'Introduction';
  let injector: Injector;
  let onchange = new EventEmitter();
  let state: StateBackendDict = {
    classifier_model_id: null,
    content: {
      html: '',
      content_id: 'content'
    },
    interaction: {
      id: 'TextInput',
      customization_args: {
        rows: {
          value: 1
        },
        placeholder: {
          value: 'Type your answer here.'
        }
      },
      answer_groups: [{
        rule_specs: [{
          rule_type: 'Equals',
          inputs: {
            x: {
              contentId: 'rule_input',
              normalizedStrSet: ['Correct Answer']
            }
          }
        }],
        outcome: {
          dest: 'outcome 1',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'content_5',
            html: ''
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        training_data: [],
        tagged_skill_misconception_id: null
      }],
      default_outcome: {
        dest: 'Introduction',
        dest_if_really_stuck: null,
        feedback: {
          content_id: 'default_outcome',
          html: 'This is a html feedback'
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      },
      confirmed_unclassified_answers: [],
      hints: [],
      solution: null
    },
    linked_skill_id: null,
    param_changes: [],
    recorded_voiceovers: {
      voiceovers_mapping: {}
    },
    solicit_answer_details: false,
    card_is_checkpoint: false,
  };

  class MockTrainingDataService {
    associateWithDefaultResponse() {}

    associateWithAnswerGroup() {}

    isConfirmedUnclassifiedAnswer() {}
  }

  class MockTrainingModalService {
    openTrainUnresolvedAnswerModal() {}

    onFinishTrainingCallback = onchange;
  }

  class MockActiveModal {
    close(): void {
      return;
    }

    dismiss(): void {
      return;
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        TeachOppiaModalComponent,
      ],
      providers: [
        Injector,
        TruncateInputBasedOnInteractionAnswerTypePipe,
        TeachOppiaModalBackendApiService,
        AnswerClassificationService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
        {
          provide: TrainingDataService,
          useClass: MockTrainingDataService
        },
        {
          provide: TrainingModalService,
          useClass: MockTrainingModalService
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeachOppiaModalComponent);
    component = fixture.componentInstance;
    injector = TestBed.inject(Injector);
    stateInteractionIdService = TestBed.inject(StateInteractionIdService);
    stateObjectFactory = TestBed.inject(StateObjectFactory);
    trainingDataService = TestBed.inject(TrainingDataService);
    trainingModalService = TestBed.inject(TrainingModalService);
    teachOppiaModalBackendApiService = TestBed.inject(
      TeachOppiaModalBackendApiService);
    answerClassificationService = TestBed.inject(AnswerClassificationService);
  });

  describe('when successfully fetching top unresolved answers', () => {
    beforeEach(() => {
      component.unresolvedAnswers = [
        {
          answer: 'Answer Text',
          answerTemplate: '',
          classificationResult: new AnswerClassificationResult(
            {} as Outcome, 0, 0, ''),
          feedbackHtml: 'This is a html feedback'
        },
        {
          answer: 'Answer Text',
          answerTemplate: '',
          classificationResult: new AnswerClassificationResult(
            {} as Outcome, 0, 0, ''),
          feedbackHtml: 'This is a html feedback'
        }
      ];
      alertsService = TestBed.inject(AlertsService);
      contextService = TestBed.inject(ContextService);
      explorationHtmlFormatterService = TestBed.inject(
        ExplorationHtmlFormatterService);
      explorationStatesService = TestBed.inject(ExplorationStatesService);
      stateEditorService = TestBed.inject(StateEditorService);
      responsesService = TestBed.inject(ResponsesService);
      trainingDataService = TestBed.inject(TrainingDataService);
      trainingModalService = TestBed.inject(TrainingModalService);

      spyOn(injector, 'get').and.stub();
      spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
      spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
        stateName);
      spyOn(explorationStatesService, 'getState').and.returnValue(
        stateObjectFactory.createFromBackendDict(stateName, state));
      stateInteractionIdService.init(stateName, 'TextInput');
      spyOn(responsesService, 'getConfirmedUnclassifiedAnswers').and
        .returnValue([]);
      spyOn(responsesService, 'getAnswerGroups').and
        .returnValue([new AnswerGroup([], {} as Outcome, [], '')]);

      spyOn(explorationHtmlFormatterService, 'getAnswerHtml').and
        .returnValue('');

      component.ngOnInit();
    });

    afterEach(() => {
      component.ngOnDestroy();
    });

    it('should initialize unresolved answer properties after controller is' +
      ' initialized', fakeAsync(() => {
      let unresolvedAnswers = component.unresolvedAnswers[0];

      let finishTrainingResult = {
        answerIndex: 0,
        answer: 'answer Data for truncateInputBasedOnInteractionAnswerType'
      };
      component.interactionId = 'TextInput';

      onchange.emit(finishTrainingResult);
      tick();

      expect(unresolvedAnswers.answer).toBe('Answer Text');
      expect(unresolvedAnswers.answerTemplate).toBe('');
      expect(unresolvedAnswers.feedbackHtml).toBe('This is a html feedback');
    }));

    it('should confirm answer assignment when its type is default_outcome',
      () => {
        spyOn(alertsService, 'addSuccessMessage');
        spyOn(trainingDataService, 'associateWithDefaultResponse').and
          .callFake(() => {});
        component.confirmAnswerAssignment(0);

        expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
          'The answer Answer Text has been successfully trained.', 2000);
      });

    it('should return when its type is not default_outcome',
      () => {
        component.unresolvedAnswers = [
          {
            answer: 'Answer Text',
            answerTemplate: '',
            classificationResult: new AnswerClassificationResult(
              {} as Outcome, 0, 0, 'default_outcome'),
            feedbackHtml: 'This is a html feedback'
          },
          {
            answer: 'Answer Text',
            answerTemplate: '',
            classificationResult: new AnswerClassificationResult(
              {} as Outcome, 0, 0, 'default_outcome'),
            feedbackHtml: 'This is a html feedback'
          }
        ];

        spyOn(alertsService, 'addSuccessMessage');
        spyOn(trainingDataService, 'associateWithDefaultResponse').and
          .callFake(() => {});
        component.confirmAnswerAssignment(0);

        expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
          'The answer Answer Text has been successfully trained.', 2000);
      });

    it('should confirm answer assignment when its type is not default_outcome',
      () => {
        spyOn(alertsService, 'addSuccessMessage');
        spyOn(trainingDataService, 'associateWithAnswerGroup').and
          .callFake(() => {});

        // Mocking the answer object to change its type manually because
        // the controller has a lot of dependencies and can make it
        // hard to understand.
        Object.defineProperty(component, 'unresolvedAnswers', {
          get: () => undefined
        });
        spyOnProperty(component, 'unresolvedAnswers').and.returnValue([
          {} as UnresolvedAnswer,
          {
            answer: 'Correct answer',
            classificationResult: {
              classificationCategorization: 'explicit',
              answerGroupIndex: 0
            },
          } as UnresolvedAnswer
        ]);
        component.confirmAnswerAssignment(1);

        expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
          'The answer Correct a... has been successfully trained.', 2000);
      });

    it('should open train unresolved answer modal', () => {
      spyOn(trainingModalService, 'openTrainUnresolvedAnswerModal').and
        .callFake(function(InteractionAnswer, interactionId, answerIndex) {
        });

      component.openTrainUnresolvedAnswerModal(0);

      expect(trainingModalService.openTrainUnresolvedAnswerModal)
        .toHaveBeenCalled();
    });

    it('should show Unresolved Answers', () => {
      let outcome = new Outcome(
        '', '', new SubtitledHtml('html', 'html'),
        false, [], '', '');
      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(
          new AnswerClassificationResult(outcome, 0, 0, 'Answers'));
      spyOn(trainingDataService, 'isConfirmedUnclassifiedAnswer')
        .and.returnValue(false);
      let unresolvedAnswers = [{
        answer: {} as InteractionAnswer,
      }];
      component.showUnresolvedAnswers(unresolvedAnswers);
    });

    it('should call teachOppiaModalBackendApiService to fetch data',
      fakeAsync(() => {
        let response = {
          data: {
            unresolved_answers: [],
          }
        };

        spyOn(component, 'showUnresolvedAnswers').and.stub();
        spyOn(teachOppiaModalBackendApiService, 'fetchTeachOppiaModalDataAsync')
          .and.returnValue(
            Promise.resolve(response)
          );

        component.ngOnInit();
        tick();

        expect(component.showUnresolvedAnswers).toHaveBeenCalled();
      }));
  });
});
