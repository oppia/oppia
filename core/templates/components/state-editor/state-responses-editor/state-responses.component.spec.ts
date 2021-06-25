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
import { MisconceptionObjectFactory } from 'domain/skill/MisconceptionObjectFactory';
import { importAllAngularServices } from 'tests/unit-test-utils';

/**
 * @fileoverview Unit tests for paramChangesEditor.
 */

fdescribe('StateResponsesComponent', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
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
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    WindowDimensionsService = $injector.get('WindowDimensionsService');
    StateEditorService = $injector.get('StateEditorService');
    ResponsesService = $injector.get('ResponsesService');
    StateInteractionIdService = $injector.get('StateInteractionIdService');
    StateCustomizationArgsService = $injector
      .get('StateCustomizationArgsService');
    ExternalSaveService = $injector.get('ExternalSaveService');

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
    defaultOutcome =  outcomeObjectFactory.createFromBackendDict({
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

    expect(ResponsesService.onInitializeAnswerGroups.subscribe).toHaveBeenCalled();
    expect(StateInteractionIdService.onInteractionIdChanged.subscribe).toHaveBeenCalled();
    expect(ResponsesService.onAnswerGroupsChanged.subscribe).toHaveBeenCalled();
    expect(StateEditorService.onUpdateAnswerChoices.subscribe).toHaveBeenCalled();
    expect(StateEditorService.onHandleCustomArgsUpdate.subscribe).toHaveBeenCalled();
    expect(StateEditorService.onStateEditorInitialized.subscribe).toHaveBeenCalled();

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

  it('should re-initialize properties and open add answer group modal  when' +
    ' interaction is changed to a non-linear and non-terminal one', () => {
    let onInteractionIdChangedEmitter = new EventEmitter();
    spyOn(ResponsesService, 'getAnswerGroups').and.returnValue(answerGroups);
    spyOn(ResponsesService, 'getActiveAnswerGroupIndex').and.returnValue(0);
    spyOnProperty(StateInteractionIdService, 'onInteractionIdChanged')
      .and.returnValue(onInteractionIdChangedEmitter);
    spyOn(ResponsesService, 'onInteractionIdChanged').and.callFake(
      (options, callback) => { callback(); });
    spyOn(StateEditorService, 'isInQuestionMode').and.returnValue(true);
    spyOn(ResponsesService, 'getDefaultOutcome').and.returnValue(
      defaultOutcome);
    spyOn($scope, 'openAddAnswerGroupModal');

    expect($scope.answerGroups).toEqual(undefined);
    expect($scope.defaultOutcome).toEqual(undefined);
    expect($scope.activeAnswerGroupIndex ).toBe(undefined);

    ctrl.$onInit();
    onInteractionIdChangedEmitter.emit('ImageClickInput');

    expect($scope.answerGroups).toEqual(answerGroups);
    expect($scope.defaultOutcome).toEqual(defaultOutcome);
    expect($scope.activeAnswerGroupIndex ).toBe(0);
    expect($scope.openAddAnswerGroupModal).toHaveBeenCalled();

    ctrl.$onDestroy();
  });

  it('should not open add answer group modal  when interaction is' +
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
    ctrl.$onInit();

    $scope.onChangeSolicitAnswerDetails();
  });
});