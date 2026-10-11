#!/bin/zsh
set -euo pipefail

cd "${0:A:h}"
swiftc -framework Cocoa DeskSketch.swift -o DeskSketch
./DeskSketch
