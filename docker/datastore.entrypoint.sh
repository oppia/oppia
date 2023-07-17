#!/bin/bash

/google-cloud-sdk/bin/gcloud beta \
emulators datastore start \
--project=dev-project-id \
--data-dir=/app/cloud_datastore_emulator_cache \
--host-port=0.0.0.0:8089 \
--consistency=1.0 \
--quiet \
$([ "$save_datastore" != "true" ] && echo "--no-store-on-disk")
