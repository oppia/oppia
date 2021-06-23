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

  beforeEach(angular.mock.module('oppia'));

  beforeEach(() => {

  });

  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    WindowDimensionsService = $injector.get('WindowDimensionsService');
    StateEditorService = $injector.get('StateEditorService');
    ResponsesService = $injector.get('ResponsesService');
    StateInteractionIdService = $injector.get('StateInteractionIdService');

    ctrl = $componentController('stateResponses', {
      $scope: $scope
    });
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
});