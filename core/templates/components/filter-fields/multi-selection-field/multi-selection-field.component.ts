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
 * @fileoverview Component for subject interests form field.
 */

import {ENTER} from '@angular/cdk/keycodes';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatChipList} from '@angular/material/chips';
import cloneDeep from 'lodash/cloneDeep';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'oppia-multi-selection-field',
  templateUrl: './multi-selection-field.component.html',
})
export class MultiSelectionFieldComponent {
  @Input() selections: string[] = [];
  @Output() selectionsChange: EventEmitter<string[]> = new EventEmitter();

  @Input() label!: string;
  @Input() placeholder!: string;
  @Input() selectable = true;
  @Input() removable = true;
  @Input() separatorKeysCodes: number[] = [ENTER];
  @Input() validationErrorMessage = '';
  @Input() allowLowercaseOnly: boolean = false;

  formCtrl = new FormControl();
  filteredSelections: Observable<string[] | string[]>;
  readOnlySelections: string[] = [];

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @ViewChild('chipList') chipList!: MatChipList;
  @ViewChild('newSelectionInput')
  newSelectionInput!: ElementRef<HTMLInputElement>;

  constructor() {
    this.filteredSelections = this.formCtrl.valueChanges.pipe(
      startWith(null),
      map((interest: string | null) =>
        interest ? this.filter(interest) : this.readOnlySelections.slice()
      )
    );
  }

  ngOnInit(): void {
    this.formCtrl.valueChanges.subscribe((value: string) => {
      if (!this.validateInput(value)) {
        this.chipList.errorState = true;
      } else {
        this.chipList.errorState = false;
      }
    });
    this.readOnlySelections = cloneDeep(this.selections);
  }

  validateInput(value: string): boolean {
    if (this.allowLowercaseOnly) {
      if (value.toLowerCase() !== value) {
        return false;
      }
    }

    return this.selections
      .map(s => s.toLowerCase())
      .indexOf(value.toLowerCase()) < 0
      ? true
      : false;
  }

  add(event: {value: string}): void {
    const value = (event.value || '').trim();
    if (!value) {
      return;
    }

    if (this.validateInput(value)) {
      this.selections.push(value);
      if (this.readOnlySelections.indexOf(value) < 0) {
        this.readOnlySelections.push(value);
      }
      this.selectionsChange.emit(this.selections);
      this.newSelectionInput.nativeElement.value = '';
    }
  }

  remove(interest: string): void {
    const index = this.selections.indexOf(interest);

    if (index >= 0) {
      this.selections.splice(index, 1);
      this.selectionsChange.emit(this.selections);
    }
  }

  selected(event: {option: {value: string}}): void {
    if (this.selections.indexOf(event.option.value) > -1) {
      this.remove(event.option.value);
    } else {
      this.add(event.option);
    }
  }

  filter(value: string): string[] {
    const filterValue = value.toLocaleLowerCase();

    return this.readOnlySelections.filter(selection => {
      return selection.toLowerCase().includes(filterValue);
    });
  }
}
