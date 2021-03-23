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
 * @fileoverview Unit tests for exploration editor page component.
 */

import { EventEmitter } from '@angular/core';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { StateEditorService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-editor.service';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { ParamSpecsObjectFactory } from
  'domain/exploration/ParamSpecsObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { StateEditorRefreshService } from
  'pages/exploration-editor-page/services/state-editor-refresh.service';
import { UserExplorationPermissionsService } from
  'pages/exploration-editor-page/services/user-exploration-permissions.service';
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';
import { ContextService } from 'services/context.service';
import { EditabilityService } from 'services/editability.service';
import { ExplorationFeaturesBackendApiService } from
  'services/exploration-features-backend-api.service';
import { ExplorationFeaturesService } from
  'services/exploration-features.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { StateTopAnswersStatsBackendApiService } from
  'services/state-top-answers-stats-backend-api.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { importAllAngularServices } from 'tests/unit-test-utils';

require('pages/exploration-editor-page/exploration-editor-page.component.ts');
require(
  'pages/exploration-editor-page/services/' +
  'state-tutorial-first-time.service.ts');

describe('Exploration editor page component', function() {
  importAllAngularServices();

  var ctrl = null;

  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var $uibModal = null;
  var aims = null;
  var cls = null;
  var cs = null;
  var efbas = null;
  var eis = null;
  var ers = null;
  var es = null;
  var eps = null;
  var ess = null;
  var esaves = null;
  var ets = null;
  var ews = null;
  var gds = null;
  var pts = null;
  var rs = null;
  var sas = null;
  var sers = null;
  var ses = null;
  var sts = null;
  var stass = null;
  var stfts = null;
  var tds = null;
  var ueps = null;
  var mockEnterEditorForTheFirstTime = null;
  var registerAcceptTutorialModalEventSpy;
  var registerDeclineTutorialModalEventSpy;
  var focusManagerService = null;

  var refreshGraphEmitter = new EventEmitter();

  var autosaveIsInProgress = new EventEmitter();

  var mockOpenEditorTutorialEmitter = new EventEmitter();
  var mockOpenTranslationTutorialEmitter = new EventEmitter();

  var mockInitExplorationPageEmitter = new EventEmitter();

  var explorationId = 'exp1';
  var explorationData = {
    exploration_is_linked_to_story: true,
    states: {
      Introduction: {
        param_changes: [],
        content: {
          html: '',
        },
        unresolved_answers: {},
        interaction: {
          customization_args: {},
          answer_groups: [],
          default_outcome: {
            param_changes: [],
            dest: 'Final',
            feedback: {
              content_id: 'content_1',
              html: ''
            },
          },
          confirmed_unclassified_answers: [],
          id: null,
          hints: [],
        },
        recorded_voiceovers: {
          voiceovers_mapping: {}
        },
        written_translations: {
          translations_mapping: {}
        },
      },
      Final: {
        param_changes: [],
        content: {
          html: '',
          audio_translations: {}
        },
        unresolved_answers: {},
        interaction: {
          customization_args: {},
          answer_groups: [],
          default_outcome: {
            param_changes: [],
            dest: 'Final',
            feedback: {
              html: '',
              audio_translations: {}
            }
          },
          confirmed_unclassified_answers: [],
          id: null,
          hints: []
        },
        recorded_voiceovers: {
          voiceovers_mapping: {}
        },
        written_translations: {
          translations_mapping: {}
        },
      }
    },
    title: 'Exploration Title',
    category: 'Exploration Category',
    objective: 'Exploration Objective',
    language_code: 'en',
    init_state_name: 'Introduction',
    tags: [],
    param_specs: [],
    param_changes: [],
    auto_tts_enabled: {},
    correctness_feedback_enabled: {},
    state_classifier_mapping: [],
    is_admin: true,
    is_moderator: true,
    user: {},
    version: '1',
    rights: {},
    email_preferences: {},
    draft_changes: [{}, {}, {}],
    is_version_of_draft_valid: null,
    show_state_editor_tutorial_on_load: true,
    show_state_translation_tutorial_on_load: true
  };
  var mockExplorationDataService = {
    getData: function(callback) {
      callback();
      return $q.resolve(explorationData);
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ContextService,
        EditabilityService,
        ExplorationFeaturesBackendApiService,
        ExplorationFeaturesService,
        PageTitleService,
        LoaderService,
        ParamChangesObjectFactory,
        ParamSpecsObjectFactory,
        SiteAnalyticsService,
        StateClassifierMappingService,
        StateEditorRefreshService,
        StateEditorService,
        StateTopAnswersStatsBackendApiService,
        UserExplorationPermissionsService,
        UrlInterpolationService,
        FocusManagerService
      ]
    });
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('ExplorationDataService', mockExplorationDataService);
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    aims = $injector.get('AutosaveInfoModalsService');
    cls = $injector.get('ChangeListService');
    cs = $injector.get('ContextService');
    efbas = $injector.get('ExplorationFeaturesBackendApiService');
    eis = $injector.get('ExplorationImprovementsService');
    ers = $injector.get('ExplorationRightsService');
    es = $injector.get('EditabilityService');
    eps = $injector.get('ExplorationPropertyService');
    ess = $injector.get('ExplorationStatesService');
    esaves = $injector.get('ExplorationSaveService');
    ets = $injector.get('ExplorationTitleService');
    ews = $injector.get('ExplorationWarningsService');
    gds = $injector.get('GraphDataService');
    pts = $injector.get('PageTitleService');
    rs = $injector.get('RouterService');
    sas = $injector.get('SiteAnalyticsService');
    sers = $injector.get('StateEditorRefreshService');
    ses = $injector.get('StateEditorService');
    sts = $injector.get('StateTutorialFirstTimeService');
    stass = $injector.get('StateTopAnswersStatsService');
    stfts = $injector.get('StateTutorialFirstTimeService');
    tds = $injector.get('ThreadDataBackendApiService');
    ueps = $injector.get('UserExplorationPermissionsService');
    focusManagerService = $injector.get('FocusManagerService');

    $scope = $rootScope.$new();
    ctrl = $componentController('explorationEditorPage');
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  describe('when user permission is true and draft changes not valid', () => {
    beforeEach(() => {
      registerAcceptTutorialModalEventSpy = (
        spyOn(sas, 'registerAcceptTutorialModalEvent'));
      registerDeclineTutorialModalEventSpy = (
        spyOn(sas, 'registerDeclineTutorialModalEvent'));
      spyOn(cs, 'getExplorationId').and.returnValue(explorationId);
      spyOn(efbas, 'fetchExplorationFeaturesAsync')
        .and.returnValue($q.resolve({}));
      spyOn(eis, 'initAsync').and.returnValue(Promise.resolve());
      spyOn(eis, 'flushUpdatedTasksToBackend')
        .and.returnValue(Promise.resolve());
      spyOn(ews, 'updateWarnings').and.callThrough();
      spyOn(gds, 'recompute').and.callThrough();
      spyOn(pts, 'setPageTitle').and.callThrough();
      spyOn(stass, 'initAsync').and.returnValue(Promise.resolve());
      spyOn(tds, 'getOpenThreadsCountAsync').and.returnValue($q.resolve(0));
      spyOn(ueps, 'getPermissionsAsync')
        .and.returnValue($q.resolve({canEdit: true, canVoiceover: true}));
      spyOnProperty(stfts, 'onOpenEditorTutorial').and.returnValue(
        mockOpenEditorTutorialEmitter);
      spyOnProperty(stfts, 'onOpenTranslationTutorial').and.returnValue(
        mockOpenTranslationTutorialEmitter);

      explorationData.is_version_of_draft_valid = false;

      ctrl.$onInit();
    });

    afterEach(() => {
      ctrl.$onDestroy();
    });

    it('should start editor tutorial when on main page', () => {
      spyOn(ctrl, 'startEditorTutorial').and.callThrough();
      spyOn(sers.onRefreshStateEditor, 'emit');
      rs.navigateToMainTab();
      $scope.$apply();
      mockOpenEditorTutorialEmitter.emit();
      expect(ctrl.startEditorTutorial).toHaveBeenCalled();
      expect(sers.onRefreshStateEditor.emit).toHaveBeenCalled();
    });

    it('should start editor tutorial when not on main page', () => {
      spyOn(ctrl, 'startEditorTutorial').and.callThrough();
      spyOn(rs, 'navigateToMainTab');
      rs.navigateToSettingsTab();
      $scope.$apply();
      expect(rs.getActiveTabName()).toBe('settings');
      mockOpenEditorTutorialEmitter.emit();
      expect(ctrl.startEditorTutorial).toHaveBeenCalled();
      expect(rs.navigateToMainTab).toHaveBeenCalled();
    });

    it('should start translation tutorial when on translation page', () => {
      spyOn(ctrl, 'startTranslationTutorial').and.callThrough();
      spyOn(rs.onRefreshTranslationTab, 'emit');
      rs.navigateToTranslationTab();
      $scope.$apply();
      mockOpenTranslationTutorialEmitter.emit();
      expect(ctrl.startTranslationTutorial).toHaveBeenCalled();
      expect(rs.onRefreshTranslationTab.emit).toHaveBeenCalled();
    });

    it('should start translation tutorial when not on translation page', () => {
      spyOn(ctrl, 'startTranslationTutorial').and.callThrough();
      spyOn(rs, 'navigateToTranslationTab');
      rs.navigateToSettingsTab();
      $scope.$apply();
      mockOpenTranslationTutorialEmitter.emit();
      expect(ctrl.startTranslationTutorial).toHaveBeenCalled();
      expect(rs.navigateToTranslationTab).toHaveBeenCalled();
    });

    it('should mark exploration as editable and translatable', () => {
      spyOn(es, 'markEditable').and.callThrough();
      spyOn(es, 'markTranslatable').and.callThrough();
      $scope.$apply();

      expect(es.markEditable).toHaveBeenCalled();
      expect(es.markTranslatable).toHaveBeenCalled();
    });

    it('should return navbar text', () => {
      expect(ctrl.getNavbarText()).toEqual('Exploration Editor');
    });

    it('should return warning count, warnings list & critical warning',
      () => {
        spyOn(ews, 'countWarnings').and.returnValue(1);
        expect(ctrl.countWarnings()).toEqual(1);
        spyOn(ews, 'getWarnings').and.returnValue([]);
        expect(ctrl.getWarnings()).toEqual([]);
        // This approach was choosen because spyOn() doesn't work on properties
        // that doesn't have a get access type.
        // eslint-disable-next-line max-len
        // ref: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
        Object.defineProperty(ews, 'hasCriticalWarnings', {
          get: () => true
        });
        spyOnProperty(ews, 'hasCriticalWarnings')
          .and.returnValue(true);

        expect(ctrl.hasCriticalWarnings()).toEqual(true);
      });

    it('should return the thread count', () => {
      spyOn(tds, 'getOpenThreadsCount').and.returnValue(1);
      expect(ctrl.getOpenThreadsCount()).toEqual(1);
    });

    it('should set active state name when active state name does not exist' +
      ' on exploration', () => {
      spyOn(ses, 'getActiveStateName').and.returnValue(
        'State2');
      spyOn(ses, 'setActiveStateName').and.callThrough();
      $scope.$apply();

      expect(ses.setActiveStateName).toHaveBeenCalledWith(
        'Introduction');
    });

    it('should load change list by draft changes successfully', () => {
      spyOn(cls, 'loadAutosavedChangeList').and.callThrough();
      $scope.$apply();

      expect(cls.loadAutosavedChangeList).toHaveBeenCalledWith(
        explorationData.draft_changes);
    });

    it('should show mismatch version modal when draft change exists', () => {
      spyOn(aims, 'showVersionMismatchModal').and.callThrough();
      $scope.$apply();

      expect(aims.showVersionMismatchModal)
        .toHaveBeenCalled();
    });

    it('should navigate to main tab', () => {
      spyOn(rs, 'isLocationSetToNonStateEditorTab').and.returnValue(null);
      spyOn(rs, 'getCurrentStateFromLocationPath').and.returnValue(null);
      spyOn(rs, 'navigateToMainTab').and.callThrough();
      $scope.$apply();

      expect(rs.navigateToMainTab).toHaveBeenCalled();
    });

    it('should navigate between tabs', () => {
      var focusSpy = spyOn(ctrl, 'setFocusOnActiveTab');
      spyOn(rs, 'navigateToMainTab').and.stub();
      ctrl.selectMainTab();
      expect(rs.navigateToMainTab).toHaveBeenCalled();

      spyOn(rs, 'navigateToTranslationTab').and.stub();
      ctrl.selectTranslationTab();
      expect(rs.navigateToTranslationTab).toHaveBeenCalled();

      spyOn(rs, 'navigateToPreviewTab').and.stub();
      ctrl.selectPreviewTab();
      expect(rs.navigateToPreviewTab).toHaveBeenCalled();

      spyOn(rs, 'navigateToSettingsTab').and.stub();
      ctrl.selectSettingsTab();
      expect(rs.navigateToSettingsTab).toHaveBeenCalled();

      spyOn(rs, 'navigateToStatsTab').and.stub();
      ctrl.selectStatsTab();
      expect(rs.navigateToStatsTab).toHaveBeenCalled();

      spyOn(rs, 'navigateToImprovementsTab').and.stub();
      ctrl.selectImprovementsTab();
      expect(rs.navigateToImprovementsTab).toHaveBeenCalled();

      spyOn(rs, 'navigateToHistoryTab').and.stub();
      ctrl.selectHistoryTab();
      expect(rs.navigateToHistoryTab).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalledWith('history');

      spyOn(rs, 'navigateToFeedbackTab').and.stub();
      ctrl.selectFeedbackTab();
      expect(rs.navigateToFeedbackTab).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalledWith('feedback');
    });

    it('should set focus on active tab', () => {
      var focusSpy = spyOn(focusManagerService, 'setFocus');
      ctrl.setFocusOnActiveTab('history');
      expect(focusSpy).toHaveBeenCalledWith('usernameInputField');
      ctrl.activeThread = true;
      ctrl.setFocusOnActiveTab('feedback');
      expect(focusSpy).toHaveBeenCalledWith('tmpMessageText');
      ctrl.activeThread = false;
      ctrl.setFocusOnActiveTab('feedback');
      expect(focusSpy).toHaveBeenCalledWith('newThreadButton');
    });

    it('should show the user help modal for editor tutorial', () => {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve('editor')
      });
      ctrl.showUserHelpModal();
      $rootScope.$apply();
      expect($uibModal.open).toHaveBeenCalled();
    });

    it('should show the user help modal for editor tutorial', () => {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve('translation')
      });
      ctrl.showUserHelpModal();
      $rootScope.$apply();
      expect($uibModal.open).toHaveBeenCalled();
    });
  });

  describe('when user permission is false and draft changes are true', () => {
    var mockExplorationPropertyChangedEventEmitter = new EventEmitter();

    beforeEach(() => {
      registerAcceptTutorialModalEventSpy = (
        spyOn(sas, 'registerAcceptTutorialModalEvent'));
      registerDeclineTutorialModalEventSpy = (
        spyOn(sas, 'registerDeclineTutorialModalEvent'));
      spyOn(cs, 'getExplorationId').and.returnValue(explorationId);
      spyOn(efbas, 'fetchExplorationFeaturesAsync')
        .and.returnValue($q.resolve({}));
      spyOn(eis, 'initAsync').and.returnValue(Promise.resolve());
      spyOn(eis, 'flushUpdatedTasksToBackend')
        .and.returnValue(Promise.resolve());
      spyOnProperty(eps, 'onExplorationPropertyChanged').and.returnValue(
        mockExplorationPropertyChangedEventEmitter);
      spyOn(ews, 'updateWarnings');
      spyOn(gds, 'recompute');
      spyOn(pts, 'setPageTitle').and.callThrough();
      spyOn(stass, 'initAsync').and.returnValue(Promise.resolve());
      spyOn(tds, 'getOpenThreadsCountAsync').and.returnValue($q.resolve(1));
      spyOn(ueps, 'getPermissionsAsync')
        .and.returnValue($q.resolve({canEdit: false}));
      spyOnProperty(ess, 'onRefreshGraph').and.returnValue(refreshGraphEmitter);
      spyOnProperty(cls, 'autosaveIsInProgress$').and.returnValue(
        autosaveIsInProgress);
      spyOnProperty(esaves, 'onInitExplorationPage').and.returnValue(
        mockInitExplorationPageEmitter);
      explorationData.is_version_of_draft_valid = true;

      ctrl.$onInit();
    });

    afterEach(() => {
      ctrl.$onDestroy();
    });

    it('should change the value of autosavingIsInProgress', () => {
      autosaveIsInProgress.emit(true);
      $scope.$apply();
      ctrl.autosaveIsInProgress = true;
    });

    it('should link exploration to story when initing exploration page', () => {
      spyOn(cs, 'setExplorationIsLinkedToStory').and.callThrough();
      $scope.$apply();

      expect(cs.setExplorationIsLinkedToStory)
        .toHaveBeenCalled();
    });

    it('should have ctrl properties correspond to backend data', () => {
      $scope.$apply();
      expect(ctrl.explorationUrl).toBe('/create/' + explorationId);
      expect(ctrl.explorationDownloadUrl).toBe(
        '/createhandler/download/' + explorationId);
      expect(ctrl.revertExplorationUrl).toBe(
        '/createhandler/revert/' + explorationId);
      expect(ctrl.areExplorationWarningsVisible).toBeFalse();

      expect(ctrl.currentUserIsAdmin).toBeTrue();
      expect(ctrl.currentUserIsModerator).toBeTrue();
      expect(ctrl.currentUser).toEqual(explorationData.user);
      expect(ctrl.currentVersion).toBe(explorationData.version);
    });

    it('should navigate to feedback tab', () => {
      spyOn(rs, 'isLocationSetToNonStateEditorTab').and.returnValue(null);
      spyOn(rs, 'getCurrentStateFromLocationPath').and.returnValue(null);
      spyOn(rs, 'navigateToFeedbackTab').and.callThrough();
      $scope.$apply();

      expect(rs.navigateToFeedbackTab).toHaveBeenCalled();
    });

    it('should react when exploration property changes', () => {
      ets.init('Exploration Title');
      mockExplorationPropertyChangedEventEmitter.emit();

      expect(pts.setPageTitle).toHaveBeenCalledWith(
        'Exploration Title - Oppia Editor');
    });

    it('should react when untitled exploration property changes', () => {
      ets.init('');
      mockExplorationPropertyChangedEventEmitter.emit();

      expect(pts.setPageTitle).toHaveBeenCalledWith(
        'Untitled Exploration - Oppia Editor');
    });

    it('should react when refreshing graph', () => {
      refreshGraphEmitter.emit();

      expect(gds.recompute).toHaveBeenCalled();
      expect(ews.updateWarnings).toHaveBeenCalled();
    });

    it('should react to initExplorationPage broadcasts', fakeAsync(() => {
      $scope.$apply();

      var successCallback = jasmine.createSpy('success');
      mockInitExplorationPageEmitter.emit(successCallback);
      // Need to flush and $apply twice to fire the callback. In practice, this
      // will occur seamlessly.
      flushMicrotasks();
      $scope.$apply();
      flushMicrotasks();
      $scope.$apply();

      expect(successCallback).toHaveBeenCalled();
    }));

    it('should start editor tutorial when closing welcome exploration' +
      ' modal', () => {
      spyOn(ctrl, 'startEditorTutorial').and.callThrough();
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve(explorationId)
      });

      ctrl.showWelcomeExplorationModal();
      $scope.$apply();

      expect(registerAcceptTutorialModalEventSpy)
        .toHaveBeenCalledWith(explorationId);
      expect(ctrl.startEditorTutorial).toHaveBeenCalled();
    });

    it('should dismiss tutorial when dismissing welcome exploration' +
      ' modal', () => {
      spyOn(ctrl, 'startEditorTutorial').and.callThrough();
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject(explorationId)
      });

      ctrl.showWelcomeExplorationModal();
      $scope.$apply();

      expect(registerDeclineTutorialModalEventSpy)
        .toHaveBeenCalled();
      expect(ctrl.startEditorTutorial).not.toHaveBeenCalled();
    });

    it('should toggle exploration warning visibility', () => {
      expect(ctrl.areExplorationWarningsVisible).toBeFalse();

      ctrl.toggleExplorationWarningVisibility();
      expect(ctrl.areExplorationWarningsVisible).toBeTrue();

      ctrl.toggleExplorationWarningVisibility();
      expect(ctrl.areExplorationWarningsVisible).toBeFalse();
    });

    it('should get exploration url', () => {
      expect(ctrl.getExplorationUrl(explorationId)).toBe('/explore/exp1');
      expect(ctrl.getExplorationUrl()).toBe('');
    });

    it('should get active tab name', () => {
      var activeTabNameSpy = spyOn(rs, 'getActiveTabName');

      activeTabNameSpy.and.returnValue('preview');
      expect(ctrl.getActiveTabName(activeTabNameSpy)).toBe('preview');

      activeTabNameSpy.and.returnValue('history');
      expect(ctrl.getActiveTabName(activeTabNameSpy)).toBe('history');
    });
  });

  describe('Initializing improvements tab', () => {
    beforeEach(() => {
      registerAcceptTutorialModalEventSpy = (
        spyOn(sas, 'registerAcceptTutorialModalEvent'));
      registerDeclineTutorialModalEventSpy = (
        spyOn(sas, 'registerDeclineTutorialModalEvent'));
      mockEnterEditorForTheFirstTime = new EventEmitter();
      spyOn(cs, 'getExplorationId').and.returnValue(explorationId);
      spyOn(efbas, 'fetchExplorationFeaturesAsync')
        .and.returnValue(Promise.resolve({}));
      spyOn(eis, 'initAsync').and.returnValue(Promise.resolve());
      spyOn(eis, 'flushUpdatedTasksToBackend')
        .and.returnValue(Promise.resolve());
      spyOn(ers, 'isPublic').and.returnValue(true);
      spyOn(ews, 'updateWarnings').and.callThrough();
      spyOn(gds, 'recompute').and.callThrough();
      spyOn(pts, 'setPageTitle').and.callThrough();
      spyOn(stass, 'initAsync').and.returnValue(Promise.resolve());
      spyOn(tds, 'getOpenThreadsCountAsync')
        .and.returnValue(Promise.resolve(1));
      spyOn(ueps, 'getPermissionsAsync')
        .and.returnValue(Promise.resolve({canEdit: true}));
      spyOnProperty(sts, 'onEnterEditorForTheFirstTime').and.returnValue(
        mockEnterEditorForTheFirstTime);

      explorationData.is_version_of_draft_valid = true;
    });

    afterEach(() => {
      ctrl.$onDestroy();
    });

    it('should recognize when improvements tab is enabled', fakeAsync(() => {
      spyOn(eis, 'isImprovementsTabEnabledAsync').and.returnValue(
        Promise.resolve(true));

      ctrl.$onInit();
      flushMicrotasks();
      $scope.$apply();

      expect(ctrl.isImprovementsTabEnabled()).toBeTrue();
    }));

    it('should recognize when improvements tab is disabled', fakeAsync(() => {
      spyOn(eis, 'isImprovementsTabEnabledAsync').and.returnValue(
        Promise.resolve(false));

      ctrl.$onInit();
      flushMicrotasks();
      $scope.$apply();

      expect(ctrl.isImprovementsTabEnabled()).toBeFalse();
    }));

    it('should react to enterEditorForTheFirstTime event', () => {
      spyOn(ctrl, 'showWelcomeExplorationModal').and.callThrough();
      ctrl.$onInit();
      mockEnterEditorForTheFirstTime.emit();
      expect(ctrl.showWelcomeExplorationModal).toHaveBeenCalled();
    });
  });

  describe('State-change registration', () => {
    beforeEach(() => {
      registerAcceptTutorialModalEventSpy = (
        spyOn(sas, 'registerAcceptTutorialModalEvent'));
      registerDeclineTutorialModalEventSpy = (
        spyOn(sas, 'registerDeclineTutorialModalEvent'));
      spyOn(cs, 'getExplorationId').and.returnValue(explorationId);
      spyOn(efbas, 'fetchExplorationFeaturesAsync')
        .and.returnValue($q.resolve({}));
      spyOn(eis, 'initAsync').and.returnValue(Promise.resolve());
      spyOn(eis, 'flushUpdatedTasksToBackend')
        .and.returnValue(Promise.resolve());
      spyOn(ers, 'isPublic').and.returnValue(true);
      spyOn(ews, 'updateWarnings').and.callThrough();
      spyOn(gds, 'recompute').and.callThrough();
      spyOn(pts, 'setPageTitle').and.callThrough();
      spyOn(stass, 'initAsync').and.returnValue(Promise.resolve());
      spyOn(tds, 'getOpenThreadsCountAsync').and.returnValue($q.resolve(1));
      spyOn(ueps, 'getPermissionsAsync')
        .and.returnValue($q.resolve({canEdit: false}));
      $scope.$apply();

      explorationData.is_version_of_draft_valid = true;

      ctrl.$onInit();
    });
    afterEach(() => {
      ctrl.$onDestroy();
    });

    afterEach(() => {
      ctrl.$onDestroy();
    });

    it('should callback state-added method for stats', fakeAsync(() => {
      let onStateAddedSpy = spyOn(stass, 'onStateAdded');
      spyOn(cls, 'addState');

      $scope.$apply();
      flushMicrotasks();

      ess.addState('Prologue');

      flushMicrotasks();
      expect(onStateAddedSpy).toHaveBeenCalledWith('Prologue');
    }));

    it('should callback state-deleted method for stats', fakeAsync(() => {
      let onStateDeletedSpy = spyOn(stass, 'onStateDeleted');
      spyOn(cls, 'deleteState');
      spyOn($uibModal, 'open').and.returnValue({result: Promise.resolve()});

      $scope.$apply();
      flushMicrotasks();

      ess.deleteState('Final');

      flushMicrotasks();
      expect(onStateDeletedSpy).toHaveBeenCalledWith('Final');
    }));

    it('should callback state-renamed method for stats', fakeAsync(() => {
      let onStateRenamedSpy = spyOn(stass, 'onStateRenamed');
      spyOn(cls, 'renameState');

      $scope.$apply();
      flushMicrotasks();

      ess.renameState('Introduction', 'Start');

      flushMicrotasks();
      expect(onStateRenamedSpy).toHaveBeenCalledWith('Introduction', 'Start');
    }));

    it('should callback interaction-changed method for stats', fakeAsync(() => {
      let onStateInteractionSavedSpy = spyOn(stass, 'onStateInteractionSaved');
      spyOn(cls, 'editStateProperty');

      $scope.$apply();
      flushMicrotasks();

      ess.saveInteractionAnswerGroups('Introduction', []);

      flushMicrotasks();
      expect(onStateInteractionSavedSpy)
        .toHaveBeenCalledWith(ess.getState('Introduction'));
    }));
  });
});
