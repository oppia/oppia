import { downgradeInjectable } from "@angular/upgrade/static";
import { Injectable } from "@angular/core";

import parser from "expressions/parser";

@Injectable({
  providedIn: "root"
})
export class ExpressionParserService {
  parse = parser.parse;
  SyntaxError = parser.SyntaxError;
}

angular.module("oppia").factory(
  "ServiceName", downgradeInjectable(ExpressionParserService)
);
