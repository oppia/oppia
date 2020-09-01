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

import { ComponentFixture, TestBed, async} from
  '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { OppiaAngularRootComponent } from './oppia-angular-root.component';

let component: OppiaAngularRootComponent;
let fixture: ComponentFixture<OppiaAngularRootComponent>;

describe('OppiaAngularRootComponent', function() {
  let emitSpy: jasmine.Spy;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [OppiaAngularRootComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OppiaAngularRootComponent);
    component = fixture.componentInstance;

    emitSpy = spyOn(component.initialized, 'emit');
  }));

  describe('.initialized', () => {
    it('should emit once ngAfterViewInit is called', () => {
      component.ngAfterViewInit();

      expect(emitSpy).toHaveBeenCalled();
    });
  });
});
