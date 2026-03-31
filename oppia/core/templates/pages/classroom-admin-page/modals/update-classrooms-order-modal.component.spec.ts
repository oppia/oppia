// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for update classrooms order modal.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {UpdateClassroomsOrderModalComponent} from './update-classrooms-order-modal.component';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {classroomDisplayInfo} from '../../../domain/classroom/classroom-backend-api.service';

describe('UpdateClassroomsOrderModalComponent', () => {
  let component: UpdateClassroomsOrderModalComponent;
  let fixture: ComponentFixture<UpdateClassroomsOrderModalComponent>;
  let mockNgbActiveModal: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(async () => {
    mockNgbActiveModal = jasmine.createSpyObj('NgbActiveModal', [
      'close',
      'dismiss',
    ]);

    await TestBed.configureTestingModule({
      declarations: [UpdateClassroomsOrderModalComponent],
      providers: [{provide: NgbActiveModal, useValue: mockNgbActiveModal}],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateClassroomsOrderModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty classroomIdToClassroomNameIndex', () => {
    expect(component.classroomIdToClassroomNameIndex).toEqual([]);
  });

  it('should reorder items on drop', () => {
    component.classroomIdToClassroomNameIndex = [
      {classroom_id: '1', classroom_name: 'Math', classroom_index: 0},
      {classroom_id: '2', classroom_name: 'Science', classroom_index: 1},
      {classroom_id: '3', classroom_name: 'History', classroom_index: 2},
    ];

    const dropEvent = {previousIndex: 0, currentIndex: 2} as CdkDragDrop<
      classroomDisplayInfo[]
    >;
    component.drop(dropEvent);

    expect(component.classroomIdToClassroomNameIndex).toEqual([
      {classroom_id: '2', classroom_name: 'Science', classroom_index: 0},
      {classroom_id: '3', classroom_name: 'History', classroom_index: 1},
      {classroom_id: '1', classroom_name: 'Math', classroom_index: 2},
    ]);
  });

  it('should close modal with updated data on save', () => {
    component.classroomIdToClassroomNameIndex = [
      {classroom_id: '1', classroom_name: 'Math', classroom_index: 0},
      {classroom_id: '2', classroom_name: 'Science', classroom_index: 1},
    ];

    component.save();
    expect(mockNgbActiveModal.close).toHaveBeenCalledWith(
      component.classroomIdToClassroomNameIndex
    );
  });

  it('should dismiss modal on close', () => {
    component.close();
    expect(mockNgbActiveModal.dismiss).toHaveBeenCalled();
  });
});
