// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the InteractiveMap response.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the component is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

// Relative path used as an work around to get the angular compiler and webpack
// build to not complain.
// TODO(#16309): Fix relative imports.
import '../../../../core/templates/third-party-imports/leaflet.import';

import {Component, Input, OnInit} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {icon, latLng, MapOptions, Marker, marker, tileLayer} from 'leaflet';

@Component({
  selector: 'oppia-response-interactive-map',
  templateUrl: './interactive-map-response.component.html',
})
export class ResponseInteractiveMapComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() answer!: string;
  mapOptions!: MapOptions;
  mapMarkers!: Marker;
  private _attribution =
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  private _optionsUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  optionsSpec = {
    layers: [{url: this._optionsUrl, attribution: this._attribution}],
    zoom: 0,
  };

  constructor(
    private htmlEscaperService: HtmlEscaperService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  private changeMarkerPosition(lat: number, lng: number) {
    const newMarker = marker([lat, lng], {
      icon: icon({
        iconUrl: this.urlInterpolationService.getExtensionResourceUrl(
          '/interactions/InteractiveMap/static/marker-icon.png'
        ),
        // The size of the icon image in pixels.
        iconSize: [25, 41],
        // The coordinates of the "tip" of the icon.
        iconAnchor: [12, 41],
        shadowUrl: this.urlInterpolationService.getExtensionResourceUrl(
          '/interactions/InteractiveMap/static/marker-shadow.png'
        ),
        // The size of the shadow image in pixels.
        shadowSize: [41, 41],
        // The coordinates of the "tip" of the shadow.
        shadowAnchor: [13, 41],
        // The URL to a retina sized version of the icon image.
        // Used for Retina screen devices.
        iconRetinaUrl: this.urlInterpolationService.getExtensionResourceUrl(
          '/interactions/InteractiveMap/static/marker-icon-2x.png'
        ),
        shadowRetinaUrl: this.urlInterpolationService.getExtensionResourceUrl(
          '/interactions/InteractiveMap/static/marker-shadow.png'
        ),
      }),
    });
    this.mapMarkers = newMarker;
  }

  ngOnInit(): void {
    const answer = this.htmlEscaperService.escapedJsonToObj(
      this.answer
    ) as number[];
    this.mapOptions = {
      layers: [
        tileLayer(this.optionsSpec.layers[0].url, {
          attribution: this.optionsSpec.layers[0].attribution,
        }),
      ],
      zoom: 8,
      center: latLng([answer[0], answer[1]]),
    };
    this.changeMarkerPosition(answer[0], answer[1]);
  }
}
