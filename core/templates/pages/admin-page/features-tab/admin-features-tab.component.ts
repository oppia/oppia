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
import { PlatformParameter } from
  'domain/feature_gating/PlatformParameterObjectFactory';
import { FeatureGatingAdminBackendApiService } from
  'domain/feature_gating/feature-gating-admin-backend-api.service';


import { PlatformParameterRuleObjectFactory, PlatformParameterRule } from
  'domain/feature_gating/PlatformParameterRuleObjectFactory';
import {
  PlatformParameterFilterType,
  PlatformParameterFilterObjectFactory,
  PlatformParameterFilter
} from 'domain/feature_gating/PlatformParameterFilterObjectFactory';

@Component({
  selector: 'admin-features-tab',
  templateUrl: './admin-features-tab.directive.html'
})
export class AdminFeaturesTabComponent implements OnInit {
  @Input() setStatusMessage: (msg: string) => void;

  featureFlags: PlatformParameter[] = [];

  constructor(
    private windowRef: WindowRef,
    private adminDataService: AdminDataService,
    private adminTaskManager: AdminTaskManagerService,
    private apiService: FeatureGatingAdminBackendApiService,
    // for debug
    private ruleFactory: PlatformParameterRuleObjectFactory,
    private filterFactory: PlatformParameterFilterObjectFactory,
  ) {}

  async reloadFeatureFlagsAsync() {
    const data = await this.adminDataService.getDataAsync();

    data.featureFlags[0].rules = [
      this.ruleFactory.createFromBackendDict({
        value_when_matched: true,
        filters: [
          {
            type: PlatformParameterFilterType.ServerMode,
            conditions: [['=', 'dev'], ['=', 'prod'], ['=', 'test']]
          },
          {
            type: PlatformParameterFilterType.ServerMode,
            conditions: [['=', 'dev'], ['=', 'prod'], ['=', 'test']]
          },
          {
            type: PlatformParameterFilterType.ServerMode,
            conditions: [['=', 'dev'], ['=', 'prod'], ['=', 'test']]
          },
          {
            type: PlatformParameterFilterType.ServerMode,
            conditions: [['=', 'dev'], ['=', 'prod'], ['=', 'test']]
          },
        ]
      }),
      this.ruleFactory.createFromBackendDict({
        value_when_matched: false,
        filters: [
          {
            type: PlatformParameterFilterType.ServerMode,
            conditions: [['=', 'dev'], ['=', 'prod'], ['=', 'test']]
          },
          {
            type: PlatformParameterFilterType.ServerMode,
            conditions: [['=', 'dev'], ['=', 'prod'], ['=', 'test']]
          },
          {
            type: PlatformParameterFilterType.ServerMode,
            conditions: [['=', 'dev'], ['=', 'prod'], ['=', 'test']]
          },
          {
            type: PlatformParameterFilterType.ServerMode,
            conditions: [['=', 'dev'], ['=', 'prod'], ['=', 'test']]
          },
        ]
      })
    ];

    // For debug, make it two.
    this.featureFlags = [
      ...data.featureFlags,
      // ...data.featureFlags
    ];
    console.log(this.featureFlags);
  }

  async saveConfigPropertiesAsync() {
    if (this.adminTaskManager.isTaskRunning()) {
      return;
    }
    if (!this.windowRef.nativeWindow.confirm(
      'This action is irreversible. Are you sure?')) {
      return;
    }

    // console.log(this.setStatusMessage);
    // this.setStatusMessage('Saving...');

    // this.adminTaskManager.startTask();
    // var newConfigPropertyValues = {};
    // for (var property in this.configProperties) {
    //   newConfigPropertyValues[property] = (
    //     this.configProperties[property].value);
    // }

    this.setStatusMessage('Data saved successfully.');
    this.adminTaskManager.finishTask();
  }

  addNewRule(feature: PlatformParameter): void {
    feature.rules.push(
      this.ruleFactory.createFromBackendDict({
        filters: [],
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
    filter.conditions.push(['=', '']);
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

  ngOnInit() {
    this.reloadFeatureFlagsAsync();
  }
}

angular.module('oppia').directive(
  'adminFeaturesTab', downgradeComponent(
    {component: AdminFeaturesTabComponent}));
