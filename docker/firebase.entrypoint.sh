#!/bin/bash

/app/oppia/node_modules/firebase-tools/lib/bin/firebase.js \
emulators:start \
--only auth \
--project=dev-project-id \
--config=/app/oppia/.firebase.json \
$([ "$save_datastore" = "true" ] && echo "--import=/app/firebase_emulator_cache") \
--export-on-exit=/app/firebase_emulator_cache
