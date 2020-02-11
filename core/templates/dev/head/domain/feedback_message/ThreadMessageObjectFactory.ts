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
 * @fileoverview Factory for creating new frontend instances of thread message
 * domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class ThreadMessage {
  authorUsername: string;
  createdOn: number;
  entityType: string;
  entityId: string;
  messageId: number;
  receivedViaEmail: boolean;
  text: string = '';
  updatedStatus: string = null;
  updatedSubject: string = null;

  constructor(
      authorUsername: string, createdOn: number, entityType: string,
      entityId: string, messageId: number, receivedViaEmail: boolean,
      text: string, updatedStatus: string, updatedSubject: string) {
    this.authorUsername = authorUsername;
    this.createdOn = createdOn;
    this.entityType = entityType;
    this.entityId = entityId;
    this.messageId = messageId;
    this.receivedViaEmail = receivedViaEmail;
    this.text = text;
    this.updatedStatus = updatedStatus;
    this.updatedSubject = updatedSubject;
  }

  isNonempty(): boolean {
    return this.text.length > 0;
  }

  hasStatusUpdate(): boolean {
    return this.updatedStatus !== null;
  }

  hasSubjectUpdate(): boolean {
    return this.updatedSubject !== null;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ThreadMessageObjectFactory {
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'threadMessageBackendDict' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(threadMessageBackendDict: any): ThreadMessage {
    return new ThreadMessage(
      threadMessageBackendDict.author_username,
      threadMessageBackendDict.created_on, threadMessageBackendDict.entity_type,
      threadMessageBackendDict.entity_id, threadMessageBackendDict.message_id,
      threadMessageBackendDict.received_via_email,
      threadMessageBackendDict.text, threadMessageBackendDict.updated_status,
      threadMessageBackendDict.updated_subject);
  }
}
angular.module('oppia').factory(
  'ThreadMessageObjectFactory',
  downgradeInjectable(ThreadMessageObjectFactory));
