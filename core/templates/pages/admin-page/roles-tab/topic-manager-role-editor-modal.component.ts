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

 import { AdminBackendApiService } from 'domain/admin/admin-backend-api.service'

 @Component({
   selector: 'dialog-overview-example-dialog',
   templateUrl: './topic-manager-role-editor-modal.component.html',
 })
 export class TopicManagerRoleEditorModalComponent implements OnInit {
  @Input() managerInTopicsWithId;
  @Input() topicIdToName;
  @Input() username;

  newTopicId = null;
  topicIdsForSelection = [];
  topicIdInUpdate = null;

  constructor(
    private activeModal: NgbActiveModal,
    private adminBackendApiService: AdminBackendApiService
    ) {}

  private updateTopicIdsForSelection() {
    this.topicIdsForSelection = Object.keys(this.topicIdToName).filter(
      topicId => !this.managerInTopicsWithId.includes(topicId));
    console.log(this.topicIdsForSelection)
  }

  addTopic() {
    this.managerInTopicsWithId.push(this.newTopicId);
    this.topicIdInUpdate = this.newTopicId;
    this.newTopicId = null;
    this.adminBackendApiService.addUserRoleAsync(
      'TOPIC_MANAGER', this.username, this.topicIdInUpdate).then(()=> {
        this.newTopicId = null;
        this.topicIdInUpdate = null;
        this.updateTopicIdsForSelection();
      });
  }

  removeTopicId(topicIdToRemove) {
    let topicIdIndex = this.managerInTopicsWithId.indexOf(topicIdToRemove);
    this.topicIdInUpdate = topicIdToRemove;
    this.adminBackendApiService.removeUserRoleAsync(
      'TOPIC_MANAGER', this.username, topicIdToRemove, false).then(() => {
        this.managerInTopicsWithId.splice(topicIdIndex, 1);
        this.topicIdInUpdate = null;
        this.updateTopicIdsForSelection();
      });
  }

  close() {
    this.activeModal.close(this.managerInTopicsWithId)
  }

  ngOnInit(){
    this.updateTopicIdsForSelection();
  }

 }