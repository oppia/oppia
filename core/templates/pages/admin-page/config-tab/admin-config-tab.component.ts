// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the configuration tab in the admin panel.
 */

import { Component, EventEmitter, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AdminBackendApiService, ConfigPropertiesBackendResponse, ConfigPropertyValues } from 'domain/admin/admin-backend-api.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { AdminDataService } from '../services/admin-data.service';
import { AdminTaskManagerService } from '../services/admin-task-manager.service';

@Component({
  selector: 'oppia-admin-config-tab',
  templateUrl: './admin-config-tab.component.html'
})
export class AdminConfigTabComponent {
  @Output() setStatusMessage: EventEmitter<string> = new EventEmitter();
  configProperties: ConfigPropertiesBackendResponse = {};

  constructor(
    private adminBackendApiService: AdminBackendApiService,
    private adminDataService: AdminDataService,
    private adminTaskManagerService: AdminTaskManagerService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    this.reloadConfigProperties();
  }

  isNonemptyObject(object: Object): boolean {
    return Object.keys(object).length !== 0;
  }

  reloadConfigProperties(): void {
    this.adminDataService.getDataAsync().then((adminDataObject) => {
      this.configProperties = adminDataObject.configProperties;
    });
  }

  revertToDefaultConfigPropertyValue(configPropertyId: string): void {
    if (!this.windowRef.nativeWindow.confirm(
      'This action is irreversible. Are you sure?')) {
      return;
    }

    this.adminBackendApiService.revertConfigPropertyAsync(configPropertyId)
      .then(() => {
        this.setStatusMessage.emit('Config property reverted successfully.');
        this.reloadConfigProperties();
      }, errorResponse => {
        this.setStatusMessage.emit('Server error: ' + errorResponse);
      });
  }

  saveConfigProperties(): void {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    if (!this.windowRef.nativeWindow.confirm(
      'This action is irreversible. Are you sure?')) {
      return;
    }

    this.setStatusMessage.emit('Saving...');

    this.adminTaskManagerService.startTask();
    let newConfigPropertyValues = {};
    for (let property in this.configProperties) {
      newConfigPropertyValues[property] = this.configProperties[property].value;
    }

    this.adminBackendApiService.saveConfigPropertiesAsync(
      newConfigPropertyValues as ConfigPropertyValues).then(() => {
      this.setStatusMessage.emit('Data saved successfully.');
      this.adminTaskManagerService.finishTask();
    }, errorResponse => {
      this.setStatusMessage.emit('Server error: ' + errorResponse);
      this.adminTaskManagerService.finishTask();
    });
  }
}

angular.module('oppia').directive('oppiaAdminConfigTab',
  downgradeComponent({
    component: AdminConfigTabComponent
  }) as angular.IDirectiveFactory);
