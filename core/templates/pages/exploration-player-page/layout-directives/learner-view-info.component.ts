// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the learner view info section of the
 * footer.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ClassroomDomainConstants } from 'domain/classroom/classroom-domain.constants';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { StoryPlaythrough } from 'domain/story_viewer/story-playthrough.model';
import { LearnerExplorationSummaryBackendDict } from 'domain/summary/learner-exploration-summary.model';
import { ReadOnlyTopic } from 'domain/topic_viewer/read-only-topic-object.factory';
import { TopicViewerBackendApiService } from 'domain/topic_viewer/topic-viewer-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subscription } from 'rxjs';
import { ContextService } from 'services/context.service';
import { LoggerService } from 'services/contextual/logger.service';
import { UrlService } from 'services/contextual/url.service';
import { I18nLanguageCodeService, TranslationKeyType } from 'services/i18n-language-code.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { LearnerViewInfoBackendApiService } from '../services/learner-view-info-backend-api.service';
import { StatsReportingService } from '../services/stats-reporting.service';
import { InformationCardModalComponent } from '../templates/information-card-modal.component';

import './learner-view-info.component.css';


@Component({
  selector: 'oppia-learner-view-info',
  templateUrl: './learner-view-info.component.html'
})
export class LearnerViewInfoComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  explorationId!: string;
  explorationTitle!: string;
  explorationTitleTranslationKey!: string;
  storyPlaythroughObject!: StoryPlaythrough;
  topicName!: string;
  topicNameTranslationKey!: string;
  expInfo!: LearnerExplorationSummaryBackendDict;
  directiveSubscriptions: Subscription = new Subscription();
  isLinkedToTopic: boolean = false;

  constructor(
    private ngbModal: NgbModal,
    private contextService: ContextService,
    private learnerViewInfoBackendApiService: LearnerViewInfoBackendApiService,
    private loggerService: LoggerService,
    private readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService,
    private siteAnalyticsService: SiteAnalyticsService,
    private statsReportingService: StatsReportingService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private topicViewerBackendApiService: TopicViewerBackendApiService
  ) {}

  ngOnInit(): void {
    let pathnameArray = this.urlService.getPathname().split('/');
    let explorationContext = false;

    for (let i = 0; i < pathnameArray.length; i++) {
      if (pathnameArray[i] === 'explore' ||
          pathnameArray[i] === 'create' ||
          pathnameArray[i] === 'skill_editor' ||
          pathnameArray[i] === 'embed') {
        explorationContext = true;
        break;
      }
    }

    this.explorationId = explorationContext ?
      this.contextService.getExplorationId() : 'test_id';

    this.explorationTitle = 'Loading...';
    this.readOnlyExplorationBackendApiService.fetchExplorationAsync(
      this.explorationId,
      this.urlService.getExplorationVersionFromUrl(),
      this.urlService.getPidFromUrl())
      .then((response) => {
        this.explorationTitle = response.exploration.title;
      });
    this.explorationTitleTranslationKey = (
      this.i18nLanguageCodeService.getExplorationTranslationKey(
        this.explorationId,
        TranslationKeyType.TITLE
      )
    );
    // To check if the exploration is linked to the topic or not.
    this.isLinkedToTopic = this.getTopicUrl() ? true : false;
    // If linked to topic then print topic name in the lesson player.
    if (this.isLinkedToTopic) {
      let topicUrlFragment = (
        this.urlService.getTopicUrlFragmentFromLearnerUrl());
      let classroomUrlFragment = (
        this.urlService.getClassroomUrlFragmentFromLearnerUrl());
      this.topicViewerBackendApiService.fetchTopicDataAsync(
        topicUrlFragment, classroomUrlFragment).then(
        (readOnlyTopic: ReadOnlyTopic) => {
          this.topicName = readOnlyTopic.getTopicName();
          this.statsReportingService.setTopicName(this.topicName);
          this.siteAnalyticsService.registerCuratedLessonStarted(
            this.topicName, this.explorationId);
          this.topicNameTranslationKey = (
            this.i18nLanguageCodeService.getTopicTranslationKey(
              readOnlyTopic.getTopicId(),
              TranslationKeyType.TITLE
            )
          );
        }
      );
    }
  }

  getTopicUrl(): string {
    let topicUrlFragment: string;
    let classroomUrlFragment: string;

    try {
      topicUrlFragment = (
        this.urlService.getTopicUrlFragmentFromLearnerUrl());
      classroomUrlFragment = (
        this.urlService.getClassroomUrlFragmentFromLearnerUrl());
    } catch (e) {}

    return topicUrlFragment &&
      classroomUrlFragment &&
      this.urlInterpolationService.interpolateUrl(
        ClassroomDomainConstants.TOPIC_VIEWER_STORY_URL_TEMPLATE, {
          topic_url_fragment: topicUrlFragment,
          classroom_url_fragment: classroomUrlFragment,
        });
  }

  openInformationCardModal(): void {
    let modalRef = this.ngbModal.open(InformationCardModalComponent, {
      windowClass: 'oppia-modal-information-card'
    });

    modalRef.componentInstance.expInfo = this.expInfo;
    modalRef.result.then(() => {}, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  showInformationCard(): void {
    let stringifiedExpIds = JSON.stringify(
      [this.explorationId]);
    let includePrivateExplorations = JSON.stringify(true);
    if (this.expInfo) {
      this.openInformationCardModal();
    } else {
      this.learnerViewInfoBackendApiService.fetchLearnerInfoAsync(
        stringifiedExpIds,
        includePrivateExplorations
      ).then((response) => {
        this.expInfo = response.summaries[0];
        this.openInformationCardModal();
      }, () => {
        this.loggerService.error(
          'Information card failed to load for exploration ' +
          this.explorationId);
      });
    }
  }

  isHackyTopicNameTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.topicNameTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  isHackyExpTitleTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.explorationTitleTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  ngOnDestory(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaLearnerViewInfo',
  downgradeComponent({
    component: LearnerViewInfoComponent
  }) as angular.IDirectiveFactory);
