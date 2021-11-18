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
 * @fileoverview Backend api service for fetching the admin data;
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
interface ConfigSchema {
  type: string;
  items?: {
      type: string;
  };
  validators?: {}[];
}

interface UserRolesBackendResponse {
  [role: string]: string;
}

interface RoleToActionsBackendResponse {
  [role: string]: string[];
}

export interface ConfigPropertiesBackendResponse {
  [property: string]: {
    description: string;
    value: string[] | number;
    schema: ConfigSchema;
  };
}

export interface ConfigPropertyValues {
  'max_number_of_tags_assigned_to_blog_post': number;
  'list_of_default_tags_for_blog_post': string[];
}

export interface BlogAdminPageDataBackendDict {
  'config_properties': ConfigPropertiesBackendResponse;
  'role_to_actions': RoleToActionsBackendResponse;
  'updatable_roles': UserRolesBackendResponse;
}

export interface BlogAdminPageData {
  configProperties: ConfigPropertiesBackendResponse;
  roleToActions: RoleToActionsBackendResponse;
  updatableRoles: UserRolesBackendResponse;
}

@Injectable({
  providedIn: 'root'
})

export class BlogAdminBackendApiService {
  constructor(private http: HttpClient) {}

  async getDataAsync(): Promise<BlogAdminPageData> {
    return new Promise((resolve, reject) => {
      this.http.get<BlogAdminPageDataBackendDict>(
        '/blogadminhandler').toPromise().then(response => {
        resolve({
          updatableRoles: response.updatable_roles,
          roleToActions: response.role_to_actions,
          configProperties: response.config_properties,
        });
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  private async _postRequestAsync(
      handlerUrl: string, payload: Object, action?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (action) {
        payload = {
          ...payload,
          action: action
        };
      }
      this.http.post<void>(
        handlerUrl, payload).toPromise()
        .then(response => {
          resolve(response);
        }, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }

  async saveConfigPropertiesAsync(
      newConfigPropertyValues: ConfigPropertyValues): Promise<void> {
    let action = 'save_config_properties';
    let payload = {
      new_config_property_values: newConfigPropertyValues
    };
    return this._postRequestAsync('/blogadminhandler', payload, action);
  }

  async revertConfigPropertyAsync(configPropertyId: string): Promise<void> {
    let action = 'revert_config_property';
    let payload = {
      config_property_id: configPropertyId
    };
    return this._postRequestAsync('/blogadminhandler', payload, action);
  }

  async updateUserRoleAsync(
      newRole: string, username: string): Promise<void> {
    let payload = {
      role: newRole,
      username: username,
    };
    return this._postRequestAsync(
      '/blogadminrolehandler', payload);
  }

  async removeBlogEditorAsync(username: string): Promise<Object> {
    return this.http.put(
      '/blogadminrolehandler', {
        username: username,
      }
    ).toPromise();
  }
}

angular.module('oppia').factory(
  'BlogAdminBackendApiService',
  downgradeInjectable(BlogAdminBackendApiService));
