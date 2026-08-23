declare module 'angular-shepherd' {
  export class ShepherdService {
    confirmCancel: boolean;
    confirmCancelMessage: string;
    defaultStepOptions: object;
    errorTitle: any;
    isActive: boolean;
    messageForUser: string;
    modal: boolean;
    requiredElements: any[];
    steps: any[];
    tourName: any;
    tourObject: {
      on: (eventName: string, cb: () => void) => void;
      start: () => void;
      complete: () => void;
      cancel: () => void;
    } | null;
    back(): void;
    cancel(): void;
    complete(): void;
    hide(): void;
    next(): void;
    show(id: any): void;
    start(): void;
    onTourFinish(completeOrCancel: string): void;
    addSteps(steps: Array<any>): void;
  }
}
