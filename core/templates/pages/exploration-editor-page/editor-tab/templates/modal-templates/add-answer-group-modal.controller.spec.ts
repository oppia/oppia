// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for AddAnswerGroupModalController.
 */

import { TestBed } from '@angular/core/testing';
import { EditorFirstTimeEventsService } from
  'pages/exploration-editor-page/services/editor-first-time-events.service';
import { StateEditorService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-editor.service';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';

import { Subscription } from 'rxjs';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { EventBusGroup, EventBusService } from 'app-events/event-bus.service';
import { ObjectFormValidityChangeEvent } from 'app-events/app-events';

describe('Add Answer Group Modal Controller', function() {
  importAllAngularServices();

  var $scope = null;
  var $uibModalInstance = null;
  var editorFirstTimeEventsService = null;
  var generateContentIdService = null;
  var outcomeObjectFactory = null;
  var ruleObjectFactory = null;
  var stateEditorService = null;

  var addState = null;
  var currentInteractionId = 'Continue';
  var existingContentIds = [];
  var stateName = 'State Name';
  var testSubscriptions: Subscription;

  const saveOutcomeDestDetailsSpy = jasmine.createSpy('saveOutcomeDestDetails');

  beforeEach(angular.mock.module('oppia'));

  beforeEach(function() {
    editorFirstTimeEventsService = TestBed.get(EditorFirstTimeEventsService);
    generateContentIdService = TestBed.get(GenerateContentIdService);
    outcomeObjectFactory = TestBed.get(OutcomeObjectFactory);
    ruleObjectFactory = TestBed.get(RuleObjectFactory);
    stateEditorService = TestBed.get(StateEditorService);
  });

  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(true);

    $scope = $rootScope.$new();
    $controller('AddAnswerGroupModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      EditorFirstTimeEventsService: editorFirstTimeEventsService,
      GenerateContentIdService: generateContentIdService,
      OutcomeObjectFactory: outcomeObjectFactory,
      RuleObjectFactory: ruleObjectFactory,
      StateEditorService: stateEditorService,
      addState: addState,
      currentInteractionId: currentInteractionId,
      existingContentIds: existingContentIds,
      stateName: stateName
    });
  }));

  beforeEach(() => {
    testSubscriptions = new Subscription();
    testSubscriptions.add(stateEditorService.onSaveOutcomeDestDetails.subscribe(
      saveOutcomeDestDetailsSpy));
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect(true).toBe(true);
      expect($scope.feedbackEditorIsOpen).toBe(false);
      expect($scope.addState).toBe(addState);
      expect($scope.questionModeEnabled).toBe(true);
      expect($scope.tmpTaggedSkillMisconceptionId).toBe(null);
      expect($scope.addAnswerGroupForm).toEqual({});
    });

  it('should update answer group feedback', function() {
    expect($scope.feedbackEditorIsOpen).toBe(false);

    var feedback = 'New feedback';
    $scope.updateAnswerGroupFeedback({
      feedback: feedback
    });
    $scope.modalId = Symbol();
    const eventBusGroup = new EventBusGroup(TestBed.inject(EventBusService));
    eventBusGroup.emit(new ObjectFormValidityChangeEvent({
      value: true, modalId: $scope.modalId}));
    expect($scope.feedbackEditorIsOpen).toBe(true);
    expect($scope.tmpOutcome.feedback).toBe(feedback);
  });

  it('should update tagged misconception', function() {
    expect($scope.tmpTaggedSkillMisconceptionId).toBe(null);

    var taggedMisconception = {
      misconceptionId: 'mis_1',
      skillId: 'skill_1'
    };
    $scope.updateTaggedMisconception(taggedMisconception);

    expect($scope.tmpTaggedSkillMisconceptionId).toBe('skill_1-mis_1');
  });

  it('should check if correctness feedback is enabled', function() {
    spyOn(stateEditorService, 'getCorrectnessFeedbackEnabled').and
      .returnValue(true);
    expect($scope.isCorrectnessFeedbackEnabled()).toBe(true);
  });

  it('should check if current interaction is linear', function() {
    expect($scope.isCurrentInteractionLinear()).toBe(true);
  });

  it('should check if outcome has no feedback with self loop', function() {
    var outcome = outcomeObjectFactory.createNew(
      'State Name', '1', '', []);
    expect($scope.isSelfLoopWithNoFeedback(outcome)).toBe(true);

    var outcome2 = outcomeObjectFactory.createNew(
      'State Name', '1', 'Feedback Text', []);
    expect($scope.isSelfLoopWithNoFeedback(outcome2)).toBe(false);
  });

  it('should check if outcome feedback exceeds 10000 characters', () => {
    var outcome1 = outcomeObjectFactory.createNew(
      'State Name', '1', 'a'.repeat(10000), []);
    expect($scope.isFeedbackLengthExceeded(outcome1)).toBe(false);

    var outcome2 = outcomeObjectFactory.createNew(
      'State Name', '1', 'a'.repeat(10001), []);
    expect($scope.isFeedbackLengthExceeded(outcome2)).toBe(true);
  });

  it('should save answer group response when closing the modal', function() {
    $scope.saveResponse(null);

    expect(saveOutcomeDestDetailsSpy).toHaveBeenCalled();
    expect($uibModalInstance.close).toHaveBeenCalledWith({
      tmpRule: $scope.tmpRule,
      tmpOutcome: $scope.tmpOutcome,
      tmpTaggedSkillMisconceptionId: null,
      reopen: null
    });
  });
});
