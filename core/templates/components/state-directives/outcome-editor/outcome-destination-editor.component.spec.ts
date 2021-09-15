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

import { EventEmitter } from '@angular/core';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

/**
 * @fileoverview Unit tests for OutcomeDestinationEditorComponent.
 */

describe('OutcomeDestinationEditor', () => {
  let ctrl = null;
  let $scope = null;
  let $rootScope = null;
  let $timeout = null;
  let $q = null;

  let StateEditorService = null;
  let EditorFirstTimeEventsService = null;
  let StateGraphLayoutService = null;
  let FocusManagerService = null;
  let UserService = null;
  let PLACEHOLDER_OUTCOME_DEST;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $timeout = $injector.get('$timeout');
    $q = $injector.get('$q');

    StateEditorService = $injector.get('StateEditorService');
    UserService = $injector.get('UserService');
    EditorFirstTimeEventsService = $injector
      .get('EditorFirstTimeEventsService');
    StateGraphLayoutService = $injector.get('StateGraphLayoutService');
    FocusManagerService = $injector.get('FocusManagerService');
    PLACEHOLDER_OUTCOME_DEST = $injector.get('PLACEHOLDER_OUTCOME_DEST');

    ctrl = $componentController('outcomeDestinationEditor', {
      $scope: $scope
    }, {
      addState: () => {}
    });

    spyOn(StateEditorService, 'isExplorationWhitelisted').and.returnValue(true);
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should set component properties on initialization', () => {
    let computedLayout = StateGraphLayoutService.computeLayout(
      {
        Introduction: 'Introduction',
        State1: 'State1',
        End: 'End'
      }, [
        {
          source: 'Introduction',
          target: 'State1'
        },
        {
          source: 'State1',
          target: 'End'
        }
      ], 'Introduction', ['End']);
    spyOn(StateEditorService, 'getStateNames')
      .and.returnValue(['Introduction', 'State1', 'NewState', 'End']);
    spyOn(StateGraphLayoutService, 'getLastComputedArrangement')
      .and.returnValue(computedLayout);

    ctrl.$onInit();
    $timeout.flush(10);

    expect(ctrl.canAddPrerequisiteSkill).toBe(false);
    expect(ctrl.canEditRefresherExplorationId).toBeNull();
    expect(ctrl.newStateNamePattern).toEqual(/^[a-zA-Z0-9.\s-]+$/);
    expect(ctrl.destChoices).toEqual([{
      id: null,
      text: '(try again)'
    }, {
      id: 'Introduction',
      text: 'Introduction'
    }, {
      id: 'State1',
      text: 'State1'
    }, {
      id: 'End',
      text: 'End'
    }, {
      id: 'NewState',
      text: 'NewState'
    }, {
      id: '/',
      text: 'A New Card Called...'
    }]);
  });

  it('should set outcome destination as active state if it is a self loop' +
    ' when outcome destination details are saved', () => {
    ctrl.outcome = {
      dest: 'Hola'
    };
    let onSaveOutcomeDestDetailsEmitter = new EventEmitter();
    spyOnProperty(StateEditorService, 'onSaveOutcomeDestDetails')
      .and.returnValue(onSaveOutcomeDestDetailsEmitter);
    spyOn(StateEditorService, 'getActiveStateName').and.returnValues(
      'Hola', 'Introduction');

    ctrl.$onInit();
    $timeout.flush(10);

    onSaveOutcomeDestDetailsEmitter.emit();

    expect(ctrl.outcome.dest).toBe('Introduction');
  });

  it('should add new state if outcome destination is a placeholder when' +
    ' outcome destination details are saved', () => {
    ctrl.outcome = {
      dest: PLACEHOLDER_OUTCOME_DEST,
      newStateName: 'End'
    };
    let onSaveOutcomeDestDetailsEmitter = new EventEmitter();
    spyOnProperty(StateEditorService, 'onSaveOutcomeDestDetails')
      .and.returnValue(onSaveOutcomeDestDetailsEmitter);
    spyOn(StateEditorService, 'getActiveStateName').and.returnValue('Hola');
    spyOn(EditorFirstTimeEventsService, 'registerFirstCreateSecondStateEvent');
    spyOn(ctrl, 'addState');

    ctrl.$onInit();
    $timeout.flush(10);

    onSaveOutcomeDestDetailsEmitter.emit();

    expect(ctrl.outcome.dest).toBe('End');
    expect(EditorFirstTimeEventsService.registerFirstCreateSecondStateEvent)
      .toHaveBeenCalled();
    expect(ctrl.addState).toHaveBeenCalled();
  });

  it('should allow admin and moderators to edit refresher' +
    ' exploration id', () => {
    let userInfo = {
      isCurriculumAdmin: () => true,
      isModerator: () => false
    };
    spyOn(UserService, 'getUserInfoAsync').and.returnValue(
      $q.resolve(userInfo));

    expect(ctrl.canEditRefresherExplorationId).toBe(undefined);

    ctrl.$onInit();
    $scope.$apply();

    expect(ctrl.canEditRefresherExplorationId).toBe(true);
  });

  it('should update option names when state name is changed', () => {
    let onStateNamesChangedEmitter = new EventEmitter();
    let computedLayout = StateGraphLayoutService.computeLayout(
      {
        Introduction: 'Introduction',
        State1: 'State1',
        End: 'End'
      }, [
        {
          source: 'Introduction',
          target: 'State1'
        },
        {
          source: 'State1',
          target: 'End'
        }
      ], 'Introduction', ['End']);
    spyOnProperty(StateEditorService, 'onStateNamesChanged')
      .and.returnValue(onStateNamesChangedEmitter);
    spyOn(StateEditorService, 'getStateNames')
      .and.returnValues(
        ['Introduction', 'State1', 'End'],
        ['Introduction', 'State2', 'End']);
    spyOn(StateGraphLayoutService, 'getLastComputedArrangement')
      .and.returnValue(computedLayout);

    ctrl.$onInit();
    $timeout.flush(10);

    expect(ctrl.destChoices).toEqual([{
      id: null,
      text: '(try again)'
    }, {
      id: 'Introduction',
      text: 'Introduction'
    }, {
      id: 'State1',
      text: 'State1'
    }, {
      id: 'End',
      text: 'End'
    }, {
      id: '/',
      text: 'A New Card Called...'
    }]);

    onStateNamesChangedEmitter.emit();
    $timeout.flush(10);
    $scope.$apply();

    expect(ctrl.destChoices).toEqual([{
      id: null,
      text: '(try again)'
    }, {
      id: 'Introduction',
      text: 'Introduction'
    }, {
      id: 'End',
      text: 'End'
    }, {
      id: 'State2',
      text: 'State2'
    }, {
      id: '/',
      text: 'A New Card Called...'
    }]);
  });

  it('should set focus to new state name input field on destination' +
    ' selector change', () => {
    ctrl.outcome = {
      dest: PLACEHOLDER_OUTCOME_DEST
    };
    spyOn(FocusManagerService, 'setFocus');

    ctrl.onDestSelectorChange();

    expect(FocusManagerService.setFocus).toHaveBeenCalledWith(
      'newStateNameInputField'
    );
  });

  it('should check if new state is being created', () => {
    expect(ctrl.isCreatingNewState({dest: PLACEHOLDER_OUTCOME_DEST}))
      .toBe(true);
    expect(ctrl.isCreatingNewState({dest: 'Introduction'})).toBe(false);
  });
});
