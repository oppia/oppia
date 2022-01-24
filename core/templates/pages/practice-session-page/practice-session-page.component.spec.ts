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
 * @fileoverview Unit tests for practice session page component.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// App.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('pages/practice-session-page/practice-session-page.component.ts');

describe('Practice session page', function() {
  var ctrl = null;
  var $httpBackend = null;
  var $scope = null;
  var CsrfTokenService = null;
  var PageTitleService = null;
  var UrlService = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $httpBackend = $injector.get('$httpBackend');
    var $q = $injector.get('$q');
    var $rootScope = $injector.get('$rootScope');
    CsrfTokenService = $injector.get('CsrfTokenService');
    PageTitleService = $injector.get('PageTitleService');
    UrlService = $injector.get('UrlService');

    spyOn(CsrfTokenService, 'getTokenAsync')
      .and.returnValue($q.resolve('sample-csrf-token'));

    $scope = $rootScope.$new();
    ctrl = $componentController('practiceSessionPage', {
      $scope: $scope
    });
  }));

  it('should load topic based on its id on url when component is initialized' +
    ' and set page title', function() {
    spyOn(UrlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'abbrev-topic');
    spyOn(UrlService, 'getSelectedSubtopicsFromUrl').and.returnValue(
      '["1","2","3","4","5"]');
    spyOn(UrlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math');
    spyOn(PageTitleService, 'setDocumentTitle').and.callThrough();

    $httpBackend.expectGET(
      '/practice_session/data/math/abbrev-topic?' +
      'selected_subtopic_ids=' + encodeURIComponent(
        '["1","2","3","4","5"]')).respond({
      skill_ids_to_descriptions_map: {
        skill_1: 'Description 1',
        skill_2: 'Description 2',
      },
      topic_name: 'Foo Topic'
    });
    ctrl.$onInit();
    $httpBackend.flush();

    expect(ctrl.topicName).toBe('Foo Topic');
    expect(ctrl.stringifiedSubtopicIds).toBe('["1","2","3","4","5"]');
    expect(ctrl.questionPlayerConfig).toEqual({
      resultActionButtons: [
        {
          type: 'REVIEW_LOWEST_SCORED_SKILL',
          i18nId: 'I18N_QUESTION_PLAYER_REVIEW_LOWEST_SCORED_SKILL'
        },
        {
          type: 'DASHBOARD',
          i18nId: 'I18N_QUESTION_PLAYER_MY_DASHBOARD',
          url: '/learn/math/abbrev-topic'
        },
        {
          type: 'RETRY_SESSION',
          i18nId: 'I18N_QUESTION_PLAYER_NEW_SESSION',
          url: '/learn/math/abbrev-topic/practice/session?' +
          'selected_subtopic_ids=' + encodeURIComponent('["1","2","3","4","5"]')
        }
      ],
      skillList: ['skill_1', 'skill_2'],
      skillDescriptions: ['Description 1', 'Description 2'],
      questionCount: 20,
      questionsSortedByDifficulty: false
    });
    expect(PageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'Practice Session: Foo Topic - Oppia');
  });
});
