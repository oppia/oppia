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
 * @fileoverview Component for confirm formula as text modal.
 */

import {Component, Optional} from '@angular/core';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

@Component({
  selector: 'oppia-confirm-formula-as-text-modal',
  templateUrl: './confirm-formula-as-text-modal.component.html',
})
export class ConfirmFormulaAsTextModalComponent extends ConfirmOrCancelModal {
  constructor(
    @Optional() ngbActiveModal: NgbActiveModal,
    @Optional()
    bottomSheetRef?: MatBottomSheetRef<ConfirmFormulaAsTextModalComponent>
  ) {
    super(ngbActiveModal, bottomSheetRef);
  }
}
