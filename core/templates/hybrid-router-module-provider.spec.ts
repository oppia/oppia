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
 * @fileoverview Unit tests for hybrid router module provider.
 */

import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';

import { SmartRouterLink } from 'hybrid-router-module-provider';
import { WindowRef } from 'services/contextual/window-ref.service';
import {UserService} from "services/user.service";

@Component({
  selector: 'mock-comp-a',
  template: '<a href="/contact" [smartRouterLink]="\'/contact\'"></a>'
})
class MockCompA {}

@Component({
  selector: 'mock-comp-b',
  template: '<a href="/contact" [smartRouterLink]="\'/contact\'"></a><router-outlet>'
})
class MockCompB {}

@Component({
  selector: 'mock-comp-c',
  template: '<a href="/contact" [smartRouterLink]="\'/contact\'"></a><router-outlet custom="light">'
})
class MockCompC {}

@Component({
  selector: 'mock-comp-d',
  template: '<a href="/" [smartRouterLink]="\'/\'"></a><router-outlet>'
})
class MockCompD {}

@Component({
  selector: 'mock-comp-e',
  template: '<a href="/" [smartRouterLink]="\'/\'"></a><router-outlet custom="light">'
})
class MockCompE {}

class MockWindowRef {
  nativeWindow = {
    location: {
      href: ''
    },
  };
}

describe('Smart router link directive', () => {
  let mockCompAFixture: ComponentFixture<MockCompA>;
  let mockCompBFixture: ComponentFixture<MockCompB>;
  let mockCompCFixture: ComponentFixture<MockCompC>;
  let mockCompDFixture: ComponentFixture<MockCompD>;
  let mockCompEFixture: ComponentFixture<MockCompE>;
  let mockCompALink;
  let mockCompBLink;
  let mockCompCLink;
  let mockCompDLink;
  let mockCompELink;
  let mockWindowRef: MockWindowRef;

  beforeEach(waitForAsync(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'contact', component: MockCompA },
          { path: 'contact', component: MockCompB },
          { path: 'contact', component: MockCompC },
          { path: '', component: MockCompD },
          { path: '', component: MockCompE },
        ]),
      ],
      declarations: [
        MockCompA,
        MockCompB,
        MockCompC,
        MockCompD,
        MockCompE,
        SmartRouterLink,
      ],
      providers: [
        {
          provide: WindowRef,
          useValue: mockWindowRef
        }
      ]
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    mockCompAFixture = TestBed.createComponent(MockCompA);
    mockCompBFixture = TestBed.createComponent(MockCompB);
    mockCompCFixture = TestBed.createComponent(MockCompC);
    mockCompDFixture = TestBed.createComponent(MockCompD);
    mockCompEFixture = TestBed.createComponent(MockCompE);
    mockCompALink = (
      mockCompAFixture.debugElement.nativeElement.querySelector('a'));
    mockCompBLink = (
      mockCompBFixture.debugElement.nativeElement.querySelector('a'));
    mockCompCLink = (
      mockCompCFixture.debugElement.nativeElement.querySelector('a'));
    mockCompDLink = (
      mockCompDFixture.debugElement.nativeElement.querySelector('a'));
    mockCompELink = (
      mockCompEFixture.debugElement.nativeElement.querySelector('a'));
  }));

  it('should navigate by refreshing from non-router page', fakeAsync(() => {
    mockCompAFixture.detectChanges();
    tick();
    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    mockCompALink.click();
    mockCompAFixture.detectChanges();
    tick();

    expect(mockWindowRef.nativeWindow.location.href).toBe('/contact');
  }));

  it(
    'should navigate without refreshing inside normal router',
    fakeAsync(() => {
      mockCompBFixture.detectChanges();
      tick();
      expect(mockWindowRef.nativeWindow.location.href).toBe('');

      mockCompBLink.click();
      mockCompBFixture.detectChanges();
      tick();

      expect(mockWindowRef.nativeWindow.location.href).toBe('/contact');
    })
  );

  it(
    'should navigate by refreshing from lightweight router to normal router',
    fakeAsync(() => {
      mockCompCFixture.detectChanges();
      tick();
      expect(mockWindowRef.nativeWindow.location.href).toBe('');

      mockCompCLink.click();
      mockCompCFixture.detectChanges();
      tick();

      expect(mockWindowRef.nativeWindow.location.href).toBe('/contact');
    })
  );

  it(
    'should navigate by refreshing from normal router to lightweight router',
    fakeAsync(() => {
      mockCompDFixture.detectChanges();
      tick();
      expect(mockWindowRef.nativeWindow.location.href).toBe('');

      mockCompDLink.click();
      mockCompDFixture.detectChanges();
      tick();

      expect(mockWindowRef.nativeWindow.location.href).toBe('');
    })
  );


  it(
    'should navigate without refreshing inside lightweight router',
    fakeAsync(() => {
      mockCompEFixture.detectChanges();
      tick();
      expect(mockWindowRef.nativeWindow.location.href).toBe('');

      mockCompELink.click();
      mockCompEFixture.detectChanges();
      tick();

      expect(mockWindowRef.nativeWindow.location.href).toBe('');
    })
  );
});
