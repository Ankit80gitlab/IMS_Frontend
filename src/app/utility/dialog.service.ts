import {Injectable} from '@angular/core';
import {Subject} from "rxjs";
import {MatDialogRef} from "@angular/material/dialog";

@Injectable({
    providedIn: 'root'
})
export class DialogService {

    constructor() {
    }

    private dialogSubject = new Subject<any>();

    dataObservable$ = this.dialogSubject.asObservable();

    submit(data: any | undefined) {
        this.dialogSubject.next(data);
    }
}
