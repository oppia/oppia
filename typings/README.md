This folder contains custom type definitions for Typescript.

## Adding type-defs for third party libraries present in third-party-defs.d.ts

- ### Find the source code of the third party library
	For adding type definitions for a js library, the first step is to find the source code of the library.
	Try to find the file that imports the js script of the library. For example -PencilCodeEmbed is imported by the ([extensions/interactions/pencilcode.html](https://github.com/oppia/oppia/blob/develop/extensions/interactions/pencilcode.html)) file.

- ### Create a file for the type definitions
	Create a file which will contain the type definitions in typings directory with name library-name-defs.d.ts.

- ### Write the type definitions
	For writing custom definitions, existing type definitions in [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) and [this guide](http://blog.wolksoftware.com/contributing-to-definitelytyped) can be used as a reference.

- ### Testing the definitions
	The type checks run with the typescript tests. So you can run the
	```bash
	python -m scripts.typescript_checks
	```
	command to see if the definitions you wrote are correct.

- ### Updating the version of the library
	- Look for the difference in the code of the library compared to the present version.
	- Update the type definitions accordingly if the arguments, return types are modified or some new functions or variables are defined.

Refer [this doc](https://docs.google.com/document/d/19V1d46DSRgTC9K2StZAcgUABpaRjzSzYaEVZIRo_Mlk/edit?usp=sharing) for more instructions.
