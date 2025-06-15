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
 * @fileoverview Component for the subtopic viewer.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';

import {AppConstants} from 'app.constants';
import {SubtopicViewerBackendApiService} from 'domain/subtopic_viewer/subtopic-viewer-backend-api.service';
import {SubtopicPageContents} from 'domain/topic/subtopic-page-contents.model';
import {Subtopic} from 'domain/topic/subtopic.model';
import {TopicViewerBackendApiService} from 'domain/topic_viewer/topic-viewer-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {ContextService} from 'services/context.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {
  I18nLanguageCodeService,
  TranslationKeyType,
} from 'services/i18n-language-code.service';
import {LoaderService} from 'services/loader.service';
import {PageTitleService} from 'services/page-title.service';

import './subtopic-viewer-page.component.css';

@Component({
  selector: 'oppia-subtopic-viewer-page',
  templateUrl: './subtopic-viewer-page.component.html',
  styleUrls: ['./subtopic-viewer-page.component.css'],
})
export class SubtopicViewerPageComponent implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  topicUrlFragment!: string;
  classroomUrlFragment!: string;
  subtopicUrlFragment!: string;
  pageContents!: SubtopicPageContents;
  subtopicTitle!: string;
  subtopicTitleTranslationKey!: string;
  parentTopicTitle!: string;
  parentTopicTitleTranslationKey!: string;
  parentTopicId!: string;
  nextSubtopic!: Subtopic;
  prevSubtopic!: Subtopic;
  directiveSubscriptions = new Subscription();
  subtopicSummaryIsShown: boolean = false;

  constructor(
    private alertsService: AlertsService,
    private contextService: ContextService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private loaderService: LoaderService,
    private pageTitleService: PageTitleService,
    private subtopicViewerBackendApiService: SubtopicViewerBackendApiService,
    private topicViewerBackendApiService: TopicViewerBackendApiService,
    private urlService: UrlService,
    private windowDimensionsService: WindowDimensionsService,
    private translateService: TranslateService
  ) {}

  checkMobileView(): boolean {
    return this.windowDimensionsService.getWidth() < 500;
  }

  subscribeToOnLangChange(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_SUBTOPIC_VIEWER_PAGE_TITLE',
      {
        subtopicTitle: this.subtopicTitle,
      }
    );
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  ngOnInit(): void {
    this.topicUrlFragment = this.urlService.getTopicUrlFragmentFromLearnerUrl();
    this.classroomUrlFragment =
      this.urlService.getClassroomUrlFragmentFromLearnerUrl();
    this.subtopicUrlFragment =
      this.urlService.getSubtopicUrlFragmentFromLearnerUrl();

    this.loaderService.showLoadingScreen('Loading');
    this.subtopicViewerBackendApiService
      .fetchSubtopicDataAsync(
        this.topicUrlFragment,
        this.classroomUrlFragment,
        this.subtopicUrlFragment
      )
      .then(
        subtopicDataObject => {
          this.pageContents = subtopicDataObject.getPageContents();
          this.subtopicTitle = subtopicDataObject.getSubtopicTitle();
          this.parentTopicId = subtopicDataObject.getParentTopicId();
          this.contextService.setCustomEntityContext(
            AppConstants.ENTITY_TYPE.TOPIC,
            this.parentTopicId
          );

          // The onLangChange event is initially fired before the subtopic is
          // loaded. Hence the first setpageTitle() call needs to made
          // manually, and the onLangChange subscription is added after
          // the subtopic is loaded.
          this.setPageTitle();
          this.subscribeToOnLangChange();
          this.pageTitleService.updateMetaTag(
            `Review the skill of ${this.subtopicTitle.toLowerCase()}.`
          );

          let nextSubtopic = subtopicDataObject.getNextSubtopic();
          let prevSubtopic = subtopicDataObject.getPrevSubtopic();
          if (nextSubtopic) {
            this.nextSubtopic = nextSubtopic;
            this.subtopicSummaryIsShown = true;
          }
          if (prevSubtopic) {
            this.prevSubtopic = prevSubtopic;
            this.subtopicSummaryIsShown = true;
          }

          this.subtopicTitleTranslationKey =
            this.i18nLanguageCodeService.getSubtopicTranslationKey(
              this.parentTopicId,
              this.subtopicUrlFragment,
              TranslationKeyType.TITLE
            );

          this.topicViewerBackendApiService
            .fetchTopicDataAsync(
              this.topicUrlFragment,
              this.classroomUrlFragment
            )
            .then(topicDataObject => {
              this.parentTopicTitle = topicDataObject.getTopicName();
              this.parentTopicTitleTranslationKey =
                this.i18nLanguageCodeService.getTopicTranslationKey(
                  topicDataObject.getTopicId(),
                  TranslationKeyType.TITLE
                );
            });

          this.loaderService.hideLoadingScreen();
        },
        errorResponse => {
          if (
            AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1
          ) {
            this.alertsService.addWarning('Failed to get subtopic data');
          }
        }
      );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
    this.contextService.removeCustomEntityContext();
  }

  isHackySubtopicTitleTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.subtopicTitleTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  isHackyTopicTitleTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.parentTopicTitleTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }
}
