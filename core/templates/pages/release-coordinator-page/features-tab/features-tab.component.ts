// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the feature tab on the release coordinator page.
 */

import {ENTER} from '@angular/cdk/keycodes';
import {
  Component,
  OnInit,
  ViewChildren,
  ElementRef,
  EventEmitter,
  Output,
  QueryList,
} from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import {Subscription} from 'rxjs';

import {LoaderService} from 'services/loader.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {FeatureFlagDummyBackendApiService} from 'domain/feature-flag/feature-flag-dummy-backend-api.service';
import {FeatureFlagBackendApiService} from 'domain/feature-flag/feature-flag-backend-api.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {FeatureFlag} from 'domain/feature-flag/feature-flag.model';
import {HttpErrorResponse} from '@angular/common/http';
import {UserGroup} from 'domain/release_coordinator/user-group.model';

interface IntSchema {
  type: 'int';
  validators: object[];
}

interface FeatureFlagViewModel extends FeatureFlag {
  searchQuery: string;
  filteredUserGroups: UserGroup[];
}

@Component({
  selector: 'features-tab',
  templateUrl: './features-tab.component.html',
})
export class FeaturesTabComponent implements OnInit {
  @ViewChildren('userGroupInput') userGroupInputs!: QueryList<ElementRef>;
  @Output() setStatusMessage = new EventEmitter<string>();

  DEV_SERVER_STAGE = 'dev';
  TEST_SERVER_STAGE = 'test';
  PROD_SERVER_STAGE = 'prod';
  serverStage: string = '';

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  featureFlagNameToBackupMap!: Map<string, FeatureFlagViewModel>;
  featureFlagsAreFetched: boolean = false;
  isDummyApiEnabled: boolean = false;
  loadingMessage: string = '';
  directiveSubscriptions = new Subscription();
  separatorKeysCodes: number[] = [ENTER];
  allUserGroups: UserGroup[] = [];
  featureFlagViewModels: FeatureFlagViewModel[] = [];

  constructor(
    private windowRef: WindowRef,
    private apiService: FeatureFlagBackendApiService,
    private featureService: PlatformFeatureService,
    private dummyApiService: FeatureFlagDummyBackendApiService,
    private loaderService: LoaderService
  ) {}

  async reloadFeatureFlagViewModelsAsync(): Promise<void> {
    const data = await this.apiService.getFeatureFlags();
    this.serverStage = data.serverStage;
    this.featureFlagsAreFetched = true;
    this.allUserGroups = data.userGroups;
    this.featureFlagViewModels = data.featureFlags.map(featureFlag => ({
      ...featureFlag,
      searchQuery: '',
      filteredUserGroups: this.allUserGroups.slice(),
    }));
    this.featureFlagNameToBackupMap = new Map(
      this.featureFlagViewModels.map(feature => [
        feature.name,
        cloneDeep(feature),
      ])
    );
    this.loaderService.hideLoadingScreen();
  }

  filterUserGroups(featureFlagVM: FeatureFlagViewModel): void {
    if (featureFlagVM.searchQuery) {
      featureFlagVM.filteredUserGroups = this.allUserGroups.filter(
        userGroup => {
          const lowerSearchQuery = featureFlagVM.searchQuery.toLowerCase();
          return userGroup.name.toLowerCase().includes(lowerSearchQuery);
        }
      );
    } else {
      featureFlagVM.filteredUserGroups = this.allUserGroups.slice();
    }
  }

  addUserGroupToFeatureFlagViewModel(
    event: {value: string},
    featureFlagVM: FeatureFlagViewModel
  ): void {
    const value = (event.value || '').trim();
    if (!value) {
      return;
    }

    const selectedUserGroup = this.allUserGroups.find(ug => ug.name === value);

    if (!selectedUserGroup) {
      this.setStatusMessage.emit(`User group with name "${value}" not found.`);
      return;
    }
    if (
      selectedUserGroup &&
      this.validUserGroupInput(selectedUserGroup.userGroupId, featureFlagVM)
    ) {
      featureFlagVM.userGroupIds.push(selectedUserGroup.userGroupId);
    }
    this.resetUserGroupSearch(featureFlagVM);
  }

