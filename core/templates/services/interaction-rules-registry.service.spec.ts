// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for interaction rules registry service.
 */

import { TestBed } from '@angular/core/testing';

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
import { InteractionRulesRegistryService } from
  'services/interaction-rules-registry.service';
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
import { NormalizeWhitespacePipe } from
  'filters/string-utility-filters/normalize-whitespace.pipe';
import { NormalizeWhitespacePunctuationAndCasePipe } from
  // eslint-disable-next-line max-len
  'filters/string-utility-filters/normalize-whitespace-punctuation-and-case.pipe';
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

describe('Interaction Rules Registry Service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NormalizeWhitespacePipe,
        NormalizeWhitespacePunctuationAndCasePipe,
      ],
    });

    this.registry = TestBed.get(InteractionRulesRegistryService);

    this.codeReplRulesService = TestBed.get(CodeReplRulesService);
    this.continueRulesService = TestBed.get(ContinueRulesService);
    this.dragAndDropSortInputRulesService = (
      TestBed.get(DragAndDropSortInputRulesService));
    this.endExplorationRulesService = TestBed.get(EndExplorationRulesService);
    this.fractionInputRulesService = TestBed.get(FractionInputRulesService);
    this.graphInputRulesService = TestBed.get(GraphInputRulesService);
    this.imageClickInputRulesService = TestBed.get(ImageClickInputRulesService);
    this.interactiveMapRulesService = TestBed.get(InteractiveMapRulesService);
    this.itemSelectionInputRulesService = (
      TestBed.get(ItemSelectionInputRulesService));
    this.logicProofRulesService = TestBed.get(LogicProofRulesService);
    this.mathExpressionInputRulesService = (
      TestBed.get(MathExpressionInputRulesService));
    this.multipleChoiceInputRulesService = (
      TestBed.get(MultipleChoiceInputRulesService));
    this.musicNotesInputRulesService = TestBed.get(MusicNotesInputRulesService);
    this.numberWithUnitsRulesService = TestBed.get(NumberWithUnitsRulesService);
    this.numericInputRulesService = TestBed.get(NumericInputRulesService);
    this.pencilCodeEditorRulesService = (
      TestBed.get(PencilCodeEditorRulesService));
    this.setInputRulesService = TestBed.get(SetInputRulesService);
    this.textInputRulesService = TestBed.get(TextInputRulesService);
  });

  it('should throw an error for falsey interaction ids', () => {
    expect(() => this.registry.getRulesServiceByInteractionId(''))
      .toThrowError('Interaction ID must not be empty');
    expect(() => this.registry.getRulesServiceByInteractionId(null))
      .toThrowError('Interaction ID must not be empty');
    expect(() => this.registry.getRulesServiceByInteractionId(undefined))
      .toThrowError('Interaction ID must not be empty');
    expect(() => this.registry.getRulesServiceByInteractionId())
      .toThrowError('Interaction ID must not be empty');
  });

  it('should throw an error for an interaction id that does not exist', () => {
    expect(() => this.registry.getRulesServiceByInteractionId('FakeInput'))
      .toThrowError('Unknown interaction ID: FakeInput');
  });

  it('should return a non-null service for each interaction spec', () => {
    for (const interactionId in InteractionSpecsConstants.INTERACTION_SPECS) {
      expect(() => this.registry.getRulesServiceByInteractionId(interactionId))
        .not.toThrowError();
    }
  });

  it('should return the correct rules service for CodeRepl', () => {
    expect(this.registry.getRulesServiceByInteractionId('CodeRepl'))
      .toBe(this.codeReplRulesService);
  });

  it('should return the correct rules service for Continue', () => {
    expect(this.registry.getRulesServiceByInteractionId('Continue'))
      .toBe(this.continueRulesService);
  });

  it('should return the correct rules service for DragAndDropSortInput', () => {
    expect(this.registry.getRulesServiceByInteractionId('DragAndDropSortInput'))
      .toBe(this.dragAndDropSortInputRulesService);
  });

  it('should return the correct rules service for EndExploration', () => {
    expect(this.registry.getRulesServiceByInteractionId('EndExploration'))
      .toBe(this.endExplorationRulesService);
  });

  it('should return the correct rules service for FractionInput', () => {
    expect(this.registry.getRulesServiceByInteractionId('FractionInput'))
      .toBe(this.fractionInputRulesService);
  });

  it('should return the correct rules service for GraphInput', () => {
    expect(this.registry.getRulesServiceByInteractionId('GraphInput'))
      .toBe(this.graphInputRulesService);
  });

  it('should return the correct rules service for ImageClickInput', () => {
    expect(this.registry.getRulesServiceByInteractionId('ImageClickInput'))
      .toBe(this.imageClickInputRulesService);
  });

  it('should return the correct rules service for InteractiveMap', () => {
    expect(this.registry.getRulesServiceByInteractionId('InteractiveMap'))
      .toBe(this.interactiveMapRulesService);
  });

  it('should return the correct rules service for ItemSelectionInput', () => {
    expect(this.registry.getRulesServiceByInteractionId('ItemSelectionInput'))
      .toBe(this.itemSelectionInputRulesService);
  });

  it('should return the correct rules service for LogicProof', () => {
    expect(this.registry.getRulesServiceByInteractionId('LogicProof'))
      .toBe(this.logicProofRulesService);
  });

  it('should return the correct rules service for MathExpressionInput', () => {
    expect(this.registry.getRulesServiceByInteractionId('MathExpressionInput'))
      .toBe(this.mathExpressionInputRulesService);
  });

  it('should return the correct rules service for MultipleChoiceInput', () => {
    expect(this.registry.getRulesServiceByInteractionId('MultipleChoiceInput'))
      .toBe(this.multipleChoiceInputRulesService);
  });

  it('should return the correct rules service for MusicNotesInput', () => {
    expect(this.registry.getRulesServiceByInteractionId('MusicNotesInput'))
      .toBe(this.musicNotesInputRulesService);
  });

  it('should return the correct rules service for NumberWithUnits', () => {
    expect(this.registry.getRulesServiceByInteractionId('NumberWithUnits'))
      .toBe(this.numberWithUnitsRulesService);
  });

  it('should return the correct rules service for NumericInput', () => {
    expect(this.registry.getRulesServiceByInteractionId('NumericInput'))
      .toBe(this.numericInputRulesService);
  });

  it('should return the correct rules service for PencilCodeEditor', () => {
    expect(this.registry.getRulesServiceByInteractionId('PencilCodeEditor'))
      .toBe(this.pencilCodeEditorRulesService);
  });

  it('should return the correct rules service for SetInput', () => {
    expect(this.registry.getRulesServiceByInteractionId('SetInput'))
      .toBe(this.setInputRulesService);
  });

  it('should return the correct rules service for TextInput', () => {
    expect(this.registry.getRulesServiceByInteractionId('TextInput'))
      .toBe(this.textInputRulesService);
  });
});
