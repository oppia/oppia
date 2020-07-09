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
 * @fileoverview Factory for creating new frontend instances of
 * InteractionCustomizationArgs domain objects.
 */
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import {
  IInteractionCustomizationArgsValue,
  IInteractionCustomizationArgsValueBackendDict
} from 'interactions/customization-args-defs';
import {
  SubtitledHtmlObjectFactory, ISubtitledHtmlBackendDict, SubtitledHtml
} from './SubtitledHtmlObjectFactory';
import {
  SubtitledUnicodeObjectFactory, ISubtitledUnicodeBackendDict, SubtitledUnicode
} from './SubtitledUnicodeObjectFactory';
import {
  InteractionCustArgsConversionFn, InteractionCustomizationArgsUtilService
} from 'services/interaction-customization-args-util.service';

const INTERACTION_SPECS = require('interactions/interaction_specs.json');

export interface IInteractionCustomizationArgsBackendDict {
  [customizationArgName: string]: {
    value: {
      IInteractionCustomizationArgsValueBackendDict
    }
  }
}

export class InteractionCustomizationArgs {
  constructor(
      public interactionId: string | null,
      public values: IInteractionCustomizationArgsValue
  ) {}

  clear() {
    this.values = {};
    this.interactionId = null;
  }

  setValue(name: string, value: any) {
    this.values[name] = value;
  }
}

@Injectable({
  providedIn: 'root'
})
export class InteractionCustomizationArgsObjectFactory {
  constructor(
      private interactionCustomizationArgsUtilService:
        InteractionCustomizationArgsUtilService,
      private subtitledHtmlObjectFactory: SubtitledHtmlObjectFactory,
      private subtitledUnicodeObjectFactory: SubtitledUnicodeObjectFactory,
  ) {}

  createFromBackendDict(
      interactionId: string,
      customizationArgsBackendDict: IInteractionCustomizationArgsBackendDict
  ): InteractionCustomizationArgs {
    if (!interactionId) {
      return new InteractionCustomizationArgs(interactionId, {});
    }

    let caValues = angular.copy(customizationArgsBackendDict);

    /**
     * Convert all ISubtitledUnicodeBackendDict => SubtitledUnicode, and
     * ISubtitledHtmlBackendDict => SubtitledHtml.
     */
    let conversionFn: InteractionCustArgsConversionFn = (
        caValue,
        schemaObjType,
        unusedContentId,
        unusedInList
    ) => {
      if (schemaObjType === 'SubtitledHtml') {
        caValue = <ISubtitledHtmlBackendDict>caValue;
        return this.subtitledHtmlObjectFactory.createFromBackendDict(caValue);
      } else if (schemaObjType === 'SubtitledUnicode') {
        caValue = <ISubtitledUnicodeBackendDict>caValue;
        return (
          this.subtitledUnicodeObjectFactory.createFromBackendDict(caValue));
      }
    };

    this.interactionCustomizationArgsUtilService.convertTranslatable(
      caValues,
      INTERACTION_SPECS[interactionId].customization_arg_specs,
      conversionFn);
    return new InteractionCustomizationArgs(interactionId, caValues);
  }

  toBackendDict(
      customizationArgsObject: InteractionCustomizationArgs
  ): IInteractionCustomizationArgsBackendDict {
    if (!customizationArgsObject.interactionId) {
      return {};
    }

    let caValues = angular.copy(customizationArgsObject.values);

    /**
     * Convert all ISubtitledUnicodeBackendDict => SubtitledUnicode, and
     * ISubtitledHtmlBackendDict => SubtitledHtml.
     */
    let conversionFn: InteractionCustArgsConversionFn = (
        caValue,
        schemaObjType,
        unusedContentId,
        unusedInList
    ) => {
      if (schemaObjType === 'SubtitledHtml') {
        caValue = <SubtitledHtml>caValue;
        return caValue.toBackendDict();
      } else if (schemaObjType === 'SubtitledUnicode') {
        caValue = <SubtitledUnicode>caValue;
        return caValue.toBackendDict();
      }
    };

    this.interactionCustomizationArgsUtilService.convertTranslatable(
      caValues,
      INTERACTION_SPECS[
        customizationArgsObject.interactionId].customization_arg_specs,
      conversionFn);
    return <IInteractionCustomizationArgsBackendDict>caValues;
  }
}

angular.module('oppia').factory(
  'InteractionCustomizationArgsObjectFactory',
  downgradeInjectable(InteractionCustomizationArgsObjectFactory));
