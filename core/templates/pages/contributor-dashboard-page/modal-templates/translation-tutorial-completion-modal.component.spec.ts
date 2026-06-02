// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TranslationTutorialCompletionModalComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {TranslationTutorialCompletionModalComponent} from './translation-tutorial-completion-modal.component';

describe('Translation Tutorial Completion Modal Component', () => {
  let component: TranslationTutorialCompletionModalComponent;
  let fixture: ComponentFixture<TranslationTutorialCompletionModalComponent>;
  let activeModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [TranslationTutorialCompletionModalComponent],
      providers: [NgbActiveModal],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      TranslationTutorialCompletionModalComponent
    );
    component = fixture.componentInstance;
    activeModal = TestBed.inject(NgbActiveModal);
    fixture.detectChanges();
  });

  it('should set the Oppia avatar image url', () => {
    expect(component.oppiaAvatarImageUrl).toBe(
      '/assets/images/avatar/oppia_avatar_tutorial.svg'
    );
  });

  it('should close the modal when the close button is clicked', () => {
    const closeSpy = spyOn(activeModal, 'close');

    component.close();

    expect(closeSpy).toHaveBeenCalled();
  });
});
