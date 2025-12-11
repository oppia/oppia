import {Component} from '@angular/core';
import {AppConstants} from 'app.constants';
import {BaseRootComponent, MetaTagData} from 'pages/base-root.component';

@Component({
  selector: 'oppia-creator-stats-page-root',
  templateUrl: './creator-stats-page-root.component.html',
})
export class CreatorStatsPageRootComponent extends BaseRootComponent {
  title: string =
    AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CREATOR_STATS.TITLE;

  meta: MetaTagData[] = AppConstants.PAGES_REGISTERED_WITH_FRONTEND
    .CREATOR_STATS.META as unknown as Readonly<MetaTagData>[];
}
