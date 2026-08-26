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
 * @fileoverview Component for add goals modal
 */
import {Component, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'oppia-add-goals-modal',
  templateUrl: './add-goals-modal.component.html',
})
export class AddGoalsModalComponent {
  checkedTopics: Set<string>;
  completedTopics: Set<string>;
  topics: {[topicId: string]: string} = {};
  publishedClassroomTopics: Set<string> = new Set();
  originalCheckedTopics: Set<string>;

  constructor(
    public dialogRef: MatDialogRef<AddGoalsModalComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      checkedTopics: Set<string>;
      completedTopics: Set<string>;
      topics: {[topicId: string]: string};
      publishedClassroomTopics?: Set<string>;
    }
  ) {
    this.checkedTopics = new Set(data.checkedTopics || []);
    this.originalCheckedTopics = new Set(this.checkedTopics);

    this.completedTopics = new Set(data.completedTopics);
    this.topics = data.topics;
    this.publishedClassroomTopics =
      data.publishedClassroomTopics || new Set(Object.keys(data.topics));
  }

  getPublishedTopics(): {[topicId: string]: string} {
    const filteredTopics: {[topicId: string]: string} = {};

    for (const [topicId, topicName] of Object.entries(this.topics)) {
      if (this.publishedClassroomTopics.has(topicId)) {
        filteredTopics[topicId] = topicName;
      }
    }

    return filteredTopics;
  }

  onChange(id: string): void {
    if (!this.checkedTopics.has(id)) {
      if (this.checkedTopics.size >= 5) {
        return;
      }
      this.checkedTopics.add(id);
    } else {
      this.checkedTopics.delete(id);
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.isSaveDisabled) {
      this.dialogRef.close(this.checkedTopics);
    }
  }

  get isSaveDisabled(): boolean {
    return this.setsAreEqual(this.checkedTopics, this.originalCheckedTopics);
  }

  isCheckboxDisabled(topicId: string): boolean {
    return (
      this.completedTopics.has(topicId) ||
      (this.checkedTopics.size >= 5 && !this.checkedTopics.has(topicId))
    );
  }

  setsAreEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) {
      return false;
    }
    for (const val of a) {
      if (!b.has(val)) {
        return false;
      }
    }
    return true;
  }
}
