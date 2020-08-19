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
 * @fileoverview Unit tests for the OppiaAngularRootComponent.
 */

import { ComponentFixture, fakeAsync, TestBed, async, flushMicrotasks} from
  '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { OppiaAngularRootComponent } from './oppia-angular-root.component';
import { PlatformFeatureService } from 'services/platform-feature.service';

let component: OppiaAngularRootComponent;
let fixture: ComponentFixture<OppiaAngularRootComponent>;

let initialzationPromise: Promise<void>;

class MockPlatformFeatureService {
  async initialize(): Promise<void> {
    return initialzationPromise;
  }
}

describe('OppiaAngularRootComponent', function() {
  let emitSpy: jasmine.Spy;

  let resolveInitPromise: () => void;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [OppiaAngularRootComponent],
      providers: [
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OppiaAngularRootComponent);
    component = fixture.componentInstance;

    initialzationPromise = new Promise(resolveFn => {
      resolveInitPromise = resolveFn;
    });
    emitSpy = spyOn(component.initialized, 'emit');

    component.ngAfterViewInit();
  }));

  describe('.initialized', () => {
    it('should not emit before initialization of PlatformFeatureService',
      fakeAsync(() => {
        flushMicrotasks();

        expect(emitSpy).not.toHaveBeenCalled();
      })
    );

    it('should emit once the platform feature service completes initialization',
      fakeAsync(() => {
        resolveInitPromise();
        flushMicrotasks();

        expect(emitSpy).toHaveBeenCalled();
      })
    );
  });
});
