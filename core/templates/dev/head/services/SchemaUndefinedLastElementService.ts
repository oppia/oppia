// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to check if the last element of SchemaBasedList
 * is undefined.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

@Injectable({
  providedIn: 'root'
})
export class SchemaUndefinedLastElementService {
  // Returns true if the input value, taken as the last element in a list,
  // should be considered as 'undefined' and therefore deleted.
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'schema' is a complex dict requiring very careful
  // backtracking.
  getUndefinedValue(schema: any): any {
    if (schema.type === 'unicode' || schema.type === 'html') {
      return '';
    } else {
      return undefined;
    }
  }
}

angular.module('oppia').factory(
  'SchemaUndefinedLastElementService',
  downgradeInjectable(SchemaUndefinedLastElementService));
