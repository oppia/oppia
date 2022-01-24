// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TopicEditorSaveModalComponent.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TopicEditorSaveModalComponent } from './topic-editor-save-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Topic Editor Save Modal Controller', function() {
  let component: TopicEditorSaveModalComponent;
  let fixture: ComponentFixture<TopicEditorSaveModalComponent>;
  let topicIsPublished = true;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TopicEditorSaveModalComponent
      ],
      providers: [{
        provide: NgbActiveModal,
        useClass: MockActiveModal
      }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicEditorSaveModalComponent);
    component = fixture.componentInstance;

    TestBed.inject(NgbActiveModal);
    fixture.detectChanges();
  });

  it('should initialize component properties after component is initialized',
    () => {
      component.isTopicPublished = topicIsPublished;
      expect(component.isTopicPublished).toBe(true);
    });
});
