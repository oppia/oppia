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
 * @fileoverview Unit tests for the error 404 page root component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { LoggerService } from 'services/contextual/logger.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { Error404PageRootComponent } from './error-404-page-root.component';

describe('Error 404 Page Root', () => {
  let fixture: ComponentFixture<Error404PageRootComponent>;
  let component: Error404PageRootComponent;
  let loggerService: LoggerService;
  let pathname = '/mock';

  class MockWindowRef {
    nativeWindow = {
      location: {
        pathname
      }
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        Error404PageRootComponent
      ],
      providers: [
        LoggerService,
        {
          provide: WindowRef,
          useClass: MockWindowRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Error404PageRootComponent);
    component = fixture.componentInstance;
    loggerService = TestBed.inject(LoggerService);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should initalize and raise an not found erorr', () => {
    spyOn(loggerService, 'error');
    component.ngOnInit();
    expect(loggerService.error).toHaveBeenCalledWith(
      `The requested path ${pathname} is not found.`);
  });
});
