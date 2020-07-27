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
 * @fileoverview Unit tests for unresolvedAnswersOverview.
 */

import { TestBed } from '@angular/core/testing';
import { EditabilityService } from 'services/editability.service';
import { StateInteractionIdService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-interaction-id.service';

describe('Unresolved Answers Overview Component', function() {
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var $uibModal = null;
  var editabilityService = null;
  var explorationStatesService = null;
  var improvementsService = null;
  var stateInteractionIdService = null;
  var stateEditorService = null;
  var stateTopAnswersStatsService = null;

  var stateName = 'State1';

  beforeEach(angular.mock.module('oppia'));

  beforeEach(function() {
    editabilityService = TestBed.get(EditabilityService);
    stateInteractionIdService = TestBed.get(StateInteractionIdService);
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    explorationStatesService = $injector.get('ExplorationStatesService');
    improvementsService = $injector.get('ImprovementsService');
    stateEditorService = $injector.get('StateEditorService');
    stateTopAnswersStatsService = $injector.get('StateTopAnswersStatsService');

    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(stateName);
    spyOn(explorationStatesService, 'getState').and.returnValue({});

    $scope = $rootScope.$new();
    var ctrl = $componentController('unresolvedAnswersOverview', {
      $rootScope: $rootScope,
      $scope: $scope,
      EditabilityService: editabilityService,
      StateInteractionIdService: stateInteractionIdService
    });
    ctrl.$onInit();
  }));

  it('should evaluate $scope properties after controller initialization',
    function() {
      expect($scope.unresolvedAnswersOverviewIsShown).toBe(false);
      expect($scope.SHOW_TRAINABLE_UNRESOLVED_ANSWERS).toBe(false);
    });

  it('should check when unresolved answers overview are shown', function() {
    spyOn(stateTopAnswersStatsService, 'hasStateStats').and.returnValue(true);
    spyOn(
      improvementsService,
      'isStateForcedToResolveOutstandingUnaddressedAnswers')
      .and.returnValue(true);

    expect($scope.isUnresolvedAnswersOverviewShown()).toBe(true);
  });

  it('should check when unresolved answers overview are not shown because it' +
    ' has no state stats', function() {
    spyOn(stateTopAnswersStatsService, 'hasStateStats').and.returnValue(false);
    spyOn(
      improvementsService,
      'isStateForcedToResolveOutstandingUnaddressedAnswers');

    expect($scope.isUnresolvedAnswersOverviewShown()).toBe(false);
    expect(
      improvementsService.isStateForcedToResolveOutstandingUnaddressedAnswers)
      .not.toHaveBeenCalled();
  });

  it('should check that unresolved answers overview are not shown because' +
    ' the state is not forced to resolved unaddressed answers', function() {
    spyOn(stateTopAnswersStatsService, 'hasStateStats').and.returnValue(true);
    spyOn(
      improvementsService,
      'isStateForcedToResolveOutstandingUnaddressedAnswers')
      .and.returnValue(false);

    expect($scope.isUnresolvedAnswersOverviewShown()).toBe(false);
  });

  it('should check if the current interaction is trainable or not', function() {
    stateInteractionIdService.init(stateName, 'CodeRepl');
    expect($scope.getCurrentInteractionId()).toBe('CodeRepl');
    expect($scope.isCurrentInteractionTrainable()).toBe(true);

    stateInteractionIdService.init(stateName, 'Continue');
    expect($scope.getCurrentInteractionId()).toBe('Continue');
    expect($scope.isCurrentInteractionTrainable()).toBe(false);
  });

  it('should check if the current interaction is linear or not', function() {
    stateInteractionIdService.init(stateName, 'Continue');
    expect($scope.getCurrentInteractionId()).toBe('Continue');
    expect($scope.isCurrentInteractionLinear()).toBe(true);

    stateInteractionIdService.init(stateName, 'PencilCodeEditor');
    expect($scope.getCurrentInteractionId()).toBe('PencilCodeEditor');
    expect($scope.isCurrentInteractionLinear()).toBe(false);
  });

  it('should check editability when outside tutorial mode', function() {
    var editabilitySpy = spyOn(
      editabilityService, 'isEditableOutsideTutorialMode');

    editabilitySpy.and.returnValue(true);
    expect($scope.isEditableOutsideTutorialMode()).toBe(true);

    editabilitySpy.and.returnValue(false);
    expect($scope.isEditableOutsideTutorialMode()).toBe(false);
  });

  it('should open teach oppia modal using $uibModal.open', function() {
    spyOn($uibModal, 'open').and.callThrough();

    $scope.openTeachOppiaModal();

    expect($uibModal.open).toHaveBeenCalled();
  });

  it('should open teach oppia modal and close it', function() {
    spyOn($rootScope, '$broadcast');
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve()
    });

    $scope.openTeachOppiaModal();
    $rootScope.$apply();

    expect($rootScope.$broadcast).toHaveBeenCalledWith('externalSave');
  });

  it('should open teach oppia modal and dismiss it', function() {
    spyOn($rootScope, '$broadcast');
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });

    $scope.openTeachOppiaModal();
    $rootScope.$apply();

    expect($rootScope.$broadcast).toHaveBeenCalledWith('externalSave');
  });

  it('should get unresolved state stats', function() {
    var unresolvedAnswers = [{
      answer: {},
      answerHtml: 'This is the answer html',
      frequency: 2,
      isAddressed: true
    }];
    spyOn(stateTopAnswersStatsService, 'getUnresolvedStateStats').and
      .returnValue(unresolvedAnswers);
    expect($scope.getUnresolvedStateStats()).toEqual(unresolvedAnswers);
  });
});
