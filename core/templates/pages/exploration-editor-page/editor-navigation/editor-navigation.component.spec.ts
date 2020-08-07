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

import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subscription } from 'rxjs';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';

describe('Editor Navigation Component', function() {
  var ctrl = null;
  var $flushPendingTasks = null;
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var $uibModal = null;
  var $verifyNoPendingTasks = null;
  var contextService = null;
  var explorationFeaturesService = null;
  var explorationImprovementsService = null;
  var explorationWarningsService = null;
  var stateTutorialFirstTimeService = null;
  var threadDataService = null;
  var userService = null;
  var windowDimensionsService = null;

  var mockOpenPostTutorialHelpPopover = new EventEmitter();

  var testSubscriptions: Subscription;

  const openEditorTutorialSpy = jasmine.createSpy('openEditorTutorial');
  const openTranslationTutorialSpy = (
    jasmine.createSpy('openTranslationTutorial'));

  var explorationId = 'exp1';
  var userInfo = {
    isLoggedIn: () => true
  };
  var isImprovementsTabEnabledAsyncSpy = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(function() {
    windowDimensionsService = TestBed.get(WindowDimensionsService);
  });

  describe('when screen is large', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $flushPendingTasks = $injector.get('$flushPendingTasks');
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
      $uibModal = $injector.get('$uibModal');
      $verifyNoPendingTasks = $injector.get('$verifyNoPendingTasks');
      contextService = $injector.get('ContextService');
      explorationFeaturesService = $injector.get('ExplorationFeaturesService');
      explorationImprovementsService = $injector.get(
        'ExplorationImprovementsService');
      explorationWarningsService = $injector.get('ExplorationWarningsService');
      userService = $injector.get('UserService');
      threadDataService = $injector.get('ThreadDataService');
      stateTutorialFirstTimeService = (
        $injector.get('StateTutorialFirstTimeService'));

      spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
        of(new Event('resize')));
      spyOn(windowDimensionsService, 'getWidth').and.returnValue(1200);

      spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
      spyOn(userService, 'getUserInfoAsync').and.returnValue(userInfo);

      isImprovementsTabEnabledAsyncSpy = spyOn(
        explorationImprovementsService, 'isImprovementsTabEnabledAsync');

      isImprovementsTabEnabledAsyncSpy.and.returnValue(false);

      spyOnProperty(stateTutorialFirstTimeService,
        'onOpenPostTutorialHelpPopover').and.returnValue(
        mockOpenPostTutorialHelpPopover);
      $scope = $rootScope.$new();
      ctrl = $componentController('editorNavigation', {
        $scope: $scope,
        WindowDimensionsService: windowDimensionsService
      });
      ctrl.$onInit();
      $scope.$apply();
    }));

    beforeEach(() => {
      testSubscriptions = new Subscription();
      testSubscriptions.add(
        stateTutorialFirstTimeService.onOpenTranslationTutorial.subscribe(
          openTranslationTutorialSpy));
      testSubscriptions.add(
        stateTutorialFirstTimeService.onOpenEditorTutorial.subscribe(
          openEditorTutorialSpy));
    });

    afterEach(function() {
      testSubscriptions.unsubscribe();
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
      spyOn(explorationWarningsService, 'getWarnings').and.returnValue(
        warnings);
      spyOn(explorationWarningsService, 'countWarnings').and.returnValue(
        warnings.length);
      // This approach was choosen because spyOn() doesn't work on properties
      // that doesn't have a get access type.
      // eslint-disable-next-line max-len
      // ref: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
      Object.defineProperty(explorationWarningsService, 'hasCriticalWarnings', {
        get: () => true
      });
      spyOnProperty(explorationWarningsService, 'hasCriticalWarnings')
        .and.returnValue(true);

      expect($scope.countWarnings()).toBe(2);
      expect($scope.getWarnings()).toEqual(warnings);
      expect($scope.hasCriticalWarnings()).toBe(true);
    });

    it('should open editor tutorial after closing user help modal with mode' +
      'editor', function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve('editor')
      });
      $scope.showUserHelpModal();
      $scope.$apply();

      expect(openEditorTutorialSpy).toHaveBeenCalled();
    });

    it('should open editor tutorial after closing user help modal with mode' +
      'translation', function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve('translation')
      });
      $scope.showUserHelpModal();
      $scope.$apply();

      expect(openTranslationTutorialSpy).toHaveBeenCalled();
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
      spyOn(explorationFeaturesService, 'isInitialized').and.returnValue(true);
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
      spyOn(threadDataService, 'getOpenThreadsCount').and.returnValue(5);
      expect($scope.getOpenThreadsCount()).toBe(5);
    });

    it('should toggle post tutorial help popover when resizing page',
      function() {
        angular.element(window).triggerHandler('resize');
        mockOpenPostTutorialHelpPopover.emit();

        expect(ctrl.postTutorialHelpPopoverIsShown).toBe(true);

        $flushPendingTasks();

        expect(ctrl.postTutorialHelpPopoverIsShown).toBe(false);
      });
  });

  describe('when screen is not large', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $flushPendingTasks = $injector.get('$flushPendingTasks');
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
      $uibModal = $injector.get('$uibModal');
      $verifyNoPendingTasks = $injector.get('$verifyNoPendingTasks');
      contextService = $injector.get('ContextService');
      explorationFeaturesService = $injector.get('ExplorationFeaturesService');
      explorationImprovementsService = $injector.get(
        'ExplorationImprovementsService');
      explorationWarningsService = $injector.get('ExplorationWarningsService');
      userService = $injector.get('UserService');
      threadDataService = $injector.get('ThreadDataService');

      spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
        of(new Event('resize')));
      spyOn(windowDimensionsService, 'getWidth').and.returnValue(768);

      spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
      spyOn(userService, 'getUserInfoAsync').and.returnValue(userInfo);

      isImprovementsTabEnabledAsyncSpy = spyOn(
        explorationImprovementsService, 'isImprovementsTabEnabledAsync');

      isImprovementsTabEnabledAsyncSpy.and.returnValue(false);

      $scope = $rootScope.$new();
      ctrl = $componentController('editorNavigation', {
        $scope: $scope,
        WindowDimensionsService: windowDimensionsService
      });
      ctrl.$onInit();
      $scope.$apply();
    }));

    afterEach(function() {
      ctrl.$onDestroy();
    });

    it('should hide post tutorial help popover when resizing page', function() {
      angular.element(window).triggerHandler('resize');
      $rootScope.$broadcast('openPostTutorialHelpPopover');

      expect(ctrl.postTutorialHelpPopoverIsShown).toBe(false);
    });
  });
});
