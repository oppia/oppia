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
 * @fileoverview Unit tests for error page root.
 */

import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {ActivatedRoute, UrlSegment} from '@angular/router';

import {WindowRef} from 'services/contextual/window-ref.service';
import {ErrorPageRootComponent} from './error-page-root.component';
import {BaseRootComponent} from 'pages/base-root.component';
import {PageHeadService} from 'services/page-head.service';

class MockWindowRef {
  nativeWindow = {
    document: {
      getElementsByTagName(tagName: string) {
        return [
          {
            getAttribute(attr: string) {
              return '401';
            },
          },
        ];
      },
    },
  };
}

class MockActivatedRoute {
  snapshot = {
    paramMap: {
      get: (key: string) => {
        return '500';
      },
    },
    url: [],
  };
}

describe('ErrorPageRootComponent', () => {
  let fixture: ComponentFixture<ErrorPageRootComponent>;
  let component: ErrorPageRootComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [ErrorPageRootComponent],
      providers: [
        PageHeadService,
        TranslateService,
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        {
          provide: ActivatedRoute,
          useClass: MockActivatedRoute,
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorPageRootComponent);
    component = fixture.componentInstance;
  });

  it('should return title interpolation params', () => {
    const parentNgOnInitSpy = spyOn(BaseRootComponent.prototype, 'ngOnInit');

    component.ngOnInit();

    expect(component.statusCode).toEqual('500');
    expect(parentNgOnInitSpy).toHaveBeenCalledTimes(1);
    expect(component.titleInterpolationParams).toEqual({
      statusCode: component.statusCode,
    });
  });

  it('should obtain status code from activated router', () => {
    const parentNgOnInitSpy = spyOn(BaseRootComponent.prototype, 'ngOnInit');

    component.ngOnInit();

    expect(component.statusCode).toEqual('500');
    expect(parentNgOnInitSpy).toHaveBeenCalledTimes(1);
  });

  it('should obtain status code from body tag', () => {
    const parentNgOnInitSpy = spyOn(BaseRootComponent.prototype, 'ngOnInit');
    spyOn(component.activatedRoute.snapshot.paramMap, 'get').and.returnValue(
      null
    );
    const getElementsByTagNameSpy = spyOn(
      component.windowRef.nativeWindow.document,
      'getElementsByTagName'
    ).and.callThrough();

    component.ngOnInit();

    expect(component.statusCode).toEqual('401');
    expect(parentNgOnInitSpy).toHaveBeenCalledTimes(1);
    expect(getElementsByTagNameSpy).toHaveBeenCalledWith('body');
  });

  it('should default to 404 in case of invalid param', () => {
    const parentNgOnInitSpy = spyOn(BaseRootComponent.prototype, 'ngOnInit');
    spyOn(component.activatedRoute.snapshot.paramMap, 'get').and.returnValue(
      'invalid_value'
    );
    const getElementsByTagNameSpy = spyOn(
      component.windowRef.nativeWindow.document,
      'getElementsByTagName'
    );

    component.ngOnInit();

    expect(component.statusCode).toEqual('404');
    expect(parentNgOnInitSpy).toHaveBeenCalledTimes(1);
    expect(getElementsByTagNameSpy).not.toHaveBeenCalled();
  });

  it('should default to 404 in case of nested url', () => {
    const parentNgOnInitSpy = spyOn(BaseRootComponent.prototype, 'ngOnInit');
    component.activatedRoute.snapshot.url = [new UrlSegment('nested_path', {})];
    const getElementsByTagNameSpy = spyOn(
      component.windowRef.nativeWindow.document,
      'getElementsByTagName'
    );

    component.ngOnInit();

    expect(component.statusCode).toEqual('404');
    expect(parentNgOnInitSpy).toHaveBeenCalledTimes(1);
    expect(getElementsByTagNameSpy).not.toHaveBeenCalled();
  });
});
