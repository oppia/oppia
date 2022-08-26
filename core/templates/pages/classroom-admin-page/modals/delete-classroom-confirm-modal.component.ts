import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

@Component({
  selector: 'oppia-delete-classroom-confirm-modal',
  templateUrl: './delete-classroom-confirm-modal.component.html'
})
export class DeleteClassroomConfirmModalComponent
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
