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
 * @fileoverview A helper service for the Rich text editor(RTE).
 */

import {Injectable} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';
import {ServicesConstants} from 'services/services.constants';
import {
  CustomizationArgsForRteType,
  CustomizationArgsSpecsType,
  RteHelperModalComponent,
  RteComponentId,
} from './rte-helper-modal.component';
import cloneDeep from 'lodash/cloneDeep';

const RTE_COMPONENT_SPECS = ServicesConstants.RTE_COMPONENT_SPECS;
const _RICH_TEXT_COMPONENTS = Object.values(RTE_COMPONENT_SPECS).map(spec => ({
  backendId: spec.backend_id,
  customizationArgSpecs: cloneDeep(spec.customization_arg_specs),
  id: spec.frontend_id,
  iconDataUrl: spec.icon_data_url,
  isComplex: spec.is_complex,
  isBlockElement: spec.is_block_element,
  requiresFs: spec.requires_fs,
  tooltip: spec.tooltip,
  requiresInternet: spec.requires_internet,
}));

@Injectable({
  providedIn: 'root',
})
export class RteHelperService {
  constructor(private modalService: NgbModal) {}

  getRichTextComponents(): typeof _RICH_TEXT_COMPONENTS {
    return cloneDeep(_RICH_TEXT_COMPONENTS);
  }

  isInlineComponent(
    richTextComponent: (typeof AppConstants.INLINE_RTE_COMPONENTS)[number]
  ): boolean {
    return AppConstants.INLINE_RTE_COMPONENTS.indexOf(richTextComponent) !== -1;
  }

  // The refocusFn arg is a function that restores focus to the text editor
  // after exiting the modal, and moves the cursor back to where it was
  // before the modal was opened.
  openCustomizationModal(
    componentIsNewlyCreated: boolean,
    componentId: RteComponentId,
    customizationArgSpecs: CustomizationArgsSpecsType,
    attrsCustomizationArgsDict: CustomizationArgsForRteType,
    onSubmitCallback?: (arg0: unknown) => void,
    onDismissCallback?: (reason: boolean | 'cancel') => void
  ): void {
    document.execCommand('enableObjectResizing', false);
    const modalRef = this.modalService.open(RteHelperModalComponent, {
      backdrop: 'static',
    });
    modalRef.componentInstance.componentIsNewlyCreated =
      componentIsNewlyCreated;
    modalRef.componentInstance.componentId = componentId;
    modalRef.componentInstance.customizationArgSpecs = customizationArgSpecs;
    modalRef.componentInstance.attrsCustomizationArgsDict =
      attrsCustomizationArgsDict;
    modalRef.result.then(
      result => {
        if (onSubmitCallback) {
          onSubmitCallback(result);
        }
      },
      reason => {
        if (onDismissCallback) {
          onDismissCallback(reason);
        }
      }
    );
  }
}
