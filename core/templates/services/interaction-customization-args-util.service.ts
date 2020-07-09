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
  SubtitledHtml, ISubtitledHtmlBackendDict
} from 'domain/exploration/SubtitledHtmlObjectFactory';
import {
  SubtitledUnicode, ISubtitledUnicodeBackendDict
} from 'domain/exploration/SubtitledUnicodeObjectFactory';

export type InteractionCustArgsConversionFn = (
  caValue: SubtitledHtml |
    SubtitledUnicode |
    ISubtitledHtmlBackendDict |
    ISubtitledUnicodeBackendDict,
  schemaObjType: 'SubtitledHtml' | 'SubtitledUnicode',
  contentId: string,
  inList: boolean
) => any;

@Injectable({providedIn: 'root'})
export class InteractionCustomizationArgsUtilService {
  private findSubtitled(
      ca: {value: any},
      caSpec: any,
      conversionFn: InteractionCustArgsConversionFn,
      contentId: string = 'custarg'
  ) {
    const schema = 'schema' in caSpec ? caSpec.schema : caSpec;
    const schemaType = schema.type;
    let schemaObjType;
    if (schemaType === 'custom') {
      schemaObjType = schema.obj_type;
    }

    if ('name' in caSpec) {
      contentId += '_' + caSpec.name;
    }

    if (
      schemaObjType === 'SubtitledUnicode' ||
      schemaObjType === 'SubtitledHtml'
    ) {
      if (ca.value instanceof SubtitledUnicode ||
          ca.value instanceof SubtitledHtml) {
        ca.value = conversionFn(ca.value, schemaObjType, contentId, false);
      } else if (Array.isArray(ca.value)) {
        for (let i = 0; i < ca.value.length; i++) {
          ca.value[i] = conversionFn(
            ca.value[i], schemaObjType, contentId, true);
        }
      } else if (typeof ca.value === 'object') {
        if ('content_id' in ca.value) {
          ca.value = conversionFn(ca.value, schemaObjType, contentId, false);
        } else {
          ca.value[caSpec.name] = conversionFn(
            ca.value[caSpec.name], schemaObjType, contentId, false);
        }
      }
    } else if (schemaType === 'list') {
      this.findSubtitled(
        ca, caSpec.schema.items, conversionFn, contentId);
    } else if (schemaType === 'dict') {
      for (let i = 0; i < caSpec.properties.length; i++) {
        this.findSubtitled(
          ca, caSpec.schema.properties[i], conversionFn, contentId);
      }
    }
  }

  convertTranslatable(
      caValues: {[caName: string]: any},
      caSpecs: any[],
      conversionFn: InteractionCustArgsConversionFn
  ) {
    for (let caSpec of caSpecs) {
      if (caSpec.name in caValues) {
        this.findSubtitled(caValues[caSpec.name], caSpec, conversionFn);
      }
    }
  }
}

angular.module('oppia').factory(
  'InteractionCustomizationArgsUtilService',
  downgradeInjectable(InteractionCustomizationArgsUtilService));
