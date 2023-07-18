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
 * @fileoverview Component for the feedback Updates page.
 */

import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { LoaderService } from 'services/loader.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import './translation-submitter-table.component.css';

@Component({
  selector: 'translation-submitter-table',
  styleUrls: ['./translation-submitter-table.component.css'],
  templateUrl: './translation-submitter-table.component.html',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class TanslationSubmitterTable implements OnInit {
  @Input() activeTab: string;

  columnsToDisplay = [
    'User',
    'Rank',
    'Performace',
    'Accuracy',
    'Translated Cards',
    'Last Translated(in days)',
    'Role'
  ];

  dataSource = ELEMENT_DATA;

  expandedElement: PeriodicElement | null | [];

  TAB_NAME_TRANSLATION_SUBMITTER: string = 'translation_submitter';
  TAB_NAME_TRANSLATION_REVIEWER: string = 'translation_reviewer';
  TAB_NAME_QUESTION_SUBMITTER: string = 'question_submitter';
  TAB_NAME_QUESTION_REVIEWER: string = 'question_reviewer';
  TAB_NAME_LANGUAGE_COORDINATOR: string = 'language_coordinator';
  TAB_NAME_QUESTION_COORDINATOR: string = 'question_coordinator';

  constructor(
    private loaderService: LoaderService,
    private windowDimensionsService: WindowDimensionsService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.updateColumnsToDisplay();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.activeTab) {
      this.updateColumnsToDisplay();
    }
  }

  updateColumnsToDisplay(): void {
    if (this.activeTab === this.TAB_NAME_TRANSLATION_SUBMITTER) {
      this.columnsToDisplay = [
        'User',
        'Rank',
        'Performace',
        'Accuracy',
        'Translated Cards',
        'Last Translated(in days)',
        'Role'
      ];
    } else if (this.activeTab === this.TAB_NAME_TRANSLATION_REVIEWER) {
      this.columnsToDisplay = [
        'User',
        'Reviewed Cards',
        'Last Reviewed(in days)',
        'Role'
      ];
    } else if (this.activeTab === this.TAB_NAME_QUESTION_SUBMITTER) {
      this.columnsToDisplay = [
        'User',
        'Rank',
        'Performace',
        'Accuracy',
        'Questions Submitted',
        'Last Submitted(in days)',
        'Role'
      ];
    } else if (this.activeTab === this.TAB_NAME_QUESTION_REVIEWER) {
      this.columnsToDisplay = [
        'User',
        'Questions Reviewed',
        'Last Reviewed(in days)',
        'Role'
      ];
    }
  }
}

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
  description: string;
}

interface Stats {
  contributorUserId: string;
  topicIds: string[];
  firstContribution: string;
  lastContributedIn: number;
}

interface TranslationSubmitterStats extends Stats {
  languageCode: string;
  recentPerformance: number;
  overallAccuracy: number;
  submittedTranslationsCount: number;
  submittedTranslationWordCount: number;
  acceptedTranslationsCount: number;
  acceptedTranslationsWithoutReviewerEditsCount: number;
  acceptedTranslationWordCount: number;
  rejectedTranslationsCount: number;
  rejectedTranslationWordCount: number;
}

interface TranslationReviewerStats extends Stats {
  languageCode: string;
  reviewedTranslationsCount: number;
  acceptedTranslationsCount: number;
  acceptedTranslationsWithReviewerEditsCount: number;
  acceptedTranslationWordCount: number;
  rejectedTranslationsCount: number;
}

interface QuestionSubmitterStats extends Stats {
  recentPerformance: number;
  overallAccuracy: number;
  submittedQuestionsCount: number;
  acceptedQuestionsCount: number;
  acceptedQuestionsWithoutReviewerEditsCount: number;
  rejectedQuestionsCount: number;
}

interface QuestionReviewerStats extends Stats {
  reviewedQuestionsCount: number;
  acceptedQuestionsCount: number;
  acceptedQuestionsWithReviewerEditsCount: number;
  rejectedQuestionsCount: number;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {
    position: 1,
    name: 'Hydrogen',
    weight: 1.0079,
    symbol: 'H',
    description: `Hydrogen is a chemical element with symbol H and atomic number 1. With a standard
        atomic weight of 1.008, hydrogen is the lightest element on the periodic table.`
  }, {
    position: 2,
    name: 'Helium',
    weight: 4.0026,
    symbol: 'He',
    description: `Helium is a chemical element with symbol He and atomic number 2. It is a
        colorless, odorless, tasteless, non-toxic, inert, monatomic gas, the first in the noble gas
        group in the periodic table. Its boiling point is the lowest among all the elements.`
  }, {
    position: 3,
    name: 'Lithium',
    weight: 6.941,
    symbol: 'Li',
    description: `Lithium is a chemical element with symbol Li and atomic number 3. It is a soft,
        silvery-white alkali metal. Under standard conditions, it is the lightest metal and the
        lightest solid element.`
  }, {
    position: 4,
    name: 'Beryllium',
    weight: 9.0122,
    symbol: 'Be',
    description: `Beryllium is a chemical element with symbol Be and atomic number 4. It is a
        relatively rare element in the universe, usually occurring as a product of the spallation of
        larger atomic nuclei that have collided with cosmic rays.`
  }, {
    position: 5,
    name: 'Boron',
    weight: 10.811,
    symbol: 'B',
    description: `Boron is a chemical element with symbol B and atomic number 5. Produced entirely
        by cosmic ray spallation and supernovae and not by stellar nucleosynthesis, it is a
        low-abundance element in the Solar system and in the Earth's crust.`
  }, {
    position: 6,
    name: 'Carbon',
    weight: 12.0107,
    symbol: 'C',
    description: `Carbon is a chemical element with symbol C and atomic number 6. It is nonmetallic
        and tetravalent—making four electrons available to form covalent chemical bonds. It belongs
        to group 14 of the periodic table.`
  }, {
    position: 7,
    name: 'Nitrogen',
    weight: 14.0067,
    symbol: 'N',
    description: `Nitrogen is a chemical element with symbol N and atomic number 7. It was first
        discovered and isolated by Scottish physician Daniel Rutherford in 1772.`
  }, {
    position: 8,
    name: 'Oxygen',
    weight: 15.9994,
    symbol: 'O',
    description: `Oxygen is a chemical element with symbol O and atomic number 8. It is a member of
         the chalcogen group on the periodic table, a highly reactive nonmetal, and an oxidizing
         agent that readily forms oxides with most elements as well as with other compounds.`
  }, {
    position: 9,
    name: 'Fluorine',
    weight: 18.9984,
    symbol: 'F',
    description: `Fluorine is a chemical element with symbol F and atomic number 9. It is the
        lightest halogen and exists as a highly toxic pale yellow diatomic gas at standard
        conditions.`
  }, {
    position: 10,
    name: 'Neon',
    weight: 20.1797,
    symbol: 'Ne',
    description: `Neon is a chemical element with symbol Ne and atomic number 10. It is a noble gas.
        Neon is a colorless, odorless, inert monatomic gas under standard conditions, with about
        two-thirds the density of air.`
  },
];


angular.module('oppia').directive('contributorAdminDashboardPage',
  downgradeComponent({
    component: TanslationSubmitterTable
  }) as angular.IDirectiveFactory);
