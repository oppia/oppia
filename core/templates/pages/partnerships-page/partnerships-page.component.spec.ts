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
 * @fileoverview Unit tests for partnerships page.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PartnershipsPageComponent } from './partnerships-page.component';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

describe('Partnerships page', () => {
  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [PartnershipsPageComponent],
      providers: [
        UrlInterpolationService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  let component: PartnershipsPageComponent;

  beforeEach(() => {
    const partnershipsPageComponent = TestBed.createComponent(
      PartnershipsPageComponent);
    component = partnershipsPageComponent.componentInstance;
  });

  it('should successfully instantiate the component from beforeEach block',
    () => {
      expect(component).toBeDefined();
    });

  it('should set component properties when ngOnInit() is called', () => {
    component.ngOnInit();

    expect(component.partnershipsImgUrl).toBe(
      '/assets/images/general/partnerships_hero_image.png');
    expect(component.formIconUrl).toBe('/assets/images/icons/icon_form.png');
    expect(component.callIconUrl).toBe('/assets/images/icons/icon_call.png');
    expect(component.changeIconUrl).toBe(
      '/assets/images/icons/icon_change.png');
  });
});
