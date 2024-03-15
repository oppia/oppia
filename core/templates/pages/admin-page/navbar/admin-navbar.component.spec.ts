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
 * @fileoverview Unit tests for admin navbar component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {APP_BASE_HREF} from '@angular/common';
import {RouterModule} from '@angular/router';
import {UserInfo} from 'domain/user/user-info.model';
import {SmartRouterModule} from 'hybrid-router-module-provider';

import {UserService} from 'services/user.service';
import {AdminRouterService} from '../services/admin-router.service';
import {AdminNavbarComponent} from './admin-navbar.component';

describe('Admin Navbar component', () => {
  let component: AdminNavbarComponent;
  let userService: UserService;
  let adminRouterService: AdminRouterService;
  let userProfilePngImage = 'path-to-png-profile-pic';
  let userProfileWebpImage = 'path-to-webp-profile-pic';
  let userInfo = {
    isModerator: () => true,
    getUsername: () => 'username1',
    isSuperAdmin: () => true,
  };
  let imagePath = '/path/to/image.png';
  let profileUrl = '/profile/username1';
  let fixture: ComponentFixture<AdminNavbarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        // TODO(#13443): Remove hybrid router module provider once all pages are
        // migrated to angular router.
        SmartRouterModule,
        RouterModule.forRoot([]),
      ],
      declarations: [AdminNavbarComponent],
      providers: [
        {
          provide: APP_BASE_HREF,
          useValue: '/',
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminNavbarComponent);
    component = fixture.componentInstance;
    userService = TestBed.get(UserService);
    adminRouterService = TestBed.get(AdminRouterService);
    fixture.detectChanges();

    spyOn(userService, 'getProfileImageDataUrl').and.returnValue([
      userProfilePngImage,
      userProfileWebpImage,
    ]);
  }));

  it('should initialize component properties correctly', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo as UserInfo);

    component.ngOnInit();
    tick();

    expect(component.profilePicturePngDataUrl).toBe(userProfilePngImage);
    expect(component.profilePictureWebpDataUrl).toBe(userProfileWebpImage);
    expect(component.getStaticImageUrl(imagePath)).toBe(
      '/assets/images/path/to/image.png'
    );
    expect(component.username).toBe('username1');
    expect(component.isModerator).toBe(true);
    expect(component.isSuperAdmin).toBe(true);
    expect(component.profileUrl).toEqual(profileUrl);
    expect(component.logoutUrl).toEqual('/logout');
    expect(component.profileDropdownIsActive).toBe(false);
    expect(component.dropdownMenuIsActive).toBe(false);
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

  it('should be routed to the activities tab by default', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo as UserInfo);

    component.ngOnInit();
    tick();

    expect(component.isActivitiesTabOpen()).toBe(true);
    expect(component.isPlatformParamsTabOpen()).toBe(false);
    expect(component.isRolesTabOpen()).toBe(false);
    expect(component.isMiscTabOpen()).toBe(false);
  }));

  it('should be routed to the platform params tab', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo as UserInfo);

    component.ngOnInit();
    tick();

    expect(component.isActivitiesTabOpen()).toBe(true);
    expect(component.isPlatformParamsTabOpen()).toBe(false);
    expect(component.isRolesTabOpen()).toBe(false);
    expect(component.isMiscTabOpen()).toBe(false);

    adminRouterService.showTab('#/platform-parameters');

    expect(component.isActivitiesTabOpen()).toBe(false);
    expect(component.isPlatformParamsTabOpen()).toBe(true);
    expect(component.isRolesTabOpen()).toBe(false);
    expect(component.isMiscTabOpen()).toBe(false);
  }));

  it('should be routed to the roles tab', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo as UserInfo);

    component.ngOnInit();
    tick();

    expect(component.isActivitiesTabOpen()).toBe(true);
    expect(component.isPlatformParamsTabOpen()).toBe(false);
    expect(component.isRolesTabOpen()).toBe(false);
    expect(component.isMiscTabOpen()).toBe(false);

    adminRouterService.showTab('#/roles');

    expect(component.isActivitiesTabOpen()).toBe(false);
    expect(component.isPlatformParamsTabOpen()).toBe(false);
    expect(component.isRolesTabOpen()).toBe(true);
    expect(component.isMiscTabOpen()).toBe(false);
  }));

  it('should be routed to the misc tab', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo as UserInfo);

    component.ngOnInit();
    tick();

    expect(component.isActivitiesTabOpen()).toBe(true);
    expect(component.isPlatformParamsTabOpen()).toBe(false);
    expect(component.isRolesTabOpen()).toBe(false);
    expect(component.isMiscTabOpen()).toBe(false);

    adminRouterService.showTab('#/misc');

    expect(component.isActivitiesTabOpen()).toBe(false);
    expect(component.isPlatformParamsTabOpen()).toBe(false);
    expect(component.isRolesTabOpen()).toBe(false);
    expect(component.isMiscTabOpen()).toBe(true);
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

  it('should set dropdownMenuIsActive to true', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo as UserInfo);

    component.ngOnInit();
    tick();

    expect(component.dropdownMenuIsActive).toBe(false);

    component.activateDropdownMenu();

    expect(component.dropdownMenuIsActive).toBe(true);
  }));

  it('should set dropdownMenuIsActive to false', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo as UserInfo);

    component.ngOnInit();
    tick();

    component.dropdownMenuIsActive = true;

    expect(component.dropdownMenuIsActive).toBe(true);

    component.deactivateDropdownMenu();

    expect(component.dropdownMenuIsActive).toBe(false);
  }));
});
