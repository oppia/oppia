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
 * @fileoverview Factory for creating an interaction customization argument.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { Schema } from 'services/schema-default-value.service';
import {
  SubtitledHtml, SubtitledHtmlObjectFactory, SubtitledHtmlBackendDict
} from 'domain/exploration/SubtitledHtmlObjectFactory';
import {
  SubtitledUnicode, SubtitledUnicodeObjectFactory, SubtitledUnicodeBackendDict
} from 'domain/exploration/SubtitledUnicodeObjectFactory';
import {
  InteractionCustomizationArgsBackendDictValue,
  InteractionCustomizationArgsValue
} from 'interactions/customization-args-defs';
import { cloneDeep } from 'lodash';
import { SchemaConstants } from
  'components/forms/schema-based-editors/schema-constants';

export interface InteractionCustomizationArgBackendDict {
  value: InteractionCustomizationArgsBackendDictValue
}

export class InteractionCustomizationArg {
  constructor(public value: InteractionCustomizationArgsValue) {}

  toBackendDict(): InteractionCustomizationArgBackendDict {
    const traverseSchemaAndConvertSubtitledToDicts = (
        value: Array<Object> | Object
    ): InteractionCustomizationArgsBackendDictValue => {
      let result: InteractionCustomizationArgsBackendDictValue;

      if (value instanceof SubtitledUnicode || value instanceof SubtitledHtml) {
        result = value.toBackendDict();
      } else if (value instanceof Array) {
        result = [];
        for (let i = 0; i < value.length; i++) {
          result[i] = traverseSchemaAndConvertSubtitledToDicts(value[i]);
        }
      } else if (value instanceof Object) {
        result = {};
        Object.keys(value).forEach(key => {
          result[key] = traverseSchemaAndConvertSubtitledToDicts(value[key]);
        });
      }

      return result || value;
    };

    return {
      value: traverseSchemaAndConvertSubtitledToDicts(this.value)
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class InteractionCustomizationArgObjectFactory {
  constructor(
    private subtitledHtmlObjectFactory: SubtitledHtmlObjectFactory,
    private subtitledUnicodeObjectFactory: SubtitledUnicodeObjectFactory
  ) {}

  createFromBackendDict(
      customizationArgBackendDict:
        InteractionCustomizationArgBackendDict,
      customizationArgSchema: Schema
  ): InteractionCustomizationArg {
    const traverseSchemaAndConvertSubtitledFromDicts = (
        value: InteractionCustomizationArgsBackendDictValue,
        schema: Schema
    ): InteractionCustomizationArgsValue => {
      let result: InteractionCustomizationArgsValue = value;
      if (schema.type === SchemaConstants.SCHEMA_KEY_LIST) {
        for (
          let i = 0;
          i < (<InteractionCustomizationArgsBackendDictValue[]>value).length;
          i++
        ) {
          result[i] = traverseSchemaAndConvertSubtitledFromDicts(
            value[i],
            <Schema> schema.items);
        }
      } else if (schema.type === SchemaConstants.SCHEMA_TYPE_DICT) {
        schema.properties.forEach(property => {
          const name = property.name;
          result[name] = traverseSchemaAndConvertSubtitledFromDicts(
            value[name],
            property.schema);
        });
      } else if (schema.type === SchemaConstants.SCHEMA_TYPE_CUSTOM) {
        if (schema.obj_type ===
            SchemaConstants.SCHEMA_OBJ_TYPE_SUBTITLED_HTML
        ) {
          result = this.subtitledHtmlObjectFactory.createFromBackendDict(
            <SubtitledHtmlBackendDict> value);
        } else if (schema.obj_type ===
            SchemaConstants.SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE) {
          result = this.subtitledUnicodeObjectFactory.createFromBackendDict(
            <SubtitledUnicodeBackendDict> value);
        }
      }

      return result;
    };
    const customizationArg = traverseSchemaAndConvertSubtitledFromDicts(
      cloneDeep(customizationArgBackendDict).value,
      customizationArgSchema
    );

    return new InteractionCustomizationArg(customizationArg);
  }
}

angular.module('oppia').factory(
  'InteractionCustomizationArgObjectFactory',
  downgradeInjectable(InteractionCustomizationArgObjectFactory));
