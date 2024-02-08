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
 * @fileoverview Component for primary link buttons displayed on static pages.
 */

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import './primary-link-button.component.css';


@Component({
  selector: 'oppia-primary-link-button',
  templateUrl: './primary-link-button.component.html',
  styleUrls: ['./primary-link-button.component.css']
})
export class PrimaryLinkButtonComponent implements OnInit {
  @Input() buttonText: string = '';
  @Input() customClasses?: string[];
  @Input() disabled?: boolean = false;
  @Input() buttonHref: string = '#';
  @Output() onClickPrimaryButton: EventEmitter<void> = new EventEmitter<void>();

  componentIsButton: boolean = false;
  openInNewTab: boolean = false;

  ngOnInit(): void {
    this.componentIsButton = this.buttonHref === '#';
  }

  getButtonHref(): string {
    return this.buttonHref;
  }

  getTarget(): string {
    this.openInNewTab = this.isExternalLink(this.buttonHref);
    return this.openInNewTab ? '_blank' : '_self';
  }

  private isExternalLink(link: string): boolean {
    return link.startsWith('http://') || link.startsWith('https://');
  }

  handleButtonClick(): void {
    if (this.onClickPrimaryButton.observers.length > 0) {
      this.onClickPrimaryButton.emit();
    }
  }
}

angular.module('oppia').directive('oppiaPrimaryLinkButton',
  downgradeComponent({
    component: PrimaryLinkButtonComponent
  }) as angular.IDirectiveFactory);
