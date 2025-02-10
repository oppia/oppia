// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the practice session.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';
import {UrlService} from 'services/contextual/url.service';
import {PracticeSessionPageConstants} from 'pages/practice-session-page/practice-session-page.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {QuestionPlayerConfig} from 'pages/exploration-player-page/learner-experience/ratings-and-recommendations.component';
import {LoaderService} from 'services/loader.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {PageTitleService} from 'services/page-title.service';
import {PracticeSessionsBackendApiService} from './practice-session-backend-api.service';

@Component({
  selector: 'practice-session-page',
  templateUrl: './practice-session-page.component.html',
})
export class PracticeSessionPageComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  topicName!: string;
  stringifiedSubtopicIds!: string;
  questionPlayerConfig!: QuestionPlayerConfig;

  constructor(
    private urlService: UrlService,
    private urlInterpolationService: UrlInterpolationService,
    private loaderService: LoaderService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private pageTitleService: PageTitleService,
    private translateService: TranslateService,
    private practiceSessionsBackendApiService: PracticeSessionsBackendApiService
  ) {}

  setPageTitle(): void {
    this.translateService.use(
      this.i18nLanguageCodeService.getCurrentI18nLanguageCode()
    );

    const translatedTitle = this.translateService.instant(
      'I18N_PRACTICE_SESSION_PAGE_TITLE',
      {
        topicName: this.topicName,
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

  _fetchSkillDetails(): void {
    const topicUrlFragment =
      this.urlService.getTopicUrlFragmentFromLearnerUrl();
    const practiceSessionsDataUrl = this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.PRACTICE_SESSIONS_DATA_URL,
      {
        topic_url_fragment: topicUrlFragment,
        classroom_url_fragment:
          this.urlService.getClassroomUrlFragmentFromLearnerUrl(),
        stringified_subtopic_ids: this.stringifiedSubtopicIds,
      }
    );
    const practiceSessionsUrl = this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.PRACTICE_SESSIONS_URL,
      {
        topic_url_fragment: topicUrlFragment,
        classroom_url_fragment:
          this.urlService.getClassroomUrlFragmentFromLearnerUrl(),
        stringified_subtopic_ids: this.stringifiedSubtopicIds,
      }
    );
    const topicViewerUrl = this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.TOPIC_VIEWER_PAGE,
      {
        topic_url_fragment: topicUrlFragment,
        classroom_url_fragment:
          this.urlService.getClassroomUrlFragmentFromLearnerUrl(),
      }
    );

    this.practiceSessionsBackendApiService
      .fetchPracticeSessionsData(practiceSessionsDataUrl)
      .then(result => {
        const skillList = [];
        const skillDescriptions = [];
        for (let skillId in result.skill_ids_to_descriptions_map) {
          skillList.push(skillId);
          skillDescriptions.push(result.skill_ids_to_descriptions_map[skillId]);
        }
        this.questionPlayerConfig = {
          resultActionButtons: [
            {
              type: 'REVIEW_LOWEST_SCORED_SKILL',
              i18nId: 'I18N_QUESTION_PLAYER_REVIEW_LOWEST_SCORED_SKILL',
            },
            {
              type: 'DASHBOARD',
              i18nId: 'I18N_QUESTION_PLAYER_MY_DASHBOARD',
              url: topicViewerUrl,
            },
            {
              type: 'RETRY_SESSION',
              i18nId: 'I18N_QUESTION_PLAYER_NEW_SESSION',
              url: practiceSessionsUrl,
            },
          ],
          skillList: skillList,
          skillDescriptions: skillDescriptions,
          questionCount: PracticeSessionPageConstants.TOTAL_QUESTIONS,
          questionsSortedByDifficulty: false,
        };
        this.topicName = result.topic_name;
        this.setPageTitle();
        this.subscribeToOnLanguageCodeChange();
        this.loaderService.hideLoadingScreen();
      });
  }

  ngOnInit(): void {
    this.topicName = this.urlService.getTopicUrlFragmentFromLearnerUrl();
    this.stringifiedSubtopicIds = this.urlService.getSelectedSubtopicsFromUrl();
    this._fetchSkillDetails();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
