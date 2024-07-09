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

import {Component, OnInit} from '@angular/core';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {PreventPageUnloadEventService} from 'services/prevent-page-unload-event.service';
import {DiagnosticTestTopicTrackerModel} from './diagnostic-test-topic-tracker.model';
import {ClassroomData} from 'domain/classroom/classroom-data.model';
import {Subscription} from 'rxjs';
import {DiagnosticTestPlayerStatusService} from './diagnostic-test-player-status.service';
import {CreatorTopicSummary} from 'domain/topic/creator-topic-summary.model';
import {TranslateService} from '@ngx-translate/core';
import {WindowRef} from 'services/contextual/window-ref.service';
import {AppConstants} from 'app.constants';
import {Router} from '@angular/router';
import {LoaderService} from 'services/loader.service';

@Component({
  selector: 'oppia-diagnostic-test-player',
  templateUrl: './diagnostic-test-player.component.html',
})
export class DiagnosticTestPlayerComponent implements OnInit {
  OPPIA_AVATAR_IMAGE_URL: string = '';
  diagnosticTestTopicTrackerModel!: DiagnosticTestTopicTrackerModel;
  diagnosticTestIsStarted: boolean = false;
  diagnosticTestIsFinished = false;
  classroomData!: ClassroomData;
  classroomUrlFragment!: string;
  recommendedTopicSummaries: CreatorTopicSummary[] = [];
  recommendedTopicIds: string[] = [];
  progressPercentage: number = 0;
  componentSubscription = new Subscription();

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private preventPageUnloadEventService: PreventPageUnloadEventService,
    private classroomBackendApiService: ClassroomBackendApiService,
    private translateService: TranslateService,
    private diagnosticTestPlayerStatusService: DiagnosticTestPlayerStatusService,
    private windowRef: WindowRef,
    private router: Router,
    private loaderService: LoaderService
  ) {}

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

    this.OPPIA_AVATAR_IMAGE_URL =
      this.urlInterpolationService.getStaticImageUrl(
        '/avatar/oppia_avatar_100px.svg'
      );

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

    this.classroomBackendApiService
      .fetchClassroomDataAsync(this.classroomUrlFragment)
      .then(classroomData => {
        this.classroomData = classroomData;
        this.loaderService.hideLoadingScreen();
      })
      .catch(() => {
        this.router.navigate([
          `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
        ]);
      });
  }

  getProgressText(): string {
    return this.translateService.instant(
      'I18N_DIAGNOSTIC_TEST_CURRENT_PROGRESS',
      {
        progressPercentage: this.progressPercentage,
      }
    );
  }

  startDiagnosticTest(): void {
    this.diagnosticTestTopicTrackerModel = new DiagnosticTestTopicTrackerModel(
      this.classroomData.getTopicIdToPrerequisiteTopicIds()
    );
    this.diagnosticTestIsStarted = true;
  }

  getRecommendedTopicSummaries(recommendedTopicIds: string[]): void {
    this.recommendedTopicSummaries = this.classroomData
      .getTopicSummaries()
      .filter(topicSummary => {
        return recommendedTopicIds.indexOf(topicSummary.getId()) !== -1;
      });
    this.diagnosticTestIsFinished = true;
  }

  getTopicButtonText(topicName: string): string {
    return this.translateService.instant(
      'I18N_DIAGNOSTIC_TEST_RESULT_START_TOPIC',
      {
        topicName: topicName,
      }
    );
  }

  getTopicUrlFromUrlFragment(urlFragment: string): string {
    return this.urlInterpolationService.interpolateUrl(
      '/learn/math/<topicUrlFragment>',
      {
        topicUrlFragment: urlFragment,
      }
    );
  }
}
