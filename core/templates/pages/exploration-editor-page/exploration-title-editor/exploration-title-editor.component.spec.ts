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
 * @fileoverview Unit tests for explorationTitleEditor component.
 */

require(
  'pages/exploration-editor-page/exploration-title-editor/' +
  'exploration-title-editor.component.ts');

import { EventEmitter } from '@angular/core';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

class MockRouterService {
  private refreshSettingsTabEventEmitter: EventEmitter<void>;
  get onRefreshSettingsTab() {
    return this.refreshSettingsTabEventEmitter;
  }

  set refreshSettingsTabEmitter(val) {
    this.refreshSettingsTabEventEmitter = val;
  }
}
describe('Exploration Title Editor directive', function() {
  var $scope = null;
  var $rootScope = null;
  var ExplorationTitleService = null;
  var focusManagerService = null;
  var routerService = null;
  var $flushPendingTasks = null;
  var ctrl = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    focusManagerService = TestBed.get(FocusManagerService);
    routerService = new MockRouterService();
  });


  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('RouterService', {
      getActiveTabName() {
        return ('main');
      },
    });
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    ExplorationTitleService = $injector.get('ExplorationTitleService');
    focusManagerService = $injector.get('FocusManagerService');
    $flushPendingTasks = $injector.get('$flushPendingTasks');
    routerService.refreshSettingsTabEmitter = new EventEmitter();
    $scope = $rootScope.$new();
    ctrl = $componentController('explorationTitleEditor', {
      $scope: $scope,
      ExplorationTitleService: ExplorationTitleService,
      RouterService: routerService,
    });
    ctrl.$onInit();
    $scope.$apply();
  }));

  it('should initialize controller properties after its initialization',
    function() {
      expect($scope.explorationTitleService).toEqual(ExplorationTitleService);
    });

  it('should set focus on settings tab when refreshSettingsTab flag is ' +
    'emit', () => {
    spyOn(focusManagerService, 'setFocus');
    ctrl.focusLabel = 'xyzz';
    routerService.onRefreshSettingsTab.emit();
    $scope.$apply();
    $flushPendingTasks();
    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'xyzz');
  });

  it('should unsubscribe when component is destroyed', () => {
    const unsubscribeSpy =
      spyOn(ctrl.directiveSubscriptions, 'unsubscribe');

    ctrl.$onDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
