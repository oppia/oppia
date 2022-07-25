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
 * @fileoverview Component for the learner group syllabus.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { LearnerGroupBackendApiService } from 'domain/learner_group/learner-group-backend-api.service';
import { LearnerGroupSubtopicSummary } from 'domain/learner_group/learner-group-subtopic-summary.model';
import { LearnerGroupSyllabusBackendApiService } from 'domain/learner_group/learner-group-syllabus-backend-api.service';
import { LearnerGroupSyllabus } from 'domain/learner_group/learner-group-syllabus.model';
import { LearnerGroupAllStudentsInfo, LearnerGroupUserInfo } from 'domain/learner_group/learner-group-user-progress.model';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';
import { StorySummary } from 'domain/story/story-summary.model';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { LearnerGroupPagesConstants } from '../learner-group-pages.constants';
import { AddedSyllabusItemsSuccessfullyModalComponent } from '../templates/added-syllabus-items-successfully-modal.component';
import { InviteStudentsModalComponent } from '../templates/invite-students-modal.component';
import { RemoveSyllabusItemModalComponent } from 
  '../templates/remove-syllabus-item-modal.component';

import './learner-group-preferences.component.css';


@Component({
  selector: 'oppia-learner-group-preferences',
  templateUrl: './learner-group-preferences.component.html'
})
export class LearnerGroupPreferencesComponent {
  @Input() learnerGroup: LearnerGroupData;
  activeTab: string;
  EDIT_PREFERENCES_SECTIONS_I18N_IDS = (
    LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_PREFERENCES_SECTIONS
  );
  newLearnerGroupTitle!: string;
  newLearnerGroupDescription!: string;
  readOnlyMode = true;
  invitedStudentsInfo!: LearnerGroupUserInfo[];
  currentStudentsInfo: LearnerGroupUserInfo[];
  invitedStudents: string[] = [];

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private ngbModal: NgbModal,
    private learnerGroupBackendApiService:
      LearnerGroupBackendApiService,
    private learnerGroupSyllabusBackendApiService:
      LearnerGroupSyllabusBackendApiService
  ) {}

  ngOnInit() {
    this.activeTab = this.EDIT_PREFERENCES_SECTIONS_I18N_IDS.GROUP_DETAILS;
    this.learnerGroupBackendApiService.fetchStudentsInfoAsync(
      this.learnerGroup.id).then((studentsInfo) => {
      this.currentStudentsInfo = studentsInfo.students_info;
      this.invitedStudentsInfo = studentsInfo.invited_students_info;
    });
  }

  isTabActive(tabName: string): boolean {
    return this.activeTab === tabName;
  }

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
  }

  updateLearnerGroupTitle(title: string): void {
    this.newLearnerGroupTitle = title;
  }

  updateLearnerGroupDesc(description: string): void {
    this.newLearnerGroupDescription = description;
  }

  toggleReadOnlyMode(): void {
    this.readOnlyMode = !this.readOnlyMode;
  }

  isReadOnlyModeActive(): boolean {
    return this.readOnlyMode;
  }

  saveLearnerGroupInfo(): void {
    if (this.newLearnerGroupTitle || this.newLearnerGroupDescription) {
      this.learnerGroup.title = (
        this.newLearnerGroupTitle ?
        this.newLearnerGroupTitle : this.learnerGroup.title
      );
      this.learnerGroup.description = (
        this.newLearnerGroupDescription ?
        this.newLearnerGroupDescription : this.learnerGroup.description
      );
      this.learnerGroupBackendApiService.updateLearnerGroupAsync(
        this.learnerGroup).then((learnerGroup) => {
        this.learnerGroup = learnerGroup
      });
    }
    this.toggleReadOnlyMode();
  }

  openInviteStudentsModal(): void {
    const modalRef = this.ngbModal.open(
      InviteStudentsModalComponent,
      { 
        backdrop: 'static',
        windowClass: 'invite-students-modal'
      }
    );

    modalRef.result.then((data) => {
      this.invitedStudents = data.invitedStudents;
      this.learnerGroup.inviteStudents(this.invitedStudents);
      this.learnerGroupBackendApiService.updateLearnerGroupAsync(
        this.learnerGroup).then((learnerGroup) => {
        this.learnerGroup = learnerGroup;
      });
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  updateInvitedStudents(invitedStudents: string[]): void {
    this.invitedStudents = invitedStudents;
  }
}

angular.module('oppia').directive(
  'oppiaLearnerGroupPreferences',
  downgradeComponent({component: LearnerGroupPreferencesComponent}));
