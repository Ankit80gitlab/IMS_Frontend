import { NgModule } from '@angular/core';
import { AppComponent } from 'app/app.component';
import { TicketDetailComponent } from 'app/routes/ticket-detail/ticket-detail.component';

@NgModule({
  declarations: [
    TicketDetailComponent
  ],
  imports: [
    // Other modules here
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class DocViewerModule2 { }
