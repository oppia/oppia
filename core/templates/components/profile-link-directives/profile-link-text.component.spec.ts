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

import {AppConstants} from 'app.constants';

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {RouterModule} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';

import {SmartRouterModule} from 'hybrid-router-module-provider';
import {ProfileLinkTextComponent} from './profile-link-text.component';

/**
 * @fileoverview Unit tests for ProfileLinkTextComponent
 */

describe('ProfileLinkTextComponent', () => {
  let component: ProfileLinkTextComponent;
  let fixture: ComponentFixture<ProfileLinkTextComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        // TODO(#13443): Remove hybrid router module provider once all pages are
        // migrated to angular router.
        SmartRouterModule,
        RouterModule.forRoot([]),
      ],
      declarations: [ProfileLinkTextComponent],
      providers: [
        {
          provide: APP_BASE_HREF,
          useValue: '/',
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileLinkTextComponent);
    component = fixture.componentInstance;
  });

  it('should check if username is linkable', () => {
    let usernamesNotLinkable = ['admin', 'OppiaMigrationBot'];

    expect(component.isUsernameLinkable(usernamesNotLinkable[0])).toBe(false);
    expect(component.isUsernameLinkable(usernamesNotLinkable[1])).toBe(false);
    expect(component.isUsernameLinkable('linkableUsername')).toBe(true);
  });

  it('should set profile URL when the username is set', () => {
    expect(component.profileUrl).not.toBeDefined();

    component.username = 'dummy';

    expect(component.profileUrl).toEqual(
      '/' +
        AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PROFILE.ROUTE.replace(
          ':username_fragment',
          'dummy'
        )
    );
  });

  it('should set username correctly', () => {
    expect(component.username).not.toBeDefined();

    component.username = 'dummy';

    expect(component.username).toEqual('dummy');
  });
});
