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
 * @fileoverview TODO Directive for the configuration tab in the admin panel.
 */

import { Component, OnInit, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { AdminFeaturesTabConstants } from
  './admin-features-tab.constants';
import { WindowRef } from 'services/contextual/window-ref.service';
import { AdminDataService } from
  'pages/admin-page/services/admin-data.service';
import { AdminTaskManagerService } from
  'pages/admin-page/services/admin-task-manager.service';
import { PlatformParameter, FeatureStage } from
  'domain/feature_gating/PlatformParameterObjectFactory';
import { FeatureGatingAdminBackendApiService } from
  'domain/feature_gating/feature-gating-admin-backend-api.service';

import cloneDeep from 'lodash/cloneDeep';


import { PlatformParameterRuleObjectFactory, PlatformParameterRule } from
  'domain/feature_gating/PlatformParameterRuleObjectFactory';
import {
  PlatformParameterFilterType,
  PlatformParameterFilterObjectFactory,
  PlatformParameterFilter,
  ServerMode,
} from 'domain/feature_gating/PlatformParameterFilterObjectFactory';

@Component({
  selector: 'admin-features-tab',
  templateUrl: './admin-features-tab.directive.html'
})
export class AdminFeaturesTabComponent implements OnInit {
  @Input() setStatusMessage: (msg: string) => void;

  availableFilterTypes: PlatformParameterFilterType[] = Object
    .keys(PlatformParameterFilterType)
    .map(key => PlatformParameterFilterType[key]);

  filterTypeToContext: {
    [key in PlatformParameterFilterType]: {
      displayName: string,
      operators: string[],
      options?: string[],
      optionFilter?: (feature: PlatformParameter, option: string) => boolean;
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
            return option !== 'prod';
          case FeatureStage.PROD:
            return true;
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
      operators: ['=', '<', '>', '<=', '>=']
    },
    [PlatformParameterFilterType.AppVersionFlavor]: {
      displayName: 'App Version Flavor',
      options: AdminFeaturesTabConstants.ALLOWED_APP_VERSION_FLAVORS,
      operators: ['=', '<', '>', '<=', '>=']
    }

  };

  featureFlags: PlatformParameter[] = [];
  featureFlagNameToBackupMap: Map<string, PlatformParameter>;

  constructor(
    private windowRef: WindowRef,
    private adminDataService: AdminDataService,
    private adminTaskManager: AdminTaskManagerService,
    private apiService: FeatureGatingAdminBackendApiService,
    private ruleFactory: PlatformParameterRuleObjectFactory,
    private filterFactory: PlatformParameterFilterObjectFactory,
  ) {}

  async reloadFeatureFlagsAsync() {
    const data = await this.adminDataService.getDataAsync();

    this.featureFlags = data.featureFlags;

    this.featureFlagNameToBackupMap = new Map(
      this.featureFlags.map(feature => [feature.name, cloneDeep(feature)]));
  }

  addNewRule(feature: PlatformParameter): void {
    feature.rules.push(
      this.ruleFactory.createFromBackendDict({
        filters: [{
          type: PlatformParameterFilterType.ServerMode,
          conditions: [['=', ServerMode.Dev.toString()]]
        }],
        value_when_matched: false
      })
    );
  }

  addNewFilter(rule: PlatformParameterRule): void {
    rule.filters.push(
      this.filterFactory.createFromBackendDict({
        type: PlatformParameterFilterType.ServerMode,
        conditions: []
      })
    );
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

  async saveFeatureAsync(feature: PlatformParameter): Promise<void> {
    if (this.adminTaskManager.isTaskRunning()) {
      return;
    }
    if (!this.windowRef.nativeWindow.confirm(
      'This action is irreversible. Are you sure?')) {
      return;
    }
    const updateMessage = this.windowRef.nativeWindow.prompt(
      'Please enter message for the update',
      `Update feature '${feature.name}'.`
    );
    if (!updateMessage) {
      return;
    }

    try {
      this.adminTaskManager.startTask();
      console.log(feature);
      await this.apiService.updateFeatureFlag(
        feature.name, updateMessage, feature.rules);

      this.setStatusMessage('Saved successfully.');
    } finally {
      this.adminTaskManager.finishTask();
    }
  }

  clearChanges(featureFlag: PlatformParameter) {
    if (!this.windowRef.nativeWindow.confirm(
      'This will revert all changes you made. Are you sure?')) {
      return;
    }
    const backup = this.featureFlagNameToBackupMap.get(featureFlag.name);
    featureFlag.rules = backup.rules;
  }

  onFilterTypeSelectionChanged(filter: PlatformParameterFilter): void {
    filter.conditions.splice(0);
  }

  ngOnInit() {
    this.reloadFeatureFlagsAsync();
  }
}

angular.module('oppia').directive(
  'adminFeaturesTab', downgradeComponent(
    {component: AdminFeaturesTabComponent}));
