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

import { SubtitledHtml } from 'domain/exploration/SubtitledHtmlObjectFactory';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';

export type InteractionCustArgsConversionFn = (
  caValue: SubtitledHtml | SubtitledUnicode,
  schemaObjType: 'SubtitledHtml' | 'SubtitledUnicode',
  contentId: string,
  inList: boolean
) => SubtitledHtml | SubtitledUnicode;

@Injectable({providedIn: 'root'})
export class InteractionCustomizationArgsUtilService {
  private findSubtitled(
      ca: {[id: string]: {value: any}},
      caSpec: any,
      conversionFn: InteractionCustArgsConversionFn,
      contentIdPrefix: string = 'custarg'
  ) {
    const schema = 'schema' in caSpec ? caSpec.schema : caSpec;
    const schemaType = schema.type;
    let schemaObjType;
    if (schemaType === 'custom') {
      schemaObjType = schema.obj_type;
    }

    if ('name' in caSpec) {
      contentIdPrefix += '_' + caSpec.name;
    }

    if (
      schemaObjType === 'SubtitledUnicode' ||
      schemaObjType === 'SubtitledHtml'
    ) {
      const caValue = ca.value;
    } else if (schemaType === 'list') {
      this.findSubtitled(
        ca, caSpec.schema.items, conversionFn, contentIdPrefix);
    } else if (schemaType === 'dict') {
      for (let i = 0; i < caSpec.properties.length; i++) {
        this.findSubtitled(
          ca, caSpec.schema.properties[i], conversionFn, contentIdPrefix);
      }
    }
  }
}

angular.module('oppia').factory(
  'InteractionCustomizationArgsUtilService',
  downgradeInjectable(InteractionCustomizationArgsUtilService));
