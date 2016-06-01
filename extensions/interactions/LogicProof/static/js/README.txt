The code is contained in the following files:
 - generatedParser.js: this is a parser automatically generated using PEG.js,
 that is responsible for parsing logical expressions. To change it, make updates
 to static/js/tools/input_to_PEG.txt and then paste the contents of this file
 into http://pegjs.majda.cz/online. Call the parser variable 'logicProofParser'
 and check "use results cache". Then download the code and paste it into the
 generatedParser.js file.
 - shared.js: this contains code used by both the teacher and student parts of
 the website. The most important functions are parseLine() and
 assignTypesToExpression().
 - teacher.js: this contains various functions that will take strings from the
 teacher and use them to build the customization_args for the interaction in
 question. The four top-level functions are buildQuestion(),
 buildLineTemplateTable(), buildMistakeSection() and
 buildControlFunctionTable().
 - student.js: this has three top-level functions, buildInstance(), buildProof()
 and checkProof(). The first takes the data from the YAML file for this state
 (together with LOGIC_PROOF_DEFAULT_QUESTION_DATA) and builds a questionData
 object representing this instance of the LogicProof interaction. The second
 takes a string written by the student and converts it into a Proof object (or
 reports an error the student has made) and the third checks the proof to see
 whether the student has made any mistakes.
  - conversion.js. Used to convert symbols into unicode logic symbols as users
 type.

In order to update generatedDefaultData.js:
1. Make the desired changes in tools/strings.js.
2. Open tools/demonstration.html and check everything has succeeded.
3. Click "Request javascript" at the bottom of the page.
4. Paste the result into generatedDefaultData.js.
5. Run karma tests.

 More information about the program flow, together with specifications for all the
 objects used, can be found at
 https://docs.google.com/document/d/1go1RdOS2IW1A9f9_dyTKuWPVzWZS5lb43TZCn5KY3Tc/edit?usp=sharing

 Useful unicode codes:
  - ∧ (and) \u2227
  - ∨ (or) \u2228
  - ∀ (for all) \u2200
  - ∃ (exists) \u2203
  - ∈ (membership) \u2208
Note that ^ is currently being automatically converted into ∧; this will have to stop if ^ starts being used for actual exponentiation.

The LogicProof interaction adds the following objects to the global javascript
namespace, which should not be overwritten:
 - logicProofParser
 - logicProofShared
 - logicProofStudent
 - logicProofData
 - logicProofConversion
 - LOGIC_PROOF_DEFAULT_QUESTION_DATA
