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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {BackgroundBannerComponent} from './background-banner.component';

/**
 * @fileoverview Unit tests for BackgroundBannerComponent.
 */

describe('BackgroundBannerComponent', () => {
  let component: BackgroundBannerComponent;
  let fixture: ComponentFixture<BackgroundBannerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [BackgroundBannerComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackgroundBannerComponent);
    component = fixture.componentInstance;
  });

  it('should get a random banner file image url on initialization', () => {
    expect(component.bannerImageFileUrl).toBe('');

    spyOn(Math, 'random').and.returnValues(0.5, 0.3);

    component.ngOnInit();
    expect(component.bannerImageFileUrl).toBe(
      '/assets/images/background/bannerC.svg'
    );

    component.ngOnInit();
    expect(component.bannerImageFileUrl).toBe(
      '/assets/images/background/bannerB.svg'
    );
  });
});
