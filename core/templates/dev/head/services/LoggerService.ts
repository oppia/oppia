import { ErrorHandler, Injectable } from '@angular/core';
import {downgradeInjectable} from '@angular/upgrade/static';

@Injectable()
export class LoggerService {
  constructor(private errorHandler: ErrorHandler) {}

  log(value: any, ...rest: any[]): void {
    console.log(value, ...rest);
  }

  error(error: string): void {
    this.errorHandler.handleError(error);
  }

  warn(value: any, ...rest: any[]): void {
    console.warn(value, ...rest);
  }
}

angular.module('oppia').factory(
  'LoggerService',
  downgradeInjectable(LoggerService));

