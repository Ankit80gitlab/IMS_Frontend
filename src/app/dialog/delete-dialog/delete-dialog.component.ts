import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-dialog',
  standalone: true,
  imports: [MatDialogModule,MatButtonModule ],
  template: `
   <h2 class="confirmation-dialog-title" mat-dialog-title>Delete Confirmation</h2>
   <div class="confirmation-dialog-content" mat-dialog-content>
     Are you sure you want to delete {{ data.name }}?
   </div>
   <div class="confirmation-dialog-actions text-center" mat-dialog-actions>
     <button mat-button [mat-dialog-close]="false" class="confirmation-dialog-buttons">Cancel</button>
     <button mat-button [mat-dialog-close]="true" cdkFocusInitial class="confirmation-dialog-buttons">Delete</button>
   </div>
`,
  styleUrl: './delete-dialog.component.css'
})
export class DeleteDialogComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
   }

  ngOnInit(): void {
  }

}
