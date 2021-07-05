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
 * @fileoverview Component for the blog admin page.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { BlogAdminBackendApiService, ConfigPropertiesBackendResponse, ConfigPropertyValues }
  from 'domain/blog-admin/blog-admin-backend-api.service';
import { BlogAdminDataService } from 'pages/blog-admin-page/services/blog-admin-data.service';
import { AdminTaskManagerService } from 'pages/admin-page/services/admin-task-manager.service';
import { Schema } from 'services/schema-default-value.service';
import { WindowRef } from 'services/contextual/window-ref.service';

interface UpdateRoleAction {
  newRole: string;
  username: string;
  isValid: () => boolean;
}

interface RemoveEditorRole {
  username: string
  isValid: () => boolean;
}

interface FormData {
  updateRole: UpdateRoleAction;
  removeEditorRole: RemoveEditorRole;
}

@Component({
  selector: 'oppia-blog-admin-page',
  templateUrl: './blog-admin-page.component.html',
})
export class BlogAdminPageComponent implements OnInit {
  UPDATABLE_ROLES = {};
  roleToActions;
  statusMessage: string = '';
  formData: FormData;
  configProperties: ConfigPropertiesBackendResponse = {};
  constructor(
    private backendApiService: BlogAdminBackendApiService,
    private blogAdminDataService: BlogAdminDataService,
    private adminTaskManagerService: AdminTaskManagerService,
    private windowRef: WindowRef,
  ) {}

  ngOnInit(): void {
    this.refreshFormData();
    this.blogAdminDataService.getDataAsync().then((DataObject) => {
      this.UPDATABLE_ROLES = DataObject.updatableRoles;
      this.roleToActions = DataObject.roleToActions;
    });
    this.reloadConfigProperties();
  }

  refreshFormData(): void {
    this.formData = {
      updateRole: {
        newRole: null,
        username: '',
        isValid(): boolean {
          if (this.newRole === 'BLOG_POST_EDITOR') {
            return Boolean(this.username);
          } else if (this.newRole === 'BLOG_ADMIN') {
            return Boolean(this.username);
          }
          return false;
        }
      },
      removeEditorRole: {
        username: '',
        isValid(): boolean {
          if (this.username === '') {
            return false;
          }
          return true;
        }
      }
    };
  }

  submitUpdateRoleForm(formResponse: UpdateRoleAction): void {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    this.statusMessage = 'Updating User Role';
    this.adminTaskManagerService.startTask();
    this.backendApiService.updateUserRoleAsync(
      formResponse.newRole, formResponse.username,
    ).then(() => {
      this.statusMessage = (
        'Role of ' + formResponse.username + ' successfully updated to ' +
        formResponse.newRole);
      this.refreshFormData();
    }, errorResponse => {
      this.statusMessage = 'Server error: ' + errorResponse;
    });
    this.adminTaskManagerService.finishTask();
  }

  submitRemoveEditorRoleForm(
      formResponse: RemoveEditorRole): void {
    if (this.adminTaskManagerService.isTaskRunning()) {
      return;
    }
    this.statusMessage = 'Processing query...';
    this.adminTaskManagerService.startTask();
    this.backendApiService.removeBlogEditorAsync(
      formResponse.username
    ).then(() => {
      this.statusMessage = 'Success.';
      this.refreshFormData();
    }, error => {
      this.statusMessage = 'Server error: ' + error.error.error;
    });
    this.adminTaskManagerService.finishTask();
  }

  reloadConfigProperties(): void {
    this.blogAdminDataService.getDataAsync().then((DataObject) => {
      this.configProperties = DataObject.configProperties;
    });
  }

  getSchemaCallback(schema: Schema): () => Schema {
    return () => {
      return schema;
    };
  }

  revertToDefaultConfigPropertyValue(configPropertyId: string): void {
    if (!this.windowRef.nativeWindow.confirm(
      'This action is irreversible. Are you sure?')) {
      return;
    }

    this.backendApiService.revertConfigPropertyAsync(configPropertyId)
      .then(() => {
        this.statusMessage = 'Config property reverted successfully.';
        this.reloadConfigProperties();
      }, errorResponse => {
        this.statusMessage = 'Server error: ' + errorResponse;
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

    this.statusMessage = 'Saving...';

    this.adminTaskManagerService.startTask();
    let newConfigPropertyValues = {};
    for (let property in this.configProperties) {
      newConfigPropertyValues[property] = this.configProperties[property].value;
    }

    this.backendApiService.saveConfigPropertiesAsync(
      newConfigPropertyValues as ConfigPropertyValues).then(() => {
      this.statusMessage = 'Data saved successfully.';
      this.adminTaskManagerService.finishTask();
    }, errorResponse => {
      this.statusMessage = 'Server error: ' + errorResponse;
      this.adminTaskManagerService.finishTask();
    });
  }
}

angular.module('oppia').directive(
  'oppiaBlogAdminPage', downgradeComponent(
    {component: BlogAdminPageComponent}));
