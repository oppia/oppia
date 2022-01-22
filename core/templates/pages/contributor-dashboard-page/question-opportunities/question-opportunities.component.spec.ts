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

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
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
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

class MockNgbModalRef {
  componentInstance: {
    skillId: null;
  };
}

describe('Question opportunities component', function() {
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var alertsService = null;
  var contributionOpportunitiesService = null;
  let ngbModal: NgbModal = null;
  var questionUndoRedoService = null;
  var siteAnalyticsService = null;
  var skillObjectFactory = null;
  var userService = null;

  var opportunitiesArray = [];
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

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
    ngbModal = $injector.get('NgbModal');
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

  it('should load question opportunities', () => {
    spyOn(contributionOpportunitiesService, 'getSkillOpportunitiesAsync').and
      .returnValue(Promise.resolve({
        opportunities: opportunitiesArray,
        more: false
      }));

    ctrl.loadOpportunities().then(({opportunitiesDicts, more}) => {
      expect(opportunitiesDicts.length).toBe(2);
      expect(more).toBe(false);
    });
  });

  it('should load more question opportunities', function() {
    spyOn(contributionOpportunitiesService, 'getSkillOpportunitiesAsync').and
      .returnValue(Promise.resolve({
        opportunities: opportunitiesArray,
        more: true
      }));

    ctrl.loadOpportunities().then(({opportunitiesDicts, more}) => {
      expect(opportunitiesDicts.length).toBe(2);
      expect(more).toBe(true);
    });

    spyOn(
      contributionOpportunitiesService, 'getMoreSkillOpportunitiesAsync').and
      .returnValue(Promise.resolve({
        opportunities: opportunitiesArray,
        more: false
      }));

    ctrl.loadMoreOpportunities().then(({opportunitiesDicts, more}) => {
      expect(opportunitiesDicts.length).toBe(2);
      expect(more).toBe(false);
    });
  });

  it('should register Contributor Dashboard suggest event when clicking on' +
    ' suggest question button', function() {
    spyOn(ngbModal, 'open').and.returnValue(
      {
        componentInstance: MockNgbModalRef,
        result: Promise.resolve()
      } as NgbModalRef
    );
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
    spyOn(ngbModal, 'open').and.returnValue(
      {
        componentInstance: MockNgbModalRef,
        result: Promise.resolve()
      } as NgbModalRef
    );
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      $q.resolve({
        isLoggedIn: () => true
      }));
    ctrl.$onInit();
    $rootScope.$apply();

    ctrl.onClickSuggestQuestionButton('1');
    $rootScope.$apply();

    expect(ngbModal.open).toHaveBeenCalled();
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
    fakeAsync(() => {
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve({
          isLoggedIn: () => true
        }));

      ctrl.$onInit();
      tick();
      alertsService.clearWarnings();

      spyOn(questionUndoRedoService, 'clearChanges');
      var openSpy = spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve({
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
      } as NgbModalRef);

      ctrl.onClickSuggestQuestionButton('1');
      tick();

      expect(openSpy).toHaveBeenCalled();
      expect(questionUndoRedoService.clearChanges).toHaveBeenCalled();
    }));

  it('should suggest a question when dismissing create question modal',
    fakeAsync(() => {
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve({
          isLoggedIn: () => true
        }));

      ctrl.$onInit();
      tick();
      alertsService.clearWarnings();

      spyOn(questionUndoRedoService, 'clearChanges');
      var openSpy = spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve({
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
      } as NgbModalRef);

      ctrl.onClickSuggestQuestionButton('1');
      tick();

      expect(openSpy).toHaveBeenCalled();
      expect(questionUndoRedoService.clearChanges).toHaveBeenCalled();
    }));

  it('should not create a question when dismissing select skill and skill' +
    ' difficulty modal', function() {
    spyOn(ngbModal, 'open').and.returnValue(
      {
        componentInstance: MockNgbModalRef,
        result: Promise.reject()
      } as NgbModalRef
    );
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      $q.resolve({
        isLoggedIn: () => true
      }));
    ctrl.$onInit();
    $rootScope.$apply();

    ctrl.onClickSuggestQuestionButton('1');
    $rootScope.$apply();

    expect(ngbModal.open).toHaveBeenCalled();
  });
});
