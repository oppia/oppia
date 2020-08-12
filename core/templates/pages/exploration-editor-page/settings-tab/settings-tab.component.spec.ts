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
 * @fileoverview Unit tests for settingsTab.
 */

import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AnswerGroupsCacheService } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/editor-tab/services/answer-groups-cache.service';
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
import { StateInteractionIdService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { AlertsService } from 'services/alerts.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { UserExplorationPermissionsService } from
  'pages/exploration-editor-page/services/user-exploration-permissions.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

class MockRouterService {
  private refreshSettingsTabEventEmitter: EventEmitter<void>;
  get onRefreshSettingsTab() {
    return this.refreshSettingsTabEventEmitter;
  }
  set refreshSettingsTabEmitter(val) {
    this.refreshSettingsTabEventEmitter = val;
  }
}

describe('Settings Tab Component', function() {
  var ctrl = null;
  var $httpBackend = null;
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var $uibModal = null;
  var alertsService = null;
  var changeListService = null;
  var contextService = null;
  var editableExplorationBackendApiService = null;
  var explorationCategoryService = null;
  var explorationInitStateNameService = null;
  var explorationLanguageCodeService = null;
  var explorationObjectiveService = null;
  var explorationRightsService = null;
  var explorationStatesService = null;
  var explorationTagsService = null;
  var explorationTitleService = null;
  var explorationWarningsService = null;
  var userEmailPreferencesService = null;
  var userExplorationPermissionsService = null;
  var windowRef = null;
  var routerService = null;

  var explorationId = 'exp1';
  var userPermissions = {
    canDelete: true,
    canModifyRoles: true,
    canReleaseOwnership: true,
    canUnpublish: true
  };

  beforeEach(function() {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    alertsService = TestBed.get(AlertsService);
    userExplorationPermissionsService = (
      TestBed.get(UserExplorationPermissionsService));
    windowRef = TestBed.get(WindowRef);
    routerService = new MockRouterService();
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AngularNameService', TestBed.get(AngularNameService));
    $provide.value(
      'AnswerGroupsCacheService', TestBed.get(AnswerGroupsCacheService));
    $provide.value(
      'TextInputRulesService',
      TestBed.get(TextInputRulesService));
    $provide.value(
      'OutcomeObjectFactory', TestBed.get(OutcomeObjectFactory));
    $provide.value(
      'StateCustomizationArgsService',
      TestBed.get(StateCustomizationArgsService));
    $provide.value('StateInteractionIdService',
      TestBed.get(StateInteractionIdService));
    $provide.value('StateSolutionService', TestBed.get(StateSolutionService));
    $provide.value('ExplorationDataService', {
      explorationId: explorationId,
      getData: () => $q.resolve(),
      autosaveChangeList: () => {}
    });
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $httpBackend = $injector.get('$httpBackend');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    changeListService = $injector.get('ChangeListService');
    contextService = $injector.get('ContextService');
    spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
    editableExplorationBackendApiService = $injector.get(
      'EditableExplorationBackendApiService');
    explorationCategoryService = $injector.get('ExplorationCategoryService');
    explorationInitStateNameService = $injector.get(
      'ExplorationInitStateNameService');
    explorationLanguageCodeService = $injector.get(
      'ExplorationLanguageCodeService');
    explorationObjectiveService = $injector.get('ExplorationObjectiveService');
    explorationRightsService = $injector.get('ExplorationRightsService');
    explorationStatesService = $injector.get('ExplorationStatesService');
    explorationTagsService = $injector.get('ExplorationTagsService');
    explorationTitleService = $injector.get('ExplorationTitleService');
    explorationWarningsService = $injector.get('ExplorationWarningsService');
    userEmailPreferencesService = $injector.get('UserEmailPreferencesService');

    spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
      .returnValue($q.resolve(userPermissions));
    spyOn(explorationStatesService, 'isInitialized').and.returnValue(true);
    spyOn(explorationStatesService, 'getStateNames').and.returnValue([
      'Introduction']);

    explorationCategoryService.init('Astrology');

    routerService.refreshSettingsTabEmitter = new EventEmitter();
    $scope = $rootScope.$new();
    ctrl = $componentController('settingsTab', {
      $scope: $scope,
      AlertsService: alertsService,
      UserExplorationPermissionsService: userExplorationPermissionsService,
      RouterService: routerService,
      WindowRef: windowRef
    });
    ctrl.$onInit();
    $scope.$apply();
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should evaluate controller properties after its initialization',
    function() {
      expect(ctrl.isRolesFormOpen).toBe(false);
      expect(ctrl.canDelete).toBe(true);
      expect(ctrl.canModifyRoles).toBe(true);
      expect(ctrl.canReleaseOwnership).toBe(true);
      expect(ctrl.canUnpublish).toBe(true);
      expect(ctrl.explorationId).toBe(explorationId);

      expect(ctrl.CATEGORY_LIST_FOR_SELECT2[0]).toEqual({
        id: 'Astrology',
        text: 'Astrology'
      });

      expect(ctrl.stateNames).toEqual(['Introduction']);
      expect(ctrl.hasPageLoaded).toBe(true);
    });

  it('should refresh settings tab when refreshSettingsTab flag is broadcasted',
    function() {
      $rootScope.$broadcast('refreshSettingsTab');
      $scope.$apply();

      expect(ctrl.stateNames).toEqual(['Introduction']);
      expect(ctrl.hasPageLoaded).toBe(true);
    });

  it('should get explore page url', function() {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        protocol: 'https:',
        host: 'oppia.org'
      }
    });
    expect(ctrl.getExplorePageUrl()).toBe('https://oppia.org/explore/exp1');
  });

  it('should save exploration title', function() {
    spyOn(explorationTitleService, 'saveDisplayedValue');
    explorationTitleService.init('New title');

    ctrl.saveExplorationTitle();

    expect(explorationTitleService.saveDisplayedValue).toHaveBeenCalled();
    expect(ctrl.isTitlePresent()).toBe(true);
  });

  it('should save exploration category', function() {
    spyOn(explorationCategoryService, 'saveDisplayedValue');
    explorationCategoryService.init('New Category');

    ctrl.saveExplorationCategory();

    expect(explorationCategoryService.saveDisplayedValue).toHaveBeenCalled();
  });

  it('should save exploration language code', function() {
    spyOn(explorationLanguageCodeService, 'saveDisplayedValue');
    explorationLanguageCodeService.init('hi-en');

    ctrl.saveExplorationLanguageCode();

    expect(explorationLanguageCodeService.saveDisplayedValue)
      .toHaveBeenCalled();
  });

  it('should save exploration objective', function() {
    spyOn(explorationObjectiveService, 'saveDisplayedValue');
    explorationObjectiveService.init('New Objective');

    ctrl.saveExplorationObjective();

    expect(explorationObjectiveService.saveDisplayedValue).toHaveBeenCalled();
  });

  it('should save exploration tags', function() {
    spyOn(explorationTagsService, 'saveDisplayedValue');
    explorationTagsService.init('testing');

    ctrl.saveExplorationTags();

    expect(explorationTagsService.saveDisplayedValue).toHaveBeenCalled();
  });

  it('should not save exploration init state name if it\'s invalid',
    function() {
      explorationInitStateNameService.init('First State');
      spyOn(explorationStatesService, 'getState').and.returnValue(false);
      spyOn(alertsService, 'addWarning');

      ctrl.saveExplorationInitStateName();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Invalid initial state name: First State');
    });

  it('should save exploration init state name successfully and refresh graph',
    function() {
      explorationInitStateNameService.init('Introduction');
      spyOn(explorationStatesService, 'getState').and.returnValue(true);
      spyOn(explorationInitStateNameService, 'saveDisplayedValue');
      spyOn($rootScope, '$broadcast');

      ctrl.saveExplorationInitStateName();

      expect(explorationInitStateNameService.saveDisplayedValue)
        .toHaveBeenCalled();
      expect($rootScope.$broadcast).toHaveBeenCalledWith('refreshGraph');
    });

  it('should delete exploration when closing delete exploration modal',
    function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });
      spyOn(editableExplorationBackendApiService, 'deleteExploration').and
        .returnValue($q.resolve());
      spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
        location: {
          reload: () => {}
        }
      });

      ctrl.deleteExploration();
      $scope.$apply();

      expect(windowRef.nativeWindow.location).toBe('/creator-dashboard');
    });

  it('should not delete exploration when dismissing delete exploration modal',
    function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });
      spyOn(alertsService, 'clearWarnings');
      spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
        location: ''
      });

      ctrl.deleteExploration();
      $scope.$apply();

      expect(alertsService.clearWarnings).toHaveBeenCalled();
      expect(windowRef.nativeWindow.location).toBe('');
    });

  it('should transfer exploration ownership when closing transfer ownership' +
    ' modal', function() {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve()
    });
    spyOn(explorationRightsService, 'makeCommunityOwned');

    ctrl.showTransferExplorationOwnershipModal();
    $scope.$apply();

    expect(explorationRightsService.makeCommunityOwned).toHaveBeenCalled();
  });

  it('should not transfer exploration ownership when dismissing transfer' +
    ' ownership modal', function() {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    spyOn(alertsService, 'clearWarnings');

    ctrl.showTransferExplorationOwnershipModal();
    $scope.$apply();

    expect(alertsService.clearWarnings).toHaveBeenCalled();
  });

  it('should open preview summary tile modal with $uibModal',
    function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });

      ctrl.previewSummaryTile();
      $scope.$apply();

      expect($uibModal.open).toHaveBeenCalled();
    });

  it('should clear alerts warning when dismissing preview summary tile modal',
    function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });
      spyOn(alertsService, 'clearWarnings');

      ctrl.previewSummaryTile();
      $scope.$apply();

      expect(alertsService.clearWarnings).toHaveBeenCalled();
    });

  it('should open preview summary tile modal with $uibModal', function() {
    spyOn($uibModal, 'open').and.callThrough();

    $httpBackend.expect('GET', '/moderatorhandler/email_draft').respond({
      draft_email_body: 'Draf message'
    });
    ctrl.unpublishExplorationAsModerator();
    $httpBackend.flush();
    $scope.$apply();

    expect($uibModal.open).toHaveBeenCalled();
  });

  it('should save moderator changes to backend when closing preview summary' +
    ' tile modal', function() {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve('Email body')
    });
    spyOn(explorationRightsService, 'saveModeratorChangeToBackend');

    $httpBackend.expect('GET', '/moderatorhandler/email_draft').respond({
      draft_email_body: 'Draf message'
    });
    ctrl.unpublishExplorationAsModerator();
    $httpBackend.flush();
    $scope.$apply();

    expect(explorationRightsService.saveModeratorChangeToBackend)
      .toHaveBeenCalledWith('Email body');
  });

  it('should clear alerts warning when dismissing preview summary tile modal',
    function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });
      spyOn(alertsService, 'clearWarnings');

      $httpBackend.expect('GET', '/moderatorhandler/email_draft').respond({
        draft_email_body: 'Draf message'
      });
      ctrl.unpublishExplorationAsModerator();
      $httpBackend.flush();
      $scope.$apply();

      expect(alertsService.clearWarnings).toHaveBeenCalled();
    });

  it('should toggle notifications', function() {
    var feedbackNotificationsSpy = spyOn(
      userEmailPreferencesService, 'setFeedbackNotificationPreferences');
    var suggestionNotificationsSpy = spyOn(
      userEmailPreferencesService, 'setSuggestionNotificationPreferences');

    ctrl.muteFeedbackNotifications();
    expect(feedbackNotificationsSpy).toHaveBeenCalledWith(true);

    ctrl.unmuteFeedbackNotifications();
    expect(feedbackNotificationsSpy).toHaveBeenCalledWith(false);

    ctrl.muteSuggestionNotifications();
    expect(suggestionNotificationsSpy).toHaveBeenCalledWith(true);

    ctrl.unmuteSuggestionNotifications();
    expect(suggestionNotificationsSpy).toHaveBeenCalledWith(false);
  });

  it('should open edit roles form and edit username and role', function() {
    ctrl.openEditRolesForm();

    expect(ctrl.isRolesFormOpen).toBe(true);
    expect(ctrl.newMemberUsername).toBe('');
    expect(ctrl.newMemberRole.value).toBe('owner');

    spyOn(explorationRightsService, 'saveRoleChanges');
    ctrl.editRole('Username1', 'editor');

    expect(explorationRightsService.saveRoleChanges).toHaveBeenCalledWith(
      'Username1', 'editor');
    expect(ctrl.isRolesFormOpen).toBe(false);
  });

  it('should open edit roles form and close it', function() {
    ctrl.openEditRolesForm();

    expect(ctrl.isRolesFormOpen).toBe(true);
    expect(ctrl.newMemberUsername).toBe('');
    expect(ctrl.newMemberRole.value).toBe('owner');

    ctrl.closeEditRolesForm();

    expect(ctrl.isRolesFormOpen).toBe(false);
    expect(ctrl.newMemberUsername).toBe('');
    expect(ctrl.newMemberRole.value).toBe('owner');
  });

  it('should evaluate when parameters are enabled', function() {
    ctrl.enableParameters();
    expect(ctrl.areParametersEnabled()).toBe(true);
  });

  it('should evaluate when automatic text to speech is enabled', function() {
    ctrl.toggleAutomaticTextToSpeech();
    expect(ctrl.isAutomaticTextToSpeechEnabled()).toBe(true);
    ctrl.toggleAutomaticTextToSpeech();
    expect(ctrl.isAutomaticTextToSpeechEnabled()).toBe(false);
  });

  it('should evaluate when correctness feedback is enabled', function() {
    ctrl.toggleCorrectnessFeedback();
    expect(ctrl.isCorrectnessFeedbackEnabled()).toBe(true);
    ctrl.toggleCorrectnessFeedback();
    expect(ctrl.isCorrectnessFeedbackEnabled()).toBe(false);
  });

  it('should check if exploration is locked for editing', function() {
    var changeListSpy = spyOn(
      changeListService, 'isExplorationLockedForEditing');

    changeListSpy.and.returnValue(true);
    expect(ctrl.isExplorationLockedForEditing()).toBe(true);

    changeListSpy.and.returnValue(false);
    expect(ctrl.isExplorationLockedForEditing()).toBe(false);
  });

  it('should update warnings when save param changes hook', function() {
    spyOn(explorationWarningsService, 'updateWarnings');

    ctrl.postSaveParamChangesHook();
    expect(explorationWarningsService.updateWarnings).toHaveBeenCalled();
  });

  it('should toggle exploration visibility', function() {
    spyOn(explorationRightsService, 'setViewability');
    spyOn(explorationRightsService, 'viewableIfPrivate').and.returnValue(false);
    ctrl.toggleViewabilityIfPrivate();

    expect(explorationRightsService.setViewability).toHaveBeenCalledWith(true);
  });

  it('should refresh settings tab when refreshSettingsTab event occurs',
    function() {
      spyOn(ctrl, 'refreshSettingsTab').and.callThrough();
      routerService.onRefreshSettingsTab.emit();
      expect(ctrl.refreshSettingsTab).toHaveBeenCalled();
    });
});
