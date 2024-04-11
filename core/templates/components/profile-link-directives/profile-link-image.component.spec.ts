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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {RouterModule} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';

import {UserService} from 'services/user.service';
import {SmartRouterModule} from 'hybrid-router-module-provider';
import {ProfileLinkImageComponent} from './profile-link-image.component';

/**
 * @fileoverview Unit tests for ProfileLinkImageComponent.
 */

describe('ProfileLinkImageComponent', () => {
  let component: ProfileLinkImageComponent;
  let fixture: ComponentFixture<ProfileLinkImageComponent>;
  let userService: UserService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        // TODO(#13443): Remove hybrid router module provider once all pages are
        // migrated to angular router.
        SmartRouterModule,
        RouterModule.forRoot([]),
      ],
      declarations: [ProfileLinkImageComponent],
      providers: [
        {
          provide: APP_BASE_HREF,
          useValue: '/',
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileLinkImageComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
  });

  it('should show profile picture on initialisation', fakeAsync(() => {
    component.username = 'user1';
    spyOn(userService, 'getProfileImageDataUrl').and.returnValue([
      'default-image-url-png',
      'default-image-url-webp',
    ]);

    component.ngOnInit();
    tick();

    expect(component.profilePicturePngDataUrl).toBe('default-image-url-png');
    expect(component.profilePictureWebpDataUrl).toBe('default-image-url-webp');
  }));

  it('should link the username/profile to the image if linkable', () => {
    let usernamesNotLinkable = ['admin', 'OppiaMigrationBot'];

    expect(component.isUsernameLinkable(usernamesNotLinkable[0])).toBe(false);
    expect(component.isUsernameLinkable(usernamesNotLinkable[1])).toBe(false);
    expect(component.isUsernameLinkable('linkableUsername')).toBe(true);
  });
});
