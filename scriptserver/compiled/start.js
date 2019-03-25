#!/usr/bin/env node

let cp = require('child_process');

let proc = cp.spawn('node', ['index.js'], { detached: true });

console.log(proc.pid, 'spawned');
