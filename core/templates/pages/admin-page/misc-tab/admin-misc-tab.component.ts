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

import {ENTER} from '@angular/cdk/keycodes';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
  ViewChild,
  ElementRef,
} from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import {Subscription} from 'rxjs';

import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';
import {AdminBackendApiService} from 'domain/admin/admin-backend-api.service';
import {AdminDataService} from 'pages/admin-page/services/admin-data.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {AdminPageConstants} from '../admin-page.constants';
import {AdminTaskManagerService} from '../services/admin-task-manager.service';
import {DeleteUserGroupConfirmModalComponent} from '../modals/delete-user-group-confirm-modal/delete-user-group-confirm-modal.component';
import {LoaderService} from 'services/loader.service';
import {UserGroup} from 'domain/admin/user-group.model';

@Component({
  selector: 'oppia-admin-misc-tab',
  templateUrl: './admin-misc-tab.component.html',
})
export class AdminMiscTabComponent {
  @ViewChild('userInputToAddUserToGroup')
  userInputToAddUserToGroup!: ElementRef<HTMLInputElement>;
  @Output() setStatusMessage: EventEmitter<string> = new EventEmitter();
  DATA_EXTRACTION_QUERY_HANDLER_URL: string =
    '/explorationdataextractionhandler';

  irreversibleActionMessage: string =
    'This action is irreversible. Are you sure?';

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  dataExtractionQueryStatusMessage!: string;
  oldUsername!: string;
  newUsername!: string;
  usernameToGrant!: string;
  usernameToRevoke!: string;
  userIdToGet!: string;
  userIdToDelete!: string;
  usernameToDelete!: string;
  expVersion!: number;
  stateName!: string;
  numAnswers!: number;
  expId!: string;
  topicIdForRegeneratingOpportunities!: string;
  expIdToRollback!: string;
  blogPostId!: string;
  authorUsername!: string;
  publishedOn!: string;
  showDataExtractionQueryStatus: boolean = false;
  MAX_USERNAME_LENGTH: number = AppConstants.MAX_USERNAME_LENGTH;
  message: string = '';
  expIdToGetInteractionIdsFor!: string;
  explorationInteractionIds: string[] = [];
  directiveSubscriptions = new Subscription();
  loadingMessage: string = '';
  newUserGroupName: string = '';
  separatorKeysCodes: number[] = [ENTER];
  userGroupsBackup: Map<string, UserGroup>;
  userGroups: UserGroup[] = [];
  userGroupIdsToDetailsShowRecord: Record<string, boolean> = {};
  allUsersUsernames: string[] = [];
  userInUserGroupValidationError: string = '';
  userGroupValidationError: string = '';
  userGroupSaveError: string = '';
  userGroupInEditMode: boolean = false;
  oldUserGroupNameToNewUserGroupNameRecord: Record<string, string> = {};

  constructor(
    private adminBackendApiService: AdminBackendApiService,
    private adminDataService: AdminDataService,
    private adminTaskManagerService: AdminTaskManagerService,
    private cdr: ChangeDetectorRef,
    private ngbModal: NgbModal,
    private windowRef: WindowRef,
    private loaderService: LoaderService
  ) {}

  async fetchUserGroupData(): Promise<void> {
    const data = await this.adminDataService.getDataAsync();
    this.userGroups = data.userGroups;
    this.allUsersUsernames = data.allUsersUsernames;
    this.userGroupsBackup = new Map(
      this.userGroups.map(
        userGroup => [userGroup.userGroupName, cloneDeep(userGroup)])
    );
    for (let userGroup of this.userGroups) {
      this.userGroupIdsToDetailsShowRecord[userGroup.userGroupName] = false;
      this.oldUserGroupNameToNewUserGroupNameRecord[
        userGroup.userGroupName] = userGroup.userGroupName;
    }
    this.loaderService.hideLoadingScreen();
  }

