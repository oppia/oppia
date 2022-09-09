// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the review tests page.
 */

import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { Subscription } from 'rxjs';

require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');
require(
  'components/question-directives/question-player/' +
  'question-player.component.ts');
require('interactions/interactionsQuestionsRequires.ts');
require('objects/objectComponentsRequiresForPlayers.ts');
require('pages/interaction-specs.constants.ajs.ts');
require('pages/review-test-page/review-test-page.constants.ajs.ts');
require('pages/review-test-page/review-test-engine.service.ts');
require('services/alerts.service.ts');
require('services/page-title.service.ts');
require('services/contextual/url.service.ts');
require('domain/review_test/review-test-backend-api.service.ts');

angular.module('oppia').component('reviewTestPage', {
  template: require('./review-test-page.component.html'),
  controller: [
    '$translate', 'I18nLanguageCodeService', 'PageTitleService',
    'ReviewTestEngineService', 'UrlInterpolationService', 'UrlService',
    'QUESTION_PLAYER_MODE', 'REVIEW_TESTS_URL', 'STORY_VIEWER_PAGE',
    function(
        $translate, I18nLanguageCodeService, PageTitleService,
        ReviewTestEngineService, UrlInterpolationService, UrlService,
        QUESTION_PLAYER_MODE, REVIEW_TESTS_URL, STORY_VIEWER_PAGE
    ) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      ctrl.setPageTitle = function() {
        $translate.use(I18nLanguageCodeService.getCurrentI18nLanguageCode())
          .then(() => {
            const translatedTitle = $translate.instant(
              'I18N_REVIEW_TEST_PAGE_TITLE', {
                storyName: ctrl.storyName
              }
            );
            PageTitleService.setDocumentTitle(translatedTitle);
          });
      };
      ctrl.subscribeToOnLanguageCodeChange = function() {
        ctrl.directiveSubscriptions.add(
          I18nLanguageCodeService.onI18nLanguageCodeChange.subscribe(() => {
            ctrl.setPageTitle();
          })
        );
      };
      ctrl.reviewTestBackendApiService = (
        OppiaAngularRootComponent.reviewTestBackendApiService);

      var _fetchSkillDetails = function() {
        var topicUrlFragment = (
          UrlService.getTopicUrlFragmentFromLearnerUrl());
        var storyUrlFragment = (
          UrlService.getStoryUrlFragmentFromLearnerUrl());
        var classroomUrlFragment = (
          UrlService.getClassroomUrlFragmentFromLearnerUrl());
        var reviewTestsUrl = UrlInterpolationService.interpolateUrl(
          REVIEW_TESTS_URL, {
            topic_url_fragment: topicUrlFragment,
            classroom_url_fragment: classroomUrlFragment,
            story_url_fragment: storyUrlFragment
          });
        var storyViewerUrl = UrlInterpolationService.interpolateUrl(
          STORY_VIEWER_PAGE, {
            topic_url_fragment: topicUrlFragment,
            classroom_url_fragment: classroomUrlFragment,
            story_url_fragment: storyUrlFragment
          });
        ctrl.reviewTestBackendApiService.fetchReviewTestDataAsync(
          storyUrlFragment).then(
          function(result) {
            var skillIdList = [];
            var skillDescriptions = [];
            ctrl.storyName = result.storyName;
            ctrl.setPageTitle();
            ctrl.subscribeToOnLanguageCodeChange();
            for (var skillId in result.skillDescriptions) {
              skillIdList.push(skillId);
              skillDescriptions.push(
                result.skillDescriptions[skillId]);
            }
            var questionPlayerConfig = {
              resultActionButtons: [
                {
                  type: 'REVIEW_LOWEST_SCORED_SKILL',
                  i18nId: 'I18N_QUESTION_PLAYER_REVIEW_LOWEST_SCORED_SKILL'
                },
                {
                  type: 'RETRY_SESSION',
                  i18nId: 'I18N_QUESTION_PLAYER_RETRY_TEST',
                  url: reviewTestsUrl
                },
                {
                  type: 'DASHBOARD',
                  i18nId: 'I18N_QUESTION_PLAYER_RETURN_TO_STORY',
                  url: storyViewerUrl
                }
              ],
              skillList: skillIdList,
              skillDescriptions: skillDescriptions,
              questionCount: ReviewTestEngineService
                .getReviewTestQuestionCount(skillIdList.length),
              questionPlayerMode: {
                modeType: QUESTION_PLAYER_MODE.PASS_FAIL_MODE,
                passCutoff: 0.75
              },
              questionsSortedByDifficulty: true
            };
            ctrl.questionPlayerConfig = questionPlayerConfig;
          });
      };

      ctrl.$onInit = function() {
        ctrl.questionPlayerConfig = null;
        _fetchSkillDetails();
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
