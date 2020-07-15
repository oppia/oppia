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
 * @fileoverview Component for the activities tab in the admin panel when Oppia
 * is in developer mode.
 */

import { Component, Input, OnInit } from '@angular/core';


import { downgradeComponent } from '@angular/upgrade/static';
import { AdminDataService } from 'pages/admin-page/services/admin-data.service';
import { AdminTaskManagerService } from
  'pages/admin-page/services/admin-task-manager.service';
import { AdminDevModeActivitiesTabBackendApiService } from
  'pages/admin-page/services/admin-dev-mode-activities-tab-backend-api.service';
import { WindowRef } from 'services/contextual/window-ref.service';

@Component({
  selector: 'admin-dev-mode-activities-tab',
  templateUrl: './admin-dev-mode-activities-tab.component.html',
  styleUrls: []
})
export class AdminDevModeActivitiesTabComponent implements OnInit {
  @Input() setStatusMessage;
  constructor(
    private adminDataService: AdminDataService,
    private adminTaskManagerService: AdminTaskManagerService,
    private windowRef: WindowRef,
    private adminDevModeActivitiesTabBackendApiService:
      AdminDevModeActivitiesTabBackendApiService
  ) {}
  numDummyExpsToPublish: number = 0;
  numDummyExpsToGenerate: number = 0;
  DEMO_COLLECTIONS: string[][];
  DEMO_EXPLORATIONS: string[][];
  reloadingAllExplorationPossible: boolean = false;
  demoExplorationIds: string[];
  ngOnInit(): void {
    this.numDummyExpsToPublish = 0;
    this.numDummyExpsToGenerate = 0;
    this.reloadingAllExplorationPossible = false;
    this.adminDataService.getDataAsync().then((adminDataObject) => {
      this.DEMO_EXPLORATIONS = adminDataObject.demoExplorations;
      this.DEMO_COLLECTIONS = adminDataObject.demoCollections;
      this.demoExplorationIds = adminDataObject.demoExplorationIds;
      this.reloadingAllExplorationPossible = true;
    });
  }
  reloadExploration(explorationId: string) {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    if (!this.windowRef.nativeWindow.confirm(
      'This action is irreversible. Are you sure?')) {
      return;
    }

    this.setStatusMessage('Processing...');

    this.adminTaskManagerService.startTask();
    this.adminDevModeActivitiesTabBackendApiService.reloadExploration(
      explorationId).then(() => {
      this.setStatusMessage('Data reloaded successfully.');
      this.adminTaskManagerService.finishTask();
    }, (errorResponse) => {
      this.setStatusMessage('Server error: ' + errorResponse.body);
      this.adminTaskManagerService.finishTask();
    });
  }

  reloadAllExplorations(): void {
    if (!this.reloadingAllExplorationPossible) {
      return;
    }
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    if (!this.windowRef.nativeWindow.confirm(
      'This action is irreversible. Are you sure?')) {
      return;
    }

    this.setStatusMessage('Processing...');
    this.adminTaskManagerService.startTask();

    var numSucceeded = 0;
    var numFailed = 0;
    var numTried = 0;
    var printResult = function() {
      if (numTried < this.demoExplorationIds.length) {
        this.setStatusMessage(
          'Processing...' + numTried + '/' +
          this.demoExplorationIds.length);
        return;
      }
      this.setStatusMessage(
        'Reloaded ' + this.demoExplorationIds.length +
        ' explorations: ' + numSucceeded + ' succeeded, ' + numFailed +
        ' failed.');
      this.adminTaskManagerService.finishTask();
    };

    for (var i = 0; i < this.demoExplorationIds.length; ++i) {
      var explorationId = this.demoExplorationIds[i];

      this.adminDevModeActivitiesTabBackendApiService.reloadExploration(
        explorationId).then(() => {
        ++numSucceeded;
        ++numTried;
        printResult();
      }, () => {
        ++numFailed;
        ++numTried;
        printResult();
      });
    }
  }
  generateDummyExplorations(): void {
    // Generate dummy explorations with random title.
    if (this.numDummyExpsToPublish > this.numDummyExpsToGenerate) {
      this.setStatusMessage(
        'Publish count should be less than or equal to generate count');
      return;
    }
    this.adminTaskManagerService.startTask();
    this.setStatusMessage('Processing...');

    this.adminDevModeActivitiesTabBackendApiService.generateDummyExplorations(
      this.numDummyExpsToGenerate, this.numDummyExpsToPublish
    ).then(() => {
      this.setStatusMessage('Dummy explorations generated succesfully.');
    }, (errorResponse) => {
      this.setStatusMessage('Server error: ' + errorResponse.data.error);
    });
    this.adminTaskManagerService.finishTask();
  }

  loadNewStructuresData(): void {
    this.adminTaskManagerService.startTask();
    this.setStatusMessage('Processing...');
    this.adminDevModeActivitiesTabBackendApiService.generateDummyStructures(
    ).then(() => {
      this.setStatusMessage('Dummy new structures data generated successfully');
    }, (errorResponse) => {
      this.setStatusMessage('Server error: ' + errorResponse.data.error);
    });
    this.adminTaskManagerService.finishTask();
  }

  generateNewSkillData(): void {
    this.adminTaskManagerService.startTask();
    this.setStatusMessage('Processing...');

    this.adminDevModeActivitiesTabBackendApiService.generateDummySkillData(
    ).then(() => {
      this.setStatusMessage(
        'Dummy new skill and questions generated successfully');
    }, (errorResponse) => {
      this.setStatusMessage('Server error: ' + errorResponse.data.error);
    });
    this.adminTaskManagerService.finishTask();
  }

  reloadCollection(collectionId: string): void {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    if (!this.windowRef.nativeWindow.confirm(
      'This action is irreversible. Are you sure?')) {
      return;
    }

    this.setStatusMessage('Processing...');

    this.adminTaskManagerService.startTask();

    this.adminDevModeActivitiesTabBackendApiService.reloadCollection(
      collectionId).then(() => {
      this.setStatusMessage('Data reloaded successfully');
    }, (errorResponse) => {
      this.setStatusMessage('Server error: ' + errorResponse.data.error);
    });
    this.adminTaskManagerService.finishTask();
  }
}

angular.module('oppia').directive(
  'adminDevModeActivitiesTab', downgradeComponent(
    {component: AdminDevModeActivitiesTabComponent}));
