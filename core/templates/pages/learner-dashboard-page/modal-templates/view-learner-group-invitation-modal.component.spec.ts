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
 * @fileoverview Unit tests for the view learner group invitation
 * modal component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ShortLearnerGroupSummary } from 'domain/learner_group/short-learner-group-summary.model';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ViewLearnerGroupInvitationModalComponent } from
  './view-learner-group-invitation-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('View Learner Group Invitation Modal Component', function() {
  let component: ViewLearnerGroupInvitationModalComponent;
  let fixture: ComponentFixture<ViewLearnerGroupInvitationModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  const shortLearnerGroup = new ShortLearnerGroupSummary(
    'sampleId2', 'sampleTitle 2', 'sampleDescription 2', ['username1'], 7
  );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        ViewLearnerGroupInvitationModalComponent,
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
    fixture = TestBed.createComponent(
      ViewLearnerGroupInvitationModalComponent);
    component = fixture.componentInstance;
    component.learnerGroup = shortLearnerGroup;

    fixture.detectChanges();
  });

  it('should check whether component is initialized', () => {
    expect(component).toBeDefined();
  });

  it('should confirm to join learner group', () => {
    spyOn(ngbActiveModal, 'close');

    component.confirm();

    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      progressSharingPermission: component.progressSharingPermission
    });
  });

  it('should toggle progress sharing permission correctly', () => {
    component.progressSharingPermission = true;

    component.toggleProgressSharingPermission();
    expect(component.progressSharingPermission).toBe(false);

    component.toggleProgressSharingPermission();
    expect(component.progressSharingPermission).toBe(true);
  });
});
