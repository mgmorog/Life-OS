#!/usr/bin/env python3
"""Builds the claude.ai page. The real build is build.mjs (Node); this keeps old commands working."""
import subprocess, sys, os
r = subprocess.run(['node', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build.mjs'), '--target', 'artifact'], capture_output=True, text=True)
sys.stdout.write(r.stdout); sys.stderr.write(r.stderr); sys.exit(r.returncode)
