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
 * @fileoverview Unit tests for the About page CTA section component.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatTabsModule} from '@angular/material/tabs';
import {NgbAccordionModule, NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {MockTranslatePipe} from 'tests/unit-test-utils';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {PrimaryButtonComponent} from 'components/button-directives/primary-button.component';
import {WindowRef} from 'services/contextual/window-ref.service';
import {CtaSectionComponent} from './cta-section.component';

class MockWindowRef {
  nativeWindow = {
    location: {
      href: '',
    },
  };
}

describe('CtaSectionComponent', () => {
  let component: CtaSectionComponent;
  let fixture: ComponentFixture<CtaSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NoopAnimationsModule,
        MatTabsModule,
        NgbAccordionModule,
        NgbModule,
      ],
      declarations: [
        CtaSectionComponent,
        MockTranslatePipe,
        PrimaryButtonComponent,
      ],
      providers: [
        UrlInterpolationService,
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CtaSectionComponent);
    component = fixture.componentInstance;
    component.screenType = 'desktop';
    component.volunteerFormLink = 'https://example.com/volunteer';
    component.partnershipsFormLink = 'https://example.com/partner';
    fixture.detectChanges();
  });

  it('should successfully instantiate the component', () => {
    expect(component).toBeDefined();
  });

  it('should move the correct volunteer carousel to the previous slide', () => {
    component.volunteerCarouselMobile = jasmine.createSpyObj('NgbCarousel', [
      'prev',
    ]);
    component.volunteerCarousel = jasmine.createSpyObj('NgbCarousel', ['prev']);

    component.screenType = 'mobile';
    component.moveCarouselToPreviousSlide();
    expect(component.volunteerCarouselMobile.prev).toHaveBeenCalled();

    component.screenType = 'desktop';
    component.moveCarouselToPreviousSlide();
    expect(component.volunteerCarousel.prev).toHaveBeenCalled();
  });

  it('should move the correct volunteer carousel to the next slide', () => {
    component.volunteerCarouselMobile = jasmine.createSpyObj('NgbCarousel', [
      'next',
    ]);
    component.volunteerCarousel = jasmine.createSpyObj('NgbCarousel', ['next']);

    component.screenType = 'mobile';
    component.moveCarouselToNextSlide();
    expect(component.volunteerCarouselMobile.next).toHaveBeenCalled();

    component.screenType = 'desktop';
    component.moveCarouselToNextSlide();
    expect(component.volunteerCarousel.next).toHaveBeenCalled();
  });

  it('should emit the correct partner CTA output', () => {
    spyOn(component.partnerButtonClicked, 'emit');
    spyOn(component.partnerLearnMoreClicked, 'emit');

    component.onPartnerBoxButtonClick('partner');
    expect(component.partnerButtonClicked.emit).toHaveBeenCalled();
    expect(component.partnerLearnMoreClicked.emit).not.toHaveBeenCalled();

    component.onPartnerBoxButtonClick('partnerLearnMore');
    expect(component.partnerLearnMoreClicked.emit).toHaveBeenCalled();
  });

  it('should return the correct partner button configuration', () => {
    const partnerButton = component.partnerCtaBoxes[0];
    const learnMoreButton = component.partnerCtaBoxes[1];

    expect(component.getPartnerButtonHref(partnerButton, false)).toBe(
      'https://example.com/partner'
    );
    expect(component.getPartnerButtonHref(learnMoreButton, true)).toBe(
      '/partnerships'
    );
    expect(component.getPartnerButtonClasses(learnMoreButton, false)).toEqual([
      'oppia-about-cta-button',
      'oppia-about-secondary-button',
      'oppia-about-cta-subtext',
      'e2e-test-about-page-partner-learn-more-desktop-button',
    ]);
  });

  it('should return the correct image set for multiple sizes', () => {
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
