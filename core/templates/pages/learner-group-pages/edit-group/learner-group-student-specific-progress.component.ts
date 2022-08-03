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

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { LearnerGroupSyllabusBackendApiService }
  from 'domain/learner_group/learner-group-syllabus-backend-api.service';
import { LearnerGroupUserProgress } from
  'domain/learner_group/learner-group-user-progress.model';
import { LearnerGroupPagesConstants } from '../learner-group-pages.constants';

import './learner-group-student-specific-progress.component.css';


@Component({
  selector: 'oppia-learner-group-student-specific-progress',
  templateUrl: './learner-group-student-specific-progress.component.html'
})
export class LearnerGroupStudentSpecificProgressComponent {
  @Input() studentProgress!: LearnerGroupUserProgress;
  activeTab: string;
  EDIT_OVERVIEW_SECTIONS_I18N_IDS = (
    LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_OVERVIEW_SECTIONS
  );

  constructor(
    private learnerGroupSyllabusBackendApiService:
      LearnerGroupSyllabusBackendApiService
  ) {}

  ngOnInit() {
    this.activeTab = this.EDIT_OVERVIEW_SECTIONS_I18N_IDS.SKILLS_ANALYSIS;
  }

  isTabActive(tabName: string): boolean {
    return this.activeTab === tabName;
  }

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
  }

  getProfileImageDataUrl(dataUrl: string): string {
    return decodeURIComponent(dataUrl);
  }
}

angular.module('oppia').directive(
  'oppiaLearnerGroupStudentSpecificProgress',
  downgradeComponent({component: LearnerGroupStudentSpecificProgressComponent}));
 