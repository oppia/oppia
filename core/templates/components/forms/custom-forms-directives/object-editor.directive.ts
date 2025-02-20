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
/**
 * NOTE: This component creates an Object Editor Component. Since it is a
 * created by us dynamically, we have to manage the entire life cycle of the
 * component from creation to deletion. This also includes updating of @Input
 * properties and listening to @Output events. In future, if some of the @Input
 * properties change, you can pass them to the ObjectEditor using ngOnChanges
 * function.
 */

import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChange,
  SimpleChanges,
  ViewContainerRef,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {AlgebraicExpressionEditorComponent} from 'objects/templates/algebraic-expression-editor.component';
import {BooleanEditorComponent} from 'objects/templates/boolean-editor.component';
import {CodeStringEditorComponent} from 'objects/templates/code-string-editor.component';
import {CoordTwoDimEditorComponent} from 'objects/templates/coord-two-dim-editor.component';
import {AllowedVariablesEditorComponent} from 'objects/templates/allowed-variables-editor.component';
import {DragAndDropPositiveIntEditorComponent} from 'objects/templates/drag-and-drop-positive-int-editor.component';
import {FilepathEditorComponent} from 'objects/templates/filepath-editor.component';
import {FractionEditorComponent} from 'objects/templates/fraction-editor.component';
import {GraphEditorComponent} from 'objects/templates/graph-editor.component';
import {HtmlEditorComponent} from 'objects/templates/html-editor.component';
import {ImageWithRegionsEditorComponent} from 'objects/templates/image-with-regions-editor.component';
import {ListOfSetsOfTranslatableHtmlContentIdsEditorComponent} from 'objects/templates/list-of-sets-of-translatable-html-content-ids-editor.component';
import {ListOfTabsEditorComponent} from 'objects/templates/list-of-tabs-editor.component';
import {ListOfUnicodeStringEditorComponent} from 'objects/templates/list-of-unicode-string-editor.component';
import {MathEquationEditorComponent} from 'objects/templates/math-equation-editor.component';
import {MathExpressionContentEditorComponent} from 'objects/templates/math-expression-content-editor.component';
import {MusicPhraseEditorComponent} from 'objects/templates/music-phrase-editor.component';
import {NonnegativeIntEditorComponent} from 'objects/templates/nonnegative-int-editor.component';
import {NormalizedStringEditorComponent} from 'objects/templates/normalized-string-editor.component';
import {NumberWithUnitsEditorComponent} from 'objects/templates/number-with-units-editor.component';
import {NumericExpressionEditorComponent} from 'objects/templates/numeric-expression-editor.component';
import {ParameterNameEditorComponent} from 'objects/templates/parameter-name-editor.component';
import {PositionOfTermsEditorComponent} from 'objects/templates/position-of-terms-editor.component';
import {PositiveIntEditorComponent} from 'objects/templates/positive-int-editor.component';
import {RatioExpressionEditorComponent} from 'objects/templates/ratio-expression-editor.component';
import {RealEditorComponent} from 'objects/templates/real-editor.component';
import {SanitizedUrlEditorComponent} from 'objects/templates/sanitized-url-editor.component';
import {SetOfAlgebraicIdentifierEditorComponent} from 'objects/templates/set-of-algebraic-identifier-editor.component';
import {SetOfTranslatableHtmlContentIdsEditorComponent} from 'objects/templates/set-of-translatable-html-content-ids-editor.component';
import {SetOfUnicodeStringEditorComponent} from 'objects/templates/set-of-unicode-string-editor.component';
import {SkillSelectorEditorComponent} from 'objects/templates/skill-selector-editor.component';
import {SubtitledHtmlEditorComponent} from 'objects/templates/subtitled-html-editor.component';
import {SubtitledUnicodeEditorComponent} from 'objects/templates/subtitled-unicode-editor.component';
import {SvgEditorComponent} from 'objects/templates/svg-editor.component';
import {TranslatableHtmlContentIdEditorComponent} from 'objects/templates/translatable-html-content-id.component';
import {TranslatableSetOfNormalizedStringEditorComponent} from 'objects/templates/translatable-set-of-normalized-string-editor.component';
import {TranslatableSetOfUnicodeStringEditorComponent} from 'objects/templates/translatable-set-of-unicode-string-editor.component';
import {UnicodeStringEditorComponent} from 'objects/templates/unicode-string-editor.component';
import {IntEditorComponent} from 'objects/templates/int-editor.component';
import {LoggerService} from 'services/contextual/logger.service';
import {ComponentRef} from '@angular/core';
import {Subscription} from 'rxjs';
import {SchemaDefaultValue} from 'services/schema-default-value.service';
const EDITORS = {
  'algebraic-expression': AlgebraicExpressionEditorComponent,
  boolean: BooleanEditorComponent,
  'code-string': CodeStringEditorComponent,
  'coord-two-dim': CoordTwoDimEditorComponent,
  'allowed-variables': AllowedVariablesEditorComponent,
  'drag-and-drop-positive-int': DragAndDropPositiveIntEditorComponent,
  filepath: FilepathEditorComponent,
  fraction: FractionEditorComponent,
  graph: GraphEditorComponent,
  html: HtmlEditorComponent,
  'image-with-regions': ImageWithRegionsEditorComponent,
  int: IntEditorComponent,
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
  initArgs: SchemaDefaultValue;
  isEditable: string;
  modalId: symbol;
  objType: string;
  schema: SchemaDefaultValue;
  value: SchemaDefaultValue;
  valueChanged?: EventEmitter<SchemaDefaultValue>;
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
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ObjectEditorComponent),
      multi: true,
    },
  ],
})
export class ObjectEditorComponent
  implements
    AfterViewInit,
    OnChanges,
    OnDestroy,
    ControlValueAccessor,
    Validator
{
  private _value: SchemaDefaultValue;
  @Input() alwaysEditable: string;
  @Input() initArgs: SchemaDefaultValue;
  @Input() isEditable: string;
  @Input() modalId: symbol;
  @Input() objType: string;
  @Input() schema;
  @Input() form;
  @Output() validityChange: EventEmitter<void> = new EventEmitter();
  get value(): SchemaDefaultValue {
    return this._value;
  }

  @Input() set value(val: SchemaDefaultValue) {
    const previousValue = this._value;
    this._value = val;
    // Ng-model can call write-obj before we create the component. Hence a
    // check to see if component has been created.
    if (this.componentRef) {
      this.componentRef.instance.value = this._value;
      this.onChange(this._value);
      this.valueChange.emit(this._value);
      if (this.componentRef.instance.ngOnChanges) {
        const componentInputPropsChangeObject: SimpleChanges = {
          value: new SimpleChange(previousValue, val, false),
        };
        this.componentRef.instance.ngOnChanges(componentInputPropsChangeObject);
      }
    }
  }

  @Output() valueChange = new EventEmitter();
  componentRef: ComponentRef<ObjectEditor>;
  componentSubscriptions = new Subscription();
  onChange: (_: SchemaDefaultValue) => void = () => {};
  onTouch: () => void;
  onValidatorChange: () => void = () => {};

  // A hashmap is used instead of an array for faster lookup.
  componentErrors: Record<string, false> = {};

  getComponentValidationState(): Record<string, boolean> {
    return this.componentErrors;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  registerOnValidatorChange?(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  writeValue(obj: SchemaDefaultValue): void {
    if (obj === null || obj === undefined) {
      return;
    }
    this.value = obj;
  }

  registerOnChange(fn: (_: SchemaDefaultValue) => void): void {
    this.onChange = fn;
  }

  constructor(
    private loggerService: LoggerService,
    private componentFactoryResolver: ComponentFactoryResolver,
    private viewContainerRef: ViewContainerRef
  ) {}

  ngAfterViewInit(): void {
    const editorName = this.objType
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
    if (
      editorName === 'list-of-sets-of-translatable-html-content-ids' &&
      !this.initArgs
    ) {
      throw new Error('\nProvided initArgs: ' + this.initArgs);
    }
    if (EDITORS.hasOwnProperty(editorName)) {
      if (
        editorName === 'list-of-sets-of-translatable-html-content-ids' &&
        !this.initArgs
      ) {
        throw new Error('\nProvided initArgs: ' + this.initArgs);
      }
      const componentFactory =
        this.componentFactoryResolver.resolveComponentFactory(
          EDITORS[editorName]
        );
      this.viewContainerRef.clear();
      // Unknown is type is used because it is default property of
      // createComponent. This is used to access the instance of the
      // component created. The type of the instance is not known.
      const componentRef = this.viewContainerRef.createComponent<unknown>(
        componentFactory
      ) as ComponentRef<ObjectEditor>;

      componentRef.instance.alwaysEditable = this.alwaysEditable;
      componentRef.instance.initArgs = this.initArgs;
      componentRef.instance.isEditable = this.isEditable;
      componentRef.instance.modalId = this.modalId;
      componentRef.instance.objType = this.objType;

      // Some Object editors have a schema predefined. In order to not
      // replace it with an undefined value, we check if "this.schema" is
      // defined and component doesn't have its own schema property.
      if (this.schema && !componentRef.instance.schema) {
        componentRef.instance.schema = this.schema;
      }
      componentRef.instance.value = this.value;

      // Listening to @Output events (valueChanged and validityChange).
      if (componentRef.instance.valueChanged) {
        this.componentSubscriptions.add(
          componentRef.instance.valueChanged.subscribe(newValue => {
            // Changes to array are not caught if the array reference doesn't
            // change. This is a hack for change detection.
            if (Array.isArray(newValue)) {
              this.value = [...newValue];
              return;
            }
            this.value = newValue;
          })
        );
      }
      if (componentRef.instance.validityChange) {
        this.componentSubscriptions.add(
          componentRef.instance.validityChange.subscribe(errorsMap => {
            for (const errorKey of Object.keys(errorsMap)) {
              // Errors map contains true for a key if valid state and false
              // for an error state. We remove the key from componentErrors
              // when it is valid and add it when it is reported as error.
              const errorState = errorsMap[errorKey];
              if (errorState !== true) {
                if (this.componentErrors[errorKey] === undefined) {
                  this.componentErrors[errorKey] = errorState;
                }
              } else {
                if (this.componentErrors[errorKey] !== undefined) {
                  delete this.componentErrors[errorKey];
                }
              }
              if (this.form) {
                this.form.$setValidity(errorKey, errorsMap[errorKey]);
                this.validityChange.emit();
              }
            }
            this.onValidatorChange();
          })
        );
      }
      this.componentRef = componentRef;
      this.componentRef.changeDetectorRef.detectChanges();
    } else {
      this.loggerService.error('Editor: ' + editorName + ' not supported');
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    return Object.keys(this.componentErrors).length > 0
      ? this.componentErrors
      : null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // This is left empty on purpose. See NOTE at the top.
  }

  ngOnDestroy(): void {
    this.componentSubscriptions.unsubscribe();
    this.viewContainerRef.clear();
    this.componentRef.changeDetectorRef.detach();
  }
}
