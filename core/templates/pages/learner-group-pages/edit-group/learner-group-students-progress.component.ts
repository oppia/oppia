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

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { LearnerGroupSyllabusBackendApiService } from 'domain/learner_group/learner-group-syllabus-backend-api.service';
import { LearnerGroupUserProgress } from 'domain/learner_group/learner-group-user-progress.model';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';

import './learner-group-students-progress.component.css';


@Component({
  selector: 'oppia-learner-group-students-progress',
  templateUrl: './learner-group-students-progress.component.html'
})
export class LearnerGroupStudentsProgressComponent implements OnInit {
  @Input() learnerGroup: LearnerGroupData;
  studentsProgress!: LearnerGroupUserProgress[];

  constructor(
    private learnerGroupSyllabusBackendApiService:
      LearnerGroupSyllabusBackendApiService
  ) {}

  ngOnInit(): void {
    if (this.learnerGroup.studentUsernames.length > 0) {
      this.learnerGroupSyllabusBackendApiService
        .fetchStudentsProgressInAssignedSyllabus(
          this.learnerGroup.id, this.learnerGroup.studentUsernames
        ).then(studentsProgress => {
          this.studentsProgress = studentsProgress;
        });
    }
  }

  getStudentsProgressToDisplay(): void {
    this.studentsProgress.forEach(studentProgress => {
    });
  }

  getCompletedStoriesCountByStudent(index: number): number {
    let completedStoriesCount = 0;
    const storiesProgress = this.studentsProgress[index].storiesProgress;
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

  getStrugglingSubtopicsCountOfStudent(index: number): number {
    let strugglingSubtopicsCount = 0;
    const subtopicsProgress = this.studentsProgress[index].subtopicsProgress;
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
}

angular.module('oppia').directive(
  'oppiaLearnerGroupStudentsProgress',
  downgradeComponent({component: LearnerGroupStudentsProgressComponent}));
