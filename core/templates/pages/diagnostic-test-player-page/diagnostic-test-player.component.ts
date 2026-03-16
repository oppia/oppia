// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Diagnostic test player component.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';

import {AppConstants} from 'app.constants';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {ClassroomData} from 'domain/classroom/classroom-data.model';
import {CreatorTopicSummary} from 'domain/topic/creator-topic-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AlertsService} from 'services/alerts.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {LoaderService} from 'services/loader.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {PreventPageUnloadEventService} from 'services/prevent-page-unload-event.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';

import {DiagnosticTestPlayerStatusService} from './diagnostic-test-player-status.service';
import {DiagnosticTestTopicTrackerModel} from './diagnostic-test-topic-tracker.model';

@Component({
  selector: 'oppia-diagnostic-test-player',
  templateUrl: './diagnostic-test-player.component.html',
  styleUrls: ['./diagnostic-test-player.component.css'],
})
export class DiagnosticTestPlayerComponent implements OnInit, OnDestroy {
  OPPIA_AVATAR_IMAGE_URL!: string;
  diagnosticTestTopicTrackerModel!: DiagnosticTestTopicTrackerModel;
  diagnosticTestIsStarted: boolean = false;
  diagnosticTestIsFinished: boolean = false;
  classroomData!: ClassroomData;
  classroomUrlFragment!: string;
  recommendedTopicSummaries: CreatorTopicSummary[] = [];
  recommendedTopicIds: string[] = [];
  progressPercentage: number = 0;
  readonly componentSubscription = new Subscription();
  isStartTestButtonDisabled: boolean = false;

  constructor(
    private readonly urlInterpolationService: UrlInterpolationService,
    private readonly preventPageUnloadEventService: PreventPageUnloadEventService,
    private readonly classroomBackendApiService: ClassroomBackendApiService,
    private readonly translateService: TranslateService,
    private readonly diagnosticTestPlayerStatusService: DiagnosticTestPlayerStatusService,
    private readonly windowRef: WindowRef,
    private readonly router: Router,
    private readonly platformFeatureService: PlatformFeatureService,
    private readonly loaderService: LoaderService,
    private readonly alertsService: AlertsService,
    private readonly siteAnalyticsService: SiteAnalyticsService
  ) {}

  /**
   * Initializes the component and fetches classroom data.
   */
  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');

    const searchParams = Object.fromEntries(
      new URLSearchParams(this.windowRef.nativeWindow.location.search)
    );

    if (!searchParams.hasOwnProperty('classroom')) {
      this.router.navigate([
        `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
      ]);
      return;
    }

    this.classroomUrlFragment = searchParams.classroom;

    this.preventPageUnloadEventService.addListener(() => {
      return this.diagnosticTestIsStarted && !this.diagnosticTestIsFinished;
    });

    this.componentSubscription.add(
      this.diagnosticTestPlayerStatusService.onDiagnosticTestSessionCompleted.subscribe(
        (recommendedTopicIds: string[]) => {
          this.getRecommendedTopicSummaries(recommendedTopicIds);
        }
      )
    );

    this.componentSubscription.add(
      this.diagnosticTestPlayerStatusService.onDiagnosticTestSessionProgressChange.subscribe(
        (progressPercentage: number) => {
          this.progressPercentage = progressPercentage;
          this.getProgressText();
        }
      )
    );

    this.getProgressText();

    this.OPPIA_AVATAR_IMAGE_URL =
      this.urlInterpolationService.getStaticCopyrightedImageUrl(
        '/avatar/oppia_avatar_100px.svg'
      );

    this.classroomBackendApiService
      .fetchClassroomDataAsync(this.classroomUrlFragment)
      .then(classroomData => {
        this.classroomData = classroomData;
      })
      .catch(() => {
        this.isStartTestButtonDisabled = true;
        this.alertsService.addWarning(
          'Failed to get classroom data. The URL fragment is invalid, or ' +
            'the classroom does not exist.'
        );
      })
      .finally(() => {
        this.loaderService.hideLoadingScreen();
      });
  }

  /**
   * Unsubscribes from all subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.componentSubscription.unsubscribe();
  }

  /**
   * Returns the progress text for current diagnostic test.
   * @returns The progress text.
   */
  getProgressText(): string {
    return this.translateService.instant(
      'I18N_DIAGNOSTIC_TEST_CURRENT_PROGRESS',
      {
        progressPercentage: this.progressPercentage,
      }
    );
  }

  /**
   * Starts the diagnostic test by fetching the necessary metadata.
   */
  startDiagnosticTest(): void {
    this.classroomBackendApiService
      .getClassroomDataAsync(this.classroomData.getClassroomId())
      .then(response => {
        this.diagnosticTestTopicTrackerModel =
          new DiagnosticTestTopicTrackerModel(
            response.classroomDict.topicIdToPrerequisiteTopicIds
          );
        this.diagnosticTestIsStarted = true;
        this.siteAnalyticsService.registerDiagnosticTestStartedEvent(
          this.classroomData.getName()
        );
      })
      .catch(() => {
        this.isStartTestButtonDisabled = true;
        this.alertsService.addWarning('Failed to start the test.');
      });
  }

  /**
   * Sets the recommended topic summaries based on the provided IDs.
   * @param recommendedTopicIds The IDs of the recommended topics.
   */
  getRecommendedTopicSummaries(recommendedTopicIds: string[]): void {
    if (!this.classroomData) {
      this.recommendedTopicSummaries = [];
      return;
    }
    this.recommendedTopicSummaries = this.classroomData
      .getTopicSummaries()
      .filter(topicSummary => {
        return (
          recommendedTopicIds.indexOf(topicSummary.getId()) !== -1 &&
          !!topicSummary.getUrlFragment()
        );
      });
    this.diagnosticTestIsFinished = true;

    this.siteAnalyticsService.registerDiagnosticTestCompletionEvent(
      this.classroomData.getName()
    );
  }

  /**
   * Returns the button text for the recommended topic.
   * @param topicName The name of the topic.
   * @returns The translated button text.
   */
  getTopicButtonText(topicName: string): string {
    return this.translateService.instant(
      'I18N_DIAGNOSTIC_TEST_RESULT_START_TOPIC',
      {
        topicName: topicName,
      }
    );
  }

  /**
   * Returns the topic URL from the provided URL fragment.
   * @param urlFragment The URL fragment of the topic.
   * @returns The interpolated topic URL.
   */
  getTopicUrlFromUrlFragment(urlFragment: string | null): string {
    if (!urlFragment || !this.classroomUrlFragment) {
      return '';
    }
    return this.urlInterpolationService.interpolateUrl(
      `/learn/${this.classroomUrlFragment}/<topicUrlFragment>`,
      {
        topicUrlFragment: urlFragment,
      }
    );
  }

  /**
   * Registers a site analytics event for recommended topic acceptance.
   * @param topicName The name of the topic.
   */
  getRecommendationAcceptanceEvent(topicName: string): void {
    if (this.classroomData) {
      const topicSummary = this.recommendedTopicSummaries.find(
        summary => summary.getName() === topicName
      );
      if (topicSummary) {
        const topicId = topicSummary.getId();
        this.siteAnalyticsService.registerDiagnosticTestRecommendationAcceptedEvent(
          this.classroomData.getName(),
          topicId
        );
      }
    }
  }

  /**
   * Returns whether the new lesson player is enabled.
   * @returns Whether the feature flag is enabled.
   */
  isNewLessonPlayerEnabled(): boolean {
    return this.platformFeatureService.status.NewLessonPlayer.isEnabled;
  }
}
