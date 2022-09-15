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
 * @fileoverview Unit tests for translationTab.
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { LoaderService } from 'services/loader.service';
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { TextInputRulesService } from
  'interactions/TextInput/directives/text-input-rules.service';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { StateSolutionService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-solution.service';
import { StateCustomizationArgsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { StateInteractionIdService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { ExplorationImprovementsTaskRegistryService } from
  'services/exploration-improvements-task-registry.service';
import { ExplorationStatsService } from 'services/exploration-stats.service';
import { StateRecordedVoiceoversService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';
import { StateWrittenTranslationsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-written-translations.service';
import { ContextService } from 'services/context.service';
import { UserExplorationPermissionsService } from
  'pages/exploration-editor-page/services/user-exploration-permissions.service';
import { StateEditorRefreshService } from
  'pages/exploration-editor-page/services/state-editor-refresh.service';
import { ExternalSaveService } from 'services/external-save.service';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import $ from 'jquery';

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.

describe('Translation tab component', function() {
  var ctrl = null;
  var $q = null;
  var $scope = null;
  var ngbModal = null;
  var contextService = null;
  var editabilityService = null;
  var explorationStatesService = null;
  var loaderService = null;
  var routerService = null;
  var siteAnalyticsService = null;
  var stateEditorService = null;
  var stateTutorialFirstTimeService = null;
  var userExplorationPermissionsService = null;

  var refreshTranslationTabEmitter = new EventEmitter();
  var enterTranslationForTheFirstTimeEmitter = new EventEmitter();

  importAllAngularServices();

  beforeEach(function() {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    contextService = TestBed.get(ContextService);
    loaderService = TestBed.get(LoaderService);
    siteAnalyticsService = TestBed.get(SiteAnalyticsService);
    userExplorationPermissionsService = TestBed.get(
      UserExplorationPermissionsService);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AngularNameService', TestBed.get(AngularNameService));
    $provide.value(
      'ExplorationImprovementsTaskRegistryService',
      TestBed.get(ExplorationImprovementsTaskRegistryService));
    $provide.value(
      'ExplorationStatsService', TestBed.get(ExplorationStatsService));
    $provide.value('ExternalSaveService', TestBed.get(ExternalSaveService));
    $provide.value(
      'TextInputRulesService',
      TestBed.get(TextInputRulesService));
    $provide.value(
      'OutcomeObjectFactory', TestBed.get(OutcomeObjectFactory));
    $provide.value(
      'StateCustomizationArgsService',
      TestBed.get(StateCustomizationArgsService));
    $provide.value(
      'StateInteractionIdService', TestBed.get(StateInteractionIdService));
    $provide.value(
      'StateEditorRefreshService', TestBed.get(StateEditorRefreshService));
    $provide.value(
      'StateRecordedVoiceoversService',
      TestBed.get(StateRecordedVoiceoversService));
    $provide.value('StateSolutionService', TestBed.get(StateSolutionService));
    $provide.value(
      'StateWrittenTranslationsService',
      TestBed.get(StateWrittenTranslationsService));
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
    $provide.value('ContextService', {
      getExplorationId: () => {
        return 'exp1';
      }
    });
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    var $rootScope = $injector.get('$rootScope');
    editabilityService = $injector.get('EditabilityService');
    explorationStatesService = $injector.get('ExplorationStatesService');
    routerService = $injector.get('RouterService');
    stateEditorService = $injector.get('StateEditorService');
    ngbModal = $injector.get('NgbModal');
    stateTutorialFirstTimeService = $injector.get(
      'StateTutorialFirstTimeService');

    spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      'Introduction');
    spyOnProperty(
      stateTutorialFirstTimeService, 'onEnterTranslationForTheFirstTime')
      .and.returnValue(enterTranslationForTheFirstTimeEmitter);
    spyOnProperty(routerService, 'onRefreshTranslationTab')
      .and.returnValue(refreshTranslationTabEmitter);

    explorationStatesService.init({
      Introduction: {
        content: {
          content_id: 'content',
          html: 'Introduction Content'
        },
        interaction: {
          id: 'TextInput',
          customization_args: {
            placeholder: {value: {
              content_id: 'ca_placeholder',
              unicode_str: ''
            }},
            rows: {value: 1},
            catchMisspellings: {
              value: false
            }
          },
          answer_groups: [{
            rule_specs: [],
            outcome: {
              dest: 'unused',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            }
          }],
          default_outcome: {
            dest: 'default',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null
          },
          solution: {
            correct_answer: 'This is the correct answer',
            answer_is_exclusive: false,
            explanation: {
              html: 'Solution explanation',
              content_id: 'content_4'
            }
          },
          hints: []
        },
        linked_skill_id: null,
        next_content_id_index: 0,
        param_changes: [],
        solicit_answer_details: false,
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {
              en: {
                filename: 'myfile2.mp3',
                file_size_bytes: 120000,
                needs_update: false,
                duration_secs: 1.2
              }
            }
          }
        },
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {
              en: {
                html: 'This is a html',
                needs_update: false
              }
            }
          }
        }
      }
    });

    $scope = $rootScope.$new();
    ctrl = $componentController('translationTab', {
      $scope: $scope,
      ContextService: contextService,
      LoaderService: loaderService,
      SiteAnalyticsService: siteAnalyticsService,
      UserExplorationPermissionsService: userExplorationPermissionsService
    });
  }));

  afterEach(function() {
    ctrl.$onDestroy();
  });

  it('should initialize $scope properties after controller is initialized',
    function() {
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
        .returnValue($q.resolve({
          canVoiceover: true
        }));

      ctrl.$onInit();
      $scope.$apply();

      expect($scope.isTranslationTabBusy).toBe(false);
      expect($scope.showTranslationTabSubDirectives).toBe(false);
      expect($scope.tutorialInProgress).toBe(false);
    });

  it('should load translation tab data when translation tab page is' +
    ' refreshed', function() {
    spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
      .returnValue($q.resolve({
        canVoiceover: true
      }));

    ctrl.$onInit();
    $scope.$apply();

    spyOn(loaderService, 'hideLoadingScreen');
    refreshTranslationTabEmitter.emit();

    expect($scope.showTranslationTabSubDirectives).toBe(true);
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
  });

  it('should start tutorial if in tutorial mode on page load with' +
    ' permissions', () => {
    spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
      .returnValue($q.resolve({
        canVoiceover: true
      }));
    spyOn($scope, 'startTutorial').and.callThrough();

    editabilityService.onStartTutorial();
    ctrl.$onInit();
    $scope.$apply();
    $scope.initTranslationTab();
    $scope.$apply();

    expect(editabilityService.inTutorialMode()).toBe(true);
    expect($scope.startTutorial).toHaveBeenCalled();
    expect($scope.tutorialInProgress).toBe(true);
  });

  it('should not start tutorial if in tutorial mode on page load but' +
    ' no permissions', () => {
    spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
      .returnValue($q.resolve(null));

    editabilityService.onStartTutorial();
    ctrl.$onInit();
    $scope.$apply();
    $scope.initTranslationTab();
    $scope.$apply();

    expect(editabilityService.inTutorialMode()).toBe(true);
    expect($scope.tutorialInProgress).toBe(false);
  });

  it('should not start tutorial if not in tutorial mode on page load', () => {
    spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
      .returnValue($q.resolve({
        canVoiceover: true
      }));

    editabilityService.onEndTutorial();
    ctrl.$onInit();
    $scope.$apply();
    $scope.initTranslationTab();
    $scope.$apply();

    expect(editabilityService.inTutorialMode()).toBe(false);
    expect($scope.tutorialInProgress).toBe(false);
  });

  it('should finish tutorial on clicking the end tutorial button when' +
    ' it has already started', function() {
    spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
      .returnValue($q.resolve({
        canVoiceover: true
      }));

    ctrl.$onInit();
    $scope.$apply();
    editabilityService.onStartTutorial();
    $scope.$apply();

    spyOn(editabilityService, 'onEndTutorial');
    spyOn(stateTutorialFirstTimeService, 'markTranslationTutorialFinished');

    $scope.onFinishTutorial();

    expect(editabilityService.onEndTutorial).toHaveBeenCalled();
    expect(stateTutorialFirstTimeService.markTranslationTutorialFinished)
      .toHaveBeenCalled();
    expect($scope.tutorialInProgress).toBe(false);
  });

  it('should skip tutorial when the skip tutorial button is clicked',
    function() {
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
        .returnValue($q.resolve({
          canVoiceover: true
        }));

      ctrl.$onInit();
      $scope.$apply();
      editabilityService.onStartTutorial();
      $scope.$apply();

      spyOn(editabilityService, 'onEndTutorial');
      spyOn(stateTutorialFirstTimeService, 'markTranslationTutorialFinished');

      $scope.onSkipTutorial();

      expect(editabilityService.onEndTutorial).toHaveBeenCalled();
      expect(stateTutorialFirstTimeService.markTranslationTutorialFinished)
        .toHaveBeenCalled();
      expect($scope.tutorialInProgress).toBe(false);
    });

  it('should start tutorial when welcome translation modal is closed',
    fakeAsync(() => {
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
        .returnValue($q.resolve({
          canVoiceover: true
        }));

      ctrl.$onInit();
      $scope.$apply();

      spyOn(siteAnalyticsService, 'registerAcceptTutorialModalEvent');
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve('exp1')
      } as NgbModalRef);
      enterTranslationForTheFirstTimeEmitter.emit();
      tick();
      $scope.$apply();

      expect(siteAnalyticsService.registerAcceptTutorialModalEvent)
        .toHaveBeenCalled();
    }));

  it('should finish translation tutorial when welcome translation modal is' +
    ' dismissed', fakeAsync(() => {
    spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
      .returnValue($q.resolve({
        canVoiceover: true
      }));
    ctrl.$onInit();

    spyOn(stateTutorialFirstTimeService, 'markTranslationTutorialFinished')
      .and.stub();
    spyOn(siteAnalyticsService, 'registerDeclineTutorialModalEvent').and.stub();
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject('exp1')
    } as NgbModalRef);
    enterTranslationForTheFirstTimeEmitter.emit();
    tick();
    $scope.$apply();

    expect(siteAnalyticsService.registerDeclineTutorialModalEvent)
      .toHaveBeenCalledWith('exp1');
    expect(stateTutorialFirstTimeService.markTranslationTutorialFinished)
      .toHaveBeenCalled();
  }));

  describe('TRANSLATION_TUTORIAL_OPTIONS', function() {
    it('should animate html and body to 0px top when calling function' +
      ' from option 1', function() {
      ctrl.$onInit();

      var elementMock = $(document.createElement('div'));
      spyOn(window, '$').withArgs('html, body').and.returnValue(elementMock);
      spyOn(elementMock, 'animate');

      $scope.TRANSLATION_TUTORIAL_OPTIONS[1].fn(true);

      expect(elementMock.animate).toHaveBeenCalledWith({
        scrollTop: 0
      }, 1000);
    });

    it('should animate html and body to 20px top when calling function' +
      ' from option 1', function() {
      ctrl.$onInit();

      var elementMock = $(document.createElement('div'));
      spyOn(window, '$').withArgs('html, body').and.returnValue(elementMock);
      spyOn(elementMock, 'animate');

      $scope.TRANSLATION_TUTORIAL_OPTIONS[1].fn(false);

      expect(elementMock.animate).toHaveBeenCalledWith({
        scrollTop: 20
      }, 1000);
    });

    it('should set new top value to element with tutorialTranslationOverview' +
      ' id when calling function from option 3', function() {
      ctrl.$onInit();

      var elementMock = $(document.createElement('div'));
      spyOn(window, '$').withArgs('html, body').and.returnValue(elementMock);
      spyOn(elementMock, 'animate');

      spyOn(angular, 'element').withArgs('#tutorialTranslationOverview')
        .and.returnValue({
          // This throws "Type '{ top: number; }' is not assignable to type
          // 'JQLite | Coordinates'". We need to suppress this error because
          // angular element have more properties than offset and top.
          // @ts-expect-error
          offset: () => ({
            top: 210
          })
        });

      $scope.TRANSLATION_TUTORIAL_OPTIONS[3].fn(true);

      expect(elementMock.animate).toHaveBeenCalledWith({
        scrollTop: 10
      }, 1000);
    });

    it('should set new top value to element with tutorialTranslationLanguage' +
    ' id when calling function from option 3', function() {
      ctrl.$onInit();

      var elementMock = $(document.createElement('div'));
      spyOn(window, '$').withArgs('html, body').and.returnValue(elementMock);
      spyOn(elementMock, 'animate');

      spyOn(angular, 'element').withArgs('#tutorialTranslationLanguage')
        .and.returnValue({
          // This throws "Type '{ top: number; }' is not assignable to type
          // 'JQLite | Coordinates'". We need to suppress this error because
          // angular element have more properties than offset and top.
          // @ts-expect-error
          offset: () => ({
            top: 250
          })
        });

      $scope.TRANSLATION_TUTORIAL_OPTIONS[3].fn(false);

      expect(elementMock.animate).toHaveBeenCalledWith({
        scrollTop: 50
      }, 1000);
    });

    it('should set new top value to element with tutorialTranslationState' +
      ' id when calling function from option 5', function() {
      ctrl.$onInit();

      var elementMock = $(document.createElement('div'));
      spyOn(window, '$').withArgs('html, body').and.returnValue(elementMock);
      spyOn(elementMock, 'animate');

      spyOn(angular, 'element').withArgs('#tutorialTranslationState')
        .and.returnValue({
          // This throws "Type '{ top: number; }' is not assignable to type
          // 'JQLite | Coordinates'". We need to suppress this error because
          // angular element have more properties than offset and top.
          // @ts-expect-error
          offset: () => ({
            top: 210
          })
        });

      $scope.TRANSLATION_TUTORIAL_OPTIONS[5].fn(true);

      expect(elementMock.animate).toHaveBeenCalledWith({
        scrollTop: 10
      }, 1000);
    });

    it('should set new top value to element with tutorialTranslationOverview' +
      ' id when calling function from option 5', function() {
      ctrl.$onInit();

      var elementMock = $(document.createElement('div'));
      spyOn(window, '$').withArgs('html, body').and.returnValue(elementMock);
      spyOn(elementMock, 'animate');

      spyOn(angular, 'element').withArgs('#tutorialTranslationOverview')
        .and.returnValue({
          // This throws "Type '{ top: number; }' is not assignable to type
          // 'JQLite | Coordinates'". We need to suppress this error because
          // angular element have more properties than offset and top.
          // @ts-expect-error
          offset: () => ({
            top: 250
          })
        });

      $scope.TRANSLATION_TUTORIAL_OPTIONS[5].fn(false);

      expect(elementMock.animate).toHaveBeenCalledWith({
        scrollTop: 50
      }, 1000);
    });

    it('should animate html and body to 0px top when calling function' +
      ' from option 7', function() {
      ctrl.$onInit();

      var elementMock = $(document.createElement('div'));
      spyOn(window, '$').withArgs('html, body').and.returnValue(elementMock);
      spyOn(elementMock, 'animate');

      $scope.TRANSLATION_TUTORIAL_OPTIONS[7].fn(true);

      expect(elementMock.animate).toHaveBeenCalledWith({
        scrollTop: 0
      }, 1000);
    });

    it('should animate html and body to 20px top when calling function' +
      ' from option 7', function() {
      ctrl.$onInit();

      var elementMock = $(document.createElement('div'));
      spyOn(window, '$').withArgs('html, body').and.returnValue(elementMock);
      spyOn(elementMock, 'animate');

      $scope.TRANSLATION_TUTORIAL_OPTIONS[7].fn(false);

      expect(elementMock.animate).toHaveBeenCalledWith({
        scrollTop: 20
      }, 1000);
    });

    it('should animate html and body to 0px top when calling function' +
      ' from option 9', function() {
      ctrl.$onInit();

      var elementMock = $(document.createElement('div'));
      spyOn(window, '$').withArgs('html, body').and.returnValue(elementMock);
      spyOn(elementMock, 'animate');

      $scope.TRANSLATION_TUTORIAL_OPTIONS[9].fn(true);

      expect(elementMock.animate).toHaveBeenCalledWith({
        scrollTop: 0
      }, 1000);
    });

    it('should animate html and body to 20px top when calling function' +
      ' from option 9', function() {
      ctrl.$onInit();

      var elementMock = $(document.createElement('div'));
      spyOn(window, '$').withArgs('html, body').and.returnValue(elementMock);
      spyOn(elementMock, 'animate');

      $scope.TRANSLATION_TUTORIAL_OPTIONS[9].fn(false);

      expect(elementMock.animate).toHaveBeenCalledWith({
        scrollTop: 20
      }, 1000);
    });

    it('should animate html and body to 0px top when calling function' +
      ' from option 11', function() {
      ctrl.$onInit();

      var elementMock = $(document.createElement('div'));
      spyOn(window, '$').withArgs('html, body').and.returnValue(elementMock);
      spyOn(elementMock, 'animate');

      $scope.TRANSLATION_TUTORIAL_OPTIONS[11].fn(true);

      expect(elementMock.animate).toHaveBeenCalledWith({
        scrollTop: 0
      }, 1000);
    });

    it('should animate html and body to 20px top when calling function' +
      ' from option 11', function() {
      ctrl.$onInit();

      var elementMock = $(document.createElement('div'));
      spyOn(window, '$').withArgs('html, body').and.returnValue(elementMock);
      spyOn(elementMock, 'animate');

      $scope.TRANSLATION_TUTORIAL_OPTIONS[11].fn(false);

      expect(elementMock.animate).toHaveBeenCalledWith({
        scrollTop: 20
      }, 1000);
    });
  });
});
