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
 * @fileoverview Unit tests for the lightweight Angular bootstrap.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {WindowRef} from 'services/contextual/window-ref.service';

import {
  LiteRootComponent,
  ReloadOnUnknownRouteComponent,
} from './lite-app.module';

describe('Lightweight Angular bootstrap', () => {
  it('should render a router outlet in the root shell', () => {
    const fixture: ComponentFixture<LiteRootComponent> =
      TestBed.configureTestingModule({
        declarations: [LiteRootComponent],
      }).createComponent(LiteRootComponent);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });

  it('should reload the app for routes outside the lightweight module', () => {
    const reload = jasmine.createSpy('reload');
    TestBed.configureTestingModule({
      declarations: [ReloadOnUnknownRouteComponent],
      providers: [
        {
          provide: WindowRef,
          useValue: {nativeWindow: {location: {reload: reload}}},
        },
      ],
    });

    const fixture = TestBed.createComponent(ReloadOnUnknownRouteComponent);
    fixture.componentInstance.ngOnInit();

    expect(reload).toHaveBeenCalled();
  });
});
