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
 * @fileoverview Component for the donate page.
 */

import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import 'popper.js';
import 'bootstrap';
import { ThanksForDonatingModalComponent } from './thanks-for-donating-modal.component';
import {DonationBoxModal} from './donation-box/donation-box-modal.component';

interface ImpactStat {
  imageUrl: string | null;
  stat: string | null;
  text: string;
}

interface DonationValue {
  amount: string;
  description: string;
}

interface Highlight {
  imageUrl: string;
  heading: string;
  text: string;
}

@Component({
  selector: 'donate-page',
  templateUrl: './donate-page.component.html',
  styleUrls: [],
})
export class DonatePageComponent implements OnInit {
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private ngbModal: NgbModal,
  ) {}

  ngOnInit(): void {
    const searchParams = new URLSearchParams(
      this.windowRef.nativeWindow.location.search);
    const params = Object.fromEntries(searchParams.entries());
    if (params.hasOwnProperty('thanks')) {
      this.ngbModal.open(ThanksForDonatingModalComponent, {
        backdrop: 'static',
        size: 'xl',
      });
    }
  }

  get donationValues(): DonationValue[] {
    return [
      {
        amount: 'Your $10',
        description: 'could provide the funds needed to educate 25 children on our platform.',
      },
      {
        amount: 'Your $25',
        description:
          'could contribute to a program educating 20 children through a partner organization for a day.',
      },
      {
        amount: 'Your $100',
        description:
          'could buy a phone for a child in Nigeria, allowing offline access to education.',
      },
    ];
  }

  get impactStats(): ImpactStat[][] {
    return [
      [
        {
          imageUrl: '/donate/content-2-graph.svg',
          stat: null,
          text: '60% Improved Test Results',
        },
        {
          imageUrl: '/donate/content-2-screen.svg',
          stat: null,
          text: '10,500 Active Web Users',
        },
      ],
      [
        {
          imageUrl: '/donate/content-2-phone.svg',
          stat: null,
          text: '100,000+ Downloads',
        },
        {
          imageUrl: '/donate/content-2-area-graph.svg',
          stat: null,
          text: '6x Visitors Per Month',
        },
        {
          imageUrl: '/donate/content-2-visitors.svg',
          stat: null,
          text: '443,000 Web Visitors',
        },
      ],
      [
        {
          imageUrl: null,
          stat: '98%',
          text: 'of surveyed users said that they are encouraged to try out more lessons after using Oppia',
        },
      ],
      [
        {
          imageUrl: null,
          stat: '90%',
          text: 'of surveyed users said that they would recommend Oppia to a friend',
        },
      ],
    ];
  }

  get highlights(): Highlight[] {
    return [
      {
        imageUrl: '/donate/highlights-1.png',
        heading: 'Center for Youth Studies',
        text: "This partnership provides after-school classes in Uyo, Akwa Ibom, South-South Nigeria. The program uses Oppia's resources to help primary and secondary school students.",
      },
      {
        imageUrl: '/donate/highlights-2.png',
        heading: 'The Special Youth Foundation',
        text: "Our partnership started in 2022 to provide free maths lessons to young learners across 2 communities in Lagos, Nigeria. This partnership helped us reach over a 100 students with Oppia's maths lessons.",
      },
    ];
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  openDonationBoxModal(): void {
    this.ngbModal.open(DonationBoxModal, {
      backdrop: 'static',
      size: 'xl',
      windowClass: 'donation-box-modal'
    });
  }
}
