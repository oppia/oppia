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
 * @fileoverview Directives for the object editors.
 */

// Individual object editor directives are in extensions/objects/templates.

import { Component, ComponentFactoryResolver, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewContainerRef } from '@angular/core';
import { AlgebraicExpressionEditorComponent } from 'objects/templates/algebraic-expression-editor.component';
import { BooleanEditorComponent } from 'objects/templates/boolean-editor.component';
import { CodeStringEditorComponent } from 'objects/templates/code-string-editor.component';
import { CoordTwoDimEditorComponent } from 'objects/templates/coord-two-dim-editor.component';
import { CustomOskLettersEditorComponent } from 'objects/templates/custom-osk-letters-editor.component';
import { DragAndDropPositiveIntEditorComponent } from 'objects/templates/drag-and-drop-positive-int-editor.component';
import { FilepathEditorComponent } from 'objects/templates/filepath-editor.component';
import { FractionEditorComponent } from 'objects/templates/fraction-editor.component';
import { GraphEditorComponent } from 'objects/templates/graph-editor.component';
import { HtmlEditorComponent } from 'objects/templates/html-editor.component';
import { ImageWithRegionsEditorComponent } from 'objects/templates/image-with-regions-editor.component';
import { ListOfSetsOfTranslatableHtmlContentIdsEditorComponent } from 'objects/templates/list-of-sets-of-translatable-html-content-ids-editor.component';
import { ListOfTabsEditorComponent } from 'objects/templates/list-of-tabs-editor.component';
import { ListOfUnicodeStringEditorComponent } from 'objects/templates/list-of-unicode-string-editor.component';
import { LogicErrorCategoryEditorComponent } from 'objects/templates/logic-error-category-editor.component';
import { LogicQuestionEditorComponent } from 'objects/templates/logic-question-editor.component';
import { MathEquationEditorComponent } from 'objects/templates/math-equation-editor.component';
import { MathExpressionContentEditorComponent } from 'objects/templates/math-expression-content-editor.component';
import { MusicPhraseEditorComponent } from 'objects/templates/music-phrase-editor.component';
import { NonnegativeIntEditorComponent } from 'objects/templates/nonnegative-int-editor.component';
import { NormalizedStringEditorComponent } from 'objects/templates/normalized-string-editor.component';
import { NumberWithUnitsEditorComponent } from 'objects/templates/number-with-units-editor.component';
import { NumericExpressionEditorComponent } from 'objects/templates/numeric-expression-editor.component';
import { ParameterNameEditorComponent } from 'objects/templates/parameter-name-editor.component';
import { PositionOfTermsEditorComponent } from 'objects/templates/position-of-terms-editor.component';
import { PositiveIntEditorComponent } from 'objects/templates/positive-int-editor.component';
import { RatioExpressionEditorComponent } from 'objects/templates/ratio-expression-editor.component';
import { RealEditorComponent } from 'objects/templates/real-editor.component';
import { SanitizedUrlEditorComponent } from 'objects/templates/sanitized-url-editor.component';
import { SetOfAlgebraicIdentifierEditorComponent } from 'objects/templates/set-of-algebraic-identifier-editor.component';
import { SetOfTranslatableHtmlContentIdsEditorComponent } from 'objects/templates/set-of-translatable-html-content-ids-editor.component';
import { SetOfUnicodeStringEditorComponent } from 'objects/templates/set-of-unicode-string-editor.component';
import { SkillSelectorEditorComponent } from 'objects/templates/skill-selector-editor.component';
import { SubtitledHtmlEditorComponent } from 'objects/templates/subtitled-html-editor.component';
import { SubtitledUnicodeEditorComponent } from 'objects/templates/subtitled-unicode-editor.component';
import { SvgFilenameEditorComponent } from 'objects/templates/svg-filename-editor.component';
import { TranslatableHtmlContentIdEditorComponent } from 'objects/templates/translatable-html-content-id.component';
import { TranslatableSetOfNormalizedStringEditorComponent } from 'objects/templates/translatable-set-of-normalized-string-editor.component';
import { TranslatableSetOfUnicodeStringEditorComponent } from 'objects/templates/translatable-set-of-unicode-string-editor.component';
import { UnicodeStringEditorComponent } from 'objects/templates/unicode-string-editor.component';
import { IntEditorComponent } from 'objects/templates/int-editor.component';
import { LoggerService } from 'services/contextual/logger.service';
import { ComponentRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { downgradeComponent } from '@angular/upgrade/static';
const EDITORS = {
  'algebraic-expression': AlgebraicExpressionEditorComponent,
  'boolean': BooleanEditorComponent,
  'code-string': CodeStringEditorComponent,
  'coord-two-dim': CoordTwoDimEditorComponent,
  'custom-osk-letters': CustomOskLettersEditorComponent,
  'drag-and-drop-positive-int': DragAndDropPositiveIntEditorComponent,
  filepath: FilepathEditorComponent,
  fraction: FractionEditorComponent,
  graph: GraphEditorComponent,
  html: HtmlEditorComponent,
  'image-with-regions': ImageWithRegionsEditorComponent,
  'int': IntEditorComponent,
  'list-of-sets-of-translatable-html-content-ids':
    ListOfSetsOfTranslatableHtmlContentIdsEditorComponent,
  'list-of-tabs': ListOfTabsEditorComponent,
  'list-of-unicode-string': ListOfUnicodeStringEditorComponent,
  'logic-error-category': LogicErrorCategoryEditorComponent,
  'logic-question': LogicQuestionEditorComponent,
  'math-equation': MathEquationEditorComponent,
  'math-expression-content': MathExpressionContentEditorComponent,
  'set-of-unicode-string': SetOfUnicodeStringEditorComponent,
  'music-phrase': MusicPhraseEditorComponent,
  'number-with-units': NumberWithUnitsEditorComponent,
  'nonnegative-int': NonnegativeIntEditorComponent,
  'normalized-string': NormalizedStringEditorComponent,
  'numeric-expression': NumericExpressionEditorComponent,
  'parameter-name': ParameterNameEditorComponent,
  'position-of-terms': PositionOfTermsEditorComponent,
  'positive-int': PositiveIntEditorComponent,
  'ratio-expression': RatioExpressionEditorComponent,
  real: RealEditorComponent,
  'sanitized-url': SanitizedUrlEditorComponent,
  'set-of-algebraic-identifier': SetOfAlgebraicIdentifierEditorComponent,
  'set-of-translatable-html-content-ids':
    SetOfTranslatableHtmlContentIdsEditorComponent,
  'skill-selector': SkillSelectorEditorComponent,
  'subtitled-html': SubtitledHtmlEditorComponent,
  'subtitled-unicode': SubtitledUnicodeEditorComponent,
  'svg-filename': SvgFilenameEditorComponent,
  'translatable-html-content-id': TranslatableHtmlContentIdEditorComponent,
  'translatable-set-of-normalized-string':
    TranslatableSetOfNormalizedStringEditorComponent,
  'translatable-set-of-unicode-string':
    TranslatableSetOfUnicodeStringEditorComponent,
  'unicode-string': UnicodeStringEditorComponent,
};

interface ObjectEditor {
  alwaysEditable: string;
  initArgs: unknown;
  isEditable: string;
  modalId: symbol;
  objType: string;
  schema: unknown;
  value: unknown;
  valueChanged?: EventEmitter<unknown>;
  validityChange?: EventEmitter<Record<string, boolean>>;
}

@Component({
  selector: 'object-editor',
  template: ''
})
export class ObjectEditorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() alwaysEditable: string;
  @Input() initArgs;
  @Input() isEditable: string;
  @Input() modalId: symbol;
  @Input() objType: string;
  @Input() schema;
  @Input() form;
  @Input() value;
  @Output() valueChange = new EventEmitter();
  ref: ComponentRef<ObjectEditor>;
  componentSubscriptions = new Subscription();

  constructor(
    private loggerService: LoggerService,
    private componentFactoryResolver: ComponentFactoryResolver,
    private viewContainerRef: ViewContainerRef
  ) { }

  private _updateValue(e) {
    this.value = e;
    this.valueChange.emit(e);
  }

  ngOnInit(): void {
    const editorName = this.objType.replace(
      /([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    if (EDITORS[editorName]) {
      const componentFactory = (
        this.componentFactoryResolver.resolveComponentFactory(
          EDITORS[editorName])
      );
      this.viewContainerRef.clear();
      const ref = this.viewContainerRef.createComponent<unknown>(
        componentFactory) as ComponentRef<ObjectEditor>;
      ref.instance.alwaysEditable = this.alwaysEditable;
      ref.instance.initArgs = this.initArgs;
      ref.instance.isEditable = this.isEditable;
      ref.instance.modalId = this.modalId;
      ref.instance.objType = this.objType;
      if (this.schema) {
        ref.instance.schema = this.schema;
      }
      ref.instance.value = this.value;
      if (ref.instance.valueChanged) {
        this.componentSubscriptions.add(
          ref.instance.valueChanged.subscribe((e) => {
            this._updateValue(e);
          })
        );
      }
      if (ref.instance.validityChange) {
        this.componentSubscriptions.add(
          ref.instance.validityChange.subscribe((e) => {
            if (this.form) {
              for (const key of Object.keys(e)) {
                this.form.$setValidity(key, e[key]);
              }
            }
          })
        );
      }
      this.ref = ref;
    } else {
      this.loggerService.error('Editor: ' + editorName + ' not supported');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.value &&
      changes.value.previousValue !== changes.value.currentValue &&
      this.ref
    ) {
      this.ref.instance.value = changes.value.currentValue;
    }
  }

  ngOnDestroy(): void {
    this.componentSubscriptions.unsubscribe();
    this.viewContainerRef.clear();
  }
}

angular.module('oppia').directive('objectEditor', downgradeComponent({
  component: ObjectEditorComponent
}));
