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
 * @fileoverview Component for the Continue button in exploration player and
 * editor.
 */

import {Component, Input, Output, EventEmitter} from '@angular/core';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';

@Component({
  selector: 'oppia-continue-button',
  templateUrl: './continue-button.component.html',
})
export class ContinueButtonComponent {
  @Input() isLearnAgainButton: boolean = false;
  // This property is initialized using component interactions
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() focusLabel!: string;
  @Output() clickContinueButton: EventEmitter<void> = new EventEmitter();

  constructor(private i18nLanguageCodeService: I18nLanguageCodeService) {}

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }
}
