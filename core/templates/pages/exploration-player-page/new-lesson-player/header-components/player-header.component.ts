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
 * @fileoverview Component for the new lesson player header
 */

import {Component} from '@angular/core';
import {ClassroomDomainConstants} from 'domain/classroom/classroom-domain.constants';
import {ReadOnlyExplorationBackendApiService} from 'domain/exploration/read-only-exploration-backend-api.service';
import {StoryPlaythrough} from 'domain/story_viewer/story-playthrough.model';
import {LearnerExplorationSummaryBackendDict} from 'domain/summary/learner-exploration-summary.model';
import {ReadOnlyTopic} from 'domain/topic_viewer/read-only-topic.model';
import {TopicViewerBackendApiService} from 'domain/topic_viewer/topic-viewer-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {Subscription} from 'rxjs';
import {PageContextService} from 'services/page-context.service';
import {UrlService} from 'services/contextual/url.service';
import {
  I18nLanguageCodeService,
  TranslationKeyType,
} from 'services/i18n-language-code.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {StatsReportingService} from '../../services/stats-reporting.service';
import {MobileMenuService} from '../../services/mobile-menu.service';

import './player-header.component.css';
import {Router} from '@angular/router';
import {WindowRef} from 'services/contextual/window-ref.service';
import {AccessValidationBackendApiService} from 'pages/oppia-root/routing/access-validation-backend-api.service';
import {CapitalizePipe} from 'filters/string-utility-filters/capitalize.pipe';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';

enum PageContextConstants {
  EXPLORATION_PAGE = 'exploration',
  DIAGNOSTIC_PAGE = 'diagnostic',
  PRACTICE_PAGE = 'practice',
}