  toggleUserGroupDetailsSection(userGroupId: string): void {
    let currentValue = this.userGroupIdsToDetailsShowRecord[userGroupId];
    if (currentValue === false && this.userGroupInEditMode === true) {
      this.userGroupSaveError = (
        'Please save or cancel the changes before editing other user group.');
      return;
    }
    this.userGroupIdsToDetailsShowRecord[userGroupId] =
      currentValue === true ? false : true;
    for (let useGroup in this.userGroupIdsToDetailsShowRecord) {
      if (useGroup === userGroupId) {
        continue;
      }
      this.userGroupIdsToDetailsShowRecord[useGroup] = false;
    }
    this.userGroupInEditMode = false;
    this.cdr.detectChanges();
  }

  setUserGroupInEditMode(): void {
    this.userGroupInEditMode = true;
  }

  deleteUserGroup(userGroupId: string): void {
    let modalRef: NgbModalRef = this.ngbModal.open(
      DeleteUserGroupConfirmModalComponent,
      {
        backdrop: 'static',
      }
    );
    modalRef.result.then(
      () => {
        this.setStatusMessage.emit('Updating UserGroups...');

        this.adminTaskManagerService.startTask();
        this.adminBackendApiService
          .deleteUserGroupAsync(userGroupId)
          .then(
            () => {
              this.setStatusMessage.emit('UserGroups successfully updated.');
              this.userGroups = this.userGroups.filter(
                userGroup => userGroup.userGroupName !== userGroupId);
              delete this.userGroups[userGroupId];
              delete this.userGroupIdsToDetailsShowRecord[userGroupId];
              delete this.oldUserGroupNameToNewUserGroupNameRecord[userGroupId];
              this.userGroupsBackup.delete(userGroupId);
              this.userGroupSaveError = '';
              this.userGroupInEditMode = false;
              this.cdr.detectChanges();
              this.adminTaskManagerService.finishTask();
            },
            errorResponse => {
              this.setStatusMessage.emit(`Server error: ${errorResponse}`);
              this.adminTaskManagerService.finishTask();
            }
          );
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is
        // clicked. No further action is needed.
      }
    );
  }

  removeUserFromUserGroup(userGroup: UserGroup, username: string): void {
    userGroup.users = userGroup.users.filter(obj => obj !== username);
  }

  addUserToUserGroup(event: {value: string}, userGroup: UserGroup): void {
    this.userInUserGroupValidationError = '';
    const value = (event.value || '').trim();
    if (!value || value === '') {
      return;
    }

    if (userGroup.users.includes(value)) {
      this.userInUserGroupValidationError = (
        `The user '${value}' already exists in the ` +
        `user group '${userGroup.userGroupName}'.`
      );
      return;
    }
    if (!this.allUsersUsernames.includes(value)) {
      this.userInUserGroupValidationError = (
        `The user with username '${value}' does not exists.`);
      return;
    }
    userGroup.users.push(value);
    this.userInputToAddUserToGroup.nativeElement.value = '';
  }

  addUserGroup(): void {
    const trimmedUserGroupName = this.newUserGroupName.trim();
    if (trimmedUserGroupName in this.userGroups) {
      this.userGroupValidationError = '';
      this.userGroupValidationError = (
        `The user group '${this.newUserGroupName}' already exists.`);
      return;
    }

    if (trimmedUserGroupName !== '') {
      this.adminBackendApiService
        .updateUserGroupAsync(
          trimmedUserGroupName,
          [],
          trimmedUserGroupName
        )
        .then(
          () => {
            this.setStatusMessage.emit('UserGroup added.');
            let newUserGroup = new UserGroup(trimmedUserGroupName, []);
            this.userGroups.push(newUserGroup);
            this.userGroupIdsToDetailsShowRecord[trimmedUserGroupName] = false;
            this.userGroupsBackup.set(
              trimmedUserGroupName, cloneDeep(newUserGroup));
            this.oldUserGroupNameToNewUserGroupNameRecord[
              trimmedUserGroupName] = trimmedUserGroupName;
            this.newUserGroupName = '';
            this.cdr.detectChanges();
          },
          errorResponse => {
            this.setStatusMessage.emit(`Server error: ${errorResponse}`);
          }
        );
    }
  }

  onUserGroupUserInputChange(): void {
    this.userInUserGroupValidationError = '';
    this.userGroupSaveError = '';
  }

  onUserGroupInputChange(): void {
    this.userGroupValidationError = '';
  }

