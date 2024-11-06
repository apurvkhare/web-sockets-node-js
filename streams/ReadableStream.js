const fs = require('fs');
// Create a readable stream from a file
const readableStream = fs.createReadStream('./input.txt', { encoding: 'utf8' });
// Handle data event
readableStream.on('data', (chunk) => {
    console.log('$$Received chunk$$:', chunk);
});
// Handle end event
readableStream.on('end', () => {
    console.log('#####################')
    console.log('No more data to read.');
});
// Handle error event
readableStream.on('error', (err) => {
    console.error('Error reading file:', err);
});