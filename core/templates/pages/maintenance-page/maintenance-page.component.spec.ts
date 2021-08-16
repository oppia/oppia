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
 * @fileoverview Unit tests for maintenance page controller.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, async, TestBed } from '@angular/core/testing';

import { MaintenancePageComponent } from
  'pages/maintenance-page/maintenance-page.component';
import { DocumentAttributeCustomizationService } from
  'services/contextual/document-attribute-customization.service';

let component: MaintenancePageComponent;
let fixture: ComponentFixture<MaintenancePageComponent>;

describe('Maintenance page', () => {
  let documentAttributeCustomizationService:
    DocumentAttributeCustomizationService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MaintenancePageComponent],
      providers: [
        DocumentAttributeCustomizationService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    documentAttributeCustomizationService =
      TestBed.get(DocumentAttributeCustomizationService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaintenancePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should set document lang when $onInit is called', () => {
    spyOn(documentAttributeCustomizationService, 'addAttribute').and
      .callThrough();
    component.ngOnInit();

    expect(component.currentLang).toBe('en');
    expect(documentAttributeCustomizationService.addAttribute)
      .toHaveBeenCalledWith('lang', 'en');
  });

  it('should get static image url', () => {
    let imagePath = '/path/to/image.png';
    let staticImageUrl = component.getStaticImageUrl(imagePath);

    expect(staticImageUrl).toBe('/assets/images/path/to/image.png');
  });
});
