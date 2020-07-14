// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of Interaction
 * domain objects.
 */
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';

import { IAnswerGroupBackendDict, AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { IHintBackendDict, Hint, HintObjectFactory } from
  'domain/exploration/HintObjectFactory';
import { IOutcomeBackendDict, Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { ISolutionBackendDict, Solution, SolutionObjectFactory } from
  'domain/exploration/SolutionObjectFactory';
import {
  SubtitledUnicode, ISubtitledUnicodeBackendDict, SubtitledUnicodeObjectFactory
} from 'domain/exploration/SubtitledUnicodeObjectFactory';
import {
  SubtitledHtml, ISubtitledHtmlBackendDict, SubtitledHtmlObjectFactory
} from 'domain/exploration/SubtitledHtmlObjectFactory';
import {
  IInteractionCustomizationArgsBackendDict,
  IInteractionCustomizationArgs
} from 'interactions/customization-args-defs';

const INTERACTION_SPECS = require('interactions/interaction_specs.json');

export type InteractionCustArgsConversionFn<T, S> = (
  caValue: T,
  schemaObjType: 'SubtitledHtml' | 'SubtitledUnicode',
) => S;
type SubtitledBackendDicts = ISubtitledHtmlBackendDict |
  ISubtitledUnicodeBackendDict;
type Subtitled = SubtitledHtml | SubtitledUnicode;

export interface IInteractionBackendDict {
  'default_outcome': IOutcomeBackendDict;
  'answer_groups': IAnswerGroupBackendDict[];
  'confirmed_unclassified_answers': any;
  'customization_args': IInteractionCustomizationArgsBackendDict;
  'hints': IHintBackendDict[];
  'id': string;
  'solution': ISolutionBackendDict;
}
export interface CustomizationArgsSchema {
  type: string;
  'obj_type'?: string;
  items?: CustomizationArgsSchema;
  properties: {
    name: string;
    schema: CustomizationArgsSchema;
  }[]
}

const applyConversionFnOnCustArgsContent = function<T, S>(
    value: any,
    schema: CustomizationArgsSchema,
    conversionFn: InteractionCustArgsConversionFn<T, S>
) : any {
  const schemaType = schema.type;
  const schemaObjType = schema.obj_type;

  if (schemaObjType === 'SubtitledUnicode' ||
      schemaObjType === 'SubtitledHtml') {
    value = conversionFn(value, schemaObjType);
  } else if (schemaType === 'list') {
    for (let i = 0; i < value.length; i++) {
      value[i] = applyConversionFnOnCustArgsContent<T, S>(
        value[i],
        schema.items,
        conversionFn);
    }
  } else if (schemaType === 'dict') {
    schema.properties.forEach(property => {
      const name = property.name;
      value[name] = applyConversionFnOnCustArgsContent<T, S>(
        value[name],
        property.schema,
        conversionFn);
    });
  }

  return value;
};

const convertCustomizationArgsContent = function<T, S>(
    interactionId: string,
    caValues: IInteractionCustomizationArgsBackendDict |
      IInteractionCustomizationArgs,
    conversionFn: InteractionCustArgsConversionFn<T, S>
) : void {
  if (!interactionId || !(interactionId in INTERACTION_SPECS)) {
    return;
  }

  const caSpecs = INTERACTION_SPECS[interactionId].customization_arg_specs;

  for (let caSpec of caSpecs) {
    const name = caSpec.name;
    if (name in caValues) {
      caValues[name].value = applyConversionFnOnCustArgsContent(
        caValues[name].value, caSpec.schema, conversionFn);
    }
  }
};

export class Interaction {
  answerGroups: AnswerGroup[];
  confirmedUnclassifiedAnswers: any;
  customizationArgs: IInteractionCustomizationArgs;
  defaultOutcome: Outcome;
  hints: Hint[];
  id: string;
  solution: Solution;
  constructor(
      answerGroups: AnswerGroup[], confirmedUnclassifiedAnswers: any,
      customizationArgs: IInteractionCustomizationArgs,
      defaultOutcome: Outcome, hints: Hint[], id: string, solution: Solution) {
    this.answerGroups = answerGroups;
    this.confirmedUnclassifiedAnswers = confirmedUnclassifiedAnswers;
    this.customizationArgs = customizationArgs;
    this.defaultOutcome = defaultOutcome;
    this.hints = hints;
    this.id = id;
    this.solution = solution;
  }

  setId(newValue: string): void {
    this.id = newValue;
  }

  setAnswerGroups(newValue: AnswerGroup[]): void {
    this.answerGroups = newValue;
  }

  setDefaultOutcome(newValue: Outcome): void {
    this.defaultOutcome = newValue;
  }

  setCustomizationArgs(newValue: IInteractionCustomizationArgs): void {
    this.customizationArgs = newValue;
  }

  setSolution(newValue: Solution): void {
    this.solution = newValue;
  }

  setHints(newValue: Hint[]): void {
    this.hints = newValue;
  }

  copy(otherInteraction: Interaction): void {
    this.answerGroups = cloneDeep(otherInteraction.answerGroups);
    this.confirmedUnclassifiedAnswers =
      cloneDeep(otherInteraction.confirmedUnclassifiedAnswers);
    this.customizationArgs = cloneDeep(otherInteraction.customizationArgs);
    this.defaultOutcome = cloneDeep(otherInteraction.defaultOutcome);
    this.hints = cloneDeep(otherInteraction.hints);
    this.id = cloneDeep(otherInteraction.id);
    this.solution = cloneDeep(otherInteraction.solution);
  }

  static convertCustomizationArgsToBackendDict(
      caValues: IInteractionCustomizationArgs
  ): IInteractionCustomizationArgsBackendDict {
    caValues = angular.copy(caValues);

    const convertToBackendDict = (
        value: Array<Object> | Object
    ) => {
      if (value instanceof SubtitledUnicode || value instanceof SubtitledHtml) {
        value = value.toBackendDict();
      } else if (value instanceof Array) {
        for (let i = 0; i < value.length; i++) {
          value[i] = convertToBackendDict(value[i]);
        }
      } else if (value instanceof Object) {
        Object.keys(value).forEach(key => {
          value[key] = convertToBackendDict(value[key]);
        });
      }

      return value;
    };

    let caValuesBackendDict = {};
    Object.keys(caValues).forEach(key => {
      caValuesBackendDict[key] = (
        convertToBackendDict(caValues[key]));
    });
    return caValuesBackendDict;
  }

  toBackendDict(): IInteractionBackendDict {
    return {
      answer_groups: this.answerGroups.map(function(answerGroup) {
        return answerGroup.toBackendDict();
      }),
      confirmed_unclassified_answers: this.confirmedUnclassifiedAnswers,
      customization_args: Interaction.convertCustomizationArgsToBackendDict(
        this.customizationArgs),
      default_outcome:
        this.defaultOutcome ? this.defaultOutcome.toBackendDict() : null,
      hints: this.hints.map(function(hint) {
        return hint.toBackendDict();
      }),
      id: this.id,
      solution: this.solution ? this.solution.toBackendDict() : null
    };
  }

  static unwrapCustomizationArgsContent(
      interactionId: string,
      caValues: IInteractionCustomizationArgs
  ) {
    const unwrapSubtitled:
      InteractionCustArgsConversionFn<Subtitled, string> = (
          caValue,
          schemaObjType
      ) => {
        if (schemaObjType === 'SubtitledHtml') {
          return (<SubtitledHtml>caValue).getHtml();
        } else if (schemaObjType === 'SubtitledUnicode') {
          return (<SubtitledUnicode>caValue).getUnicode();
        }

        return '';
      };
    convertCustomizationArgsContent(interactionId, caValues, unwrapSubtitled);
  }
}

@Injectable({
  providedIn: 'root'
})
export class InteractionObjectFactory {
  constructor(
      private answerGroupFactory: AnswerGroupObjectFactory,
      private hintFactory: HintObjectFactory,
      private solutionFactory: SolutionObjectFactory,
      private outcomeFactory: OutcomeObjectFactory,
      private subtitledHtmlObjectFactory: SubtitledHtmlObjectFactory,
      private subtitledUnicodeObjectFactory: SubtitledUnicodeObjectFactory
  ) {}

  convertCustomizationArgsBackendDict(
      interactionId: string,
      caValuesBackendDict: IInteractionCustomizationArgsBackendDict
  ) : IInteractionCustomizationArgs {
    if (!caValuesBackendDict) {
      return {};
    }

    let caValues = angular.copy(caValuesBackendDict);

    let convertToSubtitled:
      InteractionCustArgsConversionFn<SubtitledBackendDicts, Subtitled> = (
          caValue, schemaObjType
      ) => {
        if (schemaObjType === 'SubtitledHtml') {
          return this.subtitledHtmlObjectFactory.createFromBackendDict(
            <ISubtitledHtmlBackendDict> caValue);
        } else if (schemaObjType === 'SubtitledUnicode') {
          return this.subtitledUnicodeObjectFactory.createFromBackendDict(
            <ISubtitledUnicodeBackendDict> caValue);
        }
      };

    convertCustomizationArgsContent(
      interactionId, caValues, convertToSubtitled);
    return <IInteractionCustomizationArgs> caValues;
  }

  createFromBackendDict(
      interactionDict: IInteractionBackendDict): Interaction {
    var defaultOutcome;
    if (interactionDict.default_outcome) {
      defaultOutcome = this.outcomeFactory.createFromBackendDict(
        interactionDict.default_outcome);
    } else {
      defaultOutcome = null;
    }
    return new Interaction(
      this.generateAnswerGroupsFromBackend(interactionDict.answer_groups),
      interactionDict.confirmed_unclassified_answers,
      this.convertCustomizationArgsBackendDict(
        interactionDict.id, interactionDict.customization_args),
      defaultOutcome,
      this.generateHintsFromBackend(interactionDict.hints),
      interactionDict.id,
      interactionDict.solution ? (
        this.generateSolutionFromBackend(interactionDict.solution)) : null);
  }

  generateAnswerGroupsFromBackend(
      answerGroupBackendDicts: IAnswerGroupBackendDict[]) {
    return answerGroupBackendDicts.map((
        answerGroupBackendDict) => {
      return this.answerGroupFactory.createFromBackendDict(
        answerGroupBackendDict);
    });
  }

  generateHintsFromBackend(hintBackendDicts: IHintBackendDict[]) {
    return hintBackendDicts.map((hintBackendDict) => {
      return this.hintFactory.createFromBackendDict(hintBackendDict);
    });
  }

  generateSolutionFromBackend(solutionBackendDict: ISolutionBackendDict) {
    return this.solutionFactory.createFromBackendDict(solutionBackendDict);
  }
}

angular.module('oppia').factory(
  'InteractionObjectFactory', downgradeInjectable(
    InteractionObjectFactory));
