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
 * @fileoverview Unit tests for the delete account modal.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {UserService} from 'services/user.service';
import {DeleteAccountModalComponent} from './delete-account-modal.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {UserInfo} from 'domain/user/user-info.model';
import {MockTranslatePipe} from 'tests/unit-test-utils';

class MockActiveModal {
  dismiss(): void {
    return;
  }

  close(): void {
    return;
  }
}

describe('Delete account modal', () => {
  let component: DeleteAccountModalComponent;
  let fixture: ComponentFixture<DeleteAccountModalComponent>;
  let userService: UserService;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [DeleteAccountModalComponent, MockTranslatePipe],
      providers: [
        UserService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteAccountModalComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  });

  it('should check if the username is valid', fakeAsync(() => {
    const UserInfoObject = {
      roles: ['USER_ROLE'],
      is_moderator: false,
      is_curriculum_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'username',
      email: 'test@test.com',
      user_is_logged_in: true,
    };

    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(UserInfo.createFromBackendDict(UserInfoObject))
    );

    component.ngOnInit();
    component.expectedUsername = 'username';
    expect(component.isValid()).toBeFalse();

    component.username = 'differentUsername';
    expect(component.isValid()).toBeFalse();

    component.username = 'username';
    expect(component.isValid()).toBeTrue();
  }));

  it('should throw error if username is invalid', fakeAsync(() => {
    let userInfo = {
      isModerator: () => true,
      getUsername: () => null,
      isSuperAdmin: () => true,
    };
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo as UserInfo);

    expect(() => {
      component.ngOnInit();
      tick();
    }).not.toThrowError('Cannot fetch username.');
  }));

  it('should close the modal when confirmed', () => {
    const UserInfoObject = {
      roles: ['USER_ROLE'],
      is_moderator: false,
      is_curriculum_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'username',
      email: 'test@test.com',
      user_is_logged_in: true,
    };

    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(UserInfo.createFromBackendDict(UserInfoObject))
    );

    component.ngOnInit();
    const closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    component.confirm();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should close the modal when dismissed', () => {
    const UserInfoObject = {
      roles: ['USER_ROLE'],
      is_moderator: false,
      is_curriculum_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'username',
      email: 'test@test.com',
      user_is_logged_in: true,
    };

    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(UserInfo.createFromBackendDict(UserInfoObject))
    );

    component.ngOnInit();
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    component.cancel();
    expect(dismissSpy).toHaveBeenCalled();
  });
});
