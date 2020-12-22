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
 * @fileoverview Unit tests for translationOpportunities.
 */

import { TestBed } from '@angular/core/testing';
import { ContributionOpportunitiesBackendApiService } from
  // eslint-disable-next-line max-len
  'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ExplorationOpportunitySummary } from 'domain/opportunity/exploration-opportunity-summary.model';
import { UserService } from 'services/user.service.ts';
import { importAllAngularServices } from 'tests/unit-test-utils';

describe('Translation opportunities component', function() {
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var $uibModal = null;
  var contributionOpportunitiesService = null;
  var siteAnalyticsService = null;
  var translationLanguageService = null;
  var userService = null;

  var opportunitiesArray = [];

  importAllAngularServices();

  beforeEach(function() {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    siteAnalyticsService = TestBed.get(SiteAnalyticsService);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'ContributionOpportunitiesBackendApiService',
      TestBed.get(ContributionOpportunitiesBackendApiService));
    $provide.value('LanguageUtilService', TestBed.get(LanguageUtilService));
    $provide.value(
      'UserService', TestBed.get(UserService));
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    contributionOpportunitiesService = $injector.get(
      'ContributionOpportunitiesService');
    translationLanguageService = $injector.get('TranslationLanguageService');
    userService = $injector.get('UserService');

    spyOn(translationLanguageService, 'getActiveLanguageCode').and.returnValue(
      'en');

    opportunitiesArray = [
      ExplorationOpportunitySummary.createFromBackendDict({
        id: '1',
        topic_name: 'topic_1',
        story_title: 'Story title 1',
        chapter_title: 'Chapter title 1',
        content_count: 1,
        translation_counts: {
          en: 2
        }
      }),
      ExplorationOpportunitySummary.createFromBackendDict({
        id: '2',
        topic_name: 'topic_2',
        story_title: 'Story title 2',
        chapter_title: 'Chapter title 2',
        content_count: 2,
        translation_counts: {
          en: 4
        }
      })
    ];

    $scope = $rootScope.$new();
    ctrl = $componentController('translationOpportunities', {
      $scope: $scope,
      $uibModal: $uibModal,
    });
  }));

  it('should load translation opportunities', function() {
    spyOn(
      contributionOpportunitiesService, 'getTranslationOpportunitiesAsync').and
      .returnValue(Promise.resolve({
        opportunities: opportunitiesArray,
        more: false
      }));

    ctrl.loadOpportunities().then(({opportunitiesDicts, more}) => {
      expect(opportunitiesDicts.length).toBe(2);
      expect(more).toBe(false);
    });
  });

  it('should load more translation opportunities', function() {
    spyOn(
      contributionOpportunitiesService, 'getTranslationOpportunitiesAsync').and
      .returnValue(Promise.resolve({
        opportunities: opportunitiesArray,
        more: true
      }));
    ctrl.loadOpportunities().then(({opportunitiesDicts, more}) => {
      expect(opportunitiesDicts.length).toBe(2);
      expect(more).toBe(true);
    });

    spyOn(
      contributionOpportunitiesService,
      'getMoreTranslationOpportunitiesAsync').and.returnValue(Promise.resolve({
      opportunities: opportunitiesArray,
      more: false
    }));

    ctrl.loadMoreOpportunities().then(({opportunitiesDicts, more}) => {
      expect(opportunitiesDicts.length).toBe(2);
      expect(more).toBe(false);
    });
  });

  it('should open translation modal when clicking button', function() {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      $q.resolve({
        isLoggedIn: () => true
      }));
    spyOn(
      contributionOpportunitiesService, 'getTranslationOpportunitiesAsync').and
      .returnValue(Promise.resolve({
        opportunities: opportunitiesArray,
        more: false
      }));
    ctrl.$onInit();
    $scope.$apply();

    spyOn($uibModal, 'open').and.callThrough();
    ctrl.onClickButton('2');

    expect($uibModal.open).toHaveBeenCalled();
  });

  it('should register Contributor Dashboard suggest event when clicking button',
    function() {
      spyOn(userService, 'getUserInfoAsync').and.returnValue($q.resolve({
        isLoggedIn: () => true
      }));
      spyOn(
        contributionOpportunitiesService,
        'getTranslationOpportunitiesAsync').and.returnValue(Promise.resolve({
        opportunities: opportunitiesArray,
        more: false
      }));

      spyOn(siteAnalyticsService, 'registerContributorDashboardSuggestEvent');
      ctrl.$onInit();
      $scope.$apply();

      spyOn($uibModal, 'open').and.callThrough();
      ctrl.onClickButton('2');

      expect(siteAnalyticsService.registerContributorDashboardSuggestEvent)
        .toHaveBeenCalledWith('Translation');
    });

  it('should close translation modal when clicking save', function() {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      $q.resolve({
        isLoggedIn: () => true
      }));
    spyOn(
      contributionOpportunitiesService,
      'getTranslationOpportunitiesAsync').and.returnValue(Promise.resolve({
      opportunities: opportunitiesArray,
      more: false
    }));
    ctrl.$onInit();
    $scope.$apply();

    var modalSpy = spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve()
    });
    ctrl.onClickButton('2');
    $scope.$apply();

    expect(modalSpy).toHaveBeenCalled();
  });

  it('should dismiss translation modal when clicking cancel', function() {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      $q.resolve({
        isLoggedIn: () => true
      }));
    spyOn(
      contributionOpportunitiesService,
      'getTranslationOpportunitiesAsync').and.returnValue(Promise.resolve({
      opportunities: opportunitiesArray,
      more: true
    }));
    ctrl.$onInit();
    $scope.$apply();

    var modalSpy = spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    ctrl.onClickButton('2');
    $scope.$apply();

    expect(modalSpy).toHaveBeenCalled();
  });

  it('should not open translation modal when user is not logged', function() {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      $q.resolve({
        isLoggedIn: () => false
      }));
    spyOn(
      contributionOpportunitiesService,
      'getTranslationOpportunitiesAsync').and.returnValue(Promise.resolve({
      opportunities: opportunitiesArray,
      more: true
    }));
    ctrl.$onInit();
    $scope.$apply();

    spyOn($uibModal, 'open');
    // The callFake is to avoid conflicts when testing modal calls.
    spyOn(contributionOpportunitiesService, 'showRequiresLoginModal').and
      .callFake(() => {});
    ctrl.onClickButton('2');
    $scope.$apply();

    expect($uibModal.open).not.toHaveBeenCalled();
  });
});
