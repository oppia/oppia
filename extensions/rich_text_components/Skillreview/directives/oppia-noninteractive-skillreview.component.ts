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
 * @fileoverview Directive for the concept card rich-text component.
 */

/**
 * IMPORTANT NOTE:
 * All of the RTE components follow this pattern of updateView and ngOnChanges.
 * This is because these are also web-components (So basically, we can create
 * this component using document.createElement). CKEditor creates instances of
 * these on the fly and runs ngOnInit before we can set the @Input properties.
 * When the input properties are not set, we get errors in the console.
 * The `if` condition in update view prevents that from happening.
 * The `if` condition in the updateView and ngOnChanges might look like the
 * literal opposite but that's not the case. We know from the previous
 * statements above that the if condition in the updateView is for preventing
 * the code to run until all the values needed for successful execution are
 * present. The if condition in ngOnChanges is to optimize the re-runs of
 * updateView and only re-run when a property we care about has changed in
 * value.
 */

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { ContextService } from 'services/context.service';
import { CkEditorCopyContentService } from 'components/ck-editor-helpers/ck-editor-copy-content.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { OppiaNoninteractiveSkillreviewConceptCardModalComponent } from './oppia-noninteractive-skillreview-concept-card-modal.component';

@Component({
  selector: 'oppia-noninteractive-skillreview',
  templateUrl: './skillreview.component.html'
})
export class NoninteractiveSkillreview implements OnInit, OnChanges {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() skillIdWithValue!: string;
  @Input() textWithValue!: string;
  skillId!: string;
  linkText!: string;
  entityId!: string;
  entityType?: string;


  constructor(
    private ckEditorCopyContentService: CkEditorCopyContentService,
    private contextService: ContextService,
    private htmlEscaperService: HtmlEscaperService,
    private ngbModal: NgbModal
  ) {}

  private _updateViewOnNewSkillSelected(): void {
    if (!this.skillIdWithValue || !this.textWithValue) {
      return;
    }
    this.skillId = this.htmlEscaperService.escapedJsonToObj(
      this.skillIdWithValue) as string;
    this.linkText = this.htmlEscaperService.escapedJsonToObj(
      this.textWithValue) as string;
  }

  ngOnInit(): void {
    this._updateViewOnNewSkillSelected();
  }

  // The default onclick behaviour for an element inside CKEditor
  // is to open the customize RTE modal. Since this RTE has a custom
  // onclick listener attached, the default behaviour is to open the
  // concept card modal. To correct this, check if the element is
  // inside the context of a CKEditor instance. If so, prevent
  // the opening of the concept card and allow the customize RTE
  // modal to get triggered. If the element is not inside a CKEditor
  // instance, then open the concept card modal. To determine if the
  // RTE is inside a CKEditor instance, check if the offsetParent
  // element contains the data attribute ckeWidgetId.
  private _shouldOpenRTEModal(event: Event): boolean {
    const target = event.currentTarget as HTMLElement;
    const offsetParent = target.offsetParent as HTMLElement;
    return (
      Boolean(offsetParent.dataset.ckeWidgetId) ||
      this.ckEditorCopyContentService.copyModeActive
    );
  }

  openConceptCard(event: MouseEvent): void {
    if (this._shouldOpenRTEModal(event)) {
      return;
    }
    this.entityId = this.contextService.getEntityId();
    this.entityType = this.contextService.getEntityType();

    this.contextService.setCustomEntityContext(
      AppConstants.ENTITY_TYPE.SKILL, this.skillId);
    // The catch at the end was needed according to this thread:
    // https://github.com/angular-ui/bootstrap/issues/6501, where in
    // AngularJS 1.6.3, $uibModalInstance.cancel() throws console error.
    // The catch prevents that when clicking outside as well as for
    // cancel.
    const modalRef = this.ngbModal.open(
      OppiaNoninteractiveSkillreviewConceptCardModalComponent,
      {backdrop: true}
    );
    modalRef.componentInstance.skillId = this.skillId;
    modalRef.result.then(() => {}, (res) => {
      this.contextService.removeCustomEntityContext();
      // Restore the entity context to that of the state before the concept card
      // editor was initialized. This prevents change of context issues in
      // calling components once the editor is closed.
      if (this.entityId && this.entityType) {
        this.contextService.setCustomEntityContext(
          this.entityType, this.entityId);
      }
      const allowedDismissActions = (
        ['cancel', 'escape key press', 'backdrop click']);
      if (res && !allowedDismissActions.includes(res)) {
        throw new Error(res);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.skillIdWithValue || changes.textWithValue) {
      this._updateViewOnNewSkillSelected();
    }
  }
}

angular.module('oppia').directive(
  'oppiaNoninteractiveSkillreview', downgradeComponent({
    component: NoninteractiveSkillreview
  }) as angular.IDirectiveFactory);
