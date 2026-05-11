// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the About page partnerships section component.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {MockTranslatePipe} from 'tests/unit-test-utils';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {PartnershipsSectionComponent} from './partnerships-section.component';

describe('PartnershipsSectionComponent', () => {
  let component: PartnershipsSectionComponent;
  let fixture: ComponentFixture<PartnershipsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgbModule],
      declarations: [PartnershipsSectionComponent, MockTranslatePipe],
      providers: [UrlInterpolationService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PartnershipsSectionComponent);
    component = fixture.componentInstance;
    component.partnersData = [
      {
        title: 'TITLE',
        name: 'NAME',
        description: 'DESCRIPTION',
        label: 'LABEL',
        imageUrl: '/about/partners/partner1-',
      },
    ];
    fixture.detectChanges();
  });

  it('should successfully instantiate the component', () => {
    expect(component).toBeDefined();
  });

  it('should return the correct image set', () => {
    expect(
      component.getImageSet('/about/testImageName', 'png', [1, 1.5, 2])
    ).toBe(
      '/assets/images/about/testImageName1x.png 1x, ' +
        '/assets/images/about/testImageName15x.png 1.5x, ' +
        '/assets/images/about/testImageName2x.png 2x'
    );
  });

  it('should return the correct image set for a single size', () => {
    expect(component.getImageSet('/about/testImageName', 'png', [1.5])).toBe(
      '/assets/images/about/testImageName15x.png 1.5x'
    );
  });
});
