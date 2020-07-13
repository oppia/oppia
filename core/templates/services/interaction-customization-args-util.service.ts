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
 * @fileoverview Service for traversing interaction customization arguments.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import {
  SubtitledHtml, ISubtitledHtmlBackendDict, SubtitledHtmlObjectFactory
} from 'domain/exploration/SubtitledHtmlObjectFactory';
import {
  SubtitledUnicode, ISubtitledUnicodeBackendDict, SubtitledUnicodeObjectFactory
} from 'domain/exploration/SubtitledUnicodeObjectFactory';
import {
  IInteractionCustomizationArgsBackendDict, IInteractionCustomizationArgs
} from 'domain/exploration/InteractionObjectFactory';

const INTERACTION_SPECS = require('interactions/interaction_specs.json');

export type InteractionCustArgsConversionFn = (
  caValue: SubtitledHtml |
    SubtitledUnicode |
    ISubtitledHtmlBackendDict |
    ISubtitledUnicodeBackendDict,
  schemaObjType: 'SubtitledHtml' | 'SubtitledUnicode',
) => any;

interface Schema {
  type: string;
  'obj_type'?: string;
  items?: Schema;
  properties: {
    name: string;
    schema: Schema;
  }[]
}

@Injectable({providedIn: 'root'})
export class InteractionCustomizationArgsUtilService {
  constructor(
      private subtitledHtmlObjectFactory: SubtitledHtmlObjectFactory,
      private subtitledUnicodeObjectFactory: SubtitledUnicodeObjectFactory
  ) {}

  private applyConversionFnOnContent(
      value: any,
      schema: Schema,
      conversionFn: InteractionCustArgsConversionFn
  ) {
    const schemaType = schema.type;
    const schemaObjType = schema.obj_type;

    if (schemaObjType === 'SubtitledUnicode' ||
        schemaObjType === 'SubtitledHtml') {
      value = conversionFn(value, schemaObjType);
    } else if (schemaType === 'list') {
      for (let i = 0; i < value.length; i++) {
        value[i] = this.applyConversionFnOnContent(
          value[i],
          schema.items,
          conversionFn);
      }
    } else if (schemaType === 'dict') {
      schema.properties.forEach(property => {
        const name = property.name;
        value[name] = this.applyConversionFnOnContent(
          value[name],
          property.schema,
          conversionFn);
      });
    }

    return value;
  }

  private applyConversionFnOnSubtitled(
      value: any,
      conversionFn: InteractionCustArgsConversionFn
  ) {
    if (value instanceof SubtitledUnicode) {
      value = conversionFn(value, 'SubtitledUnicode');
    } else if (value instanceof SubtitledHtml) {
      value = conversionFn(value, 'SubtitledHtml');
    } else if (value instanceof Array) {
      for (let i = 0; i < value.length; i++) {
        value[i] = this.applyConversionFnOnSubtitled(
          value[i],
          conversionFn);
      }
    } else if (value instanceof Object) {
      Object.keys(value).forEach(key => {
        value[key] = this.applyConversionFnOnSubtitled(
          value[key],
          conversionFn);
      });
    }

    return value;
  }

  convertContent(
      interactionId: string,
      caValues:
        IInteractionCustomizationArgsBackendDict |
        IInteractionCustomizationArgs,
      conversionFn: InteractionCustArgsConversionFn
  ): void {
    const caSpecs = INTERACTION_SPECS[interactionId].customization_arg_specs;

    for (let caSpec of caSpecs) {
      const name = caSpec.name;
      if (name in caValues) {
        caValues[name].value = this.applyConversionFnOnContent(
          caValues[name].value, caSpec.schema, conversionFn);
      }
    }
  }

  fromBackendDict(
      interactionId: string,
      caValuesBackendDict: IInteractionCustomizationArgsBackendDict
  ): IInteractionCustomizationArgs {
    let caValues = angular.copy(caValuesBackendDict);

    let convertToSubtitled: InteractionCustArgsConversionFn = (
        caValue,
        schemaObjType
    ) => {
      if (schemaObjType === 'SubtitledHtml') {
        return this.subtitledHtmlObjectFactory.createFromBackendDict(
          <ISubtitledHtmlBackendDict> caValue);
      } else if (schemaObjType === 'SubtitledUnicode') {
        return this.subtitledUnicodeObjectFactory.createFromBackendDict(
          <ISubtitledUnicodeBackendDict> caValue);
      }
    };

    this.convertContent(interactionId, caValues, convertToSubtitled);
    return <IInteractionCustomizationArgs> caValues;
  }

  toBackendDict(
      caValues: IInteractionCustomizationArgs
  ): IInteractionCustomizationArgsBackendDict {
    let caValuesBackendDict = angular.copy(caValues);

    let convertSubtitledToBackendDict: InteractionCustArgsConversionFn = (
        caValue,
        _
    ) => {
      caValue = <SubtitledHtml | SubtitledUnicode> caValue;
      return caValue.toBackendDict();
    };

    Object.keys(caValuesBackendDict).forEach(key => {
      caValuesBackendDict[key] = this.applyConversionFnOnSubtitled(
        caValuesBackendDict[key], convertSubtitledToBackendDict);
    });
    return <IInteractionCustomizationArgsBackendDict> caValuesBackendDict;
  }
}

angular.module('oppia').factory(
  'InteractionCustomizationArgsUtilService',
  downgradeInjectable(InteractionCustomizationArgsUtilService));
