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

import {Component, Input, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {LearnerGroupBackendApiService} from 'domain/learner_group/learner-group-backend-api.service';
import {LearnerGroupUserInfo} from 'domain/learner_group/learner-group-user-info.model';
import {LearnerGroupData} from 'domain/learner_group/learner-group.model';
import {WindowRef} from 'services/contextual/window-ref.service';
import {LoaderService} from 'services/loader.service';
import {UserService} from 'services/user.service';
import {LearnerGroupPagesConstants} from '../learner-group-pages.constants';
import {DeleteLearnerGroupModalComponent} from '../templates/delete-learner-group-modal.component';
import {InviteLearnersModalComponent} from '../templates/invite-learners-modal.component';
import {InviteSuccessfulModalComponent} from '../templates/invite-successful-modal.component';
import {RemoveItemModalComponent} from '../templates/remove-item-modal.component';

import './learner-group-preferences.component.css';

@Component({
  selector: 'oppia-learner-group-preferences',
  templateUrl: './learner-group-preferences.component.html',
  styleUrls: ['./learner-group-preferences.component.css'],
})
export class LearnerGroupPreferencesComponent implements OnInit {
  @Input() learnerGroup!: LearnerGroupData;
  activeTab!: string;
  newLearnerGroupTitle!: string;
  newLearnerGroupDescription!: string;
  readOnlyMode = true;
  invitedLearnersInfo!: LearnerGroupUserInfo[];
  currentLearnersInfo!: LearnerGroupUserInfo[];
  invitedLearners: string[] = [];
  EDIT_PREFERENCES_SECTIONS_I18N_IDS =
    LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_PREFERENCES_SECTIONS;

  constructor(
    private ngbModal: NgbModal,
    private windowRef: WindowRef,
    private loaderService: LoaderService,
    private learnerGroupBackendApiService: LearnerGroupBackendApiService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.activeTab = this.EDIT_PREFERENCES_SECTIONS_I18N_IDS.GROUP_DETAILS;
    if (this.learnerGroup) {
      this.learnerGroupBackendApiService
        .fetchLearnersInfoAsync(this.learnerGroup.id)
        .then(learnersInfo => {
          this.currentLearnersInfo = learnersInfo.learnersInfo;
          this.invitedLearnersInfo = learnersInfo.invitedLearnersInfo;
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
      this.learnerGroup.title = this.newLearnerGroupTitle
        ? this.newLearnerGroupTitle
        : this.learnerGroup.title;
      this.learnerGroup.description = this.newLearnerGroupDescription
        ? this.newLearnerGroupDescription
        : this.learnerGroup.description;
      this.learnerGroupBackendApiService
        .updateLearnerGroupAsync(this.learnerGroup)
        .then(learnerGroup => {
          this.learnerGroup = learnerGroup;
        });
    }
    this.toggleReadOnlyMode();
  }

  openInviteLearnersModal(): void {
    let modalRef = this.ngbModal.open(InviteLearnersModalComponent, {
      backdrop: 'static',
      windowClass: 'invite-learners-modal',
    });
    modalRef.componentInstance.learnerGroupId = this.learnerGroup.id;

    modalRef.result.then(
      data => {
        this.invitedLearners = data.invitedLearners;
        this.learnerGroup.inviteLearners(this.invitedLearners);
        this.learnerGroupBackendApiService
          .updateLearnerGroupAsync(this.learnerGroup)
          .then(learnerGroup => {
            this.learnerGroup = learnerGroup;
            this.invitedLearnersInfo.push(...data.invitedLearnersInfo);
          });
        let successModalRef = this.ngbModal.open(
          InviteSuccessfulModalComponent,
          {
            backdrop: 'static',
            windowClass: 'invite-successful-modal',
          }
        );
        successModalRef.componentInstance.successMessage =
          'An invitation has been sent to ';
        successModalRef.componentInstance.invitedUsernames =
          this.invitedLearners;

        successModalRef.result.then(
          () => {
            // Note to developers:
            // This callback is triggered when the Confirm button is clicked.
            // No further action is needed.
          },
          () => {
            // Note to developers:
            // This callback is triggered when the Cancel button is clicked.
            // No further action is needed.
          }
        );
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }

  openRemoveLearnerFromGroupModal(learner: LearnerGroupUserInfo): void {
    let modalRef = this.ngbModal.open(RemoveItemModalComponent, {
      backdrop: 'static',
      windowClass: 'remove-learner-modal',
    });
    modalRef.componentInstance.confirmationTitle = 'Remove Learner';
    modalRef.componentInstance.confirmationMessage =
      'Are you sure you want to remove this learner from the group?';

    modalRef.result.then(() => {
      this.learnerGroup.removeLearner(learner.username);
      this.learnerGroupBackendApiService
        .updateLearnerGroupAsync(this.learnerGroup)
        .then(learnerGroup => {
          this.learnerGroup = learnerGroup;
          this.currentLearnersInfo = this.currentLearnersInfo.filter(
            currentLearner => currentLearner.username !== learner.username
          );
        });
    });
  }

  openWithdrawLearnerInvitationModal(learner: LearnerGroupUserInfo): void {
    let modalRef = this.ngbModal.open(RemoveItemModalComponent, {
      backdrop: 'static',
      windowClass: 'withdraw-learner-invitation-modal',
    });
    modalRef.componentInstance.confirmationTitle = 'Withdraw Invitation';
    modalRef.componentInstance.confirmationMessage =
      'Are you sure you want to withdraw this invitation?';

    modalRef.result.then(() => {
      this.learnerGroup.revokeInvitation(learner.username);
      this.invitedLearnersInfo = this.invitedLearnersInfo.filter(
        invitedLearner => invitedLearner.username !== learner.username
      );
      this.learnerGroupBackendApiService
        .updateLearnerGroupAsync(this.learnerGroup)
        .then(learnerGroup => {
          this.learnerGroup = learnerGroup;
        });
    });
  }

  updateInvitedLearners(invitedLearners: string[]): void {
    this.invitedLearners = invitedLearners;
  }

  getProfileImagePngDataUrl(username: string): string {
    let [pngImageUrl, _] = this.userService.getProfileImageDataUrl(username);
    return pngImageUrl;
  }

  getProfileImageWebpDataUrl(username: string): string {
    let [_, webpImageUrl] = this.userService.getProfileImageDataUrl(username);
    return webpImageUrl;
  }

  deleteLearnerGroup(): void {
    let modalRef = this.ngbModal.open(DeleteLearnerGroupModalComponent, {
      backdrop: 'static',
      windowClass: 'delete-learner-group-modal',
    });
    modalRef.componentInstance.learnerGroupTitle = this.learnerGroup.title;

    modalRef.result.then(
      () => {
        this.loaderService.showLoadingScreen('Deleting Group');
        this.learnerGroupBackendApiService
          .deleteLearnerGroupAsync(this.learnerGroup.id)
          .then(() => {
            this.windowRef.nativeWindow.location.href =
              '/facilitator-dashboard';
          });
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }
}
