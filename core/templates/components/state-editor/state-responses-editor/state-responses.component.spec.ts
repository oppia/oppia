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

import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AnswerGroupObjectFactory } from 'domain/exploration/AnswerGroupObjectFactory';
import { Interaction, InteractionObjectFactory } from 'domain/exploration/InteractionObjectFactory';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { Rule } from 'domain/exploration/RuleObjectFactory';
import { MisconceptionObjectFactory } from 'domain/skill/MisconceptionObjectFactory';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

/**
 * @fileoverview Unit tests for StateResponsesComponent.
 */

describe('StateResponsesComponent', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
  let $uibModal = null;
  let $q = null;
  let WindowDimensionsService = null;
  let StateEditorService = null;
  let ResponsesService = null;
  let StateInteractionIdService = null;
  let StateCustomizationArgsService = null;
  let interactionObjectFactory: InteractionObjectFactory;
  let interactionData: Interaction;
  let outcomeObjectFactory: OutcomeObjectFactory;
  let answerGroupObjectFactory: AnswerGroupObjectFactory;
  let answerGroups;
  let defaultOutcome;
  let misconceptionObjectFactory: MisconceptionObjectFactory;
  let ExternalSaveService = null;
  let StateSolicitAnswerDetailsService = null;
  let AlertsService = null;
  let ngbModal: NgbModal = null;

  let defaultsOutcomesToSuppressWarnings = [
    {
      dest: 'State 4',
      feedback: {
        content_id: 'feedback_1',
        html: ''
      },
      param_changes: [],
      refresher_exploration_id: null,
      labelled_as_correct: false,
      missing_prerequisite_skill_id: ''
    },
    {
      dest: 'State 5',
      feedback: {
        content_id: 'feedback_2',
        html: "Let's go to state 5 ImageAndRegion"
      },
      param_changes: [],
      refresher_exploration_id: null,
      labelled_as_correct: false,
      missing_prerequisite_skill_id: ''
    }
  ];

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    interactionObjectFactory = TestBed.get(InteractionObjectFactory);
    outcomeObjectFactory = TestBed.get(OutcomeObjectFactory);
    answerGroupObjectFactory = TestBed.get(AnswerGroupObjectFactory);
    misconceptionObjectFactory = TestBed.get(MisconceptionObjectFactory);
    ngbModal = TestBed.inject(NgbModal);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  beforeEach(angular.mock.inject(
    function($injector, $componentController) {
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      $uibModal = $injector.get('$uibModal');
      $q = $injector.get('$q');
      ngbModal = $injector.get('NgbModal');

      WindowDimensionsService = $injector.get('WindowDimensionsService');
      StateEditorService = $injector.get('StateEditorService');
      ResponsesService = $injector.get('ResponsesService');
      StateInteractionIdService = $injector.get('StateInteractionIdService');
      StateCustomizationArgsService = $injector
        .get('StateCustomizationArgsService');
      ExternalSaveService = $injector.get('ExternalSaveService');
      StateSolicitAnswerDetailsService = $injector
        .get('StateSolicitAnswerDetailsService');
      AlertsService = $injector.get('AlertsService');

      interactionData = interactionObjectFactory.createFromBackendDict({
        id: 'TextInput',
        answer_groups: [
          {
            outcome: {
              dest: 'State',
              feedback: {
                html: '',
                content_id: 'This is a new feedback text',
              },
              refresher_exploration_id: 'test',
              missing_prerequisite_skill_id: 'test_skill_id',
              labelled_as_correct: false,
              param_changes: [],
            },
            rule_specs: [{
              rule_type: 'Contains',
              inputs: {x: {
                contentId: 'rule_input',
                normalizedStrSet: ['abc']
              }}
            }],
            training_data: [],
            tagged_skill_misconception_id: 'misconception1',
          },
        ],
        default_outcome: {
          dest: 'Hola',
          feedback: {
            content_id: '',
            html: '',
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: 'test',
          missing_prerequisite_skill_id: 'test_skill_id',
        },
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: true,
          },
          placeholder: {
            value: 1,
          },
        },
        hints: [],
        solution: {
          answer_is_exclusive: true,
          correct_answer: 'test_answer',
          explanation: {
            content_id: '2',
            html: 'test_explanation1',
          },
        },
      });

      answerGroups = [answerGroupObjectFactory
        .createFromBackendDict({
          rule_specs: [{
            rule_type: 'Contains',
            inputs: {x: {
              contentId: 'rule_input',
              normalizedStrSet: ['abc']
            }}
          }],
          outcome: {
            dest: 'State',
            feedback: {
              html: '',
              content_id: 'This is a new feedback text'
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: 'test',
            missing_prerequisite_skill_id: 'test_skill_id'
          },
          training_data: [],
          tagged_skill_misconception_id: 'misconception1'
        }, 'TextInput')
      ];
      defaultOutcome = outcomeObjectFactory.createFromBackendDict({
        dest: 'Hola',
        feedback: {
          content_id: '',
          html: ''
        },
        labelled_as_correct: true,
        param_changes: [],
        refresher_exploration_id: 'test',
        missing_prerequisite_skill_id: 'test_skill_id'
      });


      ctrl = $componentController('stateResponses', {
        $scope: $scope
      });

      ctrl.onSaveInteractionDefaultOutcome = jasmine.createSpy(
        'saveInteraction', () => {});
      ctrl.onSaveInteractionAnswerGroups = jasmine.createSpy(
        'saveAnswerGroup', () => {});
      ctrl.onResponsesInitialized = jasmine.createSpy(
        'responseInitialized', () => {});
      ctrl.refreshWarnings = () => jasmine.createSpy(
        'refreshWarnings', () => {});
      ctrl.onSaveInapplicableSkillMisconceptionIds = jasmine.createSpy(
        'saveInapplicableSkillMisconceptionIds', () => {});
      ctrl.onSaveSolicitAnswerDetails = jasmine.createSpy(
        'saveSolicitAnswerDetails', () => {});
      ctrl.onSaveNextContentIdIndex = jasmine.createSpy(
        'saveNextContentIdIndex', () => {});
    }));

  it('should set component properties on initialization', () => {
    spyOn(WindowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    spyOn(StateEditorService, 'getActiveStateName').and.returnValue('Hola');
    spyOn(StateEditorService, 'getInapplicableSkillMisconceptionIds')
      .and.returnValue(['id1']);

    expect($scope.responseCardIsShown).toBe(undefined);
    expect($scope.enableSolicitAnswerDetailsFeature).toBe(undefined);
    expect($scope.SHOW_TRAINABLE_UNRESOLVED_ANSWERS).toBe(undefined);
    expect($scope.stateName).toBe(undefined);
    expect($scope.misconceptionsBySkill).toEqual(undefined);
    expect($scope.inapplicableSkillMisconceptionIds).toEqual(undefined);

    ctrl.$onInit();

    expect($scope.responseCardIsShown).toBe(false);
    expect($scope.enableSolicitAnswerDetailsFeature).toBe(true);
    expect($scope.SHOW_TRAINABLE_UNRESOLVED_ANSWERS).toBe(false);
    expect($scope.stateName).toBe('Hola');
    expect($scope.misconceptionsBySkill).toEqual({});
    expect($scope.inapplicableSkillMisconceptionIds).toEqual(['id1']);

    ctrl.$onDestroy();
  });

  it('should subscribe to events on component initialization', () => {
    spyOn(ResponsesService.onInitializeAnswerGroups, 'subscribe');
    spyOn(StateInteractionIdService.onInteractionIdChanged, 'subscribe');
    spyOn(ResponsesService.onAnswerGroupsChanged, 'subscribe');
    spyOn(StateEditorService.onUpdateAnswerChoices, 'subscribe');
    spyOn(StateEditorService.onHandleCustomArgsUpdate, 'subscribe');
    spyOn(StateEditorService.onStateEditorInitialized, 'subscribe');

    ctrl.$onInit();

    expect(ResponsesService.onInitializeAnswerGroups.subscribe)
      .toHaveBeenCalled();
    expect(StateInteractionIdService.onInteractionIdChanged.subscribe)
      .toHaveBeenCalled();
    expect(ResponsesService.onAnswerGroupsChanged.subscribe).toHaveBeenCalled();
    expect(StateEditorService.onUpdateAnswerChoices.subscribe)
      .toHaveBeenCalled();
    expect(StateEditorService.onHandleCustomArgsUpdate.subscribe)
      .toHaveBeenCalled();
    expect(StateEditorService.onStateEditorInitialized.subscribe)
      .toHaveBeenCalled();

    ctrl.$onDestroy();
  });

  it('should set answer group and default answer when answer' +
    ' groups are initialized', () => {
    let onInitializeAnswerGroupsEmitter = new EventEmitter();
    spyOnProperty(ResponsesService, 'onInitializeAnswerGroups')
      .and.returnValue(onInitializeAnswerGroupsEmitter);
    spyOn(ResponsesService, 'changeActiveAnswerGroupIndex');
    spyOn($scope, 'isCurrentInteractionLinear').and.returnValue(true);

    ctrl.$onInit();

    onInitializeAnswerGroupsEmitter.emit(interactionData);

    expect($scope.defaultOutcome).toEqual(defaultOutcome);
    expect($scope.answerGroups).toEqual(answerGroups);
    expect(ResponsesService.changeActiveAnswerGroupIndex)
      .toHaveBeenCalledWith(0);

    ctrl.$onDestroy();
  });

  it('should re-initialize properties and open add answer group modal when' +
    ' interaction is changed to a non-linear and non-terminal one', () => {
    let onInteractionIdChangedEmitter = new EventEmitter();
    spyOn(ResponsesService, 'getAnswerGroups').and.returnValue(answerGroups);
    spyOn(ResponsesService, 'getActiveAnswerGroupIndex').and.returnValue(0);
    spyOnProperty(StateInteractionIdService, 'onInteractionIdChanged')
      .and.returnValue(onInteractionIdChangedEmitter);
    spyOn(ResponsesService, 'onInteractionIdChanged').and.callFake(
      (options, callback) => {
        callback();
      });
    spyOn(StateEditorService, 'isInQuestionMode').and.returnValue(true);
    spyOn(ResponsesService, 'getDefaultOutcome').and.returnValue(
      defaultOutcome);
    spyOn($scope, 'openAddAnswerGroupModal');

    expect($scope.answerGroups).toEqual(undefined);
    expect($scope.defaultOutcome).toEqual(undefined);
    expect($scope.activeAnswerGroupIndex).toBe(undefined);

    ctrl.$onInit();
    onInteractionIdChangedEmitter.emit('ImageClickInput');

    expect($scope.answerGroups).toEqual(answerGroups);
    expect($scope.defaultOutcome).toEqual(defaultOutcome);
    expect($scope.activeAnswerGroupIndex).toBe(0);
    expect($scope.openAddAnswerGroupModal).toHaveBeenCalled();

    ctrl.$onDestroy();
  });

  it('should not open add answer group modal when interaction is' +
    ' changed to a linear and terminal one', () => {
    let onInteractionIdChangedEmitter = new EventEmitter();
    spyOnProperty(StateInteractionIdService, 'onInteractionIdChanged')
      .and.returnValue(onInteractionIdChangedEmitter);
    spyOn($scope, 'openAddAnswerGroupModal');

    ctrl.$onInit();
    onInteractionIdChangedEmitter.emit('Continue');

    expect($scope.openAddAnswerGroupModal).not.toHaveBeenCalled();

    ctrl.$onDestroy();
  });

  it('should get new answer groups, default outcome and verify/update' +
    ' inapplicable skill misconception ids on answer groups change', () => {
    let onAnswerGroupsChangedEmitter = new EventEmitter();
    spyOn(ResponsesService, 'getAnswerGroups').and.returnValue(answerGroups);
    spyOnProperty(ResponsesService, 'onAnswerGroupsChanged')
      .and.returnValue(onAnswerGroupsChangedEmitter);
    spyOn(ResponsesService, 'getActiveAnswerGroupIndex').and.returnValue(0);
    spyOn(ResponsesService, 'getDefaultOutcome').and.returnValue(
      defaultOutcome);
    spyOn(StateEditorService, 'getInapplicableSkillMisconceptionIds')
      .and.returnValue(['misconception1']);

    expect($scope.answerGroups).toEqual(undefined);
    expect($scope.defaultOutcome).toEqual(undefined);
    expect($scope.activeAnswerGroupIndex).toBe(undefined);
    expect($scope.inapplicableSkillMisconceptionIds).toEqual(undefined);

    ctrl.$onInit();

    expect($scope.inapplicableSkillMisconceptionIds)
      .toEqual(['misconception1']);

    onAnswerGroupsChangedEmitter.emit();

    expect($scope.answerGroups).toEqual(answerGroups);
    expect($scope.defaultOutcome).toEqual(defaultOutcome);
    expect($scope.activeAnswerGroupIndex).toBe(0);
    expect($scope.inapplicableSkillMisconceptionIds).toEqual([]);

    ctrl.$onDestroy();
  });

  it('should update answer choices', () => {
    let onUpdateAnswerChoicesEmitter = new EventEmitter();
    spyOnProperty(StateEditorService, 'onUpdateAnswerChoices')
      .and.returnValue(onUpdateAnswerChoicesEmitter);
    spyOn(ResponsesService, 'updateAnswerChoices');

    ctrl.$onInit();
    onUpdateAnswerChoicesEmitter.emit();

    expect(ResponsesService.updateAnswerChoices).toHaveBeenCalled();

    ctrl.$onDestroy();
  });

  it('should update custom arguments', () => {
    let onHandleCustomArgsUpdateEmitter = new EventEmitter();
    spyOnProperty(StateEditorService, 'onHandleCustomArgsUpdate')
      .and.returnValue(onHandleCustomArgsUpdateEmitter);
    spyOn(ResponsesService, 'handleCustomArgsUpdate').and.callFake(
      (newAnswerChoices, callback) => {
        callback();
      }
    );

    ctrl.$onInit();
    onHandleCustomArgsUpdateEmitter.emit();

    expect(ctrl.onSaveInteractionAnswerGroups).toHaveBeenCalled();

    ctrl.$onDestroy();
  });

  it('should set misconceptions when state editor is initialized', () => {
    let onStateEditorInitializedEmitter = new EventEmitter();
    spyOnProperty(StateEditorService, 'onStateEditorInitialized')
      .and.returnValue(onStateEditorInitializedEmitter);
    spyOn(StateEditorService, 'getMisconceptionsBySkill')
      .and.returnValue({
        skill1: [misconceptionObjectFactory.create(
          'm1', 'Misconception 1', 'note', '', false)]
      });

    expect($scope.misconceptionsBySkill).toBe(undefined);
    expect($scope.containsOptionalMisconceptions).toBe(undefined);

    ctrl.$onInit();
    onStateEditorInitializedEmitter.emit();

    expect($scope.misconceptionsBySkill).toEqual({
      skill1: [misconceptionObjectFactory.create(
        'm1', 'Misconception 1', 'note', '', false)]
    });
    expect($scope.containsOptionalMisconceptions).toBe(true);

    ctrl.$onDestroy();
  });

  it('should set active answer group index as -1 when starting sorting', () => {
    let ui = {
      placeholder: {
        height: () => {}
      },
      item: {
        height: () => {}
      }
    };

    spyOn(ResponsesService, 'getActiveAnswerGroupIndex').and.returnValue(-1);
    spyOn(ExternalSaveService.onExternalSave, 'emit');

    expect($scope.activeAnswerGroupIndex).toBe(undefined);

    ctrl.$onInit();
    $scope.ANSWER_GROUP_LIST_SORTABLE_OPTIONS.start('', ui);

    expect($scope.activeAnswerGroupIndex).toBe(-1);
    expect(ExternalSaveService.onExternalSave.emit).toHaveBeenCalled();

    ctrl.$onDestroy();
  });

  it('should save answer groups and default outcome when sorting stops', () => {
    spyOn(ResponsesService, 'save').and.callFake(
      (answerGroups, defaultOutcome, callback) => {
        callback(answerGroups, defaultOutcome);
      }
    );

    ctrl.$onInit();
    $scope.ANSWER_GROUP_LIST_SORTABLE_OPTIONS.stop();

    expect(ctrl.onSaveInteractionAnswerGroups).toHaveBeenCalled();
    expect(ctrl.onSaveInteractionDefaultOutcome).toHaveBeenCalled();

    ctrl.$onDestroy();
  });

  it('should get static image URL', () => {
    ctrl.$onInit();

    expect($scope.getStaticImageUrl('/image/url'))
      .toBe('/assets/images/image/url');

    ctrl.$onDestroy();
  });

  it('should check if state is in question mode', () => {
    spyOn(StateEditorService, 'isInQuestionMode').and.returnValue(true);

    expect($scope.isInQuestionMode()).toBe(true);
  });

  it('should suppress default answer group warnings if each choice' +
    ' has been handled by at least one answer group for multiple' +
    ' choice interaction', () => {
    // This contains 2 AnswerGroup for a MultipleChoiceInteraction.
    let answerGroups = [
      answerGroupObjectFactory.createFromBackendDict({
        outcome: defaultsOutcomesToSuppressWarnings[0],
        rule_specs: [{
          rule_type: 'Equals',
          inputs: {x: 0}
        }],
        training_data: [],
        tagged_skill_misconception_id: ''
      }, 'MultipleChoiceInput'),
      answerGroupObjectFactory.createFromBackendDict({
        outcome: defaultsOutcomesToSuppressWarnings[1],
        rule_specs: [{
          rule_type: 'Equals',
          inputs: {x: 1}
        }],
        training_data: [],
        tagged_skill_misconception_id: ''
      }, 'MultipleChoiceInput')
    ];
    // This contains 2 AnswerChoice for MultipleChoiceInteraction.
    let answerChoices = [
      {
        val: 0,
        label: 'label1'
      },
      {
        val: 1,
        label: 'label2'
      }
    ];
    StateInteractionIdService.savedMemento = 'MultipleChoiceInput';
    spyOn(ResponsesService, 'getAnswerGroups').and.returnValue(answerGroups);
    spyOn(ResponsesService, 'getAnswerChoices').and.returnValue(answerChoices);

    expect($scope.suppressDefaultAnswerGroupWarnings()).toBe(true);
  });

  it('should suppress default answer group warnings if each choice' +
    ' has been handled by at least one answer group for item' +
    ' selection input interaction', () => {
    // This contains 2 AnswerGroup for a ItemSelectionInput.
    let answerGroups = [
      answerGroupObjectFactory.createFromBackendDict({
        outcome: defaultsOutcomesToSuppressWarnings[0],
        rule_specs: [{
          rule_type: 'Equals',
          inputs: {x: ['ca_0', 'ca_1']}
        }],
        training_data: [],
        tagged_skill_misconception_id: ''
      }, 'ItemSelectionInput'),
      answerGroupObjectFactory.createFromBackendDict({
        outcome: defaultsOutcomesToSuppressWarnings[1],
        rule_specs: [{
          rule_type: 'DoesNotContainAtLeastOneOf',
          inputs: {x: ['ca_0', 'ca_1', 'ca_2']}
        }],
        training_data: [],
        tagged_skill_misconception_id: ''
      }, 'ItemSelectionInput')
    ];
    // This contains 2 AnswerChoice for ItemSelectionInput.
    let answerChoices = [
      {
        value: [{
          content_id: 'ca_choices_3',
          html: '<p>Choice 1</p>'
        }, {
          content_id: 'ca_choices_4',
          html: '<p>Choice 2</p>'
        }]
      }
    ];
    StateInteractionIdService.savedMemento = 'ItemSelectionInput';
    StateCustomizationArgsService.savedMemento = {
      maxAllowableSelectionCount: {
        value: 1
      }
    };
    spyOn(ResponsesService, 'getAnswerGroups').and.returnValue(answerGroups);
    spyOn(ResponsesService, 'getAnswerChoices').and.returnValue(answerChoices);

    expect($scope.suppressDefaultAnswerGroupWarnings()).toBe(true);
  });

  it('should not suppress warnings for interactions other than multiple' +
    ' choice input or item selection input', () => {
    StateInteractionIdService.savedMemento = 'TextInput';

    expect($scope.suppressDefaultAnswerGroupWarnings()).toBe(false);
  });

  it('should save displayed value when solicit answer details' +
    ' are changed', () => {
    spyOn(StateSolicitAnswerDetailsService, 'saveDisplayedValue');

    ctrl.$onInit();

    $scope.onChangeSolicitAnswerDetails();

    expect(ctrl.onSaveSolicitAnswerDetails).toHaveBeenCalled();
    expect(StateSolicitAnswerDetailsService.saveDisplayedValue)
      .toHaveBeenCalled();
  });

  it('should check if outcome has no feedback with self loop', () => {
    $scope.stateName = 'State Name';
    let outcome1 = outcomeObjectFactory.createNew(
      'State Name', '1', '', []);
    let outcome2 = outcomeObjectFactory.createNew(
      'State Name', '1', 'Feedback Text', []);

    expect($scope.isSelfLoopWithNoFeedback(outcome1)).toBe(true);
    expect($scope.isSelfLoopWithNoFeedback(outcome2)).toBe(false);
    expect($scope.isSelfLoopWithNoFeedback(null)).toBe(false);
  });

  it('should check if outcome marked as correct has self loop', () => {
    spyOn(StateEditorService, 'getCorrectnessFeedbackEnabled').and.returnValue(
      true);
    let outcome = outcomeObjectFactory.createFromBackendDict({
      dest: 'State Name',
      feedback: {
        content_id: '',
        html: ''
      },
      labelled_as_correct: true,
      param_changes: [],
      refresher_exploration_id: 'test',
      missing_prerequisite_skill_id: 'test_skill_id'
    });
    $scope.stateName = 'State Name';

    expect($scope.isSelfLoopThatIsMarkedCorrect(outcome)).toBe(true);

    $scope.stateName = 'Hola';

    expect($scope.isSelfLoopThatIsMarkedCorrect(outcome)).toBe(false);
  });

  it('should check if outcome marked as correct has self loop and return' +
    ' false if correctness feedback is not enabled', () => {
    spyOn(StateEditorService, 'getCorrectnessFeedbackEnabled').and.returnValue(
      false);
    let outcome = outcomeObjectFactory.createFromBackendDict({
      dest: 'State Name',
      feedback: {
        content_id: '',
        html: ''
      },
      labelled_as_correct: true,
      param_changes: [],
      refresher_exploration_id: 'test',
      missing_prerequisite_skill_id: 'test_skill_id'
    });
    $scope.stateName = 'State Name';

    expect($scope.isSelfLoopThatIsMarkedCorrect(outcome)).toBe(false);
  });

  it('should show state name input if user is creating new state', () => {
    let outcome1 = outcomeObjectFactory.createNew('/', '', '', []);
    let outcome2 = outcomeObjectFactory.createNew('Hola', '', '', []);

    expect($scope.isCreatingNewState(outcome1)).toBe(true);
    expect($scope.isCreatingNewState(outcome2)).toBe(false);
  });

  it('should check if current interaction is non trivial', () => {
    StateInteractionIdService.savedMemento = 'Continue';

    expect($scope.isCurrentInteractionTrivial()).toBe(true);

    StateInteractionIdService.savedMemento = 'TextInput';

    expect($scope.isCurrentInteractionTrivial()).toBe(false);
  });

  it('should check if the interaction is linear and has feedback', () => {
    StateInteractionIdService.savedMemento = 'Continue';
    let outcome1 = outcomeObjectFactory.createNew('Hola', '', '', []);

    expect($scope.isLinearWithNoFeedback(outcome1)).toBe(true);

    StateInteractionIdService.savedMemento = 'Continue';
    let outcome2 = outcomeObjectFactory.createNew('Hola', '', 'Right!', []);

    expect($scope.isLinearWithNoFeedback(outcome2)).toBe(false);

    StateInteractionIdService.savedMemento = 'TextInput';
    let outcome3 = outcomeObjectFactory.createNew('Hola', '', '', []);

    expect($scope.isLinearWithNoFeedback(outcome3)).toBe(false);

    StateInteractionIdService.savedMemento = 'TextInput';
    let outcome4 = outcomeObjectFactory.createNew('Hola', '', 'Wrong!', []);

    expect($scope.isLinearWithNoFeedback(outcome4)).toBe(false);

    expect($scope.isLinearWithNoFeedback(null)).toBe(false);
  });

  it('should get outcome tooltip text', () => {
    // When outcome has self loop and is labelled correct.
    spyOn(StateEditorService, 'getCorrectnessFeedbackEnabled').and.returnValue(
      true);
    let outcome = outcomeObjectFactory.createFromBackendDict({
      dest: 'State Name',
      feedback: {
        content_id: '',
        html: ''
      },
      labelled_as_correct: true,
      param_changes: [],
      refresher_exploration_id: 'test',
      missing_prerequisite_skill_id: 'test_skill_id'
    });
    $scope.stateName = 'State Name';

    expect($scope.getOutcomeTooltip(outcome)).toBe(
      'Self-loops should not be labelled as correct.');

    // When interaction is linear with no feedback.
    StateInteractionIdService.savedMemento = 'Continue';
    let outcome1 = outcomeObjectFactory.createNew('Hola', '', '', []);

    expect($scope.getOutcomeTooltip(outcome1)).toBe(
      'Please direct the learner to a different card.');

    // When interaction is not linear.
    StateInteractionIdService.savedMemento = 'TextInput';

    expect($scope.getOutcomeTooltip(outcome1)).toBe(
      'Please give Oppia something useful to say,' +
      ' or direct the learner to a different card.');
  });

  it('should open add response modal when user clicks on' +
    ' \'+ ADD RESPONSE\' button', () => {
    spyOn($uibModal, 'open').and.callThrough();

    $scope.openAddAnswerGroupModal();

    expect($uibModal.open).toHaveBeenCalled();
  });

  it('should open add response modal and save new answer groups' +
    ' added by the user', () => {
    spyOn(ResponsesService, 'save').and.callFake(
      (answerGroups, defaultOutcome, callback) => {
        callback(answerGroups, defaultOutcome);
      }
    );
    // Returning rejecting callback as the modal opens again, as reopen is true
    // so we close it when it is opened for the second time.
    spyOn($uibModal, 'open').and.returnValues({
      result: $q.resolve({
        reopen: true,
        tmpRule: new Rule('', null, null),
        tmpOutcome: outcomeObjectFactory
          .createNew('Hola', '1', 'Feedback text', []),
        tmpTaggedSkillMisconceptionId: ''
      })
    }, {
      result: $q.reject()
    });
    $scope.answerGroups = [];

    $scope.openAddAnswerGroupModal();
    $scope.$apply();

    expect($scope.answerGroups).toEqual([answerGroupObjectFactory.createNew(
      [new Rule('', null, null)], outcomeObjectFactory.createNew(
        'Hola', '1', 'Feedback text', []), [], ''
    )]);
    expect(ResponsesService.save).toHaveBeenCalled();
  });

  it('should clear warnings when modal is closed', () => {
    spyOn(AlertsService, 'clearWarnings');
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });

    $scope.openAddAnswerGroupModal();
    $scope.$apply();

    expect(AlertsService.clearWarnings).toHaveBeenCalledTimes(2);
  });

  it('should open delete answer group modal when user clicks' +
    ' on delete button', () => {
    spyOn(ngbModal, 'open').and.callThrough();

    $scope.deleteAnswerGroup(0, new Event(''));

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should delete answer group after modal is opened', () => {
    spyOn(ResponsesService, 'deleteAnswerGroup').and.callFake(
      (index, callback) => {
        callback();
      }
    );
    spyOn(ngbModal, 'open').and.returnValue(
      {
        result: $q.resolve()
      } as NgbModalRef
    );

    $scope.deleteAnswerGroup(0, new Event(''));
    $scope.$apply();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(ResponsesService.deleteAnswerGroup).toHaveBeenCalled();
  });

  it('should clear warnings when delete answer group modal is closed', () => {
    spyOn(AlertsService, 'clearWarnings');
    spyOn(ngbModal, 'open').and.returnValue(
      {
        result: $q.reject()
      } as NgbModalRef
    );

    $scope.deleteAnswerGroup(0, new Event(''));
    $scope.$apply();

    expect(AlertsService.clearWarnings).toHaveBeenCalledTimes(2);
  });

  it('should update active answer group for newly tagged misconception', () => {
    spyOn(ResponsesService, 'updateActiveAnswerGroup').and.callFake(
      ({taggedSkillMisconceptionId}, callback) => {
        callback();
      }
    );

    $scope.saveTaggedMisconception('misconception1', 'skill1');

    expect(ctrl.onSaveInteractionAnswerGroups).toHaveBeenCalled();
  });

  it('should update active answer group when feedback is changed', () => {
    spyOn(ResponsesService, 'updateActiveAnswerGroup').and.callFake(
      ({feedback}, callback) => {
        callback();
      }
    );

    $scope.saveActiveAnswerGroupFeedback(defaultOutcome);

    expect(ctrl.onSaveInteractionAnswerGroups).toHaveBeenCalled();
  });

  it('should update active answer group when destination is changed', () => {
    spyOn(ResponsesService, 'updateActiveAnswerGroup')
      .and.callFake(({dest, expId, skillId}, callback) => {
        callback();
      });

    $scope.saveActiveAnswerGroupDest(defaultOutcome);

    expect(ctrl.onSaveInteractionAnswerGroups).toHaveBeenCalled();
  });


  it('should update active answer group when correctness' +
    ' label is changed', () => {
    spyOn(ResponsesService, 'updateActiveAnswerGroup').and.callFake(
      ({labelledAsCorrect}, callback) => {
        callback();
      }
    );

    $scope.saveActiveAnswerGroupCorrectnessLabel(defaultOutcome);

    expect(ctrl.onSaveInteractionAnswerGroups).toHaveBeenCalled();
  });


  it('should update active answer group when answer rules are changed', () => {
    spyOn(ResponsesService, 'updateActiveAnswerGroup').and.callFake(
      ({rules}, callback) => {
        callback();
      }
    );

    $scope.saveActiveAnswerGroupRules(new Rule('', null, null));

    expect(ctrl.onSaveInteractionAnswerGroups).toHaveBeenCalled();
  });


  it('should update default outcome when default' +
    ' outcome feedback is changed', () => {
    spyOn(ResponsesService, 'updateDefaultOutcome').and.callFake(
      ({feedback, dest}, callback) => {
        callback();
      }
    );

    $scope.saveDefaultOutcomeFeedback(defaultOutcome);

    expect(ctrl.onSaveInteractionDefaultOutcome).toHaveBeenCalled();
  });

  it('should update default outcome when default' +
    ' outcome destination is changed', () => {
    spyOn(ResponsesService, 'updateDefaultOutcome')
      .and.callFake(({dest, expId, skillId}, callback) => {
        callback();
      });

    $scope.saveDefaultOutcomeDest(defaultOutcome);

    expect(ctrl.onSaveInteractionDefaultOutcome).toHaveBeenCalled();
  });

  it('should update default outcome when default' +
    ' outcome correctness label is changed', () => {
    spyOn(ResponsesService, 'updateDefaultOutcome').and.callFake(
      ({labelledAsCorrect}, callback) => {
        callback();
      }
    );

    $scope.saveDefaultOutcomeCorrectnessLabel(defaultOutcome);

    expect(ctrl.onSaveInteractionDefaultOutcome).toHaveBeenCalled();
  });

  it('should return summary of answer group', () => {
    expect($scope.summarizeAnswerGroup(
      answerGroupObjectFactory.createNew(
        [],
        outcomeObjectFactory.createNew('unused', '1', 'Feedback text', []),
        [], '0'), '1', {}, true))
      .toBe('[Answer] Feedback text');
  });

  it('should get summary default outcome when outcome is linear', () => {
    expect($scope.summarizeDefaultOutcome(
      outcomeObjectFactory.createNew(
        'unused', '1', 'Feedback Text', []), 'Continue', 0, true))
      .toBe('[When the button is clicked] Feedback Text');
  });

  it('should get summary default outcome when answer group count' +
    ' is greater than 0', () => {
    expect($scope.summarizeDefaultOutcome(
      outcomeObjectFactory.createNew(
        'unused', '1', 'Feedback Text', []), 'TextInput', 1, true))
      .toBe('[All other answers] Feedback Text');
  });

  it('should get summary default outcome when answer group count' +
    ' is equal to 0', () => {
    expect($scope.summarizeDefaultOutcome(
      outcomeObjectFactory.createNew(
        'unused', '1', 'Feedback Text', []), 'TextInput', 0, true))
      .toBe('[All answers] Feedback Text');
  });

  it('should get an empty summary when default outcome' +
    ' is a falsy value', () => {
    expect($scope.summarizeDefaultOutcome(null, 'Continue', 0, true))
      .toBe('');
  });

  it('should check if outcome is looping', () => {
    $scope.stateName = 'Hola';
    expect($scope.isOutcomeLooping(outcomeObjectFactory.createNew(
      'Hola', '', '', []))).toBe(true);
    expect($scope.isOutcomeLooping(outcomeObjectFactory.createNew(
      'Second Last', '', '', []))).toBe(false);
  });

  it('should toggle response card', () => {
    $scope.responseCardIsShown = true;

    $scope.toggleResponseCard();
    expect($scope.responseCardIsShown).toBe(false);

    $scope.toggleResponseCard();
    expect($scope.responseCardIsShown).toBe(true);
  });

  it('should check if no action is expected for misconception', () => {
    spyOn(ResponsesService, 'getAnswerGroups').and.returnValue(answerGroups);
    $scope.inapplicableSkillMisconceptionIds = ['misconception2'];

    // Here, misconception1 is assigned to answerGroup, so no action is
    // expected.
    expect($scope.isNoActionExpected('misconception1')).toBe(true);
    // Here, misconception2 is not assigned to answerGroup but it is an
    // inapplicable skill misconception, so no action is expected.
    expect($scope.isNoActionExpected('misconception2')).toBe(true);
    // Here, misconception3 is neither inapplicable nor assigned to answerGroup
    // so action is expected.
    expect($scope.isNoActionExpected('misconceptions')).toBe(false);
  });

  it('should update optional misconception id status when user' +
    ' marks it as applicable', () => {
    $scope.inapplicableSkillMisconceptionIds = ['misconception1'];

    $scope.updateOptionalMisconceptionIdStatus('misconception1', true);

    expect($scope.inapplicableSkillMisconceptionIds).toEqual([]);
  });

  it('should update optional misconception id status when user' +
    ' marks it as applicable', () => {
    $scope.inapplicableSkillMisconceptionIds = ['misconception1'];

    $scope.updateOptionalMisconceptionIdStatus('misconception2', false);

    expect($scope.inapplicableSkillMisconceptionIds)
      .toEqual(['misconception1', 'misconception2']);
  });

  it('should get unaddressed misconception names', () => {
    spyOn(ResponsesService, 'getAnswerGroups').and.returnValue(answerGroups);
    $scope.misconceptionsBySkill = {
      skill1: [
        misconceptionObjectFactory.create(
          'm1', 'Misconception 1', 'note', '', false),
        misconceptionObjectFactory.create(
          'm2', 'Misconception 2', 'note', '', true)
      ]
    };

    expect($scope.getUnaddressedMisconceptionNames())
      .toEqual(['Misconception 2']);
  });
});
