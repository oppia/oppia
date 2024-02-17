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

import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { Subscription } from 'rxjs';

import { LoaderService } from 'services/loader.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { FeatureFlagDummyBackendApiService } from
  'domain/feature-flag/feature-flag-dummy-backend-api.service';
import { FeatureFlagBackendApiService } from
  'domain/feature-flag/feature-flag-backend-api.service';
import { PlatformFeatureService } from 'services/platform-feature.service';
import { FeatureFlag } from 'domain/feature-flag/feature-flag.model';
import { HttpErrorResponse } from '@angular/common/http';


interface IntSchema {
  type: 'int';
  validators: object[];
}

@Component({
  selector: 'features-tab',
  templateUrl: './features-tab.component.html'
})
export class FeaturesTabComponent implements OnInit {
  @Output() setStatusMessage = new EventEmitter<string>();

  DEV_SERVER_STAGE = 'dev';
  TEST_SERVER_STAGE = 'test';
  PROD_SERVER_STAGE = 'prod';
  serverStage: string = '';

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  featureFlagNameToBackupMap!: Map<string, FeatureFlag>;
  featureFlags: FeatureFlag[] = [];
  featureFlagsAreFetched: boolean = false;
  isDummyApiEnabled: boolean = false;
  loadingMessage: string = '';
  directiveSubscriptions = new Subscription();

  constructor(
    private windowRef: WindowRef,
    private apiService: FeatureFlagBackendApiService,
    private featureService: PlatformFeatureService,
    private dummyApiService: FeatureFlagDummyBackendApiService,
    private loaderService: LoaderService,
  ) {}

  async reloadFeatureFlagsAsync(): Promise<void> {
    const data = await this.apiService.getFeatureFlags();
    this.serverStage = data.serverStage;
    this.featureFlagsAreFetched = true;
    this.featureFlags = data.featureFlags;
    this.featureFlagNameToBackupMap = new Map(
      this.featureFlags.map(feature => [feature.name, cloneDeep(feature)]));
    this.loaderService.hideLoadingScreen();
  }

  getSchema(): IntSchema {
    return {
      type: 'int',
      validators: [{
        id: 'is_at_least',
        min_value: 1
      }, {
        id: 'is_at_most',
        max_value: 100
      }]
    };
  }

  getLastUpdatedDate(feature: FeatureFlag): string {
    if (feature.lastUpdated === null) {
      return 'The feature has not been updated yet.';
    }

    const dateParts = feature.lastUpdated.split(', ')[0].split('/');
    const timeParts = feature.lastUpdated.split(', ')[1].split(':');

    const year = parseInt(dateParts[2], 10);
    const month = parseInt(dateParts[0], 10) - 1;
    const day = parseInt(dateParts[1], 10);
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    const second = parseInt(timeParts[2], 10);
    const millisecond = parseInt(timeParts[3], 10);

    const parsedDate = new Date(
      year, month, day, hour, minute, second, millisecond);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit', month: 'short', year: 'numeric'
    };
    return parsedDate.toLocaleDateString('en-US', options);
  }

  getFeatureStageString(feature: FeatureFlag): string {
    if (feature.featureStage === 'dev') {
      return 'Dev (can only be enabled on dev server).';
    } else if (feature.featureStage === 'test') {
      return 'Test (can only be enabled on dev and test server).';
    } else {
      return 'Prod (can only be enabled on dev, test and prod server).';
    }
  }

  getFeatureValidOnCurrentServer(feature: FeatureFlag): boolean {
    if (this.serverStage === this.DEV_SERVER_STAGE) {
      return true;
    } else if (this.serverStage === this.TEST_SERVER_STAGE) {
      return (
        feature.featureStage === this.TEST_SERVER_STAGE ||
        feature.featureStage === this.PROD_SERVER_STAGE
      ) ? true : false;
    } else if (this.serverStage === this.PROD_SERVER_STAGE) {
      return feature.featureStage === this.PROD_SERVER_STAGE ? true : false;
    }
    return false;
  }

  async updateFeatureFlag(feature: FeatureFlag): Promise<void> {
    if (!this.windowRef.nativeWindow.confirm(
      'This action is irreversible. Are you sure?')) {
      return;
    }
    const issues = this.validateFeatureFlag(feature);
    if (issues.length > 0) {
      this.windowRef.nativeWindow.alert(issues.join('\n'));
      return;
    }
    try {
      await this.apiService.updateFeatureFlag(
        feature.name, feature.forceEnableForAllUsers, feature.rolloutPercentage,
        feature.userGroupIds);

      this.featureFlagNameToBackupMap.set(feature.name, cloneDeep(feature));

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

  clearChanges(featureFlag: FeatureFlag): void {
    if (!this.windowRef.nativeWindow.confirm(
      'This will revert all changes you made. Are you sure?')) {
      return;
    }
    const backup = this.featureFlagNameToBackupMap.get(
      featureFlag.name
    );

    if (backup) {
      featureFlag.forceEnableForAllUsers = backup.forceEnableForAllUsers;
      featureFlag.rolloutPercentage = backup.rolloutPercentage;
      featureFlag.userGroupIds = backup.userGroupIds;
    }
  }

  isFeatureFlagChanged(feature: FeatureFlag): boolean {
    const original = this.featureFlagNameToBackupMap.get(feature.name);
    if (original === undefined) {
      throw new Error('Backup not found for feature flag: ' + feature.name);
    }
    return (
      !isEqual(
        original.forceEnableForAllUsers, feature.forceEnableForAllUsers
      ) || !isEqual(
        original.rolloutPercentage, feature.rolloutPercentage
      ) || !isEqual(
        original.userGroupIds, feature.userGroupIds)
    );
  }

  /**
   * Validates feature flag before updating.
   *
   * @param {FeatureFlag} feature - the feature flag to be validated.
   *
   * @returns {string[]} - Array of issue messages, if any.
   */
  validateFeatureFlag(feature: FeatureFlag): string[] {
    const issues = [];

    if (feature.rolloutPercentage < 0 || feature.rolloutPercentage > 100) {
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
      this.loaderService.onLoadingMessageChange.subscribe(
        (message: string) => {
          this.loadingMessage = message;
        }
      ));
    this.loaderService.showLoadingScreen('Loading');
    this.reloadFeatureFlagsAsync();
    this.reloadDummyHandlerStatusAsync();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'adminFeaturesTab', downgradeComponent(
    {component: FeaturesTabComponent}));