  removeUserGroupFromFeatureFlagViewModel(
    userGroupId: string,
    featureFlagVM: FeatureFlagViewModel
  ): void {
    const index = featureFlagVM.userGroupIds.indexOf(userGroupId);
    if (index >= 0) {
      featureFlagVM.userGroupIds.splice(index, 1);
    }
  }

  selectUserGroup(
    event: {option: {value: string}},
    featureFlagVM: FeatureFlagViewModel
  ): void {
    const selectedUserGroupName = event.option.value;
    const selectedUserGroup = this.allUserGroups.find(
      ug => ug.name === selectedUserGroupName
    );
    if (!selectedUserGroup) {
      this.setStatusMessage.emit(
        `User group with name "${selectedUserGroupName}" not found.`
      );
      return;
    }
    if (
      featureFlagVM.userGroupIds.indexOf(selectedUserGroup.userGroupId) > -1
    ) {
      this.removeUserGroupFromFeatureFlagViewModel(
        selectedUserGroup.userGroupId,
        featureFlagVM
      );
    } else {
      this.addUserGroupToFeatureFlagViewModel(
        {
          value: selectedUserGroup.name,
        },
        featureFlagVM
      );
    }
    this.resetUserGroupSearch(featureFlagVM);
  }

  validUserGroupInput(
    userGroupId: string,
    featureFlagVM: FeatureFlagViewModel
  ): boolean {
    return !featureFlagVM.userGroupIds.includes(userGroupId);
  }

  resetUserGroupSearch(featureFlagVM: FeatureFlagViewModel): void {
    const inputElement = this.userGroupInputs.find(
      input =>
        input.nativeElement.getAttribute('data-feature-flag-id') ===
        featureFlagVM.name
    );
    if (inputElement) {
      inputElement.nativeElement.value = '';
    }
    featureFlagVM.filteredUserGroups = this.allUserGroups.slice();
    featureFlagVM.searchQuery = '';
  }

  getUserGroupName(userGroupId: string): string {
    const userGroup = this.allUserGroups.find(
      ug => ug.userGroupId === userGroupId
    );
    return userGroup ? userGroup.name : userGroupId;
  }

  getSchema(): IntSchema {
    return {
      type: 'int',
      validators: [
        {
          id: 'is_at_least',
          min_value: 1,
        },
        {
          id: 'is_at_most',
          max_value: 100,
        },
      ],
    };
  }

