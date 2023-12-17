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
 * @fileoverview Tests for add topic to classroom modal.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, tick } from '@angular/core/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { EditableTopicBackendApiService } from 'domain/topic/editable-topic-backend-api.service';
import { AddTopicToClassroomModalComponent } from './add-topic-to-classroom-modal.component';
import { LoadingDotsComponent } from 'components/common-layout-directives/common-elements/loading-dots.component';


describe('AddTopicToClassroomModalComponent', () => {
  let fixture: ComponentFixture<AddTopicToClassroomModalComponent>;
  let componentInstance: AddTopicToClassroomModalComponent;
  let ngbActiveModal: NgbActiveModal;
  let formBuilder: FormBuilder;
  let editableTopicBackendApiService: EditableTopicBackendApiService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AddTopicToClassroomModalComponent,
      LoadingDotsComponent],
      providers: [
        NgbActiveModal,
        FormBuilder,
        EditableTopicBackendApiService,
      ],
      imports: [ReactiveFormsModule, HttpClientTestingModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTopicToClassroomModalComponent);
    componentInstance = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    formBuilder = TestBed.inject(FormBuilder);
    editableTopicBackendApiService = TestBed.inject(EditableTopicBackendApiService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize form and load unused topics', async () => {
    spyOn(editableTopicBackendApiService, 'getUnusedTopicsAsync').and.returnValue(Promise.resolve({}));
    await componentInstance.loadUnusedTopics();
    expect(componentInstance.topicBackendDictList).toBeDefined();
    expect(componentInstance.topicForm).toBeDefined();
  });

  it('should add topics', () => {
    const selectedTopicIds = ['topicId1', 'topicId2'];
    spyOn(ngbActiveModal, 'close');
    componentInstance.topicForm = formBuilder.group({
      'topicId1': true,
      'topicId2': false,
    });
    componentInstance.addTopics();
    expect(ngbActiveModal.close).toHaveBeenCalledWith(['topicId1']);
  });

  it('should close modal', () => {
    spyOn(ngbActiveModal, 'dismiss');
    componentInstance.close();
    expect(ngbActiveModal.dismiss).toHaveBeenCalled();
  });
});
