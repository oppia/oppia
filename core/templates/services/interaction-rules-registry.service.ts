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
 * @fileoverview Service for getting the rules services of interactions.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { CodeReplRulesService } from
  'interactions/CodeRepl/directives/code-repl-rules.service';
import { ContinueRulesService } from
  'interactions/Continue/directives/continue-rules.service';
import { DragAndDropSortInputRulesService } from
  // eslint-disable-next-line max-len
  'interactions/DragAndDropSortInput/directives/drag-and-drop-sort-input-rules.service';
import { EndExplorationRulesService } from
  'interactions/EndExploration/directives/end-exploration-rules.service';
import { FractionInputRulesService } from
  'interactions/FractionInput/directives/fraction-input-rules.service';
import { GraphInputRulesService } from
  'interactions/GraphInput/directives/graph-input-rules.service';
import { ImageClickInputRulesService } from
  'interactions/ImageClickInput/directives/image-click-input-rules.service';
import { InteractionSpecsConstants } from
  'pages/interaction-specs.constants';
import { InteractiveMapRulesService } from
  'interactions/InteractiveMap/directives/interactive-map-rules.service';
import { ItemSelectionInputRulesService } from
  // eslint-disable-next-line max-len
  'interactions/ItemSelectionInput/directives/item-selection-input-rules.service';
import { LogicProofRulesService } from
  'interactions/LogicProof/directives/logic-proof-rules.service';
import { MathExpressionInputRulesService } from
  // eslint-disable-next-line max-len
  'interactions/MathExpressionInput/directives/math-expression-input-rules.service';
import { MultipleChoiceInputRulesService } from
  // eslint-disable-next-line max-len
  'interactions/MultipleChoiceInput/directives/multiple-choice-input-rules.service';
import { MusicNotesInputRulesService } from
  'interactions/MusicNotesInput/directives/music-notes-input-rules.service';
import { NumberWithUnitsRulesService } from
  'interactions/NumberWithUnits/directives/number-with-units-rules.service';
import { NumericInputRulesService } from
  'interactions/NumericInput/directives/numeric-input-rules.service';
import { PencilCodeEditorRulesService } from
  'interactions/PencilCodeEditor/directives/pencil-code-editor-rules.service';
import { SetInputRulesService } from
  'interactions/SetInput/directives/set-input-rules.service';
import { TextInputRulesService } from
  'interactions/TextInput/directives/text-input-rules.service';

@Injectable({providedIn: 'root'})
export class InteractionRulesRegistryService {
  private rulesServiceRegistry: Map<string, object>;

  constructor(
      private codeReplRulesService: CodeReplRulesService,
      private continueRulesService: ContinueRulesService,
      private dragAndDropSortInputRulesService:
        DragAndDropSortInputRulesService,
      private endExplorationRulesService: EndExplorationRulesService,
      private fractionInputRulesService: FractionInputRulesService,
      private graphInputRulesService: GraphInputRulesService,
      private imageClickInputRulesService: ImageClickInputRulesService,
      private interactiveMapRulesService: InteractiveMapRulesService,
      private itemSelectionInputRulesService: ItemSelectionInputRulesService,
      private logicProofRulesService: LogicProofRulesService,
      private mathExpressionInputRulesService: MathExpressionInputRulesService,
      private multipleChoiceInputRulesService: MultipleChoiceInputRulesService,
      private musicNotesInputRulesService: MusicNotesInputRulesService,
      private numberWithUnitsRulesService: NumberWithUnitsRulesService,
      private numericInputRulesService: NumericInputRulesService,
      private pencilCodeEditorRulesService: PencilCodeEditorRulesService,
      private setInputRulesService: SetInputRulesService,
      private textInputRulesService: TextInputRulesService) {
    this.rulesServiceRegistry = new Map(Object.entries({
      CodeReplRulesService: this.codeReplRulesService,
      ContinueRulesService: this.continueRulesService,
      DragAndDropSortInputRulesService: this.dragAndDropSortInputRulesService,
      EndExplorationRulesService: this.endExplorationRulesService,
      FractionInputRulesService: this.fractionInputRulesService,
      GraphInputRulesService: this.graphInputRulesService,
      ImageClickInputRulesService: this.imageClickInputRulesService,
      InteractiveMapRulesService: this.interactiveMapRulesService,
      ItemSelectionInputRulesService: this.itemSelectionInputRulesService,
      LogicProofRulesService: this.logicProofRulesService,
      MathExpressionInputRulesService: this.mathExpressionInputRulesService,
      MultipleChoiceInputRulesService: this.multipleChoiceInputRulesService,
      MusicNotesInputRulesService: this.musicNotesInputRulesService,
      NumberWithUnitsRulesService: this.numberWithUnitsRulesService,
      NumericInputRulesService: this.numericInputRulesService,
      PencilCodeEditorRulesService: this.pencilCodeEditorRulesService,
      SetInputRulesService: this.setInputRulesService,
      TextInputRulesService: this.textInputRulesService,
    }));
  }

  getRulesServiceByInteractionId(interactionId: string): object {
    if (!interactionId) {
      throw new Error('Interaction ID must not be empty');
    }
    const rulesServiceName = interactionId + 'RulesService';
    if (!this.rulesServiceRegistry.has(rulesServiceName)) {
      throw new Error('Unknown interaction ID: ' + interactionId);
    }
    return this.rulesServiceRegistry.get(rulesServiceName);
  }
}

angular.module('oppia').factory(
  'InteractionRulesRegistryService',
  downgradeInjectable(InteractionRulesRegistryService));
