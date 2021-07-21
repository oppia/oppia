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

import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { downgradeComponent } from '@angular/upgrade/static';
import { AdminDataService } from '../services/admin-data.service';
import { AdminBackendApiService } from 'domain/admin/admin-backend-api.service';
import { TopicManagerRoleEditorModalComponent } from './topic-manager-role-editor-modal.component';
import { AlertsService } from 'services/alerts.service';

@Component({
  selector: 'oppia-admin-roles-tab',
  templateUrl: './admin-roles-tab.component.html'
})
export class AdminRolesTabComponent implements OnInit {
  UPDATABLE_ROLES = null;
  VIEWABLE_ROLES = null;
  topicSummaries = null;
  roleToActions = null;
  rolesFetched = false;

  roleSelectorIsShown = false;
  username = '';
  userRoles = [];
  possibleRolesToAdd = [];
  managedTopicIds = [];
  roleInUpdate = null;
  errorMessage = null;
  changingBannedValue = false;
  userIsBanned = false;
  roleIsCurrentlyBeingEdited = false;

  constructor(
    private adminDataService: AdminDataService,
    private adminBackendApiService: AdminBackendApiService,
    private alertsService: AlertsService,
    private modalService: NgbModal
  ) {}

  startEditing(): void {
    this.roleIsCurrentlyBeingEdited = true;
    this.adminBackendApiService.viewUsersRoleAsync(
      'username', null, this.username).then((userRoles) => {
      this.rolesFetched = true;
      this.userRoles = userRoles.roles;
      this.managedTopicIds = userRoles.managed_topic_ids;
      this.userIsBanned = userRoles.banned;
    });
  }

  showNewRoleSelector(): void {
    this.possibleRolesToAdd = Object.keys(this.UPDATABLE_ROLES).filter(
      role => !this.userRoles.includes(role)).sort();
    this.roleSelectorIsShown = true;
  }

  removeRole(roleToRemove: string): void {
    this.roleInUpdate = roleToRemove;

    var roleIndex = this.userRoles.indexOf(roleToRemove);
    this.adminBackendApiService.removeUserRoleAsync(
      roleToRemove, this.username).then(() => {
      if (roleToRemove === 'TOPIC_MANAGER') {
        this.managedTopicIds = [];
      }
      this.userRoles.splice(roleIndex, 1);
      this.roleInUpdate = null;
    });
  }

  openTopicManagerRoleEditor(): void {
    const modalRef = this.modalService.open(
      TopicManagerRoleEditorModalComponent);
    modalRef.componentInstance.managedTopicIds = (
      this.managedTopicIds);
    modalRef.componentInstance.username = this.username;
    let topicIdToName = {};
    this.topicSummaries.forEach(
      topicSummary => topicIdToName[topicSummary.id] = topicSummary.name);
    modalRef.componentInstance.topicIdToName = topicIdToName;
    modalRef.result.then(managedTopicIds => {
      this.managedTopicIds = managedTopicIds;
      if (
        !this.userRoles.includes('TOPIC_MANAGER') &&
        managedTopicIds.length) {
        this.userRoles.push('TOPIC_MANAGER');
      }
      this.roleSelectorIsShown = false;
    });
  }

  addNewRole(role: string): void {
    if (role === 'TOPIC_MANAGER') {
      this.openTopicManagerRoleEditor();
      return;
    }
    this.roleInUpdate = role;
    this.userRoles.push(role);
    this.roleSelectorIsShown = false;

    this.adminBackendApiService.addUserRoleAsync(
      role, this.username).then(() => {
      this.roleInUpdate = null;
    }, data => {
      var transformedData = data.responseText.substring(5);
      var parsedResponse = JSON.parse(transformedData);
      this.alertsService.addWarning(
        parsedResponse.error || 'Error communicating with server.');
    });
  }

  markUserBanned(): void {
    this.changingBannedValue = true;
    this.adminBackendApiService.markUserBannedAsync(this.username).then(() => {
      this.changingBannedValue = false;
      this.userIsBanned = true;
      this.userRoles = [];
    }, data => {
      var transformedData = data.responseText.substring(5);
      var parsedResponse = JSON.parse(transformedData);
      this.alertsService.addWarning(
        parsedResponse.error || 'Error communicating with server.');
    });
  }

  unmarkUserBanned(): void {
    this.changingBannedValue = true;
    this.adminBackendApiService.unmarkUserBannedAsync(
      this.username).then(() => {
      this.changingBannedValue = false;
      this.userIsBanned = false;
      this.startEditing();
    }, data => {
      var transformedData = data.responseText.substring(5);
      var parsedResponse = JSON.parse(transformedData);
      this.alertsService.addWarning(
        parsedResponse.error || 'Error communicating with server.');
    });
  }

  clearEditor(): void {
    this.rolesFetched = false;
    this.roleSelectorIsShown = false;
    this.username = '';
    this.userRoles = [];
    this.possibleRolesToAdd = [];
    this.managedTopicIds = [];
    this.roleInUpdate = null;
    this.changingBannedValue = false;
    this.userIsBanned = false;
    this.roleIsCurrentlyBeingEdited = false;
  }

  ngOnInit(): void {
    this.roleToActions = null;
    this.adminDataService.getDataAsync().then(adminDataObject => {
      this.UPDATABLE_ROLES = adminDataObject.updatableRoles;
      this.VIEWABLE_ROLES = adminDataObject.viewableRoles;
      this.topicSummaries = adminDataObject.topicSummaries;
      this.roleToActions = adminDataObject.roleToActions;
    });
  }
}

angular.module('oppia').directive('oppiaAdminRolesTab',
  downgradeComponent({
    component: AdminRolesTabComponent
  }) as angular.IDirectiveFactory);
