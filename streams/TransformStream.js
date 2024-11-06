const { Transform } = require('stream');
const fs = require('fs');
// Create a transform stream that converts data to uppercase
const upperCaseTransform = new Transform({
    transform(chunk, encoding, callback) {
        // Convert chunk to uppercase and push it to the readable side
        this.push(chunk.toString().toUpperCase());
        callback();
}
});
// Pipe readable stream to transform stream and then to writable stream

const readableStream = fs.createReadStream('./preTranformInput.txt', { encoding: 'utf8' });
const writableStream = fs.createWriteStream('tranformedOutput.txt');

readableStream.pipe(upperCaseTransform).pipe(writableStream);

writableStream.on('finish', () => {
    console.log('Finished transforming and writing to file.');
});