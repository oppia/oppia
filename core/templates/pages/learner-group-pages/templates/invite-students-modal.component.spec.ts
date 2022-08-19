// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the invite students modal component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LearnerGroupUserInfo } from 'domain/learner_group/learner-group-user-info.model';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { InviteStudentsModalComponent } from './invite-students-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Invite Students Modal Component', function() {
  let component: InviteStudentsModalComponent;
  let fixture: ComponentFixture<InviteStudentsModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        InviteStudentsModalComponent,
        MockTranslatePipe
      ],
      providers: [{
        provide: NgbActiveModal,
        useClass: MockActiveModal
      }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    fixture = TestBed.createComponent(InviteStudentsModalComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should check whether component is initialized', () => {
    expect(component).toBeDefined();
  });

  it('should confirm', () => {
    spyOn(ngbActiveModal, 'close');
    component.confirm();
    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      invitedStudents: component.invitedStudents,
      invitedStudentsInfo: component.invitedStudentsInfo
    });
  });

  it('should update newly invited students and their info', () => {
    const studentInfo = LearnerGroupUserInfo.createFromBackendDict({
      username: 'user1',
      profile_picture_data_url: 'picture',
      error: ''
    });

    expect(component.invitedStudents).toEqual([]);
    component.updateNewlyInvitedStudents(['user1', 'user2']);
    expect(component.invitedStudents).toEqual(['user1', 'user2']);

    expect(component.invitedStudentsInfo).toEqual([]);
    component.updateNewlyInvitedStudentsInfo([studentInfo]);
    expect(component.invitedStudentsInfo).toEqual([studentInfo]);
  });
});
