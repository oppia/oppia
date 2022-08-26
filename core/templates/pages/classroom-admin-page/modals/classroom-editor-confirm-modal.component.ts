import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

@Component({
  selector: 'oppia-classroom-editor-confirm-modal',
  templateUrl: './classroom-editor-confirm-modal.component.html'
})
export class ClassroomEditorConfirmModalComponent
  extends ConfirmOrCancelModal {

  constructor(
    private ngbActiveModal: NgbActiveModal
  ) {
    super(ngbActiveModal);
  }

  close(): void {
    this.ngbActiveModal.close();
  }
}
