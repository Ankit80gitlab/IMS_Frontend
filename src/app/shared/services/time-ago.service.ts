import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class TimeAgoService {
    calculateTimeAgo(timeStamp: string): string {
        const now = new Date();
        const past = new Date(timeStamp);
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

        const secondsInMinute = 60;
        const secondsInHour = 60 * 60;
        const secondsInDay = 60 * 60 * 24;
        const secondsInMonth = 60 * 60 * 24 * 30; // Approximate

        if (diffInSeconds < secondsInMinute) {
            return `${diffInSeconds} seconds ago`;
        } else if (diffInSeconds < secondsInHour) {
            return `${Math.floor(diffInSeconds / secondsInMinute)} minutes ago`;
        } else if (diffInSeconds < secondsInDay) {
            return `${Math.floor(diffInSeconds / secondsInHour)} hours ago`;
        } else if (diffInSeconds < secondsInMonth) {
            return `${Math.floor(diffInSeconds / secondsInDay)} days ago`;
        } else {
            return `${Math.floor(diffInSeconds / secondsInMonth)} months ago`;
        }
    }
}
