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
 * @fileoverview Unit tests for classroom admin navbar component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {RouterModule} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';

import {UserService} from 'services/user.service';
import {ClassroomAdminNavbarComponent} from 'pages/classroom-admin-page/navbar/classroom-admin-navbar.component';
import {SmartRouterModule} from 'hybrid-router-module-provider';
import {UserInfo} from 'domain/user/user-info.model';

describe('Classroom Admin navbar component', () => {
  let component: ClassroomAdminNavbarComponent;
  let userService: UserService;
  let userInfo = {
    getUsername: () => 'username1',
    isSuperAdmin: () => true,
  };
  let profileUrl = '/profile/username1';
  let fixture: ComponentFixture<ClassroomAdminNavbarComponent>;
  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        // TODO(#13443): Remove hybrid router module provider once all pages are
        // migrated to angular router.
        SmartRouterModule,
        RouterModule.forRoot([]),
      ],
      declarations: [ClassroomAdminNavbarComponent],
      providers: [
        {
          provide: APP_BASE_HREF,
          useValue: '/',
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClassroomAdminNavbarComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    fixture.detectChanges();
    spyOn(userService, 'getProfileImageDataUrl').and.returnValue([
      'default-image-url-png',
      'default-image-url-webp',
    ]);
  }));

  it('should initialize component properties correctly', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo as UserInfo);

    component.ngOnInit();
    tick();

    expect(component.profilePicturePngDataUrl).toEqual('default-image-url-png');
    expect(component.profilePictureWebpDataUrl).toEqual(
      'default-image-url-webp'
    );
    expect(component.profileUrl).toBe(profileUrl);
    expect(component.profileDropdownIsActive).toBe(false);
  }));

  it('should throw error if username is invalid', fakeAsync(() => {
    let userInfo = {
      getUsername: () => null,
      isSuperAdmin: () => true,
    };
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo as UserInfo);

    expect(() => {
      component.ngOnInit();
      tick();
    }).not.toThrowError('Cannot fetch username.');
  }));

  it('should set profileDropdownIsActive to true', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo as UserInfo);

    component.ngOnInit();
    tick();

    expect(component.profileDropdownIsActive).toBe(false);

    component.activateProfileDropdown();

    expect(component.profileDropdownIsActive).toBe(true);
  }));

  it('should set profileDropdownIsActive to false', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo as UserInfo);

    component.ngOnInit();
    tick();

    component.profileDropdownIsActive = true;

    expect(component.profileDropdownIsActive).toBe(true);

    component.deactivateProfileDropdown();

    expect(component.profileDropdownIsActive).toBe(false);
  }));
});
