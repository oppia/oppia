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
 * @fileoverview Preferred languages component.
 */

import {ENTER} from '@angular/cdk/keycodes';
import {
  AfterViewInit,
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
import {LanguageIdAndText} from 'domain/utilities/language-util.service';

@Component({
  selector: 'oppia-preferred-languages',
  templateUrl: './preferred-languages.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PreferredLanguagesComponent),
      multi: true,
    },
  ],
})
export class PreferredLanguagesComponent
  implements AfterViewInit, ControlValueAccessor
{
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @ViewChild('chipList') chipList!: MatChipList;
  @ViewChild('languageInput') languageInput!: ElementRef<HTMLInputElement>;
  @Input() preferredLanguages!: string[];
  @Input() choices!: LanguageIdAndText[];

  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER];
  formCtrl = new FormControl();
  filteredChoices: LanguageIdAndText[] = [];
  searchQuery: string = '';

  // Implementing the ControlValueAccessor interface through the following
  // 5 methods to make the component work as a form field.
  onChange: (value: string[]) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string[]): void {
    if (value !== undefined) {
      this.preferredLanguages = value;
    }
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  resetLanguageSearch(): void {
    this.searchQuery = '';
    this.filteredChoices = this.choices;
  }

  ngAfterViewInit(): void {
    this.formCtrl.valueChanges.subscribe((value: string) => {
      if (!this.validInput(value)) {
        this.chipList.errorState = true;
      } else {
        this.chipList.errorState = false;
      }
    });
  }

  validInput(value: string): boolean {
    let availableLanguage = false;
    for (let i = 0; i < this.filteredChoices.length; i++) {
      if (this.filteredChoices[i].id === value) {
        availableLanguage = true;
        break;
      }
    }
    return availableLanguage && this.preferredLanguages.indexOf(value) < 0
      ? true
      : false;
  }

  add(event: {value: string}): void {
    const value = (event.value || '').trim();
    if (!value) {
      return;
    }

    if (this.validInput(value)) {
      this.preferredLanguages.push(value);
      this.onChange(this.preferredLanguages);
      this.languageInput.nativeElement.value = '';
    }
    this.resetLanguageSearch();
  }

  remove(fruit: string): void {
    const index = this.preferredLanguages.indexOf(fruit);

    if (index >= 0) {
      this.preferredLanguages.splice(index, 1);
      this.onChange(this.preferredLanguages);
    }
  }

  selected(event: {option: {value: string}}): void {
    if (this.preferredLanguages.indexOf(event.option.value) > -1) {
      this.remove(event.option.value);
    } else {
      this.add(event.option);
    }
  }

  onSearchInputChange(): void {
    if (this.searchQuery) {
      this.filteredChoices = this.choices.filter(choice => {
        const lowerSearchQuery = this.searchQuery.toLowerCase();
        return (
          choice.text.toLowerCase().includes(lowerSearchQuery) ||
          choice.id.toLowerCase().includes(lowerSearchQuery)
        );
      });
    } else {
      this.filteredChoices = [];
    }
  }
}
