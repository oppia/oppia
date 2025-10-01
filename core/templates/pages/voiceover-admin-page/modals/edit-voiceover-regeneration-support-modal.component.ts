// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Modify language accent settings for Oppia’s voiceover.
 */

import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {AppConstants} from 'app.constants';

@Component({
  selector: 'oppia-edit-voiceover-regeneration-support-modal',
  templateUrl: './edit-voiceover-regeneration-support-modal.component.html',
})
export class EditVoiceoverRegenerationSupportModalComponent extends ConfirmOrCancelModal {
  languageAccentDescription: string = '';
  languageDescription: string = '';
  languageCode: string = '';
  supportsAutogeneration!: boolean;
  headerText: string = '';
  constantsFileLocation: string =
    'https://github.com/oppia/oppia/blob/develop/assets/constants.ts';

  languageCodePresentForMathSymbolPronunciations: boolean = false;
  languageCodePresentInConstants: boolean = false;

  constructor(private ngbActiveModal: NgbActiveModal) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.headerText = this.supportsAutogeneration
      ? `Do you want to turn on autogeneration for ${this.languageDescription} voiceovers?`
      : `Do you want to turn off autogeneration for ${this.languageDescription} voiceovers?`;

    // Verify if the language code exists in the constants file for both math
    // symbol pronunciations and sentence ending highlights.
    this.languageCodePresentInConstants =
      AppConstants.LANGUAGE_CODE_TO_SENTENCE_ENDING_PUNCTUATION_MARKS.hasOwnProperty(
        this.languageCode
      ) &&
      AppConstants.LANGUAGE_CODE_TO_MATH_SYMBOL_PRONUNCIATIONS.hasOwnProperty(
        this.languageCode
      );
  }

  cancel(): void {
    this.ngbActiveModal.dismiss();
  }

  update(): void {
    this.ngbActiveModal.close();
  }
}
