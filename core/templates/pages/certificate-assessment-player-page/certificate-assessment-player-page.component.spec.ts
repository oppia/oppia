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

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute, Router} from '@angular/router';
import {CertificateAssessmentPlayerPageComponent} from './certificate-assessment-player-page.component';

describe('CertificateAssessmentPlayerPageComponent', () => {
  let component: CertificateAssessmentPlayerPageComponent;
  let fixture: ComponentFixture<CertificateAssessmentPlayerPageComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CertificateAssessmentPlayerPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (name: string) => {
                  if (name === 'certificate_id') {
                    return 'cert-123';
                  }
                  return null;
                },
              },
              url: [],
            },
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: jasmine.createSpy('navigate'),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CertificateAssessmentPlayerPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should initialize intro stage for the base route', () => {
    fixture.detectChanges();

    expect(component.certificateId).toBe('cert-123');
    expect(component.currentStage).toBe('intro');
  });

  it('should navigate to the session route on startAssessment', () => {
    fixture.detectChanges();

    component.startAssessment();

    expect(router.navigate).toHaveBeenCalledWith(['session'], {
      relativeTo: TestBed.inject(ActivatedRoute),
    });
  });

  it('should navigate to the result route on submitAssessment', () => {
    spyOn(Date, 'now').and.returnValue(1234);
    fixture.detectChanges();

    component.submitAssessment();

    expect(router.navigate).toHaveBeenCalledWith([
      '/certificate-assessment/cert-123/result',
      'attempt-1234',
    ]);
  });
});
