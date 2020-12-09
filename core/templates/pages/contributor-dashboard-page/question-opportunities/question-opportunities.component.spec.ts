// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for questionOpportunities.
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ContributionOpportunitiesBackendApiService } from
  // eslint-disable-next-line max-len
  'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';
import { SkillOpportunity } from
  'domain/opportunity/skill-opportunity.model';
import { AlertsService } from 'services/alerts.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { UserService } from 'services/user.service';
// TODO(#7222): Remove usage of importAllAngularServices once upgraded to
// Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';

describe('Question opportunities component', function() {
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var alertsService = null;
  var contributionOpportunitiesService = null;
  var questionUndoRedoService = null;
  var siteAnalyticsService = null;
  var skillObjectFactory = null;
  var userService = null;

  var opportunitiesArray = [];
  importAllAngularServices();

  beforeEach(function() {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    alertsService = TestBed.get(AlertsService);
    siteAnalyticsService = TestBed.get(SiteAnalyticsService);
    skillObjectFactory = TestBed.get(SkillObjectFactory);
    userService = TestBed.get(UserService);
  });

  beforeEach(angular.mock.module(
    'oppia', function($provide) {
      $provide.value(
        'ContributionOpportunitiesBackendApiService',
        TestBed.get(ContributionOpportunitiesBackendApiService));
    }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    contributionOpportunitiesService = $injector.get(
      'ContributionOpportunitiesService');
    questionUndoRedoService = $injector.get('QuestionUndoRedoService');

    opportunitiesArray = [
      SkillOpportunity.createFromBackendDict({
        id: '1',
        skill_description: 'Skill description 1',
        topic_name: 'topic_1',
        question_count: 5
      }),
      SkillOpportunity.createFromBackendDict({
        id: '2',
        skill_description: 'Skill description 2',
        topic_name: 'topic_1',
        question_count: 2
      })
    ];

    ctrl = $componentController('questionOpportunities', {
      $rootScope: $rootScope,
      AlertsService: alertsService
    });
  }));

  it('should load question opportunities when component is initialized',
    function() {
      spyOn(contributionOpportunitiesService, 'getSkillOpportunities').and
        .callFake((callback) => {
          callback(opportunitiesArray, false);
        });
      ctrl.$onInit();

      expect(ctrl.opportunities.length).toBe(2);
      expect(ctrl.moreOpportunitiesAvailable).toBe(false);
      expect(ctrl.opportunitiesAreLoading).toBe(false);
    });

  it('should load more question opportunities when reaching the end' +
    ' of page and there are more opportunities available', function() {
    spyOn(contributionOpportunitiesService, 'getSkillOpportunities').and
      .callFake((callback) => {
        callback(opportunitiesArray, true);
      });
    ctrl.$onInit();
    $rootScope.$apply();

    expect(ctrl.opportunities.length).toBe(2);
    expect(ctrl.moreOpportunitiesAvailable).toBe(true);
    expect(ctrl.opportunitiesAreLoading).toBe(false);

    var getMoreSkillOpportunitiesSpy = spyOn(
      contributionOpportunitiesService, 'getMoreSkillOpportunities');

    getMoreSkillOpportunitiesSpy
      .and.callFake((callback) => {
        callback(opportunitiesArray, false);
      });
    ctrl.onLoadMoreOpportunities();
    $rootScope.$apply();

    getMoreSkillOpportunitiesSpy.calls.reset();

    expect(ctrl.opportunities.length).toBe(4);
    expect(ctrl.moreOpportunitiesAvailable).toBe(false);
    expect(ctrl.opportunitiesAreLoading).toBe(false);

    ctrl.onLoadMoreOpportunities();
    expect(getMoreSkillOpportunitiesSpy).not.toHaveBeenCalled();
  });

  it('should register Contributor Dashboard suggest event when clicking on' +
    ' suggest question button', function() {
    spyOn($uibModal, 'open').and.callThrough();
    spyOn(siteAnalyticsService, 'registerContributorDashboardSuggestEvent');
    spyOn(userService, 'getUserInfoAsync').and.returnValue($q.resolve({
      isLoggedIn: () => true
    }));
    ctrl.$onInit();
    $rootScope.$apply();

    ctrl.onClickSuggestQuestionButton('1');
    $rootScope.$apply();

    expect(siteAnalyticsService.registerContributorDashboardSuggestEvent)
      .toHaveBeenCalledWith('Question');
  });

  it('should open requires login modal when trying to select a question and' +
    ' a skill difficulty and user is not logged', function() {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      $q.resolve({
        isLoggedIn: () => false
      }));
    ctrl.$onInit();
    $rootScope.$apply();

    spyOn($uibModal, 'open');
    // The callFake is to avoid conflicts when testing modal calls.
    spyOn(contributionOpportunitiesService, 'showRequiresLoginModal').and
      .callFake(() => {});
    ctrl.onClickSuggestQuestionButton('1');

    expect($uibModal.open).not.toHaveBeenCalled();
  });


  it('should open select skill and skill difficulty modal when clicking' +
    ' on suggesting question button', function() {
    spyOn($uibModal, 'open').and.callThrough();
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      $q.resolve({
        isLoggedIn: () => true
      }));
    ctrl.$onInit();
    $rootScope.$apply();

    ctrl.onClickSuggestQuestionButton('1');
    $rootScope.$apply();

    expect($uibModal.open).toHaveBeenCalled();
  });

  it('should open create question modal when creating a question', function() {
    spyOn($uibModal, 'open').and.callThrough();
    ctrl.createQuestion(
      skillObjectFactory.createFromBackendDict({
        id: '1',
        description: 'test description',
        misconceptions: [],
        rubrics: [],
        skill_contents: {
          explanation: {
            html: 'test explanation',
            content_id: 'explanation',
          },
          worked_examples: [],
          recorded_voiceovers: {
            voiceovers_mapping: {}
          }
        },
        language_code: 'en',
        version: 3,
      }), 1);
    $rootScope.$apply();

    expect($uibModal.open).toHaveBeenCalled();
  });

  it('should create a question when closing create question modal',
    function() {
      var openSpy = spyOn($uibModal, 'open');
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        $q.resolve({
          isLoggedIn: () => true
        }));
      ctrl.$onInit();
      $rootScope.$apply();
      alertsService.clearWarnings();

      openSpy.and.returnValue({
        result: $q.resolve({
          skill: skillObjectFactory.createFromBackendDict({
            id: '1',
            description: 'test description',
            misconceptions: [],
            rubrics: [],
            skill_contents: {
              explanation: {
                html: 'test explanation',
                content_id: 'explanation',
              },
              worked_examples: [],
              recorded_voiceovers: {
                voiceovers_mapping: {}
              }
            },
            language_code: 'en',
            version: 3,
          }),
          skillDifficulty: 1
        })
      });
      ctrl.onClickSuggestQuestionButton('1');
      openSpy.calls.reset();

      spyOn(questionUndoRedoService, 'clearChanges');
      openSpy.and.returnValue({
        result: $q.resolve()
      });
      $rootScope.$apply();

      expect(openSpy).toHaveBeenCalled();
      expect(questionUndoRedoService.clearChanges).toHaveBeenCalled();
    });

  it('should suggest a question when dismissing create question modal',
    function() {
      var openSpy = spyOn($uibModal, 'open');
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        $q.resolve({
          isLoggedIn: () => true
        }));
      ctrl.$onInit();
      $rootScope.$apply();
      alertsService.clearWarnings();

      openSpy.and.returnValue({
        result: $q.resolve({
          skill: skillObjectFactory.createFromBackendDict({
            id: '1',
            description: 'test description',
            misconceptions: [],
            rubrics: [],
            skill_contents: {
              explanation: {
                html: 'test explanation',
                content_id: 'explanation',
              },
              worked_examples: [],
              recorded_voiceovers: {
                voiceovers_mapping: {}
              }
            },
            language_code: 'en',
            version: 3,
          }),
          skillDifficulty: 1
        })
      });
      ctrl.onClickSuggestQuestionButton('1');
      openSpy.calls.reset();

      spyOn(questionUndoRedoService, 'clearChanges');
      openSpy.and.returnValue({
        result: $q.reject()
      });
      $rootScope.$apply();

      expect(openSpy).toHaveBeenCalled();
      expect(questionUndoRedoService.clearChanges).toHaveBeenCalled();
    });

  it('should not create a question when dismissing select skill and skill' +
    ' difficulty modal', function() {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      $q.resolve({
        isLoggedIn: () => true
      }));
    ctrl.$onInit();
    $rootScope.$apply();

    ctrl.onClickSuggestQuestionButton('1');
    $rootScope.$apply();

    expect($uibModal.open).toHaveBeenCalled();
  });
});
