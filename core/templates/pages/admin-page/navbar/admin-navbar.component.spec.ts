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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MockRouterModule } from 'hybrid-router-module-provider';

import { UserService } from 'services/user.service';
import { AdminRouterService } from '../services/admin-router.service';
import { AdminNavbarComponent } from './admin-navbar.component';

describe('Admin Navbar component', () => {
  let component: AdminNavbarComponent;
  let userService = null;
  let adminRouterService: AdminRouterService;
  let userProfileImage = 'profile-data-url';
  let userInfo = {
    isModerator: () => true,
    getUsername: () => 'username1',
    isSuperAdmin: () => true
  };
  let imagePath = '/path/to/image.png';
  let profileUrl = '/profile/username1';
  let fixture: ComponentFixture<AdminNavbarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MockRouterModule
      ],
      declarations: [AdminNavbarComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminNavbarComponent);
    component = fixture.componentInstance;
    userService = TestBed.get(UserService);
    adminRouterService = TestBed.get(AdminRouterService);
    fixture.detectChanges();

    spyOn(userService, 'getProfileImageDataUrlAsync')
      .and.resolveTo(userProfileImage);
    spyOn(userService, 'getUserInfoAsync')
      .and.resolveTo(userInfo);

    component.ngOnInit();
  }));

  it('should initialize component properties correctly', () => {
    expect(component.profilePictureDataUrl).toBe(userProfileImage);
    expect(component.getStaticImageUrl(imagePath)).toBe(
      '/assets/images/path/to/image.png');
    expect(component.isModerator).toBe(true);
    expect(component.isSuperAdmin).toBe(true);
    expect(component.profileUrl).toEqual(profileUrl);
    expect(component.logoutUrl).toEqual('/logout');
    expect(component.profileDropdownIsActive).toBe(false);
    expect(component.dropdownMenuIsActive).toBe(false);
  });

  it('should be routed to the activities tab by default', () => {
    expect(component.isActivitiesTabOpen()).toBe(true);
    expect(component.isConfigTabOpen()).toBe(false);
    expect(component.isFeaturesTabOpen()).toBe(false);
    expect(component.isRolesTabOpen()).toBe(false);
    expect(component.isMiscTabOpen()).toBe(false);
  });

  it('should be routed to the config tab', () => {
    expect(component.isActivitiesTabOpen()).toBe(true);
    expect(component.isConfigTabOpen()).toBe(false);
    expect(component.isFeaturesTabOpen()).toBe(false);
    expect(component.isRolesTabOpen()).toBe(false);
    expect(component.isMiscTabOpen()).toBe(false);

    adminRouterService.showTab('#/config');

    expect(component.isActivitiesTabOpen()).toBe(false);
    expect(component.isConfigTabOpen()).toBe(true);
    expect(component.isFeaturesTabOpen()).toBe(false);
    expect(component.isRolesTabOpen()).toBe(false);
    expect(component.isMiscTabOpen()).toBe(false);
  });

  it('should be routed to the features tab', () => {
    expect(component.isActivitiesTabOpen()).toBe(true);
    expect(component.isConfigTabOpen()).toBe(false);
    expect(component.isFeaturesTabOpen()).toBe(false);
    expect(component.isRolesTabOpen()).toBe(false);
    expect(component.isMiscTabOpen()).toBe(false);

    adminRouterService.showTab('#/features');

    expect(component.isActivitiesTabOpen()).toBe(false);
    expect(component.isConfigTabOpen()).toBe(false);
    expect(component.isFeaturesTabOpen()).toBe(true);
    expect(component.isRolesTabOpen()).toBe(false);
    expect(component.isMiscTabOpen()).toBe(false);
  });

  it('should be routed to the roles tab', () => {
    expect(component.isActivitiesTabOpen()).toBe(true);
    expect(component.isConfigTabOpen()).toBe(false);
    expect(component.isFeaturesTabOpen()).toBe(false);
    expect(component.isRolesTabOpen()).toBe(false);
    expect(component.isMiscTabOpen()).toBe(false);

    adminRouterService.showTab('#/roles');

    expect(component.isActivitiesTabOpen()).toBe(false);
    expect(component.isConfigTabOpen()).toBe(false);
    expect(component.isFeaturesTabOpen()).toBe(false);
    expect(component.isRolesTabOpen()).toBe(true);
    expect(component.isMiscTabOpen()).toBe(false);
  });

  it('should be routed to the misc tab', () => {
    expect(component.isActivitiesTabOpen()).toBe(true);
    expect(component.isConfigTabOpen()).toBe(false);
    expect(component.isFeaturesTabOpen()).toBe(false);
    expect(component.isRolesTabOpen()).toBe(false);
    expect(component.isMiscTabOpen()).toBe(false);

    adminRouterService.showTab('#/misc');

    expect(component.isActivitiesTabOpen()).toBe(false);
    expect(component.isConfigTabOpen()).toBe(false);
    expect(component.isFeaturesTabOpen()).toBe(false);
    expect(component.isRolesTabOpen()).toBe(false);
    expect(component.isMiscTabOpen()).toBe(true);
  });

  it('should set profileDropdownIsActive to true', () => {
    expect(component.profileDropdownIsActive).toBe(false);

    component.activateProfileDropdown();

    expect(component.profileDropdownIsActive).toBe(true);
  });

  it('should set profileDropdownIsActive to false', () => {
    component.profileDropdownIsActive = true;

    expect(component.profileDropdownIsActive).toBe(true);

    component.deactivateProfileDropdown();

    expect(component.profileDropdownIsActive).toBe(false);
  });

  it('should set dropdownMenuIsActive to true', () => {
    expect(component.dropdownMenuIsActive).toBe(false);

    component.activateDropdownMenu();

    expect(component.dropdownMenuIsActive).toBe(true);
  });

  it('should set dropdownMenuIsActive to false', () => {
    component.dropdownMenuIsActive = true;

    expect(component.dropdownMenuIsActive).toBe(true);

    component.deactivateDropdownMenu();

    expect(component.dropdownMenuIsActive).toBe(false);
  });
});
