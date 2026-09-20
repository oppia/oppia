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

import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';
import {UrlService} from 'services/contextual/url.service';
import {PracticeSessionPageConstants} from 'pages/practice-session-page/practice-session-page.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {QuestionPlayerConfig} from 'pages/exploration-player-page/current-lesson-player/learner-experience/ratings-and-recommendations.component';
import {LoaderService} from 'services/loader.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {PageTitleService} from 'services/page-title.service';
import {PracticeSessionsBackendApiService} from './practice-session-backend-api.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import './practice-session-page.component.css';

enum PracticeSessionType {
  Lesson = 'lesson',
  Arc = 'arc',
  Mastery = 'mastery',
  Legacy = 'legacy',
}

@Component({
  selector: 'practice-session-page',
  templateUrl: './practice-session-page.component.html',
  styleUrls: ['./practice-session-page.component.css'],
})
export class PracticeSessionPageComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  topicName!: string;
  stringifiedSubtopicIds!: string;
  questionPlayerConfig!: QuestionPlayerConfig;
  loadingMessage: string = 'Loading';
  private sessionType: PracticeSessionType = PracticeSessionType.Mastery;
  private nodeId: string = '';
  private arcId: string = '';

  constructor(
    private urlService: UrlService,
    private urlInterpolationService: UrlInterpolationService,
    private loaderService: LoaderService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private pageTitleService: PageTitleService,
    private platformFeatureService: PlatformFeatureService,
    private translateService: TranslateService,
    private cdRef: ChangeDetectorRef,
    private practiceSessionsBackendApiService: PracticeSessionsBackendApiService
  ) {}

  setPageTitle(): void {
    const translatedTitle = this.translateService.instant(
      'I18N_PRACTICE_SESSION_PAGE_TITLE',
      {topicName: this.topicName}
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

  private _getDataUrl(): string {
    const classroomUrlFragment =
      this.urlService.getClassroomUrlFragmentFromLearnerUrl();
    const topicUrlFragment =
      this.urlService.getTopicUrlFragmentFromLearnerUrl();

    switch (this.sessionType) {
      case PracticeSessionType.Lesson:
        return this.urlInterpolationService.interpolateUrl(
          PracticeSessionPageConstants.LESSON_PRACTICE_DATA_URL,
          {
            classroom_url_fragment: classroomUrlFragment,
            topic_url_fragment: topicUrlFragment,
            node_id: this.nodeId,
          }
        );
      case PracticeSessionType.Arc:
        return this.urlInterpolationService.interpolateUrl(
          PracticeSessionPageConstants.ARC_PRACTICE_DATA_URL,
          {
            classroom_url_fragment: classroomUrlFragment,
            topic_url_fragment: topicUrlFragment,
            arc_id: this.arcId,
          }
        );
      case PracticeSessionType.Legacy:
        return this.urlInterpolationService.interpolateUrl(
          PracticeSessionPageConstants.PRACTICE_SESSIONS_DATA_URL,
          {
            classroom_url_fragment: classroomUrlFragment,
            topic_url_fragment: topicUrlFragment,
            stringified_subtopic_ids: this.stringifiedSubtopicIds,
          }
        );
      default:
        return this.urlInterpolationService.interpolateUrl(
          PracticeSessionPageConstants.MASTERY_CHALLENGE_DATA_URL,
          {
            classroom_url_fragment: classroomUrlFragment,
            topic_url_fragment: topicUrlFragment,
          }
        );
    }
  }

  private _getRetryUrl(): string {
    const classroomUrlFragment =
      this.urlService.getClassroomUrlFragmentFromLearnerUrl();
    const topicUrlFragment =
      this.urlService.getTopicUrlFragmentFromLearnerUrl();

    switch (this.sessionType) {
      case PracticeSessionType.Lesson:
        return this.urlInterpolationService.interpolateUrl(
          PracticeSessionPageConstants.LESSON_PRACTICE_URL,
          {
            classroom_url_fragment: classroomUrlFragment,
            topic_url_fragment: topicUrlFragment,
            node_id: this.nodeId,
          }
        );
      case PracticeSessionType.Arc:
        return this.urlInterpolationService.interpolateUrl(
          PracticeSessionPageConstants.END_OF_ARC_URL,
          {
            classroom_url_fragment: classroomUrlFragment,
            topic_url_fragment: topicUrlFragment,
            arc_id: this.arcId,
          }
        );
      case PracticeSessionType.Legacy:
        return this.urlInterpolationService.interpolateUrl(
          PracticeSessionPageConstants.PRACTICE_SESSIONS_URL,
          {
            classroom_url_fragment: classroomUrlFragment,
            topic_url_fragment: topicUrlFragment,
            stringified_subtopic_ids: this.stringifiedSubtopicIds,
          }
        );
      default:
        return this.urlInterpolationService.interpolateUrl(
          PracticeSessionPageConstants.MASTERY_CHALLENGE_URL,
          {
            classroom_url_fragment: classroomUrlFragment,
            topic_url_fragment: topicUrlFragment,
          }
        );
    }
  }

  _fetchSkillDetails(): void {
    const topicUrlFragment =
      this.urlService.getTopicUrlFragmentFromLearnerUrl();
    const practiceSessionsDataUrl = this._getDataUrl();
    const practiceSessionsUrl = this._getRetryUrl();
    let topicViewerUrl = this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.TOPIC_VIEWER_PAGE,
      {
        topic_url_fragment: topicUrlFragment,
        classroom_url_fragment:
          this.urlService.getClassroomUrlFragmentFromLearnerUrl(),
      }
    );

    if (this.sessionType === PracticeSessionType.Arc && this.arcId) {
      topicViewerUrl = this.urlService.addField(
        topicViewerUrl,
        'arc_mastered',
        'true'
      );
      topicViewerUrl = this.urlService.addField(
        topicViewerUrl,
        'arc_id',
        this.arcId
      );
    }

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
    this.directiveSubscriptions.add(
      this.loaderService.onLoadingMessageChange.subscribe((msg: string) => {
        this.loadingMessage = msg;
        this.cdRef.detectChanges();
      })
    );

    this.topicName = this.urlService.getTopicUrlFragmentFromLearnerUrl();
    if (!this.platformFeatureService.status.StoryEditorArcs.isEnabled) {
      this.stringifiedSubtopicIds =
        this.urlService.getSelectedSubtopicsFromUrl();
    }
    this._determineSessionType();
    this._fetchSkillDetails();
  }

  private _determineSessionType(): void {
    const nodeId = this.urlService.getNodeIdFromPracticeUrl();
    const arcId = this.urlService.getArcIdFromUrl();

    if (nodeId) {
      this.sessionType = PracticeSessionType.Lesson;
      this.nodeId = nodeId;
    } else if (
      arcId &&
      this.platformFeatureService.status.StoryEditorArcs.isEnabled
    ) {
      this.sessionType = PracticeSessionType.Arc;
      this.arcId = arcId;
    } else if (this.urlService.getPathname().match(/\/mastery-challenge/)) {
      this.sessionType = PracticeSessionType.Mastery;
    } else if (this.stringifiedSubtopicIds) {
      this.sessionType = PracticeSessionType.Legacy;
    }
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  isNewLessonPlayerEnabled(): boolean {
    return this.platformFeatureService.status.NewLessonPlayer.isEnabled;
  }
}
