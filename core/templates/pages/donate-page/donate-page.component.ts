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

import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import 'popper.js';
import 'bootstrap';
import { ThanksForDonatingModalComponent } from './thanks-for-donating-modal.component';
import { DonationBoxModalComponent } from './donation-box/donation-box-modal.component';

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

interface Learner {
  name: string;
  country: string;
  imageUrl: string;
  webpUrl: string;
  text: string;
}

@Component({
  selector: 'donate-page',
  templateUrl: './donate-page.component.html',
  styleUrls: [],
})

export class DonatePageComponent implements OnInit {
  donationValues: DonationValue[] = [
    {
      amount: '10',
      description: 'I18N_DONATE_PAGE_CONTENT_DONATION_DESCRIPTION_1',
    },
    {
      amount: '25',
      description: 'I18N_DONATE_PAGE_CONTENT_DONATION_DESCRIPTION_2',
    },
    {
      amount: '100',
      description: 'I18N_DONATE_PAGE_CONTENT_DONATION_DESCRIPTION_3',
    },
  ];

  impactStats: ImpactStat[][] = [
    [
      {
        imageUrl: '/donate/content-2-graph.svg',
        stat: null,
        text: 'I18N_DONATE_PAGE_CONTENT_STAT_1',
      },
      {
        imageUrl: '/donate/content-2-screen.svg',
        stat: null,
        text: 'I18N_DONATE_PAGE_CONTENT_STAT_2',
      },
    ],
    [
      {
        imageUrl: '/donate/content-2-phone.svg',
        stat: null,
        text: 'I18N_DONATE_PAGE_CONTENT_STAT_3',
      },
      {
        imageUrl: '/donate/content-2-area-graph.svg',
        stat: null,
        text: 'I18N_DONATE_PAGE_CONTENT_STAT_4',
      },
      {
        imageUrl: '/donate/content-2-visitors.svg',
        stat: null,
        text: 'I18N_DONATE_PAGE_CONTENT_STAT_5',
      },
    ],
    [
      {
        imageUrl: null,
        stat: '98%',
        text: 'I18N_DONATE_PAGE_CONTENT_STAT_6',
      },
    ],
    [
      {
        imageUrl: null,
        stat: '90%',
        text: 'I18N_DONATE_PAGE_CONTENT_STAT_7',
      },
    ],
  ];

  highlights: Highlight[] = [
    {
      imageUrl: '/donate/highlights-1',
      heading: 'I18N_DONATE_PAGE_CONTENT_HIGHLIGHTS_TITLE_1',
      text: 'I18N_DONATE_PAGE_CONTENT_HIGHLIGHTS_CONTENT_1',
    },
    {
      imageUrl: '/donate/highlights-2',
      heading: 'I18N_DONATE_PAGE_CONTENT_HIGHLIGHTS_TITLE_2',
      text: 'I18N_DONATE_PAGE_CONTENT_HIGHLIGHTS_CONTENT_2',
    },
  ];

  learners: Learner[] = [
    {
      name: 'Abasiekeme',
      country: 'I18N_DONATE_PAGE_CONTENT_LEARNER_COUNTRY_1',
      imageUrl: '/donate/learners-abasiekeme.png',
      webpUrl: '/donate/learners-abasiekeme.webp',
      text: 'I18N_DONATE_PAGE_CONTENT_LEARNER_QUOTE_1'
    },
    {
      name: 'Sandra Bosso',
      country: 'I18N_DONATE_PAGE_CONTENT_LEARNER_COUNTRY_2',
      imageUrl: '/donate/learners-sandra.png',
      webpUrl: '/donate/learners-sandra.webp',
      text: 'I18N_DONATE_PAGE_CONTENT_LEARNER_QUOTE_2',
    },
    {
      name: 'Kajal',
      country: 'I18N_DONATE_PAGE_CONTENT_LEARNER_COUNTRY_3',
      imageUrl: '/donate/learners-kajal.png',
      webpUrl: '/donate/learners-kajal.webp',
      text: 'I18N_DONATE_PAGE_CONTENT_LEARNER_QUOTE_3',
    },
    {
      name: 'Seneen',
      country: 'I18N_DONATE_PAGE_CONTENT_LEARNER_COUNTRY_4',
      imageUrl: '/donate/learners-seneen.png',
      webpUrl: '/donate/learners-seneen.webp',
      text: 'I18N_DONATE_PAGE_CONTENT_LEARNER_QUOTE_4',
    },
    {
      name: 'Juweria Cabdalla',
      country: 'I18N_DONATE_PAGE_CONTENT_LEARNER_COUNTRY_5',
      imageUrl: '/donate/learners-juweria.png',
      webpUrl: '/donate/learners-juweria.webp',
      text: 'I18N_DONATE_PAGE_CONTENT_LEARNER_QUOTE_5',
    },
  ];

  tileShown: number = 0;
  @ViewChildren('tiles') tiles!: QueryList<ElementRef>;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private ngbModal: NgbModal
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

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  openDonationBoxModal(): void {
    this.ngbModal.open(DonationBoxModalComponent, {
      backdrop: 'static',
      size: 'xl',
      windowClass: 'donation-box-modal',
    });
  }

  nextTile(clickedVal: number): void {
    let learnerTile = this.tiles.toArray()[clickedVal].nativeElement;
    this.tileShown = clickedVal;

    if (learnerTile !== null) {
      learnerTile.scrollIntoView({
        behavior: 'smooth', block: 'nearest', inline: 'center'
      });
    }
  }
}
