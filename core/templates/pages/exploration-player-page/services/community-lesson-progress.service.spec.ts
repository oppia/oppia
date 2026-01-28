import {TestBed} from '@angular/core/testing';
import {
  CommunityLessonProgressService,
  CommunityLessonProgressEvent,
} from './community-lesson-progress.service';

describe('CommunityLessonProgressService', () => {
  let service: CommunityLessonProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommunityLessonProgressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit progress updates', done => {
    const event: CommunityLessonProgressEvent = {
      lessonId: 'lesson1',
      checkpoint: 1,
    };
    service.progressUpdates$.subscribe(e => {
      expect(e).toEqual(event);
      done();
    });
    service.emitProgressUpdate(event);
  });

  it('should not emit duplicate progress events', () => {
    const event: CommunityLessonProgressEvent = {
      lessonId: 'lesson1',
      checkpoint: 1,
    };
    let emitCount = 0;
    service.progressUpdates$.subscribe(() => emitCount++);
    service.emitProgressUpdate(event);
    service.emitProgressUpdate(event);
    expect(emitCount).toBe(1);
  });

  it('should emit new event if checkpoint changes', () => {
    const event1: CommunityLessonProgressEvent = {
      lessonId: 'lesson1',
      checkpoint: 1,
    };
    const event2: CommunityLessonProgressEvent = {
      lessonId: 'lesson1',
      checkpoint: 2,
    };
    const received: CommunityLessonProgressEvent[] = [];
    service.progressUpdates$.subscribe(e => received.push(e));
    service.emitProgressUpdate(event1);
    service.emitProgressUpdate(event2);
    expect(received.length).toBe(2);
    expect(received[1]).toEqual(event2);
  });

  it('should reset last event', () => {
    const event: CommunityLessonProgressEvent = {
      lessonId: 'lesson1',
      checkpoint: 1,
    };
    let emitCount = 0;
    service.progressUpdates$.subscribe(() => emitCount++);
    service.emitProgressUpdate(event);
    service.reset();
    service.emitProgressUpdate(event);
    expect(emitCount).toBe(2);
  });
});
