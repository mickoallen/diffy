#!/usr/bin/env bash
# Bash demo

GREETING="Hello"
ANIMALS=("Cat:meow" "Dog:woof")

greet() {
  local name="$1"
  echo "${GREETING}, ${name}!"
}

for entry in "${ANIMALS[@]}"; do
  name="${entry%%:*}"
  sound="${entry##*:}"
  echo "${name} says ${sound}"
done

greet "World"

if [[ -f "demo.txt" ]]; then
  echo "File exists"
else
  echo "File not found"
fi
