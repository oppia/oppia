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
 * @fileoverview Unit tests for registration session expired modal.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NgbActiveModal, NgbModalModule} from '@ng-bootstrap/ng-bootstrap';
import {WindowRef} from 'services/contextual/window-ref.service';
import {UserService} from 'services/user.service';
import {MockTranslateModule} from 'tests/unit-test-utils';
import {RegistrationSessionExpiredModalComponent} from './registration-session-expired-modal.component';

class MockWindowRef {
  nativeWindow = {
    location: {
      href: '',
      reload: () => {},
    },
  };
}

describe('Registration Session Expired Modal Component', () => {
  let fixture: ComponentFixture<RegistrationSessionExpiredModalComponent>;
  let componentInstance: RegistrationSessionExpiredModalComponent;
  let userService: UserService;
  let windowRef: WindowRef;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MockTranslateModule, NgbModalModule, HttpClientTestingModule],
      declarations: [RegistrationSessionExpiredModalComponent],
      providers: [
        NgbActiveModal,
        UserService,
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrationSessionExpiredModalComponent);
    componentInstance = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    windowRef = TestBed.inject(WindowRef);
  });

  it('should be defined', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should continue registration when login url is available', fakeAsync(() => {
    spyOn(userService, 'getLoginUrlAsync').and.returnValue(
      Promise.resolve('login_url')
    );
    componentInstance.continueRegistration();
    tick();
    tick(200);
  }));

  it('should reload page when login url is not available', fakeAsync(() => {
    spyOn(userService, 'getLoginUrlAsync').and.returnValue(Promise.resolve(''));
    spyOn(windowRef.nativeWindow.location, 'reload');
    componentInstance.continueRegistration();
    tick();
    expect(windowRef.nativeWindow.location.reload).toHaveBeenCalled();
  }));
});
