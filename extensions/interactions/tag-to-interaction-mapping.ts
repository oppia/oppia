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
 * @fileoverview Mapping which has interaction's tag name as key.
 */

import {AlgebraicExpressionInputInteractionComponent} from './AlgebraicExpressionInput/directives/oppia-interactive-algebraic-expression-input.component';
import {ResponseAlgebraicExpressionInputComponent} from './AlgebraicExpressionInput/directives/oppia-response-algebraic-expression-input.component';
import {ShortResponseAlgebraicExpressionInputComponent} from './AlgebraicExpressionInput/directives/oppia-short-response-algebraic-expression-input.component';
import {InteractiveCodeReplComponent} from './CodeRepl/directives/oppia-interactive-code-repl.component';
import {ShortResponseCodeRepl} from './CodeRepl/directives/oppia-short-response-code-repl.component';
import {OppiaInteractiveContinue} from './Continue/directives/oppia-interactive-continue.component';
import {OppiaResponseContinueComponent} from './Continue/directives/oppia-response-continue.component';
import {OppiaShortResponseContinueComponent} from './Continue/directives/oppia-short-response-continue.component';
import {InteractiveDragAndDropSortInputComponent} from './DragAndDropSortInput/directives/oppia-interactive-drag-and-drop-sort-input.component';
import {ResponseDragAndDropSortInputComponent} from './DragAndDropSortInput/directives/oppia-response-drag-and-drop-sort-input.component';
import {ShortResponseDragAndDropSortInputComponent} from './DragAndDropSortInput/directives/oppia-short-response-drag-and-drop-sort-input.component';
import {InteractiveEndExplorationComponent} from './EndExploration/directives/oppia-interactive-end-exploration.component';
import {ResponseEndExplorationComponent} from './EndExploration/directives/oppia-response-end-exploration.component';
import {ShortResponseEndExplorationComponent} from './EndExploration/directives/oppia-short-response-end-exploration.component';
import {InteractiveFractionInputComponent} from './FractionInput/directives/oppia-interactive-fraction-input.component';
import {ResponseFractionInput} from './FractionInput/directives/oppia-response-fraction-input.component';
import {ShortResponseFractionInput} from './FractionInput/directives/oppia-short-response-fraction-input.component';
import {InteractiveGraphInput} from './GraphInput/directives/oppia-interactive-graph-input.component';
import {ResponseGraphInput} from './GraphInput/directives/oppia-response-graph-input.component';
import {ShortResponseGraphInput} from './GraphInput/directives/oppia-short-response-graph-input.component';
import {InteractiveImageClickInput} from './ImageClickInput/directives/oppia-interactive-image-click-input.component';
import {ResponseImageClickInput} from './ImageClickInput/directives/oppia-response-image-click-input.component';
import {ShortResponseImageClickInput} from './ImageClickInput/directives/oppia-short-response-image-click-input.component';
import {InteractiveInteractiveMapComponent} from './InteractiveMap/directives/oppia-interactive-interactive-map.component';
import {ResponseInteractiveMapComponent} from './InteractiveMap/directives/oppia-response-interactive-map.component';
import {ShortResponseInteractiveMapComponent} from './InteractiveMap/directives/oppia-short-response-interactive-map.component';
import {InteractiveItemSelectionInputComponent} from './ItemSelectionInput/directives/oppia-interactive-item-selection-input.component';
import {ResponseItemSelectionInputComponent} from './ItemSelectionInput/directives/oppia-response-item-selection-input.component';
import {ShortResponseItemSelectionInputComponent} from './ItemSelectionInput/directives/oppia-short-response-item-selection-input.component';
import {InteractiveMathEquationInput} from './MathEquationInput/directives/oppia-interactive-math-equation-input.component';
import {ResponseMathEquationInput} from './MathEquationInput/directives/oppia-response-math-equation-input.component';
import {ShortResponseMathEquationInput} from './MathEquationInput/directives/oppia-short-response-math-equation-input.component';
import {InteractiveMultipleChoiceInputComponent} from './MultipleChoiceInput/directives/oppia-interactive-multiple-choice-input.component';
import {ResponseMultipleChoiceInputComponent} from './MultipleChoiceInput/directives/oppia-response-multiple-choice-input.component';
import {ShortResponseMultipleChoiceInputComponent} from './MultipleChoiceInput/directives/oppia-short-response-multiple-choice-input.component';
import {MusicNotesInputComponent} from './MusicNotesInput/directives/oppia-interactive-music-notes-input.component';
import {ResponseMusicNotesInput} from './MusicNotesInput/directives/oppia-response-music-notes-input.component';
import {ShortResponseMusicNotesInput} from './MusicNotesInput/directives/oppia-short-response-music-notes-input.component';
import {InteractiveNumberWithUnitsComponent} from './NumberWithUnits/directives/oppia-interactive-number-with-units.component';
import {ResponseNumberWithUnitsComponent} from './NumberWithUnits/directives/oppia-response-number-with-units.component';
import {ShortResponseNumberWithUnitsComponent} from './NumberWithUnits/directives/oppia-short-response-number-with-units.component';
import {InteractiveNumericExpressionInput} from './NumericExpressionInput/directives/oppia-interactive-numeric-expression-input.component';
import {ResponseNumericExpressionInput} from './NumericExpressionInput/directives/oppia-response-numeric-expression-input.component';
import {ShortResponseNumericExpressionInput} from './NumericExpressionInput/directives/oppia-short-response-numeric-expression-input.component';
import {InteractiveNumericInput} from './NumericInput/directives/oppia-interactive-numeric-input.component';
import {ResponseNumericInput} from './NumericInput/directives/oppia-response-numeric-input.component';
import {ShortResponseNumericInput} from './NumericInput/directives/oppia-short-response-numeric-input.component';
import {PencilCodeEditor} from './PencilCodeEditor/directives/oppia-interactive-pencil-code-editor.component';
import {ResponePencilCodeEditor} from './PencilCodeEditor/directives/oppia-response-pencil-code-editor.component';
import {ShortResponePencilCodeEditor} from './PencilCodeEditor/directives/oppia-short-response-pencil-code-editor.component';
import {InteractiveRatioExpressionInputComponent} from './RatioExpressionInput/directives/oppia-interactive-ratio-expression-input.component';
import {ResponseRatioExpressionInputComponent} from './RatioExpressionInput/directives/oppia-response-ratio-expression-input.component';
import {ShortResponseRatioExpressionInputComponent} from './RatioExpressionInput/directives/oppia-short-response-ratio-expression-input.component';
import {InteractiveSetInputComponent} from './SetInput/directives/oppia-interactive-set-input.component';
import {ResponseSetInputComponent} from './SetInput/directives/oppia-response-set-input.component';
import {ShortResponseSetInputComponent} from './SetInput/directives/oppia-short-response-set-input.component';
import {InteractiveTextInputComponent} from './TextInput/directives/oppia-interactive-text-input.component';
import {ResponseTextInputComponent} from './TextInput/directives/oppia-response-text-input.component';
import {ShortResponseTextInputComponent} from './TextInput/directives/oppia-short-response-text-input.component';

