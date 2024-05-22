import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-create-area-confirm-dialog',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatFormField,
    MatInput,
    FormsModule,
    MatDialogActions,
    MatButton,
    MatDialogClose,
  ],
  templateUrl: './create-area-confirm-dialog.component.html',
  styleUrl: './create-area-confirm-dialog.component.css'
})
export class CreateAreaConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CreateAreaConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
