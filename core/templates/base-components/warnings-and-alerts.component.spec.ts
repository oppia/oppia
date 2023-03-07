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
 * @fileoverview Unit tests for WarningsAndAlertsComponent.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AlertMessageComponent } from 'components/common-layout-directives/common-elements/alert-message.component';
import { LimitToPipe } from 'filters/limit-to.pipe';
import { AlertsService, Message, Warning } from 'services/alerts.service';
import { WarningsAndAlertsComponent } from './warnings-and-alerts.component';

describe('Warnings and Alert Component', () => {
  let fixture: ComponentFixture<WarningsAndAlertsComponent>;
  let componentInstance: WarningsAndAlertsComponent;
  let alertsService: AlertsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        WarningsAndAlertsComponent,
        AlertMessageComponent,
        LimitToPipe
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WarningsAndAlertsComponent);
    componentInstance = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should get messages', () => {
    let messages: Message[] =
      [{ content: 'Test Message', timeout: 100, type: 'success' }];
    spyOnProperty(alertsService, 'messages').and.returnValue(messages);
    expect(componentInstance.getMessages()).toEqual(messages);
  });

  it('should get warnings', () => {
    let warnings: Warning[] =
      [{ content: 'Test Warning', type: 'success' }];
    spyOnProperty(alertsService, 'warnings').and.returnValue(warnings);
    expect(componentInstance.getWarnings()).toEqual(warnings);
  });

  it('should delete warning', () => {
    spyOn(alertsService, 'deleteWarning');
    let warning: Warning = { content: 'Test Warning', type: 'success' };
    componentInstance.deleteWarning(warning);
    expect(alertsService.deleteWarning).toHaveBeenCalled();
  });
});
