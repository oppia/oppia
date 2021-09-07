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

import { AlgebraicExpressionInputRulesService } from
  // eslint-disable-next-line max-len
  'interactions/AlgebraicExpressionInput/directives/algebraic-expression-input-rules.service';
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
import { MathEquationInputRulesService } from
  // eslint-disable-next-line max-len
  'interactions/MathEquationInput/directives/math-equation-input-rules.service';
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
import { NumericExpressionInputRulesService } from
  // eslint-disable-next-line max-len
  'interactions/NumericExpressionInput/directives/numeric-expression-input-rules.service';
import { NumericInputRulesService } from
  'interactions/NumericInput/directives/numeric-input-rules.service';
import { PencilCodeEditorRulesService } from
  'interactions/PencilCodeEditor/directives/pencil-code-editor-rules.service';
import { RatioExpressionInputRulesService } from
  // eslint-disable-next-line max-len
  'interactions/RatioExpressionInput/directives/ratio-expression-input-rules.service';
import { SetInputRulesService } from
  'interactions/SetInput/directives/set-input-rules.service';
import { TextInputRulesService } from
  'interactions/TextInput/directives/text-input-rules.service';

describe('Interaction Rules Registry Service', () => {
  let interactionRulesRegistryService: InteractionRulesRegistryService;
  let algebraicExpressionInputRulesService:
    AlgebraicExpressionInputRulesService;
  let codeReplRulesService: CodeReplRulesService;
  let continueRulesService: ContinueRulesService;
  let dragAndDropSortInputRulesService: DragAndDropSortInputRulesService;
  let endExplorationRulesService: EndExplorationRulesService;
  let fractionInputRulesService: FractionInputRulesService;
  let graphInputRulesService: GraphInputRulesService;
  let imageClickInputRulesService: ImageClickInputRulesService;
  let interactiveMapRulesService: InteractiveMapRulesService;
  let itemSelectionInputRulesService: ItemSelectionInputRulesService;
  let mathEquationInputRulesService: MathEquationInputRulesService;
  let multipleChoiceInputRulesService: MultipleChoiceInputRulesService;
  let musicNotesInputRulesService: MusicNotesInputRulesService;
  let numberWithUnitsRulesService: NumberWithUnitsRulesService;
  let numericExpressionInputRulesService: NumericExpressionInputRulesService;
  let numericInputRulesService: NumericInputRulesService;
  let pencilCodeEditorRulesService: PencilCodeEditorRulesService;
  let ratioExpressionInputRulesService: RatioExpressionInputRulesService;
  let setInputRulesService: SetInputRulesService;
  let textInputRulesService: TextInputRulesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NormalizeWhitespacePipe,
        NormalizeWhitespacePunctuationAndCasePipe,
      ],
    });

    interactionRulesRegistryService = (
      TestBed.get(InteractionRulesRegistryService));

    algebraicExpressionInputRulesService = (
      TestBed.get(AlgebraicExpressionInputRulesService));
    codeReplRulesService = TestBed.get(CodeReplRulesService);
    continueRulesService = TestBed.get(ContinueRulesService);
    dragAndDropSortInputRulesService = (
      TestBed.get(DragAndDropSortInputRulesService));
    endExplorationRulesService = TestBed.get(EndExplorationRulesService);
    fractionInputRulesService = TestBed.get(FractionInputRulesService);
    graphInputRulesService = TestBed.get(GraphInputRulesService);
    imageClickInputRulesService = TestBed.get(ImageClickInputRulesService);
    interactiveMapRulesService = TestBed.get(InteractiveMapRulesService);
    itemSelectionInputRulesService = (
      TestBed.get(ItemSelectionInputRulesService));
    mathEquationInputRulesService = (
      TestBed.get(MathEquationInputRulesService));
    multipleChoiceInputRulesService = (
      TestBed.get(MultipleChoiceInputRulesService));
    musicNotesInputRulesService = TestBed.get(MusicNotesInputRulesService);
    numberWithUnitsRulesService = TestBed.get(NumberWithUnitsRulesService);
    numericExpressionInputRulesService = (
      TestBed.get(NumericExpressionInputRulesService));
    numericInputRulesService = TestBed.get(NumericInputRulesService);
    pencilCodeEditorRulesService = (
      TestBed.get(PencilCodeEditorRulesService));
    ratioExpressionInputRulesService = (
      TestBed.get(RatioExpressionInputRulesService));
    setInputRulesService = TestBed.get(SetInputRulesService);
    textInputRulesService = TestBed.get(TextInputRulesService);
  });

  it('should throw an error for falsey interaction ids', () => {
    expect(
      () => interactionRulesRegistryService.getRulesServiceByInteractionId('')
    ).toThrowError('Interaction ID must not be empty');
  });

  it('should throw an error for an interaction id that does not exist', () => {
    expect(
      () => interactionRulesRegistryService.getRulesServiceByInteractionId(
        'FakeInput')
    ).toThrowError('Unknown interaction ID: FakeInput');
  });

  it('should return a non-null service for each interaction spec', () => {
    for (const interactionId in InteractionSpecsConstants.INTERACTION_SPECS) {
      expect(
        () => interactionRulesRegistryService.getRulesServiceByInteractionId(
          interactionId)
      ).not.toThrowError();
    }
  });

  it('should return the correct rules service for AlgebraicExpressionInput',
    () => {
      expect(interactionRulesRegistryService.getRulesServiceByInteractionId(
        'AlgebraicExpressionInput')).toBe(
        algebraicExpressionInputRulesService);
    }
  );

  it('should return the correct rules service for CodeRepl', () => {
    expect(
      interactionRulesRegistryService
        .getRulesServiceByInteractionId('CodeRepl')
    ).toBe(codeReplRulesService);
  });

  it('should return the correct rules service for Continue', () => {
    expect(
      interactionRulesRegistryService
        .getRulesServiceByInteractionId('Continue')
    ).toBe(continueRulesService);
  });

  it('should return the correct rules service for DragAndDropSortInput', () => {
    expect(
      interactionRulesRegistryService
        .getRulesServiceByInteractionId('DragAndDropSortInput')
    ).toBe(dragAndDropSortInputRulesService);
  });

  it('should return the correct rules service for EndExploration', () => {
    expect(
      interactionRulesRegistryService
        .getRulesServiceByInteractionId('EndExploration')
    ).toBe(endExplorationRulesService);
  });

  it('should return the correct rules service for FractionInput', () => {
    expect(
      interactionRulesRegistryService
        .getRulesServiceByInteractionId('FractionInput')
    ).toBe(fractionInputRulesService);
  });

  it('should return the correct rules service for GraphInput', () => {
    expect(
      interactionRulesRegistryService
        .getRulesServiceByInteractionId('GraphInput')
    ).toBe(graphInputRulesService);
  });

  it('should return the correct rules service for ImageClickInput', () => {
    expect(
      interactionRulesRegistryService
        .getRulesServiceByInteractionId('ImageClickInput')
    ).toBe(imageClickInputRulesService);
  });

  it('should return the correct rules service for InteractiveMap', () => {
    expect(
      interactionRulesRegistryService
        .getRulesServiceByInteractionId('InteractiveMap')
    ).toBe(interactiveMapRulesService);
  });

  it('should return the correct rules service for ItemSelectionInput', () => {
    expect(
      interactionRulesRegistryService
        .getRulesServiceByInteractionId('ItemSelectionInput')
    ).toBe(itemSelectionInputRulesService);
  });

  it('should return the correct rules service for MathEquationInput', () => {
    expect(
      interactionRulesRegistryService
        .getRulesServiceByInteractionId('MathEquationInput')
    ).toBe(mathEquationInputRulesService);
  });

  it('should return the correct rules service for MultipleChoiceInput', () => {
    expect(
      interactionRulesRegistryService
        .getRulesServiceByInteractionId('MultipleChoiceInput')
    ).toBe(multipleChoiceInputRulesService);
  });

  it('should return the correct rules service for MusicNotesInput', () => {
    expect(
      interactionRulesRegistryService
        .getRulesServiceByInteractionId('MusicNotesInput')
    ).toBe(musicNotesInputRulesService);
  });

  it('should return the correct rules service for NumberWithUnits', () => {
    expect(
      interactionRulesRegistryService
        .getRulesServiceByInteractionId('NumberWithUnits')
    ).toBe(numberWithUnitsRulesService);
  });

  it('should return the correct rules service for NumericExpressionInput',
    () => {
      expect(
        interactionRulesRegistryService
          .getRulesServiceByInteractionId('NumericExpressionInput')
      ).toBe(numericExpressionInputRulesService);
    }
  );

  it('should return the correct rules service for NumericInput', () => {
    expect(
      interactionRulesRegistryService
        .getRulesServiceByInteractionId('NumericInput')
    ).toBe(numericInputRulesService);
  });

  it('should return the correct rules service for PencilCodeEditor', () => {
    expect(
      interactionRulesRegistryService
        .getRulesServiceByInteractionId('PencilCodeEditor')
    ).toBe(pencilCodeEditorRulesService);
  });

  it('should return the correct rules service for RatioExpressionInput',
    () => {
      expect(
        interactionRulesRegistryService
          .getRulesServiceByInteractionId('RatioExpressionInput')
      ).toBe(ratioExpressionInputRulesService);
    }
  );

  it('should return the correct rules service for SetInput', () => {
    expect(
      interactionRulesRegistryService.getRulesServiceByInteractionId('SetInput')
    ).toBe(setInputRulesService);
  });

  it('should return the correct rules service for TextInput', () => {
    expect(
      interactionRulesRegistryService
        .getRulesServiceByInteractionId('TextInput')
    ).toBe(textInputRulesService);
  });
});
