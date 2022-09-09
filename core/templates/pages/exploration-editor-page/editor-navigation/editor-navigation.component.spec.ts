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
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, Subscription } from 'rxjs';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterService } from '../services/router.service';
import { UserService } from 'services/user.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';

// TODO(#7222): Remove usage of UpgradedServices once upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { ChangeListService } from '../services/change-list.service';
import { HelpModalComponent } from '../modal-templates/help-modal.component';

require('services/ngb-modal.service.ts');

class MockNgbModalRef {
  componentInstance = {};
}

describe('Editor Navigation Component', function() {
  var ctrl = null;
  var $flushPendingTasks = null;
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var $verifyNoPendingTasks = null;
  var contextService = null;
  var explorationFeaturesService = null;
  var explorationImprovementsService = null;
  var explorationWarningsService = null;
  var stateTutorialFirstTimeService = null;
  var threadDataBackendApiService = null;
  var userService = null;
  let routerService = null;
  var windowDimensionsService = null;
  var internetConnectivityService = null;

  let ngbModal: NgbModal;

  var mockOpenPostTutorialHelpPopover = new EventEmitter();
  var mockConnectionServiceEmitter = new EventEmitter<boolean>();

  var testSubscriptions: Subscription;

  const openEditorTutorialSpy = jasmine.createSpy('openEditorTutorial');
  const openTranslationTutorialSpy = (
    jasmine.createSpy('openTranslationTutorial'));

  var explorationRightsService = null;
  var editabilityService = null;
  var explorationSaveService = null;
  let changeListService: ChangeListService = null;
  var explorationId = 'exp1';
  var userInfo = {
    isLoggedIn: () => true
  };
  var isImprovementsTabEnabledAsyncSpy = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NgbModule
      ],
      declarations: [
        HelpModalComponent,
      ],
      providers: [
        ChangeListService,
        RouterService
      ]
    });
  });

  importAllAngularServices();

  beforeEach(function() {
    windowDimensionsService = TestBed.get(WindowDimensionsService);
    userService = TestBed.get(UserService);
    changeListService = TestBed.inject(ChangeListService);
    ngbModal = TestBed.inject(NgbModal);
    routerService = TestBed.inject(RouterService);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  describe('when screen is large', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $flushPendingTasks = $injector.get('$flushPendingTasks');
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
      $verifyNoPendingTasks = $injector.get('$verifyNoPendingTasks');
      contextService = $injector.get('ContextService');
      explorationRightsService = $injector.get('ExplorationRightsService');
      explorationSaveService = $injector.get('ExplorationSaveService');
      editabilityService = $injector.get('EditabilityService');
      explorationFeaturesService = $injector.get('ExplorationFeaturesService');
      explorationImprovementsService = $injector.get(
        'ExplorationImprovementsService');
      explorationWarningsService = $injector.get('ExplorationWarningsService');
      threadDataBackendApiService = (
        $injector.get('ThreadDataBackendApiService'));
      stateTutorialFirstTimeService = (
        $injector.get('StateTutorialFirstTimeService'));
      internetConnectivityService = $injector.get(
        'InternetConnectivityService');

      spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
        of(new Event('resize')));
      spyOn(windowDimensionsService, 'getWidth').and.returnValue(1200);

      spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
      spyOn(userService, 'getUserInfoAsync').
        and.returnValue(userInfo);
      spyOnProperty(
        internetConnectivityService, 'onInternetStateChange').and.returnValue(
        mockConnectionServiceEmitter);

      isImprovementsTabEnabledAsyncSpy = spyOn(
        explorationImprovementsService, 'isImprovementsTabEnabledAsync');

      isImprovementsTabEnabledAsyncSpy.and.returnValue(false);
      var MockUserExplorationPermissionsService = {
        getPermissionsAsync: () => {
          var deferred = $q.defer();
          deferred.resolve({
            canPublish: true
          });
          return deferred.promise;
        }
      };

      spyOnProperty(
        stateTutorialFirstTimeService,
        'onOpenPostTutorialHelpPopover').and.returnValue(
        mockOpenPostTutorialHelpPopover);
      $scope = $rootScope.$new();
      ctrl = $componentController('editorNavigation', {
        NgbModal: ngbModal,
        $scope: $scope,
        WindowDimensionsService: windowDimensionsService,
        InternetConnectivityService: internetConnectivityService,
        UserExplorationPermissionsService: MockUserExplorationPermissionsService
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

    it('should initialize $scope properties after controller is initialized',
      function() {
        spyOn(explorationRightsService, 'isPrivate').and.returnValue(true);
        expect($scope.isPostTutorialHelpPopoverShown())
          .toBe(false);
        expect($scope.isScreenLarge()).toBe(true);
        expect($scope.isUserLoggedIn()).toBe(true);
        expect($scope.isImprovementsTabEnabled()).toBe(false);
        expect($scope.showPublishButton()).toEqual(true);
      });

    it('should get warnings whenever has one', function() {
      var warnings = [{
        type: 'ERROR'
      }, {
        type: 'CRITICAL'
      }];
      spyOn(explorationWarningsService, 'getWarnings').and.returnValue(
        warnings);
      spyOn(explorationWarningsService, 'countWarnings').and.returnValue(
        warnings.length);
      // This approach was chosen because spyOn() doesn't work on properties
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
      spyOn(ngbModal, 'open').and.returnValue(
        {
          componentInstance: new MockNgbModalRef(),
          result: $q.resolve('editor')
        } as NgbModalRef
      );

      $scope.showUserHelpModal();
      $scope.$apply();

      expect(openEditorTutorialSpy).toHaveBeenCalled();
    });

    it('should open editor tutorial after closing user help modal with mode' +
      'translation', function() {
      spyOn(ngbModal, 'open').and.returnValue(
          {
            componentInstance: new MockNgbModalRef(),
            result: $q.resolve('translation')
          } as NgbModalRef
      );

      $scope.showUserHelpModal();
      $scope.$apply();

      expect(openTranslationTutorialSpy).toHaveBeenCalled();
    });

    it('should return if exploration is private', function() {
      spyOn(explorationRightsService, 'isPrivate').and.returnValue(true);
      expect($scope.isPrivate()).toEqual(true);
    });

    it('should return if exploration is locked for editing', function() {
      spyOn(
        changeListService,
        'isExplorationLockedForEditing').and.returnValue(true);
      expect($scope.isExplorationLockedForEditing()).toEqual(true);
    });

    it('should return if exploration is editable outside tutorial mode',
      function() {
        spyOn(
          editabilityService,
          'isEditableOutsideTutorialMode').and.returnValue(true);
        spyOn(editabilityService, 'isTranslatable').and.returnValue(true);
        expect($scope.isEditableOutsideTutorialMode()).toEqual(true);
      });

    it('should call exploration save service to discard changes', function() {
      var explorationSpy = spyOn(explorationSaveService, 'discardChanges');
      $scope.discardChanges();
      expect(explorationSpy).toHaveBeenCalled();
    });

    it('should call exploration save service to save changes', function() {
      var deferred = $q.defer();
      deferred.resolve();
      var explorationSpy = spyOn(
        explorationSaveService,
        'saveChangesAsync').and.returnValue(deferred.promise);
      $scope.saveChanges();
      $rootScope.$apply();
      expect(explorationSpy).toHaveBeenCalled();
    });

    it('should show/hide the loading dots', function() {
      $scope.showLoadingDots();
      expect($scope.loadingDotsAreShown).toEqual(true);
      $scope.hideLoadingDots();
      expect($scope.loadingDotsAreShown).toEqual(false);
    });

    it('should return if exploration is saveable', function() {
      spyOn(
        explorationSaveService, 'isExplorationSaveable').and.returnValue(true);
      expect($scope.isExplorationSaveable()).toEqual(true);
    });

    it('should toggle mobile nav options', function() {
      $scope.mobileNavOptionsAreShown = false;
      $scope.toggleMobileNavOptions();
      expect($scope.mobileNavOptionsAreShown).toEqual(true);
      $scope.toggleMobileNavOptions();
      expect($scope.mobileNavOptionsAreShown).toEqual(false);
    });

    it('should return the number of changes', function() {
      spyOn(
        changeListService, 'getChangeList').and.returnValue([]);
      expect($scope.getChangeListLength()).toEqual(0);
    });

    it('should hide loading dots after publishing the exploration', function() {
      $scope.loadingDotsAreShown = true;
      var deferred = $q.defer();
      deferred.resolve();
      spyOn(
        explorationSaveService,
        'showPublishExplorationModal').and.returnValue(deferred.promise);
      $scope.showPublishExplorationModal();
      $rootScope.$apply();
      expect($scope.loadingDotsAreShown).toEqual(false);
    });

    it('should navigate to main tab when clicking on tab', function() {
      spyOn(routerService, 'getActiveTabName')
        .and.returnValue('main');

      $scope.selectMainTab();
      $rootScope.$apply();
      expect($scope.getActiveTabName()).toBe('main');
    });

    it('should navigate to translation tab when clicking on tab', function() {
      spyOn(routerService, 'getActiveTabName')
        .and.returnValue('translation');

      $scope.selectTranslationTab();
      $rootScope.$apply();
      expect($scope.getActiveTabName()).toBe('translation');
    });

    it('should navigate to preview tab when clicking on tab', function() {
      spyOn(routerService, 'getActiveTabName')
        .and.returnValue('preview');

      $scope.selectPreviewTab();
      $rootScope.$apply();
      $flushPendingTasks();
      $verifyNoPendingTasks('timeout');

      expect($scope.getActiveTabName()).toBe('preview');
    });

    it('should navigate to settings tab when clicking on tab', function() {
      spyOn(routerService, 'getActiveTabName')
        .and.returnValue('settings');

      $scope.selectSettingsTab();
      $rootScope.$apply();
      expect($scope.getActiveTabName()).toBe('settings');
    });

    it('should navigate to stats tab when clicking on tab', function() {
      spyOn(routerService, 'getActiveTabName')
        .and.returnValue('stats');

      $scope.selectStatsTab();
      $rootScope.$apply();
      expect($scope.getActiveTabName()).toBe('stats');
    });

    it('should navigate to improvements tab when clicking on tab', function() {
      spyOn(routerService, 'getActiveTabName')
        .and.returnValue('improvements');

      spyOn(explorationFeaturesService, 'isInitialized').and.returnValue(true);
      isImprovementsTabEnabledAsyncSpy.and.returnValue(true);
      $scope.selectImprovementsTab();
      $rootScope.$apply();
      expect($scope.getActiveTabName()).toBe('improvements');
    });

    it('should navigate to history tab when clicking on tab', function() {
      spyOn(routerService, 'getActiveTabName')
        .and.returnValue('history');

      $scope.selectHistoryTab();
      $rootScope.$apply();
      expect($scope.getActiveTabName()).toBe('history');
    });

    it('should navigate to feedback tab when clicking on tab', function() {
      spyOn(routerService, 'getActiveTabName')
        .and.returnValue('feedback');

      $scope.selectFeedbackTab();
      $rootScope.$apply();
      expect($scope.getActiveTabName()).toBe('feedback');
    });

    it('should get open thread count', function() {
      spyOn(
        threadDataBackendApiService, 'getOpenThreadsCount').and.returnValue(5);
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

    it('should change connnection status to ONLINE when internet is connected',
      () => {
        $scope.connectedToInternet = false;
        mockConnectionServiceEmitter.emit(true);
        $scope.$apply();
        expect($scope.connectedToInternet).toBe(true);
      });

    it('should change connnection status to OFFLINE when internet disconnects',
      () => {
        $scope.connectedToInternet = true;
        mockConnectionServiceEmitter.emit(false);
        $scope.$apply();
        expect($scope.connectedToInternet).toBe(false);
      });
  });

  describe('when screen is not large', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $flushPendingTasks = $injector.get('$flushPendingTasks');
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
      $verifyNoPendingTasks = $injector.get('$verifyNoPendingTasks');
      contextService = $injector.get('ContextService');
      explorationFeaturesService = $injector.get('ExplorationFeaturesService');
      explorationImprovementsService = $injector.get(
        'ExplorationImprovementsService');
      explorationWarningsService = $injector.get('ExplorationWarningsService');
      threadDataBackendApiService = (
        $injector.get('ThreadDataBackendApiService'));
      stateTutorialFirstTimeService = (
        $injector.get('StateTutorialFirstTimeService'));

      spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
        of(new Event('resize')));
      spyOn(windowDimensionsService, 'getWidth').and.returnValue(768);

      spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
      spyOn(userService, 'getUserInfoAsync')
        .and.returnValue(userInfo);

      spyOnProperty(
        stateTutorialFirstTimeService,
        'onOpenPostTutorialHelpPopover').and.returnValue(
        mockOpenPostTutorialHelpPopover);

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
      mockOpenPostTutorialHelpPopover.emit();
      expect(ctrl.postTutorialHelpPopoverIsShown).toBe(false);
    });
  });
});
