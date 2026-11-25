// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Modal that shows the change history of a feature flag.
 */

import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {
  FeatureFlagBackendApiService,
  FeatureFlagChange,
  FeatureFlagConfigValues,
} from 'domain/feature-flag/feature-flag-backend-api.service';
import {UserGroup} from 'domain/release_coordinator/user-group.model';
import {DateTimeFormatService} from 'services/date-time-format.service';

export interface FeatureFlagFieldChange {
  fieldName: string;
  oldValue: string;
  newValue: string;
}

export interface FeatureFlagHistoryRow {
  dateString: string;
  committer: string;
  fieldChanges: FeatureFlagFieldChange[];
}

@Component({
  selector: 'oppia-feature-flag-history-modal',
  templateUrl: './feature-flag-history-modal.component.html',
})
export class FeatureFlagHistoryModalComponent implements OnInit {
  // These properties are set by the component that opens the modal, before
  // ngOnInit runs, so we need to do non-null assertion. For more
  // information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() featureFlagName!: string;
  @Input() userGroups!: UserGroup[];

  historyRows: FeatureFlagHistoryRow[] = [];
  historyIsLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private featureFlagBackendApiService: FeatureFlagBackendApiService,
    private dateTimeFormatService: DateTimeFormatService
  ) {}

  ngOnInit(): void {
    this.featureFlagBackendApiService
      .fetchFeatureFlagHistoryAsync(this.featureFlagName)
      .then(
        changes => {
          this.historyRows = changes.map(change => this._toHistoryRow(change));
          this.historyIsLoading = false;
        },
        () => {
          this.errorMessage = 'Failed to load the history of this flag.';
          this.historyIsLoading = false;
        }
      );
  }

  close(): void {
    this.ngbActiveModal.dismiss();
  }

  private _toHistoryRow(change: FeatureFlagChange): FeatureFlagHistoryRow {
    return {
      dateString: this.dateTimeFormatService.getLocaleDateTimeHourString(
        change.createdOnMsecs
      ),
      // The username is null when the committer's account has been deleted.
      committer: change.committerUsername ?? '(deleted user)',
      fieldChanges: this._getFieldChanges(change.oldConfig, change.newConfig),
    };
  }

  // Only the fields that actually changed are returned, so that each row
  // shows exactly what the release coordinator did.
  private _getFieldChanges(
    oldConfig: FeatureFlagConfigValues,
    newConfig: FeatureFlagConfigValues
  ): FeatureFlagFieldChange[] {
    const fieldChanges: FeatureFlagFieldChange[] = [];
    if (oldConfig.forceEnableForAllUsers !== newConfig.forceEnableForAllUsers) {
      fieldChanges.push({
        fieldName: 'Force-enable for all users',
        oldValue: oldConfig.forceEnableForAllUsers ? 'Yes' : 'No',
        newValue: newConfig.forceEnableForAllUsers ? 'Yes' : 'No',
      });
    }
    if (oldConfig.rolloutPercentage !== newConfig.rolloutPercentage) {
      fieldChanges.push({
        fieldName: 'Rollout percentage',
        oldValue: `${oldConfig.rolloutPercentage}%`,
        newValue: `${newConfig.rolloutPercentage}%`,
      });
    }
    const oldGroups = this._getUserGroupNames(oldConfig.userGroupIds);
    const newGroups = this._getUserGroupNames(newConfig.userGroupIds);
    if (oldGroups !== newGroups) {
      fieldChanges.push({
        fieldName: 'User groups',
        oldValue: oldGroups,
        newValue: newGroups,
      });
    }
    return fieldChanges;
  }

  // A user group may have been deleted since the change was made, in which
  // case its ID is shown instead of its name.
  private _getUserGroupNames(userGroupIds: string[]): string {
    if (userGroupIds.length === 0) {
      return 'None';
    }
    return userGroupIds
      .map(userGroupId => {
        const userGroup = this.userGroups.find(
          group => group.userGroupId === userGroupId
        );
        return userGroup ? userGroup.name : userGroupId;
      })
      .join(', ');
  }
}
