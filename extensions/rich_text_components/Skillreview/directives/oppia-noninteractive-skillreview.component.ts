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

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { ContextService } from 'services/context.service';
import { CkEditorCopyContentService } from 'components/ck-editor-helpers/ck-editor-copy-content-service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { OppiaNoninteractiveSkillreviewConceptCardModalComponent } from './oppia-noninteractive-skillreview-concept-card-modal.component';

@Component({
  selector: 'oppia-noninteractive-skillreview',
  templateUrl: './skillreview.component.html'
})
export class NoninteractiveSkillreview implements OnInit {
  @Input() skillIdWithValue: string;
  @Input() textWithValue: string;
  skillId: string;
  linkText: string;

  constructor(
    private ckEditorCopyContentService: CkEditorCopyContentService,
    private contextService: ContextService,
    private htmlEscaperService: HtmlEscaperService,
    private ngbModal: NgbModal
  ) {}

  ngOnInit(): void {
    this.skillId = this.htmlEscaperService.escapedJsonToObj(
      this.skillIdWithValue) as string;
    this.linkText = this.htmlEscaperService.escapedJsonToObj(
      this.textWithValue) as string;
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
  private _shouldOpenRTEModal(event): boolean {
    return (
      event.currentTarget.offsetParent.dataset.ckeWidgetId ||
      this.ckEditorCopyContentService.copyModeActive
    );
  }

  openConceptCard(event: MouseEvent): void {
    if (this._shouldOpenRTEModal(event)) {
      return;
    }
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
      const allowedDismissActions = (
        ['cancel', 'escape key press', 'backdrop click']);
      if (!allowedDismissActions.includes(res)) {
        throw new Error(res);
      }
    });
  }
}

angular.module('oppia').directive(
  'oppiaNoninteractiveSkillreview', downgradeComponent({
    component: NoninteractiveSkillreview
  }) as angular.IDirectiveFactory);
