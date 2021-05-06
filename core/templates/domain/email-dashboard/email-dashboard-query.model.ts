// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Frontend model for email dashboard query.
 */

export interface EmailDashboardQueryDict {
  'id': string;
  'status': string;
  'num_qualified_users': number;
  'submitter_username': string;
  'created_on': string;
}

export interface EmailDashboardQueryBackendDict {
  query: EmailDashboardQueryDict;
}

export class EmailDashboardQuery {
  id: string;
  status: string;
  numQualifiedUsers: number;
  submitterUsername: string;
  createdOn: string;

  constructor(
      id: string, status: string, numQualifiedUsers: number,
      submitterUsername: string, createdOn: string) {
    this.id = id;
    this.status = status;
    this.numQualifiedUsers = numQualifiedUsers;
    this.submitterUsername = submitterUsername;
    this.createdOn = createdOn;
  }

  static createFromQueryDict(
      queryDict: EmailDashboardQueryDict): EmailDashboardQuery {
    return new EmailDashboardQuery(
      queryDict.id, queryDict.status, queryDict.num_qualified_users,
      queryDict.submitter_username, queryDict.created_on);
  }

  static createFromBackendDict(
      backendDict: EmailDashboardQueryBackendDict): EmailDashboardQuery {
    return new EmailDashboardQuery(
      backendDict.query.id, backendDict.query.status,
      backendDict.query.num_qualified_users,
      backendDict.query.submitter_username, backendDict.query.created_on);
  }
}