  isUserGroupUpdated(
    userGroup: UserGroup, newUserGroupName: string
  ): boolean {
    if (userGroup.userGroupName !== newUserGroupName) {
      return true;
    }

    return !isEqual(
      userGroup.users,
      this.userGroupsBackup.get(userGroup.userGroupName).users
    );
  }

  updateUserGroup(userGroup: UserGroup, newUserGroupName: string): void {
    if (!this.isUserGroupUpdated(userGroup, newUserGroupName)) {
      return;
    }

    if (
      userGroup.userGroupName !== newUserGroupName &&
      newUserGroupName in this.oldUserGroupNameToNewUserGroupNameRecord
    ) {
      this.userGroupSaveError = '';
      this.userGroupSaveError = (
        `User group with name ${newUserGroupName} already exists.`);
      return;
    }

    if (
      this.adminTaskManagerService.isTaskRunning() ||
      !this.windowRef.nativeWindow.confirm(this.irreversibleActionMessage)
    ) {
      return;
    }

    this.setStatusMessage.emit('Updating UserGroups...');

    this.adminTaskManagerService.startTask();
    this.adminBackendApiService
      .updateUserGroupAsync(
        newUserGroupName,
        userGroup.users,
        userGroup.userGroupName
      )
      .then(
        () => {
          this.setStatusMessage.emit('UserGroups successfully updated.');
          if (userGroup.userGroupName !== newUserGroupName) {
            this.oldUserGroupNameToNewUserGroupNameRecord[
              newUserGroupName] = newUserGroupName;
            delete this.oldUserGroupNameToNewUserGroupNameRecord[
              userGroup.userGroupName];
            this.userGroupIdsToDetailsShowRecord[newUserGroupName] = false;
            delete this.userGroupIdsToDetailsShowRecord[
              userGroup.userGroupName];
            this.userGroupsBackup.set(newUserGroupName, cloneDeep(userGroup));
            this.userGroupsBackup.delete(userGroup.userGroupName);
            userGroup.userGroupName = newUserGroupName;
          }
          this.userGroupsBackup.set(userGroup.userGroupName, cloneDeep(userGroup));

          this.userGroupSaveError = '';
          this.userGroupInEditMode = false;
          this.cdr.detectChanges();
          this.adminTaskManagerService.finishTask();
        },
        errorResponse => {
          this.setStatusMessage.emit(`Server error: ${errorResponse}`);
          this.userGroupSaveError = '';
          this.adminTaskManagerService.finishTask();
        }
      );
  }

  resetUserGroup(userGroup: UserGroup, newUserGroupName: string): void {
    if (this.isUserGroupUpdated(userGroup, newUserGroupName)) {
      if (
        !this.windowRef.nativeWindow.confirm(
          'This will revert all changes you made. Are you sure?'
        )
      ) {
        this.userGroupInEditMode = true;
        return;
      }
      let backup = this.userGroupsBackup.get(userGroup.userGroupName);
      userGroup.userGroupName = backup.userGroupName;
      userGroup.users = backup.users;
      this.oldUserGroupNameToNewUserGroupNameRecord[
        userGroup.userGroupName] = userGroup.userGroupName;
      this.userGroupSaveError = '';
      this.userInUserGroupValidationError = '';
      this.userGroupValidationError = '';
      this.cdr.detectChanges();
    }
    this.userGroupInEditMode = false;
  }

  clearSearchIndex(): void {
    if (
      this.adminTaskManagerService.isTaskRunning() ||
      !this.windowRef.nativeWindow.confirm(this.irreversibleActionMessage)
    ) {
      return;
    }

    this.setStatusMessage.emit('Clearing search index...');

    this.adminTaskManagerService.startTask();
    this.adminBackendApiService.clearSearchIndexAsync().then(
      () => {
        this.setStatusMessage.emit('Index successfully cleared.');
        this.adminTaskManagerService.finishTask();
      },
      errorResponse => {
        this.setStatusMessage.emit('Server error: ' + errorResponse);
        this.adminTaskManagerService.finishTask();
      }
    );
  }

