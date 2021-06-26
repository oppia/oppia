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
 * @fileoverview Unit tests for voiceoverOpportunities.
 */

import { TestBed } from '@angular/core/testing';
import { ContributionOpportunitiesBackendApiService } from
  // eslint-disable-next-line max-len
  'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter } from '@angular/core';
import { ExplorationOpportunitySummary } from 'domain/opportunity/exploration-opportunity-summary.model';
import { importAllAngularServices } from 'tests/unit-test-utils';

describe('Voiceover opportunities component', function() {
  var ctrl = null;
  var $rootScope = null;
  var $scope = null;
  var contributionOpportunitiesService = null;
  var translationLanguageService = null;

  var activeLanguageChangedEmitter = new EventEmitter();

  importAllAngularServices();

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'ContributionOpportunitiesBackendApiService',
      TestBed.get(ContributionOpportunitiesBackendApiService));
    $provide.value('LanguageUtilService', TestBed.get(LanguageUtilService));
  }));

  beforeEach(function() {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
    });
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    contributionOpportunitiesService = $injector.get(
      'ContributionOpportunitiesService');
    translationLanguageService = $injector.get('TranslationLanguageService');

    spyOnProperty(translationLanguageService, 'onActiveLanguageChanged').and
      .returnValue(activeLanguageChangedEmitter);
    spyOn(
      contributionOpportunitiesService, 'getVoiceoverOpportunitiesAsync').and
      .callFake((languageCode, callback) => callback([
        ExplorationOpportunitySummary.createFromBackendDict({
          id: '1',
          topic_name: 'topic_1',
          story_title: 'Story title 1',
          chapter_title: 'Chapter title 1',
          content_count: 2,
          translation_counts: {
            en: 1
          }
        }),
        ExplorationOpportunitySummary.createFromBackendDict({
          id: '2',
          topic_name: 'topic_2',
          story_title: 'Story title 2',
          chapter_title: 'Chapter title 2',
          content_count: 4,
          translation_counts: {
            en: 2
          }
        }),
      ], true));
    spyOn(
      contributionOpportunitiesService, 'getMoreVoiceoverOpportunitiesAsync')
      .and.callFake((languageCode, callback) => callback([
        ExplorationOpportunitySummary.createFromBackendDict({
          id: '3',
          topic_name: 'topic_3',
          story_title: 'Story title 3',
          chapter_title: 'Chapter title 3',
          content_count: 3,
          translation_counts: {
            en: 3
          }
        }),
      ], true));

    $scope = $rootScope.$new();
    ctrl = $componentController('voiceoverOpportunities', {
      $scope: $scope,
    });
    ctrl.$onInit();
  }));

  afterEach(function() {
    ctrl.$onDestroy();
  });

  it('should initialize controller properties after its initialization',
    function() {
      expect(ctrl.opportunities.length).toBe(2);
      expect(ctrl.opportunitiesAreLoading).toBe(false);
      expect(ctrl.moreOpportunitiesAvailable).toBe(true);
      expect(ctrl.progressBarRequired).toBe(false);
    });

  it('should load more opportunities when opportunities are available',
    function() {
      ctrl.onLoadMoreOpportunities();
      expect(ctrl.opportunitiesAreLoading).toBe(false);
      expect(ctrl.opportunities.length).toBe(3);

      activeLanguageChangedEmitter.emit();

      expect(ctrl.opportunitiesAreLoading).toBe(false);
      expect(ctrl.opportunities.length).toBe(2);
    });

  it('should get opportunities from new language when active language is' +
    ' changed', function() {
    ctrl.onLoadMoreOpportunities();
    expect(ctrl.opportunitiesAreLoading).toBe(false);
    expect(ctrl.opportunities.length).toBe(3);

    activeLanguageChangedEmitter.emit();

    expect(ctrl.opportunitiesAreLoading).toBe(false);
    expect(ctrl.opportunities.length).toBe(2);
  });
});
