// Copyright 2018 The Oppia Authors. All Rights Reserved.
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

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { LearnerGroupSyllabusBackendApiService } from 'domain/learner_group/learner-group-syllabus-backend-api.service';
import { LearnerGroupUserProgress } from 'domain/learner_group/learner-group-user-progress.model';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';

import './learner-group-overview.component.css';


@Component({
  selector: 'oppia-learner-group-overview',
  templateUrl: './learner-group-overview.component.html'
})
export class LearnerGroupOverviewComponent {
  @Input() learnerGroup: LearnerGroupData;
  studentsProgress!: LearnerGroupUserProgress[];

  constructor(
    private learnerGroupSyllabusBackendApiService:
      LearnerGroupSyllabusBackendApiService
  ) {}

  ngOnInit() {
    if (this.learnerGroup.studentUsernames.length > 0) {
      this.learnerGroupSyllabusBackendApiService
      .fetchStudentsProgressInAssignedSyllabus(
        this.learnerGroup.id).then(studentsProgress => {
        this.studentsProgress = studentsProgress;
      });
    }
  }
}

angular.module('oppia').directive(
  'oppiaLearnerGroupOverview',
  downgradeComponent({component: LearnerGroupOverviewComponent}));
