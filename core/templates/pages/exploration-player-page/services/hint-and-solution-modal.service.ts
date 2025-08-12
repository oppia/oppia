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
 * @fileoverview Service for showing the hint and solution modals.
 */

import {Injectable, Optional} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DisplayHintModalComponent} from '../current-lesson-player/modals/display-hint-modal.component';
import {DisplaySolutionInterstititalModalComponent} from '../current-lesson-player/modals/display-solution-interstitial-modal.component';
import {DisplaySolutionModalComponent} from '../current-lesson-player/modals/display-solution-modal.component';
import {DisplayNewHintModalComponent} from '../new-lesson-player/conversation-skin-components/conversation-display-components/display-new-hint-modal.component';
import {
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {DisplayNewSolutionModalComponent} from '../new-lesson-player/conversation-skin-components/conversation-display-components/display-new-solution-modal.component';
import {DisplayNewSolutionInterstititalModalComponent} from '../new-lesson-player/conversation-skin-components/conversation-display-components/display-new-solution-interstitial-modal.component';

const MOBILE_SCREEN_BREAKPOINT = 480;

@Injectable({
  providedIn: 'root',
})
export class HintAndSolutionModalService {
  constructor(
    // @Optional() is used because at a time only one
    // modal service will be injected based upon the
    // screen size, other will be null.
    @Optional() private ngbModal: NgbModal,
    @Optional() private bottomSheet: MatBottomSheet,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  displayHintModal(index: number): NgbModalRef {
    let modalRef: NgbModalRef = this.ngbModal.open(DisplayHintModalComponent, {
      backdrop: 'static',
    });
    modalRef.componentInstance.index = index;
    return modalRef;
  }

  displaySolutionModal(): NgbModalRef {
    return this.ngbModal.open(DisplaySolutionModalComponent, {
      backdrop: 'static',
    });
  }

  displayNewSolutionModal():
    | NgbModalRef
    | MatBottomSheetRef<DisplayNewSolutionModalComponent> {
    if (this.windowDimensionsService.getWidth() > MOBILE_SCREEN_BREAKPOINT) {
      const modalRef: NgbModalRef = this.ngbModal.open(
        DisplayNewSolutionModalComponent,
        {
          backdrop: 'static',
        }
      );
      return modalRef;
    } else {
      const bottomSheetRef = this.bottomSheet.open(
        DisplayNewSolutionModalComponent,
        {
          data: {},
          disableClose: true,
        }
      );

      return bottomSheetRef;
    }
  }

  displayNewHintModal(
    index: number
  ): NgbModalRef | MatBottomSheetRef<DisplayNewHintModalComponent> {
    if (this.windowDimensionsService.getWidth() > MOBILE_SCREEN_BREAKPOINT) {
      const modalRef: NgbModalRef = this.ngbModal.open(
        DisplayNewHintModalComponent,
        {
          backdrop: 'static',
        }
      );
      modalRef.componentInstance.activeHintIndex = index;
      return modalRef;
    } else {
      const bottomSheetRef = this.bottomSheet.open(
        DisplayNewHintModalComponent,
        {
          data: {activeHintIndex: index},
        }
      );

      return bottomSheetRef;
    }
  }

  displaySolutionInterstitialModal(): NgbModalRef {
    return this.ngbModal.open(DisplaySolutionInterstititalModalComponent, {
      backdrop: 'static',
    });
  }

  displayNewSolutionInterstitialModal():
    | NgbModalRef
    | MatBottomSheetRef<DisplayNewSolutionInterstititalModalComponent> {
    if (this.windowDimensionsService.getWidth() > MOBILE_SCREEN_BREAKPOINT) {
      const modalRef: NgbModalRef = this.ngbModal.open(
        DisplayNewSolutionInterstititalModalComponent,
        {
          backdrop: 'static',
        }
      );
      return modalRef;
    } else {
      const bottomSheetRef = this.bottomSheet.open(
        DisplayNewSolutionInterstititalModalComponent,
        {
          data: {},
          disableClose: true,
        }
      );

      return bottomSheetRef;
    }
  }
}
