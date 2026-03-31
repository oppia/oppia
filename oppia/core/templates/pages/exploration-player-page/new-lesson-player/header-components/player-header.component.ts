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
import {ReadOnlyExplorationBackendApiService} from 'domain/exploration/read-only-exploration-backend-api.service';
import {ReadOnlyTopic} from 'domain/topic_viewer/read-only-topic.model';
import {TopicViewerBackendApiService} from 'domain/topic_viewer/topic-viewer-backend-api.service';
import {PageContextService} from 'services/page-context.service';
import {UrlService} from 'services/contextual/url.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {StatsReportingService} from '../../services/stats-reporting.service';
import {MobileMenuService} from '../../services/mobile-menu.service';
import './player-header.component.css';
import {Router} from '@angular/router';
import {WindowRef} from 'services/contextual/window-ref.service';
import {AccessValidationBackendApiService} from 'pages/oppia-root/routing/access-validation-backend-api.service';
import {CapitalizePipe} from 'filters/string-utility-filters/capitalize.pipe';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {StoryViewerBackendApiService} from 'domain/story_viewer/story-viewer-backend-api.service';

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
  topicName!: string;
  classroomName!: string;
  classroomUrlFragment!: string | null;
  topicUrlFragment!: string | null;
  storyUrlFragment!: string | null;
  isLinkedToTopic!: boolean;
  chapterNumber!: number;
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
    private urlService: UrlService,
    private storyViewerBackendApiService: StoryViewerBackendApiService,
    private topicViewerBackendApiService: TopicViewerBackendApiService,
    private mobileMenuService: MobileMenuService,
    private router: Router,
    private windowRef: WindowRef,
    private accessValidationBackendApiService: AccessValidationBackendApiService
  ) {}

  ngOnInit(): void {
    this.setPageContext();
    if (this.explorationContext === PageContextConstants.EXPLORATION_PAGE) {
      this.pageIsIframed = this.urlService.isIframed();
      this.explorationId = this.pageContextService.getExplorationId();
      this.readOnlyExplorationBackendApiService
        .fetchExplorationAsync(
          this.explorationId,
          this.urlService.getExplorationVersionFromUrl(),
          this.urlService.getPidFromUrl()
        )
        .then(response => {
          this.explorationTitle = response.exploration.title;
        });
    } else if (
      this.explorationContext === PageContextConstants.DIAGNOSTIC_PAGE
    ) {
      this.classroomUrlFragment = this.urlService.getUrlParams().classroom;
      if (this.classroomUrlFragment !== null) {
        const classroomUrlFragment: string = this.classroomUrlFragment;
        this.accessValidationBackendApiService
          .validateAccessToClassroomPage(classroomUrlFragment)
          .then(() => {
            this.classroomBackendApiService
              .fetchClassroomDataAsync(classroomUrlFragment)
              .then(classroomData => {
                this.classroomName = this.capitalizePipe.transform(
                  classroomData.getName()
                );
              });
          });
      } else {
        throw new Error('Classroom URL fragment is null');
      }
    }

    this.explorationTitle = 'Loading...';
    this.topicName = 'Loading...';
    this.classroomName = 'Loading...';

    this.isLinkedToTopic = this.getTopicUrl();
    if (
      this.isLinkedToTopic ||
      this.explorationContext === PageContextConstants.PRACTICE_PAGE
    ) {
      this.topicUrlFragment =
        this.urlService.getTopicUrlFragmentFromLearnerUrl();
      this.classroomUrlFragment =
        this.urlService.getClassroomUrlFragmentFromLearnerUrl();

      this.topicViewerBackendApiService
        .fetchTopicDataAsync(this.topicUrlFragment, this.classroomUrlFragment)
        .then((readOnlyTopic: ReadOnlyTopic) => {
          this.topicName = readOnlyTopic.getTopicName();
          this.statsReportingService.setTopicName(this.topicName);
          this.siteAnalyticsService.registerCuratedLessonStarted(
            this.topicName,
            this.explorationId
          );
        });

      if (this.isLinkedToTopic) {
        this.storyUrlFragment =
          this.urlService.getStoryUrlFragmentFromLearnerUrl();

        if (this.storyUrlFragment === null) {
          throw new Error('Story URL fragment is null');
        }

        this.storyViewerBackendApiService
          .fetchStoryDataAsync(
            this.topicUrlFragment,
            this.classroomUrlFragment,
            this.storyUrlFragment
          )
          .then(storyDataObject => {
            const storyNodes = storyDataObject.getStoryNodes();
            for (let i = 0; i < storyNodes.length; i++) {
              if (storyNodes[i].getExplorationId() === this.explorationId) {
                this.chapterNumber = i + 1;
              }
            }
          });
      }
    } else {
      this.siteAnalyticsService.registerCommunityLessonStarted(
        this.explorationId
      );
    }
  }

  getHeaderTitleText(): string {
    const context = this.explorationContext;
    const constants = this.explorationContextConstants;

    if (context === constants.PRACTICE_PAGE) {
      return `Practice Session: ${this.topicName}`;
    }

    if (context === constants.DIAGNOSTIC_PAGE) {
      return `Diagnostic Test: ${this.classroomName}`;
    }

    if (context === constants.EXPLORATION_PAGE) {
      if (this.isLinkedToTopic) {
        return `Chapter ${this.chapterNumber}: ${this.explorationTitle}`;
      } else {
        return this.explorationTitle;
      }
    }

    return '';
  }

  // Returns null if the topic is not linked to the learner's current
  // exploration.
  getTopicUrl(): boolean {
    try {
      this.topicUrlFragment =
        this.urlService.getTopicUrlFragmentFromLearnerUrl();
      this.classroomUrlFragment =
        this.urlService.getClassroomUrlFragmentFromLearnerUrl();
      this.storyUrlFragment =
        this.urlService.getStoryUrlFragmentFromLearnerUrl();
    } catch (e) {}

    return Boolean(
      this.topicUrlFragment &&
        this.classroomUrlFragment &&
        this.storyUrlFragment
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

  toggleMenu(): void {
    this.mobileMenuService.toggleMenuVisibility();
  }

  confirmExit(): boolean {
    return this.windowRef.nativeWindow.confirm(
      'If you exit, your progress will be lost. Do you still want to exit?'
    );
  }

  closePlayer(): void {
    const pathnameArray = this.urlService.getPathname().split('/');
    const confirmed = this.confirmExit();
    if (this.explorationContext === PageContextConstants.EXPLORATION_PAGE) {
      if (this.isLinkedToTopic) {
        if (confirmed) {
          this.router.navigate([
            'learn',
            this.classroomUrlFragment,
            this.topicUrlFragment,
            'story',
            this.storyUrlFragment,
          ]);
        }
      } else {
        if (confirmed) {
          this.router.navigate(['community-library']);
        }
      }
    } else if (this.explorationContext === PageContextConstants.PRACTICE_PAGE) {
      const targetPath = pathnameArray.slice(1, 4);
      if (confirmed) {
        this.router.navigate(targetPath);
      }
    } else if (
      this.explorationContext === PageContextConstants.DIAGNOSTIC_PAGE
    ) {
      if (confirmed) {
        this.router.navigate(['learn', this.classroomUrlFragment]);
      }
    }
  }
}
