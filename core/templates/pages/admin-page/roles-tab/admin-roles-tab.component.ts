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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { downgradeComponent } from '@angular/upgrade/static';
import { AdminDataService } from "../services/admin-data.service";
import { AdminBackendApiService } from 'domain/admin/admin-backend-api.service'
import { TopicManagerRoleEditorModalComponent } from "./topic-manager-role-editor-modal.component";
import { TopicSummary } from 'domain/topic/topic-summary.model';
import { AlertsService } from 'services/alerts.service';


@Component({
  selector: 'oppia-roles-editor',
  templateUrl: './admin-roles-tab.directive.html'
})
export class RolesEditorComponent implements OnInit {
  UPDATABLE_ROLES = null;
  VIEWABLE_ROLES = null;
  topicSummaries = null;
  roleToActions = null;
  rolesFetched = false;
  selectingNewRole = false;
  username = '';
  userRoles = [];
  possibleRolesToAdd = [];
  managerInTopicsWithId = [];
  roleInUpdate = null;
  errorMessage = null;
  changingBannedVlaue = false;
  userIsBanned = false;

  constructor(
    private adminDataService: AdminDataService,
    private adminBackendApiService: AdminBackendApiService,
    private alertsService: AlertsService,
    private modalService: NgbModal
  ) {}

  startEditing() {
    this.adminBackendApiService.viewUsersRoleAsync(
      'username', null, this.username).then((userRoles) => {
        this.rolesFetched = true;
        this.userRoles = userRoles.roles;
        this.managerInTopicsWithId = userRoles.topic_ids;
        this.userIsBanned = userRoles.banned;
        console.log(userRoles)
      });
  }

  addRole() {
    this.possibleRolesToAdd = Object.keys(this.UPDATABLE_ROLES).filter(
      role => !this.userRoles.includes(role))
    this.selectingNewRole = true;
  }

  removeRole(roleToRemove) {
    this.roleInUpdate = roleToRemove;
    let removeFromAllTopics = roleToRemove == 'TOPIC_MANAGER';
    var roleIndex = this.userRoles.indexOf(roleToRemove);
    this.adminBackendApiService.removeUserRoleAsync(
      roleToRemove, this.username, null, removeFromAllTopics).then(() => {
        if (removeFromAllTopics) {
          this.managerInTopicsWithId = [];
        }
        this.userRoles.splice(roleIndex, 1);
        this.roleInUpdate = null;
      });
  }

  openTopicManagerRoleEditor() {
    const modalRef = this.modalService.open(
      TopicManagerRoleEditorModalComponent);
    modalRef.componentInstance.managerInTopicsWithId = (
      this.managerInTopicsWithId);
    modalRef.componentInstance.username = this.username;
    let topicIdToName = {}
    this.topicSummaries.forEach(
      topicSummary => topicIdToName[topicSummary.id] = topicSummary.name);
    modalRef.componentInstance.topicIdToName = topicIdToName;
    modalRef.result.then(managerInTopicsWithId => {
      this.managerInTopicsWithId = managerInTopicsWithId;
      console.log(managerInTopicsWithId)
      if(
        !this.userRoles.includes('TOPIC_MANAGER') &&
        managerInTopicsWithId.length) {
        this.userRoles.push('TOPIC_MANAGER');
      }
      this.selectingNewRole = false;
    });
  }

  addNewRole(role) {
    if(role === 'TOPIC_MANAGER') {
      this.openTopicManagerRoleEditor();
      return;
    }
    this.roleInUpdate = role;
    this.userRoles.push(role);
    this.selectingNewRole = false;

    this.adminBackendApiService.addUserRoleAsync(
      role, this.username, null).then(() => {
        this.roleInUpdate = null;
      }, data => {
        console.log(data);
        var transformedData = data.responseText.substring(5);
        var parsedResponse = JSON.parse(transformedData);
        this.alertsService.addWarning(
          parsedResponse.error || 'Error communicating with server.');
      });
  }

  markUserBanned() {
    this.changingBannedVlaue = true;

    this.adminBackendApiService.markUserBannedAsync(this.username).then(() => {
        this.changingBannedVlaue = false;
        this.userIsBanned = true;
        this.userRoles = [];
      }, data => {
        console.log(data);
        var transformedData = data.responseText.substring(5);
        var parsedResponse = JSON.parse(transformedData);
        this.alertsService.addWarning(
          parsedResponse.error || 'Error communicating with server.');
      });
  }

  unmarkUserBanned() {
    this.changingBannedVlaue = true;

    this.adminBackendApiService.unmarkUserBannedAsync(
      this.username).then((response) => {
        this.changingBannedVlaue = false;
        this.userIsBanned = false;
        this.startEditing();
      }, data => {
        console.log(data);
        var transformedData = data.responseText.substring(5);
        var parsedResponse = JSON.parse(transformedData);
        this.alertsService.addWarning(
          parsedResponse.error || 'Error communicating with server.');
      });
  }

  clearEditor() {
    this.topicSummaries = null;
    this.rolesFetched = false;
    this.selectingNewRole = false;
    this.username = '';
    this.userRoles = [];
    this.possibleRolesToAdd = [];
    this.managerInTopicsWithId = [];
    this.roleInUpdate = null;
    this.changingBannedVlaue = false;
    this.userIsBanned = false;
  }

  ngOnInit() {
    this.roleToActions = null;
    this.adminDataService.getDataAsync().then(adminDataObject => {
      this.UPDATABLE_ROLES = adminDataObject.updatableRoles;
      this.VIEWABLE_ROLES = adminDataObject.viewableRoles;
      this.topicSummaries = adminDataObject.topicSummaries;
      this.roleToActions = adminDataObject.roleToActions;
    });
  }

}

angular.module('oppia').directive('oppiaRolesEditor',
  downgradeComponent({
    component: RolesEditorComponent
  }) as angular.IDirectiveFactory);
