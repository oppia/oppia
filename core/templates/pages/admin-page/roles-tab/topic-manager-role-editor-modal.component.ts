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
 * @fileoverview Component for editing user roles.
 */

import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AdminBackendApiService } from 'domain/admin/admin-backend-api.service';
import { AlertsService } from 'services/alerts.service';


@Component({
  selector: 'oppia-topic-manager-role-editor-modal',
  templateUrl: './topic-manager-role-editor-modal.component.html',
})
export class TopicManagerRoleEditorModalComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion, for more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() managedTopicIds!: string[];
  @Input() topicIdToName!: {[topicId: string]: string};
  @Input() username!: string;
  // Set to null when there are no topics to add.
  newTopicId: string | null = null;
  // Set to null when there are no topics to remove.
  topicIdInUpdate: string | null = null;
  topicIdsForSelection: string[] = [];

  constructor(
    private activeModal: NgbActiveModal,
    private adminBackendApiService: AdminBackendApiService,
    private alertsService: AlertsService
  ) {}

  private updateTopicIdsForSelection(): void {
    this.topicIdsForSelection = Object.keys(this.topicIdToName).filter(
      topicId => !this.managedTopicIds.includes(topicId));
    this.newTopicId = this.topicIdsForSelection[0];
  }

  addTopic(): void {
    if (this.newTopicId === null || this.topicIdInUpdate === null) {
      throw new Error('Topic id is null.');
    }
    this.managedTopicIds.push(this.newTopicId);
    this.topicIdInUpdate = this.newTopicId;
    this.newTopicId = null;
    this.adminBackendApiService.assignManagerToTopicAsync(
      this.username, this.topicIdInUpdate).then(()=> {
      this.topicIdInUpdate = null;
      this.updateTopicIdsForSelection();
    }, errorMessage => {
      if (this.newTopicId !== null) {
        let topicIdIndex = this.managedTopicIds.indexOf(
          this.newTopicId);
        this.managedTopicIds.splice(topicIdIndex, 1);
      }
      this.alertsService.addWarning(
        errorMessage || 'Error communicating with server.');
    });
  }

  removeTopicId(topicIdToRemove: string): void {
    let topicIdIndex = this.managedTopicIds.indexOf(topicIdToRemove);
    this.topicIdInUpdate = topicIdToRemove;
    this.adminBackendApiService.deassignManagerFromTopicAsync(
      this.username, topicIdToRemove).then(() => {
      this.managedTopicIds.splice(topicIdIndex, 1);
      this.topicIdInUpdate = null;
      this.updateTopicIdsForSelection();
    }, errorMessage => {
      this.alertsService.addWarning(
        errorMessage || 'Error communicating with server.');
    });
  }

  close(): void {
    this.activeModal.close(this.managedTopicIds);
  }

  ngOnInit(): void {
    this.updateTopicIdsForSelection();
  }
}
