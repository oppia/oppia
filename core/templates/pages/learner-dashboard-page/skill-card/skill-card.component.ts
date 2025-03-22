// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for skills
 */
import {Component, Input} from '@angular/core';
import {AppConstants} from 'app.constants';
import {PracticeSessionPageConstants} from 'pages/practice-session-page/practice-session-page.constants';
import {LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';
import {Subtopic} from 'domain/topic/subtopic.model';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {LoaderService} from 'services/loader.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {WindowRef} from 'services/contextual/window-ref.service';
@Component({
  selector: 'oppia-skill-card',
  templateUrl: './skill-card.component.html',
})
export class SkillCardComponent {
  @Input() topic!: LearnerTopicSummary;
  @Input() progress!: number;
  @Input() subtopic!: Subtopic;

  imgUrl!: string;
  imgColor!: string;
  questionStatus!: boolean;

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private questionBackendApiService: QuestionBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private loaderService: LoaderService,
    private siteAnalyticsService: SiteAnalyticsService
  ) {}

  ngOnInit(): void {
    this.imgUrl = this.assetsBackendApiService.getThumbnailUrlForPreview(
      AppConstants.ENTITY_TYPE.TOPIC,
      this.topic.getId(),
      this.subtopic.getThumbnailFilename() ?? ''
    );
    this.imgColor = this.subtopic.getThumbnailBgColor() ?? '';
    this.checkQuestionsExist();
  }

  // TODO(#18384): Currently only can select one subtopic at a time, otherwise move to tab.
  checkQuestionsExist(): void {
    if (this.subtopic.getSkillIds().length > 0) {
      this.questionBackendApiService
        .fetchTotalQuestionCountForSkillIdsAsync(this.subtopic.getSkillIds())
        .then(questionCount => {
          this.questionStatus = questionCount > 0;
        });
    } else {
      this.questionStatus = false;
    }
  }

  // TODO(#18384): Currently only can select one subtopic at a time, otherwise pass array of subtopic ids.
  openNewPracticeSession(): void {
    let practiceSessionsUrl = this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.PRACTICE_SESSIONS_URL,
      {
        topic_url_fragment: this.topic.getUrlFragment(),
        classroom_url_fragment: this.topic.getClassroomUrlFragment(),
        stringified_subtopic_ids: JSON.stringify([this.subtopic.getId()]),
      }
    );
    this.siteAnalyticsService.registerPracticeSessionStartEvent(
      this.topic.getClassroomUrlFragment(),
      this.topic.getName(),
      [this.subtopic.getId()].toString()
    );
    this.windowRef.nativeWindow.location.href = practiceSessionsUrl;
    this.loaderService.showLoadingScreen('Loading');
  }

  getButtonTranslationKey(): string {
    switch (this.progress) {
      case 100:
        return 'I18N_LEARNER_DASHBOARD_CARD_BUTTON_REDO';
      case 0:
        return 'I18N_LEARNER_DASHBOARD_CARD_BUTTON_START';
      default:
        return 'I18N_LEARNER_DASHBOARD_CARD_BUTTON_RESUME';
    }
  }
}
