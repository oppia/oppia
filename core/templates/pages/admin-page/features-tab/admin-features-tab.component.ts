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
 * @fileoverview Component for the feature tab in the admin panel.
 */

import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';

import { PlatformFeatureAdminBackendApiService } from
  'domain/platform_feature/platform-feature-admin-backend-api.service';
import { PlatformFeatureDummyBackendApiService } from
  'domain/platform_feature/platform-feature-dummy-backend-api.service';
import {
  PlatformParameterFilterType,
  PlatformParameterFilterObjectFactory,
  PlatformParameterFilter,
} from 'domain/platform_feature/platform-parameter-filter-object.factory';
import { PlatformFeatureService } from 'services/platform-feature.service';
import { PlatformParameter, FeatureStage } from
  'domain/platform_feature/platform-parameter-object.factory';
import { PlatformParameterRuleObjectFactory, PlatformParameterRule } from
  'domain/platform_feature/platform-parameter-rule-object.factory';
import { AdminFeaturesTabConstants } from
  'pages/admin-page/features-tab/admin-features-tab.constants';
import { WindowRef } from 'services/contextual/window-ref.service';
import { AdminDataService } from
  'pages/admin-page/services/admin-data.service';
import { AdminTaskManagerService } from
  'pages/admin-page/services/admin-task-manager.service';

@Component({
  selector: 'admin-features-tab',
  templateUrl: './admin-features-tab.component.html'
})
export class AdminFeaturesTabComponent implements OnInit {
  @Output() setStatusMessage = new EventEmitter<string>();

  readonly availableFilterTypes: PlatformParameterFilterType[] = Object
    .keys(PlatformParameterFilterType)
    .map(key => PlatformParameterFilterType[key]);

  readonly filterTypeToContext: {
    [key in PlatformParameterFilterType]: {
      displayName: string,
      operators: string[],
      options?: string[],
      optionFilter?: (feature: PlatformParameter, option: string) => boolean;
      placeholder?: string;
      inputRegex?: RegExp;
    }
  } = {
    [PlatformParameterFilterType.ServerMode]: {
      displayName: 'Server Mode',
      options: AdminFeaturesTabConstants.ALLOWED_SERVER_MODES,
      operators: ['='],
      optionFilter: (feature, option) => {
        switch (feature.featureStage) {
          case FeatureStage.DEV:
            return option === 'dev';
          case FeatureStage.TEST:
            return option === 'dev' || option === 'test';
          case FeatureStage.PROD:
            return true;
          default:
            return false;
        }
      }
    },
    [PlatformParameterFilterType.UserLocale]: {
      displayName: 'User Locale',
      options: AdminFeaturesTabConstants.ALLOWED_SITE_LANGUAGE_IDS,
      operators: ['=']
    },
    [PlatformParameterFilterType.ClientType]: {
      displayName: 'Client Type',
      options: AdminFeaturesTabConstants.ALLOWED_CLIENT_TYPES,
      operators: ['=']
    },
    [PlatformParameterFilterType.BrowserType]: {
      displayName: 'Browser Type',
      options: AdminFeaturesTabConstants.ALLOWED_BROWSER_TYPES,
      operators: ['=']
    },
    [PlatformParameterFilterType.AppVersion]: {
      displayName: 'App Version',
      operators: ['=', '<', '>', '<=', '>='],
      placeholder: 'e.g. 1.0.0',
      inputRegex: AdminFeaturesTabConstants.APP_VERSION_REGEXP
    },
    [PlatformParameterFilterType.AppVersionFlavor]: {
      displayName: 'App Version Flavor',
      options: AdminFeaturesTabConstants.ALLOWED_APP_VERSION_FLAVORS,
      operators: ['=', '<', '>', '<=', '>=']
    }
  };

  private readonly defaultNewFilter: PlatformParameterFilter =
    this.filterFactory.createFromBackendDict({
      type: PlatformParameterFilterType.ServerMode,
      conditions: []
    });

  private readonly defaultNewRule: PlatformParameterRule =
    this.ruleFactory.createFromBackendDict({
      filters: [this.defaultNewFilter.toBackendDict()],
      value_when_matched: false
    });

  featureFlags: PlatformParameter[] = [];
  featureFlagNameToBackupMap: Map<string, PlatformParameter>;

  isDummyApiEnabled: boolean = false;

