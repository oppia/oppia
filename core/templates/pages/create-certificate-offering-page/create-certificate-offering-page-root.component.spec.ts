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
 * @fileoverview Unit tests for CreateCertificateOfferingPageRootComponent.
 */

import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {TranslateModule} from '@ngx-translate/core';

import {CreateCertificateOfferingPageRootComponent} from './create-certificate-offering-page-root.component';
import {PageHeadService} from 'services/page-head.service';
import {PlatformFeatureService} from 'services/platform-feature.service';

describe('CreateCertificateAssessmentOfferingPageRootComponent', () => {
  let component: CreateCertificateOfferingPageRootComponent;
  let fixture: ComponentFixture<CreateCertificateOfferingPageRootComponent>;

  beforeEach(() => {
    const platformFeatureServiceSpy = jasmine.createSpyObj(
      'PlatformFeatureService',
      [],
      {
        status: {
          EnableCertificateAssessment: {
            isEnabled: true,
          },
        },
      }
    );

    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      declarations: [CreateCertificateOfferingPageRootComponent],
      providers: [
        PageHeadService,
        {
          provide: PlatformFeatureService,
          useValue: platformFeatureServiceSpy,
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(
      CreateCertificateOfferingPageRootComponent
    );
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(
      component instanceof CreateCertificateOfferingPageRootComponent
    ).toBeTrue();
  });

  it('should set isCertificateOfferingEnabled from service', () => {
    expect(component.isCertificateOfferingEnabled).toEqual(true);
  });
});
