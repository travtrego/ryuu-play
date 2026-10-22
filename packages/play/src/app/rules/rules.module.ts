import { NgModule } from '@angular/core';

import { RulesComponent } from './rules.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    RulesComponent
  ],
  imports: [
    SharedModule
  ]
})
export class RulesModule { }
