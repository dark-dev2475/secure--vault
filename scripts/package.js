const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create output directory if it doesn't exist
const distDir = path.resolve(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join(distDir, 'secure-shelf.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log(`Package created successfully: ${archive.pointer()} total bytes`);
  console.log('The package is ready: dist/secure-shelf.zip');
});

// Handle archive warnings
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

// Handle archive errors
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Append all files from the dist directory, excluding the zip file itself
archive.glob('**/*', {
  cwd: distDir,
  ignore: ['secure-shelf.zip']
});

// Finalize the archive
archive.finalize();
