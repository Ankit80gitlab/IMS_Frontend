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

@Component({
  selector: 'app-product-incident-type',
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
  templateUrl: './product-incident-type.component.html',
  styleUrl: './product-incident-type.component.css'
})
export class ProductIncidentTypeComponent {
  private readonly fb = inject(FormBuilder);
  incidentTypeForm!: FormGroup;
  items!: FormArray;


  constructor(
    public dialogRef: MatDialogRef<ProductIncidentTypeComponent>,
    @Inject(MAT_DIALOG_DATA) private data: MtxDialogData,
    private dialogService: DialogService, private formBuilder: FormBuilder
  ) { }


  icType: any = [];

  ngOnInit() {
    this.icType = this.data;
    if (this.icType.length == 0) {
      this.incidentTypeForm = new FormGroup({
        items: new FormArray([])
      });
      this.addItem();
    }
    else {
      this.incidentTypeForm = new FormGroup({
        items: new FormArray([])
      });
      for (let i of this.icType) {
        this.items = this.incidentTypeForm.get('items') as FormArray;
        let form = this.formBuilder.group({
          id: new FormControl(i.id),
          type: new FormControl(i.type, Validators.required),
          description: new FormControl(i.description, Validators.required),
        });
        this.items.push(form);
      }
    }
  }


  createItem(): FormGroup {
    return this.formBuilder.group({
      id: new FormControl(''),
      type: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required),
    });
  }

  addItem(): void {
    this.items = this.incidentTypeForm.get('items') as FormArray;
    this.items.push(this.createItem());
  }

  removeGroup(i: number) {
    this.items.removeAt(i);
  }

  onCloseClick(formGroupDirective: FormGroupDirective): void {
    this.incidentTypeForm.reset();
    formGroupDirective.reset();
    this.dialogService.submit(undefined);
    this.dialogRef.close();
  };

  onSaveClick(): void {
    if (this.incidentTypeForm.valid) {
      const data = this.incidentTypeForm.value;
      //data.customerName = this.selectedCustomerName;
      this.dialogService.submit({ click: "save", data: data });
    }
  };

}
