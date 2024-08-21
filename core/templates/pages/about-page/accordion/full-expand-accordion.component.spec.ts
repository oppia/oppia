// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the full expand accordion component.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {FullExpandAccordionComponent} from './full-expand-accordion.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MatIconModule} from '@angular/material/icon';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

describe('FullExpandAccordionComponent', () => {
  let component: FullExpandAccordionComponent;
  let fixture: ComponentFixture<FullExpandAccordionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FullExpandAccordionComponent, MockTranslatePipe],
      imports: [NgbModule, MatIconModule],
      providers: [UrlInterpolationService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FullExpandAccordionComponent);
    component = fixture.componentInstance;
    component.accordionData = [
      {
        title: 'Ttile 1',
        text: 'Text 1',
        customPanelClassNames: ['class1'],
        customTitleClassNames: ['class1', 'class2'],
        panelIsCollapsed: true,
      },
      {
        title: 'Title 2',
        text: 'Text 2',
        customPanelClassNames: ['class1'],
        customTitleClassNames: ['class1', 'class2'],
        panelIsCollapsed: true,
      },
    ];
    component.listContainerCustomClasses = ['class1', 'class2'];
    fixture.detectChanges();
  });

  it('should successfully instantiate the component', () => {
    expect(component).toBeDefined();
  });

  it('should set the active index', () => {
    // The active index should not be null or undefined.
    // else it will throw errors in the console when loading the page.
    // for accessing properties of null or undefined.
    expect(component.activeIndex).toBeGreaterThanOrEqual(0);
  });

  it('should expand the panel', () => {
    component.expandPanel(1);
    expect(component.activeIndex).toBe(1);
    expect(component.listIsCollapsed).toBeTrue();
    expect(component.panelIsCollapsed).toBeFalse();
  });

  it('should close the panel', () => {
    // Expand the panel first to close it.
    component.expandPanel(1);
    component.closePanel();
    expect(component.listIsCollapsed).toBeFalse();
    expect(component.panelIsCollapsed).toBeTrue();
  });

  it('should get static image url', () => {
    expect(component.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image'
    );
  });
});
