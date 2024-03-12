// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the object components.
 */
import 'core-js/es7/reflect';
import 'zone.js';

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {LeafletModule} from '@asymmetrik/ngx-leaflet';
import {NgxTrimDirectiveModule} from 'ngx-trim-directive';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {AlgebraicExpressionEditorComponent} from './templates/algebraic-expression-editor.component';
import {BooleanEditorComponent} from './templates/boolean-editor.component';
import {CodeStringEditorComponent} from './templates/code-string-editor.component';
import {CoordTwoDimEditorComponent} from './templates/coord-two-dim-editor.component';
import {AllowedVariablesEditorComponent} from './templates/allowed-variables-editor.component';
import {DragAndDropPositiveIntEditorComponent} from './templates/drag-and-drop-positive-int-editor.component';
import {FractionEditorComponent} from './templates/fraction-editor.component';
import {FormsModule} from '@angular/forms';
import {FilepathEditorComponent} from './templates/filepath-editor.component';
import {ImageEditorComponent} from './templates/image-editor.component';
import {GraphInputInteractionModule} from 'interactions/GraphInput/graph-input-interactions.module';
import {GraphEditorComponent} from './templates/graph-editor.component';
import {SharedFormsModule} from 'components/forms/shared-forms.module';
import {HtmlEditorComponent} from './templates/html-editor.component';
import {NgbModalModule, NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';
import {ImageWithRegionsEditorComponent} from './templates/image-with-regions-editor.component';
import {ImageWithRegionsResetConfirmationModalComponent} from './templates/image-with-regions-reset-confirmation.component';
import {IntEditorComponent} from './templates/int-editor.component';
import {DynamicContentModule} from 'components/interaction-display/dynamic-content.module';
import {ListOfSetsOfTranslatableHtmlContentIdsEditorComponent} from './templates/list-of-sets-of-translatable-html-content-ids-editor.component';
import {DirectivesModule} from 'directives/directives.module';
import {ListOfTabsEditorComponent} from './templates/list-of-tabs-editor.component';
import {ListOfUnicodeStringEditorComponent} from './templates/list-of-unicode-string-editor.component';
import {SetOfUnicodeStringEditorComponent} from './templates/set-of-unicode-string-editor.component';
import {MathEquationEditorComponent} from './templates/math-equation-editor.component';
import {MathExpressionContentEditorComponent} from './templates/math-expression-content-editor.component';
import {MusicPhraseEditorComponent} from './templates/music-phrase-editor.component';
import {NonnegativeIntEditorComponent} from './templates/nonnegative-int-editor.component';
import {NumberWithUnitsEditorComponent} from './templates/number-with-units-editor.component';
import {NumericExpressionEditorComponent} from './templates/numeric-expression-editor.component';
import {PositionOfTermsEditorComponent} from './templates/position-of-terms-editor.component';
import {PositiveIntEditorComponent} from './templates/positive-int-editor.component';
import {RatioExpressionEditorComponent} from './templates/ratio-expression-editor.component';
import {RealEditorComponent} from './templates/real-editor.component';
import {SanitizedUrlEditorComponent} from './templates/sanitized-url-editor.component';
import {SetOfAlgebraicIdentifierEditorComponent} from './templates/set-of-algebraic-identifier-editor.component';
import {SetOfTranslatableHtmlContentIdsEditorComponent} from './templates/set-of-translatable-html-content-ids-editor.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {SubtitledHtmlEditorComponent} from './templates/subtitled-html-editor.component';
import {SvgEditorComponent} from './templates/svg-editor.component';
import {NormalizedStringEditorComponent} from './templates/normalized-string-editor.component';
import {UnicodeStringEditorComponent} from './templates/unicode-string-editor.component';
import {SkillSelectorEditorComponent} from './templates/skill-selector-editor.component';
import {CommonElementsModule} from 'components/common-layout-directives/common-elements/common-elements.module';
import {MatCardModule} from '@angular/material/card';
import {SubtitledUnicodeEditorComponent} from './templates/subtitled-unicode-editor.component';
import {TranslatableHtmlContentIdEditorComponent} from './templates/translatable-html-content-id.component';
import {TranslatableSetOfNormalizedStringEditorComponent} from './templates/translatable-set-of-normalized-string-editor.component';
import {TranslatableSetOfUnicodeStringEditorComponent} from './templates/translatable-set-of-unicode-string-editor.component';
import {ParameterNameEditorComponent} from './templates/parameter-name-editor.component';

import {TranslateModule} from '@ngx-translate/core';
import {RichTextComponentsModule} from 'rich_text_components/rich-text-components.module';

@NgModule({
  imports: [
    CommonModule,
    CommonElementsModule,
    FormsModule,
    LeafletModule,
    SharedFormsModule,
    GraphInputInteractionModule,
    DynamicContentModule,
    DirectivesModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatCheckboxModule,
    NgbModalModule,
    NgbTooltipModule,
    NgxTrimDirectiveModule,
    RichTextComponentsModule,
    TranslateModule,
  ],
  declarations: [
    AlgebraicExpressionEditorComponent,
    BooleanEditorComponent,
    CodeStringEditorComponent,
    CoordTwoDimEditorComponent,
    AllowedVariablesEditorComponent,
    DragAndDropPositiveIntEditorComponent,
    FilepathEditorComponent,
    ImageEditorComponent,
    FractionEditorComponent,
    GraphEditorComponent,
    HtmlEditorComponent,
    ImageWithRegionsEditorComponent,
    ImageWithRegionsResetConfirmationModalComponent,
    IntEditorComponent,
    ListOfSetsOfTranslatableHtmlContentIdsEditorComponent,
    ListOfTabsEditorComponent,
    ListOfUnicodeStringEditorComponent,
    MathEquationEditorComponent,
    MathExpressionContentEditorComponent,
    MusicPhraseEditorComponent,
    NonnegativeIntEditorComponent,
    NormalizedStringEditorComponent,
    NumberWithUnitsEditorComponent,
    NumericExpressionEditorComponent,
    ParameterNameEditorComponent,
    PositionOfTermsEditorComponent,
    PositiveIntEditorComponent,
    RatioExpressionEditorComponent,
    RealEditorComponent,
    SanitizedUrlEditorComponent,
    SetOfAlgebraicIdentifierEditorComponent,
    SetOfTranslatableHtmlContentIdsEditorComponent,
    SetOfUnicodeStringEditorComponent,
    SkillSelectorEditorComponent,
    SubtitledHtmlEditorComponent,
    SubtitledUnicodeEditorComponent,
    SvgEditorComponent,
    TranslatableHtmlContentIdEditorComponent,
    TranslatableSetOfNormalizedStringEditorComponent,
    TranslatableSetOfUnicodeStringEditorComponent,
    UnicodeStringEditorComponent,
  ],
  entryComponents: [
    AlgebraicExpressionEditorComponent,
    BooleanEditorComponent,
    CodeStringEditorComponent,
    CoordTwoDimEditorComponent,
    AllowedVariablesEditorComponent,
    DragAndDropPositiveIntEditorComponent,
    FilepathEditorComponent,
    ImageEditorComponent,
    FractionEditorComponent,
    GraphEditorComponent,
    HtmlEditorComponent,
    ImageWithRegionsEditorComponent,
    ImageWithRegionsResetConfirmationModalComponent,
    IntEditorComponent,
    ListOfSetsOfTranslatableHtmlContentIdsEditorComponent,
    ListOfTabsEditorComponent,
    ListOfUnicodeStringEditorComponent,
    MathEquationEditorComponent,
    MathExpressionContentEditorComponent,
    MusicPhraseEditorComponent,
    NonnegativeIntEditorComponent,
    NormalizedStringEditorComponent,
    NumberWithUnitsEditorComponent,
    NumericExpressionEditorComponent,
    ParameterNameEditorComponent,
    PositionOfTermsEditorComponent,
    PositiveIntEditorComponent,
    RatioExpressionEditorComponent,
    RealEditorComponent,
    SanitizedUrlEditorComponent,
    SetOfAlgebraicIdentifierEditorComponent,
    SetOfTranslatableHtmlContentIdsEditorComponent,
    SetOfUnicodeStringEditorComponent,
    SkillSelectorEditorComponent,
    SubtitledHtmlEditorComponent,
    SubtitledUnicodeEditorComponent,
    SvgEditorComponent,
    TranslatableHtmlContentIdEditorComponent,
    TranslatableSetOfNormalizedStringEditorComponent,
    TranslatableSetOfUnicodeStringEditorComponent,
    UnicodeStringEditorComponent,
  ],
  exports: [
    AlgebraicExpressionEditorComponent,
    BooleanEditorComponent,
    CodeStringEditorComponent,
    CoordTwoDimEditorComponent,
    AllowedVariablesEditorComponent,
    DragAndDropPositiveIntEditorComponent,
    FilepathEditorComponent,
    ImageEditorComponent,
    FractionEditorComponent,
    GraphEditorComponent,
    HtmlEditorComponent,
    ImageWithRegionsEditorComponent,
    ImageWithRegionsResetConfirmationModalComponent,
    IntEditorComponent,
    ListOfSetsOfTranslatableHtmlContentIdsEditorComponent,
    ListOfTabsEditorComponent,
    ListOfUnicodeStringEditorComponent,
    MathEquationEditorComponent,
    MathExpressionContentEditorComponent,
    MusicPhraseEditorComponent,
    NonnegativeIntEditorComponent,
    NormalizedStringEditorComponent,
    NumberWithUnitsEditorComponent,
    NumericExpressionEditorComponent,
    ParameterNameEditorComponent,
    PositionOfTermsEditorComponent,
    PositiveIntEditorComponent,
    RatioExpressionEditorComponent,
    RealEditorComponent,
    SanitizedUrlEditorComponent,
    SetOfAlgebraicIdentifierEditorComponent,
    SetOfTranslatableHtmlContentIdsEditorComponent,
    SetOfUnicodeStringEditorComponent,
    SkillSelectorEditorComponent,
    SubtitledHtmlEditorComponent,
    SubtitledUnicodeEditorComponent,
    SvgEditorComponent,
    TranslatableHtmlContentIdEditorComponent,
    TranslatableSetOfNormalizedStringEditorComponent,
    TranslatableSetOfUnicodeStringEditorComponent,
    UnicodeStringEditorComponent,
  ],
})
export class ObjectComponentsModule {}
