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
 * @fileoverview Component for the preferred language selector.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';

interface Language {
  id: string;
  text: string;
  dir: string;
}

@Component({
  selector: 'oppia-preferred-language-selector',
  templateUrl: './preferred-language-selector.component.html'
})
export class PreferredSiteLanguageSelectorComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() preferredLanguageCode!: string;
  @Input() choices!: Language[];
  @Input() entity!: string;
  @Output() preferredLanguageCodeChange: EventEmitter<string> = (
    new EventEmitter());

  filteredChoices!: Language[];

  ngOnInit(): void {
    this.filteredChoices = this.choices;
  }

  filterChoices(searchTerm: string): void {
    this.filteredChoices = this.choices.filter(
      lang => lang.text.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1);
  }

  updateLanguage(code: string): void {
    this.preferredLanguageCode = code;
    this.preferredLanguageCodeChange.emit(this.preferredLanguageCode);
  }
}
