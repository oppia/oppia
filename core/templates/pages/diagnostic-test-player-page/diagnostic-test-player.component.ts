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
import { DiagnosticTestModelData } from './diagnostic-test.model';


@Component({
  selector: 'oppia-diagnostic-test-player',
  templateUrl: './diagnostic-test-player.component.html'
})
export class DiagnosticTestPlayerComponent implements OnInit {
  OPPIA_AVATAR_IMAGE_URL: string = '';
  diagnosticTestModelData;
  questionPlayerConfig;
  diagnosticTestStarted = false;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private preventPageUnloadEventService: PreventPageUnloadEventService,
    private classroomBackendApiService: ClassroomBackendApiService,
    private topicsAndSkillsDashboardBackendApiService:
    TopicsAndSkillsDashboardBackendApiService
  ) {}

  ngOnInit(): void {
    this.preventPageUnloadEventService.addListener();
    this.getOppiaAvatarImageURL();
  }

  getOppiaAvatarImageURL(): void {
    this.OPPIA_AVATAR_IMAGE_URL = (
      this.urlInterpolationService.getStaticImageUrl(
        '/avatar/oppia_avatar_100px.svg'));
  }

  returnBackToClassroom(): void {
    this.windowRef.nativeWindow.location.href = '/learn/math';
  }

  startDiagnosticTest(): void {
    // fetch the math topic ID.
    const classroomId = 'IUHeUmbJtAY7';

    this.classroomBackendApiService.getClassroomDataAsync(classroomId).then(
      response => {
        this.diagnosticTestModelData = new DiagnosticTestModelData(
          response.classroomDict.topicIdToPrerequisiteTopicIds);
        this.diagnosticTestModelData.setCurrentTopicId();
        let currentTopicId = this.diagnosticTestModelData.getCurrentTopicId();
        console.log('current topic...');
        console.log(currentTopicId);

      this.topicsAndSkillsDashboardBackendApiService
        .fetchTopicIdToDiagnosticTestSkillIdsAsync([currentTopicId]).then(
          (responseDict: TopicIdToDiagnosticTestSkillIdsResponse) => {
            let diagnosticTestSkillIds = (
              responseDict.topicIdToDiagnosticTestSkillIds[currentTopicId]);
            console.log(diagnosticTestSkillIds);

            this.questionPlayerConfig = {
              resultActionButtons: [],
              skillList: diagnosticTestSkillIds,
              questionCount: 2,
              questionsSortedByDifficulty: true
            };
            this.diagnosticTestStarted = true;

            console.log(this.questionPlayerConfig);
            console.log(this.diagnosticTestStarted);
          });
      }
    );
  }

}

angular.module('oppia').directive(
  'oppiaDiagnosticTestPlayer', downgradeComponent(
    {component: DiagnosticTestPlayerComponent}));
