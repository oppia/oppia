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

import { AlgebraicExpressionInputInteractionComponent } from './AlgebraicExpressionInput/directives/oppia-interactive-algebraic-expression-input.component';
import { InteractiveCodeReplComponent } from './CodeRepl/directives/oppia-interactive-code-repl.component';
import { OppiaInteractiveContinue } from './Continue/directives/oppia-interactive-continue.component';
import { InteractiveDragAndDropSortInputComponent } from './DragAndDropSortInput/directives/oppia-interactive-drag-and-drop-sort-input.component';
import { InteractiveEndExplorationComponent } from './EndExploration/directives/oppia-interactive-end-exploration.component';
import { InteractiveFractionInputComponent } from './FractionInput/directives/oppia-interactive-fraction-input.component';
import { InteractiveGraphInput } from './GraphInput/directives/oppia-interactive-graph-input.component';
import { InteractiveImageClickInput } from './ImageClickInput/directives/oppia-interactive-image-click-input.component';
import { InteractiveInteractiveMapComponent } from './InteractiveMap/directives/oppia-interactive-interactive-map.component';
import { InteractiveItemSelectionInputComponent } from './ItemSelectionInput/directives/oppia-interactive-item-selection-input.component';
import { InteractiveMathEquationInput } from './MathEquationInput/directives/oppia-interactive-math-equation-input.component';
import { InteractiveMultipleChoiceInputComponent } from './MultipleChoiceInput/directives/oppia-interactive-multiple-choice-input.component';
import { MusicNotesInputComponent } from './MusicNotesInput/directives/oppia-interactive-music-notes-input.component';
import { InteractiveNumberWithUnitsComponent } from './NumberWithUnits/directives/oppia-interactive-number-with-units.component';
import { InteractiveNumericExpressionInput } from './NumericExpressionInput/directives/oppia-interactive-numeric-expression-input.component';
import { InteractiveNumericInput } from './NumericInput/directives/oppia-interactive-numeric-input.component';
import { PencilCodeEditor } from './PencilCodeEditor/directives/oppia-interactive-pencil-code-editor.component';
import { InteractiveRatioExpressionInputComponent } from './RatioExpressionInput/directives/oppia-interactive-ratio-expression-input.component';
import { InteractiveSetInputComponent } from './SetInput/directives/oppia-interactive-set-input.component';
import { InteractiveTextInputComponent } from './TextInput/directives/oppia-interactive-text-input.component';

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
};
