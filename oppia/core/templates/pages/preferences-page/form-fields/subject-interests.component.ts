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
  forwardRef,
  Input,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import {MatChipList} from '@angular/material/chips';
import cloneDeep from 'lodash/cloneDeep';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'oppia-subject-interests',
  templateUrl: './subject-interests.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SubjectInterestsComponent),
      multi: true,
    },
  ],
})
export class SubjectInterestsComponent implements ControlValueAccessor {
  @Input() subjectInterests: string[] = [];

  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER];
  formCtrl = new FormControl();
  filteredSubjectInterests: Observable<string[]>;
  allSubjectInterests: string[] = [];
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @ViewChild('chipList') chipList!: MatChipList;
  @ViewChild('subjectInterestInput')
  subjectInterestInput!: ElementRef<HTMLInputElement>;

  constructor() {
    this.filteredSubjectInterests = this.formCtrl.valueChanges.pipe(
      startWith(null),
      map((interest: string | null) =>
        interest ? this.filter(interest) : this.allSubjectInterests.slice()
      )
    );
  }

  // Implementing the ControlValueAccessor interface through the following
  // 5 methods to make the component work as a form field.
  onChange: (value: string[]) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string[]): void {
    if (value !== undefined) {
      this.subjectInterests = value;
    }
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  ngOnInit(): void {
    this.formCtrl.valueChanges.subscribe((value: string) => {
      if (!this.isValidInput(value)) {
        this.chipList.errorState = true;
      } else {
        this.chipList.errorState = false;
      }
    });
    this.allSubjectInterests = cloneDeep(this.subjectInterests);
  }

  isValidInput(value: string): boolean {
    // The following regex matches only lowercase
    // alphabetic characters and spaces.
    let validRegex = new RegExp('^[a-z\\s]*$');

    return validRegex.test(value) && !this.subjectInterests.includes(value);
  }

  add(event: {value: string}): void {
    const value = (event.value || '').trim();
    if (!value) {
      return;
    }

    if (this.isValidInput(value)) {
      this.subjectInterests.push(value);
      if (this.allSubjectInterests.indexOf(value) < 0) {
        this.allSubjectInterests.push(value);
      }
      this.onChange(this.subjectInterests);
      this.subjectInterestInput.nativeElement.value = '';
    }
  }

  remove(interest: string): void {
    const index = this.subjectInterests.indexOf(interest);

    if (index >= 0) {
      this.subjectInterests.splice(index, 1);
      this.onChange(this.subjectInterests);
    }
  }

  selected(event: {option: {value: string}}): void {
    if (this.subjectInterests.indexOf(event.option.value) > -1) {
      this.remove(event.option.value);
    } else {
      this.add(event.option);
    }
  }

  filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.allSubjectInterests.filter(interest =>
      interest.toLowerCase().includes(filterValue)
    );
  }
  onBlur(): void {
    // `nativeElement.value` represents the current value of the input field in the DOM.
    const value = this.subjectInterestInput.nativeElement.value.trim();

    if (value && this.isValidInput(value)) {
      this.subjectInterests.push(value);
      this.subjectInterestInput.nativeElement.value = '';
      this.onChange(this.subjectInterests);
    }
  }

  onInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const inputValue = inputElement.value.trim();

    if (!inputValue) {
      this.formCtrl.markAsPristine();
      return;
    }

    if (this.isValidInput(inputValue)) {
      this.formCtrl.markAsDirty();
      this.onChange(this.subjectInterests);
    }
  }
}
