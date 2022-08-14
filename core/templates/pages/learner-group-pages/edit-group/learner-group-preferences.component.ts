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
 * @fileoverview Component for the learner group preferences.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LearnerGroupBackendApiService } from 'domain/learner_group/learner-group-backend-api.service';
import { LearnerGroupUserInfo } from 'domain/learner_group/learner-group-user-info.model';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';
import { LearnerGroupPagesConstants } from '../learner-group-pages.constants';
import { InviteStudentsModalComponent } from '../templates/invite-students-modal.component';
import { InviteSuccessfullModalComponent } from '../templates/invite-successfull-modal.component';
import { RemoveItemModalComponent } from
  '../templates/remove-item-modal.component';

import './learner-group-preferences.component.css';


@Component({
  selector: 'oppia-learner-group-preferences',
  templateUrl: './learner-group-preferences.component.html'
})
export class LearnerGroupPreferencesComponent implements OnInit {
  @Input() learnerGroup!: LearnerGroupData;
  activeTab!: string;
  newLearnerGroupTitle!: string;
  newLearnerGroupDescription!: string;
  readOnlyMode = true;
  invitedStudentsInfo!: LearnerGroupUserInfo[];
  currentStudentsInfo!: LearnerGroupUserInfo[];
  invitedStudents: string[] = [];
  EDIT_PREFERENCES_SECTIONS_I18N_IDS = (
    LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_PREFERENCES_SECTIONS);

  constructor(
    private ngbModal: NgbModal,
    private learnerGroupBackendApiService:
      LearnerGroupBackendApiService
  ) {}

  ngOnInit(): void {
    this.activeTab = this.EDIT_PREFERENCES_SECTIONS_I18N_IDS.GROUP_DETAILS;
    if (this.learnerGroup) {
      this.learnerGroupBackendApiService.fetchStudentsInfoAsync(
        this.learnerGroup.id).then((studentsInfo) => {
        this.currentStudentsInfo = studentsInfo.studentsInfo;
        this.invitedStudentsInfo = studentsInfo.invitedStudentsInfo;
      });
    }
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
        this.learnerGroup = learnerGroup;
      });
    }
    this.toggleReadOnlyMode();
  }

  openInviteStudentsModal(): void {
    let modalRef = this.ngbModal.open(
      InviteStudentsModalComponent,
      {
        backdrop: 'static',
        windowClass: 'invite-students-modal'
      }
    );
    modalRef.componentInstance.learnerGroupId = this.learnerGroup.id;

    modalRef.result.then((data) => {
      this.invitedStudents = data.invitedStudents;
      this.learnerGroup.inviteStudents(this.invitedStudents);
      this.learnerGroupBackendApiService.updateLearnerGroupAsync(
        this.learnerGroup).then((learnerGroup) => {
        this.learnerGroup = learnerGroup;
        this.invitedStudentsInfo.push(...data.invitedStudentsInfo);
      });
      let successModalRef = this.ngbModal.open(
        InviteSuccessfullModalComponent,
        {
          backdrop: 'static',
          windowClass: 'invite-successfull-modal'
        }
      );
      successModalRef.componentInstance.successMessage = (
        'An invitation has been sent to ');
      successModalRef.componentInstance.invitedUsernames = (
        this.invitedStudents);

      successModalRef.result.then(() => {
        // Note to developers:
        // This callback is triggered when the Confirm button is clicked.
        // No further action is needed.
      }, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  openRemoveStudentFromGroupModal(student: LearnerGroupUserInfo): void {
    let modalRef = this.ngbModal.open(
      RemoveItemModalComponent,
      {
        backdrop: 'static',
        windowClass: 'remove-student-modal'
      }
    );
    modalRef.componentInstance.confirmationTitle = 'Remove Student';
    modalRef.componentInstance.confirmationMessage = (
      'Are you sure you want to remove this student from the group?'
    );

    modalRef.result.then(() => {
      this.learnerGroup.removeStudent(student.username);
      this.learnerGroupBackendApiService.updateLearnerGroupAsync(
        this.learnerGroup).then((learnerGroup) => {
        this.learnerGroup = learnerGroup;
        this.currentStudentsInfo = this.currentStudentsInfo.filter(
          (currentStudent) => currentStudent.username !== student.username
        );
      });
    });
  }

  openWithdrawStudentInvitationModal(student: LearnerGroupUserInfo): void {
    let modalRef = this.ngbModal.open(
      RemoveItemModalComponent,
      {
        backdrop: 'static',
        windowClass: 'withdraw-student-invitation-modal'
      }
    );
    modalRef.componentInstance.confirmationTitle = 'Withdraw Invitation';
    modalRef.componentInstance.confirmationMessage = (
      'Are you sure you want to withdraw this invitation?'
    );

    modalRef.result.then(() => {
      this.learnerGroup.revokeInvitation(student.username);
      this.invitedStudentsInfo = this.invitedStudentsInfo.filter(
        (invitedStudent) => invitedStudent.username !== student.username
      );
      this.learnerGroupBackendApiService.updateLearnerGroupAsync(
        this.learnerGroup).then((learnerGroup) => {
        this.learnerGroup = learnerGroup;
      });
    });
  }

  updateInvitedStudents(invitedStudents: string[]): void {
    this.invitedStudents = invitedStudents;
  }

  getProfileImageDataUrl(dataUrl: string): string {
    return decodeURIComponent(dataUrl);
  }

  addStudentToLearnerGroup(student: LearnerGroupUserInfo): void {
    this.learnerGroup.addStudent(student.username);
    this.learnerGroup.revokeInvitation(student.username);
    this.invitedStudentsInfo = this.invitedStudentsInfo.filter(
      (invitedStudent) => invitedStudent.username !== student.username
    );
    this.learnerGroupBackendApiService.updateLearnerGroupInviteAsync(
      this.learnerGroup.id, student.username, true, true
    ).then((learnerGroup) => {
      this.learnerGroup = learnerGroup;
      this.currentStudentsInfo.push(student);
    });
  }
}

angular.module('oppia').directive(
  'oppiaLearnerGroupPreferences',
  downgradeComponent({component: LearnerGroupPreferencesComponent}));
