import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {ToastrModule} from 'ngx-toastr';
import {SharedComponentsModule} from 'components/shared-component.module';
import {toastrConfig} from 'pages/oppia-root/app.module';

import {CreatorStatsPageRootComponent} from './creator-stats-page-root.component';
import {CreatorStatsPageComponent} from './creator-stats-page.component';

@NgModule({
  imports: [
    SharedComponentsModule,
    FormsModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: CreatorStatsPageRootComponent,
      },
    ]),
  ],
  declarations: [CreatorStatsPageRootComponent, CreatorStatsPageComponent],
  entryComponents: [CreatorStatsPageComponent],
})
export class CreatorStatsPageModule {}
