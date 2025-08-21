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
import {PageContextService} from 'services/page-context.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {
  I18nLanguageCodeService,
  TranslationKeyType,
} from 'services/i18n-language-code.service';
import {LoaderService} from 'services/loader.service';
import {PageTitleService} from 'services/page-title.service';

import './subtopic-viewer-page.component.css';
import {StudyGuideSection} from 'domain/topic/study-guide-sections.model';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {TopicViewerDomainConstants} from 'domain/topic_viewer/topic-viewer-domain.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ClassroomDomainConstants} from 'domain/classroom/classroom-domain.constants';

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
  // Remove pageContents once study guides become standard.
  pageContents!: SubtopicPageContents | null;
  // Remove '| null' once study guides become standard.
  sections: StudyGuideSection[] | null;
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
    private pageContextService: PageContextService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private loaderService: LoaderService,
    private pageTitleService: PageTitleService,
    private subtopicViewerBackendApiService: SubtopicViewerBackendApiService,
    private topicViewerBackendApiService: TopicViewerBackendApiService,
    private urlService: UrlService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private windowDimensionsService: WindowDimensionsService,
    private translateService: TranslateService,
    private platformFeatureService: PlatformFeatureService
  ) {
    this.sections = null;
    this.pageContents = null;
  }

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

  isShowRestructuredStudyGuidesFeatureEnabled(): boolean {
    return this.platformFeatureService.status.ShowRestructuredStudyGuides
      .isEnabled;
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
          if (this.isShowRestructuredStudyGuidesFeatureEnabled()) {
            this.sections = subtopicDataObject.getSections();
          } else {
            this.pageContents = subtopicDataObject.getPageContents();
          }
          this.subtopicTitle = subtopicDataObject.getSubtopicTitle();
          this.parentTopicId = subtopicDataObject.getParentTopicId();
          this.pageContextService.setCustomEntityContext(
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
    this.pageContextService.removeCustomEntityContext();
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

  openStudyGuide(): void {
    // This component is being used in the topic editor as well and
    // we want to disable the linking in this case.
    const urlFragment = this.nextSubtopic.getUrlFragment();
    if (!this.classroomUrlFragment || !this.topicUrlFragment || !urlFragment) {
      return;
    }
    this.windowRef.nativeWindow.open(
      this.urlInterpolationService.interpolateUrl(
        TopicViewerDomainConstants.SUBTOPIC_VIEWER_URL_TEMPLATE,
        {
          classroom_url_fragment: this.classroomUrlFragment,
          topic_url_fragment: this.topicUrlFragment,
          subtopic_url_fragment: urlFragment,
        }
      ),
      '_self'
    );
  }

  openStudyGuideMenu(): void {
    if (!this.classroomUrlFragment || !this.topicUrlFragment) {
      return;
    }
    this.windowRef.nativeWindow.open(
      this.urlInterpolationService.interpolateUrl(
        ClassroomDomainConstants.TOPIC_VIEWER_STUDYGUIDE_URL_TEMPLATE,
        {
          classroom_url_fragment: this.classroomUrlFragment,
          topic_url_fragment: this.topicUrlFragment,
        }
      ),
      '_self'
    );
  }

  openPracticeMenu(): void {
    if (!this.classroomUrlFragment || !this.topicUrlFragment) {
      return;
    }
    this.windowRef.nativeWindow.open(
      this.urlInterpolationService.interpolateUrl(
        ClassroomDomainConstants.TOPIC_VIEWER_PRACTICE_URL_TEMPLATE,
        {
          classroom_url_fragment: this.classroomUrlFragment,
          topic_url_fragment: this.topicUrlFragment,
        }
      ),
      '_self'
    );
  }

  backToTopic(): void {
    if (!this.classroomUrlFragment || !this.topicUrlFragment) {
      return;
    }
    this.windowRef.nativeWindow.open(
      this.urlInterpolationService.interpolateUrl(
        ClassroomDomainConstants.TOPIC_VIEWER_URL_TEMPLATE,
        {
          classroom_url_fragment: this.classroomUrlFragment,
          topic_url_fragment: this.topicUrlFragment,
        }
      ),
      '_self'
    );
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  checkNextSubtopicTitleLengthAndModify(): string {
    let title: string = this.nextSubtopic.getTitle();
    if (title.length >= 20) {
      title = title.substring(0, 17) + '...';
    }
    return title;
  }
}
