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
 * @fileoverview Component for add hint modal.
 */

import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import cloneDeep from 'lodash/cloneDeep';
import {AppConstants} from 'app.constants';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {StateHintsService} from 'components/state-editor/state-editor-properties-services/state-hints.service';
import {Hint} from 'domain/exploration/hint-object.model';
import {ContextService} from 'services/context.service';
import {GenerateContentIdService} from 'services/generate-content-id.service';
import {ExplorationEditorPageConstants} from 'pages/exploration-editor-page/exploration-editor-page.constants';
import {
  CALCULATION_TYPE_CHARACTER,
  HtmlLengthService,
} from 'services/html-length.service';

interface HintFormSchema {
  type: string;
  ui_config: object;
}

@Component({
  selector: 'oppia-add-hint-modal',
  templateUrl: './add-hint-modal.component.html',
})
export class AddHintModalComponent
  extends ConfirmOrCancelModal
  implements OnInit
{
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  hintIndex!: number;
  tmpHint: string = '';
  COMPONENT_NAME_HINT: string = AppConstants.COMPONENT_NAME_HINT;

  HINT_FORM_SCHEMA: HintFormSchema = {
    type: 'html',
    ui_config: {
      hide_complex_extensions:
        this.contextService.getEntityType() === 'question',
    },
  };

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private contextService: ContextService,
    private generateContentIdService: GenerateContentIdService,
    private ngbActiveModal: NgbActiveModal,
    private stateHintsService: StateHintsService,
    private htmlLengthService: HtmlLengthService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.hintIndex = this.stateHintsService.displayed.length + 1;
  }

  // Remove this function when schema-based-editor is
  // migrated to Angular2+.
  getSchema(): HintFormSchema {
    return this.HINT_FORM_SCHEMA;
  }

  isHintLengthExceeded(tmpHint: string): boolean {
    return Boolean(
      this.htmlLengthService.computeHtmlLength(
        tmpHint,
        CALCULATION_TYPE_CHARACTER
      ) > ExplorationEditorPageConstants.HINT_CHARACTER_LIMIT
    );
  }

  updateLocalHint($event: string): void {
    if (this.tmpHint !== $event) {
      this.tmpHint = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  saveHint(): void {
    let contentId = this.generateContentIdService.getNextStateId(
      this.COMPONENT_NAME_HINT
    );
    // Close the modal and save it afterwards.
    this.ngbActiveModal.close({
      hint: cloneDeep(Hint.createNew(contentId, this.tmpHint)),
      contentId: contentId,
    });
  }
}
