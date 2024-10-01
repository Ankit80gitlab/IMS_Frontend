import { AsyncPipe, NgFor, NgForOf, NgIf } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatError, MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MtxDialogData } from '@ng-matero/extensions/dialog';
import { MtxSelect } from '@ng-matero/extensions/select';
import { DialogService } from 'app/utility/dialog.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-ticket-incident-type',
  standalone: true,
  imports: [
    MatDialogContent,
    MatDialogTitle,
    MatDivider,
    MatFormField,
    MatInput,
    MatLabel,
    MtxSelect,
    MatError,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatDialogActions,
    MatButtonModule,
    MatDialogClose,
    NgIf,
    AsyncPipe,
    MatIconModule,
    NgFor
  ],
  templateUrl: './ticket-incident-type.component.html',
  styleUrl: './ticket-incident-type.component.css'
})
export class TicketIncidentTypeComponent {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastrService);

  incidentTypeForm!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<TicketIncidentTypeComponent>,
    @Inject(MAT_DIALOG_DATA) private data: MtxDialogData,
    private dialogService: DialogService, private formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    this.incidentTypeForm = new FormGroup({
      type: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required),
    });
  }

  onCloseClick(formGroupDirective: FormGroupDirective): void {
    this.incidentTypeForm.reset();
    formGroupDirective.reset();
    this.dialogService.submit(undefined);
    this.dialogRef.close();
    this.dialogService.submit({ click: "close"});
  };


  onSaveClick(): void {
    const data = this.incidentTypeForm.value;
    this.dialogService.submit({ click: "save", data: data });
  }

}