export const TAG_TO_INTERACTION_MAPPING = {
  'OPPIA-INTERACTIVE-ALGEBRAIC-EXPRESSION-INPUT':
    AlgebraicExpressionInputInteractionComponent,
  'OPPIA-INTERACTIVE-CODE-REPL': InteractiveCodeReplComponent,
  'OPPIA-INTERACTIVE-CONTINUE': OppiaInteractiveContinue,
  'OPPIA-INTERACTIVE-DRAG-AND-DROP-SORT-INPUT':
    InteractiveDragAndDropSortInputComponent,
  'OPPIA-INTERACTIVE-END-EXPLORATION': InteractiveEndExplorationComponent,
  'OPPIA-INTERACTIVE-FRACTION-INPUT': InteractiveFractionInputComponent,
  'OPPIA-INTERACTIVE-GRAPH-INPUT': InteractiveGraphInput,
  'OPPIA-INTERACTIVE-IMAGE-CLICK-INPUT': InteractiveImageClickInput,
  'OPPIA-INTERACTIVE-INTERACTIVE-MAP': InteractiveInteractiveMapComponent,
  'OPPIA-INTERACTIVE-ITEM-SELECTION-INPUT':
    InteractiveItemSelectionInputComponent,
  'OPPIA-INTERACTIVE-MATH-EQUATION-INPUT': InteractiveMathEquationInput,
  'OPPIA-INTERACTIVE-MULTIPLE-CHOICE-INPUT':
    InteractiveMultipleChoiceInputComponent,
  'OPPIA-INTERACTIVE-MUSIC-NOTES-INPUT': MusicNotesInputComponent,
  'OPPIA-INTERACTIVE-NUMBER-WITH-UNITS': InteractiveNumberWithUnitsComponent,
  'OPPIA-INTERACTIVE-NUMERIC-EXPRESSION-INPUT':
    InteractiveNumericExpressionInput,
  'OPPIA-INTERACTIVE-NUMERIC-INPUT': InteractiveNumericInput,
  'OPPIA-INTERACTIVE-PENCIL-CODE-EDITOR': PencilCodeEditor,
  'OPPIA-INTERACTIVE-RATIO-EXPRESSION-INPUT':
    InteractiveRatioExpressionInputComponent,
  'OPPIA-INTERACTIVE-SET-INPUT': InteractiveSetInputComponent,
  'OPPIA-INTERACTIVE-TEXT-INPUT': InteractiveTextInputComponent,
  'OPPIA-RESPONSE-ALGEBRAIC-EXPRESSION-INPUT':
    ResponseAlgebraicExpressionInputComponent,
  'OPPIA-RESPONSE-CONTINUE': OppiaResponseContinueComponent,
  'OPPIA-RESPONSE-DRAG-AND-DROP-SORT-INPUT':
    ResponseDragAndDropSortInputComponent,
  'OPPIA-RESPONSE-END-EXPLORATION': ResponseEndExplorationComponent,
  'OPPIA-RESPONSE-FRACTION-INPUT': ResponseFractionInput,
  'OPPIA-RESPONSE-GRAPH-INPUT': ResponseGraphInput,
  'OPPIA-RESPONSE-IMAGE-CLICK-INPUT': ResponseImageClickInput,
  'OPPIA-RESPONSE-INTERACTIVE-MAP': ResponseInteractiveMapComponent,
  'OPPIA-RESPONSE-ITEM-SELECTION-INPUT': ResponseItemSelectionInputComponent,
  'OPPIA-RESPONSE-MATH-EQUATION-INPUT': ResponseMathEquationInput,
  'OPPIA-RESPONSE-MULTIPLE-CHOICE-INPUT': ResponseMultipleChoiceInputComponent,
  'OPPIA-RESPONSE-MUSIC-NOTES-INPUT': ResponseMusicNotesInput,
  'OPPIA-RESPONSE-NUMBER-WITH-UNITS': ResponseNumberWithUnitsComponent,
  'OPPIA-RESPONSE-NUMERIC-EXPRESSION-INPUT': ResponseNumericExpressionInput,
  'OPPIA-RESPONSE-NUMERIC-INPUT': ResponseNumericInput,
  'OPPIA-RESPONSE-PENCIL-CODE-EDITOR': ResponePencilCodeEditor,
  'OPPIA-RESPONSE-RATIO-EXPRESSION-INPUT':
    ResponseRatioExpressionInputComponent,
  'OPPIA-RESPONSE-SET-INPUT': ResponseSetInputComponent,
  'OPPIA-RESPONSE-TEXT-INPUT': ResponseTextInputComponent,
  'OPPIA-SHORT-RESPONSE-ALGEBRAIC-EXPRESSION-INPUT':
    ShortResponseAlgebraicExpressionInputComponent,
  'OPPIA-SHORT-RESPONSE-CODE-REPL': ShortResponseCodeRepl,
  'OPPIA-SHORT-RESPONSE-CONTINUE': OppiaShortResponseContinueComponent,
  'OPPIA-SHORT-RESPONSE-DRAG-AND-DROP-SORT-INPUT':
    ShortResponseDragAndDropSortInputComponent,
  'OPPIA-SHORT-RESPONSE-END-EXPLORATION': ShortResponseEndExplorationComponent,
  'OPPIA-SHORT-RESPONSE-FRACTION-INPUT': ShortResponseFractionInput,
  'OPPIA-SHORT-RESPONSE-GRAPH-INPUT': ShortResponseGraphInput,
  'OPPIA-SHORT-RESPONSE-IMAGE-CLICK-INPUT': ShortResponseImageClickInput,
  'OPPIA-SHORT-RESPONSE-INTERACTIVE-MAP': ShortResponseInteractiveMapComponent,
  'OPPIA-SHORT-RESPONSE-ITEM-SELECTION-INPUT':
    ShortResponseItemSelectionInputComponent,
  'OPPIA-SHORT-RESPONSE-MATH-EQUATION-INPUT': ShortResponseMathEquationInput,
  'OPPIA-SHORT-RESPONSE-MULTIPLE-CHOICE-INPUT':
    ShortResponseMultipleChoiceInputComponent,
  'OPPIA-SHORT-RESPONSE-MUSIC-NOTES-INPUT': ShortResponseMusicNotesInput,
  'OPPIA-SHORT-RESPONSE-NUMBER-WITH-UNITS':
    ShortResponseNumberWithUnitsComponent,
  'OPPIA-SHORT-RESPONSE-NUMERIC-EXPRESSION-INPUT':
    ShortResponseNumericExpressionInput,
  'OPPIA-SHORT-RESPONSE-NUMERIC-INPUT': ShortResponseNumericInput,
  'OPPIA-SHORT-RESPONSE-PENCIL-CODE-EDITOR': ShortResponePencilCodeEditor,
  'OPPIA-SHORT-RESPONSE-RATIO-EXPRESSION-INPUT':
    ShortResponseRatioExpressionInputComponent,
  'OPPIA-SHORT-RESPONSE-SET-INPUT': ShortResponseSetInputComponent,
  'OPPIA-SHORT-RESPONSE-TEXT-INPUT': ShortResponseTextInputComponent,
};
