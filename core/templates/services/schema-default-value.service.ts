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
 * @fileoverview Service provides correct default value for
 * SchemaBasedList item.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { LoggerService } from 'services/contextual/logger.service';

@Injectable({
  providedIn: 'root'
})
export class SchemaDefaultValueService {
  constructor(private logger: LoggerService) {}
  // TODO(sll): Rewrite this to take validators into account, so that
  // we always start with a valid value.
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'schema' is a complex dict requiring very careful
  // backtracking.
  getDefaultValue(schema: any): any {
    if (schema.choices) {
      return schema.choices[0];
    } else if (schema.type === 'bool') {
      return false;
    } else if (schema.type === 'unicode' || schema.type === 'html') {
      return '';
    } else if (schema.type === 'list') {
      var that = this;
      return schema.items.map(function(item) {
        return that.getDefaultValue(item);
      });
    } else if (schema.type === 'dict') {
      var result = {};
      for (var i = 0; i < schema.properties.length; i++) {
        result[schema.properties[i].name] = this.getDefaultValue(
          schema.properties[i].schema);
      }
      return result;
    } else if (schema.type === 'int' || schema.type === 'float') {
      return 0;
    } else {
      this.logger.error('Invalid schema type: ' + schema.type);
    }
  }
}

angular.module('oppia').factory(
  'SchemaDefaultValueService', downgradeInjectable(SchemaDefaultValueService));
