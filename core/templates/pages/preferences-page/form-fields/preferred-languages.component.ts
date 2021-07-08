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

import { ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatChipList } from '@angular/material/chips';
import { LanguageIdAndText } from 'domain/utilities/language-util.service';

@Component({
  selector: 'oppia-preferred-languages',
  templateUrl: './preferred-languages.component.html'
})
export class PreferredLanguagesComponent {
  @Input() preferredLanguages: string[];
  @Input() choices: LanguageIdAndText[];
  @Output() preferredLanguagesChange: EventEmitter<string[]> = (
    new EventEmitter());
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER];
  formCtrl = new FormControl();
  @ViewChild('chipList') chipList: MatChipList;
  @ViewChild('languageInput') languageInput: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
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
    for (let i = 0; i < this.choices.length; i++) {
      if (this.choices[i].id === value) {
        availableLanguage = true;
        break;
      }
    }

    return availableLanguage &&
      this.preferredLanguages.indexOf(value) < 0 ? true : false;
  }

  add(event: { value: string }): void {
    const value = (event.value || '').trim();
    if (!value) {
      return;
    }

    if (this.validInput(value)) {
      this.preferredLanguages.push(value);
      this.preferredLanguagesChange.emit(this.preferredLanguages);
      this.languageInput.nativeElement.value = '';
    }
  }

  remove(fruit: string): void {
    const index = this.preferredLanguages.indexOf(fruit);

    if (index >= 0) {
      this.preferredLanguages.splice(index, 1);
      this.preferredLanguagesChange.emit(this.preferredLanguages);
    }
  }

  selected(event: { option: { value: string } }): void {
    if (this.preferredLanguages.indexOf(event.option.value) > -1) {
      this.remove(event.option.value);
    } else {
      this.add(event.option);
    }
  }
}
