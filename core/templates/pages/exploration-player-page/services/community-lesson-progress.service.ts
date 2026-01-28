import {Injectable} from '@angular/core';
import {Subject, Observable} from 'rxjs';

export interface CommunityLessonProgressEvent {
  lessonId: string;
  checkpoint: number;
}

@Injectable({
  providedIn: 'root',
})
export class CommunityLessonProgressService {
  private progressSubject = new Subject<CommunityLessonProgressEvent>();
  private lastEvent: CommunityLessonProgressEvent | null = null;

  get progressUpdates$(): Observable<CommunityLessonProgressEvent> {
    return this.progressSubject.asObservable();
  }

  emitProgressUpdate(event: CommunityLessonProgressEvent): void {
    if (
      !this.lastEvent ||
      this.lastEvent.lessonId !== event.lessonId ||
      this.lastEvent.checkpoint !== event.checkpoint
    ) {
      this.lastEvent = event;
      this.progressSubject.next(event);
    }
  }

  reset(): void {
    this.lastEvent = null;
  }
}
