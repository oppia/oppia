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
 * @fileoverview Component for the learner group all learners progress.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ChapterProgressSummary } from 'domain/exploration/chapter-progress-summary.model';
import { LearnerGroupSyllabusBackendApiService } from 'domain/learner_group/learner-group-syllabus-backend-api.service';
import { LearnerGroupUserProgress } from 'domain/learner_group/learner-group-user-progress.model';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';
import { StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
import { NavigationService } from 'services/navigation.service';

import './learner-group-learners-progress.component.css';


@Component({
  selector: 'oppia-learner-group-learners-progress',
  templateUrl: './learner-group-learners-progress.component.html'
})
export class LearnerGroupLearnersProgressComponent implements OnInit {
  @Input() learnerGroup!: LearnerGroupData;
  learnersProgress: LearnerGroupUserProgress[] = [];
  learnerSpecificProgressViewIsActive = false;
  specificLearnerProgress!: LearnerGroupUserProgress;
  searchUsernameQuery: string = '';
  matchingUsersProgress: LearnerGroupUserProgress[] = [];
  storiesChaptersProgress: ChapterProgressSummary[] = [];

  constructor(
    private learnerGroupSyllabusBackendApiService:
      LearnerGroupSyllabusBackendApiService,
    private navigationService: NavigationService,
    private storyViewerBackendApiService: StoryViewerBackendApiService
  ) {}

  ngOnInit(): void {
    if (this.learnerGroup.studentUsernames.length > 0) {
      this.learnerGroupSyllabusBackendApiService
        .fetchLearnersProgressInAssignedSyllabus(
          this.learnerGroup.id, this.learnerGroup.studentUsernames
        ).then(learnersProgress => {
          this.learnersProgress = learnersProgress;
          this.matchingUsersProgress = this.learnersProgress;
        });
    }
  }

  getCompletedStoriesCountByLearner(index: number): number {
    let completedStoriesCount = 0;
    const storiesProgress = this.matchingUsersProgress[index].storiesProgress;
    storiesProgress.forEach(storyProgress => {
      if (
        storyProgress.getCompletedNodeTitles().length ===
        storyProgress.getNodeTitles().length
      ) {
        completedStoriesCount += 1;
      }
    });
    return completedStoriesCount;
  }

  getStrugglingSubtopicsCountOfLearner(index: number): number {
    let strugglingSubtopicsCount = 0;
    const subtopicsProgress = (
      this.matchingUsersProgress[index].subtopicsProgress);
    subtopicsProgress.forEach(subtopicProgress => {
      if (subtopicProgress.subtopicMastery &&
        subtopicProgress.subtopicMastery < 0.6
      ) {
        strugglingSubtopicsCount += 1;
      }
    });
    return strugglingSubtopicsCount;
  }

  getProfileImageDataUrl(dataUrl: string): string {
    return decodeURIComponent(dataUrl);
  }

  activateLearnerSpecificView(
      learnerProgress: LearnerGroupUserProgress
  ): void {
    this.learnerSpecificProgressViewIsActive = true;
    this.specificLearnerProgress = learnerProgress;
  }

  isLearnerSpecificViewActive(): boolean {
    return this.learnerSpecificProgressViewIsActive;
  }

  disableLearnerSpecificView(): void {
    this.learnerSpecificProgressViewIsActive = false;
  }

  updateLearnerSpecificProgress(
      learnerProgress: LearnerGroupUserProgress
  ): void {
    this.specificLearnerProgress = learnerProgress;
    let syllabusStoryIds: string[] = [];
    learnerProgress.storiesProgress.forEach(storyProgress => {
      syllabusStoryIds.push(storyProgress.getId());
    });

    this.storyViewerBackendApiService.fetchProgressInStoriesChapters(
      learnerProgress.username, syllabusStoryIds
    ).then(storiesChaptersProgress => {
      this.storiesChaptersProgress = storiesChaptersProgress;
    });
  }

  getSearchUsernameResults(): LearnerGroupUserProgress[] {
    if (this.searchUsernameQuery === '') {
      this.matchingUsersProgress = this.learnersProgress;
    }
    this.matchingUsersProgress = this.learnersProgress.filter(
      learnerProgress => learnerProgress.username.toLowerCase().includes(
        this.searchUsernameQuery.toLocaleLowerCase())
    );
    return this.matchingUsersProgress;
  }

  /**
   * Opens the submenu.
   * @param {KeyboardEvent} evt
   * @param {String} menuName - name of menu, on which
   * open/close action to be performed (category,language).
   */
  openSubmenu(evt: KeyboardEvent, menuName: string): void {
    this.navigationService.openSubmenu(evt, menuName);
  }
}

angular.module('oppia').directive(
  'oppiaLearnerGroupLearnersProgress',
  downgradeComponent({component: LearnerGroupLearnersProgressComponent}));
