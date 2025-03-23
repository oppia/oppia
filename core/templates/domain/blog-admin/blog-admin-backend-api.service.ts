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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
interface PlatformParameterSchema {
  type: string;
}

interface UserRolesBackendResponse {
  [role: string]: string;
}

interface RoleToActionsBackendResponse {
  [role: string]: string[];
}

export interface PlatformParameterBackendResponse {
  [property: string]: {
    description: string;
    value: string[] | number;
    schema: PlatformParameterSchema;
  };
}

export interface PlatformParameterValues {
  max_number_of_tags_assigned_to_blog_post: number;
}

export interface BlogAdminPageDataBackendDict {
  platform_parameters: PlatformParameterBackendResponse;
  role_to_actions: RoleToActionsBackendResponse;
  updatable_roles: UserRolesBackendResponse;
}

export interface BlogAdminPageData {
  platformParameters: PlatformParameterBackendResponse;
  roleToActions: RoleToActionsBackendResponse;
  updatableRoles: UserRolesBackendResponse;
}

@Injectable({
  providedIn: 'root',
})
export class BlogAdminBackendApiService {
  constructor(private http: HttpClient) {}

  async getDataAsync(): Promise<BlogAdminPageData> {
    return new Promise((resolve, reject) => {
      this.http
        .get<BlogAdminPageDataBackendDict>('/blogadminhandler')
        .toPromise()
        .then(
          response => {
            resolve({
              updatableRoles: response.updatable_roles,
              roleToActions: response.role_to_actions,
              platformParameters: response.platform_parameters,
            });
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  private async _postRequestAsync(
    handlerUrl: string,
    payload: Object,
    action?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (action) {
        payload = {
          ...payload,
          action: action,
        };
      }
      this.http
        .post<void>(handlerUrl, payload)
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async savePlatformParametersAsync(
    newPlatformParameterValues: PlatformParameterValues
  ): Promise<void> {
    let action = 'save_platform_parameters';
    let payload = {
      new_platform_parameter_values: newPlatformParameterValues,
    };
    return this._postRequestAsync('/blogadminhandler', payload, action);
  }

  async updateUserRoleAsync(newRole: string, username: string): Promise<void> {
    let payload = {
      role: newRole,
      username: username,
    };
    return this._postRequestAsync('/blogadminrolehandler', payload);
  }

  async removeBlogEditorAsync(username: string): Promise<Object> {
    return this.http
      .put('/blogadminrolehandler', {
        username: username,
      })
      .toPromise();
  }
}
