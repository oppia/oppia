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
 * @fileoverview Unit tests for OutcomeEditorComponent.
 */

import { EventEmitter } from '@angular/core';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('OutcomeEditorComponent', () => {
  let ctrl = null;
  let $scope = null;
  let $rootScope = null;

  let StateEditorService = null;
  let ExternalSaveService = null;
  let StateInteractionIdService = null;
  let OutcomeObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    StateEditorService = $injector.get('StateEditorService');
    ExternalSaveService = $injector.get('ExternalSaveService');
    StateInteractionIdService = $injector.get('StateInteractionIdService');
    OutcomeObjectFactory = $injector.get('OutcomeObjectFactory');

    ctrl = $componentController('outcomeEditor', {
      $scope: $scope
    }, {
      isEditable: () => true,
      getOnSaveCorrectnessLabelFn: () => {
        return () => {};
      },
      showMarkAllAudioAsNeedingUpdateModalIfRequired: () => {},
      getOnSaveFeedbackFn: () => {
        return () => {};
      },
      getOnSaveDestFn: () => {
        return () => {};
      }
    });

    spyOn(StateEditorService, 'isExplorationWhitelisted').and.returnValue(true);
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should set component properties on initialization', () => {
    let outcome = {
      feedback: {
        html: '<p> Previous HTML string </p>'
      },
      hasNonemptyFeedback: () => true
    };
    ctrl.outcome = outcome;

    expect(ctrl.editOutcomeForm).toEqual(undefined);
    expect(ctrl.canAddPrerequisiteSkill).toBe(undefined);
    expect(ctrl.feedbackEditorIsOpen).toBe(undefined);
    expect(ctrl.destinationEditorIsOpen).toBe(undefined);
    expect(ctrl.correctnessLabelEditorIsOpen).toBe(undefined);
    expect(ctrl.savedOutcome).toBe(undefined);

    ctrl.$onInit();

    expect(ctrl.editOutcomeForm).toEqual({});
    expect(ctrl.canAddPrerequisiteSkill).toBe(false);
    expect(ctrl.feedbackEditorIsOpen).toBe(false);
    expect(ctrl.destinationEditorIsOpen).toBe(false);
    expect(ctrl.correctnessLabelEditorIsOpen).toBe(false);
    expect(ctrl.savedOutcome).toEqual(outcome);
  });

  it('should save feedback on external save event when editFeedbackForm is' +
    ' valid and state is not invalid after feedback save', () => {
    let onExternalSaveEmitter = new EventEmitter();
    spyOnProperty(ExternalSaveService, 'onExternalSave')
      .and.returnValue(onExternalSaveEmitter);
    spyOn(ctrl, 'invalidStateAfterFeedbackSave').and.returnValue(false);
    spyOn(ctrl, 'saveThisFeedback');

    ctrl.$onInit();

    ctrl.feedbackEditorIsOpen = true;
    ctrl.editOutcomeForm = {
      editFeedbackForm: {
        $valid: true
      }
    };

    onExternalSaveEmitter.emit();
    $scope.$apply();

    expect(ctrl.saveThisFeedback).toHaveBeenCalledWith(false);
  });

  it('should cancel feedback edit on external save event when' +
    ' editFeedbackForm is not valid or state us not valid after' +
    ' feedback save', () => {
    let onExternalSaveEmitter = new EventEmitter();
    spyOnProperty(ExternalSaveService, 'onExternalSave')
      .and.returnValue(onExternalSaveEmitter);
    spyOn(ctrl, 'invalidStateAfterFeedbackSave').and.returnValue(false);

    ctrl.$onInit();

    // Setup. No pre-check as we are setting up values below.
    ctrl.feedbackEditorIsOpen = true;
    ctrl.editOutcomeForm = {
      editFeedbackForm: {
        $valid: false
      }
    };
    ctrl.savedOutcome = {
      feedback: 'Saved Outcome'
    };
    ctrl.outcome = {
      feedback: 'Outcome'
    };

    // Action.
    onExternalSaveEmitter.emit();
    $scope.$apply();

    // Post-check.
    expect(ctrl.feedbackEditorIsOpen).toBe(false);
    expect(ctrl.outcome.feedback).toBe('Saved Outcome');
  });

  it('should save destination on interaction change when edit destination' +
    ' form is valid and state is not invalid after destination save', () => {
    let onInteractionIdChangedEmitter = new EventEmitter();
    spyOnProperty(StateInteractionIdService, 'onInteractionIdChanged')
      .and.returnValue(onInteractionIdChangedEmitter);
    spyOn(ctrl, 'invalidStateAfterDestinationSave').and.returnValue(false);
    spyOn(ctrl, 'saveThisDestination');

    ctrl.$onInit();

    ctrl.destinationEditorIsOpen = true;
    ctrl.editOutcomeForm = {
      editDestForm: {
        $valid: true
      }
    };

    onInteractionIdChangedEmitter.emit();
    $scope.$apply();

    expect(ctrl.saveThisDestination).toHaveBeenCalled();
  });

  it('should cancel destination edit on interaction change when edit' +
    ' destination form is not valid or state is invalid after' +
    ' destination save', () => {
    let onInteractionIdChangedEmitter = new EventEmitter();
    spyOnProperty(StateInteractionIdService, 'onInteractionIdChanged')
      .and.returnValue(onInteractionIdChangedEmitter);
    spyOn(ctrl, 'invalidStateAfterDestinationSave').and.returnValue(false);

    ctrl.$onInit();

    // Setup. No pre-check as we are setting up values below.
    ctrl.destinationEditorIsOpen = true;
    ctrl.editOutcomeForm = {
      editDestForm: {
        $valid: false
      }
    };
    ctrl.savedOutcome = {
      dest: 'Saved Dest',
      refresherExplorationId: 'ExpId',
      missingPrerequisiteSkillId: 'SkillId'
    };
    ctrl.outcome = {
      dest: 'Dest',
      refresherExplorationId: '',
      missingPrerequisiteSkillId: ''
    };

    // Action.
    onInteractionIdChangedEmitter.emit();
    $scope.$apply();

    // Post-check.
    expect(ctrl.destinationEditorIsOpen).toBe(false);
    expect(ctrl.outcome.dest).toBe('Saved Dest');
    expect(ctrl.outcome.refresherExplorationId).toBe('ExpId');
    expect(ctrl.outcome.missingPrerequisiteSkillId).toBe('SkillId');
  });

  it('should check if state is in question mode', () => {
    spyOn(StateEditorService, 'isInQuestionMode').and.returnValue(true);

    expect(ctrl.isInQuestionMode()).toBe(true);
  });

  it('should get current interaction\'s ID', () => {
    StateInteractionIdService.savedMemento = 'TextInput';

    expect(ctrl.getCurrentInteractionId()).toBe('TextInput');
  });

  it('should check if correctness feedback is enabled', () => {
    spyOn(StateEditorService, 'getCorrectnessFeedbackEnabled')
      .and.returnValue(true);

    expect(ctrl.isCorrectnessFeedbackEnabled()).toBe(true);
  });

  it('should check if current interaction is linear or not', () => {
    StateInteractionIdService.savedMemento = 'TextInput';

    expect(ctrl.isCurrentInteractionLinear()).toBe(false);
  });

  it('should check if a state is in self loop', () => {
    spyOn(StateEditorService, 'getActiveStateName')
      .and.returnValue('Hola');

    expect(ctrl.isSelfLoop({dest: 'Hola'})).toBe(true);
    expect(ctrl.isSelfLoop({dest: 'Introduction'})).toBe(false);
  });

  it('should check if state if of self loop with no feedback', () => {
    let outcome = OutcomeObjectFactory.createNew(
      'State Name', '1', '', []);
    spyOn(StateEditorService, 'getActiveStateName')
      .and.returnValue('State Name');

    expect(ctrl.isSelfLoopWithNoFeedback(outcome)).toBe(true);
    expect(ctrl.isSelfLoopWithNoFeedback('')).toBe(false);
  });

  it('should check if state will become invalid after feedback' +
    ' is saved', () => {
    spyOn(StateEditorService, 'getActiveStateName')
      .and.returnValue('State Name');
    ctrl.outcome = OutcomeObjectFactory.createNew(
      'Introduction', '1', '', []);
    ctrl.savedOutcome = OutcomeObjectFactory.createNew(
      'State Name', '1', '', []);

    expect(ctrl.invalidStateAfterFeedbackSave()).toBe(true);
  });

  it('should check if state will become invalid after destination' +
    ' is saved', () => {
    spyOn(StateEditorService, 'getActiveStateName')
      .and.returnValue('Introduction');
    ctrl.outcome = OutcomeObjectFactory.createNew(
      'Introduction', '1', '', []);
    ctrl.savedOutcome = OutcomeObjectFactory.createNew(
      'State Name', '1', '', []);

    expect(ctrl.invalidStateAfterDestinationSave()).toBe(true);
  });

  it('should open feedback editor if it is editable', () => {
    ctrl.feedbackEditorIsOpen = false;

    ctrl.openFeedbackEditor();

    expect(ctrl.feedbackEditorIsOpen).toBe(true);
  });

  it('should open destination editor if it is editable', () => {
    ctrl.destinationEditorIsOpen = false;

    ctrl.openDestinationEditor();

    expect(ctrl.destinationEditorIsOpen).toBe(true);
  });

  it('should save correctness label when it is changed', () => {
    ctrl.savedOutcome = {
      labelledAsCorrect: false
    };
    ctrl.outcome = {
      labelledAsCorrect: true
    };

    ctrl.onChangeCorrectnessLabel();

    expect(ctrl.savedOutcome.labelledAsCorrect).toBe(true);
  });

  it('should set destination as null when saving feedback in' +
    ' question mode', () => {
    ctrl.savedOutcome = {
      feedback: {
        contentId: 'savedContentId',
        html: '<p> Saved Outcome </p>'
      },
      dest: 'Saved Dest'
    };
    ctrl.outcome = {
      feedback: {
        contentId: 'contentId',
        html: '<p> Outcome </p>'
      },
      dest: 'Dest'
    };
    spyOn(StateEditorService, 'isInQuestionMode').and.returnValue(true);
    spyOn(ctrl, 'showMarkAllAudioAsNeedingUpdateModalIfRequired');

    ctrl.saveThisFeedback(true);

    expect(ctrl.savedOutcome.dest).toBe(null);
    expect(ctrl.showMarkAllAudioAsNeedingUpdateModalIfRequired)
      .toHaveBeenCalledWith(['contentId']);
  });

  it('should set destination when saving feedback not in question mode', () => {
    ctrl.savedOutcome = {
      feedback: {
        contentId: 'savedContentId',
        html: '<p> Saved Outcome </p>'
      },
      dest: 'Dest',
    };
    ctrl.outcome = {
      feedback: {
        contentId: 'contentId',
        html: '<p> Outcome </p>'
      },
      dest: 'Dest',
    };
    spyOn(StateEditorService, 'isInQuestionMode').and.returnValue(false);
    spyOn(StateEditorService, 'getActiveStateName').and.returnValue('Hola');

    ctrl.saveThisFeedback(false);

    expect(ctrl.savedOutcome.dest).toBe('Hola');
  });

  it('should set refresher exploration ID as null on saving destination' +
    ' when state is not in self loop', () => {
    ctrl.savedOutcome = {
      feedback: {
        contentId: 'savedContentId',
        html: '<p> Saved Outcome </p>'
      },
      dest: 'Saved Dest',
      refresherExplorationId: 'ExpId',
      missingPrerequisiteSkillId: ''
    };
    ctrl.outcome = {
      feedback: {
        contentId: 'contentId',
        html: '<p> Outcome </p>'
      },
      dest: 'Dest',
      refresherExplorationId: 'OutcomeExpId',
      missingPrerequisiteSkillId: 'SkillId'
    };
    spyOn(StateEditorService, 'getActiveStateName').and.returnValue('Dest1');

    ctrl.saveThisDestination();

    expect(ctrl.outcome.refresherExplorationId).toBe(null);
    expect(ctrl.savedOutcome.refresherExplorationId).toBe(null);
    expect(ctrl.savedOutcome.missingPrerequisiteSkillId).toBe('SkillId');
  });

  it('should check if outcome feedback exceeds 10000 characters', () => {
    ctrl.outcome = {
      feedback: {
        _html: 'a'.repeat(10000)
      }
    };
    expect(ctrl.isFeedbackLengthExceeded()).toBe(false);

    ctrl.outcome = {
      feedback: {
        _html: 'a'.repeat(10001)
      }
    };
    expect(ctrl.isFeedbackLengthExceeded()).toBe(true);
  });
});
