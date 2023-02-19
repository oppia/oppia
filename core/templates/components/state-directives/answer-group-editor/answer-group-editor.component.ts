// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the answer group editor.
 */

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AnswerChoice, StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { Rule } from 'domain/exploration/rule.model';
import isEqual from 'lodash/isEqual';
import { ResponsesService } from 'pages/exploration-editor-page/editor-tab/services/responses.service';
import { TrainingDataEditorPanelService } from 'pages/exploration-editor-page/editor-tab/training-panel/training-data-editor-panel.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { Subscription } from 'rxjs';
import { AlertsService } from 'services/alerts.service';
import cloneDeep from 'lodash/cloneDeep';
import { AppConstants } from 'app.constants';
import { ExternalSaveService } from 'services/external-save.service';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { BaseTranslatableObject } from 'interactions/rule-input-defs';

interface TaggedMisconception {
  skillId: string;
  misconceptionId: number;
}

@Component({
  selector: 'oppia-answer-group-editor',
  templateUrl: './answer-group-editor.component.html'
})
export class AnswerGroupEditor implements OnInit, OnDestroy {
  @Input() displayFeedback: boolean;
  @Input() taggedSkillMisconceptionId: string;
  @Input() isEditable: boolean;
  @Input() outcome: Outcome;
  @Input() rules: Rule[];
  @Input() suppressWarnings: boolean;
  @Input() addState: (value: string) => void;
  @Output() onSaveAnswerGroupRules = new EventEmitter<Rule[]>();
  @Output() onSaveAnswerGroupCorrectnessLabel = new EventEmitter<Outcome>();
  @Output() onSaveNextContentIdIndex = new EventEmitter();
  @Output() onSaveAnswerGroupDest = new EventEmitter<Outcome>();
  @Output() onSaveAnswerGroupDestIfStuck = new EventEmitter<Outcome>();
  @Output() onSaveAnswerGroupFeedback = new EventEmitter<Outcome>();
  @Output() onSaveTaggedMisconception = new EventEmitter<TaggedMisconception>();

  rulesMemento: Rule[];
  directiveSubscriptions = new Subscription();
  originalContentIdToContent: object;
  activeRuleIndex: number;
  answerChoices: AnswerChoice[];
  editAnswerGroupForm: object;

  constructor(
    private stateEditorService: StateEditorService,
    private responsesService: ResponsesService,
    private stateInteractionIdService: StateInteractionIdService,
    private alertsService: AlertsService,
    private trainingDataEditorPanelService: TrainingDataEditorPanelService,
    private externalSaveService: ExternalSaveService,
  ) {}

  sendOnSaveTaggedMisconception(event: TaggedMisconception): void {
    this.onSaveTaggedMisconception.emit(event);
  }

  sendOnSaveAnswerGroupCorrectnessLabel(event: Outcome): void {
    this.onSaveAnswerGroupCorrectnessLabel.emit(event);
  }

  sendOnSaveAnswerGroupFeedback(event: Outcome): void {
    this.onSaveAnswerGroupFeedback.emit(event);
  }

  sendOnSaveAnswerGroupDest(event: Outcome): void {
    this.onSaveAnswerGroupDest.emit(event);
  }

  sendOnSaveAnswerGroupDestIfStuck(event: Outcome): void {
    this.onSaveAnswerGroupDestIfStuck.emit(event);
  }

  isInQuestionMode(): boolean {
    return this.stateEditorService.isInQuestionMode();
  }

  getAnswerChoices(): AnswerChoice[] {
    return this.responsesService.getAnswerChoices();
  }

  getCurrentInteractionId(): string {
    return this.stateInteractionIdService.savedMemento;
  }

