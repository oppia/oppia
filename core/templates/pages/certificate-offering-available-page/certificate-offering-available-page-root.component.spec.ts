// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for AvailableCertificateOfferingPageRootComponent.
 */

// @ts-nocheck

import {ActivatedRoute} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';

import {AppConstants} from 'app.constants';
import {PageHeadService} from 'services/page-head.service';
import {AvailableCertificateOfferingPageRootComponent} from './certificate-offering-available-page-root.component';

describe('AvailableCertificateOfferingPageRootComponent', () => {
  let component: AvailableCertificateOfferingPageRootComponent;

  const createComponent = function (classroomUrlFragment: string | null): void {
    const activatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy().and.returnValue(classroomUrlFragment),
        },
      },
    } as ActivatedRoute;

    component = new AvailableCertificateOfferingPageRootComponent(
      {} as PageHeadService,
      {} as TranslateService,
      activatedRoute
    );
  };

  it('should use the classroom url fragment from the route when present', () => {
    createComponent('math');

    expect(component.classroomUrlFragment).toBe('math');
    expect(component.title).toBe(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CERTIFICATE_OFFERING_AVAILABLE
        .TITLE
    );
    expect(component.meta).toBe(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CERTIFICATE_OFFERING_AVAILABLE
        .META as unknown as typeof component.meta
    );
  });

  it('should fall back to an empty classroom url fragment when missing', () => {
    createComponent(null);

    expect(component.classroomUrlFragment).toBe('');
    expect(component.title).toBe(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CERTIFICATE_OFFERING_AVAILABLE
        .TITLE
    );
    expect(component.meta).toBe(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CERTIFICATE_OFFERING_AVAILABLE
        .META as unknown as typeof component.meta
    );
  });

  it('should read the classroom url fragment from the parent route when needed', () => {
    const parentParamMapGetSpy = jasmine.createSpy().and.returnValue('math');
    const activatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy().and.returnValue(null),
        },
        parent: {
          paramMap: {
            get: parentParamMapGetSpy,
          },
        },
      },
    } as ActivatedRoute;

    component = new AvailableCertificateOfferingPageRootComponent(
      {} as PageHeadService,
      {} as TranslateService,
      activatedRoute
    );

    expect(component.classroomUrlFragment).toBe('math');
    expect(parentParamMapGetSpy).toHaveBeenCalledWith('classroomUrlFragment');
  });
});
