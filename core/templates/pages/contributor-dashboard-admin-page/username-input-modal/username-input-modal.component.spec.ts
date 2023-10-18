// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for UsernameInputModal.
 */

import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SignupPageBackendApiService } from '../../signup-page/services/signup-page-backend-api.service';
import { UsernameInputModal } from './username-input-modal.component';

describe('UsernameInputModal', () => {
  let component: UsernameInputModal;
  let fixture: ComponentFixture<UsernameInputModal>;
  let ngbActiveModal: NgbActiveModal;
  let signupPageBackendApiService: SignupPageBackendApiService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule
      ],
      declarations: [UsernameInputModal],
      providers: [
        NgbActiveModal,
        SignupPageBackendApiService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UsernameInputModal);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.get(NgbActiveModal);
    signupPageBackendApiService = TestBed.inject(
      SignupPageBackendApiService);
    fixture.detectChanges();
    component.ngOnInit();
  });

  it('should throw error when entered username is invaid', fakeAsync(() => {
    spyOn(
      signupPageBackendApiService, 'checkUsernameAvailableAsync'
    ).and.returnValue(Promise.resolve({username_is_taken: false}));

    component.saveAndClose();
    tick();

    expect(component.isInvalidUsername).toBeTrue();
  }));

  it('should save and close with correct username', fakeAsync(() => {
    spyOn(
      signupPageBackendApiService, 'checkUsernameAvailableAsync'
    ).and.returnValue(Promise.resolve({username_is_taken: true}));
    const modalCloseSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    component.username = 'user1';
    fixture.detectChanges();

    component.saveAndClose();
    tick();

    expect(modalCloseSpy).toHaveBeenCalledWith('user1');
  }));

  it('should close without returning anything', () => {
    const modalCloseSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();

    component.close();

    expect(modalCloseSpy).toHaveBeenCalled();
  });
});
