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

/**
 * @fileoverview Unit tests for editorNavbarBreadcrumb.
 */

import { EventEmitter } from '@angular/core';
// TODO(#7222): Remove usage of UpgradedServices once upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';

describe('Editor Navbar Breadcrumb directive', function() {
  var ctrl = null;
  var $rootScope = null;
  var $scope = null;
  var ExplorationTitleService = null;
  var ExplorationPropertyService = null;
  var FocusManagerService = null;
  var RouterService = null;

  var mockExplorationPropertyChangedEventEmitter = new EventEmitter();

  beforeEach(angular.mock.module('oppia', function($provide) {
    const ugs = new UpgradedServices();
    for (const [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    ExplorationTitleService = $injector.get('ExplorationTitleService');
    ExplorationPropertyService = $injector.get('ExplorationPropertyService');
    FocusManagerService = $injector.get('FocusManagerService');
    RouterService = $injector.get('RouterService');

    ExplorationTitleService.init('Exploration Title Example Very Long');

    spyOnProperty(ExplorationPropertyService,
      'onExplorationPropertyChanged').and.returnValue(
      mockExplorationPropertyChangedEventEmitter);

    $scope = $rootScope.$new();
    ctrl = $componentController('editorNavbarBreadcrumb', {
      $scope: $scope
    });
    ctrl.$onInit();
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should evaluate scope properties after controller initialization',
    function() {
      expect($scope.navbarTitle).toBe(null);
    });

  it('should go to settings tabs and focus on exploration title input' +
    ' when editing title', function() {
    spyOn(RouterService, 'navigateToSettingsTab');
    spyOn(FocusManagerService, 'setFocus');

    $scope.editTitle();

    expect(RouterService.navigateToSettingsTab).toHaveBeenCalled();
    expect(FocusManagerService.setFocus).toHaveBeenCalledWith(
      'explorationTitleInputFocusLabel');
  });

  it('should get an empty current tab name when there is no active tab',
    function() {
      spyOn(RouterService, 'getActiveTabName').and.returnValue(null);
      expect($scope.getCurrentTabName()).toBe('');
    });

  it('should get current tab name when there is an active tab', function() {
    spyOn(RouterService, 'getActiveTabName').and.returnValue('settings');
    expect($scope.getCurrentTabName()).toBe('Settings');
  });

  it('should update nav bar title when exploration property changes',
    function() {
      mockExplorationPropertyChangedEventEmitter.emit();

      expect($scope.navbarTitle).toBe(
        'Exploration Title...');
    });
});
