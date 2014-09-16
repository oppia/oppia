// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for playing through an exploration and checking its
 * contents when carrying out end-to-end testing with protractor.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var getCurrentQuestionText = function() {
  return element(by.css('.conversation-skin-response')).getText();
};

var answerContinueWidget = function() {
  element(by.tagName('oppia-interactive-continue')).click();
};

var answerNumericWidget = function(answer) {
  element(by.tagName('oppia-interactive-numeric-input')).
    element(by.tagName('input')).sendKeys(answer + '\n');
};

var answerMultipleChoiceWidget = function(answerText) {
  element(by.tagName('oppia-interactive-multiple-choice-input')).
    element(by.buttonText(answerText)).click();
};

var expectExplorationToBeOver = function() {
  expect(element.all(by.css('.conversation-skin-response-finished')).count()).
    toBe(1);
}

exports.getCurrentQuestionText = getCurrentQuestionText;
exports.answerContinueWidget = answerContinueWidget;
exports.answerNumericWidget = answerNumericWidget;
exports.answerMultipleChoiceWidget = answerMultipleChoiceWidget;
exports.expectExplorationToBeOver = expectExplorationToBeOver;