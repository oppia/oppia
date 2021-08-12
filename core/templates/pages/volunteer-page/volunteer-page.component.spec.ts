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
 * @fileoverview Unit tests for volunteer page.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VolunteerPageComponent } from './volunteer-page.component';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';

describe('Volunteer page', () => {
  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [VolunteerPageComponent],
      providers: [
        UrlInterpolationService,
        NgbCarouselConfig,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  let component;

  beforeEach(() => {
    const volunteerPageComponent = TestBed.createComponent(
      VolunteerPageComponent);
    component = volunteerPageComponent.componentInstance;
  });

  it('should successfully instantiate the component from beforeEach block',
    () => {
      expect(component).toBeDefined();
    });

  it('should set component properties when ngOnInit() is called', () => {
    component.ngOnInit();

    expect(component.mapImgPath).toBe(
      '/volunteer/map.png');
  });

  it('should get static image url', () => {
    expect(component.getStaticImageUrl('/test')).toEqual('/assets/images/test');
  });

  it('should get webp extended file name', () => {
    expect(component.getWebpExtendedName('a.jpg')).toEqual('a.webp');
    expect(component.getWebpExtendedName('a.png')).toEqual('a.webp');
    expect(component.getWebpExtendedName('a.webp')).toEqual('a.webp');
    expect(component.getWebpExtendedName('a.b.jpg')).toEqual('a.b.webp');
  });
});
