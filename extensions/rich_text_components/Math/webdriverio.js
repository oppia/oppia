// Copyright 2022 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for using the Math component during
 * end-to-end testing with WebdriverIO.js
 */

var objects = require(process.cwd() + '/extensions/objects/webdriverio.js');
var waitFor = require(
  process.cwd() + '/core/tests/webdriverio_utils/waitFor.js');
var request = require('request');

var customizeComponent = async function(modal, rawLatex) {
  await (objects.MathExpressionContentEditor(
    modal.$('<math-expression-content-editor>')
  ).setValue(rawLatex));
};

// This function is used to convert the escaped Json to unescaped object.
// This is required because the customizationArg value which we get initially
// from the Math rich text component is in escaped format and we need to
// convert it to unescaped format.
var escapedJsonToObj = function(json) {
  return (JSON.parse((
    json.toString())
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')));
};
const SVGTAGS = {
  'x^2 + y^2': (
    '<svg xmlns="http://www.w3.org/2000/svg" width="7.485ex" height="2.85ex" ' +
    'viewBox="0 -919.2 3222.8 1226.9" focusable="false" style="vertical-align' +
    ': -0.715ex;"><g stroke="currentColor" fill="currentColor" stroke-widt' +
    'h="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-width="10" d="M52 2' +
    '89Q59 331 106 386T222 442Q257 442 286 424T329 379Q371 442 430 442Q467 4' +
    '42 494 420T522 361Q522 332 508 314T481 292T458 288Q439 288 427 299T415' +
    ' 328Q415 374 465 391Q454 404 425 404Q412 404 406 402Q368 386 350 336Q29' +
    '0 115 290 78Q290 50 306 38T341 26Q378 26 414 59T463 140Q466 150 469 151' +
    'T485 153H489Q504 153 504 145Q504 144 502 134Q486 77 440 33T333 -11Q263 ' +
    '-11 227 52Q186 -10 133 -10H127Q78 -10 57 16T35 71Q35 103 54 123T99 143Q' +
    '142 143 142 101Q142 81 130 66T107 46T94 41L91 40Q91 39 97 36T113 29T132' +
    ' 26Q168 26 194 71Q203 87 217 139T245 247T261 313Q266 340 266 352Q266 38' +
    '0 251 392T217 404Q177 404 142 372T93 290Q91 281 88 280T72 278H58Q52 284' +
    ' 52 289Z"/><g transform="translate(577,362)"><path stroke-width="10" tr' +
    'ansform="scale(0.707)" d="M109 429Q82 429 66 447T50 491Q50 562 103 614T' +
    '235 666Q326 666 387 610T449 465Q449 422 429 383T381 315T301 241Q265 210' +
    ' 201 149L142 93L218 92Q375 92 385 97Q392 99 409 186V189H449V186Q448 183' +
    ' 436 95T421 3V0H50V19V31Q50 38 56 46T86 81Q115 113 136 137Q145 147 170 ' +
    '174T204 211T233 244T261 278T284 308T305 340T320 369T333 401T340 431T343' +
    ' 464Q343 527 309 573T212 619Q179 619 154 602T119 569T109 550Q109 549 11' +
    '4 549Q132 549 151 535T170 489Q170 464 154 447T109 429Z"/></g><g transfor' +
    'm="translate(1256,0)"><path stroke-width="10" d="M56 237T56 250T70 270H3' +
    '69V420L370 570Q380 583 389 583Q402 583 409 568V270H707Q722 262 722 250T7' +
    '07 230H409V-68Q401 -82 391 -82H389H387Q375 -82 369 -68V230H70Q56 237 56 ' +
    '250Z"/></g><g transform="translate(2261,0)"><path stroke-width="10" d="M' +
    '21 287Q21 301 36 335T84 406T158 442Q199 442 224 419T250 355Q248 336 247' +
    ' 334Q247 331 231 288T198 191T182 105Q182 62 196 45T238 27Q261 27 281 38T' +
    '312 61T339 94Q339 95 344 114T358 173T377 247Q415 397 419 404Q43' +
    '2 431 462 431Q475 431 483 424T494 412T496 403Q496 390 447 193T391 -23Q36' +
    '3 -106 294 -155T156 -205Q111 -205 77 -183T43 -117Q43 -95 50 -80T69 -58T8' +
    '9 -48T106 -45Q150 -45 150 -87Q150 -107 138 -122T115 -142T102 -147L99 -14' +
    '8Q101 -153 118 -160T152 -167H160Q177 -167 186 -165Q219 -156 247 -127T290' +
    ' -65T313 -9T321 21L315 17Q309 13 296 6T270 -6Q250 -11 231 -11Q185 -11 15' +
    '0 11T104 82Q103 89 103 113Q103 170 138 262T173 379Q173 380 173 381Q173 3' +
    '90 173 393T169 400T158 404H154Q131 404 112 385T82 344T65 302T57 280Q55 2' +
    '78 41 278H27Q21 284 21 287Z"/><g transform="translate(504,362)"><path st' +
    'roke-width="10" transform="scale(0.707)" d="M109 429Q82 429 66 447T50 49' +
    '1Q50 562 103 614T235 666Q326 666 387 610T449 465Q449 422 429 383T381 315' +
    'T301 241Q265 210 201 149L142 93L218 92Q375 92 385 97Q392 99 409 186V189H' +
    '449V186Q448 183 436 95T421 3V0H50V19V31Q50 38 56 46T86 81Q115 113 136 13' +
    '7Q145 147 170 174T204 211T233 244T261 278T284 308T305 340T320 369T333 40' +
    '1T340 431T343 464Q343 527 309 573T212 619Q179 619 154 602T119 569T109 55' +
    '0Q109 549 114 549Q132 549 151 535T170 489Q170 464 154 447T109 429Z"/></g' +
    '></g></g></svg>')
};

var expectComponentDetailsToMatch = async function(elem, rawLatex) {
  // TODO(Jacob): Check that the actual latex being displayed is correct.
  var mathComponent = await elem.getAttribute('math_content-with-value');
  expect(escapedJsonToObj(mathComponent).raw_latex).toBe(rawLatex);
  var mathSvgImage = elem.$('.e2e-test-math-svg');
  await waitFor.visibilityOf(
    mathSvgImage,
    'Math SVG takes too long to load.');
  var src = await mathSvgImage.getAttribute('src');
  var pre = 'http://localhost:8181';
  var link = pre + src;
  await request(link, function(error, response, body) {
    expect(body).toBe(SVGTAGS[rawLatex]);
  });
};

exports.customizeComponent = customizeComponent;
exports.expectComponentDetailsToMatch = expectComponentDetailsToMatch;
