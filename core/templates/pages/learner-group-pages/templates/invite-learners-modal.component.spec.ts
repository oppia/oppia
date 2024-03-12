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
 * @fileoverview Unit tests for the invite learners modal component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, waitForAsync, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {LearnerGroupUserInfo} from 'domain/learner_group/learner-group-user-info.model';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {InviteLearnersModalComponent} from './invite-learners-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Invite Learners Modal Component', function () {
  let component: InviteLearnersModalComponent;
  let fixture: ComponentFixture<InviteLearnersModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [InviteLearnersModalComponent, MockTranslatePipe],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    fixture = TestBed.createComponent(InviteLearnersModalComponent);
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
      invitedLearners: component.invitedLearners,
      invitedLearnersInfo: component.invitedLearnersInfo,
    });
  });

  it('should update newly invited learners and their info', () => {
    const learnerInfo = LearnerGroupUserInfo.createFromBackendDict({
      username: 'user1',
      error: '',
    });

    expect(component.invitedLearners).toEqual([]);
    component.updateNewlyInvitedLearners(['user1', 'user2']);
    expect(component.invitedLearners).toEqual(['user1', 'user2']);

    expect(component.invitedLearnersInfo).toEqual([]);
    component.updateNewlyInvitedLearnersInfo([learnerInfo]);
    expect(component.invitedLearnersInfo).toEqual([learnerInfo]);
  });
});
