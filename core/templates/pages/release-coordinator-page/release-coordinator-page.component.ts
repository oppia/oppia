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
 * @fileoverview Component for the release coordinator page.
 */

import {ENTER} from '@angular/cdk/keycodes';
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';

import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';

import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import {Subscription} from 'rxjs';

import {PromoBarBackendApiService} from 'services/promo-bar-backend-api.service';

import {ReleaseCoordinatorBackendApiService} from 'pages/release-coordinator-page/services/release-coordinator-backend-api.service';
import {ReleaseCoordinatorPageConstants} from 'pages/release-coordinator-page/release-coordinator-page.constants';
import {WindowRef} from 'services/contextual/window-ref.service';
import {DeleteUserGroupConfirmModalComponent} from 'pages/release-coordinator-page/modals/delete-user-group-confirm-modal.component';
import {LoaderService} from 'services/loader.service';
import {UserGroup} from 'domain/release_coordinator/user-group.model';

interface MemoryCacheProfile {
  totalAllocatedInBytes: string;
  peakAllocatedInBytes: string;
  totalKeysStored: string;
}

@Component({
  selector: 'oppia-release-coordinator-page',
  templateUrl: './release-coordinator-page.component.html',
})
export class ReleaseCoordinatorPageComponent implements OnInit {
  @ViewChild('userInputToAddUserToGroup')
  userInputToAddUserToGroup!: ElementRef<HTMLInputElement>;
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  statusMessage!: string;
  activeTab!: string;
  memoryCacheProfile!: MemoryCacheProfile;
  promoBarConfigForm!: FormGroup;
  memoryCacheDataFetched: boolean = false;
  submitButtonDisabled: boolean = false;
  directiveSubscriptions = new Subscription();
  loadingMessage: string = '';
  newUserGroupName: string = '';
  separatorKeysCodes: number[] = [ENTER];
  /**
   * Stores a backup of the original state of user groups.
   * Key: userGroupId, Value: Deep copy of the original UserGroup object.
   *
   * Lifecycle: Initialized in fetchUserGroupData() when user groups are
   * first loaded. Used to detect changes in updateUserGroup() and
   * isUserGroupUpdated(). Updated after successful edits to keep in sync with
   * current state. Entries are added when new user groups are created.
   * Entries are removed when user groups are deleted.
   *
   * Purpose: Allows for change detection and reverting changes if needed.
   */
  userGroupsBackup!: Map<string, UserGroup>;
  userGroups: UserGroup[] = [];
  userGroupIdsToDetailsShowRecord: Record<string, boolean> = {};
  allUsersUsernames: string[] = [];
  userInUserGroupValidationError: string = '';
  userGroupValidationError: string = '';
  userGroupSaveError: string = '';
  userGroupInEditMode: boolean = false;
  irreversibleActionMessage: string =
    'This action is irreversible. Are you sure?';
  isPageFullyLoaded: boolean = false;

  TAB_ID_BEAM_JOBS: string = ReleaseCoordinatorPageConstants.TAB_ID_BEAM_JOBS;
  TAB_ID_FEATURES: string = ReleaseCoordinatorPageConstants.TAB_ID_FEATURES;
  TAB_ID_MISC: string = ReleaseCoordinatorPageConstants.TAB_ID_MISC;

  constructor(
    private formBuilder: FormBuilder,
    private backendApiService: ReleaseCoordinatorBackendApiService,
    private promoBarBackendApiService: PromoBarBackendApiService,
    private cdr: ChangeDetectorRef,
    private ngbModal: NgbModal,
    private windowRef: WindowRef,
    private loaderService: LoaderService
  ) {}

  flushMemoryCache(): void {
    this.backendApiService.flushMemoryCacheAsync().then(
      () => {
        this.statusMessage = 'Success! Memory Cache Flushed.';
        this.memoryCacheDataFetched = false;
      },
      errorResponse => {
        this.statusMessage = 'Server error: ' + errorResponse;
      }
    );
  }

  getMemoryCacheProfile(): void {
    this.backendApiService.getMemoryCacheProfileAsync().then(
      response => {
        this.memoryCacheProfile = {
          totalAllocatedInBytes: response.total_allocation,
          peakAllocatedInBytes: response.peak_allocation,
          totalKeysStored: response.total_keys_stored,
        };
        this.memoryCacheDataFetched = true;
        this.statusMessage = 'Success!';
      },
      errorResponse => {
        this.statusMessage = 'Server error: ' + errorResponse;
      }
    );
  }

