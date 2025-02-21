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

import {Injectable} from '@angular/core';

import {LoggerService} from 'services/contextual/logger.service';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {
  SubtitledUnicodeObjectFactory,
  SubtitledUnicode,
} from 'domain/exploration/SubtitledUnicodeObjectFactory';
import {SchemaConstants} from 'components/forms/schema-based-editors/schema.constants';

interface BoolSchema {
  type: 'bool';
}

export interface UnicodeSchema {
  type: 'unicode';
  // 'choices' are optional because they may not be present in the schema.
  choices?: string[];
}

interface HtmlSchema {
  type: 'html';
  // 'choices' are optional because they may not be present in the schema.
  choices?: string[];
}

interface IntSchema {
  type: 'int';
  // 'choices' are optional because they may not be present in the schema.
  choices?: number[];
}

interface FloatSchema {
  type: 'float';
  // 'choices' are optional because they may not be present in the schema.
  choices?: number[];
}

export interface ListSchema {
  type: 'list';
  items: Schema | Schema[] | string;
}

export interface DictSchema {
  type: 'dict';
  properties: {
    name: string;
    schema: Schema;
  }[];
}

export interface CustomSchema {
  type: 'custom';
  obj_type: string;
}

export type Schema =
  | BoolSchema
  | UnicodeSchema
  | HtmlSchema
  | IntSchema
  | FloatSchema
  | ListSchema
  | DictSchema
  | CustomSchema;

interface DictSchemaDefaultValue {
  [property: string]: SchemaDefaultValue;
}

// SchemaDefaultValue is a value that is used to represent the default value
// of a property in a schema. It may be null as well when input is empty or not
// provided.
export type SchemaDefaultValue =
  | null
  | string
  | number
  | boolean
  | SubtitledUnicode
  | SubtitledHtml
  | SchemaDefaultValue[]
  | DictSchemaDefaultValue;

@Injectable({
  providedIn: 'root',
})
export class SchemaDefaultValueService {
  constructor(
    private logger: LoggerService,
    private subtitledUnicodeObjectFactory: SubtitledUnicodeObjectFactory
  ) {}

  // TODO(#20448): Rewrite this to take validators into account, so that
  // we always start with a valid value.
  getDefaultValue(schema: Schema): SchemaDefaultValue {
    const schemaIsSubtitledHtml =
      schema.type === SchemaConstants.SCHEMA_TYPE_CUSTOM &&
      schema.obj_type === SchemaConstants.SCHEMA_OBJ_TYPE_SUBTITLED_HTML;
    const schemaIsSubtitledUnicode =
      schema.type === SchemaConstants.SCHEMA_TYPE_CUSTOM &&
      schema.obj_type === SchemaConstants.SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE;

    if ('choices' in schema && schema.choices !== undefined) {
      return schema.choices[0];
    } else if (schemaIsSubtitledHtml) {
      return SubtitledHtml.createFromBackendDict({
        html: '',
        content_id: null,
      });
    } else if (schemaIsSubtitledUnicode) {
      return this.subtitledUnicodeObjectFactory.createFromBackendDict({
        unicode_str: '',
        content_id: null,
      });
    } else if (schema.type === SchemaConstants.SCHEMA_TYPE_BOOL) {
      return false;
    } else if (
      schema.type === SchemaConstants.SCHEMA_TYPE_UNICODE ||
      schema.type === SchemaConstants.SCHEMA_TYPE_HTML
    ) {
      return '';
    } else if (schema.type === SchemaConstants.SCHEMA_KEY_LIST) {
      var that = this;
      if (!Array.isArray(schema.items)) {
        return [];
      }
      return schema.items.map(item => {
        return that.getDefaultValue(item);
      });
    } else if (schema.type === SchemaConstants.SCHEMA_TYPE_DICT) {
      var result: SchemaDefaultValue = {};
      for (var i = 0; i < schema.properties.length; i++) {
        result[schema.properties[i].name] = this.getDefaultValue(
          schema.properties[i].schema
        );
      }
      return result;
    } else if (
      schema.type === SchemaConstants.SCHEMA_TYPE_INT ||
      schema.type === SchemaConstants.SCHEMA_TYPE_FLOAT
    ) {
      return 0;
    } else {
      this.logger.error('Invalid schema: ' + JSON.stringify(schema));
      throw new Error('Invalid Schema');
    }
  }
}
