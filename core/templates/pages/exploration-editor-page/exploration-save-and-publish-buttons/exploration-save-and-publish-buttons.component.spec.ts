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
 * @fileoverview Unit tests for explorationSaveAndPublishButtons.
 */

import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ContextService } from 'services/context.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { StateInteractionIdService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { UserExplorationPermissionsService } from
  'pages/exploration-editor-page/services/user-exploration-permissions.service';
import { EditabilityService } from 'services/editability.service';
import { TextInputRulesService } from
  'interactions/TextInput/directives/text-input-rules.service';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { StateSolutionService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-solution.service';
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { StateCustomizationArgsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { ExplorationDiffService } from
  'pages/exploration-editor-page/services/exploration-diff.service';
import { StateEditorRefreshService } from
  'pages/exploration-editor-page/services/state-editor-refresh.service';
import { StatesObjectFactory } from 'domain/exploration/StatesObjectFactory';
import { ExplorationImprovementsTaskRegistryService } from
  'services/exploration-improvements-task-registry.service';
import { ExplorationStatsService } from 'services/exploration-stats.service';
import { ReadOnlyExplorationBackendApiService } from
  'domain/exploration/read-only-exploration-backend-api.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { ChangeListService } from '../services/change-list.service';
import { ExplorationChange } from 'domain/exploration/exploration-draft.model';

describe('Exploration save and publish buttons component', function() {
  var ctrl = null;
  var $q = null;
  var $scope = null;
  let changeListService: ChangeListService = null;
  var $uibModal = null;
  var contextService = null;
  var ics = null;
  var explorationRightsService = null;
  var explorationSaveService = null;
  var explorationWarningsService = null;
  var editabilityService = null;
  var userExplorationPermissionsService = null;

  var mockExternalSaveEventEmitter = null;
  var mockConnectionServiceEmitter = new EventEmitter<boolean>();

  beforeEach(angular.mock.module('oppia'));

  importAllAngularServices();

  beforeEach(function() {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ChangeListService
      ]
    });

    changeListService = TestBed.inject(ChangeListService);
    contextService = TestBed.get(ContextService);
    spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
    editabilityService = TestBed.get(EditabilityService);
    userExplorationPermissionsService = TestBed.get(
      UserExplorationPermissionsService);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AngularNameService', TestBed.get(AngularNameService));
    $provide.value(
      'ExplorationDiffService', TestBed.get(ExplorationDiffService));
    $provide.value(
      'ExplorationImprovementsTaskRegistryService',
      TestBed.get(ExplorationImprovementsTaskRegistryService));
    $provide.value(
      'ExplorationStatsService', TestBed.get(ExplorationStatsService));
    mockExternalSaveEventEmitter = new EventEmitter();
    $provide.value('ExternalSaveService', {
      onExternalSave: mockExternalSaveEventEmitter
    });
    $provide.value(
      'TextInputRulesService',
      TestBed.get(TextInputRulesService));
    $provide.value(
      'OutcomeObjectFactory', TestBed.get(OutcomeObjectFactory));
    $provide.value('SiteAnalyticsService', TestBed.get(SiteAnalyticsService));
    $provide.value('StatesObjectFactory', TestBed.get(StatesObjectFactory));
    $provide.value(
      'StateCustomizationArgsService',
      TestBed.get(StateCustomizationArgsService));
    $provide.value(
      'StateEditorRefreshService', TestBed.get(StateEditorRefreshService));
    $provide.value(
      'StateInteractionIdService', TestBed.get(StateInteractionIdService));
    $provide.value('StateSolutionService', TestBed.get(StateSolutionService));
    $provide.value(
      'ReadOnlyExplorationBackendApiService',
      TestBed.get(ReadOnlyExplorationBackendApiService));
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    var $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    changeListService = $injector.get('ChangeListService');
    ics = $injector.get('InternetConnectivityService');
    explorationRightsService = $injector.get('ExplorationRightsService');
    explorationSaveService = $injector.get('ExplorationSaveService');
    explorationWarningsService = $injector.get('ExplorationWarningsService');

    spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
      .returnValue($q.resolve({
        canPublish: true
      }));
    spyOnProperty(ics, 'onInternetStateChange').and.returnValue(
      mockConnectionServiceEmitter);
    spyOn(explorationSaveService, 'saveChangesAsync').and
      .callFake((showCallback, hideCallback) => {
        showCallback();
        hideCallback();
        return $q.resolve();
      });
    spyOn(explorationSaveService, 'showPublishExplorationModal').and
      .callFake((showCallback, hideCallback) => {
        showCallback();
        hideCallback();
        return $q.resolve();
      });

    $scope = $rootScope.$new();
    ctrl = $componentController('explorationSaveAndPublishButtons', {
      $scope: $scope,
      $uibModal: $uibModal,
      InternetConnectivityService: ics,
      EditabilityService: editabilityService,
      UserExplorationPermissionsService: userExplorationPermissionsService
    });
    ctrl.$onInit();
    $scope.$apply();
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should initialize $scope properties after controller initialization',
    function() {
      expect($scope.saveIsInProcess).toBe(false);
      expect($scope.publishIsInProcess).toBe(false);
      expect($scope.loadingDotsAreShown).toBe(false);
    });

  it('should save exploration when saving changes', function() {
    $scope.saveChanges();

    expect($scope.saveIsInProcess).toBe(true);

    $scope.$apply();

    expect($scope.saveIsInProcess).toBe(false);
    expect($scope.loadingDotsAreShown).toBe(false);
  });

  it('should check if exploration is editable', function() {
    spyOn(editabilityService, 'isLockedByAdmin').and.returnValue(true);
    expect($scope.isLockedByAdmin()).toBe(true);
  });

  it('should publish exploration when show publish exploration is shown',
    function() {
      $scope.showPublishExplorationModal();

      expect($scope.publishIsInProcess).toBe(true);

      $scope.$apply();

      expect($scope.publishIsInProcess).toBe(false);
      expect($scope.loadingDotsAreShown).toBe(false);
    });

  it('should resolve the warnings before saving exploration when exploration' +
    ' has critical warnings', function() {
    spyOn(explorationWarningsService, 'hasCriticalWarnings').and.returnValue(1);
    expect($scope.getSaveButtonTooltip()).toBe('Please resolve the warnings.');
  });

  it('should save exploration draft when it has no warnings and exploration' +
    ' is private', function() {
    spyOn(explorationWarningsService, 'hasCriticalWarnings').and.returnValue(0);
    spyOn(explorationRightsService, 'isPrivate').and.returnValue(true);
    expect($scope.getSaveButtonTooltip()).toBe('Save Draft');
  });

  it('should publish exploration changes when it has no warnings and it is' +
    ' public', function() {
    spyOn(explorationWarningsService, 'hasCriticalWarnings').and.returnValue(0);
    spyOn(explorationRightsService, 'isPrivate').and.returnValue(false);
    expect($scope.getSaveButtonTooltip()).toBe('Publish Changes');
  });

  it('should ask user to resolve the warnings before publishing' +
    ' exploration when exploration has warnings', function() {
    spyOn(explorationWarningsService, 'countWarnings').and.returnValue(1);
    expect($scope.getPublishExplorationButtonTooltip()).toBe(
      'Please resolve the warnings before publishing.');
  });

  it('should save exploration changes before publishing it when trying to' +
    ' publish a changed exploration without saving it first', function() {
    spyOn(explorationWarningsService, 'countWarnings').and.returnValue(0);
    spyOn(changeListService, 'isExplorationLockedForEditing').and
      .returnValue(true);
    expect($scope.getPublishExplorationButtonTooltip()).toBe(
      'Please save your changes before publishing.');
  });

  it('should publish exploration when it is already saved', function() {
    spyOn(explorationWarningsService, 'countWarnings').and.returnValue(0);
    spyOn(changeListService, 'isExplorationLockedForEditing')
      .and.returnValue(false);
    expect($scope.getPublishExplorationButtonTooltip()).toBe(
      'Publish to Oppia Library');
  });

  it('should discard changes when exploration is changed', function() {
    spyOn(explorationSaveService, 'discardChanges');
    $scope.discardChanges();
    expect(explorationSaveService.discardChanges).toHaveBeenCalled();
  });

  it('should get whether exploration is saveable', function() {
    spyOn(explorationSaveService, 'isExplorationSaveable')
      .and.returnValue(true);
    expect($scope.isExplorationSaveable()).toBe(true);
  });

  it('should count changes made in an exploration', function() {
    spyOn(changeListService, 'getChangeList').and.returnValue(
      [{}, {}] as ExplorationChange[]);
    expect($scope.getChangeListLength()).toBe(2);
  });

  it('should save or publish exploration when editing outside tutorial mode' +
    ' and exploration is translatable', function() {
    spyOn(editabilityService, 'isEditableOutsideTutorialMode').and
      .returnValue(false);
    spyOn(editabilityService, 'isTranslatable').and.returnValue(true);
    expect($scope.isEditableOutsideTutorialMode()).toBe(true);
  });

  it('should save or publish exploration when editing outside tutorial mode' +
    ' and exploration is not translatable', function() {
    spyOn(editabilityService, 'isEditableOutsideTutorialMode').and
      .returnValue(true);
    spyOn(editabilityService, 'isTranslatable').and.returnValue(false);
    expect($scope.isEditableOutsideTutorialMode()).toBe(true);
  });

  it('should not save and publish exploration when editing inside tutorial' +
    ' mode and exploration is not translatable', function() {
    spyOn(editabilityService, 'isEditableOutsideTutorialMode').and
      .returnValue(false);
    spyOn(editabilityService, 'isTranslatable').and.returnValue(false);
    expect($scope.isEditableOutsideTutorialMode()).toBe(false);
  });

  it('should display publish button when the exploration is unpublished',
    function() {
      $scope.explorationCanBePublished = false;

      userExplorationPermissionsService.
        onUserExplorationPermissionsFetched.emit();
      $scope.$apply();

      expect(userExplorationPermissionsService.getPermissionsAsync)
        .toHaveBeenCalled();
      expect($scope.explorationCanBePublished).toBe(true);
    });

  it('should fetch userExplorationPermissions when ' +
    'showPublishExplorationModal is called', function() {
    var userPermissions = {
      canPublish: true
    };
    $scope.explorationCanBePublished = false;
    spyOn(userExplorationPermissionsService, 'fetchPermissionsAsync').and
      .returnValue($q.resolve(userPermissions));

    $scope.showPublishExplorationModal();
    $scope.$apply();

    expect($scope.publishIsInProcess).toBe(false);
    expect($scope.loadingDotsAreShown).toBe(false);
    expect(userExplorationPermissionsService.fetchPermissionsAsync)
      .toHaveBeenCalled();
    expect($scope.explorationCanBePublished).toBe(true);
  });

  it('should unsubscribe when onDestroy runs', function() {
    spyOn(ctrl.directiveSubscriptions, 'unsubscribe');

    ctrl.$onDestroy();

    expect(ctrl.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });

  it('should open a exploration save prompt modal', function() {
    spyOn(changeListService, 'getChangeList').and.returnValue(new Array(51));
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve()
    });
    spyOn($scope, 'saveChanges');
    $scope.saveIsInProcess = false;

    $scope.getChangeListLength();
    $scope.$apply();

    expect($uibModal.open).toHaveBeenCalled();
    expect($scope.saveChanges).toHaveBeenCalled();
  });

  it('should open a exploration save prompt modal only once',
    function() {
      spyOn(changeListService, 'getChangeList').and.returnValue(new Array(51));
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });
      spyOn($scope, 'saveChanges');
      $scope.saveIsInProcess = false;

      $scope.getChangeListLength();
      $scope.$apply();
      expect($uibModal.open).toHaveBeenCalledTimes(1);
      expect($scope.saveChanges).not.toHaveBeenCalled();
      $scope.getChangeListLength();
      $scope.$apply();

      expect($uibModal.open).toHaveBeenCalledTimes(1);
      expect($scope.saveChanges).not.toHaveBeenCalled();
    });

  it('should open a confirmation modal with rejection', function() {
    spyOn(changeListService, 'getChangeList').and.returnValue(new Array(51));
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    spyOn($scope, 'saveChanges');
    $scope.saveIsInProcess = false;

    $scope.getChangeListLength();
    $scope.$apply();

    expect($uibModal.open).toHaveBeenCalled();
    expect($scope.saveChanges).not.toHaveBeenCalled();
  });

  it('should open a confirmation modal when save is in progress', function() {
    spyOn(changeListService, 'getChangeList').and.returnValue(new Array(51));
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    spyOn($scope, 'saveChanges');
    $scope.saveIsInProcess = true;

    $scope.getChangeListLength();
    $scope.$apply();

    expect($uibModal.open).not.toHaveBeenCalled();
    expect($scope.saveChanges).not.toHaveBeenCalled();
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
      expect($scope.getSaveButtonTooltip()).toBe(
        'You can not save the exploration when offline.');
      expect($scope.getPublishExplorationButtonTooltip()).toBe(
        'You can not publish the exploration when offline.');
    });
});
