#!/bin/bash
input="/home/darksun27/opensource/oppia/assets/images/pngImages.txt"
while IFS= read -r line
do
	echo "$line[0]"
done < "$input"