  getLastUpdatedDate(featureFlagVM: FeatureFlagViewModel): string {
    if (featureFlagVM.lastUpdated === null) {
      return 'The feature has not been updated yet.';
    }

    const dateParts = featureFlagVM.lastUpdated.split(', ')[0].split('/');
    const timeParts = featureFlagVM.lastUpdated.split(', ')[1].split(':');

    const year = parseInt(dateParts[2], 10);
    const month = parseInt(dateParts[0], 10) - 1;
    const day = parseInt(dateParts[1], 10);
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    const second = parseInt(timeParts[2], 10);
    const millisecond = parseInt(timeParts[3], 10);

    const parsedDate = new Date(
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond
    );
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    };
    return parsedDate.toLocaleDateString('en-US', options);
  }

  getFeatureStageString(featureFlagVM: FeatureFlagViewModel): string {
    if (featureFlagVM.featureStage === 'dev') {
      return 'Dev (can only be enabled on dev server).';
    } else if (featureFlagVM.featureStage === 'test') {
      return 'Test (can only be enabled on dev and test server).';
    } else {
      return 'Prod (can only be enabled on dev, test and prod server).';
    }
  }

  getFeatureValidOnCurrentServer(featureFlagVM: FeatureFlagViewModel): boolean {
    if (this.serverStage === this.DEV_SERVER_STAGE) {
      return true;
    } else if (this.serverStage === this.TEST_SERVER_STAGE) {
      return featureFlagVM.featureStage === this.TEST_SERVER_STAGE ||
        featureFlagVM.featureStage === this.PROD_SERVER_STAGE
        ? true
        : false;
    } else if (this.serverStage === this.PROD_SERVER_STAGE) {
      return featureFlagVM.featureStage === this.PROD_SERVER_STAGE
        ? true
        : false;
    }
    return false;
  }

  async updateFeatureFlagViewModel(
    featureFlagVM: FeatureFlagViewModel
  ): Promise<void> {
    if (
      !this.windowRef.nativeWindow.confirm(
        'This action is irreversible. Are you sure?'
      )
    ) {
      return;
    }
    const issues = this.validateFeatureFlagViewModel(featureFlagVM);
    if (issues.length > 0) {
      this.windowRef.nativeWindow.alert(issues.join('\n'));
      return;
    }
    try {
      await this.apiService.updateFeatureFlag(
        featureFlagVM.name,
        featureFlagVM.forceEnableForAllUsers,
        featureFlagVM.rolloutPercentage,
        featureFlagVM.userGroupIds
      );

      this.featureFlagNameToBackupMap.set(
        featureFlagVM.name,
        cloneDeep(featureFlagVM)
      );

      this.setStatusMessage.emit('Saved successfully.');
      // We use unknown type because we are unsure of the type of error
      // that was thrown. Since the catch block cannot identify the
      // specific type of error, we are unable to further optimise the
      // code by introducing more types of errors.
    } catch (e: unknown) {
      if (e instanceof HttpErrorResponse) {
        if (e.error && e.error.error) {
          this.setStatusMessage.emit(`Update failed: ${e.error.error}`);
        } else {
          this.setStatusMessage.emit('Update failed.');
        }
      } else {
        throw new Error('Unexpected error response.');
      }
    }
  }

  clearChanges(featureFlagVM: FeatureFlagViewModel): void {
    if (
      !this.windowRef.nativeWindow.confirm(
        'This will revert all changes you made. Are you sure?'
      )
    ) {
      return;
    }
    const backup = this.featureFlagNameToBackupMap.get(featureFlagVM.name);

    if (backup) {
      featureFlagVM.forceEnableForAllUsers = backup.forceEnableForAllUsers;
      featureFlagVM.rolloutPercentage = backup.rolloutPercentage;
      featureFlagVM.userGroupIds = backup.userGroupIds;
    }
  }

  isFeatureFlagViewModelChanged(featureFlagVM: FeatureFlagViewModel): boolean {
    const original = this.featureFlagNameToBackupMap.get(featureFlagVM.name);
    if (original === undefined) {
      throw new Error(
        'Backup not found for feature flag: ' + featureFlagVM.name
      );
    }
    return (
      !isEqual(
        original.forceEnableForAllUsers,
        featureFlagVM.forceEnableForAllUsers
      ) ||
      !isEqual(original.rolloutPercentage, featureFlagVM.rolloutPercentage) ||
      !isEqual(original.userGroupIds, featureFlagVM.userGroupIds)
    );
  }

  /**
   * Validates feature flag before updating.
   *
   * @param {FeatureFlagViewModel} featureFlagVM - the feature flag to be validated.
   *
   * @returns {string[]} - Array of issue messages, if any.
   */
  validateFeatureFlagViewModel(featureFlagVM: FeatureFlagViewModel): string[] {
    const issues = [];

    if (
      featureFlagVM.rolloutPercentage < 0 ||
      featureFlagVM.rolloutPercentage > 100
    ) {
      issues.push('Rollout percentage should be between 0 to 100.');
    }
    return issues;
  }

  get dummyFeatureFlagForE2eTestsIsEnabled(): boolean {
    return this.featureService.status.DummyFeatureFlagForE2ETests.isEnabled;
  }

  async reloadDummyHandlerStatusAsync(): Promise<void> {
    if (this.dummyFeatureFlagForE2eTestsIsEnabled) {
      this.isDummyApiEnabled = await this.dummyApiService.isHandlerEnabled();
    }
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.loaderService.onLoadingMessageChange.subscribe((message: string) => {
        this.loadingMessage = message;
      })
    );
    this.loaderService.showLoadingScreen('Loading');
    this.reloadFeatureFlagViewModelsAsync();
    this.reloadDummyHandlerStatusAsync();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
