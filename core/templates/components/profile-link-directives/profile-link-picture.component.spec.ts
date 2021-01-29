// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ProfilePictureComponent.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ProfileLinkPictureComponent } from 'components/profile-link-directives/profile-link-picture.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('Profile Link Picture Component', function() {
  let component: ProfileLinkPictureComponent;
  let fixture: ComponentFixture<ProfileLinkPictureComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileLinkPictureComponent],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileLinkPictureComponent);
    component = fixture.componentInstance;
  });

  it('should set loaded variable when the image is loaded', () => {
    component.username = 'admin';
    expect(component.isUsernameLinkable()).toBeFalse();

    component.username = 'OppiaMigrationBot';
    expect(component.isUsernameLinkable()).toBeFalse();

    component.username = 'username';
    expect(component.isUsernameLinkable()).toBeTrue();
  });
});
