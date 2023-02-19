// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview ParameterizeRuleDescription Pipe for Oppia.
 */

import { Pipe, PipeTransform } from '@angular/core';
import { Fraction } from 'domain/objects/fraction.model';
import { Ratio } from 'domain/objects/ratio.model';
import { FormatRtePreviewPipe } from 'filters/format-rte-preview.pipe';
import { NumberWithUnitsObjectFactory } from 'domain/objects/NumberWithUnitsObjectFactory';
import { Rule } from 'domain/exploration/rule.model';
import { FractionAnswer, MusicNotesAnswer, NumberWithUnitsAnswer, RatioInputAnswer } from 'interactions/answer-defs';
import { TranslatableSetOfNormalizedString, TranslatableSetOfUnicodeString } from 'interactions/rule-input-defs';
import { AnswerChoice } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { AppConstants } from 'app.constants';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { InteractionSpecsKey } from 'pages/interaction-specs.constants';

@Pipe({
  name: 'parameterizeRuleDescriptionPipe'
})
export class ParameterizeRuleDescriptionPipe implements PipeTransform {
  constructor(
      private formatRtePreviewPipe: FormatRtePreviewPipe,
      private numberWithUnitsObjectFactory: NumberWithUnitsObjectFactory,
  ) { }

  transform(
      rule: Rule | null, interactionId: string | null,
      choices: AnswerChoice[] | null): string {
    if (!rule || !interactionId) {
      return '';
    }

    if (!INTERACTION_SPECS.hasOwnProperty(interactionId)) {
      console.error('Cannot find interaction with id ' + interactionId);
      return '';
    }

    let ruleTypesToDescriptions = INTERACTION_SPECS[
      interactionId as InteractionSpecsKey].rule_descriptions;

    type RuleTypeToDescription = {
      [key in keyof typeof ruleTypesToDescriptions]: string;
    };

    let description: string = ruleTypesToDescriptions[
      rule.type as keyof RuleTypeToDescription];
    if (!description) {
      console.error(
        'Cannot find description for rule ' + rule.type +
         ' for interaction ' + interactionId);
      return '';
    }

    var inputs = rule.inputs;
    var finalDescription = description;

    let PATTERN = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
    let iter = 0;
    while (true) {
      const match = description.match(PATTERN);
      if (!match || iter === 100) {
        break;
      }
      iter++;

      let varName = match[1];
      let varType = match[2];
      if (varType) {
        varType = varType.substring(1);
      }

      var replacementText = '[INVALID]';
      // Special case for MultipleChoiceInput, ImageClickInput, and
      // ItemSelectionInput.
      if (choices) {
        if (varType === 'SetOfTranslatableHtmlContentIds') {
          replacementText = '[';
          const key = inputs[varName] as string[];
          const contentIds = choices.map(choice => choice.val);

          for (let i = 0; i < key.length; i++) {
            const choiceIndex = contentIds.indexOf(key[i]);
            if (choiceIndex === -1) {
              replacementText += 'INVALID';
            } else {
              replacementText += this.formatRtePreviewPipe.transform(
                choices[choiceIndex].label);
            }
            if (i < key.length - 1) {
              replacementText += ',';
            }
          }
          replacementText += ']';
        } else if (varType === 'ListOfSetsOfTranslatableHtmlContentIds') {
          replacementText = '[';
          const key = inputs[varName] as string[];
          const contentIds = choices.map(choice => choice.val);

          for (var i = 0; i < key.length; i++) {
            replacementText += '[';
            for (var j = 0; j < key[i].length; j++) {
              const choiceIndex = contentIds.indexOf(key[i][j]);
              if (choiceIndex === -1) {
                replacementText += 'INVALID';
              } else {
                replacementText += this.formatRtePreviewPipe.transform(
                  choices[choiceIndex].label);
              }
            }
            replacementText += ']';
            if (i < key.length - 1) {
              replacementText += ',';
            }
          }
          replacementText += ']';
        } else if (varType === 'DragAndDropPositiveInt') {
          replacementText = inputs[varName] + '';
        } else {
          // The following case is for MultipleChoiceInput and
          // TranslatableHtmlContentId.
          for (var i = 0; i < choices.length; i++) {
            if (choices[i].val === inputs[varName]) {
              var filteredLabelText =
                 this.formatRtePreviewPipe.transform(choices[i].label);
              replacementText = '\'' + filteredLabelText + '\'';
            }
          }
        }
        // TODO(sll): Generalize this to use the inline string representation
        // of an object type.
      } else if (varType === 'MusicPhrase') {
        replacementText = '[';
        const key = inputs[varName] as MusicNotesAnswer[];
        for (var i = 0; i < Object.keys(key).length; i++) {
          if (i !== 0) {
            replacementText += ', ';
          }
          replacementText += key[i].readableNoteName;
        }
        replacementText += ']';
      } else if (varType === 'CoordTwoDim') {
        const key = inputs[varName] as Record<number, number>;
        let latitude = key[0] || 0.0;
        let longitude = key[1] || 0.0;
        replacementText = '(';
        replacementText += (
           key[0] >= 0.0 ?
           latitude.toFixed(2) + '°N' :
           -latitude.toFixed(2) + '°S');
        replacementText += ', ';
        replacementText += (
           key[1] >= 0.0 ?
           longitude.toFixed(2) + '°E' :
           -longitude.toFixed(2) + '°W');
        replacementText += ')';
      } else if (varType === 'Graph') {
        replacementText = '[reference graph]';
      } else if (varType === 'Fraction') {
        replacementText = Fraction.fromDict(
             (inputs[varName]) as FractionAnswer).toString();
      } else if (varType === 'NumberWithUnits') {
        replacementText = this.numberWithUnitsObjectFactory
          .fromDict((inputs[varName]) as NumberWithUnitsAnswer).toString();
      } else if (varType === 'TranslatableSetOfNormalizedString') {
        replacementText = '[';
        for (var i = 0; i < (
             inputs[varName] as TranslatableSetOfNormalizedString)
          .normalizedStrSet.length; i++) {
          if (i !== 0) {
            replacementText += ', ';
          }
          replacementText += (
                 (inputs[varName]) as TranslatableSetOfNormalizedString)
            .normalizedStrSet[i];
        }
        replacementText += ']';
      } else if (varType === 'TranslatableSetOfUnicodeString') {
        replacementText = '[';
        for (var i = 0; i < (
             inputs[varName] as TranslatableSetOfUnicodeString)
          .unicodeStrSet.length; i++) {
          if (i !== 0) {
            replacementText += ', ';
          }
          replacementText += (
                 inputs[varName] as TranslatableSetOfUnicodeString)
            .unicodeStrSet[i];
        }
        replacementText += ']';
      } else if (
        varType === 'Real' ||
         varType === 'NonnegativeInt' ||
         varType === 'Int' ||
         varType === 'PositiveInt'
      ) {
        replacementText = inputs[varName] + '';
      } else if (
        varType === 'CodeString' ||
         varType === 'UnicodeString' ||
         varType === 'NormalizedString' ||
         varType === 'AlgebraicExpression' ||
         varType === 'MathEquation' ||
         varType === 'NumericExpression'
      ) {
        replacementText = String(inputs[varName]);
      } else if (varType === 'PositionOfTerms') {
        for (var i = 0; i < AppConstants.POSITION_OF_TERMS_MAPPING.length;
          i++) {
          if (
            AppConstants.POSITION_OF_TERMS_MAPPING[i].name ===
            inputs[varName]) {
            replacementText =
               AppConstants.POSITION_OF_TERMS_MAPPING[i].humanReadableName;
          }
        }
      } else if (varType === 'RatioExpression') {
        replacementText = Ratio.fromList(
             (inputs[varName]) as RatioInputAnswer).toAnswerString();
      }

      // Replaces all occurances of $ with $$.
      // This makes sure that the next regex matching will yield
      // the same $ sign pattern as the input.
      replacementText = replacementText.split('$').join('$$');

      description = description.replace(PATTERN, ' ');
      finalDescription = finalDescription.replace(PATTERN, replacementText);
    }

    return finalDescription;
  }
}
