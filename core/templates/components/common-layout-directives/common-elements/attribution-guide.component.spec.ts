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
 * @fileoverview Unit tests for attribution guide component.
 */

import { TestBed, async, ComponentFixture } from
  '@angular/core/testing';

import { AttributionGuideComponent } from './attribution-guide.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UrlService } from 'services/contextual/url.service';
import { AttributionService } from 'services/attribution.service';
import { BrowserCheckerService } from 'domain/utilities/browser-checker.service';

class MockAttributionService {
  isGenerateAttributionAllowed() {
    return true;
  }

  isAttributionModalShown() {
    return true;
  }

  showAttributionModal() {
    return;
  }

  hideAttributionModal() {
    return;
  }

  getAuthors() {
    return ['Ellie', 'Abby', 'Joel', 'Dina'];
  }

  getExplorationTitle() {
    return 'Place Values';
  }
}

class MockBrowserCheckerService {
  isMobileDevice() {
    return true;
  }
}

class MockUrlService {
  isIframed() {
    return true;
  }

  getCurrentLocation() {
    return { href: 'localhost:8181/explore/0' };
  }
}

describe('Attribution Guide Component', function() {
  let component: AttributionGuideComponent;
  let fixture: ComponentFixture<AttributionGuideComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AttributionGuideComponent],
      providers: [
        { provide: AttributionService, useClass: MockAttributionService },
        { provide: BrowserCheckerService, useClass: MockBrowserCheckerService },
        { provide: UrlService, useClass: MockUrlService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttributionGuideComponent);
    component = fixture.componentInstance;
  });

  it('should initialize component properties correctly', () => {
    expect(component.deviceUsedIsMobile).toBeFalse();
    expect(component.iframed).toBeFalse();
    expect(component.generateAttibutionIsAllowed).toBeFalse();
    component.ngOnInit();
    expect(component.deviceUsedIsMobile).toBeTrue();
    expect(component.iframed).toBeTrue();
    expect(component.generateAttibutionIsAllowed).toBeTrue();
  });

  it('should return attribution modal status', () => {
    expect(component.getAttributionModalStatus()).toBeTrue();
  });

  it('should show mask when modal is active', () => {
    expect(component.maskIsShown).toBeFalse();
    component.showAttributionModal();
    expect(component.maskIsShown).toBeTrue();
  });

  it('should hide mask when modal is active', () => {
    component.maskIsShown = true;
    expect(component.maskIsShown).toBeTrue();
    component.hideAttributionModal();
    expect(component.maskIsShown).toBeFalse();
  });

  it('should get page URL', () => {
    expect(component.getPageUrl()).toEqual('localhost:8181/explore/0');
  });

  it('should get authors', () => {
    expect(component.getAuthors()).toEqual('Ellie, Abby, Joel, Dina');
  });

  it('should get exploration title', () => {
    expect(component.getExplorationTitle()).toEqual('Place Values');
  });

  it('should run the copy command and show a tooltip', () => {
    let dummyDivElement = document.createElement('div');
    let dummyTextNode = document.createTextNode('Text to be copied');
    dummyDivElement.className = 'class-name';
    dummyDivElement.appendChild(dummyTextNode);
    let dummyDocumentFragment = document.createDocumentFragment();
    dummyDocumentFragment.appendChild(dummyDivElement);
    spyOn(
      document, 'getElementsByClassName'
    ).withArgs('class-name').and.returnValue(dummyDocumentFragment.children);
    spyOn(document, 'execCommand').withArgs('copy');
    spyOn($.fn, 'tooltip');
    component.copyAttribution('class-name');
    expect(document.execCommand).toHaveBeenCalled();
    expect($.fn.tooltip).toHaveBeenCalledWith('show');
  });
});
