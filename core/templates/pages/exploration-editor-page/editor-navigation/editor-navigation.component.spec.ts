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
 * @fileoverview Unit tests for editorNavigation.
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { UserBackendApiService } from 'services/user-backend-api.service';


describe('Editor Navigation Component', function() {
  var ctrl = null;
  var $flushPendingTasks = null;
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var $uibModal = null;
  var $verifyNoPendingTasks = null;
  var ContextService = null;
  var ExplorationFeaturesService = null;
  var ExplorationImprovementsService = null;
  var ExplorationWarningsService = null;
  var ThreadDataService = null;
  var userBackendApiService = null;

  var explorationId = 'exp1';
  var userInfo = {
    isLoggedIn: () => true
  };
  var windowWidth = null;
  var isImprovementsTabEnabledAsyncSpy = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'WindowDimensionsService', {
        getWidth: function() {
          return windowWidth;
        },
        getResizeEvent: function() {
          return of(new Event('resize'));
        }
      });
    $provide.value('UserBackendApiService',
      TestBed.get(UserBackendApiService));
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $flushPendingTasks = $injector.get('$flushPendingTasks');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    $verifyNoPendingTasks = $injector.get('$verifyNoPendingTasks');
    ContextService = $injector.get('ContextService');
    ExplorationFeaturesService = $injector.get('ExplorationFeaturesService');
    ExplorationImprovementsService = $injector.get(
      'ExplorationImprovementsService');
    ExplorationWarningsService = $injector.get('ExplorationWarningsService');
    userBackendApiService = $injector.get('UserBackendApiService');
    ThreadDataService = $injector.get('ThreadDataService');

    spyOn(ContextService, 'getExplorationId').and.returnValue(explorationId);
    spyOn(userBackendApiService, 'getUserInfoAsync').and.returnValue(userInfo);

    windowWidth = 1200;

    isImprovementsTabEnabledAsyncSpy = spyOn(
      ExplorationImprovementsService, 'isImprovementsTabEnabledAsync');

    isImprovementsTabEnabledAsyncSpy.and.returnValue(false);

    $scope = $rootScope.$new();
    ctrl = $componentController('editorNavigation', {
      $scope: $scope
    });
    ctrl.$onInit();
    $scope.$apply();
  }));

  afterEach(function() {
    ctrl.$onDestroy();
  });

  it('should evaluate $scope properties after controller initialization',
    function() {
      expect($scope.isPostTutorialHelpPopoverShown())
        .toBe(false);
      expect($scope.isScreenLarge()).toBe(true);
      expect($scope.isUserLoggedIn()).toBe(true);
      expect($scope.isImprovementsTabEnabled()).toBe(false);
    });

  it('should evaluate warnings from exploration warning service', function() {
    var warnings = [{
      type: 'ERROR'
    }, {
      type: 'CRITICAL'
    }];
    spyOn(ExplorationWarningsService, 'getWarnings').and.returnValue(warnings);
    spyOn(ExplorationWarningsService, 'countWarnings').and.returnValue(
      warnings.length);
    // This approach was choosen because spyOn() doesn't work on properties
    // that doesn't have a get access type.
    // eslint-disable-next-line max-len
    // ref: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
    Object.defineProperty(ExplorationWarningsService, 'hasCriticalWarnings', {
      get: () => true
    });
    spyOnProperty(ExplorationWarningsService, 'hasCriticalWarnings')
      .and.returnValue(true);

    expect($scope.countWarnings()).toBe(2);
    expect($scope.getWarnings()).toEqual(warnings);
    expect($scope.hasCriticalWarnings()).toBe(true);
  });

  it('should open editor tutorial after closing user help modal with mode' +
    'editor', function() {
    spyOn($rootScope, '$broadcast');
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve('editor')
    });
    $scope.showUserHelpModal();
    $scope.$apply();

    expect($rootScope.$broadcast).toHaveBeenCalledWith(
      'openEditorTutorial');
  });

  it('should open editor tutorial after closing user help modal with mode' +
    'translation', function() {
    spyOn($rootScope, '$broadcast');
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve('translation')
    });
    $scope.showUserHelpModal();
    $scope.$apply();

    expect($rootScope.$broadcast).toHaveBeenCalledWith(
      'openTranslationTutorial');
  });

  it('should not open any tutorial after dismissing user help modal',
    function() {
      spyOn($rootScope, '$broadcast');
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });
      $scope.showUserHelpModal();
      $scope.$apply();

      expect($rootScope.$broadcast).not.toHaveBeenCalled();
    });

  it('should navigate to main tab', function() {
    $scope.selectMainTab();
    $rootScope.$apply();
    expect($scope.getActiveTabName()).toBe('main');
  });

  it('should navigate to translation tab', function() {
    $scope.selectTranslationTab();
    $rootScope.$apply();
    expect($scope.getActiveTabName()).toBe('translation');
  });

  it('should navigate to preview tab', function() {
    $scope.selectPreviewTab();
    $rootScope.$apply();
    $flushPendingTasks();
    $verifyNoPendingTasks('timeout');
    expect($scope.getActiveTabName()).toBe('preview');
  });

  it('should navigate to settings tab', function() {
    $scope.selectSettingsTab();
    $rootScope.$apply();
    expect($scope.getActiveTabName()).toBe('settings');
  });

  it('should navigate to stats tab', function() {
    $scope.selectStatsTab();
    $rootScope.$apply();
    expect($scope.getActiveTabName()).toBe('stats');
  });

  it('should navigate to improvements tab', function() {
    spyOn(ExplorationFeaturesService, 'isInitialized').and.returnValue(true);
    isImprovementsTabEnabledAsyncSpy.and.returnValue(true);
    $scope.selectImprovementsTab();
    $rootScope.$apply();
    expect($scope.getActiveTabName()).toBe('improvements');
  });

  it('should navigate to history tab', function() {
    $scope.selectHistoryTab();
    $rootScope.$apply();
    expect($scope.getActiveTabName()).toBe('history');
  });

  it('should navigate to feedback tab', function() {
    $scope.selectFeedbackTab();
    $rootScope.$apply();
    expect($scope.getActiveTabName()).toBe('feedback');
  });

  it('should get open thread count from thread data service', function() {
    spyOn(ThreadDataService, 'getOpenThreadsCount').and.returnValue(5);
    expect($scope.getOpenThreadsCount()).toBe(5);
  });
});
