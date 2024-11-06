const fs = require('fs');

// Create a readable stream with a highWaterMark
const readableStream = fs.createReadStream('input.txt', { highWaterMark: 64 * 1024 }); // 64 KB

// Create a writable stream
const writableStream = fs.createWriteStream('outputBackpressureFile.txt', { highWaterMark: 16 * 1024 }); // 16 KB

readableStream.on('data', (chunk) => {
  console.log(`Read ${chunk.length} bytes`);
  
  // If writable stream's buffer is full, pause readable stream
  if (!writableStream.write(chunk)) {
    console.log('Writable stream is full, pausing readable stream');
    readableStream.pause();
  }
});

// Resume readable stream when writable stream drains
writableStream.on('drain', () => {
  console.log('Writable stream drained, resuming readable stream');
  readableStream.resume();
});

// Handle end of readable stream
readableStream.on('end', () => {
  console.log('Readable stream ended');
  writableStream.end();
});

// Handle errors
readableStream.on('error', (err) => {
  console.error('Error reading file:', err);
});

writableStream.on('error', (err) => {
  console.error('Error writing file:', err);
});