  regenerateOpportunitiesRelatedToTopic(): void {
    if (
      this.adminTaskManagerService.isTaskRunning() ||
      !this.windowRef.nativeWindow.confirm(this.irreversibleActionMessage)
    ) {
      return;
    }
    this.setStatusMessage.emit('Regenerating opportunities...');
    this.adminBackendApiService
      .regenerateOpportunitiesRelatedToTopicAsync(
        this.topicIdForRegeneratingOpportunities
      )
      .then(
        response => {
          this.setStatusMessage.emit(
            'No. of opportunities model created: ' +
              response.opportunities_count
          );
        },
        errorResponse => {
          this.setStatusMessage.emit('Server error: ' + errorResponse);
        }
      );
  }

  rollbackExploration(): void {
    if (
      this.adminTaskManagerService.isTaskRunning() ||
      !this.windowRef.nativeWindow.confirm(this.irreversibleActionMessage)
    ) {
      return;
    }
    this.setStatusMessage.emit(
      `Rollingback exploration ${this.expIdToRollback}...`
    );
    this.adminBackendApiService
      .rollbackExplorationToSafeState(this.expIdToRollback)
      .then(
        response => {
          this.setStatusMessage.emit(
            'Exploration rolledback to version: ' + response
          );
        },
        errorResponse => {
          this.setStatusMessage.emit('Server error: ' + errorResponse);
        }
      );
  }

  uploadTopicSimilaritiesFile(): void {
    // 'getElementById' can return null if the element provided as
    // an argument is invalid.
    let element = document.getElementById(
      'topicSimilaritiesFile'
    ) as HTMLInputElement;
    if (element === null) {
      throw new Error('No element with id topicSimilaritiesFile found.');
    }
    if (element.files === null) {
      throw new Error('No files found.');
    }
    let file = element.files[0];
    let reader = new FileReader();
    reader.onload = e => {
      let data = (e.target as FileReader).result;
      this.adminBackendApiService
        .uploadTopicSimilaritiesAsync(data as string)
        .then(
          () => {
            this.setStatusMessage.emit(
              'Topic similarities uploaded successfully.'
            );
          },
          errorResponse => {
            this.setStatusMessage.emit('Server error: ' + errorResponse);
          }
        );
    };
    reader.readAsText(file);
  }

  downloadTopicSimilaritiesFile(): void {
    this.windowRef.nativeWindow.location.href =
      AdminPageConstants.ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL;
  }

  setDataExtractionQueryStatusMessage(message: string): void {
    this.showDataExtractionQueryStatus = true;
    this.dataExtractionQueryStatusMessage = message;
  }

  sendDummyMailToAdmin(): void {
    this.adminBackendApiService.sendDummyMailToAdminAsync().then(
      () => {
        this.setStatusMessage.emit('Success! Mail sent to admin.');
      },
      errorResponse => {
        this.setStatusMessage.emit('Server error: ' + errorResponse);
      }
    );
  }

  updateUsername(): void {
    this.setStatusMessage.emit('Updating username...');
    this.adminBackendApiService
      .updateUserNameAsync(this.oldUsername, this.newUsername)
      .then(
        () => {
          this.setStatusMessage.emit(
            'Successfully renamed ' +
              this.oldUsername +
              ' to ' +
              this.newUsername +
              '!'
          );
        },
        errorResponse => {
          this.setStatusMessage.emit('Server error: ' + errorResponse);
        }
      );
  }

  updateBlogPostData(): void {
    this.setStatusMessage.emit('Updating blog post data...');
    this.adminBackendApiService
      .updateBlogPostDataAsync(
        this.blogPostId,
        this.authorUsername,
        this.publishedOn
      )
      .then(
        () => {
          this.setStatusMessage.emit('Successfully updated blog post data');
        },
        errorResponse => {
          this.setStatusMessage.emit('Server error: ' + errorResponse);
        }
      );
  }

  regenerateTopicSummaries(): void {
    this.setStatusMessage.emit('Regenerating all topic summaries...');
    this.adminBackendApiService.regenerateTopicSummariesAsync().then(
      () => {
        this.setStatusMessage.emit(
          'Successfully regenerated all topic summaries.'
        );
      },
      errorResponse => {
        this.setStatusMessage.emit('Server error: ' + errorResponse);
      }
    );
  }

