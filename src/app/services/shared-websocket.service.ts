import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SharedWebSocketService {

    private dataSubject = new BehaviorSubject<any>(null);
    currentData = this.dataSubject.asObservable();
    changeData(newData: any) {
        console.log(newData);
        this.dataSubject.next(null);
        this.dataSubject.next(newData);
    }
    makeNull(){
        this.dataSubject.next(null);
    }
}