  getDefaultInputValue(
      varType: string): null | boolean |
      number | number[] | string | object | object[] {
    // TODO(bhenning): Typed objects in the backend should be required
    // to provide a default value specific for their type.
    switch (varType) {
      default:
      case 'Null':
        return null;
      case 'Boolean':
        return false;
      case 'Real':
      case 'Int':
      case 'NonnegativeInt':
        return 0;
      case 'PositiveInt':
        return 1;
      case 'CodeString':
      case 'UnicodeString':
      case 'NormalizedString':
      case 'MathExpressionContent':
      case 'Html':
      case 'SanitizedUrl':
      case 'Filepath':
        return '';
      case 'CodeEvaluation':
        return {
          code: this.getDefaultInputValue('UnicodeString'),
          error: this.getDefaultInputValue('UnicodeString'),
          evaluation: this.getDefaultInputValue('UnicodeString'),
          output: this.getDefaultInputValue('UnicodeString')
        };
      case 'CoordTwoDim':
        return [
          this.getDefaultInputValue('Real'),
          this.getDefaultInputValue('Real')];
      case 'ListOfUnicodeString':
      case 'SetOfAlgebraicIdentifier':
      case 'SetOfUnicodeString':
      case 'SetOfNormalizedString':
      case 'MusicPhrase':
        return [];
      case 'CheckedProof':
        return {
          assumptions_string: this.getDefaultInputValue('UnicodeString'),
          correct: this.getDefaultInputValue('Boolean'),
          proof_string: this.getDefaultInputValue('UnicodeString'),
          target_string: this.getDefaultInputValue('UnicodeString')
        };
      case 'Graph':
        return {
          edges: [],
          isDirected: this.getDefaultInputValue('Boolean'),
          isLabeled: this.getDefaultInputValue('Boolean'),
          isWeighted: this.getDefaultInputValue('Boolean'),
          vertices: []
        };
      case 'NormalizedRectangle2D':
        return [
          [
            this.getDefaultInputValue('Real'),
            this.getDefaultInputValue('Real')
          ],
          [
            this.getDefaultInputValue('Real'),
            this.getDefaultInputValue('Real')
          ]];
      case 'ImageRegion':
        return {
          area: this.getDefaultInputValue('NormalizedRectangle2D'),
          regionType: this.getDefaultInputValue('UnicodeString')
        };
      case 'ImageWithRegions':
        return {
          imagePath: this.getDefaultInputValue('Filepath'),
          labeledRegions: []
        };
      case 'ClickOnImage':
        return {
          clickPosition: [
            this.getDefaultInputValue('Real'),
            this.getDefaultInputValue('Real')
          ],
          clickedRegions: []
        };
      case 'TranslatableSetOfNormalizedString':
        return {
          contentId: null,
          normalizedStrSet:
            this.getDefaultInputValue('SetOfNormalizedString')
        };
      case 'TranslatableSetOfUnicodeString':
        return {
          contentId: null,
          normalizedStrSet:
            this.getDefaultInputValue('SetOfUnicodeString')
        };
    }
  }

  addNewRule(): void {
    // Build an initial blank set of inputs for the initial rule.
    let interactionId = this.getCurrentInteractionId();
    let ruleDescriptions = (
      INTERACTION_SPECS[interactionId].rule_descriptions);
    let ruleTypes = Object.keys(ruleDescriptions);
    if (ruleTypes.length === 0) {
      // This should never happen. An interaction must have at least
      // one rule, as verified in a backend test suite:
      //   extensions.interactions.base_test.InteractionUnitTests.
      return;
    }
    let ruleType = ruleTypes[0];
    let description = ruleDescriptions[ruleType];

    let PATTERN = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
    let inputs = {};
    const inputTypes = {};
    while (description.match(PATTERN)) {
      let varName = description.match(PATTERN)[1];
      let varType = description.match(PATTERN)[2];
      if (varType) {
        varType = varType.substring(1);
      }

      inputTypes[varName] = varType;
      inputs[varName] = this.getDefaultInputValue(varType);
      description = description.replace(PATTERN, ' ');
    }

    // Save the state of the rules before adding a new one (in case the
    // user cancels the addition).
    this.rulesMemento = cloneDeep(this.rules);

    // TODO(bhenning): Should use functionality in ruleEditor.js, but
    // move it to ResponsesService in StateResponses.js to properly
    // form a new rule.
    const rule = Rule.createNew(
      ruleType, inputs, inputTypes);
    this.rules.push(rule);
    this.changeActiveRuleIndex(this.rules.length - 1);
  }

  deleteRule(index: number): void {
    this.rules.splice(index, 1);
    this.saveRules();

    if (this.rules.length === 0) {
      this.alertsService.addWarning(
        'All answer groups must have at least one rule.');
    }
  }

  cancelActiveRuleEdit(): void {
    this.rules.splice(0, this.rules.length);
    for (let i = 0; i < this.rulesMemento.length; i++) {
      this.rules.push(this.rulesMemento[i]);
    }
    this.saveRules();
  }

