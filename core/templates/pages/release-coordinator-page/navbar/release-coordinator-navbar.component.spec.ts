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
 * @fileoverview Unit tests for release-coordinator navbar component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { SmartRouterModule } from 'hybrid-router-module-provider';

import { UserService } from 'services/user.service';
import { ReleaseCoordinatorPageConstants } from '../release-coordinator-page.constants';
import { ReleaseCoordinatorNavbarComponent } from './release-coordinator-navbar.component';
import { UserInfo } from 'domain/user/user-info.model';


describe('Release coordinator navbar component', () => {
  let component: ReleaseCoordinatorNavbarComponent;
  let userService: UserService;
  let profileUrl = '/profile/username1';
  let fixture: ComponentFixture<ReleaseCoordinatorNavbarComponent>;
  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        // TODO(#13443): Remove hybrid router module provider once all pages are
        // migrated to angular router.
        SmartRouterModule,
        RouterModule.forRoot([])
      ],
      declarations: [ReleaseCoordinatorNavbarComponent],
      providers: [{
        provide: APP_BASE_HREF,
        useValue: '/'
      }]
    }).compileComponents();

    fixture = TestBed.createComponent(ReleaseCoordinatorNavbarComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    fixture.detectChanges();

    spyOn(userService, 'getProfileImageDataUrl').and.returnValue(
      ['profile-image-url-png', 'profile-image-url-webp']);
    spyOn(component.activeTabChange, 'emit');
    component.ngOnInit();
  }));

  it('should initialize component properties correctly', fakeAsync(() => {
    let userInfo = {
      isModerator: () => true,
      getUsername: () => 'username1',
      isSuperAdmin: () => true
    };
    spyOn(userService, 'getUserInfoAsync')
      .and.resolveTo(userInfo as UserInfo);
    component.ngOnInit();
    flush();

    expect(component.profilePicturePngDataUrl).toEqual(
      'profile-image-url-png');
    expect(component.profilePictureWebpDataUrl).toEqual(
      'profile-image-url-webp');
    expect(component.username).toBe('username1');
    expect(component.profileUrl).toEqual(profileUrl);
    expect(component.logoutUrl).toEqual('/logout');
    expect(component.profileDropdownIsActive).toBe(false);
    expect(component.activeTab).toBe(
      ReleaseCoordinatorPageConstants.TAB_ID_BEAM_JOBS);
  }));

  it('should get default profile pictures when username is null',
    fakeAsync(() => {
      let userInfo = {
        getUsername: () => null,
        isSuperAdmin: () => true,
        getEmail: () => 'test_email@example.com'
      };
      spyOn(userService, 'getUserInfoAsync')
        .and.resolveTo(userInfo as UserInfo);
      component.ngOnInit();
      flush();

      expect(component.profilePicturePngDataUrl).toEqual(
        '/assets/images/avatar/user_blue_150px.png');
      expect(component.profilePictureWebpDataUrl).toEqual(
        '/assets/images/avatar/user_blue_150px.webp');
    }));

  it('should allow switching tabs correctly', () => {
    expect(component.activeTab).toBe(
      ReleaseCoordinatorPageConstants.TAB_ID_BEAM_JOBS);

    component.switchTab(ReleaseCoordinatorPageConstants.TAB_ID_MISC);
    component.activeTabChange.subscribe(
      (tabName: string) => expect(tabName).toBe(
        ReleaseCoordinatorPageConstants.TAB_ID_MISC));

    expect(component.activeTab).toBe(
      ReleaseCoordinatorPageConstants.TAB_ID_MISC);
    expect(component.activeTabChange.emit).toHaveBeenCalledWith(
      ReleaseCoordinatorPageConstants.TAB_ID_MISC);
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
});
