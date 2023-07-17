#!/bin/bash

node \
$([ "$prod_env" = "true" ] && echo "--max_old_space_size=8192") \
/app/oppia/node_modules/webpack/bin/webpack.js \
--config \
$([ "$prod_env" = "true" ] && [ "$source_maps" = "true" ] && echo "/app/oppia/webpack.prod.sourcemap.config.ts") \
$([ "$prod_env" = "true" ] && [ "$source_maps" != "true" ] && echo "/app/oppia/webpack.prod.config.ts") \
$([ "$prod_env" != "true" ] && [ "$source_maps" = "true" ] && echo "/app/oppia/webpack.dev.sourcemap.config.ts --watch --color --progress") \
$([ "$prod_env" != "true" ] && [ "$source_maps" != "true" ] && echo "/app/oppia/webpack.dev.config.ts --watch --color --progress")
