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
 * @fileoverview Unit tests for SideNavigationBarComponent.
 */

import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { SideNavigationBarComponent } from './side-navigation-bar.component';

describe('Side Navigation Bar Component', () => {
  let fixture: ComponentFixture<SideNavigationBarComponent>;
  let componentInstance: SideNavigationBarComponent;
  let currentUrl: string = '/test';
  let imageUrl: string = 'image_url';

  class MockWindowRef {
    nativeWindow = {
      location: {
        pathname: currentUrl
      }
    };
  }

  class MockUrlInterpolationService {
    getStaticImageUrl(imagePath: string): string {
      return imageUrl;
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule
      ],
      declarations: [
        SideNavigationBarComponent,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        {
          provide: UrlInterpolationService,
          useClass: MockUrlInterpolationService
        }
      ]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideNavigationBarComponent);
    componentInstance = fixture.componentInstance;
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', () => {
    componentInstance.ngOnInit();
    expect(componentInstance.currentUrl).toEqual(currentUrl);
  });

  it('should toggle classroom submenu', () => {
    componentInstance.classroomSubmenuIsShown = false;
    componentInstance.toggleClassroomSubmenu();
    expect(componentInstance.classroomSubmenuIsShown).toBeTrue();
  });

  it('should get static image url', () => {
    expect(componentInstance.getStaticImageUrl('test')).toEqual(imageUrl);
  });
});
