import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UiComponent } from './ui/ui.component';
import { OeiControlsModule } from './ui/controls/oei-controls.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavBarComponent } from './ui/nav-bar/nav-bar.component';
import { ViewDcvComponent } from './ui/views/view-dcv/view-dcv.component';
import { ViewSepComponent } from './ui/views/view-sep/view-sep.component';
import { ViewCefComponent } from './ui/views/view-cef/view-cef.component';
import { ViewZstComponent } from './ui/views/view-zst/view-zst.component';
import { ViewMenuComponent } from './ui/views/view-menu/view-menu.component';
import { EngineComponent } from './engine/engine.component';
import { DcvControlFactorsComponent, SepControlFactorsComponent } from './ui/views/control-factors/control-factors.component';
import { ExerciseDialogComponent } from './ui/views/exercise-dialog/exercise-dialog.component';
import { SvgViewComponent } from './ui/views/exercise-dialog/svg-view/svg-view.component';

@NgModule({
  declarations: [
    AppComponent,
    UiComponent,
    NavBarComponent,
    ViewDcvComponent,
    ViewSepComponent,
    ViewCefComponent,
    ViewZstComponent,
    ViewMenuComponent,
    EngineComponent,
    DcvControlFactorsComponent,
    SepControlFactorsComponent,
    ExerciseDialogComponent,
    SvgViewComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    OeiControlsModule,
    BrowserAnimationsModule,
    HttpClientModule
  ],
  entryComponents: [
    ExerciseDialogComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
