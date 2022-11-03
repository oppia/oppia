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
import { TopicsAndSkillsDashboardBackendApiService, TopicIdToDiagnosticTestSkillIdsResponse } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { PreventPageUnloadEventService } from 'services/prevent-page-unload-event.service';
import { DiagnosticTestTopicTrackerModel } from './diagnostic-test-topic-tracker.model';
import { Subscription } from 'rxjs';
import { DiagnosticTestPlayerStatusService } from './diagnostic-test-player-status.service';


@Component({
  selector: 'oppia-diagnostic-test-player',
  templateUrl: './diagnostic-test-player.component.html'
})
export class DiagnosticTestPlayerComponent implements OnInit {
  OPPIA_AVATAR_IMAGE_URL: string = '';
  diagnosticTestTopicTrackerModel: DiagnosticTestTopicTrackerModel;
  diagnosticTestStarted = false;

  componentSubscription = new Subscription();


  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private preventPageUnloadEventService: PreventPageUnloadEventService,
    private classroomBackendApiService: ClassroomBackendApiService,
    private topicsAndSkillsDashboardBackendApiService:
    TopicsAndSkillsDashboardBackendApiService,
    private diagnosticTestPlayerStatusService: DiagnosticTestPlayerStatusService
  ) {}

  ngOnInit(): void {
    this.preventPageUnloadEventService.addListener();
    this.OPPIA_AVATAR_IMAGE_URL = (
      this.urlInterpolationService.getStaticImageUrl(
        '/avatar/oppia_avatar_100px.svg'));

    this.componentSubscription.add(
      this.diagnosticTestPlayerStatusService
        .onDiagnosticTestSessionCompleted.subscribe((result) => {
        })
    );
  }
  startDiagnosticTest(): void {
    // fetch the math topic ID.
    const classroomId = 'K1HyTL5Gvqtn';

    this.classroomBackendApiService.getClassroomDataAsync(classroomId).then(
      response => {
        this.diagnosticTestTopicTrackerModel = new DiagnosticTestTopicTrackerModel(
          response.classroomDict.topicIdToPrerequisiteTopicIds);
        this.diagnosticTestStarted = true
      }
    );
  }

}

angular.module('oppia').directive(
  'oppiaDiagnosticTestPlayer', downgradeComponent(
    {component: DiagnosticTestPlayerComponent}));
