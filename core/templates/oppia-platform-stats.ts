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
 * @fileoverview Constants for the Oppia platform statistics used for the Bar charts on the About page
 */

export const OppiaPlatformStatsData = {
  OPPIA_WEB_RAW_BAR_CHART_DATA: [
    {
      country: 'I18N_ABOUT_PAGE_COUNTRY_USA',
      userCount: 2400.0,
      annotationText: 'I18N_ABOUT_PAGE_CHART_ANNOTATION_WEBSITE',
    },
    {country: 'I18N_ABOUT_PAGE_COUNTRY_INDIA', userCount: 1100.0},
    {country: 'I18N_ABOUT_PAGE_COUNTRY_UNITED_KINGDOM', userCount: 930.0},
    {country: 'I18N_ABOUT_PAGE_COUNTRY_BRAZIL', userCount: 650.0},
    {country: 'I18N_ABOUT_PAGE_COUNTRY_CANADA', userCount: 420.0},
    {country: 'I18N_ABOUT_PAGE_COUNTRY_NIGERIA', userCount: 250.0},
    {country: 'I18N_ABOUT_PAGE_COUNTRY_NETHERLANDS', userCount: 250.0},
    {country: 'I18N_ABOUT_PAGE_COUNTRY_EGYPT', userCount: 225.0},
    {country: 'I18N_ABOUT_PAGE_COUNTRY_TURKEY', userCount: 225.0},
    {country: 'I18N_ABOUT_PAGE_COUNTRY_BELGIUM', userCount: 200.0},
  ],
  OPPIA_ANDROID_RAW_BAR_CHART_DATA: [
    {
      country: 'I18N_ABOUT_PAGE_COUNTRY_BRAZIL',
      userCount: 3250.0,
      annotationText: 'I18N_ABOUT_PAGE_CHART_ANNOTATION_ANDROID',
    },
    {country: 'I18N_ABOUT_PAGE_COUNTRY_PAKISTAN', userCount: 1500.0},
    {country: 'I18N_ABOUT_PAGE_COUNTRY_ANGOLA', userCount: 1270.0},
    {country: 'I18N_ABOUT_PAGE_COUNTRY_KENYA', userCount: 870.0},
    {country: 'I18N_ABOUT_PAGE_COUNTRY_CAMEROON', userCount: 570.0},
    {country: 'I18N_ABOUT_PAGE_COUNTRY_MOZAMBIQUE', userCount: 320.0},
    {country: 'I18N_ABOUT_PAGE_COUNTRY_INDIA', userCount: 320.0},
    {country: 'I18N_ABOUT_PAGE_COUNTRY_NIGERIA', userCount: 300.0},
    {country: 'I18N_ABOUT_PAGE_COUNTRY_INDONESIA', userCount: 300.0},
    {country: 'I18N_ABOUT_PAGE_COUNTRY_TANZANIA', userCount: 260.0},
  ],
  OPPIA_WEB_BAR_CHART_TICKS: [
    {
      value: '0',
      width: '21%',
    },
    {
      value: '.5K',
      width: '21%',
    },
    {
      value: '1K',
      width: '21%',
    },
    {
      value: '1.5K',
      width: '21%',
    },
    {
      value: '2K',
      width: '21%',
    },
  ],
  OPPIA_ANDROID_BAR_CHART_TICKS: [
    {
      value: '0',
      width: '30.7%',
    },
    {
      value: '1K',
      width: '30.7%',
    },
    {
      value: '2K',
      width: '30.7%',
    },
    {
      value: '3K',
      width: '8%',
    },
  ],
  OPPIA_PARTNERS_DATA: [
    {
      title: 'I18N_ABOUT_PAGE_PARTNER1_TITLE',
      name: 'I18N_ABOUT_PAGE_PARTNER1_NAME',
      description: 'I18N_ABOUT_PAGE_PARTNER1_DESCRIPTION',
      label: 'I18N_ABOUT_PAGE_PARTNERS_LABEL1',
      imageUrl: '/about/partners/partner1-',
    },
    {
      title: 'I18N_ABOUT_PAGE_PARTNER2_TITLE',
      name: 'I18N_ABOUT_PAGE_PARTNER2_NAME',
      description: 'I18N_ABOUT_PAGE_PARTNER2_DESCRIPTION',
      label: 'I18N_ABOUT_PAGE_PARTNERS_LABEL1',
      imageUrl: '/about/partners/partner2-',
    },
    {
      title: 'I18N_ABOUT_PAGE_PARTNER3_TITLE',
      name: 'I18N_ABOUT_PAGE_PARTNER3_NAME',
      description: 'I18N_ABOUT_PAGE_PARTNER3_DESCRIPTION',
      label: 'I18N_ABOUT_PAGE_PARTNERS_LABEL1',
      imageUrl: '/about/partners/partner3-',
    },
    {
      title: 'I18N_ABOUT_PAGE_PARTNER4_TITLE',
      name: 'I18N_ABOUT_PAGE_PARTNER4_NAME',
      description: 'I18N_ABOUT_PAGE_PARTNER4_DESCRIPTION',
      label: 'I18N_ABOUT_PAGE_PARTNERS_LABEL2',
      imageUrl: '/about/partners/partner4-',
    },
  ],
} as const;
