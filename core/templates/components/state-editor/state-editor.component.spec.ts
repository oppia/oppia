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
 * @fileoverview Unit test for State Editor Component.
 */

import { EventEmitter } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { State } from 'domain/state/StateObjectFactory';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('StateEditorComponent', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;

  let WindowDimensionsService = null;
  let StateEditorService = null;
  let StateInteractionIdService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  afterEach(() => {
    ctrl.$onDestroy();
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    WindowDimensionsService = $injector.get('WindowDimensionsService');
    StateEditorService = $injector.get('StateEditorService');
    StateInteractionIdService = $injector.get('StateInteractionIdService');

    ctrl = $componentController('stateEditor', {
      $scope: $scope
    });

    spyOn(StateEditorService, 'getActiveStateName').and.returnValue(
      'Introduction');
  }));

  it('should set component properties initialization', () => {
    spyOn(WindowDimensionsService, 'isWindowNarrow').and.returnValue(false);

    expect($scope.oppiaBlackImgUrl).toBe(undefined);
    expect($scope.currentStateIsTerminal).toBe(undefined);
    expect($scope.conceptCardIsShown).toBe(undefined);
    expect($scope.windowIsNarrow).toBe(undefined);
    expect($scope.interactionIdIsSet).toBe(undefined);
    expect($scope.stateName).toBe(undefined);

    ctrl.$onInit();

    expect($scope.oppiaBlackImgUrl)
      .toBe('/assets/images/avatar/oppia_avatar_100px.svg');
    expect($scope.currentStateIsTerminal).toBe(false);
    expect($scope.conceptCardIsShown).toBe(true);
    expect($scope.windowIsNarrow).toBe(false);
    expect($scope.interactionIdIsSet).toBe(false);
    expect($scope.stateName).toBe('Introduction');
  });

  it('should update interaction visibility when interaction is changed', () => {
    let onInteractionIdChangedEmitter = new EventEmitter();
    spyOnProperty(StateInteractionIdService, 'onInteractionIdChanged')
      .and.returnValue(onInteractionIdChangedEmitter);

    expect($scope.interactionIdIsSet).toBe(undefined);
    expect($scope.currentInteractionCanHaveSolution).toBe(undefined);
    expect($scope.currentStateIsTerminal).toBe(undefined);

    ctrl.$onInit();

    onInteractionIdChangedEmitter.emit('TextInput');
    $scope.$apply();

    expect($scope.interactionIdIsSet).toBe(true);
    expect($scope.currentInteractionCanHaveSolution).toBe(true);
    expect($scope.currentStateIsTerminal).toBe(false);
  });

  it('should toggle concept card', () => {
    expect($scope.conceptCardIsShown).toBe(undefined);

    $scope.conceptCardIsShown = true;
    $scope.toggleConceptCard();

    expect($scope.conceptCardIsShown).toBe(false);

    $scope.toggleConceptCard();

    expect($scope.conceptCardIsShown).toBe(true);
  });

  it('should initialize services when component is reinitialized', () => {
    let onStateEditorInitializedEmitter = new EventEmitter();
    let stateData = {
      content: {},
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        }
      },
      interaction: {
        id: null,
        answer_groups: [],
        default_outcome: {
          dest: 'default',
          feedback: {
            content_id: 'default_outcome',
            html: ''
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null
        },
        hints: []
      },
      param_changes: [],
      solicit_answer_details: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {}
        }
      },
    };
    spyOnProperty(StateEditorService, 'onStateEditorInitialized')
      .and.returnValue(onStateEditorInitializedEmitter);

    ctrl.$onInit();

    expect($scope.servicesInitialized).toBe(false);

    onStateEditorInitializedEmitter.emit(stateData);
    $scope.$apply();

    expect($scope.servicesInitialized).toBe(true);
  });

  it('should throw error if state data is not defined and' +
    ' component is reinitialized', fakeAsync(() => {
    let onStateEditorInitializedEmitter = new EventEmitter<State>();
    let stateData = undefined;
    spyOnProperty(StateEditorService, 'onStateEditorInitialized')
      .and.returnValue(onStateEditorInitializedEmitter);

    ctrl.$onInit();

    expect(() => {
      onStateEditorInitializedEmitter.emit(stateData);
      tick();
    }).toThrowError('Expected stateData to be defined but received undefined');
  }));

  it('should reinitialize editor when responses change', () => {
    spyOn(StateEditorService.onStateEditorInitialized, 'emit').and.stub();

    $scope.reinitializeEditor();

    expect(StateEditorService.onStateEditorInitialized.emit).toHaveBeenCalled();
  });

  it('should update the changes', function() {
    spyOn($rootScope, '$applyAsync');

    $scope.getSolutionChange();

    expect($rootScope.$applyAsync).toHaveBeenCalled();
  });
});
