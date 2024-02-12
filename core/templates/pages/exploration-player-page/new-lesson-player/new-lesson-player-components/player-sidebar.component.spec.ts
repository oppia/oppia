// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for new lesson player sidebar component.
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PlayerSidebarComponent } from './player-sidebar.component';

describe('SidebarComponent', () => {
  let component: PlayerSidebarComponent;
  let fixture: ComponentFixture<PlayerSidebarComponent>;

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      declarations: [PlayerSidebarComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it(
    'should toggle width between 75px and 250px when clicked',
    fakeAsync(() => {
      const sidebarElement =
        fixture.debugElement.nativeElement.querySelector(
          '.oppia-lesson-player-sidebar');
      expect(sidebarElement).not.toBeNull();
      expect(sidebarElement.classList.contains('expanded')).toBe(false);

      component.toggleSidebar();
      tick();
      fixture.detectChanges();
      expect(sidebarElement.classList.contains('expanded')).toBe(true);

      component.toggleSidebar();
      tick();
      fixture.detectChanges();
      expect(sidebarElement.classList.contains('expanded')).toBe(false);
    }));
});
