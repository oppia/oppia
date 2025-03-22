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

import {Injectable} from '@angular/core';

import {Schema} from 'services/schema-default-value.service';

@Injectable({
  providedIn: 'root',
})
export class SchemaUndefinedLastElementService {
  // Returns true if the input value, taken as the last element in a list,
  // should be considered as 'undefined' and therefore deleted.
  getUndefinedValue(schema: Schema): string | undefined {
    if (schema.type === 'unicode' || schema.type === 'html') {
      return '';
    } else {
      return undefined;
    }
  }
}
