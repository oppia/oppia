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
 * @fileoverview Component for the rule editor.
 */

import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, AfterViewChecked } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { EventBusGroup, EventBusService } from 'app-events/event-bus.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { ResponsesService } from 'pages/exploration-editor-page/editor-tab/services/responses.service';
import { PopulateRuleContentIdsService } from 'pages/exploration-editor-page/services/populate-rule-content-ids.service';
import { ObjectFormValidityChangeEvent } from 'app-events/app-events';
import DEFAULT_OBJECT_VALUES from 'objects/object_defaults.json';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { Rule } from 'domain/exploration/rule.model';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';

interface SelectItem {
  type: string;
  varName: string;
}

interface Choice {
  id: string;
  val: string | number | SubtitledHtml;
}

export interface RuleDescriptionFragment {
  type: string;
  varName: string;
  text: string;
}

@Component({
  selector: 'oppia-rule-editor',
  templateUrl: './rule-editor.component.html'
})
export class RuleEditorComponent
  implements OnInit, OnDestroy, AfterViewChecked {
  @Input() isEditable: boolean;
  @Input() isEditingRuleInline: boolean;
  @Output() onCancelRuleEdit = new EventEmitter<void>();
  @Output() onSaveRule = new EventEmitter<void>();
  @Input() rule: Rule;
  @Input() modalId: symbol;

  ruleDescriptionFragments: RuleDescriptionFragment[];
  currentInteractionId: string;
  ruleDescriptionChoices: Choice[];
  isInvalid: boolean;
  eventBusGroup: EventBusGroup;
  editRuleForm: object;

  constructor(
     private eventBusService: EventBusService,
     private stateInteractionIdService: StateInteractionIdService,
     private responsesService: ResponsesService,
     private populateRuleContentIdsService: PopulateRuleContentIdsService,
     private readonly changeDetectorRef: ChangeDetectorRef,
  ) {
    this.eventBusGroup = new EventBusGroup(this.eventBusService);
  }

  computeRuleDescriptionFragments(): string {
    if (!this.rule.type) {
      this.ruleDescriptionFragments = [];
      return '';
    }

    let ruleDescription = (
      INTERACTION_SPECS[
        this.currentInteractionId
      ].rule_descriptions[this.rule.type]);

    let PATTERN = /\{\{\s*(\w+)\s*\|\s*(\w+)\s*\}\}/;
    let finalInputArray = ruleDescription.split(PATTERN);

    let result = [];
    for (let i = 0; i < finalInputArray.length; i += 3) {
      result.push({
        // Omit the leading noneditable string.
        text: i !== 0 ? finalInputArray[i] : '',
        type: 'noneditable'
      });
      if (i === finalInputArray.length - 1) {
        break;
      }

      let answerChoices = this.responsesService.getAnswerChoices();

      if (answerChoices) {
        // This rule is for a multiple-choice, image-click, or item
        // selection interaction.
        // TODO(sll): Remove the need for this special case.
        if (answerChoices.length > 0) {
          if (
            finalInputArray[2] === 'SetOfTranslatableHtmlContentIds'
          ) {
            this.ruleDescriptionChoices = answerChoices.map(
              choice => ({
                id: choice.label,
                val: choice.val
              })
            );
            result.push({
              type: 'checkboxes',
              varName: finalInputArray[i + 1]
            });
          } else if (
            finalInputArray[2] ===
             'ListOfSetsOfTranslatableHtmlContentIds'
          ) {
            this.ruleDescriptionChoices = answerChoices.map(
              choice => ({
                id: choice.label,
                val: choice.val
              })
            );
            result.push({
              type: 'dropdown',
              varName: finalInputArray[i + 1]
            });
          } else if (
            finalInputArray[i + 2] === 'TranslatableHtmlContentId') {
            this.ruleDescriptionChoices = answerChoices.map(
              function(choice) {
                return {
                  id: choice.label,
                  val: choice.val
                };
              }
            );
            result.push({
              type: 'dragAndDropHtmlStringSelect',
              varName: finalInputArray[i + 1]
            });
          } else if (
            finalInputArray[i + 2] === 'DragAndDropPositiveInt') {
            this.ruleDescriptionChoices = answerChoices.map(
              function(choice) {
                return {
                  id: choice.label,
                  val: choice.val
                };
              }
            );
            result.push({
              type: 'dragAndDropPositiveIntSelect',
              varName: finalInputArray[i + 1]
            });
          } else {
            this.ruleDescriptionChoices = answerChoices.map(
              function(choice) {
                return {
                  id: choice.val as string,
                  val: choice.label
                };
              }
            );
            result.push({
              type: 'select',
              varName: finalInputArray[i + 1]
            });
            if (!this.rule.inputs[finalInputArray[i + 1]]) {
              this.rule.inputs[finalInputArray[i + 1]] = (
                this.ruleDescriptionChoices[0].id);
            }
          }
        } else {
          this.ruleDescriptionChoices = [];
          result.push({
            text: ' [Error: No choices available] ',
            type: 'noneditable'
          });
        }
      } else {
        result.push({
          type: finalInputArray[i + 2],
          varName: finalInputArray[i + 1]
        });
      }
    }

    // The following is necessary in order to ensure that the
    // object-editor HTML tags load correctly when the rule type is
    // changed. This is an issue for, e.g., the MusicNotesInput
    // interaction, where the rule inputs can sometimes be integers and
    // sometimes be lists of music notes.
    this.ruleDescriptionFragments = [];
    setTimeout(() => {
      this.ruleDescriptionFragments = result;
    }, 10);

    return ruleDescription;
  }

  onSelectionChangeHtmlSelect(selection: number, item: SelectItem): void {
    this.rule.inputs[item.varName] = selection;

    this.changeDetectorRef.detectChanges();
  }

  onSelectNewRuleType(newRuleType: string): void {
    let oldRuleInputs = cloneDeep(this.rule.inputs) || {};
    let oldRuleInputTypes = cloneDeep(this.rule.inputTypes) || {};

    this.rule.type = newRuleType;
    this.rule.inputs = {};
    this.rule.inputTypes = {};

    let tmpRuleDescription = this.computeRuleDescriptionFragments();
    // This provides the list of choices for the multiple-choice and
    // image-click interactions.
    let answerChoices = this.responsesService.getAnswerChoices();

    // Finds the parameters and sets them in ctrl.rule.inputs.
    let PATTERN = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
    while (true) {
      if (!tmpRuleDescription.match(PATTERN)) {
        break;
      }
      let varName = tmpRuleDescription.match(PATTERN)[1];
      let varType = null;
      if (tmpRuleDescription.match(PATTERN)[2]) {
        varType = tmpRuleDescription.match(PATTERN)[2].substring(1);
      }
      this.rule.inputTypes[varName] = varType;

      // TODO(sll): Find a more robust way of doing this. For example,
      // we could associate a particular varName with answerChoices
      // depending on the interaction. This varName would take its
      // default value from answerChoices, but other variables would
      // take their default values from the DEFAULT_OBJECT_VALUES dict.
      if (isEqual(DEFAULT_OBJECT_VALUES[varType], [])) {
        this.rule.inputs[varName] = [];
      } else if (answerChoices && answerChoices.length > 0) {
        this.rule.inputs[varName] = cloneDeep(
          answerChoices[0].val);
      } else {
        this.rule.inputs[varName] = cloneDeep(
          DEFAULT_OBJECT_VALUES[varType]);
      }

      tmpRuleDescription = tmpRuleDescription.replace(PATTERN, ' ');
    }

    for (let key in this.rule.inputs) {
      if (oldRuleInputs.hasOwnProperty(key) &&
       oldRuleInputTypes[key] === this.rule.inputTypes[key]) {
        this.rule.inputs[key] = oldRuleInputs[key];
      }
    }

    this.changeDetectorRef.detectChanges();
  }

  cancelThisEdit(): void {
    this.onCancelRuleEdit.emit();
  }

  saveThisRule(): void {
    this.populateRuleContentIdsService.populateNullRuleContentIds(this.rule);
    this.onSaveRule.emit();
    this.changeDetectorRef.detectChanges();
  }

  ngOnInit(): void {
    this.isInvalid = false;
    /**
       * Rule editors are usually used in two ways. Inline or in a modal.
       * When in a modal, the save button is in the modal html and when
       * inline it is in the rule editors template. When listening to the
       * object validity change event, we need to know which button to
       * disable. If we are inline, we disable the button in the
       * rule-editor template. Which is why we using the if condition
       * below.
       */
    if (this.isEditingRuleInline) {
      this.modalId = Symbol();
      this.eventBusGroup.on(
        ObjectFormValidityChangeEvent,
        event => {
          if (event.message.modalId === this.modalId) {
            this.isInvalid = event.message.value;
          }
        });
    }
    this.currentInteractionId = this.stateInteractionIdService.savedMemento;
    this.editRuleForm = {};
    // Select a default rule type, if one isn't already selected.
    if (this.rule.type === null) {
      this.onSelectNewRuleType(this.rule.type);
    }
    this.computeRuleDescriptionFragments();

    // List-of-sets-of-translatable-html-content-ids-editor
    // could not able to assign this.rule.inputTypes.x default values.
    if (this.rule.inputTypes.x === 'ListOfSetsOfTranslatableHtmlContentIds') {
      if (this.rule.inputs.x[0] === undefined ||
          this.rule.inputs.x[0]?.length === 0) {
        let box = [];
        (this.ruleDescriptionChoices).map(choice => {
          box.push([choice.val]);
        });
        this.rule.inputs.x = box;
      }
    } else if (this.rule.inputTypes.x === 'TranslatableHtmlContentId') {
      if (this.rule.inputs.x === null) {
        this.rule.inputs.x = this.ruleDescriptionChoices[0].val;
      }
    }
  }

  ngOnDestroy(): void {
    if (this.eventBusGroup) {
      this.eventBusGroup.unsubscribe();
    }
  }

  ngAfterViewChecked(): void {
    this.changeDetectorRef.detectChanges();
  }
}

angular.module('oppia').directive('oppiaRuleEditor',
 downgradeComponent({
   component: RuleEditorComponent
 }) as angular.IDirectiveFactory);
