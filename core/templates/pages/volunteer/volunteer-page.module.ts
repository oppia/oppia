import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VolunteerPageComponent } from './volunteer-page.component';

const routes: Routes = [
  { path: 'volunteer', component: VolunteerPageComponent }
];

@NgModule({
  declarations: [VolunteerPageComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class VolunteerPageModule {}
