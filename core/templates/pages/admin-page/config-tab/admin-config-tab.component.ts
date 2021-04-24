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
 * @fileoverview Directive for the configuration tab in the admin panel.
 */

import { Component, Output, OnInit, EventEmitter, ChangeDetectorRef, NgZone } from '@angular/core';
import { Subscription, Observable, from } from 'rxjs';
import { downgradeComponent } from '@angular/upgrade/static';
import { AdminBackendApiService } from 'domain/admin/admin-backend-api.service';
import { AdminDataService } from 'pages/admin-page/services/admin-data.service.ts';
import { AdminTaskManagerService } from 'pages/admin-page/services/admin-task-manager.service.ts';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service.ts';
import { WindowRef } from 'services/contextual/window-ref.service.ts';
import { Schema } from 'services/schema-default-value.service';
require('components/forms/schema-based-editors/schema-based-editor.directive.ts');
// import { AdminPageData } from '';

@Component({
  selector: 'admin-config-tab',
  templateUrl: './admin-config-tab.component.html',
  styleUrls: []
})
export class AdminConfigTabComponent implements OnInit {
  @Output() setStatusMessage: EventEmitter<string> = (
    new EventEmitter
  );
  configProperties: AdminPageData = {};
  configPropertiesKeys = [];
  
  constructor(
    private adminBackendApiService: AdminBackendApiService,
    private adminDataService: AdminDataService,
    private adminTaskManagerService: AdminTaskManagerService,
    private windowRef: WindowRef,
    private changeDetectorRef: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.reloadConfigProperties();
  }
  
  isNonemptyObject(object) {
    return Object.keys(object).length !== 0;
  }
  
  reloadConfigProperties() {
    this.adminDataService.getDataAsync().then(
      data => {
        this.configProperties = data.configProperties;
        this.configPropertiesKeys = Object.keys(this.configProperties);
        this.changeDetectorRef.detectChanges();
      });
    }
  
  revertToDefaultConfigPropertyValue(configPropertyId) {
    if (!this.windowRef.nativeWindow.confirm('This action is irreversible. Are you sure?')) {
      return;
    }

    this.adminBackendApiService.revertConfigPropertyAsync(
      configPropertyId
    ).then(() => {
      this.setStatusMessage.emit('Config property reverted successfully.');
      this.reloadConfigProperties();
      // TODO(#8521): Remove the use of $rootScope.$apply()
      // once the directive is migrated to angular.
      //$rootScope.$apply();
    }, errorResponse => {
      this.setStatusMessage.emit('Server error: ' + errorResponse);
      // TODO(#8521): Remove the use of $rootScope.$apply()
      // once the directive is migrated to angular.
      //$rootScope.$apply();
    });
  }
  
  saveConfigProperties() {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    if (!this.windowRef.nativeWindow.confirm('This action is irreversible. Are you sure?')) {
      return;
    }

    this.setStatusMessage.emit('Saving...');

    this.adminTaskManagerService.startTask();
    var newConfigPropertyValues = JSON.parse(JSON.stringify(this.configProperties));
    for (var property in newConfigPropertyValues) {
      newConfigPropertyValues[property] = (
        newConfigPropertyValues[property].value);
    }

    this.adminBackendApiService.saveConfigPropertiesAsync(
      newConfigPropertyValues
    ).then(() => {
      this.setStatusMessage.emit('Data saved successfully.');
      this.adminTaskManagerService.finishTask();
      // TODO(#8521): Remove the use of $rootScope.$apply()
      // once the directive is migrated to angular.
      //$rootScope.$apply();
    }, errorResponse => {
      this.setStatusMessage.emit('Server error: ' + errorResponse);
      this.adminTaskManagerService.finishTask();
      // TODO(#8521): Remove the use of $rootScope.$apply()
      // once the directive is migrated to angular.
      //$rootScope.$apply();
    });
  }
  
  updateData(newValue, configPropertyKey) {
    this.configProperties[configPropertyKey].value = newValue;
  }
  
  getDescription(key): string {
    return this.configProperties[key].description;
  }
  
  getSchema(key): Schema {
    return this.configProperties[key].schema;
  }
  
  getValue(key) {
    return this.configProperties[key].value;
  }
}

angular.module('oppia').directive(
  'adminConfigTab', downgradeComponent(
    {component: AdminConfigTabComponent}));
  