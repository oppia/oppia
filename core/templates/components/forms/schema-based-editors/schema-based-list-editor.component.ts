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
 * @fileoverview Component for a schema-based editor for lists.
 */

import {Component, forwardRef, Input} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {Subscription} from 'rxjs';
import {Validator as OppiaValidator} from 'interactions/TextInput/directives/text-input-validation.service';
import {IdGenerationService} from 'services/id-generation.service';
import {
  Schema,
  SchemaDefaultValue,
  SchemaDefaultValueService,
} from 'services/schema-default-value.service';
import {SchemaFormSubmittedService} from 'services/schema-form-submitted.service';
import {SchemaUndefinedLastElementService} from 'services/schema-undefined-last-element.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
@Component({
  selector: 'schema-based-list-editor',
  templateUrl: './schema-based-list-editor.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SchemaBasedListEditorComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SchemaBasedListEditorComponent),
      multi: true,
    },
  ],
})
export class SchemaBasedListEditorComponent
  implements ControlValueAccessor, Validator
{
  _localValue: SchemaDefaultValue[] = [];
  @Input() set localValue(val: SchemaDefaultValue[]) {
    this._localValue = val;
  }

  get localValue(): SchemaDefaultValue[] {
    return this._localValue;
  }

  directiveSubscriptions = new Subscription();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() disabled!: boolean;
  // Read-only property. The schema definition for each item in the list.
  @Input() itemSchema!: {
    ui_config: {coding_mode: boolean; rows: number};
  } & Schema;
  // The length of the list. If not specified, the list is of arbitrary
  // length.

  @Input() len!: number;
  @Input() uiConfig!: {add_element_text: string};
  @Input() validators!: OppiaValidator[];
  @Input() labelForFocusTarget!: string;
  addElementText!: string;
  // Min list length is null when their is no validator set for the minimum
  // length.
  minListLength!: number | null;
  // Max list length is null when their is no validator set for the maximum
  // length.
  maxListLength!: number | null;
  onChange: (value: SchemaDefaultValue[]) => void = (
    _: SchemaDefaultValue[]
  ) => {};

  isAddItemButtonPresent: boolean = false;
  isOneLineInput: boolean = false;
  showDuplicatesWarning: boolean = false;
  constructor(
    private focusManagerService: FocusManagerService,
    private idGenerationService: IdGenerationService,
    private schemaDefaultValueService: SchemaDefaultValueService,
    private schemaFormSubmittedService: SchemaFormSubmittedService,
    private schemaUndefinedLastElementService: SchemaUndefinedLastElementService
  ) {}

  writeValue(value: SchemaDefaultValue[]): void {
    if (Array.isArray(value)) {
      this.localValue = value;
    }
  }

  registerOnChange(fn: (value: SchemaDefaultValue[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {}

  validate(control: AbstractControl): ValidationErrors {
    return {};
  }

  baseFocusLabel: string = '';
  getFocusLabel(index: number): string {
    // Treat the first item in the list as a special case -- if this list
    // is contained in another list, and the outer list is opened with a
    // desire to autofocus on the first input field, we can then focus on
    // the given $scope.labelForFocusTarget().
    // NOTE: This will cause problems for lists nested within lists, since
    // sub-element 0 > 1 will have the same label as sub-element 1 > 0.
    // But we will assume (for now) that nested lists won't be used -- if
    // they are, this will need to be changed.
    return index === 0
      ? this.baseFocusLabel
      : this.baseFocusLabel + index.toString();
  }

  private _deleteEmptyElements(): void {
    for (let i = 0; i < this.localValue.length - 1; i++) {
      const val = this.localValue[i] as SchemaDefaultValue[];
      if (val.length === 0) {
        this.deleteElement(i);
        i--;
      }
    }
  }

  hasDuplicates(): boolean {
    let valuesSoFar: Record<string | number, SchemaDefaultValue> = {};
    for (let i = 0; i < this.localValue.length; i++) {
      const value = this.localValue[i];
      if (!valuesSoFar.hasOwnProperty(value as string)) {
        valuesSoFar[value as string] = true;
      } else {
        return true;
      }
    }
    return false;
  }

  lastElementOnBlur(): void {
    this._deleteLastElementIfUndefined();
    this.showAddItemButton();
  }

  addElement(): void {
    if (this.isOneLineInput) {
      this.hideAddItemButton();
    }

    this.localValue.push(
      this.schemaDefaultValueService.getDefaultValue(this.itemSchema)
    );
    this.focusManagerService.setFocus(
      this.getFocusLabel(this.localValue.length - 1)
    );
    // This is to prevent the autofocus behaviour of the input field to scroll
    // to top of the page when the user is adding a new element.
    this.focusManagerService.schemaBasedListEditorIsActive = true;
  }

  private _deleteLastElementIfUndefined(): void {
    const lastValueIndex = this.localValue.length - 1;
    const valueToConsiderUndefined =
      this.schemaUndefinedLastElementService.getUndefinedValue(this.itemSchema);
    if (
      this.localValue[lastValueIndex] === valueToConsiderUndefined &&
      this.localValue[lastValueIndex] !== ''
    ) {
      this.deleteElement(lastValueIndex);
    }
  }

  showAddItemButton(): void {
    this._deleteEmptyElements();
    this.isAddItemButtonPresent = true;
  }

  hideAddItemButton(): void {
    this.isAddItemButtonPresent = false;
  }

  _onChildFormSubmit(): void {
    if (!this.isAddItemButtonPresent) {
      /**
       * If form submission happens on last element of the set (i.e
       * the add item button is absent) then automatically add the
       * element to the list.
       */
      if (
        (this.maxListLength === null ||
          this.localValue.length < this.maxListLength) &&
        !!this.localValue[this.localValue.length - 1]
      ) {
        this.addElement();
      }
    } else {
      /**
       * If form submission happens on existing element remove focus
       * from it
       */
      (document.activeElement as HTMLElement).blur();
    }
  }

  deleteElement(index: number): void {
    // Need to let the RTE know that HtmlContent has been changed.
    this.localValue.splice(index, 1);
  }

  setValue(val: SchemaDefaultValue, index: number): void {
    if (val === null) {
      return;
    }
    this.localValue[index] = val;
    this.localValue = [...this.localValue];
    this.onChange(this.localValue);
  }

  trackByIndex(index: number): number {
    return index;
  }

  ngOnInit(): void {
    this.baseFocusLabel =
      this.labelForFocusTarget ||
      this.idGenerationService.generateNewId() + '-';
    this.isAddItemButtonPresent = true;
    this.addElementText = 'Add element';
    if (this.uiConfig && this.uiConfig.add_element_text) {
      this.addElementText = this.uiConfig.add_element_text;
    }

    // Only hide the 'add item' button in the case of single-line unicode
    // input.
    this.isOneLineInput = true;
    if (
      this.itemSchema.type !== 'unicode' ||
      this.itemSchema.hasOwnProperty('choices')
    ) {
      this.isOneLineInput = false;
    } else if (this.itemSchema.ui_config) {
      if (this.itemSchema.ui_config.coding_mode) {
        this.isOneLineInput = false;
      } else if (
        this.itemSchema.ui_config.hasOwnProperty('rows') &&
        this.itemSchema.ui_config.rows > 2
      ) {
        this.isOneLineInput = false;
      }
    }

    this.minListLength = null;
    this.maxListLength = null;
    this.showDuplicatesWarning = false;
    if (this.validators) {
      for (var i = 0; i < this.validators.length; i++) {
        if (this.validators[i].id === 'has_length_at_most') {
          let maxValue = this.validators[i].max_value;
          this.maxListLength = maxValue !== undefined ? maxValue : null;
        } else if (this.validators[i].id === 'has_length_at_least') {
          let minValue = this.validators[i].min_value;
          this.minListLength = minValue !== undefined ? minValue : null;
        } else if (this.validators[i].id === 'is_uniquified') {
          this.showDuplicatesWarning = true;
        }
      }
    }

    while (
      this.localValue &&
      this.minListLength &&
      this.localValue.length < this.minListLength
    ) {
      this.localValue.push(
        this.schemaDefaultValueService.getDefaultValue(this.itemSchema)
      );
    }

    if (this.len === undefined) {
      if (this.localValue && this.localValue.length === 1) {
        if ((this.localValue[0] as SchemaDefaultValue[]).length === 0) {
          this.isAddItemButtonPresent = false;
        }
      }

      this.directiveSubscriptions.add(
        this.schemaFormSubmittedService.onSubmittedSchemaBasedForm.subscribe(
          () => this._onChildFormSubmit()
        )
      );
    } else {
      if (this.len <= 0) {
        throw new Error('Invalid length for list editor: ' + this.len);
      }
      if (this.len !== this.localValue.length) {
        throw new Error(
          'List editor length does not match length of input value: ' +
            this.len +
            ' ' +
            this.localValue
        );
      }
    }
  }
}
