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

import { Schema, DictSchema } from 'services/schema-default-value.service';
import { cloneDeep, isEqual } from 'lodash';

/**
 * @fileoverview Constants for schema types.
 */
export class SchemaConstants {
  static readonly SCHEMA_KEY_LIST = 'list';
  static readonly SCHEMA_TYPE_BOOL = 'bool';
  static readonly SCHEMA_TYPE_CUSTOM = 'custom';
  static readonly SCHEMA_TYPE_DICT = 'dict';
  static readonly SCHEMA_TYPE_FLOAT = 'float';
  static readonly SCHEMA_TYPE_HTML = 'html';
  static readonly SCHEMA_TYPE_INT = 'int';
  static readonly SCHEMA_TYPE_UNICODE = 'unicode';

  static readonly SUBTITLED_UNICODE_SCHEMA = {
    type: 'dict',
    properties: [{
      name: 'unicode_str',
      schema: {type: 'unicode'}
    }, {
      name: 'content_id',
      schema: {type: 'unicode_or_none'}
    }]
  };

  static readonly SUBTITLED_UNICODE_SCHEMA_BASE = {
    type: 'dict',
    properties: [{
      name: 'html',
      schema: {type: 'html'}
    }, {
      name: 'content_id',
      schema: {type: 'unicode_or_none'}
    }]
  };

  static isSubtitledUnicodeSchema = (schema: Schema) => {
    return isEqual(schema, SchemaConstants.SUBTITLED_UNICODE_SCHEMA);
  };

  static isSubtitledHtmlSchema = (schema: Schema) => {
    try {
      const schemaCopy = <DictSchema>cloneDeep(schema);
      schemaCopy.properties[0].schema = {
        type: 'html'
      };
      return isEqual(schemaCopy, SchemaConstants.SUBTITLED_UNICODE_SCHEMA_BASE);
    } catch {
      return false;
    }
  };
}
