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
 * @fileoverview Unit tests for contributor dashboard admin navbar component.
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
import {SmartRouterModule} from 'hybrid-router-module-provider';
import {UserInfo} from 'domain/user/user-info.model';
import {RouterModule} from '@angular/router';

import {UserService} from 'services/user.service';

import {ContributorDashboardAdminNavbarComponent} from './contributor-dashboard-admin-navbar.component';

describe('Contributor dashboard admin navbar component', () => {
  let component: ContributorDashboardAdminNavbarComponent;
  let userService: UserService;
  let userInfo = {
    isModerator: () => true,
    getUsername: () => 'username1',
    isSuperAdmin: () => true,
  } as UserInfo;
  const profileUrl = '/profile/username1';
  let fixture: ComponentFixture<ContributorDashboardAdminNavbarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        // TODO(#13443): Remove hybrid router module provider once all pages are
        // migrated to angular router.
        SmartRouterModule,
        RouterModule.forRoot([]),
      ],
      declarations: [ContributorDashboardAdminNavbarComponent],
      providers: [
        {
          provide: APP_BASE_HREF,
          useValue: '/',
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContributorDashboardAdminNavbarComponent);
    component = fixture.componentInstance;
    userService = TestBed.get(UserService);
    fixture.detectChanges();
    spyOn(userService, 'getProfileImageDataUrl').and.returnValue([
      'default-image-url-png',
      'default-image-url-webp',
    ]);
  }));

  it('should initialize component properties correctly', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo);

    component.ngOnInit();
    tick();

    expect(component.profilePicturePngDataUrl).toEqual('default-image-url-png');
    expect(component.profilePictureWebpDataUrl).toEqual(
      'default-image-url-webp'
    );
    expect(component.username).toBe('username1');
    expect(component.profileUrl).toEqual(profileUrl);
    expect(component.logoutUrl).toEqual('/logout');
    expect(component.profileDropdownIsActive).toBe(false);
  }));

  it('should set profileDropdownIsActive to true', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo);

    component.ngOnInit();
    tick();

    expect(component.profileDropdownIsActive).toBe(false);

    component.activateProfileDropdown();

    expect(component.profileDropdownIsActive).toBe(true);
  }));

  it('should set profileDropdownIsActive to false', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo);

    component.ngOnInit();
    tick();

    component.profileDropdownIsActive = true;

    component.deactivateProfileDropdown();

    expect(component.profileDropdownIsActive).toBe(false);
  }));

  it('should throw error if user name not exist', fakeAsync(() => {
    let userInfo = {
      isModerator: () => true,
      getUsername: () => null,
      isSuperAdmin: () => true,
    } as UserInfo;
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo);

    expect(() => {
      component.getUserInfoAsync();
      tick();
    }).toThrowError();
  }));
});
