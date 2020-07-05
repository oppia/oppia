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

import { TestBed } from '@angular/core/testing';
import { ContextService } from 'services/context.service';
import { EditabilityService } from 'services/editability.service';
import { ExplorationFeaturesBackendApiService } from
  'services/exploration-features-backend-api.service';
import { ExplorationFeaturesService } from
  'services/exploration-features.service';
import { PageTitleService } from 'services/page-title.service';
import { LoaderService } from 'services/loader.service';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { ParamSpecsObjectFactory } from
  'domain/exploration/ParamSpecsObjectFactory';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';
import { StateEditorService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateTopAnswersStatsBackendApiService } from
  'services/state-top-answers-stats-backend-api.service';
import { UserExplorationPermissionsService } from
  'pages/exploration-editor-page/services/user-exploration-permissions.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

require('pages/exploration-editor-page/exploration-editor-page.component.ts');

describe('Exploration editor page component', function() {
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var $timeout = null;
  var $uibModal = null;
  var aims = null;
  var cls = null;
  var cs = null;
  var es = null;
  var efbas = null;
  var efs = null;
  var ers = null;
  var ets = null;
  var ews = null;
  var gds = null;
  var pts = null;
  var rs = null;
  var ses = null;
  var stasbas = null;
  var sas = null;
  var tds = null;
  var ueps = null;

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
  var getPermissionsSpy = null;

  beforeEach(function() {
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
        StateEditorService,
        StateTopAnswersStatsBackendApiService,
        UserExplorationPermissionsService,
        UrlInterpolationService
      ]
    });
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('ExplorationDataService', mockExplorationDataService);
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    $uibModal = $injector.get('$uibModal');
    aims = $injector.get('AutosaveInfoModalsService');
    cls = $injector.get('ChangeListService');
    cs = $injector.get('ContextService');
    es = $injector.get('EditabilityService');
    efbas = $injector.get('ExplorationFeaturesBackendApiService');
    efs = $injector.get('ExplorationFeaturesService');
    ers = $injector.get('ExplorationRightsService');
    ets = $injector.get('ExplorationTitleService');
    ews = $injector.get('ExplorationWarningsService');
    gds = $injector.get('GraphDataService');
    pts = $injector.get('PageTitleService');
    rs = $injector.get('RouterService');
    ses = $injector.get('StateEditorService');
    stasbas = $injector.get('StateTopAnswersStatsBackendApiService');
    sas = $injector.get('SiteAnalyticsService');
    tds = $injector.get('ThreadDataService');
    ueps = $injector.get('UserExplorationPermissionsService');

    $scope = $rootScope.$new();
    ctrl = $componentController('explorationEditorPage');
  }));

  describe('when user permission is true and draft changes not valid',
    function() {
      var userPermissions = {
        canEdit: true,
        canVoiceover: true
      };

      beforeEach(function() {
        getPermissionsSpy = spyOn(
          ueps, 'getPermissionsAsync');
        spyOnAllFunctions(sas);
        spyOn(ews, 'updateWarnings').and.callThrough();
        spyOn(gds, 'recompute').and.callThrough();
        spyOn(pts, 'setPageTitle').and.callThrough();

        getPermissionsSpy.and.returnValue($q.resolve(userPermissions));
        spyOn(cs, 'getExplorationId').and.returnValue(
          explorationId);
        spyOn(efbas, 'fetchExplorationFeatures')
          .and.returnValue($q.resolve({}));
        spyOn(tds, 'getOpenThreadsCountAsync').and.returnValue(
          $q.resolve(0));

        explorationData.is_version_of_draft_valid = false;

        ctrl.$onInit();
      });

      it('should mark exploration as editable and translatable',
        function() {
          spyOn(es, 'markEditable').and.callThrough();
          spyOn(es, 'markTranslatable').and.callThrough();
          $scope.$apply();

          expect(es.markEditable).toHaveBeenCalled();
          expect(es.markTranslatable).toHaveBeenCalled();
        });

      it('should set active state name when active state name does not exist' +
        ' on exploration', function() {
        spyOn(ses, 'getActiveStateName').and.returnValue(
          'State2');
        spyOn(ses, 'setActiveStateName').and.callThrough();
        $scope.$apply();

        expect(ses.setActiveStateName).toHaveBeenCalledWith(
          'Introduction');
      });

      it('should load change list by draft changes successfully', function() {
        spyOn(cls, 'loadAutosavedChangeList').and.callThrough();
        $scope.$apply();

        expect(cls.loadAutosavedChangeList).toHaveBeenCalledWith(
          explorationData.draft_changes);
      });

      it('should show mismatch version modal when draft change is not null',
        function() {
          spyOn(aims, 'showVersionMismatchModal').and
            .callThrough();
          $scope.$apply();

          expect(aims.showVersionMismatchModal)
            .toHaveBeenCalled();
        });

      it('should navigate to main tab', function() {
        spyOn(rs, 'isLocationSetToNonStateEditorTab').and
          .returnValue(null);
        spyOn(rs, 'getCurrentStateFromLocationPath').and
          .returnValue(null);
        spyOn(rs, 'navigateToMainTab').and.callThrough();
        $scope.$apply();

        expect(rs.navigateToMainTab).toHaveBeenCalled();
      });
    });

  describe('when user permission is false and draft changes are true',
    function() {
      var userPermissions = {
        canEdit: false
      };

      beforeEach(function() {
        getPermissionsSpy = spyOn(
          ueps, 'getPermissionsAsync');
        spyOnAllFunctions(sas);
        spyOn(ews, 'updateWarnings').and.callThrough();
        spyOn(gds, 'recompute').and.callThrough();
        spyOn(pts, 'setPageTitle').and.callThrough();

        getPermissionsSpy.and.returnValue($q.resolve(userPermissions));
        spyOn(cs, 'getExplorationId').and.returnValue(
          explorationId);
        spyOn(efbas, 'fetchExplorationFeatures')
          .and.returnValue($q.resolve({}));
        spyOn(tds, 'getOpenThreadsCountAsync').and.returnValue(
          $q.resolve(1));

        explorationData.is_version_of_draft_valid = true;

        ctrl.$onInit();
      });

      it('should link exploration to story when initing exploration page',
        function() {
          spyOn(cs, 'setExplorationIsLinkedToStory').and
            .callThrough();
          $scope.$apply();

          expect(cs.setExplorationIsLinkedToStory)
            .toHaveBeenCalled();
        });

      it('should check ctrl properties according to data get from backend',
        function() {
          $scope.$apply();
          expect(ctrl.explorationUrl).toBe('/create/' + explorationId);
          expect(ctrl.explorationDownloadUrl).toBe(
            '/createhandler/download/' + explorationId);
          expect(ctrl.revertExplorationUrl).toBe(
            '/createhandler/revert/' + explorationId);
          expect(ctrl.areExplorationWarningsVisible).toBe(false);

          expect(ctrl.currentUserIsAdmin).toBe(true);
          expect(ctrl.currentUserIsModerator).toBe(true);
          expect(ctrl.currentUser).toEqual(explorationData.user);
          expect(ctrl.currentVersion).toBe(explorationData.version);

          expect(ctrl.tutorialInProgress).toBe(false);
        });

      it('should get state top answers stats after initing exploration page',
        function() {
          var stateTopAnswersStatsBackendDict = {};
          spyOn(ers, 'isPublic').and.returnValue(true);
          spyOn(stasbas, 'fetchStats').and
            .returnValue($q.resolve(stateTopAnswersStatsBackendDict));
          $scope.$apply();

          expect(ews.updateWarnings)
            .toHaveBeenCalled();
        });

      it('should navigate to feedback tab', function() {
        spyOn(rs, 'isLocationSetToNonStateEditorTab').and
          .returnValue(null);
        spyOn(rs, 'getCurrentStateFromLocationPath').and
          .returnValue(null);
        spyOn(rs, 'navigateToFeedbackTab').and.callThrough();
        $scope.$apply();

        expect(rs.navigateToFeedbackTab).toHaveBeenCalled();
      });

      it('should react when exploration property changes', function() {
        ets.init('Exploration Title');
        $rootScope.$broadcast('explorationPropertyChanged');

        expect(pts.setPageTitle).toHaveBeenCalledWith(
          'Exploration Title - Oppia Editor');
      });

      it('should react when untitled exploration property changes', function() {
        ets.init('');
        $rootScope.$broadcast('explorationPropertyChanged');

        expect(pts.setPageTitle).toHaveBeenCalledWith(
          'Untitled Exploration - Oppia Editor');
      });

      it('should react when refreshing graph', function() {
        $rootScope.$broadcast('refreshGraph');

        expect(gds.recompute).toHaveBeenCalled();
        expect(ews.updateWarnings).toHaveBeenCalled();
      });

      it('should react when initExplorationPage is broadcasted', function() {
        $scope.$apply();

        var successCallback = jasmine.createSpy('success');
        $rootScope.$broadcast('initExplorationPage', successCallback);
        $scope.$apply();

        expect(successCallback).toHaveBeenCalled();
      });

      it('should accept tutorial when closing welcome exploration modal and' +
        ' then skip it', function() {
        spyOn(rs, 'navigateToMainTab').and.callThrough();
        spyOn($uibModal, 'open').and.returnValue({
          result: $q.resolve(explorationId)
        });

        expect(ctrl.tutorialInProgress).toBe(false);

        ctrl.showWelcomeExplorationModal();
        $scope.$apply();

        expect(sas.registerAcceptTutorialModalEvent)
          .toHaveBeenCalledWith(explorationId);
        expect(rs.navigateToMainTab).toHaveBeenCalled();
        $timeout.flush();

        expect(ctrl.tutorialInProgress).toBe(true);

        ctrl.onSkipTutorial();
        expect(sas.registerSkipTutorialEvent)
          .toHaveBeenCalledWith(explorationId);
        expect(ctrl.tutorialInProgress).toBe(false);
      });

      it('should accept tutorial when closing welcome exploration modal and' +
        ' then finish it', function() {
        spyOn(rs, 'navigateToMainTab').and.callThrough();
        spyOn($uibModal, 'open').and.returnValue({
          result: $q.resolve(explorationId)
        });

        expect(ctrl.tutorialInProgress).toBe(false);

        ctrl.showWelcomeExplorationModal();
        $scope.$apply();

        expect(sas.registerAcceptTutorialModalEvent)
          .toHaveBeenCalledWith(explorationId);
        expect(rs.navigateToMainTab).toHaveBeenCalled();
        $timeout.flush();

        expect(ctrl.tutorialInProgress).toBe(true);

        ctrl.onFinishTutorial();
        expect(sas.registerFinishTutorialEvent)
          .toHaveBeenCalledWith(explorationId);
        expect(ctrl.tutorialInProgress).toBe(false);
      });

      it('should check if improvements tab is enabled', function() {
        var isInitializedSpy = spyOn(
          efs, 'isInitialized');
        var isImprovementsTabEnabledSpy = spyOn(
          efs, 'isImprovementsTabEnabled');
        isInitializedSpy.and.returnValue(true);
        isImprovementsTabEnabledSpy.and.returnValue(true);
        expect(ctrl.isImprovementsTabEnabled()).toBe(true);

        isInitializedSpy.and.returnValue(false);
        isImprovementsTabEnabledSpy.and.returnValue(true);
        expect(ctrl.isImprovementsTabEnabled()).toBe(false);

        isInitializedSpy.and.returnValue(true);
        isImprovementsTabEnabledSpy.and.returnValue(false);
        expect(ctrl.isImprovementsTabEnabled()).toBe(false);

        isInitializedSpy.and.returnValue(false);
        isImprovementsTabEnabledSpy.and.returnValue(false);
        expect(ctrl.isImprovementsTabEnabled()).toBe(false);
      });

      it('should decline tutorial when dismissing welcome exploration modal',
        function() {
          spyOn($uibModal, 'open').and.returnValue({
            result: $q.reject(explorationId)
          });

          expect(ctrl.tutorialInProgress).toBe(false);

          ctrl.showWelcomeExplorationModal();
          $scope.$apply();

          expect(sas.registerDeclineTutorialModalEvent)
            .toHaveBeenCalled();
          expect(ctrl.tutorialInProgress).toBe(false);
        });

      it('should toggle exploration warning visibility', function() {
        expect(ctrl.areExplorationWarningsVisible).toBe(false);

        ctrl.toggleExplorationWarningVisibility();
        expect(ctrl.areExplorationWarningsVisible).toBe(true);

        ctrl.toggleExplorationWarningVisibility();
        expect(ctrl.areExplorationWarningsVisible).toBe(false);
      });

      it('should get exploration url', function() {
        expect(ctrl.getExplorationUrl(explorationId)).toBe('/explore/exp1');
        expect(ctrl.getExplorationUrl()).toBe('');
      });

      it('should get active tab name', function() {
        var activeTabNameSpy = spyOn(rs, 'getActiveTabName');

        activeTabNameSpy.and.returnValue('preview');
        expect(ctrl.getActiveTabName(activeTabNameSpy)).toBe('preview');

        activeTabNameSpy.and.returnValue('history');
        expect(ctrl.getActiveTabName(activeTabNameSpy)).toBe('history');
      });

      // The describe block below tests all the possible functions
      // included on ctrl.EDITOR_TUTORIAL_OPTIONS array, which manipulates
      // with JQuery the 'save from tutorial' button.
      describe('when testing functions for JQuery manipulation from' +
        ' ctrl.EDITOR_TUTORIAL_OPTIONS array', function() {
        it('should change element scroll top when calling fn property' +
          ' function on index 1 of ctrl.EDITOR_TUTORIAL_OPTIONS array',
        function() {
          var element = angular.element('div');
          // @ts-ignore is being used in order to ignore JQuery properties that
          // should be declared.
          spyOn(window, '$').and.returnValue(element);

          var animateSpy = spyOn(element, 'animate').and.callThrough();

          ctrl.EDITOR_TUTORIAL_OPTIONS[1].fn(false);

          expect(animateSpy).toHaveBeenCalledWith({
            scrollTop: 20
          }, 1000);
        });

        it('should not change element scroll top when calling fn property' +
          ' function on index 1 of EDITOR_TUTORIAL_OPTIONS array', function() {
          var element = angular.element('div');
          // @ts-ignore is being used in order to ignore JQuery properties that
          // should be declared.
          spyOn(window, '$').and.returnValue(element);

          var animateSpy = spyOn(element, 'animate').and.callThrough();

          ctrl.EDITOR_TUTORIAL_OPTIONS[1].fn(true);

          expect(animateSpy).toHaveBeenCalledWith({
            scrollTop: 0
          }, 1000);
        });

        it('should change state interaction element scroll top when calling' +
          ' fn property function on index 3 of EDITOR_TUTORIAL_OPTIONS array',
        function() {
          var element = angular.element('div');
          // @ts-ignore is being used in order to ignore JQuery properties that
          // should be declared.
          spyOn(window, '$').and.returnValue(element);
          var animateSpy = spyOn(element, 'animate').and.callThrough();
          // @ts-ignore Angular element method doesn't expect to receive
          // 1 argument in the lints.
          spyOn(angular, 'element').withArgs('#tutorialStateContent').and
            .returnValue({
              // @ts-ignore Angular element should have more properties than
              // just offset in the lint settings.
              offset: () => ({
                top: 5
              })
            });

          ctrl.EDITOR_TUTORIAL_OPTIONS[3].fn(false);

          expect(animateSpy).toHaveBeenCalledWith({
            scrollTop: (5 - 200)
          }, 1000);
        });

        it('should change state content element scroll top when calling fn' +
          ' property function on index 3 of EDITOR_TUTORIAL_OPTIONS array',
        function() {
          var element = angular.element('div');
          // @ts-ignore is being used in order to ignore JQuery properties that
          // should be declared.
          spyOn(window, '$').and.returnValue(element);
          var animateSpy = spyOn(element, 'animate').and.callThrough();
          // @ts-ignore Angular element method doesn't expect to receive
          // 1 argument in the lints.
          spyOn(angular, 'element').withArgs('#tutorialStateInteraction').and
            .returnValue({
              // @ts-ignore Angular element should have more properties than
              // just offset in the lint settings.
              offset: () => ({
                top: 20
              })
            });

          ctrl.EDITOR_TUTORIAL_OPTIONS[3].fn(true);

          expect(animateSpy).toHaveBeenCalledWith({
            scrollTop: (20 - 200)
          }, 1000);
        });

        it('should change preview tab element scroll top when calling fn' +
          ' property function on index 5 of EDITOR_TUTORIAL_OPTIONS array',
        function() {
          var element = angular.element('div');
          // @ts-ignore is being used in order to ignore JQuery properties that
          // should be declared.
          spyOn(window, '$').and.returnValue(element);
          var animateSpy = spyOn(element, 'animate').and.callThrough();
          // @ts-ignore Angular element method doesn't expect to receive
          // 1 argument in the lints.
          spyOn(angular, 'element').withArgs('#tutorialPreviewTab').and
            .returnValue({
              // @ts-ignore Angular element should have more properties than
              // just offset in the lint settings.
              offset: () => ({
                top: 5
              })
            });

          ctrl.EDITOR_TUTORIAL_OPTIONS[5].fn(true);

          expect(animateSpy).toHaveBeenCalledWith({
            scrollTop: (5 - 200)
          }, 1000);
        });

        it('should change state interaction element scroll top when calling' +
          ' fn property function on index 5 of EDITOR_TUTORIAL_OPTIONS array',
        function() {
          var element = angular.element('div');
          // @ts-ignore is being used in order to ignore JQuery properties that
          // should be declared.
          spyOn(window, '$').and.returnValue(element);
          var animateSpy = spyOn(element, 'animate').and.callThrough();
          // @ts-ignore Angular element method doesn't expect to receive
          // 1 argument in the lints.
          spyOn(angular, 'element').withArgs('#tutorialStateInteraction').and
            .returnValue({
              // @ts-ignore Angular element should have more properties than
              // just offset in the lint settings.
              offset: () => ({
                top: 20
              })
            });

          ctrl.EDITOR_TUTORIAL_OPTIONS[5].fn(false);

          expect(animateSpy).toHaveBeenCalledWith({
            scrollTop: (20 - 200)
          }, 1000);
        });

        it('should change preview tabn element scroll top when calling fn' +
          ' property function on index 7 of EDITOR_TUTORIAL_OPTIONS array',
        function() {
          var element = angular.element('div');
          // @ts-ignore is being used in order to ignore JQuery properties that
          // should be declared.
          spyOn(window, '$').and.returnValue(element);
          var animateSpy = spyOn(element, 'animate').and.callThrough();
          // @ts-ignore Angular element method doesn't expect to receive
          // 1 argument in the lints.
          spyOn(angular, 'element').withArgs('#tutorialPreviewTab').and
            .returnValue({
              // @ts-ignore Angular element should have more properties than
              // just offset in the lint settings.
              offset: () => ({
                top: 5
              })
            });

          ctrl.EDITOR_TUTORIAL_OPTIONS[7].fn(true);

          expect(animateSpy).toHaveBeenCalledWith({
            scrollTop: (5 - 200)
          }, 1000);
        });

        it('should change state interaction element scroll top when calling' +
          ' fn property function on index 7 of EDITOR_TUTORIAL_OPTIONS array',
        function() {
          var element = angular.element('div');
          // @ts-ignore is being used in order to ignore JQuery properties that
          // should be declared.
          spyOn(window, '$').and.returnValue(element);
          var animateSpy = spyOn(element, 'animate').and.callThrough();
          // @ts-ignore Angular element method doesn't expect to receive
          // 1 argument in the lints.
          spyOn(angular, 'element').withArgs('#tutorialStateInteraction').and
            .returnValue({
              // @ts-ignore Angular element should have more properties than
              // just offset in the lint settings.
              offset: () => ({
                top: 20
              })
            });

          ctrl.EDITOR_TUTORIAL_OPTIONS[7].fn(false);

          expect(animateSpy).toHaveBeenCalledWith({
            scrollTop: (20 - 200)
          }, 1000);
        });
      });
    });
});
