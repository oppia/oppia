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
 * @fileoverview Unit tests for Question Editor Component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { Solution } from 'domain/exploration/SolutionObjectFactory';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { QuestionUpdateService } from 'domain/question/question-update.service';
import { QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { EditabilityService } from 'services/editability.service';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { QuestionEditorComponent } from './question-editor.component';

describe('Question Editor Component', () => {
  let component: QuestionEditorComponent;
  let fixture: ComponentFixture<QuestionEditorComponent>;
  let questionObjectFactory: QuestionObjectFactory;
  let editabilityService: EditabilityService;
  let stateEditorService: StateEditorService;
  let stateInteractionIdService: StateInteractionIdService;
  let questionUpdateService: QuestionUpdateService;
  let generateContentIdService: GenerateContentIdService;
  let question = null;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        QuestionEditorComponent
      ],
      providers: [
        QuestionObjectFactory,
        EditabilityService,
        StateEditorService,
        StateInteractionIdService,
        QuestionUpdateService,
        GenerateContentIdService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionEditorComponent);
    component = fixture.componentInstance;

    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    stateEditorService = TestBed.inject(StateEditorService);
    stateInteractionIdService = TestBed.inject(StateInteractionIdService);
    editabilityService = TestBed.inject(EditabilityService);
    questionUpdateService = TestBed.inject(QuestionUpdateService);
    generateContentIdService = TestBed.inject(GenerateContentIdService);

    question = questionObjectFactory.createFromBackendDict({
      id: '1',
      question_state_data: {
        content: {
          html: 'Question 1',
          content_id: 'content_1'
        },
        interaction: {
          answer_groups: [{
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
              missing_prerequisite_skill_id: null,
            },
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null
          }],
          confirmed_unclassified_answers: [],
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: ''
              }
            },
            rows: { value: 1 },
            catchMisspellings: {
              value: false
            }
          },
          default_outcome: {
            dest: 'dest',
            dest_if_really_stuck: null,
            feedback: {
              html: 'Correct Answer',
              content_id: 'content_2'
            },
            param_changes: [],
            labelled_as_correct: true,
            missing_prerequisite_skill_id: null,
            refresher_exploration_id: null
          },
          hints: [{
            hint_content: {
              html: 'Hint 1',
              content_id: 'content_3'
            }
          }],
          solution: {
            correct_answer: 'This is the correct answer',
            answer_is_exclusive: false,
            explanation: {
              html: 'Solution explanation',
              content_id: 'content_4'
            }
          },
          id: 'TextInput'
        },
        param_changes: [],
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {
              en: {
                filename: 'filename1.mp3',
                file_size_bytes: 100000,
                needs_update: false,
                duration_secs: 10.0
              },
              hi: {
                filename: 'filename2.mp3',
                file_size_bytes: 11000,
                needs_update: false,
                duration_secs: 0.11
              }
            }
          }
        },
        classifier_model_id: null,
        solicit_answer_details: false,
        card_is_checkpoint: false,
        linked_skill_id: null,
      },
      next_content_id_index: 1,
      inapplicable_skill_misconception_ids: [],
      language_code: 'en',
      linked_skill_ids: [],
      question_state_data_schema_version: 44,
      version: 45
    });
    component.question = question;
    component.questionStateData = question.getStateData();

    spyOn(questionUpdateService, 'setQuestionStateData')
      .and.callFake((question, update) => {
        update();
      });

    component.userCanEditQuestion = true;
    component.misconceptionsBySkill = {};
  });


  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should set component properties on initialization', () => {
    expect(component.oppiaBlackImgUrl).toBeUndefined();
    expect(component.interactionIsShown).toBe(undefined);
    expect(component.stateEditorIsInitialized).toBe(undefined);

    component.ngOnInit();

    expect(component.oppiaBlackImgUrl)
      .toBe('/assets/images/avatar/oppia_avatar_100px.svg');
    expect(component.interactionIsShown).toBe(true);
    expect(component.stateEditorIsInitialized).toBe(true);
  });

  it('should mark editability service as true if question is editable', () => {
    component.userCanEditQuestion = true;
    spyOn(editabilityService, 'markEditable');

    component.ngOnInit();

    expect(editabilityService.markEditable).toHaveBeenCalled();
  });

  it('should mark editability service as false if question is not' +
    ' editable', () => {
    component.userCanEditQuestion = false;
    spyOn(editabilityService, 'markNotEditable');

    component.ngOnInit();

    expect(editabilityService.markNotEditable).toHaveBeenCalled();
  });

  it('should initialize component properties when state editor directive' +
    ' is initialized', () => {
    let onStateEditorDirectiveInitializedEmitter = new EventEmitter();
    spyOnProperty(
      stateEditorService, 'onStateEditorDirectiveInitialized')
      .and.returnValue(onStateEditorDirectiveInitializedEmitter);

    component.ngOnInit();

    component.interactionIsShown = false;
    component.stateEditorIsInitialized = false;

    onStateEditorDirectiveInitializedEmitter.emit();

    expect(component.interactionIsShown).toBe(true);
    expect(component.stateEditorIsInitialized).toBe(true);
  });

  it('should initialize component properties when interaction editor' +
    ' is initialized', fakeAsync(() => {
    let onInteractionEditorInitializedEmitter = new EventEmitter();
    spyOnProperty(
      stateEditorService, 'onInteractionEditorInitialized')
      .and.returnValue(onInteractionEditorInitializedEmitter);

    component.ngOnInit();

    component.interactionIsShown = false;
    component.stateEditorIsInitialized = false;

    onInteractionEditorInitializedEmitter.emit();
    tick();

    expect(component.interactionIsShown).toBe(true);
    expect(component.stateEditorIsInitialized).toBe(true);
  }));

  it('should initialize component properties when interaction id' +
    ' is changed', () => {
    let onInteractionIdChangedEmitter = new EventEmitter();
    spyOnProperty(
      stateInteractionIdService, 'onInteractionIdChanged')
      .and.returnValue(onInteractionIdChangedEmitter);

    component.ngOnInit();

    component.interactionIsShown = false;
    component.stateEditorIsInitialized = false;

    onInteractionIdChangedEmitter.emit();

    expect(component.interactionIsShown).toBe(true);
    expect(component.stateEditorIsInitialized).toBe(true);
  });

  it('should get state content save button placeholder', () => {
    expect(component.getStateContentSaveButtonPlaceholder())
      .toBe('Save Question');
  });

  it('should get state content placeholder', () => {
    expect(component.getStateContentPlaceholder())
      .toBe('Type your question here.');
  });

  it('should save state content when user clicks on save', () => {
    expect(component.interactionIsShown).toBe(undefined);
    expect(component.questionStateData.content)
      .toEqual(SubtitledHtml.createFromBackendDict({
        html: 'Question 1',
        content_id: 'content_1'
      }));

    component.saveStateContent(
      new SubtitledHtml('New content', 'New content')
    );

    expect(component.interactionIsShown).toBe(true);
    expect(component.questionStateData.content).toEqual(
      new SubtitledHtml('New content', 'New content'));
  });

  it('should save interaction data when interaction is saved', () => {
    spyOn(stateEditorService, 'setInteractionId');
    spyOn(stateEditorService, 'setInteractionCustomizationArgs');

    let newInteractionData = {
      interactionId: 'Text Input',
      customizationArgs: 'Customization Args'
    };
    component.saveInteractionData(newInteractionData);

    expect(stateEditorService.setInteractionId)
      .toHaveBeenCalledWith(newInteractionData.interactionId);
    expect(stateEditorService.setInteractionCustomizationArgs)
      .toHaveBeenCalledWith(newInteractionData.customizationArgs);
  });

  it('should save interaction answer groups when interaction is saved', () => {
    spyOn(stateEditorService, 'setInteractionAnswerGroups');

    component.saveInteractionAnswerGroups([]);

    expect(stateEditorService.setInteractionAnswerGroups).toHaveBeenCalledWith(
      []
    );
  });

  it('should save interaction default outcome when' +
    ' interaction is saved', () => {
    spyOn(stateEditorService, 'setInteractionDefaultOutcome');

    component.saveInteractionDefaultOutcome({dest: 'New outcome'} as Outcome);

    expect(stateEditorService.setInteractionDefaultOutcome)
      .toHaveBeenCalledWith({dest: 'New outcome'} as Outcome);
  });

  it('should set interaction solution when interaction is saved', () => {
    spyOn(stateEditorService, 'setInteractionSolution');

    // This throws "Argument of type 'null' is not assignable to parameter of
    // type 'ExplorationHtmlFormatterService'." We need to suppress this error
    // because of the need to test validations. This error is thrown because
    // the value of 'htmlFormatter' is null.
    // @ts-ignore
    let solution = new Solution(null, null, null, null);
    component.saveSolution(solution);

    expect(stateEditorService.setInteractionSolution)
      .toHaveBeenCalledWith(solution);
  });

  it('should save hints when interaction is saved', () => {
    spyOn(stateEditorService, 'setInteractionHints');

    component.saveHints([]);

    expect(stateEditorService.setInteractionHints)
      .toHaveBeenCalledWith([]);
  });

  it('should save inapplicable skill misconception ID when interaction' +
    ' is saved', () => {
    spyOn(stateEditorService, 'setInapplicableSkillMisconceptionIds');

    component.saveInapplicableSkillMisconceptionIds(['InapplicableID']);

    expect(stateEditorService.setInapplicableSkillMisconceptionIds)
      .toHaveBeenCalledWith(['InapplicableID']);
  });

  it('should save next content ID index after generating new id', () => {
    component.ngOnInit();

    expect(component.nextContentIdIndexDisplayedValue).toBe(1);
    expect(component.nextContentIdIndexMemento).toBe(1);

    generateContentIdService.getNextStateId('interaction');
    component.saveNextContentIdIndex();

    expect(component.nextContentIdIndexDisplayedValue).toBe(2);
    expect(component.nextContentIdIndexMemento).toBe(2);
  });

  it('should restore next content ID index if needed', () => {
    component.ngOnInit();

    expect(component.nextContentIdIndexDisplayedValue).toBe(1);
    expect(component.nextContentIdIndexMemento).toBe(1);

    generateContentIdService.getNextStateId('interaction');

    expect(component.nextContentIdIndexDisplayedValue).toBe(2);
    expect(component.nextContentIdIndexMemento).toBe(1);

    generateContentIdService.revertUnusedContentIdIndex();

    expect(component.nextContentIdIndexDisplayedValue).toBe(1);
    expect(component.nextContentIdIndexMemento).toBe(1);
  });
});
