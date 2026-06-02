// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Modal shown when a contributor chooses to skip translation
 * onboarding.
 */

import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'oppia-translation-onboarding-skip-confirmation-modal',
  templateUrl:
    './translation-onboarding-skip-confirmation-modal.component.html',
})
export class TranslationOnboardingSkipConfirmationModalComponent {
  constructor(private activeModal: NgbActiveModal) {}

  skipTour(dontShowAgain: boolean): void {
    this.activeModal.close(dontShowAgain);
  }

  cancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
