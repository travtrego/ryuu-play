import { NgModule } from '@angular/core';

import { PrimersComponent } from './primers.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    PrimersComponent
  ],
  imports: [
    SharedModule
  ]
})
export class PrimersModule { }