  saveRules(): void {
    if (this.originalContentIdToContent !== undefined) {
      const updatedContentIdToContent = (
        this.getTranslatableRulesContentIdToContentMap()
      );

      const contentIdsWithModifiedContent = [];
      Object.keys(
        this.originalContentIdToContent
      ).forEach(contentId => {
        if (
          this.originalContentIdToContent.hasOwnProperty(contentId) &&
          updatedContentIdToContent.hasOwnProperty(contentId) &&
          !isEqual(
            this.originalContentIdToContent[contentId],
            updatedContentIdToContent[contentId]
          )
        ) {
          contentIdsWithModifiedContent.push(contentId);
        }
      });
    }

    this.changeActiveRuleIndex(-1);
    this.rulesMemento = null;
    this.onSaveAnswerGroupRules.emit(this.rules);
    this.onSaveNextContentIdIndex.emit();
  }

  changeActiveRuleIndex(newIndex: number): void {
    this.responsesService.changeActiveRuleIndex(newIndex);
    this.activeRuleIndex = this.responsesService.getActiveRuleIndex();
  }

  openRuleEditor(index: number): void {
    if (!this.isEditable) {
      // The rule editor may not be opened in a read-only editor view.
      return;
    }

    this.originalContentIdToContent = (
      this.getTranslatableRulesContentIdToContentMap()
    );
    this.rulesMemento = cloneDeep(this.rules);
    this.changeActiveRuleIndex(index);
  }

  isRuleEditorOpen(): boolean {
    return this.activeRuleIndex !== -1;
  }

  isCurrentInteractionTrainable(): boolean {
    let interactionId = this.getCurrentInteractionId();
    if (!INTERACTION_SPECS.hasOwnProperty(interactionId)) {
      throw new Error(
        'Invalid interaction id - ' + interactionId +
        '. Answer group rules: ' +
        this.rules.map(rule => rule.type).join(', '));
    }
    return INTERACTION_SPECS[interactionId].is_trainable;
  }

  openTrainingDataEditor(): void {
    this.trainingDataEditorPanelService.openTrainingDataEditor();
  }

  isMLEnabled(): boolean {
    return AppConstants.ENABLE_ML_CLASSIFIERS;
  }

  /**
   * Extracts a mapping of content ids of translatable rules to the html
   * or unicode content found in the rule inputs.
   * @returns {Object} A Mapping of content ids (string) to content
   *   (string).
   */
  getTranslatableRulesContentIdToContentMap(): object {
    const contentIdToContentMap = {};
    this.rules.forEach(rule => {
      Object.keys(rule.inputs).forEach(ruleName => {
        const ruleInput = rule.inputs[ruleName];
        // All rules input types which are translatable are subclasses of
        // BaseTranslatableObject having dict structure with contentId
        // as a key.
        if (ruleInput && ruleInput.hasOwnProperty('contentId')) {
          contentIdToContentMap[(
            ruleInput as BaseTranslatableObject).contentId] = ruleInput;
        }
      });
    });
    return contentIdToContentMap;
  }

  ngOnInit(): void {
    // Updates answer choices when the interaction requires it -- e.g.,
    // the rules for multiple choice need to refer to the multiple
    // choice interaction's customization arguments.
    // TODO(sll): Remove the need for this watcher, or make it less
    // ad hoc.
    this.directiveSubscriptions.add(
      this.externalSaveService.onExternalSave.subscribe(() => {
        if (this.isRuleEditorOpen()) {
          if (this.stateEditorService.checkCurrentRuleInputIsValid()) {
            this.saveRules();
          } else {
            let messageContent = (
              'There was an unsaved rule input which was invalid and ' +
              'has been discarded.');
            if (!this.alertsService.messages.some(messageObject => (
              messageObject.content === messageContent))) {
              this.alertsService.addInfoMessage(messageContent);
            }
          }
        }
      })
    );

    this.directiveSubscriptions.add(
      this.stateEditorService.onUpdateAnswerChoices.subscribe(() => {
        this.answerChoices = this.getAnswerChoices();
      })
    );

    this.directiveSubscriptions.add(
      this.stateInteractionIdService.onInteractionIdChanged.subscribe(
        () => {
          if (this.isRuleEditorOpen()) {
            this.saveRules();
          }
          this.answerChoices = this.getAnswerChoices();
        }
      )
    );

    this.rulesMemento = null;
    this.activeRuleIndex = this.responsesService.getActiveRuleIndex();
    this.editAnswerGroupForm = {};
    this.answerChoices = this.getAnswerChoices();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaAnswerGroupEditor',
  downgradeComponent({
    component: AnswerGroupEditor
  }) as angular.IDirectiveFactory);
