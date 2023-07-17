#!/bin/bash

trap "rm /app/oppia/node_modules/@angular/compiler-cli/ngcc/__ngcc_lock_file__" EXIT
npx ng build \
$([ "$prod_env" = "true" ] && echo "--prod" || echo "--watch")