  getNumberOfPendingDeletionRequestModels(): void {
    this.setStatusMessage.emit(
      'Getting the number of users that are being deleted...'
    );
    this.adminBackendApiService.getNumberOfPendingDeletionRequestAsync().then(
      pendingDeletionRequests => {
        this.setStatusMessage.emit(
          'The number of users that are being deleted is: ' +
            pendingDeletionRequests.number_of_pending_deletion_models
        );
      },
      errorResponse => {
        this.setStatusMessage.emit('Server error: ' + errorResponse);
      }
    );
  }

  grantSuperAdminPrivileges(): void {
    this.setStatusMessage.emit('Communicating with Firebase server...');
    this.adminBackendApiService
      .grantSuperAdminPrivilegesAsync(this.usernameToGrant)
      .then(
        () => {
          this.setStatusMessage.emit('Success!');
        },
        errorResponse => {
          this.setStatusMessage.emit(
            'Server error: ' + errorResponse.error.error
          );
        }
      );
  }

  revokeSuperAdminPrivileges(): void {
    this.setStatusMessage.emit('Communicating with Firebase server...');
    this.adminBackendApiService
      .revokeSuperAdminPrivilegesAsync(this.usernameToRevoke)
      .then(
        () => {
          this.setStatusMessage.emit('Success!');
        },
        errorResponse => {
          this.setStatusMessage.emit(
            'Server error: ' + errorResponse.error.error
          );
        }
      );
  }

  getModelsRelatedToUser(): void {
    this.setStatusMessage.emit('Getting the models related to user...');
    this.adminBackendApiService
      .getModelsRelatedToUserAsync(this.userIdToGet)
      .then(
        isModal => {
          if (isModal) {
            this.setStatusMessage.emit(
              'Some related models exist, see logs ' +
                'to find out the exact models'
            );
          } else {
            this.setStatusMessage.emit('No related models exist');
          }
        },
        errorResponse => {
          this.setStatusMessage.emit('Server error: ' + errorResponse);
        }
      );
  }

  deleteUser(): void {
    this.setStatusMessage.emit('Starting the deletion of the user...');
    this.adminBackendApiService
      .deleteUserAsync(this.userIdToDelete, this.usernameToDelete)
      .then(
        () => {
          this.setStatusMessage.emit('The deletion process was started.');
        },
        errorResponse => {
          this.setStatusMessage.emit('Server error: ' + errorResponse);
        }
      );
  }

  submitQuery(): void {
    let STATUS_PENDING =
      'Data extraction query has been submitted. Please wait.';

    this.setDataExtractionQueryStatusMessage(STATUS_PENDING);

    let downloadUrl = this.DATA_EXTRACTION_QUERY_HANDLER_URL + '?';

    downloadUrl += 'exp_id=' + encodeURIComponent(this.expId);
    downloadUrl += '&exp_version=' + encodeURIComponent(this.expVersion);
    downloadUrl += '&state_name=' + encodeURIComponent(this.stateName);
    downloadUrl += '&num_answers=' + encodeURIComponent(this.numAnswers);

    this.windowRef.nativeWindow.open(downloadUrl);
  }

  retrieveExplorationInteractionIds(): void {
    this.explorationInteractionIds = [];
    this.setStatusMessage.emit('Retrieving interactions in exploration ...');
    this.adminBackendApiService
      .retrieveExplorationInteractionIdsAsync(this.expIdToGetInteractionIdsFor)
      .then(
        response => {
          if (response.interaction_ids.length > 0) {
            this.setStatusMessage.emit(
              'Successfully fetched interactionIds in exploration.'
            );
            this.explorationInteractionIds = response.interaction_ids;
          } else {
            this.setStatusMessage.emit(
              'No interactionIds found in exploration.'
            );
          }
        },
        errorResponse => {
          this.setStatusMessage.emit('Server error: ' + errorResponse);
        }
      );
  }

  resetForm(): void {
    this.expId = '';
    this.expVersion = 0;
    this.stateName = '';
    this.numAnswers = 0;
    this.showDataExtractionQueryStatus = false;
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.loaderService.onLoadingMessageChange.subscribe((message: string) => {
        this.loadingMessage = message;
      })
    );
    this.loaderService.showLoadingScreen('Loading');
    this.fetchUserGroupData();
  }
}
