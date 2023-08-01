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
import { PlatformFeatureService } from '../../../services/platform-feature.service';


class MockActiveModal {
  dismiss(): void {
    return;
  }

  close(): void {
    return;
  }
}

class MockPlatformFeatureService {
  status = {
    SerialChapterLaunchCurriculumAdminView: {
      isEnabled: false
    }
  };
}

describe('Story Editor Unpublish Modal Component', () => {
  let component: StoryEditorUnpublishModalComponent;
  let ngbActiveModal: NgbActiveModal;
  let mockPlatformFeatureService = new MockPlatformFeatureService();
  let fixture: ComponentFixture<StoryEditorUnpublishModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [StoryEditorUnpublishModalComponent],
      providers: [
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService
        },
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
    mockPlatformFeatureService.
      status.SerialChapterLaunchCurriculumAdminView.isEnabled = false;
    const confirmSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    component.confirm();
    expect(confirmSpy).toHaveBeenCalled();

    mockPlatformFeatureService.
      status.SerialChapterLaunchCurriculumAdminView.isEnabled = true;
    component.confirm();
    expect(confirmSpy).toHaveBeenCalledWith(component.unpublishingReason);
  });

  it('should get status of Serial Chapter Launch Feature flag', () => {
    mockPlatformFeatureService.
      status.SerialChapterLaunchCurriculumAdminView.isEnabled = false;
    expect(component.isSerialChapterFeatureFlagEnabled()).toEqual(false);

    mockPlatformFeatureService.
      status.SerialChapterLaunchCurriculumAdminView.isEnabled = true;
    expect(component.isSerialChapterFeatureFlagEnabled()).toEqual(true);
  });

  it('should check if the default reason for unpublishing is BAD_CONTENT',
    () => {
      expect(component.unpublishingReason).toBe('BAD_CONTENT');
      expect(component.selectedReasonText).toBe(component.badContentReasonText);
    });

  it('should set unpublishing reason', () => {
    expect(component.unpublishingReason).toBe('BAD_CONTENT');
    expect(component.selectedReasonText).toBe(component.badContentReasonText);

    component.setReason('CHAPTER_NEEDS_SPLITTING');

    expect(component.unpublishingReason).toBe('CHAPTER_NEEDS_SPLITTING');
    expect(component.selectedReasonText).toBe(
      component.splitChapterReasonText);

    component.setReason('BAD_CONTENT');

    expect(component.unpublishingReason).toBe('BAD_CONTENT');
    expect(component.selectedReasonText).toBe(
      component.badContentReasonText);
  });
});
