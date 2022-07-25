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

import { EventEmitter } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('QuestionEditorComponent', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
  var ngbModal: NgbModal;
  let $q = null;

  let QuestionObjectFactory: QuestionObjectFactory;
  let EditabilityService = null;
  let StateEditorService = null;
  let StateInteractionIdService = null;
  let QuestionUpdateService = null;

  let question = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    ngbModal = $injector.get('NgbModal');
    $q = $injector.get('$q');

    QuestionObjectFactory = $injector.get('QuestionObjectFactory');
    EditabilityService = $injector.get('EditabilityService');
    StateEditorService = $injector.get('StateEditorService');
    StateInteractionIdService = $injector.get('StateInteractionIdService');
    QuestionUpdateService = $injector.get('QuestionUpdateService');

    ctrl = $componentController('questionEditor', {
      $scope: $scope
    }, {
      canEditQuestion: () => {},
      getMisconceptionsBySkill: () => {},
      questionChanged: () => {}
    });

    question = QuestionObjectFactory.createFromBackendDict({
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
            training_data: null,
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
            rows: { value: 1 }
          },
          default_outcome: {
            dest: null,
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
        written_translations: {
          translations_mapping: {
            content: {
              en: {
                data_format: '',
                needs_update: false,
                translation: ''
              }
            }
          }
        },
        classifier_model_id: null,
        solicit_answer_details: false,
        card_is_checkpoint: false,
        linked_skill_id: null,
        next_content_id_index: null,
      },
      inapplicable_skill_misconception_ids: null,
      language_code: 'en',
      linked_skill_ids: [],
      question_state_data_schema_version: 44,
      version: 45
    });
    ctrl.question = question;
    ctrl.questionStateData = question.getStateData();

    spyOn(QuestionUpdateService, 'setQuestionStateData')
      .and.callFake((question, update) => {
        update();
      });
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should set component properties on initialization', () => {
    expect(ctrl.oppiaBlackImgUrl).toBe(undefined);
    expect(ctrl.interactionIsShown).toBe(undefined);
    expect(ctrl.stateEditorInitialized).toBe(undefined);

    ctrl.$onInit();

    expect(ctrl.oppiaBlackImgUrl)
      .toBe('/assets/images/avatar/oppia_avatar_100px.svg');
    expect(ctrl.interactionIsShown).toBe(true);
    expect(ctrl.stateEditorInitialized).toBe(true);
  });

  it('should mark editability service as true if question is editable', () => {
    spyOn(ctrl, 'canEditQuestion').and.returnValue(true);
    spyOn(EditabilityService, 'markEditable');

    ctrl.$onInit();

    expect(EditabilityService.markEditable).toHaveBeenCalled();
  });

  it('should mark editability service as false if question is not' +
    ' editable', () => {
    spyOn(ctrl, 'canEditQuestion').and.returnValue(false);
    spyOn(EditabilityService, 'markNotEditable');

    ctrl.$onInit();

    expect(EditabilityService.markNotEditable).toHaveBeenCalled();
  });

  it('should initialize component properties when state editor directive' +
    ' is initialized', () => {
    let onStateEditorDirectiveInitializedEmitter = new EventEmitter();
    spyOnProperty(
      StateEditorService, 'onStateEditorDirectiveInitialized')
      .and.returnValue(onStateEditorDirectiveInitializedEmitter);

    ctrl.$onInit();

    ctrl.interactionIsShown = false;
    ctrl.stateEditorInitialized = false;

    onStateEditorDirectiveInitializedEmitter.emit();
    $scope.$apply();

    expect(ctrl.interactionIsShown).toBe(true);
    expect(ctrl.stateEditorInitialized).toBe(true);
  });

  it('should initialize component properties when interaction editor' +
    ' is initialized', () => {
    let onInteractionEditorInitializedEmitter = new EventEmitter();
    spyOnProperty(
      StateEditorService, 'onInteractionEditorInitialized')
      .and.returnValue(onInteractionEditorInitializedEmitter);

    ctrl.$onInit();

    ctrl.interactionIsShown = false;
    ctrl.stateEditorInitialized = false;

    onInteractionEditorInitializedEmitter.emit();
    $scope.$apply();

    expect(ctrl.interactionIsShown).toBe(true);
    expect(ctrl.stateEditorInitialized).toBe(true);
  });

  it('should initialize component properties when interaction id' +
    ' is changed', () => {
    let onInteractionIdChangedEmitter = new EventEmitter();
    spyOnProperty(
      StateInteractionIdService, 'onInteractionIdChanged')
      .and.returnValue(onInteractionIdChangedEmitter);

    ctrl.$onInit();

    ctrl.interactionIsShown = false;
    ctrl.stateEditorInitialized = false;

    onInteractionIdChangedEmitter.emit();
    $scope.$apply();

    expect(ctrl.interactionIsShown).toBe(true);
    expect(ctrl.stateEditorInitialized).toBe(true);
  });

  it('should get state content save button placeholder', () => {
    expect(ctrl.getStateContentSaveButtonPlaceholder()).toBe('Save Question');
  });

  it('should get state content placeholder', () => {
    expect(ctrl.getStateContentPlaceholder()).toBe('Type your question here.');
  });

  it('should return undefined when calling functions which are not applicable' +
    ' to question state', () => {
    expect(ctrl.navigateToState()).toBe(undefined);
    expect(ctrl.addState()).toBe(undefined);
    expect(ctrl.recomputeGraph()).toBe(undefined);
    expect(ctrl.refreshWarnings()).toBe(undefined);
  });

  it('should save state content when user clicks on save', () => {
    expect(ctrl.interactionIsShown).toBe(undefined);
    expect(ctrl.questionStateData.content)
      .toEqual(SubtitledHtml.createFromBackendDict({
        html: 'Question 1',
        content_id: 'content_1'
      }));

    ctrl.saveStateContent('New content');

    expect(ctrl.interactionIsShown).toBe(true);
    expect(ctrl.questionStateData.content).toBe('New content');
  });

  it('should save interaction ID when interaction is saved', () => {
    spyOn(StateEditorService, 'setInteractionId');

    ctrl.saveInteractionId('TextInput');

    expect(StateEditorService.setInteractionId).toHaveBeenCalledWith(
      'TextInput'
    );
  });

  it('should save interaction answer groups when interaction is saved', () => {
    spyOn(StateEditorService, 'setInteractionAnswerGroups');

    ctrl.saveInteractionAnswerGroups('New Answer Group');

    expect(StateEditorService.setInteractionAnswerGroups).toHaveBeenCalledWith(
      'New Answer Group'
    );
  });

  it('should save interaction default outcome when' +
    ' interaction is saved', () => {
    spyOn(StateEditorService, 'setInteractionDefaultOutcome');

    ctrl.saveInteractionDefaultOutcome('New outcome');

    expect(StateEditorService.setInteractionDefaultOutcome)
      .toHaveBeenCalledWith('New outcome');
  });

  it('should save customization args when interaction is saved', () => {
    spyOn(StateEditorService, 'setInteractionCustomizationArgs');

    ctrl.saveInteractionCustomizationArgs('Customization Args');

    expect(StateEditorService.setInteractionCustomizationArgs)
      .toHaveBeenCalledWith('Customization Args');
  });

  it('should set interaction solution when interaction is saved', () => {
    spyOn(StateEditorService, 'setInteractionSolution');

    ctrl.saveSolution('Solution');

    expect(StateEditorService.setInteractionSolution)
      .toHaveBeenCalledWith('Solution');
  });

  it('should save hints when interaction is saved', () => {
    spyOn(StateEditorService, 'setInteractionHints');

    ctrl.saveHints('Hints');

    expect(StateEditorService.setInteractionHints)
      .toHaveBeenCalledWith('Hints');
  });

  it('should save inapplicable skill misconception ID when interaction' +
    ' is saved', () => {
    spyOn(StateEditorService, 'setInapplicableSkillMisconceptionIds');

    ctrl.saveInapplicableSkillMisconceptionIds('InapplicableID');

    expect(StateEditorService.setInapplicableSkillMisconceptionIds)
      .toHaveBeenCalledWith('InapplicableID');
  });

  it('should save next content ID index when interaction is saved', () => {
    expect(ctrl.questionStateData.nextContentIdIndex).toBe(null);

    ctrl.saveNextContentIdIndex('Next ID');

    expect(ctrl.questionStateData.nextContentIdIndex).toBe('Next ID');
  });

  it('should show mark all audio needing update modal and mark all unflagged' +
    ' voiceovers and translations as needing update', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: $q.resolve()
    } as NgbModalRef);

    expect(
      ctrl.questionStateData.recordedVoiceovers
        .voiceoversMapping.content.en.needsUpdate).toEqual(false);
    expect(
      ctrl.questionStateData.writtenTranslations
        .translationsMapping.content.en.needsUpdate).toEqual(false);

    ctrl.showMarkAllAudioAsNeedingUpdateModalIfRequired(['content']);
    $scope.$apply();

    expect(
      ctrl.questionStateData.recordedVoiceovers
        .voiceoversMapping.content.en.needsUpdate).toEqual(true);
    expect(
      ctrl.questionStateData.writtenTranslations
        .translationsMapping.content.en.needsUpdate).toEqual(true);
  });
});
