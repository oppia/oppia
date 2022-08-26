import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { ClassroomBackendApiService } from '../../../domain/classroom/classroom-backend-api.service';

@Component({
  selector: 'oppia-create-new-classroom-modal',
  templateUrl: './create-new-classroom-modal.component.html'
})
export class CreateNewClassroomModalComponent
  extends ConfirmOrCancelModal {

  constructor(
    private classroomBackendApiService: ClassroomBackendApiService,
    private ngbActiveModal: NgbActiveModal
  ) {
    super(ngbActiveModal);
  }
  existingClassroomNames: string[];
  newClassroomName: string;
  newClassroomId: string;
  classroomNameAlreadyExist: boolean = false;

  getNewClassroomId() {
    this.classroomBackendApiService.getNewClassroomIdAsync().then(
        classroomId => {
            this.newClassroomId = classroomId
        }
    );
  }

  ngOnInit(): void {
    this.getNewClassroomId();
  }

  createClassroom(): void {
    console.log(this.newClassroomName);
    console.log(this.existingClassroomNames.indexOf(this.newClassroomName) !== -1);
    if (this.existingClassroomNames.indexOf(this.newClassroomName) !== -1) {
        this.classroomNameAlreadyExist = true;
        return;
    }

    let defaultClassroomDict = {
      'classroom_id': this.newClassroomId,
      'name': this.newClassroomName,
      'url_fragment': '',
      'course_details': '',
      'topic_list_intro': '',
      'topic_id_to_prerequisite_topic_ids': {}
    };

    this.classroomBackendApiService.updateClassroomDataAsync(
        this.newClassroomId, defaultClassroomDict).then(() => {
            this.ngbActiveModal.close(defaultClassroomDict);
        });
  }
}
