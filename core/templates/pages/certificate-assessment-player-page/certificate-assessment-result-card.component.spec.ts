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
 * @fileoverview Unit tests for CertificateAssessmentResultCardComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute} from '@angular/router';
import {CertificateAssessmentResultCardComponent} from './certificate-assessment-result-card.component';

describe('CertificateAssessmentResultCardComponent', () => {
  let component: CertificateAssessmentResultCardComponent;
  let fixture: ComponentFixture<CertificateAssessmentResultCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CertificateAssessmentResultCardComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (name: string) => {
                  if (name === 'attempt_id') {
                    return 'attempt-1';
                  }
                  return null;
                },
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CertificateAssessmentResultCardComponent);
    component = fixture.componentInstance;
  });

  it('should read attempt id from the route', () => {
    fixture.detectChanges();

    expect(component.attemptId).toBe('attempt-1');
  });
});
