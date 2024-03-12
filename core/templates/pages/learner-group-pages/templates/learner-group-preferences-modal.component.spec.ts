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
 * @fileoverview Unit tests for the learner group preferences modal component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, waitForAsync, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {LearnerGroupData} from 'domain/learner_group/learner-group.model';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {LearnerGroupPreferencesModalComponent} from './learner-group-preferences-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Learner Group Preferences Modal Component', function () {
  let component: LearnerGroupPreferencesModalComponent;
  let ngbActiveModal: NgbActiveModal;
  let fixture: ComponentFixture<LearnerGroupPreferencesModalComponent>;

  const learnerGroup = new LearnerGroupData(
    'groupId',
    'title',
    'description',
    ['facilitator_username'],
    ['username2'],
    ['username1'],
    ['subtopic_page_id'],
    []
  );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LearnerGroupPreferencesModalComponent, MockTranslatePipe],
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
    fixture = TestBed.createComponent(LearnerGroupPreferencesModalComponent);
    component = fixture.componentInstance;
    component.learnerGroup = learnerGroup;

    fixture.detectChanges();
  });

  it('should check whether component is initialized', () => {
    expect(component).toBeDefined();
  });

  it('should confirm to save learner group preferences', () => {
    spyOn(ngbActiveModal, 'close');

    component.confirm();

    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      progressSharingPermission: component.progressSharingPermission,
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
