import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { TicketManagementService } from 'app/services/ticket-management.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-ticket-attachment',
  standalone: true,
  imports: [
    MatCardModule,
    NgIf
  ],
  templateUrl: './ticket-attachment.component.html',
  styleUrl: './ticket-attachment.component.css'
})
export class TicketAttachmentComponent {

  private ticketServ = inject(TicketManagementService);

  id: any;
  fileUrl: string | null = null;
  fileType: string | null = null;
  fileName: string | null = null;
  safeFileUrl: any;

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) { }

  ngOnInit() {
    if (this.route.snapshot.url.length == 2) {
      if (this.route.snapshot.url[0].path === "attachments") {
        this.route.paramMap.subscribe(params => {
          this.id = params?.get('id');
        });
        if (this.id != null || this.id != undefined) {
          this.viewFile(this.id);
        }
      }
    }
  }

  viewFile(fileId: number) {
    this.ticketServ.viewTicketFile(fileId).subscribe(blob => {
      const file = new Blob([blob], { type: blob.type });
      this.fileUrl = URL.createObjectURL(file);
      this.safeFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.fileUrl);
      this.fileType = blob.type;
      this.fileName = this.extractFileNameFromResponse(blob);
    });
  }

  private extractFileNameFromResponse(blob: Blob): string {
    return 'downloaded-file';
  }
}
