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

import { Component, Output, OnInit, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { AdminPageConstants } from 'pages/admin-page/admin-page.constants';

import { AdminDataService } from 'pages/admin-page/services/admin-data.service';
import { AdminTaskManagerService } from 'pages/admin-page/services/admin-task-manager.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'admin-dev-mode-activities-tab',
  templateUrl: './admin-dev-mode-activities-tab.component.html',
  styleUrls: []
})
export class AdminDevModeActivitiesTabComponent implements OnInit {
  @Output() setStatusMessage = new EventEmitter<string>();
  reloadingAllExplorationPossible: boolean;
  demoExplorationIds: string[] = [];
  numDummyExpsToPublish: number;
  numDummyExpsToGenerate: number;
  DEMO_COLLECTIONS: string[][];
  DEMO_EXPLORATIONS: string[][];

  constructor(
    private adminDataService: AdminDataService,
    private adminTaskManagerService: AdminTaskManagerService,
    private windowRef: WindowRef,
    private http: HttpClient
  ) {}

  reloadExploration(explorationId) {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    if (!this.windowRef.nativeWindow.confirm('This action is irreversible. Are you sure?')) {
      return;
    }

    this.setStatusMessage.emit('Processing...');

    this.adminTaskManagerService.startTask();
    this.http.post(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'reload_exploration',
      exploration_id: String(explorationId)
    }).toPromise().then(function() {
      this.setStatusMessage.emit('Data reloaded successfully.');
      this.adminTaskManagerService.finishTask();
    }, function(errorResponse) {
      this.setStatusMessage.emit(
        'Server error: ' + errorResponse.data.error);
      this.adminTaskManagerService.finishTask();
    });
  };

  printResult(numSucceeded, numFailed, numTried) {
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
  };

  reloadAllExplorations() {
    if (!this.reloadingAllExplorationPossible) {
      return;
    }
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    if (!this.windowRef.nativeWindow.confirm('This action is irreversible. Are you sure?')) {
      return;
    }

    this.setStatusMessage.emit('Processing...');
    this.adminTaskManagerService.startTask();

    var numSucceeded = 0;
    var numFailed = 0;
    var numTried = 0;

    for (var i = 0; i < this.demoExplorationIds.length; ++i) {
      var explorationId = this.demoExplorationIds[i];

      this.http.post(AdminPageConstants.ADMIN_HANDLER_URL, {
        action: 'reload_exploration',
        exploration_id: explorationId
      }).toPromise().then(function() {
        ++numSucceeded;
        ++numTried;
        this.printResult(numSucceeded, numFailed, numTried);
      }, function() {
        ++numFailed;
        ++numTried;
        this.printResult(numSucceeded, numFailed, numTried);
      });
    }
  };
  generateDummyExplorations() {
    // Generate dummy explorations with random title.
    if (this.numDummyExpsToPublish > this.numDummyExpsToGenerate) {
      this.setStatusMessage.emit(
        'Publish count should be less than or equal to generate count');
      return;
    }
    this.adminTaskManagerService.startTask();
    this.setStatusMessage.emit('Processing...');
    this.http.post(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_explorations',
      num_dummy_exps_to_generate: this.numDummyExpsToGenerate,
      num_dummy_exps_to_publish: this.numDummyExpsToPublish
    }).toPromise().then(function() {
      this.setStatusMessage.emit(
        'Dummy explorations generated successfully.');
    }, function(errorResponse) {
      this.setStatusMessage.emit(
        'Server error: ' + errorResponse.data.error);
    });
    this.adminTaskManagerService.finishTask();
  };

  loadNewStructuresData() {
    this.adminTaskManagerService.startTask();
    this.setStatusMessage.emit('Processing...');
    this.http.post(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_new_structures_data'
    }).toPromise().then(function() {
      this.setStatusMessage.emit(
        'Dummy new structures data generated successfully.');
    }, function(errorResponse) {
      this.setStatusMessage.emit(
        'Server error: ' + errorResponse.data.error);
    });
    this.adminTaskManagerService.finishTask();
  };

  generateNewSkillData() {
    this.adminTaskManagerService.startTask();
    this.setStatusMessage.emit('Processing...');
    this.http.post(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'generate_dummy_new_skill_data'
    }).toPromise().then(function() {
      this.setStatusMessage.emit(
        'Dummy new skill and questions generated successfully.');
    }, function(errorResponse) {
      this.setStatusMessage.emit(
        'Server error: ' + errorResponse.data.error);
    });
    this.adminTaskManagerService.finishTask();
  };

  reloadCollection(collectionId) {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    if (!this.windowRef.nativeWindow.confirm('This action is irreversible. Are you sure?')) {
      return;
    }

    this.setStatusMessage.emit('Processing...');

    this.adminTaskManagerService.startTask();
    this.http.post(AdminPageConstants.ADMIN_HANDLER_URL, {
      action: 'reload_collection',
      collection_id: String(collectionId)
    }).toPromise().then(function() {
      this.setStatusMessage.emit('Data reloaded successfully.');
    }, function(errorResponse) {
      this.setStatusMessage.emit(
        'Server error: ' + errorResponse.data.error);
    });
    this.adminTaskManagerService.finishTask();
  };

  async getDataAsync() {
    const adminDataObject = await this.adminDataService.getDataAsync();

    console.log(adminDataObject)

    this.DEMO_EXPLORATIONS = adminDataObject.demoExplorations;
    this.DEMO_COLLECTIONS = adminDataObject.demoCollections;
    this.demoExplorationIds = adminDataObject.demoExplorationIds;
    this.reloadingAllExplorationPossible = true;
  }

  ngOnInit() {
    this.numDummyExpsToPublish = 0;
    this.numDummyExpsToGenerate = 0;
    this.reloadingAllExplorationPossible = false;
    this.getDataAsync();
  }
}

angular.module('oppia').directive(
  'adminDevModeActivitiesTab', downgradeComponent(
    {component: AdminDevModeActivitiesTabComponent}));