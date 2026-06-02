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
 * @fileoverview Unit tests for TranslationOnboardingModalComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {TranslationOnboardingModalComponent} from './translation-onboarding-modal.component';

describe('Translation Onboarding Modal Component', () => {
  let activeModal: NgbActiveModal;
  let component: TranslationOnboardingModalComponent;
  let fixture: ComponentFixture<TranslationOnboardingModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [TranslationOnboardingModalComponent],
      providers: [NgbActiveModal],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslationOnboardingModalComponent);
    component = fixture.componentInstance;
    activeModal = TestBed.inject(NgbActiveModal);
    fixture.detectChanges();
  });

  it('should initialize the avatar image URL', () => {
    expect(component.oppiaAvatarImageUrl).toBe(
      '/assets/images/avatar/oppia_avatar_tutorial.svg'
    );
  });

  it('should dismiss the modal when the tour is skipped', () => {
    const dismissSpy = spyOn(activeModal, 'dismiss');

    component.skipTour();

    expect(dismissSpy).toHaveBeenCalledWith('skip');
  });

  it('should close the modal when the tour is started', () => {
    const closeSpy = spyOn(activeModal, 'close');

    component.beginTour();

    expect(closeSpy).toHaveBeenCalledWith('begin');
  });
});
