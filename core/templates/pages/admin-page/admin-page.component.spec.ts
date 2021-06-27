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
 * @fileoverview UnitTests for Admin Page component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { AdminBackendApiService } from 'domain/admin/admin-backend-api.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { PlatformFeatureService } from 'services/platform-feature.service';
import { AdminPageComponent } from './admin-page.component';
import { AdminRouterService } from './services/admin-router.service';
import { AdminTaskManagerService } from './services/admin-task-manager.service';

class MockWindowRef {
  nativeWindow = {
    confirm() {
      return true;
    },
    location: {
      hostname: 'hostname',
      href: 'href',
      pathname: 'pathname',
      search: 'search',
      hash: 'hash'
    },
    open() {
      return;
    }
  };
}

describe('Admin misc tab component ', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;
  
    let adminRouterService: AdminRouterService;
    let changeDetectorRef: ChangeDetectorRef;
    let platformFeatureService: PlatformFeatureService;
    let mockWindowRef: MockWindowRef;
  
    beforeEach(() => {
      mockWindowRef = new MockWindowRef();
      TestBed.configureTestingModule({
        imports: [
          HttpClientTestingModule,
          FormsModule
        ],
        declarations: [AdminPageComponent],
        providers: [
        
          {
            provide: WindowRef,
            useValue: mockWindowRef
          }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();
  
      fixture = TestBed.createComponent(AdminPageComponent);
      component = fixture.componentInstance;
    });
  
    beforeEach(() => {

    });

});