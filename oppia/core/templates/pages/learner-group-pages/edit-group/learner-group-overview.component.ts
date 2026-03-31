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
 * @fileoverview Component for the learner group overview.
 */

import {Component, Input, OnInit} from '@angular/core';
import {LearnerGroupSyllabusBackendApiService} from 'domain/learner_group/learner-group-syllabus-backend-api.service';
import {LearnerGroupUserInfo} from 'domain/learner_group/learner-group-user-info.model';
import {LearnerGroupUserProgress} from 'domain/learner_group/learner-group-user-progress.model';
import {LearnerGroupData} from 'domain/learner_group/learner-group.model';
import {UserService} from 'services/user.service';
import {LearnerGroupPagesConstants} from '../learner-group-pages.constants';

import './learner-group-overview.component.css';

@Component({
  selector: 'oppia-learner-group-overview',
  templateUrl: './learner-group-overview.component.html',
  styleUrls: ['./learner-group-overview.component.css'],
})
export class LearnerGroupOverviewComponent implements OnInit {
  @Input() learnerGroup!: LearnerGroupData;
  learnersProgress!: LearnerGroupUserProgress[];
  activeTab!: string;
  EDIT_OVERVIEW_SECTIONS_I18N_IDS =
    LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_OVERVIEW_SECTIONS;

  constructor(
    private learnerGroupSyllabusBackendApiService: LearnerGroupSyllabusBackendApiService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.activeTab = this.EDIT_OVERVIEW_SECTIONS_I18N_IDS.SKILLS_ANALYSIS;
    if (this.learnerGroup && this.learnerGroup.learnerUsernames.length > 0) {
      this.learnerGroupSyllabusBackendApiService
        .fetchLearnersProgressInAssignedSyllabus(
          this.learnerGroup.id,
          this.learnerGroup.learnerUsernames
        )
        .then(learnersProgress => {
          this.learnersProgress = learnersProgress;
        });
    }
  }

  isTabActive(tabName: string): boolean {
    return this.activeTab === tabName;
  }

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
  }

  getStoryCompletionsInfo(storyId: string): LearnerGroupUserInfo[] {
    let storyCompletionsInfo: LearnerGroupUserInfo[] = [];
    this.learnersProgress.forEach(learnerProgress => {
      learnerProgress.storiesProgress.map(storyProgress => {
        if (
          storyProgress.getId() === storyId &&
          storyProgress.getCompletedNodeTitles().length ===
            storyProgress.getNodeTitles().length
        ) {
          storyCompletionsInfo.push(
            new LearnerGroupUserInfo(learnerProgress.username, '')
          );
        }
      });
    });
    return storyCompletionsInfo;
  }

  getStrugglingLearnersInfoInSubtopics(
    subtopicPageId: string
  ): LearnerGroupUserInfo[] {
    let strugglingLearnerInfo: LearnerGroupUserInfo[] = [];
    this.learnersProgress.forEach(learnerProgress => {
      learnerProgress.subtopicsProgress.map(subtopicProgress => {
        if (
          subtopicProgress.subtopicPageId === subtopicPageId &&
          subtopicProgress.subtopicMastery &&
          subtopicProgress.subtopicMastery < 0.6
        ) {
          strugglingLearnerInfo.push(
            new LearnerGroupUserInfo(learnerProgress.username, '')
          );
        }
      });
    });
    return strugglingLearnerInfo;
  }

  getProfileImagePngDataUrl(username: string): string {
    let [pngImageUrl, _] = this.userService.getProfileImageDataUrl(username);
    return pngImageUrl;
  }

  getProfileImageWebpDataUrl(username: string): string {
    let [_, webpImageUrl] = this.userService.getProfileImageDataUrl(username);
    return webpImageUrl;
  }
}