  updatePromoBarParameter(): void {
    this.statusMessage = 'Updating promo-bar platform parameter...';
    this.promoBarBackendApiService
      .updatePromoBarDataAsync(
        this.promoBarConfigForm.controls.enabled.value,
        this.promoBarConfigForm.controls.message.value
      )
      .then(
        () => {
          this.statusMessage = 'Success!';
          this.promoBarConfigForm.markAsPristine();
        },
        errorResponse => {
          this.statusMessage = 'Server error: ' + errorResponse;
        }
      );
  }

  async fetchUserGroupData(): Promise<void> {
    const data = await this.backendApiService.getUserGroupsAsync();
    this.userGroups = data.userGroups;
    this.userGroupsBackup = new Map(
      this.userGroups.map(userGroup => [
        userGroup.userGroupId,
        cloneDeep(userGroup),
      ])
    );
    for (let userGroup of this.userGroups) {
      this.userGroupIdsToDetailsShowRecord[userGroup.userGroupId] = false;
    }
    this.loaderService.hideLoadingScreen();
    this.isPageFullyLoaded = true;
  }

  toggleUserGroupDetailsSection(userGroupId: string): void {
    let currentValue = this.userGroupIdsToDetailsShowRecord[userGroupId];
    if (currentValue === false && this.userGroupInEditMode === true) {
      this.userGroupSaveError =
        'Please save or cancel the changes before editing other user group.';
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

    const userGroupToDelete = this.userGroups.find(
      userGroup => userGroup.userGroupId === userGroupId
    );
    if (!userGroupToDelete) {
      this.statusMessage = `User group with id '${userGroupId}' not found.`;
      return;
    }

    modalRef.result.then(
      () => {
        this.backendApiService.deleteUserGroupAsync(userGroupId).then(
          () => {
            this.statusMessage = `User group '${userGroupToDelete.name}' successfully deleted.`;
            this.userGroups = this.userGroups.filter(
              userGroup => userGroup.userGroupId !== userGroupId
            );
            delete this.userGroupIdsToDetailsShowRecord[userGroupId];
            this.userGroupsBackup.delete(userGroupId);
            this.userGroupSaveError = '';
            this.userGroupInEditMode = false;
            this.cdr.detectChanges();
          },
          errorResponse => {
            this.statusMessage = `Server error: ${errorResponse}`;
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
    userGroup.memberUsernames = userGroup.memberUsernames.filter(
      obj => obj !== username
    );
  }

  addUserToUserGroup(event: {value: string}, userGroup: UserGroup): void {
    this.userInUserGroupValidationError = '';
    const value = (event.value || '').trim();
    if (!value || value === '') {
      return;
    }

    if (userGroup.memberUsernames.includes(value)) {
      this.userInUserGroupValidationError =
        `The user '${value}' already exists in the ` +
        `user group '${userGroup.name}'.`;
      return;
    }
    userGroup.memberUsernames.push(value);
    this.userInputToAddUserToGroup.nativeElement.value = '';
  }

  addUserGroup(): void {
    const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9 ]+$/;
    const trimmedUserGroupName = this.newUserGroupName.trim();

    if (!ALPHANUMERIC_REGEX.test(trimmedUserGroupName)) {
      this.userGroupValidationError = '';
      this.userGroupValidationError =
        'User group name can only contain alphanumeric characters and spaces.';
      return;
    }
    if (
      this.userGroups.some(userGroup => userGroup.name === trimmedUserGroupName)
    ) {
      this.userGroupValidationError = '';
      this.userGroupValidationError = `The user group '${this.newUserGroupName}' already exists.`;
      return;
    }

    if (trimmedUserGroupName !== '') {
      this.backendApiService
        .createUserGroupAsync(trimmedUserGroupName, [])
        .then(
          userGroup => {
            this.statusMessage = 'User group added.';
            this.userGroups.push(userGroup);
            this.userGroupIdsToDetailsShowRecord[userGroup.userGroupId] = false;
            this.userGroupsBackup.set(
              userGroup.userGroupId,
              cloneDeep(userGroup)
            );
            this.newUserGroupName = '';
            this.cdr.detectChanges();
          },
          errorResponse => {
            this.statusMessage = `Server error: ${errorResponse}`;
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

  isUserGroupUpdated(userGroup: UserGroup): boolean {
    const original = this.userGroupsBackup.get(userGroup.userGroupId);
    if (original === undefined) {
      throw new Error('Backup not found for user group: ' + userGroup.name);
    }

    return !isEqual(userGroup, original);
  }

  _getAllUserGroupNamesExceptSelf(updatedUserGroup: UserGroup): string[] {
    let userGroupNames: string[] = [];
    for (let userGroup of this.userGroupsBackup.values()) {
      if (userGroup.userGroupId !== updatedUserGroup.userGroupId) {
        userGroupNames.push(userGroup.name);
      }
    }
    return userGroupNames;
  }

  _restoreUserGroupToBackup(userGroup: UserGroup): void {
    let backup = this.userGroupsBackup.get(userGroup.userGroupId);
    if (backup) {
      userGroup.name = backup.name;
      userGroup.memberUsernames = [...backup.memberUsernames];
    }
    return;
  }

  updateUserGroup(userGroup: UserGroup): void {
    const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9 ]+$/;

    if (!this.isUserGroupUpdated(userGroup)) {
      return;
    }

    if (userGroup.name.trim() === '') {
      this.userGroupSaveError = 'User group name should not be empty.';
      this._restoreUserGroupToBackup(userGroup);
      return;
    }

    if (!ALPHANUMERIC_REGEX.test(userGroup.name)) {
      this.userGroupSaveError = '';
      this.userGroupSaveError =
        'User group name can only contain alphanumeric characters and spaces.';
      this._restoreUserGroupToBackup(userGroup);
      return;
    }

    if (
      this._getAllUserGroupNamesExceptSelf(userGroup).includes(
        userGroup.name
      ) === true
    ) {
      this.userGroupSaveError = '';
      this.userGroupSaveError = `User group with name '${userGroup.name}' already exist.`;
      this._restoreUserGroupToBackup(userGroup);
      return;
    }

    if (!this.windowRef.nativeWindow.confirm(this.irreversibleActionMessage)) {
      return;
    }

    this.statusMessage = 'Updating user groups...';

    this.backendApiService
      .updateUserGroupAsync(
        userGroup.userGroupId,
        userGroup.name.trim(),
        userGroup.memberUsernames
      )
      .then(
        () => {
          this.statusMessage = `User group '${userGroup.name}' successfully updated.`;
          this.userGroupIdsToDetailsShowRecord[userGroup.userGroupId] = false;
          this.userGroupsBackup.set(
            userGroup.userGroupId,
            cloneDeep(userGroup)
          );

          this.userGroupSaveError = '';
          this.userGroupInEditMode = false;
          this.cdr.detectChanges();
        },
        errorResponse => {
          this.userGroupSaveError = errorResponse;
          this._restoreUserGroupToBackup(userGroup);
        }
      );
  }

  resetUserGroup(userGroup: UserGroup): void {
    if (this.isUserGroupUpdated(userGroup)) {
      if (
        !this.windowRef.nativeWindow.confirm(
          'This will revert all changes you made. Are you sure?'
        )
      ) {
        this.userGroupInEditMode = true;
        return;
      }
      let backup = this.userGroupsBackup.get(userGroup.userGroupId);
      if (backup) {
        userGroup.name = backup.name;
        userGroup.memberUsernames = [...backup.memberUsernames];
        this.userGroupSaveError = '';
        this.userInUserGroupValidationError = '';
        this.userGroupValidationError = '';
        this.cdr.detectChanges();
      }
    }
    this.userGroupInEditMode = false;
    this.userGroupSaveError = '';
    this.userInUserGroupValidationError = '';
    this.userGroupValidationError = '';
  }

  ngOnInit(): void {
    this.statusMessage = '';
    this.submitButtonDisabled = true;
    this.promoBarConfigForm = this.formBuilder.group({
      enabled: false,
      message: '',
    });
    this.promoBarConfigForm.valueChanges.subscribe(() => {
      this.submitButtonDisabled = false;
    });
    this.memoryCacheDataFetched = false;
    this.activeTab = ReleaseCoordinatorPageConstants.TAB_ID_BEAM_JOBS;
    this.promoBarBackendApiService.getPromoBarDataAsync().then(promoBar => {
      this.promoBarConfigForm.patchValue({
        enabled: promoBar.promoBarEnabled,
        message: promoBar.promoBarMessage,
      });
    });
    this.directiveSubscriptions.add(
      this.loaderService.onLoadingMessageChange.subscribe((message: string) => {
        this.loadingMessage = message;
      })
    );
    this.loaderService.showLoadingScreen('Loading');
    this.fetchUserGroupData();
  }
}
