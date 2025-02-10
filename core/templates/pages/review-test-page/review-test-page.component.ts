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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';
import {ReviewTestBackendApiService} from 'domain/review_test/review-test-backend-api.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {PageTitleService} from 'services/page-title.service';
import {QuestionPlayerConstants} from 'components/question-directives/question-player/question-player.constants';
import {ReviewTestPageConstants} from './review-test-page.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UrlService} from 'services/contextual/url.service';
import {ReviewTestEngineService} from './review-test-engine.service';
import {QuestionPlayerConfig} from 'pages/exploration-player-page/learner-experience/ratings-and-recommendations.component';

@Component({
  selector: 'review-test-page',
  templateUrl: './review-test-page.component.html',
})
export class ReviewTestPageComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  questionPlayerConfig!: QuestionPlayerConfig;
  storyName!: string;

  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private pageTitleService: PageTitleService,
    private reviewTestBackendApiService: ReviewTestBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private reviewTestEngineService: ReviewTestEngineService,
    private translateService: TranslateService
  ) {}

  _fetchSkillDetails(): void {
    const topicUrlFragment =
      this.urlService.getTopicUrlFragmentFromLearnerUrl();
    const storyUrlFragment =
      this.urlService.getStoryUrlFragmentFromLearnerUrl();
    if (storyUrlFragment === null) {
      throw new Error('Story url fragment cannot be null.');
    }
    const classroomUrlFragment =
      this.urlService.getClassroomUrlFragmentFromLearnerUrl();
    const reviewTestsUrl = this.urlInterpolationService.interpolateUrl(
      ReviewTestPageConstants.REVIEW_TESTS_URL,
      {
        topic_url_fragment: topicUrlFragment,
        classroom_url_fragment: classroomUrlFragment,
        story_url_fragment: storyUrlFragment,
      }
    );
    const storyViewerUrl = this.urlInterpolationService.interpolateUrl(
      ReviewTestPageConstants.STORY_VIEWER_PAGE,
      {
        topic_url_fragment: topicUrlFragment,
        classroom_url_fragment: classroomUrlFragment,
        story_url_fragment: storyUrlFragment,
      }
    );
    this.reviewTestBackendApiService
      .fetchReviewTestDataAsync(storyUrlFragment)
      .then(result => {
        const skillIdList = [];
        const skillDescriptions = [];
        this.storyName = result.storyName;
        this.setPageTitle();
        this.subscribeToOnLanguageCodeChange();
        for (let skillId in result.skillDescriptions) {
          skillIdList.push(skillId);
          skillDescriptions.push(result.skillDescriptions[skillId]);
        }
        this.questionPlayerConfig = {
          resultActionButtons: [
            {
              type: 'REVIEW_LOWEST_SCORED_SKILL',
              i18nId: 'I18N_QUESTION_PLAYER_REVIEW_LOWEST_SCORED_SKILL',
            },
            {
              type: 'RETRY_SESSION',
              i18nId: 'I18N_QUESTION_PLAYER_RETRY_TEST',
              url: reviewTestsUrl,
            },
            {
              type: 'DASHBOARD',
              i18nId: 'I18N_QUESTION_PLAYER_RETURN_TO_STORY',
              url: storyViewerUrl,
            },
          ],
          skillList: skillIdList,
          skillDescriptions: skillDescriptions,
          questionCount:
            this.reviewTestEngineService.getReviewTestQuestionCount(
              skillIdList.length
            ),
          questionPlayerMode: {
            modeType:
              QuestionPlayerConstants.QUESTION_PLAYER_MODE.PASS_FAIL_MODE,
            passCutoff: 0.75,
          },
          questionsSortedByDifficulty: true,
        };
      });
  }

  setPageTitle(): void {
    this.translateService.use(
      this.i18nLanguageCodeService.getCurrentI18nLanguageCode()
    );
    const translatedTitle = this.translateService.instant(
      'I18N_REVIEW_TEST_PAGE_TITLE',
      {
        storyName: this.storyName,
      }
    );
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  subscribeToOnLanguageCodeChange(): void {
    this.directiveSubscriptions.add(
      this.i18nLanguageCodeService.onI18nLanguageCodeChange.subscribe(() => {
        this.setPageTitle();
      })
    );
  }

  ngOnInit(): void {
    this._fetchSkillDetails();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
