// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the attribution guide.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { BrowserCheckerService } from
  'domain/utilities/browser-checker.service';
import { AttributionService } from 'services/attribution.service';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';

@Component({
  selector: 'attribution-guide',
  templateUrl: './attribution-guide.component.html',
  styleUrls: []
})
export class AttributionGuideComponent implements OnInit {
  deviceUsedIsMobile: boolean = false;
  iframed: boolean = false;
  generateAttibutionIsAllowed: boolean = false;
  maskIsShown: boolean = false;
  constructor(
    private attributionService: AttributionService,
    private browserCheckerService: BrowserCheckerService,
    private contextService: ContextService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    this.deviceUsedIsMobile = this.browserCheckerService.isMobileDevice();
    this.iframed = this.urlService.isIframed();
    this.generateAttibutionIsAllowed = (
      this.attributionService.isGenerateAttributionAllowed());
    if (this.generateAttibutionIsAllowed) {
      this.attributionService.init();
    }
  }

  getAttributionModalStatus(): boolean {
    return this.attributionService.isAttributionModalShown();
  }

  showAttributionModal(): void {
    this.attributionService.showAttributionModal();
    this.maskIsShown = true;
  }

  hideAttributionModal(): void {
    this.attributionService.hideAttributionModal();
    this.maskIsShown = false;
  }

  getPageUrl(): string {
    return this.urlService.getCurrentLocation().href;
  }

  getAuthors(): string {
    return this.attributionService.getAuthors().join(', ');
  }

  getExplorationTitle(): string {
    return this.attributionService.getExplorationTitle();
  }

  getExplorationId(): string {
    return this.contextService.getExplorationId();
  }

  copyAttribution(className: string): void {
    const codeDiv = document.getElementsByClassName(className)[0];
    const range = document.createRange();
    range.setStartBefore((<HTMLDivElement>codeDiv).firstChild);
    range.setEndAfter((<HTMLDivElement>codeDiv).lastChild);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    selection.removeAllRanges();
    $(codeDiv).tooltip('show');
    setTimeout(() => $(codeDiv).tooltip('hide'), 1000);
  }
}

angular.module('oppia').directive(
  'attributionGuide', downgradeComponent(
    {component: AttributionGuideComponent}));
