OBJECTS=$(wildcard lib/*.js)

all: dist/math-expressions.js

clean:
	rm -f dist/math-expressions.js

dist/math-expressions.js: $(OBJECTS)
	mkdir -p dist
	node ./node_modules/amdee/bin/amdee --source lib/math-expressions.js --target dist/math-expressions.js
	sed -i "s/define(\['require'\], function(require) {/var MathExpressions = (function() {/g" dist/math-expressions.js
