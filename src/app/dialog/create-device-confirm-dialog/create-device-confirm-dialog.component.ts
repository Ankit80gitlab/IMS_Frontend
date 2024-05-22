import { Component } from '@angular/core';
import { Inject } from '@angular/core';
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
  selector: 'app-create-device-confirm-dialog',
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
  templateUrl: './create-device-confirm-dialog.component.html',
  styleUrl: './create-device-confirm-dialog.component.css'
})
export class CreateDeviceConfirmDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<CreateDeviceConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
