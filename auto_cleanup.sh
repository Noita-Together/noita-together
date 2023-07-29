#!/bin/bash

# Set the path to the target folder
target_folder="/root/noita-together/nt-web-app/public/generated/"

# Get the current timestamp in seconds
current_time=$(date +%s)

# Calculate the timestamp of 1 hour ago (3600 seconds)
one_hour_ago=$((current_time - 3600))

# Check if the target folder exists
if [ ! -d "$target_folder" ]; then
    echo "Error: The target folder does not exist."
    exit 1
fi

# Loop through the files in the target folder
for file in "$target_folder"/*; do
    # Check if the file is a regular file
    if [ -f "$file" ]; then
        # Get the last modification time of the file in seconds since the epoch
        last_modified=$(stat -c %Y "$file")

        # Compare the last modification time with one hour ago
        if [ "$last_modified" -lt "$one_hour_ago" ]; then
            # Remove the file
            rm "$file"
            echo "Removed: $file"
        fi
    fi
done

echo "Cleanup completed."