@Component({
  selector: 'oppia-player-header',
  templateUrl: './player-header.component.html',
  styleUrls: ['./player-header.component.css'],
})
export class PlayerHeaderComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  explorationId!: string;
  explorationTitle!: string;
  explorationTitleTranslationKey!: string;
  storyPlaythroughObject!: StoryPlaythrough;
  topicName!: string;
  classroomName!: string;
  classroomUrlFragment!: string;
  topicNameTranslationKey!: string;
  isLinkedToTopic!: boolean;
  expInfo!: LearnerExplorationSummaryBackendDict;
  directiveSubscriptions: Subscription = new Subscription();
  isMobileMenuVisible = false;
  pageIsIframed: boolean = false;
  explorationContext!: PageContextConstants;
  explorationContextConstants = PageContextConstants;

  constructor(
    private pageContextService: PageContextService,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private siteAnalyticsService: SiteAnalyticsService,
    private statsReportingService: StatsReportingService,
    private classroomBackendApiService: ClassroomBackendApiService,
    private capitalizePipe: CapitalizePipe,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private topicViewerBackendApiService: TopicViewerBackendApiService,
    private mobileMenuService: MobileMenuService,
    private router: Router,
    private windowRef: WindowRef,
    private accessValidationBackendApiService: AccessValidationBackendApiService
  ) {}

  ngOnInit(): void {
    let pathnameArray = this.urlService.getPathname().split('/');
    this.setPageContext();
    if (this.explorationContext === PageContextConstants.EXPLORATION_PAGE) {
      this.pageIsIframed = this.urlService.isIframed();
      this.explorationId = this.pageContextService.getExplorationId();
    } else if (
      this.explorationContext === PageContextConstants.DIAGNOSTIC_PAGE
    ) {
      this.classroomUrlFragment = this.urlService.getUrlParams()['classroom'];
      this.accessValidationBackendApiService
        .validateAccessToClassroomPage(this.classroomUrlFragment)
        .then(() => {
          this.classroomBackendApiService
            .fetchClassroomDataAsync(this.classroomUrlFragment)
            .then(classroomData => {
              this.classroomName = this.capitalizePipe.transform(
                classroomData.getName()
              );
            });
        });
    }

    //   this.topicViewerBackendApiService
    // .fetchTopicDataAsync(this.topicUrlFragment, this.classroomUrlFragment)
    // .then(
    //   (readOnlyTopic: ReadOnlyTopic) => {
    //     this.topicId = readOnlyTopic.getTopicId();
    //     this.topicName = readOnlyTopic.getTopicName();
    //     this.topicDescription = readOnlyTopic.getTopicDescription();
    //     this.pageTitleFragment = readOnlyTopic.getPageTitleFragmentForWeb();
    //     this.classroomName = readOnlyTopic.getClassroomName();

    this.explorationTitle = 'Loading...';
    this.topicName = 'Loading...';
    // this.readOnlyExplorationBackendApiService
    //   .fetchExplorationAsync(
    //     this.explorationId,
    //     this.urlService.getExplorationVersionFromUrl(),
    //     this.urlService.getPidFromUrl()
    //   )
    //   .then(response => {
    //     this.explorationTitle = response.exploration.title;
    //   });
    // this.explorationTitleTranslationKey =
    //   this.i18nLanguageCodeService.getExplorationTranslationKey(
    //     this.explorationId,
    //     TranslationKeyType.TITLE
    //   );
    // To check if the exploration is linked to the topic or not.
    this.isLinkedToTopic = this.getTopicUrl() ? true : false;
    // If linked to topic then print topic name in the lesson player.
    if (
      this.isLinkedToTopic ||
      this.explorationContext === PageContextConstants.PRACTICE_PAGE
    ) {
      let topicUrlFragment =
        this.urlService.getTopicUrlFragmentFromLearnerUrl();
      let classroomUrlFragment =
        this.urlService.getClassroomUrlFragmentFromLearnerUrl();
      this.topicViewerBackendApiService
        .fetchTopicDataAsync(topicUrlFragment, classroomUrlFragment)
        .then((readOnlyTopic: ReadOnlyTopic) => {
          this.topicName = readOnlyTopic.getTopicName();
          this.classroomName = readOnlyTopic.getClassroomName();
          this.statsReportingService.setTopicName(this.topicName);
          this.siteAnalyticsService.registerCuratedLessonStarted(
            this.topicName,
            this.explorationId
          );
          this.topicNameTranslationKey =
            this.i18nLanguageCodeService.getTopicTranslationKey(
              readOnlyTopic.getTopicId(),
              TranslationKeyType.TITLE
            );
        });
    } else {
      this.siteAnalyticsService.registerCommunityLessonStarted(
        this.explorationId
      );
    }
  }

  // Returns null if the topic is not linked to the learner's current
  // exploration.
  getTopicUrl(): string | null {
    let topicUrlFragment: string | null = null;
    let classroomUrlFragment: string | null = null;

    try {
      topicUrlFragment = this.urlService.getTopicUrlFragmentFromLearnerUrl();
      classroomUrlFragment =
        this.urlService.getClassroomUrlFragmentFromLearnerUrl();
    } catch (e) {}

    return (
      topicUrlFragment &&
      classroomUrlFragment &&
      this.urlInterpolationService.interpolateUrl(
        ClassroomDomainConstants.TOPIC_VIEWER_STORY_URL_TEMPLATE,
        {
          topic_url_fragment: topicUrlFragment,
          classroom_url_fragment: classroomUrlFragment,
        }
      )
    );
  }

  isHackyTopicNameTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.topicNameTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  setPageContext(): void {
    if (this.pageContextService.isInDiagnosticTestPlayerPage()) {
      this.explorationContext = PageContextConstants.DIAGNOSTIC_PAGE;
    } else if (this.pageContextService.isInQuestionPlayerMode()) {
      this.explorationContext = PageContextConstants.PRACTICE_PAGE;
    } else {
      this.explorationContext = PageContextConstants.EXPLORATION_PAGE;
    }
  }

  isHackyExpTitleTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.explorationTitleTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  toggleMenu(): void {
    this.mobileMenuService.toggleMenuVisibility();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  closePlayer(): void {
    const pathnameArray = this.urlService.getPathname().split('/');
    if (this.explorationContext === PageContextConstants.EXPLORATION_PAGE) {
      console.log('Closing player and navigating to main page');
    } else if (this.explorationContext === PageContextConstants.PRACTICE_PAGE) {
      const targetPath = pathnameArray.slice(1, 4);
      const confirmed = this.windowRef.nativeWindow.confirm(
        'If you exit, your progress will be lost. Do you still want to exit?'
      );

      if (confirmed) {
        this.router.navigate(targetPath);
      }
    } else if (
      this.explorationContext === PageContextConstants.DIAGNOSTIC_PAGE
    ) {
      const confirmed = this.windowRef.nativeWindow.confirm(
        'If you exit, your progress will be lost. Do you still want to exit?'
      );

      if (confirmed) {
        this.router.navigate(['learn', this.classroomUrlFragment]);
      }
    }
  }
}
