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

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { PreventPageUnloadEventService } from 'services/prevent-page-unload-event.service';
import { DiagnosticTestTopicTrackerModel } from './diagnostic-test-topic-tracker.model';
import { Subscription } from 'rxjs';
import { DiagnosticTestPlayerStatusService } from './diagnostic-test-player-status.service';
import { CreatorTopicSummary } from 'domain/topic/creator-topic-summary.model';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'oppia-diagnostic-test-player',
  templateUrl: './diagnostic-test-player.component.html'
})
export class DiagnosticTestPlayerComponent implements OnInit {
  OPPIA_AVATAR_IMAGE_URL: string = '';
  diagnosticTestTopicTrackerModel!: DiagnosticTestTopicTrackerModel;
  diagnosticTestIsStarted: boolean = false;
  diagnosticTestIsFinished = false;
  classroomUrlFragment: string = 'math';
  recommendedTopicSummaries: CreatorTopicSummary[] = [];
  recommendedTopicIds: string[] = [];
  progressPercentage: number = 0;
  componentSubscription = new Subscription();
  classroomId: string = '';

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private preventPageUnloadEventService: PreventPageUnloadEventService,
    private classroomBackendApiService: ClassroomBackendApiService,
    private translateService: TranslateService,
    private diagnosticTestPlayerStatusService: DiagnosticTestPlayerStatusService
  ) {}

  ngOnInit(): void {
    this.preventPageUnloadEventService.addListener(() => {
      return (this.diagnosticTestIsStarted && !this.diagnosticTestIsFinished);
    });

    this.OPPIA_AVATAR_IMAGE_URL = (
      this.urlInterpolationService.getStaticImageUrl(
        '/avatar/oppia_avatar_100px.svg'));

    this.componentSubscription.add(
      this.diagnosticTestPlayerStatusService
        .onDiagnosticTestSessionCompleted.subscribe(
          (recommendedTopicIds: string[]) => {
            this.getRecommendedTopicSummaries(recommendedTopicIds);
          }
        ));

    this.componentSubscription.add(
      this.diagnosticTestPlayerStatusService
        .onDiagnosticTestSessionProgressChange.subscribe(
          (progressPercentage: number) => {
            this.progressPercentage = progressPercentage;
            this.getProgressText();
          }
        ));

    this.getProgressText();
    this.classroomBackendApiService.getClassroomIdAsync(
      this.classroomUrlFragment).then(classroomId => {
      this.classroomId = classroomId;
    });
  }

  getProgressText(): string {
    return this.translateService.instant(
      'I18N_DIAGNOSTIC_TEST_CURRENT_PROGRESS', {
        progressPercentage: this.progressPercentage
      });
  }

  startDiagnosticTest(): void {
    this.classroomBackendApiService.getClassroomDataAsync(
      this.classroomId).then(response => {
      this.diagnosticTestTopicTrackerModel = (
        new DiagnosticTestTopicTrackerModel(
          response.classroomDict.topicIdToPrerequisiteTopicIds));
      this.diagnosticTestIsStarted = true;
    });
  }

  getRecommendedTopicSummaries(recommendedTopicIds: string[]): void {
    this.classroomBackendApiService.fetchClassroomDataAsync(
      this.classroomUrlFragment).then((classroomData) => {
      let topicSummaries: CreatorTopicSummary[] = (
        classroomData.getTopicSummaries());
      this.recommendedTopicSummaries = topicSummaries.filter(
        (topicSummary) => {
          return recommendedTopicIds.indexOf(topicSummary.getId()) !== -1;
        });
      this.diagnosticTestIsFinished = true;
    });
  }

  getTopicButtonText(topicName: string): string {
    return this.translateService.instant(
      'I18N_DIAGNOSTIC_TEST_RESULT_START_TOPIC', {
        topicName: topicName
      });
  }

  getTopicUrlFromUrlFragment(urlFragment: string): string {
    return this.urlInterpolationService.interpolateUrl(
      '/learn/math/<topicUrlFragment>', {
        topicUrlFragment: urlFragment
      });
  }
}

angular.module('oppia').directive(
  'oppiaDiagnosticTestPlayer', downgradeComponent(
    {component: DiagnosticTestPlayerComponent}));
