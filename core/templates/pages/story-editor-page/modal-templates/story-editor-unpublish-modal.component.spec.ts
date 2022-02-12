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
 * @fileoverview Unit tests for story editor unpublish modal.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StoryEditorUnpublishModalComponent } from './story-editor-unpublish-modal.component';

class MockActiveModal {
  dismiss(): void {
    return;
  }

  close(): void {
    return;
  }
}

describe('Story Editor Unpublish Modal Component', () => {
  let component: StoryEditorUnpublishModalComponent;
  let ngbActiveModal: NgbActiveModal;
  let fixture: ComponentFixture<StoryEditorUnpublishModalComponent>;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [StoryEditorUnpublishModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StoryEditorUnpublishModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  });

  it('should close modal on clicking the cancel button', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    component.cancel();
    expect(dismissSpy).toHaveBeenCalled();
  });

  it('should close by proceeding with unpublishing', () => {
    const confirmSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    component.confirm();
    expect(confirmSpy).toHaveBeenCalled();
  });
});
