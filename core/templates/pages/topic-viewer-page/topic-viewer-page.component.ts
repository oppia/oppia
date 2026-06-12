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
 * @fileoverview Component for the topic viewer.
 */

import {Component, OnInit, OnDestroy} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';

import {AppConstants} from 'app.constants';
import {ReadOnlyTopic} from 'domain/topic_viewer/read-only-topic.model';
import {StorySummary} from 'domain/story/story-summary.model';
import {Subtopic, SkillIdToDescriptionMap} from 'domain/topic/subtopic.model';
import {DegreesOfMastery} from 'domain/topic_viewer/read-only-topic.model';
import {TopicViewerBackendApiService} from 'domain/topic_viewer/topic-viewer-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AlertsService} from 'services/alerts.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {LoaderService} from 'services/loader.service';
import {PageTitleService} from 'services/page-title.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import './topic-viewer-page.component.css';

interface TopicViewerStorySectionData {
  storyId: string;
  storyTitle: string;
  storyDescription: string;
  lessonCount: number;
  practiceCount: number;
}

@Component({
  selector: 'topic-viewer-page',
  templateUrl: './topic-viewer-page.component.html',
  styleUrls: ['./topic-viewer-page.component.css'],
})
export class TopicViewerPageComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  readonly VIEW_NAMES = {
    STORY: 'story',
    PRACTICE: 'practice',
    STUDYGUIDE: 'studyguide',
  } as const;

  activeView: string = '';
  canonicalStorySummaries: StorySummary[] = [];
  canonicalStorySectionData: readonly TopicViewerStorySectionData[] = [];
  topicUrlFragment: string = '';
  classroomUrlFragment: string = '';
  classroomName: string | null = '';
  topicIsLoading: boolean = true;
  topicId: string = '';
  topicName: string = '';
  pageTitleFragment: string = '';
  topicDescription: string = '';
  chapterCount: number = 0;
  degreesOfMastery: DegreesOfMastery = {};
  subtopics: Subtopic[] = [];
  skillDescriptions: SkillIdToDescriptionMap = {};
  practiceTabIsDisplayed: boolean = false;

  constructor(
    private alertsService: AlertsService,
    private loaderService: LoaderService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private pageTitleService: PageTitleService,
    private platformFeatureService: PlatformFeatureService,
    private topicViewerBackendApiService: TopicViewerBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private windowDimensionsService: WindowDimensionsService,
    private windowRef: WindowRef,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    const pathname = this.urlService.getPathname();
    if (pathname.endsWith(this.VIEW_NAMES.STUDYGUIDE)) {
      this.activeView = this.VIEW_NAMES.STUDYGUIDE;
    } else if (pathname.endsWith(this.VIEW_NAMES.PRACTICE)) {
      if (this.isRedesignedTopicViewerPageFeatureEnabled()) {
        // In the redesigned UI, practice is part of the story view.
        this.activeView = this.VIEW_NAMES.STORY;
      } else {
        this.activeView = this.VIEW_NAMES.PRACTICE;
      }
    } else {
      if (!pathname.endsWith(this.VIEW_NAMES.STORY)) {
        this.updateUrlForActiveView(this.VIEW_NAMES.STORY);
      }
      this.activeView = this.VIEW_NAMES.STORY;
    }
    this.topicUrlFragment = this.urlService.getTopicUrlFragmentFromLearnerUrl();
    this.classroomUrlFragment =
      this.urlService.getClassroomUrlFragmentFromLearnerUrl();

    this.loaderService.showLoadingScreen('Loading');
    this.topicViewerBackendApiService
      .fetchTopicDataAsync(this.topicUrlFragment, this.classroomUrlFragment)
      .then(
        (readOnlyTopic: ReadOnlyTopic) => {
          this.topicId = readOnlyTopic.getTopicId();
          this.topicName = readOnlyTopic.getTopicName();
          this.topicDescription = readOnlyTopic.getTopicDescription();
          this.pageTitleFragment = readOnlyTopic.getPageTitleFragmentForWeb();
          this.classroomName = readOnlyTopic.getClassroomName();

          // The onLangChange event is initially fired before the topic is
          // loaded. Hence the first setpageTitle() call needs to made
          // manually, and the onLangChange subscription is added after
          // the topic is loaded.
          this.setPageTitle();
          this.subscribeToOnLangChange();
          this.pageTitleService.updateMetaTag(
            readOnlyTopic.getMetaTagContent()
          );
          this.canonicalStorySummaries =
            readOnlyTopic.getCanonicalStorySummaries();
          this.chapterCount = 0;
          for (let idx in this.canonicalStorySummaries) {
            this.chapterCount +=
              this.canonicalStorySummaries[idx].getNodeTitles().length;
          }
          this.degreesOfMastery = readOnlyTopic.getDegreesOfMastery();
          this.subtopics = readOnlyTopic.getSubtopics();
          this.skillDescriptions = readOnlyTopic.getSkillDescriptions();
          this.topicIsLoading = false;
          this.loaderService.hideLoadingScreen();
          this.practiceTabIsDisplayed =
            readOnlyTopic.getPracticeTabIsDisplayed();
          this.canonicalStorySectionData =
            this.getCanonicalStorySectionData(readOnlyTopic);
        },
        errorResponse => {
          let errorCodes = AppConstants.FATAL_ERROR_CODES;
          if (
            errorResponse &&
            errorCodes.indexOf(errorResponse.status) !== -1
          ) {
            this.alertsService.addWarning('Failed to get dashboard data');
          }
        }
      );
  }

  trackStoryDataById(
    index: number,
    storyData: TopicViewerStorySectionData
  ): string {
    return storyData.storyId;
  }

  private getCanonicalStorySectionData(
    readOnlyTopic: ReadOnlyTopic
  ): readonly TopicViewerStorySectionData[] {
    const practiceCount = readOnlyTopic.getSubtopics().filter(subtopic => {
      return subtopic.getSkillSummaries().length > 0;
    }).length;
    return readOnlyTopic.getCanonicalStorySummaries().map(storySummary => {
      return {
        storyId: storySummary.getId(),
        storyTitle: storySummary.getTitle(),
        storyDescription: storySummary.getDescription() || '',
        lessonCount: storySummary.getNodeTitles().length,
        practiceCount,
      };
    });
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
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
      'I18N_TOPIC_VIEWER_PAGE_TITLE',
      {
        topicName: this.topicName,
        pageTitleFragment: this.pageTitleFragment,
      }
    );
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  checkMobileView(): boolean {
    return this.windowDimensionsService.getWidth() < 500;
  }

  checkTabletView(): boolean {
    return this.windowDimensionsService.getWidth() < 768;
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  setActiveView(newViewName: string): void {
    if (newViewName === this.VIEW_NAMES.STORY) {
      this.updateUrlForActiveView(this.VIEW_NAMES.STORY);
      this.activeView = this.VIEW_NAMES.STORY;
      return;
    }

    if (newViewName === this.VIEW_NAMES.PRACTICE) {
      if (this.isRedesignedTopicViewerPageFeatureEnabled()) {
        this.updateUrlForActiveView(this.VIEW_NAMES.STORY);
        this.activeView = this.VIEW_NAMES.STORY;
        return;
      }
      this.updateUrlForActiveView(this.VIEW_NAMES.PRACTICE);
      this.activeView = this.VIEW_NAMES.PRACTICE;
      return;
    }

    this.updateUrlForActiveView(this.VIEW_NAMES.STUDYGUIDE);
    this.activeView = this.VIEW_NAMES.STUDYGUIDE;
  }

  updateUrlForActiveView(newViewName: string): void {
    let getCurrentLocation = this.windowRef.nativeWindow.location.toString();
    if (this.activeView === '') {
      this.windowRef.nativeWindow.history.pushState(
        {},
        '',
        getCurrentLocation + '/' + newViewName
      );
    } else if (this.activeView === this.VIEW_NAMES.STUDYGUIDE) {
      this.windowRef.nativeWindow.history.pushState(
        {},
        '',
        getCurrentLocation.replace(this.VIEW_NAMES.STUDYGUIDE, newViewName)
      );
    } else {
      this.windowRef.nativeWindow.history.pushState(
        {},
        '',
        getCurrentLocation.replace(this.activeView, newViewName)
      );
    }
  }

  isPracticeTabEnabled(): boolean {
    return this.practiceTabIsDisplayed;
  }

  isRedesignedTopicViewerPageFeatureEnabled(): boolean {
    return this.platformFeatureService.status.RedesignedTopicViewerPage
      .isEnabled;
  }
}
