import * as esbuild from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get command line arguments
const args = process.argv.slice(2);
const isWatch = args.includes('--watch');
const isServe = args.includes('--serve');
const isProduction = args.includes('--production');
const isDocs = args.includes('--docs');

// Determine output directory (docs/ for GitHub Pages, dist/ for development)
const distDir = path.join(__dirname, isDocs ? 'docs' : 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy static files
const copyFile = (src, dest) => {
  const destPath = path.join(distDir, dest);
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, destPath);
};

// Copy HTML and other assets
copyFile(path.join(__dirname, 'src/index.html'), 'index.html');
copyFile(path.join(__dirname, 'src/logo.svg'), 'logo.svg');
copyFile(path.join(__dirname, 'src/lightbox.js'), 'lightbox.js');

// Check if favicon exists and copy it
const faviconPath = path.join(__dirname, 'src/favicon.ico');
if (fs.existsSync(faviconPath)) {
  copyFile(faviconPath, 'favicon.ico');
}

// Update HTML to reference the output CSS file (no live reload for initial copy)
updateHTML(false);

// esbuild configuration
const buildOptions = {
  entryPoints: ['src/winston.scss'],
  outfile: path.join(distDir, 'winston.css'),
  bundle: true,
  minify: isProduction || isDocs,
  plugins: [sassPlugin()],
  logLevel: 'info',
};

// Function to copy and update HTML
function updateHTML() {
  copyFile(path.join(__dirname, 'src/index.html'), 'index.html');
  const htmlPath = path.join(distDir, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace('href="winston.scss"', 'href="winston.css"');
  fs.writeFileSync(htmlPath, html);
}

// Build function
async function build() {
  try {
    if (isWatch || isServe) {
      const ctx = await esbuild.context(buildOptions);

      // Watch HTML and static files for both watch and serve modes
      fs.watch(path.join(__dirname, 'src'), { recursive: false }, (eventType, filename) => {
        if (filename === 'index.html') {
          console.log('HTML file changed, updating...');
          updateHTML();
        } else if (filename === 'logo.svg') {
          console.log('Logo changed, copying...');
          copyFile(path.join(__dirname, 'src/logo.svg'), 'logo.svg');
        } else if (filename === 'favicon.ico') {
          console.log('Favicon changed, copying...');
          copyFile(path.join(__dirname, 'src/favicon.ico'), 'favicon.ico');
        } else if (filename === 'lightbox.js') {
          console.log('Lightbox JS changed, copying...');
          copyFile(path.join(__dirname, 'src/lightbox.js'), 'lightbox.js');
        }
      });

      // Enable watching for both modes
      await ctx.watch();

      if (isServe) {
        // Serve mode: watch + dev server
        const { host, port } = await ctx.serve({
          servedir: 'dist',
          port: 1234,
        });
        console.log(`Server running at http://${host}:${port}`);
        console.log('Watching for changes with auto-reload...');
      } else {
        // Watch-only mode: just rebuild on changes
        console.log('Watching for changes...');
      }
    } else {
      await esbuild.build(buildOptions);

      // For production and docs builds, create winston.min.css
      if (isProduction || isDocs) {
        const cssContent = fs.readFileSync(path.join(distDir, 'winston.css'), 'utf8');
        fs.writeFileSync(path.join(distDir, 'winston.min.css'), cssContent);
        console.log('Created winston.min.css');
      }
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
