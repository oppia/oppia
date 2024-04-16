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
 * @fileoverview Component for license explanation modal.
 */

import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

@Component({
  selector: 'oppia-license-explanation-modal',
  templateUrl: './license-explanation-modal.component.html',
})
export class LicenseExplanationModalComponent extends ConfirmOrCancelModal {
  SITE_NAME = AppConstants.SITE_NAME;
  LICENSE_LINK =
    '<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank">CC-BY-SA v4.0</a>';

  constructor(private ngbActiveModal: NgbActiveModal) {
    super(ngbActiveModal);
  }
}
