// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the miscellaneous tab in the admin panel.
 */

import { Component, EventEmitter, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { AdminBackendApiService } from 'domain/admin/admin-backend-api.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { AdminPageConstants } from '../admin-page.constants';
import { AdminTaskManagerService } from '../services/admin-task-manager.service';

@Component({
  selector: 'oppia-admin-misc-tab',
  templateUrl: './admin-misc-tab.component.html'
})
export class AdminMiscTabComponent {
  @Output() setStatusMessage: EventEmitter<string> = new EventEmitter();
  DATA_EXTRACTION_QUERY_HANDLER_URL: string = (
    '/explorationdataextractionhandler');
  irreversibleActionMessage: string = (
    'This action is irreversible. Are you sure?');
  MAX_USERNAME_LENGTH: number = AppConstants.MAX_USERNAME_LENGTH;
  regenerationMessage: string;
  showDataExtractionQueryStatus: boolean;
  dataExtractionQueryStatusMessage: string;
  oldUsername: string;
  newUsername: string;
  usernameToGrant: string;
  usernameToRevoke: string;
  userIdToGet: string;
  userIdToDelete: string;
  usernameToDelete: string;
  expVersion: number;
  stateName: string;
  numAnswers: number;
  expId: string;
  topicIdForRegeneratingOpportunities: string;

  constructor(
    private windowRef: WindowRef,
    private adminBackendApiService: AdminBackendApiService,
    private adminTaskManagerService: AdminTaskManagerService
  ) {}

  clearSearchIndex(): void {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    if (!this.windowRef.nativeWindow.confirm(this.irreversibleActionMessage)) {
      return;
    }

    this.setStatusMessage.emit('Clearing search index...');

    this.adminTaskManagerService.startTask();
    this.adminBackendApiService.clearSearchIndexAsync()
      .then(() => {
        this.setStatusMessage.emit('Index successfully cleared.');
        this.adminTaskManagerService.finishTask();
      }, errorResponse => {
        this.setStatusMessage.emit('Server error: ' + errorResponse);
        this.adminTaskManagerService.finishTask();
      });
  }

  regenerateOpportunitiesRelatedToTopic(): void {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    if (!this.windowRef.nativeWindow.confirm(this.irreversibleActionMessage)) {
      return;
    }
    this.regenerationMessage = 'Regenerating opportunities...';
    this.adminBackendApiService.regenerateOpportunitiesRelatedToTopicAsync(
      this.topicIdForRegeneratingOpportunities).then(response => {
      this.regenerationMessage = (
        'No. of opportunities model created: ' +
        response);
    }, errorResponse => {
      this.regenerationMessage = ('Server error: ' + errorResponse);
    });
  }

  uploadTopicSimilaritiesFile(): void {
    let file = (
      <HTMLInputElement>document.getElementById(
        'topicSimilaritiesFile')).files[0];
    let reader = new FileReader();
    reader.onload = (e) => {
      let data = (<FileReader>e.target).result;
      this.adminBackendApiService.uploadTopicSimilaritiesAsync(data as string)
        .then(() => {
          this.setStatusMessage.emit(
            'Topic similarities uploaded successfully.');
        }, errorResponse => {
          this.setStatusMessage.emit('Server error: ' + errorResponse);
        });
    };
    reader.readAsText(file);
  }

  downloadTopicSimilaritiesFile(): void {
    this.windowRef.nativeWindow.location.href = (
      AdminPageConstants.ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL);
  }

  setDataExtractionQueryStatusMessage(message: string): void {
    this.showDataExtractionQueryStatus = true;
    this.dataExtractionQueryStatusMessage = message;
  }

  sendDummyMailToAdmin(): void {
    this.adminBackendApiService.sendDummyMailToAdminAsync()
      .then(() => {
        this.setStatusMessage.emit('Success! Mail sent to admin.');
      }, errorResponse => {
        this.setStatusMessage.emit('Server error: ' + errorResponse);
      });
  }

  updateUsername(): void {
    this.setStatusMessage.emit('Updating username...');
    this.adminBackendApiService.updateUserNameAsync(
      this.oldUsername, this.newUsername)
      .then(() => {
        this.setStatusMessage.emit(
          'Successfully renamed ' + this.oldUsername + ' to ' +
              this.newUsername + '!');
      }, errorResponse => {
        this.setStatusMessage.emit('Server error: ' + errorResponse);
      });
  }

  getNumberOfPendingDeletionRequestModels(): void {
    this.setStatusMessage.emit(
      'Getting the number of users that are being deleted...');
    this.adminBackendApiService.getNumberOfPendingDeletionRequestAsync()
      .then(pendingDeletionRequests => {
        this.setStatusMessage.emit(
          'The number of users that are being deleted is: ' +
        pendingDeletionRequests.number_of_pending_deletion_models);
      }, errorResponse => {
        this.setStatusMessage.emit('Server error: ' + errorResponse);
      }
      );
  }

  grantSuperAdminPrivileges(): void {
    this.setStatusMessage.emit('Communicating with Firebase server...');
    this.adminBackendApiService.grantSuperAdminPrivilegesAsync(
      this.usernameToGrant
    ).then(
      () => {
        this.setStatusMessage.emit('Success!');
      }, errorResponse => {
        this.setStatusMessage.emit(
          'Server error: ' + errorResponse.error.error);
      });
  }

  revokeSuperAdminPrivileges(): void {
    this.setStatusMessage.emit('Communicating with Firebase server...');
    this.adminBackendApiService.revokeSuperAdminPrivilegesAsync(
      this.usernameToRevoke
    ).then(
      () => {
        this.setStatusMessage.emit('Success!');
      }, errorResponse => {
        this.setStatusMessage.emit(
          'Server error: ' + errorResponse.error.error);
      });
  }

  getModelsRelatedToUser(): void {
    this.setStatusMessage.emit('Getting the models related to user...');
    this.adminBackendApiService.getModelsRelatedToUserAsync(this.userIdToGet)
      .then(isModal => {
        if (isModal) {
          this.setStatusMessage.emit(
            'Some related models exist, see logs ' +
            'to find out the exact models'
          );
        } else {
          this.setStatusMessage.emit('No related models exist');
        }
      }, errorResponse => {
        this.setStatusMessage.emit(
          'Server error: ' + errorResponse);
      }
      );
  }

  deleteUser(): void {
    this.setStatusMessage.emit('Starting the deletion of the user...');
    this.adminBackendApiService.deleteUserAsync(
      this.userIdToDelete, this.usernameToDelete)
      .then(() => {
        this.setStatusMessage.emit('The deletion process was started.');
      }, errorResponse => {
        this.setStatusMessage.emit('Server error: ' + errorResponse);
      }
      );
  }

  submitQuery(): void {
    let STATUS_PENDING = (
      'Data extraction query has been submitted. Please wait.');

    this.setDataExtractionQueryStatusMessage(STATUS_PENDING);

    let downloadUrl = (this.DATA_EXTRACTION_QUERY_HANDLER_URL + '?');

    downloadUrl += 'exp_id=' + encodeURIComponent(this.expId);
    downloadUrl += '&exp_version=' + encodeURIComponent(
      this.expVersion);
    downloadUrl += '&state_name=' + encodeURIComponent(
      this.stateName);
    downloadUrl += '&num_answers=' + encodeURIComponent(
      this.numAnswers);

    this.windowRef.nativeWindow.open(downloadUrl);
  }

  resetForm(): void {
    this.expId = '';
    this.expVersion = 0;
    this.stateName = '';
    this.numAnswers = 0;
    this.showDataExtractionQueryStatus = false;
  }
}

angular.module('oppia').directive('oppiaAdminMiscTab',
  downgradeComponent({
    component: AdminMiscTabComponent
  }) as angular.IDirectiveFactory);