  constructor(
    private windowRef: WindowRef,
    private adminDataService: AdminDataService,
    private adminTaskManager: AdminTaskManagerService,
    private apiService: PlatformFeatureAdminBackendApiService,
    private ruleFactory: PlatformParameterRuleObjectFactory,
    private filterFactory: PlatformParameterFilterObjectFactory,
    private featureService: PlatformFeatureService,
    private dummyApiService: PlatformFeatureDummyBackendApiService,
  ) {}

  async reloadFeatureFlagsAsync(): Promise<void> {
    const data = await this.adminDataService.getDataAsync();

    this.featureFlags = data.featureFlags;

    this.featureFlagNameToBackupMap = new Map(
      this.featureFlags.map(feature => [feature.name, cloneDeep(feature)]));
  }

  addNewRuleToTop(feature: PlatformParameter): void {
    feature.rules.unshift(cloneDeep(this.defaultNewRule));
  }

  addNewRuleToBottom(feature: PlatformParameter): void {
    feature.rules.push(cloneDeep(this.defaultNewRule));
  }

  addNewFilter(rule: PlatformParameterRule): void {
    rule.filters.push(cloneDeep(this.defaultNewFilter));
  }

  addNewCondition(filter: PlatformParameterFilter): void {
    const context = this.filterTypeToContext[filter.type];
    filter.conditions.push([
      context.operators[0],
      context.options ? context.options[0] : ''
    ]);
  }

  removeRule(feature: PlatformParameter, ruleIndex: number): void {
    feature.rules.splice(ruleIndex, 1);
  }

  removeFilter(rule: PlatformParameterRule, filterIndex: number): void {
    rule.filters.splice(filterIndex, 1);
  }

  removeCondition(
      filter: PlatformParameterFilter, conditionIndex: number): void {
    filter.conditions.splice(conditionIndex, 1);
  }

  moveRuleUp(feature: PlatformParameter, ruleIndex: number): void {
    const rule = feature.rules[ruleIndex];
    this.removeRule(feature, ruleIndex);
    feature.rules.splice(ruleIndex - 1, 0, rule);
  }

  moveRuleDown(feature: PlatformParameter, ruleIndex: number): void {
    const rule = feature.rules[ruleIndex];
    this.removeRule(feature, ruleIndex);
    feature.rules.splice(ruleIndex + 1, 0, rule);
  }

  async updateFeatureRulesAsync(feature: PlatformParameter): Promise<void> {
    if (this.adminTaskManager.isTaskRunning()) {
      return;
    }
    const commitMessage = this.windowRef.nativeWindow.prompt(
      'This action is irreversible. If you insist to proceed, please enter ' +
      'the commit message for the update',
      `Update feature '${feature.name}'.`
    );
    if (commitMessage === null) {
      return;
    }

    try {
      this.adminTaskManager.startTask();

      await this.apiService.updateFeatureFlag(
        feature.name, commitMessage, feature.rules);

      this.featureFlagNameToBackupMap.set(feature.name, cloneDeep(feature));

      this.setStatusMessage.emit('Saved successfully.');
    } catch (e) {
      if (e.error && e.error.error) {
        this.setStatusMessage.emit(`Update failed: ${e.error.error}`);
      } else {
        this.setStatusMessage.emit('Update failed.');
      }
    } finally {
      this.adminTaskManager.finishTask();
    }
  }

  clearChanges(featureFlag: PlatformParameter): void {
    if (!this.windowRef.nativeWindow.confirm(
      'This will revert all changes you made. Are you sure?')) {
      return;
    }
    const backup = this.featureFlagNameToBackupMap.get(featureFlag.name);
    featureFlag.rules = cloneDeep(backup.rules);
  }

  clearFilterConditions(filter: PlatformParameterFilter): void {
    filter.conditions.splice(0);
  }

  get isDummyFeatureEnabled(): boolean {
    return this.featureService.status.DummyFeature.isEnabled;
  }

  async reloadDummyHandlerStatusAsync(): Promise<void> {
    if (this.isDummyFeatureEnabled) {
      this.isDummyApiEnabled = await this.dummyApiService.isHandlerEnabled();
    }
  }

  isFeatureFlagRulesChanged(feature: PlatformParameter) {
    const original = this.featureFlagNameToBackupMap.get(feature.name);
    return !isEqual(original.rules, feature.rules);
  }

  ngOnInit() {
    this.reloadFeatureFlagsAsync();
    this.reloadDummyHandlerStatusAsync();
  }
}

angular.module('oppia').directive(
  'adminFeaturesTab', downgradeComponent(
    {component: AdminFeaturesTabComponent}));
