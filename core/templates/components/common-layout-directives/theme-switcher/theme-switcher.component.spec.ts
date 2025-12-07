// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ThemeSwitcherComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {ThemeSwitcherComponent} from './theme-switcher.component';
import {ThemeService, OppiaTheme} from 'services/theme.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {MatTooltipModule} from '@angular/material/tooltip';

class MockThemeService {
  private currentTheme = OppiaTheme.LIGHT;
  getPreferredTheme() {
    return this.currentTheme;
  }
  setTheme(theme: OppiaTheme) {
    this.currentTheme = theme;
  }
}

describe('ThemeSwitcherComponent', () => {
  let component: ThemeSwitcherComponent;
  let fixture: ComponentFixture<ThemeSwitcherComponent>;
  let themeService: MockThemeService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatTooltipModule],
      declarations: [ThemeSwitcherComponent, MockTranslatePipe],
      providers: [{provide: ThemeService, useClass: MockThemeService}],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeSwitcherComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService) as unknown as MockThemeService;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct icon based on theme', () => {
    spyOn(themeService, 'getPreferredTheme').and.returnValue(OppiaTheme.LIGHT);
    expect(component.getIcon()).toBe('light_mode');

    (themeService.getPreferredTheme as jasmine.Spy).and.returnValue(
      OppiaTheme.DARK
    );
    expect(component.getIcon()).toBe('dark_mode');
  });

  it('should toggle theme on button click', () => {
    spyOn(themeService, 'setTheme').and.callThrough();
    spyOn(themeService, 'getPreferredTheme').and.returnValue(OppiaTheme.LIGHT);

    component.toggleTheme();

    expect(themeService.setTheme).toHaveBeenCalledWith(OppiaTheme.DARK);
  });

  it('should toggle theme back to light', () => {
    spyOn(themeService, 'setTheme').and.callThrough();
    spyOn(themeService, 'getPreferredTheme').and.returnValue(OppiaTheme.DARK);

    component.toggleTheme();

    expect(themeService.setTheme).toHaveBeenCalledWith(OppiaTheme.LIGHT);
  });
});
