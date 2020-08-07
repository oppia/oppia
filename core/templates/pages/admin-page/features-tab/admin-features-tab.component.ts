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

@Component({
  selector: 'admin-features-tab',
  templateUrl: './admin-features-tab.directive.html'
})
export class AdminFeaturesTabComponent implements OnInit {
  @Input() setStatusMessage: (msg: string) => void;

  configProperties: {[k: string]: any};
  featureFlags: PlatformParameter[];

  constructor(
    private windowRef: WindowRef,
    private adminDataService: AdminDataService,
    private adminTaskManager: AdminTaskManagerService,
    private apiService: FeatureGatingAdminBackendApiService,
  ) {}

  isNonemptyObject(object) {
    console.log(AdminFeaturesTabConstants.FEATURE_STUB_CONSTANT);
    var hasAtLeastOneElement = false;
    for (var property in object) {
      hasAtLeastOneElement = true;
    }
    return hasAtLeastOneElement;
  }

  async reloadConfigProperties() {
    const data = await this.adminDataService.getDataAsync();

    this.configProperties = Object.entries(
      data.configProperties).map(([k, v]) => ({name: k, value: v}));
    this.featureFlags = data.featureFlags;

    console.log(this.featureFlags);
    console.log(this.configProperties);
  }

  revertToDefaultConfigPropertyValue(configPropertyId) {
    if (!this.windowRef.nativeWindow.confirm(
      'This action is irreversible. Are you sure?')) {
      return;
    }
  }

  saveConfigProperties() {
    if (this.adminTaskManager.isTaskRunning()) {
      return;
    }
    if (!this.windowRef.nativeWindow.confirm(
      'This action is irreversible. Are you sure?')) {
      return;
    }

    console.log(this.setStatusMessage);
    this.setStatusMessage('Saving...');

    this.adminTaskManager.startTask();
    var newConfigPropertyValues = {};
    for (var property in this.configProperties) {
      newConfigPropertyValues[property] = (
        this.configProperties[property].value);
    }

    this.setStatusMessage('Data saved successfully.');
    this.adminTaskManager.finishTask();
  }

  ngOnInit() {
    this.configProperties = {};
    this.reloadConfigProperties();
  }
}

angular.module('oppia').directive(
  'adminFeaturesTab', downgradeComponent(
    {component: AdminFeaturesTabComponent}));
