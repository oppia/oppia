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
 * @fileoverview Unit tests for ProfileLinkPictureComponent.
 */

import {
  ComponentFixture, fakeAsync, TestBed, tick, waitForAsync,
} from '@angular/core/testing';
import { ProfilePictureComponent } from 'components/common-layout-directives/common-elements/profile-picture.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

class MockUrlInterpolationService {
  getProfilePictureUrl(username: string): string {
    return 'profile/' + username + '/picture.png';
  }

  getStaticImageUrl(url: string): string {
    return 'url/' + url;
  }
}

describe('Profile Picture Component', function() {
  let component: ProfilePictureComponent;
  let fixture: ComponentFixture<ProfilePictureComponent>;
  let parentDiv;

  beforeEach(waitForAsync(() => {
    let nativeElement = jasmine.createSpyObj(
      'HTMLElement', null, {offsetHeight: 0});
    parentDiv = jasmine.createSpyObj(
      'HTMLElement', null, {nativeElement: nativeElement});

    TestBed.configureTestingModule({
      declarations: [ProfilePictureComponent],
      providers: [
        {
          provide: UrlInterpolationService,
          useClass: MockUrlInterpolationService
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfilePictureComponent);
    component = fixture.componentInstance;
    component.parentDiv = parentDiv;
  });

  it('should change profile picture url on username change', () => {
    expect(component.profilePictureIsLoading).toBeFalse();
    expect(component.profilePictureIsLoaded).toBeFalse();
    expect(component.username).toBeUndefined();
    expect(component.profilePictureUrl).toBeUndefined();

    component.ngOnChanges();
    expect(component.profilePictureIsLoading).toBeFalse();
    expect(component.profilePictureIsLoaded).toBeFalse();
    expect(component.username).toBeUndefined();
    expect(component.profilePictureUrl).toBeUndefined();

    component.username = 'username';
    component.ngOnChanges();
    expect(component.profilePictureIsLoading).toBeTrue();
    expect(component.profilePictureIsLoaded).toBeFalse();
    expect(component.username).toBe('username');
    expect(component.profilePictureUrl).toBe('profile/username/picture.png');
  });

  it('should set loaded variable when the image is loaded', () => {
    expect(component.profilePictureIsLoaded).toBeFalse();

    component.showPicture();
    expect(component.profilePictureIsLoaded).toBeTrue();
  });

  it('should correctly set the spinner size', fakeAsync(() => {
    expect(component.spinnerDiameter).toBe(1);
    expect(component.parentDiv.nativeElement.offsetHeight).toBe(0);

    component.ngAfterViewInit();
    tick(150);
    expect(component.spinnerDiameter).toBe(1);
    expect(component.parentDiv.nativeElement.offsetHeight).toBe(0);

    let nativeElementMock = jasmine.createSpyObj(
      'HTMLElement', null, {offsetHeight: 100});
    let nativeElement = (
      <jasmine.Spy> Object.getOwnPropertyDescriptor(
        component.parentDiv, 'nativeElement'
      ).get
    );
    nativeElement.and.returnValue(nativeElementMock);
    tick(100);
    expect(component.spinnerDiameter).toBe(90);
    tick(100);
  }));

  it('should correctly set the default picture', () => {
    expect(component.profilePictureUrl).toBeUndefined();

    component.setDefaultPicture();
    expect(component.profilePictureUrl).toBe('url//avatar/user_blue_150px.png');
  });
});
