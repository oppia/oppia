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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('pages/exploration-editor-page/exploration-editor-page.component.ts');

describe('Exploration editor page component', function() {
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var $timeout = null;
  var $uibModal = null;
  var AutosaveInfoModalsService = null;
  var ChangeListService = null;
  var ContextService = null;
  var EditabilityService = null;
  var ExplorationFeaturesBackendApiService = null;
  var ExplorationFeaturesService = null;
  var ExplorationRightsService = null;
  var ExplorationTitleService = null;
  var ExplorationWarningsService = null;
  var GraphDataService = null;
  var PageTitleService = null;
  var RouterService = null;
  var StateEditorService = null;
  var StateTopAnswersStatsBackendApiService = null;
  var SiteAnalyticsService = null;
  var ThreadDataService = null;
  var UserExplorationPermissionsService = null;

  var explorationId = 'exp1';
  var explorationData = {
    exploration_is_linked_to_story: true,
    states: {
      Introduction: {
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
            dest: 'Introduction',
            feedback: {
              html: '',
              audio_translations: {}
            }
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
            dest: 'Introduction',
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

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('ExplorationDataService', mockExplorationDataService);
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    $uibModal = $injector.get('$uibModal');
    AutosaveInfoModalsService = $injector.get('AutosaveInfoModalsService');
    ChangeListService = $injector.get('ChangeListService');
    ContextService = $injector.get('ContextService');
    EditabilityService = $injector.get('EditabilityService');
    ExplorationFeaturesBackendApiService = $injector.get(
      'ExplorationFeaturesBackendApiService');
    ExplorationFeaturesService = $injector.get('ExplorationFeaturesService');
    ExplorationRightsService = $injector.get('ExplorationRightsService');
    ExplorationTitleService = $injector.get('ExplorationTitleService');
    ExplorationWarningsService = $injector.get('ExplorationWarningsService');
    GraphDataService = $injector.get('GraphDataService');
    PageTitleService = $injector.get('PageTitleService');
    RouterService = $injector.get('RouterService');
    StateEditorService = $injector.get('StateEditorService');
    StateTopAnswersStatsBackendApiService = $injector.get(
      'StateTopAnswersStatsBackendApiService');
    SiteAnalyticsService = $injector.get('SiteAnalyticsService');
    ThreadDataService = $injector.get('ThreadDataService');
    UserExplorationPermissionsService = $injector.get(
      'UserExplorationPermissionsService');

    $scope = $rootScope.$new();
    ctrl = $componentController('explorationEditorPage');
  }));

  describe('when user permission is true and draft changes not valid',
    function() {
      var userPermissions = {
        can_edit: true,
        can_voiceover: true
      };

      beforeEach(function() {
        getPermissionsSpy = spyOn(
          UserExplorationPermissionsService, 'getPermissionsAsync');
        spyOnAllFunctions(SiteAnalyticsService);
        spyOn(ExplorationWarningsService, 'updateWarnings').and.callThrough();
        spyOn(GraphDataService, 'recompute').and.callThrough();
        spyOn(PageTitleService, 'setPageTitle').and.callThrough();

        getPermissionsSpy.and.returnValue($q.resolve(userPermissions));
        spyOn(ContextService, 'getExplorationId').and.returnValue(
          explorationId);
        spyOn(ExplorationFeaturesBackendApiService, 'fetchExplorationFeatures')
          .and.returnValue($q.resolve({}));
        spyOn(ThreadDataService, 'getOpenThreadsCountAsync').and.returnValue(
          $q.resolve(0));

        explorationData.is_version_of_draft_valid = false;

        ctrl.$onInit();
      });

      it('should mark exploration as editable and translatable',
        function() {
          spyOn(EditabilityService, 'markEditable').and.callThrough();
          spyOn(EditabilityService, 'markTranslatable').and.callThrough();
          $scope.$apply();

          expect(EditabilityService.markEditable).toHaveBeenCalled();
          expect(EditabilityService.markTranslatable).toHaveBeenCalled();
        });

      it('should set active state name', function() {
        spyOn(StateEditorService, 'getActiveStateName').and.returnValue(
          'State2');
        spyOn(StateEditorService, 'setActiveStateName').and.callThrough();
        $scope.$apply();

        expect(StateEditorService.setActiveStateName).toHaveBeenCalled();
      });

      it('should load change list by draft changes successfully', function() {
        spyOn(ChangeListService, 'loadAutosavedChangeList').and.callThrough();
        $scope.$apply();

        expect(ChangeListService.loadAutosavedChangeList).toHaveBeenCalledWith(
          explorationData.draft_changes);
      });

      it('should show mismatch version modal when draft change is not null',
        function() {
          spyOn(AutosaveInfoModalsService, 'showVersionMismatchModal').and
            .callThrough();
          $scope.$apply();

          expect(AutosaveInfoModalsService.showVersionMismatchModal)
            .toHaveBeenCalled();
        });

      it('should navigate to main tab', function() {
        spyOn(RouterService, 'isLocationSetToNonStateEditorTab').and
          .returnValue(null);
        spyOn(RouterService, 'getCurrentStateFromLocationPath').and
          .returnValue(null);
        spyOn(RouterService, 'navigateToMainTab').and.callThrough();
        $scope.$apply();

        expect(RouterService.navigateToMainTab).toHaveBeenCalled();
      });
    });

  describe('when user permission is false and draft changes are true',
    function() {
      var userPermissions = {
        can_edit: false
      };

      beforeEach(function() {
        getPermissionsSpy = spyOn(
          UserExplorationPermissionsService, 'getPermissionsAsync');
        spyOnAllFunctions(SiteAnalyticsService);
        spyOn(ExplorationWarningsService, 'updateWarnings').and.callThrough();
        spyOn(GraphDataService, 'recompute').and.callThrough();
        spyOn(PageTitleService, 'setPageTitle').and.callThrough();

        getPermissionsSpy.and.returnValue($q.resolve(userPermissions));
        spyOn(ContextService, 'getExplorationId').and.returnValue(
          explorationId);
        spyOn(ExplorationFeaturesBackendApiService, 'fetchExplorationFeatures')
          .and.returnValue($q.resolve({}));
        spyOn(ThreadDataService, 'getOpenThreadsCountAsync').and.returnValue(
          $q.resolve(1));

        explorationData.is_version_of_draft_valid = true;

        ctrl.$onInit();
      });

      it('should link exploration to story when initing exploration page',
        function() {
          spyOn(ContextService, 'setExplorationIsLinkedToStory').and
            .callThrough();
          $scope.$apply();

          expect(ContextService.setExplorationIsLinkedToStory)
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
          spyOn(ExplorationRightsService, 'isPublic').and.returnValue(true);
          spyOn(StateTopAnswersStatsBackendApiService, 'fetchStats').and
            .returnValue($q.resolve(stateTopAnswersStatsBackendDict));
          $scope.$apply();

          expect(ExplorationWarningsService.updateWarnings)
            .toHaveBeenCalled();
        });

      it('should navigate to feedback tab', function() {
        spyOn(RouterService, 'isLocationSetToNonStateEditorTab').and
          .returnValue(null);
        spyOn(RouterService, 'getCurrentStateFromLocationPath').and
          .returnValue(null);
        spyOn(RouterService, 'navigateToFeedbackTab').and.callThrough();
        $scope.$apply();

        expect(RouterService.navigateToFeedbackTab).toHaveBeenCalled();
      });

      it('should react when exploration property changes', function() {
        ExplorationTitleService.init('Exploration Title');
        $rootScope.$broadcast('explorationPropertyChanged');

        expect(PageTitleService.setPageTitle).toHaveBeenCalledWith(
          'Exploration Title - Oppia Editor');
      });

      it('should react when untitled exploration property changes', function() {
        ExplorationTitleService.init('');
        $rootScope.$broadcast('explorationPropertyChanged');

        expect(PageTitleService.setPageTitle).toHaveBeenCalledWith(
          'Untitled Exploration - Oppia Editor');
      });

      it('should react when refreshing graph', function() {
        $rootScope.$broadcast('refreshGraph');

        expect(GraphDataService.recompute).toHaveBeenCalled();
        expect(ExplorationWarningsService.updateWarnings).toHaveBeenCalled();
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
        spyOn(RouterService, 'navigateToMainTab').and.callThrough();
        spyOn($uibModal, 'open').and.returnValue({
          result: $q.resolve(explorationId)
        });

        expect(ctrl.tutorialInProgress).toBe(false);

        ctrl.showWelcomeExplorationModal();
        $scope.$apply();

        expect(SiteAnalyticsService.registerAcceptTutorialModalEvent)
          .toHaveBeenCalledWith(explorationId);
        expect(RouterService.navigateToMainTab).toHaveBeenCalled();
        $timeout.flush();

        expect(ctrl.tutorialInProgress).toBe(true);

        ctrl.onSkipTutorial();
        expect(SiteAnalyticsService.registerSkipTutorialEvent)
          .toHaveBeenCalledWith(explorationId);
        expect(ctrl.tutorialInProgress).toBe(false);
      });

      it('should accept tutorial when closing welcome exploration modal and' +
        ' then finish it', function() {
        spyOn(RouterService, 'navigateToMainTab').and.callThrough();
        spyOn($uibModal, 'open').and.returnValue({
          result: $q.resolve(explorationId)
        });

        expect(ctrl.tutorialInProgress).toBe(false);

        ctrl.showWelcomeExplorationModal();
        $scope.$apply();

        expect(SiteAnalyticsService.registerAcceptTutorialModalEvent)
          .toHaveBeenCalledWith(explorationId);
        expect(RouterService.navigateToMainTab).toHaveBeenCalled();
        $timeout.flush();

        expect(ctrl.tutorialInProgress).toBe(true);

        ctrl.onFinishTutorial();
        expect(SiteAnalyticsService.registerFinishTutorialEvent)
          .toHaveBeenCalledWith(explorationId);
        expect(ctrl.tutorialInProgress).toBe(false);
      });

      it('should check if improvements tab is enabled', function() {
        var isInitializedSpy = spyOn(
          ExplorationFeaturesService, 'isInitialized');
        var isImprovementsTabEnabledSpy = spyOn(
          ExplorationFeaturesService, 'isImprovementsTabEnabled');
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

          expect(SiteAnalyticsService.registerDeclineTutorialModalEvent)
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
        var activeTabNameSpy = spyOn(RouterService, 'getActiveTabName');

        activeTabNameSpy.and.returnValue('preview');
        expect(ctrl.getActiveTabName(activeTabNameSpy)).toBe('preview');

        activeTabNameSpy.and.returnValue('history');
        expect(ctrl.getActiveTabName(activeTabNameSpy)).toBe('history');
      });

      it('should change element scroll top when calling fn on index 1 of' +
        ' EDITOR_TUTORIAL_OPTIONS', function() {
        var element = angular.element('div');
        // @ts-ignore
        spyOn(window, '$').and.returnValue(element);

        var animateSpy = spyOn(element, 'animate').and.callThrough();

        ctrl.EDITOR_TUTORIAL_OPTIONS[1].fn(false);

        expect(animateSpy).toHaveBeenCalledWith({
          scrollTop: 20
        }, 1000);
      });

      it('should not change element scroll top when calling fn on index 1 of' +
        ' EDITOR_TUTORIAL_OPTIONS', function() {
        var element = angular.element('div');
        // @ts-ignore
        spyOn(window, '$').and.returnValue(element);

        var animateSpy = spyOn(element, 'animate').and.callThrough();

        ctrl.EDITOR_TUTORIAL_OPTIONS[1].fn(true);

        expect(animateSpy).toHaveBeenCalledWith({
          scrollTop: 0
        }, 1000);
      });

      it('should change state interaction element scroll top when calling fn' +
        ' on index 3 of EDITOR_TUTORIAL_OPTIONS', function() {
        var element = angular.element('div');
        // @ts-ignore
        spyOn(window, '$').and.returnValue(element);
        var animateSpy = spyOn(element, 'animate').and.callThrough();
        spyOn(angular, 'element').withArgs('#tutorialStateContent').and
          .returnValue(<any>{
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
        ' on index 3 of EDITOR_TUTORIAL_OPTIONS', function() {
        var element = angular.element('div');
        // @ts-ignore
        spyOn(window, '$').and.returnValue(element);
        var animateSpy = spyOn(element, 'animate').and.callThrough();
        spyOn(angular, 'element').withArgs('#tutorialStateInteraction').and
          .returnValue(<any>{
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
        ' on index 5 of EDITOR_TUTORIAL_OPTIONS', function() {
        var element = angular.element('div');
        // @ts-ignore
        spyOn(window, '$').and.returnValue(element);
        var animateSpy = spyOn(element, 'animate').and.callThrough();
        spyOn(angular, 'element').withArgs('#tutorialPreviewTab').and
          .returnValue(<any>{
            offset: () => ({
              top: 5
            })
          });

        ctrl.EDITOR_TUTORIAL_OPTIONS[5].fn(true);

        expect(animateSpy).toHaveBeenCalledWith({
          scrollTop: (5 - 200)
        }, 1000);
      });

      it('should change state interaction element scroll top when calling fn' +
        ' on index 5 of EDITOR_TUTORIAL_OPTIONS', function() {
        var element = angular.element('div');
        // @ts-ignore
        spyOn(window, '$').and.returnValue(element);
        var animateSpy = spyOn(element, 'animate').and.callThrough();
        spyOn(angular, 'element').withArgs('#tutorialStateInteraction').and
          .returnValue(<any>{
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
        ' on index 7 of EDITOR_TUTORIAL_OPTIONS', function() {
        var element = angular.element('div');
        // @ts-ignore
        spyOn(window, '$').and.returnValue(element);
        var animateSpy = spyOn(element, 'animate').and.callThrough();
        spyOn(angular, 'element').withArgs('#tutorialPreviewTab').and
          .returnValue(<any>{
            offset: () => ({
              top: 5
            })
          });

        ctrl.EDITOR_TUTORIAL_OPTIONS[7].fn(true);

        expect(animateSpy).toHaveBeenCalledWith({
          scrollTop: (5 - 200)
        }, 1000);
      });

      it('should change state interaction element scroll top when calling fn' +
        ' on index 7 of EDITOR_TUTORIAL_OPTIONS', function() {
        var element = angular.element('div');
        // @ts-ignore
        spyOn(window, '$').and.returnValue(element);
        var animateSpy = spyOn(element, 'animate').and.callThrough();
        spyOn(angular, 'element').withArgs('#tutorialStateInteraction').and
          .returnValue(<any>{
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
