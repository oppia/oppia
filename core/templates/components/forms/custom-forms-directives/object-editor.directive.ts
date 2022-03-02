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

import { AfterViewInit, Component, ComponentFactoryResolver, EventEmitter, forwardRef, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewContainerRef } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
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
import { SvgEditorComponent } from 'objects/templates/svg-editor.component';
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
  svg: SvgEditorComponent,
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
  ngOnChanges?: (changes: SimpleChanges) => void;
}

@Component({
  selector: 'object-editor',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ObjectEditorComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => ObjectEditorComponent)
    }
  ]
})
export class ObjectEditorComponent
implements AfterViewInit, OnChanges, OnDestroy,
ControlValueAccessor, Validator {
  private _value;
  @Input() alwaysEditable: string;
  @Input() initArgs;
  @Input() isEditable: string;
  @Input() modalId: symbol;
  @Input() objType: string;
  @Input() schema;
  @Input() form;
  @Output() validityChange: EventEmitter<void> = new EventEmitter();
  get value(): unknown {
    return this._value;
  }

  @Input() set value(val: unknown) {
    this._value = val;
    if (this.ref) {
      this.ref.instance.value = this._value;
      this.onChange(this._value);
      this.valueChange.emit(this._value);
    }
  }

  @Output() valueChange = new EventEmitter();
  ref: ComponentRef<ObjectEditor>;
  componentSubscriptions = new Subscription();
  onChange: (_: unknown) => void = () => {};
  onTouch: () => void;
  onValidatorChange: () => void = () => {};

  componentValidationState: Record<string, boolean> = {};

  getComponentValidationState(): Record<string, boolean> {
    return this.componentValidationState;
  }


  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  registerOnValidatorChange?(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  writeValue(obj: string | number): void {
    if (obj === null || obj === undefined) {
      return;
    }
    this.value = obj;
  }

  registerOnChange(fn: (_: unknown) => void): void {
    this.onChange = fn;
  }

  constructor(
    private loggerService: LoggerService,
    private componentFactoryResolver: ComponentFactoryResolver,
    private viewContainerRef: ViewContainerRef
  ) { }

  ngAfterViewInit(): void {
    const editorName = this.objType.replace(
      /([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    if (editorName === (
      'list-of-sets-of-translatable-html-content-ids'
    ) && !this.initArgs
    ) {
      throw new Error('\nProvided initArgs: ' + this.initArgs);
    }
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
      if (this.schema && !ref.instance.schema) {
        ref.instance.schema = this.schema;
      }
      ref.instance.value = this.value;
      if (ref.instance.valueChanged) {
        this.componentSubscriptions.add(
          ref.instance.valueChanged.subscribe((e) => {
            if (Array.isArray(e)) {
              this.value = [...e];
              return;
            }
            // SetTimeout(() => this.value = e, 0);
            this.value = e;
          })
        );
      }
      if (ref.instance.validityChange) {
        this.componentSubscriptions.add(
          ref.instance.validityChange.subscribe((e) => {
            for (const key of Object.keys(e)) {
              if (e[key] !== true) {
                if (this.componentValidationState[key] === undefined) {
                  this.componentValidationState[key] = e[key];
                }
              } else {
                if (this.componentValidationState[key] !== undefined) {
                  delete this.componentValidationState[key];
                }
              }
              if (this.form) {
                this.form.$setValidity(key, e[key]);
                this.validityChange.emit();
              }
            }
            this.onValidatorChange();
          })
        );
      }
      this.ref = ref;
      this.ref.changeDetectorRef.detectChanges();
    } else {
      this.loggerService.error('Editor: ' + editorName + ' not supported');
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    return Object.keys(
      this.componentValidationState
    ).length > 0 ? this.componentValidationState : null;
  }

  ngOnChanges(changes: SimpleChanges): void {
  }

  ngOnDestroy(): void {
    this.componentSubscriptions.unsubscribe();
    this.viewContainerRef.clear();
    this.ref.changeDetectorRef.detach();
  }
}

angular.module('oppia').directive('objectEditor', downgradeComponent({
  component: ObjectEditorComponent
}));
