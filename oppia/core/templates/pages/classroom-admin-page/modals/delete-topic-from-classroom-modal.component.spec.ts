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
 * @fileoverview Tests for delete topic from classroom confirmation modal.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {DeleteTopicFromClassroomModalComponent} from './delete-topic-from-classroom-modal.component';

describe('Delete Topic From Classroom Confirmation Modal', () => {
  let fixture: ComponentFixture<DeleteTopicFromClassroomModalComponent>;
  let componentInstance: DeleteTopicFromClassroomModalComponent;
  let closeSpy: jasmine.Spy;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DeleteTopicFromClassroomModalComponent],
      providers: [NgbActiveModal],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteTopicFromClassroomModalComponent);
    componentInstance = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should be able to close modal', () => {
    componentInstance.close();
    expect(closeSpy).toHaveBeenCalled();
  });
});
