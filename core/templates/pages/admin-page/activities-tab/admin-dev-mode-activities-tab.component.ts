// Copyright 2021 The Oppia Authors. All Rights Reserved.
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

import { Component, Output, OnInit, EventEmitter } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { AdminBackendApiService } from 'domain/admin/admin-backend-api.service';
import { AdminDataService } from 'pages/admin-page/services/admin-data.service';
import { AdminTaskManagerService } from 'pages/admin-page/services/admin-task-manager.service';
import { WindowRef } from 'services/contextual/window-ref.service';

@Component({
  selector: 'oppia-admin-dev-mode-activities-tab',
  templateUrl: './admin-dev-mode-activities-tab.component.html',
})
export class AdminDevModeActivitiesTabComponent implements OnInit {
  @Output() setStatusMessage = new EventEmitter<string>();
  reloadingAllExplorationPossible: boolean = false;
  demoExplorationIds: string[] = [];
  numDummyExpsToPublish: number = 0;
  numDummyExpsToGenerate: number = 0;
  DEMO_COLLECTIONS: string[][] = [[]];
  DEMO_EXPLORATIONS: string[][] = [[]];

  constructor(
    private adminBackendApiService: AdminBackendApiService,
    private adminDataService: AdminDataService,
    private adminTaskManagerService: AdminTaskManagerService,
    private windowRef: WindowRef
  ) {}

  reloadExploration(explorationId: string): void {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    if (!this.windowRef.nativeWindow.confirm(
      'This action is irreversible. Are you sure?')) {
      return;
    }

    this.setStatusMessage.emit('Processing...');

    this.adminTaskManagerService.startTask();

    this.adminBackendApiService.reloadExplorationAsync(
      explorationId
    ).then(() => {
      this.setStatusMessage.emit('Data reloaded successfully.');
      this.adminTaskManagerService.finishTask();
    }, (errorResponse) => {
      this.setStatusMessage.emit(
        'Server error: ' + errorResponse);
      this.adminTaskManagerService.finishTask();
    });
  }

  printResult(numSucceeded: number, numFailed: number, numTried: number): void {
    if (numTried < this.demoExplorationIds.length) {
      this.setStatusMessage.emit(
        'Processing...' + numTried + '/' +
        this.demoExplorationIds.length);
      return;
    }
    this.setStatusMessage.emit(
      'Reloaded ' + this.demoExplorationIds.length +
      ' explorations: ' + numSucceeded + ' succeeded, ' + numFailed +
      ' failed.');
    this.adminTaskManagerService.finishTask();
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

    this.setStatusMessage.emit('Processing...');
    this.adminTaskManagerService.startTask();

    var numSucceeded = 0;
    var numFailed = 0;
    var numTried = 0;

    for (var i = 0; i < this.demoExplorationIds.length; ++i) {
      var explorationId = this.demoExplorationIds[i];

      this.adminBackendApiService.reloadExplorationAsync(
        explorationId
      ).then(() => {
        ++numSucceeded;
        ++numTried;
        this.printResult(numSucceeded, numFailed, numTried);
      }, () => {
        ++numFailed;
        ++numTried;
        this.printResult(numSucceeded, numFailed, numTried);
      });
    }
  }

  generateDummyExplorations(): void {
    // Generate dummy explorations with random title.
    if (this.numDummyExpsToPublish > this.numDummyExpsToGenerate) {
      this.setStatusMessage.emit(
        'Publish count should be less than or equal to generate count');
      return;
    }
    this.adminTaskManagerService.startTask();
    this.setStatusMessage.emit('Processing...');
    this.adminBackendApiService.generateDummyExplorationsAsync(
      this.numDummyExpsToGenerate, this.numDummyExpsToPublish
    ).then(() => {
      this.setStatusMessage.emit(
        'Dummy explorations generated successfully.');
    }, (errorResponse) => {
      this.setStatusMessage.emit(
        'Server error: ' + errorResponse);
    });
    this.adminTaskManagerService.finishTask();
  }

  loadNewStructuresData(): void {
    this.adminTaskManagerService.startTask();
    this.setStatusMessage.emit('Processing...');

    this.adminBackendApiService.generateDummyNewStructuresDataAsync()
      .then(() => {
        this.setStatusMessage.emit(
          'Dummy new structures data generated successfully.');
      }, (errorResponse) => {
        this.setStatusMessage.emit(
          'Server error: ' + errorResponse);
      });
    this.adminTaskManagerService.finishTask();
  }

  generateNewSkillData(): void {
    this.adminTaskManagerService.startTask();
    this.setStatusMessage.emit('Processing...');

    this.adminBackendApiService.generateDummyNewSkillDataAsync()
      .then(() => {
        this.setStatusMessage.emit(
          'Dummy new skill and questions generated successfully.');
      }, (errorResponse) => {
        this.setStatusMessage.emit(
          'Server error: ' + errorResponse);
      });
    this.adminTaskManagerService.finishTask();
  }

  generateNewClassroom(): void {
    this.adminTaskManagerService.startTask();
    this.setStatusMessage.emit('Processing...');

    this.adminBackendApiService.generateDummyClassroomDataAsync().then(() => {
      this.setStatusMessage.emit('Dummy new classroom generated successfully.');
    }, (errorResponse) => {
      this.setStatusMessage.emit(
        'Server error: ' + errorResponse);
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

    this.setStatusMessage.emit('Processing...');

    this.adminTaskManagerService.startTask();

    this.adminBackendApiService.reloadCollectionAsync(collectionId)
      .then(() => {
        this.setStatusMessage.emit('Data reloaded successfully.');
      }, (errorResponse) => {
        this.setStatusMessage.emit(
          'Server error: ' + errorResponse);
      });
    this.adminTaskManagerService.finishTask();
  }

  async getDataAsync(): Promise<void> {
    const adminDataObject = await this.adminDataService.getDataAsync();

    this.DEMO_EXPLORATIONS = adminDataObject.demoExplorations;
    this.DEMO_COLLECTIONS = adminDataObject.demoCollections;
    this.demoExplorationIds = adminDataObject.demoExplorationIds;
    this.reloadingAllExplorationPossible = true;
  }

  ngOnInit(): void {
    this.getDataAsync();
  }
}

angular.module('oppia').directive(
  'oppiaAdminDevModeActivitiesTab', downgradeComponent(
    {component: AdminDevModeActivitiesTabComponent}));
