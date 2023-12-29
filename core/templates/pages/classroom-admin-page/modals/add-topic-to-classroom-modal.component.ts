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
 * @fileoverview Add topic to classroom modal component.
 */

import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { TopicBackendDict } from 'domain/topic/topic-object.model';
import { EditableTopicBackendApiService } from 'domain/topic/editable-topic-backend-api.service';

interface TopicFormControls {
  [key: string]: boolean;
}

@Component({
  selector: 'oppia-add-topic-to-classroom-modal',
  templateUrl: './add-topic-to-classroom-modal.component.html'
})

export class AddTopicToClassroomModalComponent
  extends ConfirmOrCancelModal
  implements OnInit {
  constructor(
    private ngbActiveModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private editableTopicBackendApiService: EditableTopicBackendApiService
  ) {
    super(ngbActiveModal);
  }

  topicBackendDictList: TopicBackendDict[] = [];
  topicForm!: FormGroup;
  ngOnInit(): void {
    this.loadUnusedTopics();
  }


  async loadUnusedTopics(): Promise<void> {
    try {
      const unusedTopicsResponse = await this.editableTopicBackendApiService
        .getUnusedTopicsAsync();
      this.topicBackendDictList = Object.values(unusedTopicsResponse);
      this.initializeForm();
    } catch (error) {
      console.error('Error loading unused topics:', error);
    }
  }

  initializeForm(): void {
    const topicFormControls: TopicFormControls = {};
    this.topicBackendDictList.forEach(topic => {
      topicFormControls[topic.id] = false;
    });

    this.topicForm = this.formBuilder.group(topicFormControls);
  }

  addTopics(): void {
    const selectedTopicIds = Object.keys(this.topicForm.value)
      .filter(key => this.topicForm.value[key]);

    this.ngbActiveModal.close(selectedTopicIds);
  }

  close(): void {
    this.ngbActiveModal.dismiss();
  }
}
