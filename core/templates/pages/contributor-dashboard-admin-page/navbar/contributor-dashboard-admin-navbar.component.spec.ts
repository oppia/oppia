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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MockRouterModule } from 'hybrid-router-module-provider';

import { UserService } from 'services/user.service';

import { ContributorDashboardAdminNavbarComponent } from './contributor-dashboard-admin-navbar.component';

describe('Contributor dashboard admin navbar component', () => {
  let component: ContributorDashboardAdminNavbarComponent;
  let userService = null;
  let userProfileImage = 'profile-data-url';
  let userInfo = {
    isModerator: () => true,
    getUsername: () => 'username1',
    isSuperAdmin: () => true
  };
  const profileUrl = '/profile/username1';
  let fixture: ComponentFixture<ContributorDashboardAdminNavbarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MockRouterModule
      ],
      declarations: [ContributorDashboardAdminNavbarComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ContributorDashboardAdminNavbarComponent);
    component = fixture.componentInstance;
    userService = TestBed.get(UserService);
    fixture.detectChanges();

    spyOn(userService, 'getProfileImageDataUrlAsync')
      .and.resolveTo(userProfileImage);
    spyOn(userService, 'getUserInfoAsync')
      .and.resolveTo(userInfo);
    component.ngOnInit();
  }));

  it('should initialize component properties correctly', () => {
    expect(component.profilePictureDataUrl).toBe(userProfileImage);
    expect(component.username).toBe('username1');
    expect(component.profileUrl).toEqual(profileUrl);
    expect(component.logoutUrl).toEqual('/logout');
    expect(component.profileDropdownIsActive).toBe(false);
  });

  it('should set profileDropdownIsActive to true', () => {
    expect(component.profileDropdownIsActive).toBe(false);

    component.activateProfileDropdown();

    expect(component.profileDropdownIsActive).toBe(true);
  });

  it('should set profileDropdownIsActive to false', () => {
    component.profileDropdownIsActive = true;

    component.deactivateProfileDropdown();

    expect(component.profileDropdownIsActive).toBe(false);
  });
});
