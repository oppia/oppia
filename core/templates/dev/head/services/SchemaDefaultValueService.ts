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

oppia.factory('SchemaDefaultValueService', [function() {
  return {
    // TODO(sll): Rewrite this to take validators into account, so that
    // we always start with a valid value.
    getDefaultValue: function(schema) {
      if (schema.choices) {
        return schema.choices[0];
      } else if (schema.type === 'bool') {
        return false;
      } else if (schema.type === 'unicode' || schema.type === 'html') {
        return '';
      } else if (schema.type === 'list') {
        return [this.getDefaultValue(schema.items)];
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
        console.error('Invalid schema type: ' + schema.type);
      }
    }
  };
}]);
