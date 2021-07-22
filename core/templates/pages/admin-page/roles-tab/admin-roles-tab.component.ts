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
 * @fileoverview Component for the Roles tab in the admin panel.
 */

import { Component, Output, EventEmitter} from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { AdminBackendApiService, RoleToActionsBackendResponse, UserRolesBackendResponse } from 'domain/admin/admin-backend-api.service';
import { CreatorTopicSummary } from 'domain/topic/creator-topic-summary.model';
import { AdminDataService } from '../services/admin-data.service';
import { AdminTaskManagerService } from '../services/admin-task-manager.service';

export interface ViewUserRolesAction {
  filterCriterion: string;
  role: string;
  username: string;
  isValid: () => boolean;
}

export interface UpdateRoleAction {
  newRole: string;
  username: string;
  topicId: string;
  isValid: () => boolean;
}

export interface AdminRolesFormData {
  viewUserRoles: ViewUserRolesAction;
  updateRole: UpdateRoleAction;
}

@Component({
  selector: 'oppia-admin-roles-tab',
  templateUrl: './admin-roles-tab.component.html'
})
export class AdminRolesTabComponent {
  @Output() setStatusMessage: EventEmitter<string> = new EventEmitter();
  userRolesResult: UserRolesBackendResponse = null;
  resultRolesVisible: boolean = false;
  topicSummaries: CreatorTopicSummary[] = null;
  roleToActions: RoleToActionsBackendResponse = null;
  formData: AdminRolesFormData;

  USER_FILTER_CRITERION_USERNAME = AppConstants.USER_FILTER_CRITERION_USERNAME;
  USER_FILTER_CRITERION_ROLE = AppConstants.USER_FILTER_CRITERION_ROLE;
  UPDATABLE_ROLES: UserRolesBackendResponse = {};
  VIEWABLE_ROLES: UserRolesBackendResponse = {};

  constructor(
    private adminBackendApiService: AdminBackendApiService,
    private adminDataService: AdminDataService,
    private adminTaskManagerService: AdminTaskManagerService,
  ) {}

  ngOnInit(): void {
    this.refreshFormData();
    this.setStatusMessage.emit('');
    this.adminDataService.getDataAsync().then((adminDataObject) => {
      this.UPDATABLE_ROLES = adminDataObject.updatableRoles;
      this.VIEWABLE_ROLES = adminDataObject.viewableRoles;
      this.topicSummaries = adminDataObject.topicSummaries;
      this.roleToActions = adminDataObject.roleToActions;
    });
  }

  handleErrorResponse(errorResponse: string): void {
    this.setStatusMessage.emit('Server error: ' + errorResponse);
  }

  submitRoleViewForm(formResponse: ViewUserRolesAction): void {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }

    this.setStatusMessage.emit('Processing query...');

    this.adminTaskManagerService.startTask();
    this.userRolesResult = {};
    this.adminBackendApiService.viewUsersRoleAsync(
      formResponse.filterCriterion, formResponse.role,
      formResponse.username
    ).then((userRoles) => {
      this.userRolesResult = userRoles;
      if (Object.keys(this.userRolesResult).length === 0) {
        this.resultRolesVisible = false;
        this.setStatusMessage.emit('No results.');
      } else {
        this.resultRolesVisible = true;
        this.setStatusMessage.emit('Success.');
      }
      this.refreshFormData();
    }, this.handleErrorResponse.bind(this));
    this.adminTaskManagerService.finishTask();
  }

  submitUpdateRoleForm(formResponse: UpdateRoleAction): void {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    this.setStatusMessage.emit('Updating User Role');
    this.adminTaskManagerService.startTask();
    this.adminBackendApiService.updateUserRoleAsync(
      formResponse.newRole, formResponse.username,
      formResponse.topicId
    ).then(() => {
      this.setStatusMessage.emit(
        'Role of ' + formResponse.username + ' successfully updated to ' +
        formResponse.newRole);
      this.refreshFormData();
    }, this.handleErrorResponse.bind(this));
    this.adminTaskManagerService.finishTask();
  }

  refreshFormData(): void {
    this.formData = {
      viewUserRoles: {
        filterCriterion: AppConstants.USER_FILTER_CRITERION_ROLE,
        role: null,
        username: '',
        isValid: function() {
          if (this.filterCriterion ===
            AppConstants.USER_FILTER_CRITERION_ROLE) {
            return Boolean(this.role);
          }
          if (this.filterCriterion ===
            AppConstants.USER_FILTER_CRITERION_USERNAME) {
            return Boolean(this.username);
          }
          return false;
        }
      },
      updateRole: {
        newRole: null,
        username: '',
        topicId: null,
        isValid: function() {
          if (this.newRole === 'TOPIC_MANAGER') {
            return Boolean(this.topicId);
          } else if (this.newRole) {
            return Boolean(this.username);
          }
          return false;
        }
      }
    };
  }

  clearResults(): void {
    this.resultRolesVisible = false;
    this.userRolesResult = {};
  }
}

angular.module('oppia').directive('oppiaAdminRolesTab',
  downgradeComponent({
    component: AdminRolesTabComponent
  }) as angular.IDirectiveFactory);
