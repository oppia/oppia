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

export class ThreadMessageSummary {
  authorUsername: string;
  text: string = '';

  constructor(authorUsername: string, text: string) {
    this.authorUsername = authorUsername;
    this.text = text;
  }

  isNonempty(): boolean {
    return this.text.length > 0;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ThreadMessageSummaryObjectFactory {
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'threadMessageSummaryBackendDict' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(threadMessageSummaryBackendDict: any):
    ThreadMessageSummary {
    return new ThreadMessageSummary(
      threadMessageSummaryBackendDict.author_username,
      threadMessageSummaryBackendDict.text);
  }
}
angular.module('oppia').factory(
  'ThreadMessageSummaryObjectFactory',
  downgradeInjectable(ThreadMessageSummaryObjectFactory));
