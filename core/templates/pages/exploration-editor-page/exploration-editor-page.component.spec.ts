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

import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed, fakeAsync, flushMicrotasks, discardPeriodicTasks, tick, flush } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';

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
import { AlertsService } from 'services/alerts.service';
import { InternetConnectivityService } from 'services/internet-connectivity.service';
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
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { LostChangesModalComponent } from './modal-templates/lost-changes-modal.component';
import { AutosaveInfoModalsService } from './services/autosave-info-modals.service';
import { ChangeListService } from './services/change-list.service';
import { ExplorationDataService } from './services/exploration-data.service';
import { UserInfo } from 'domain/user/user-info.model';
import { WelcomeModalComponent } from './modal-templates/welcome-modal.component';
import { HelpModalComponent } from './modal-templates/help-modal.component';

require('pages/exploration-editor-page/exploration-editor-page.component.ts');
require(
  'pages/exploration-editor-page/services/' +
   'state-tutorial-first-time.service.ts');

 class MockNgbModalRef {
   componentInstance = {};
 }

describe('Exploration editor page component', function() {
  importAllAngularServices();

  var ctrl = null;
  let $location = null;

  var $q = null;
  var $rootScope = null;
  var $scope = null;
  let cls: ChangeListService = null;
  let as: AlertsService = null;
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
  let autosaveInfoModalsService = null;
  var sas = null;
  var sers = null;
  var ses = null;
  var sts = null;
  var stfts = null;
  var tds = null;
  var userService = null;
  var ueps = null;
  var ics = null;
  var mockEnterEditorForTheFirstTime = null;
  var registerAcceptTutorialModalEventSpy;
  var registerDeclineTutorialModalEventSpy;
  var focusManagerService = null;

  let ngbModal: NgbModal;

  var refreshGraphEmitter = new EventEmitter();

  let mockRefreshTranslationTabEventEmitter = new EventEmitter();
  var autosaveIsInProgress = new EventEmitter();
  var mockConnectionServiceEmitter = new EventEmitter<boolean>();
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
            dest_if_really_stuck: null,
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
            dest_if_really_stuck: null,
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
    edits_allowed: true,
    state_classifier_mapping: [],
    user: {},
    version: '1',
    rights: {},
    email_preferences: {},
    draft_changes: [{}, {}, {}],
    is_version_of_draft_valid: false,
    show_state_editor_tutorial_on_load: true,
    show_state_translation_tutorial_on_load: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NgbModule
      ],
      declarations: [
        LostChangesModalComponent,
        WelcomeModalComponent,
        HelpModalComponent,
      ],
      providers: [
        AlertsService,
        AutosaveInfoModalsService,
        ChangeListService,
        ContextService,
        EditabilityService,
        ExplorationFeaturesBackendApiService,
        ExplorationFeaturesService,
        InternetConnectivityService,
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
        FocusManagerService,
        {
          provide: ExplorationDataService,
          useValue: {
            getDataAsync: (callback) => {
              callback();
              return $q.resolve(explorationData);
            },
            autosaveChangeListAsync: () => {
              return;
            }
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [
          LostChangesModalComponent,
          WelcomeModalComponent,
          HelpModalComponent]
      }
    });

    cls = TestBed.inject(ChangeListService);
    as = TestBed.inject(AlertsService);
    ngbModal = TestBed.inject(NgbModal);
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

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $location = $injector.get('$location');
    $rootScope = $injector.get('$rootScope');
    cs = $injector.get('ContextService');
    efbas = $injector.get('ExplorationFeaturesBackendApiService');
    ics = $injector.get('InternetConnectivityService');
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
    stfts = $injector.get('StateTutorialFirstTimeService');
    tds = $injector.get('ThreadDataBackendApiService');
    userService = $injector.get('UserService');
    autosaveInfoModalsService = $injector.get('AutosaveInfoModalsService');
    ueps = $injector.get('UserExplorationPermissionsService');
    focusManagerService = $injector.get('FocusManagerService');

    $scope = $rootScope.$new();
    ctrl = $componentController('explorationEditorPage', {
      NgbModal: ngbModal,
      $scope: $scope,
    });
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
      spyOn(pts, 'setDocumentTitle').and.callThrough();
      spyOn(tds, 'getFeedbackThreadsAsync').and.returnValue($q.resolve([]));
      spyOn(ueps, 'getPermissionsAsync')
        .and.returnValue($q.resolve({canEdit: true, canVoiceover: true}));
      spyOnProperty(rs, 'onRefreshTranslationTab')
        .and.returnValue(mockRefreshTranslationTabEventEmitter);
      spyOn(autosaveInfoModalsService, 'showVersionMismatchModal').and.stub();
      spyOn(cls, 'getChangeList').and.stub();
      spyOn($rootScope, '$applyAsync').and.stub();
      spyOn(userService, 'getUserInfoAsync')
        .and.returnValue($q.resolve(new UserInfo(
          ['USER_ROLE'], true, true, false, false, false, null, null, null,
          false)));
      spyOnProperty(stfts, 'onOpenEditorTutorial').and.returnValue(
        mockOpenEditorTutorialEmitter);
      spyOnProperty(stfts, 'onOpenTranslationTutorial').and.returnValue(
        mockOpenTranslationTutorialEmitter);

      explorationData.is_version_of_draft_valid = false;
      explorationData.draft_changes = ['data1', 'data2'];

      ctrl.$onInit();
    });

    afterEach(() => {
      ctrl.$onDestroy();
    });

    it('should update view on location change', fakeAsync(() => {
      $location.path('');
      spyOn(ctrl, 'startEditorTutorial').and.callThrough();
      spyOn(sers.onRefreshStateEditor, 'emit');

      rs.navigateToMainTab();
      $scope.$apply();
      mockOpenEditorTutorialEmitter.emit();
      mockRefreshTranslationTabEventEmitter.emit();
      tick();

      expect(ctrl.startEditorTutorial).toHaveBeenCalled();
      expect(sers.onRefreshStateEditor.emit).toHaveBeenCalled();

      flush();
      discardPeriodicTasks();
    }));

    it('should start editor tutorial when on main page', fakeAsync(() => {
      spyOn(ctrl, 'startEditorTutorial').and.callThrough();
      spyOn(sers.onRefreshStateEditor, 'emit');
      rs.navigateToMainTab();
      $scope.$apply();
      tick();

      mockOpenEditorTutorialEmitter.emit();
      expect(ctrl.startEditorTutorial).toHaveBeenCalled();
      expect(sers.onRefreshStateEditor.emit).toHaveBeenCalled();

      flush();
      discardPeriodicTasks();
    }));

    it('should start editor tutorial when not on main page', fakeAsync(() => {
      spyOn(ctrl, 'startEditorTutorial').and.callThrough();
      spyOn(rs, 'navigateToMainTab');
      rs.navigateToSettingsTab();
      $scope.$apply();
      tick();

      expect(rs.getActiveTabName()).toBe('settings');
      mockOpenEditorTutorialEmitter.emit();
      expect(ctrl.startEditorTutorial).toHaveBeenCalled();
      expect(rs.navigateToMainTab).toHaveBeenCalled();
    }));

    it('should start translation tutorial when on translation page',
      fakeAsync(() => {
        spyOn(ctrl, 'startTranslationTutorial').and.callThrough();
        rs.navigateToTranslationTab();
        mockRefreshTranslationTabEventEmitter.emit();
        $scope.$apply();
        tick();

        mockOpenTranslationTutorialEmitter.emit();
        expect(ctrl.startTranslationTutorial).toHaveBeenCalled();

        flush();
        discardPeriodicTasks();
      }));

    it('should start translation tutorial when not on translation page',
      fakeAsync(() => {
        spyOn(ctrl, 'startTranslationTutorial').and.callThrough();
        spyOn(rs, 'navigateToTranslationTab');
        rs.navigateToSettingsTab();
        $scope.$apply();
        tick();

        mockOpenTranslationTutorialEmitter.emit();
        expect(ctrl.startTranslationTutorial).toHaveBeenCalled();
        expect(rs.navigateToTranslationTab).toHaveBeenCalled();

        flush();
        discardPeriodicTasks();
      }));

    it('should mark exploration as editable and translatable',
      fakeAsync(() => {
        spyOn(es, 'markEditable').and.callThrough();
        spyOn(es, 'markTranslatable').and.callThrough();
        $scope.$apply();
        tick();

        expect(es.markEditable).toHaveBeenCalled();
        expect(es.markTranslatable).toHaveBeenCalled();
      }));

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

    it('should navigate to main tab', fakeAsync(() => {
      spyOn(rs, 'isLocationSetToNonStateEditorTab').and.returnValue(null);
      spyOn(rs, 'getCurrentStateFromLocationPath').and.returnValue(null);
      spyOn(rs, 'navigateToMainTab').and.callThrough();
      $scope.$apply();
      tick();

      expect(rs.navigateToMainTab).toHaveBeenCalled();
      flush();
      discardPeriodicTasks();
    }));

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
      spyOn(ngbModal, 'open').and.returnValue(
         {
           componentInstance: new MockNgbModalRef(),
           result: Promise.resolve('editor')
         } as NgbModalRef
      );

      ctrl.showUserHelpModal();
      $rootScope.$apply();

      expect(ngbModal.open).toHaveBeenCalled();
    });

    it('should show the user help modal for editor tutorial', () => {
      spyOn(ngbModal, 'open').and.returnValue(
         {
           componentInstance: new MockNgbModalRef(),
           result: Promise.resolve('translation')
         } as NgbModalRef
      );

      ctrl.showUserHelpModal();
      $rootScope.$apply();

      expect(ngbModal.open).toHaveBeenCalled();
    });
  });

  describe('Checking internet Connection', () => {
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
      spyOn(pts, 'setDocumentTitle').and.callThrough();
      spyOn(tds, 'getOpenThreadsCount').and.returnValue(0);
      spyOn(tds, 'getFeedbackThreadsAsync').and.returnValue($q.resolve([]));
      spyOn(ueps, 'getPermissionsAsync')
        .and.returnValue($q.resolve({canEdit: true, canVoiceover: true}));
      spyOnProperty(stfts, 'onOpenEditorTutorial').and.returnValue(
        mockOpenEditorTutorialEmitter);
      spyOnProperty(ics, 'onInternetStateChange').and.returnValue(
        mockConnectionServiceEmitter);
      spyOnProperty(stfts, 'onOpenTranslationTutorial').and.returnValue(
        mockOpenTranslationTutorialEmitter);
      spyOn(as, 'addInfoMessage');
      spyOn(as, 'addSuccessMessage');
      explorationData.is_version_of_draft_valid = false;
      explorationData.draft_changes = ['data1', 'data2'];

      ctrl.$onInit();
    });

    afterEach(() => {
      ctrl.$onDestroy();
    });

    it('should change status to ONLINE when internet is connected', () => {
      mockConnectionServiceEmitter.emit(true);
      $scope.$apply();
      expect(as.addSuccessMessage).toHaveBeenCalled();
    });

    it('should change status to OFFLINE when internet disconnects', () => {
      mockConnectionServiceEmitter.emit(false);
      $scope.$apply();
      expect(as.addInfoMessage).toHaveBeenCalled();
    });

    it('should navigate to editor tab when internet disconnects', () => {
      var activeTabNameSpy = spyOn(rs, 'getActiveTabName');
      activeTabNameSpy.and.returnValue('settings');
      spyOn(rs, 'navigateToMainTab');
      mockConnectionServiceEmitter.emit(false);
      $scope.$apply();
      expect(as.addInfoMessage).toHaveBeenCalled();
      expect(rs.navigateToMainTab).toHaveBeenCalled();
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
      spyOn(pts, 'setDocumentTitle').and.callThrough();
      spyOn(tds, 'getOpenThreadsCount').and.returnValue(1);
      spyOn(tds, 'getFeedbackThreadsAsync').and.returnValue($q.resolve([]));
      spyOn(ueps, 'getPermissionsAsync')
        .and.returnValue($q.resolve({canEdit: false}));
      spyOn(userService, 'getUserInfoAsync')
        .and.returnValue($q.resolve(new UserInfo(
          ['USER_ROLE'], true, true, false, false, false, null, null, null,
          false)));
      spyOnProperty(ess, 'onRefreshGraph').and.returnValue(refreshGraphEmitter);
      spyOnProperty(cls, 'autosaveIsInProgress$').and.returnValue(
        autosaveIsInProgress);
      spyOnProperty(esaves, 'onInitExplorationPage').and.returnValue(
        mockInitExplorationPageEmitter);
      explorationData.is_version_of_draft_valid = true;
      explorationData.draft_changes = ['data1', 'data2'];

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

      expect(ctrl.currentUserIsCurriculumAdmin).toBeTrue();
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

      expect(pts.setDocumentTitle).toHaveBeenCalledWith(
        'Exploration Title - Oppia Editor');
    });

    it('should react when untitled exploration property changes', () => {
      ets.init('');
      mockExplorationPropertyChangedEventEmitter.emit();

      expect(pts.setDocumentTitle).toHaveBeenCalledWith(
        'Untitled Exploration - Oppia Editor');
    });

    it('should react when refreshing graph', () => {
      refreshGraphEmitter.emit();

      expect(gds.recompute).toHaveBeenCalled();
      expect(ews.updateWarnings).toHaveBeenCalled();
    });

    it('should react to initExplorationPage broadcasts', fakeAsync(() => {
      $scope.$apply();
      spyOn(ics, 'startCheckingConnection');
      spyOn(cls, 'loadAutosavedChangeList');
      spyOn(rs, 'isLocationSetToNonStateEditorTab').and.returnValue(true);
      var successCallback = jasmine.createSpy('success');
      expect(ctrl.explorationEditorPageHasInitialized).toEqual(false);
      mockInitExplorationPageEmitter.emit(successCallback);
      tick();

      // Need to flush and $apply twice to fire the callback. In practice, this
      // will occur seamlessly.
      flushMicrotasks();
      $scope.$apply();
      flushMicrotasks();
      $scope.$apply();
      flushMicrotasks();
      $scope.$apply();
      tick();

      expect(cls.loadAutosavedChangeList).toHaveBeenCalled();
      expect(ctrl.explorationEditorPageHasInitialized).toEqual(true);
      expect(successCallback).toHaveBeenCalled();
    }));

    it('should start editor tutorial when closing welcome exploration' +
       ' modal', () => {
      spyOn(ctrl, 'startEditorTutorial').and.callThrough();
      spyOn(ngbModal, 'open').and.returnValue(
         {
           componentInstance: new MockNgbModalRef(),
           result: $q.resolve(explorationId)
         } as NgbModalRef
      );

      ctrl.showWelcomeExplorationModal();
      $scope.$apply();

      expect(registerAcceptTutorialModalEventSpy)
        .toHaveBeenCalledWith(explorationId);
      expect(ctrl.startEditorTutorial).toHaveBeenCalled();
    });

    it('should dismiss tutorial when dismissing welcome exploration' +
       ' modal', () => {
      spyOn(ctrl, 'startEditorTutorial').and.callThrough();
      spyOn(ngbModal, 'open').and.returnValue(
         {
           componentInstance: new MockNgbModalRef(),
           result: $q.reject(explorationId)
         } as NgbModalRef
      );

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
      spyOn(pts, 'setDocumentTitle').and.callThrough();
      spyOn(tds, 'getOpenThreadsCount').and.returnValue(1);
      spyOn(tds, 'getFeedbackThreadsAsync').and.returnValue($q.resolve([]));
      spyOn(ueps, 'getPermissionsAsync')
        .and.returnValue(Promise.resolve({canEdit: true}));
      spyOnProperty(sts, 'onEnterEditorForTheFirstTime').and.returnValue(
        mockEnterEditorForTheFirstTime);

      explorationData.is_version_of_draft_valid = true;
      explorationData.draft_changes = ['data1', 'data2'];
    });

    afterEach(() => {
      ctrl.$onDestroy();
    });

    it('should recognize when improvements tab is enabled', fakeAsync(() => {
      spyOn(ics, 'startCheckingConnection');
      spyOn(eis, 'isImprovementsTabEnabledAsync').and.returnValue(
        Promise.resolve(true));

      ctrl.$onInit();
      flushMicrotasks();
      $scope.$apply();

      expect(ctrl.isImprovementsTabEnabled()).toBeTrue();
    }));

    it('should recognize when improvements tab is disabled', fakeAsync(() => {
      spyOn(ics, 'startCheckingConnection');
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
});
