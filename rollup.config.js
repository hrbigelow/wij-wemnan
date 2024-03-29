import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import glslify from 'rollup-plugin-glslify';
import { string } from 'rollup-plugin-string';
import css from 'rollup-plugin-css-only';
import path from 'path';

var debug_file = process.argv.find((arg) => arg.startsWith('--debug-file'));
if (debug_file)
  debug_file = debug_file.split('=')[1]

const production = !process.env.ROLLUP_WATCH;

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

function debug_message(file, content, note) {
  console.log(`
Processing ${file} (${note})

---------------------------
${content} 
---------------------------
`);
}

const defaultPlugins = [
  svelte({
    extensions: ['.svelte'],
    preprocess: [
      { 
        markup: ({ content, filename }) => {
          if (path.basename(filename) == debug_file)
            debug_message(filename, content, 'before');

          // content = pre_sv(content);

          if (path.basename(filename) == debug_file)
            debug_message(filename, content, 'after');

          return { code: content };
        }
      }
    ],
    compilerOptions: {
      // enable run-time checks when not in production
      dev: !production
    }
  }),
  // we'll extract any component CSS out into
  // a separate file - better for performance
  css({ output: 'bundle.css' }),

  // If you have external dependencies installed from
  // npm, you'll most likely need these plugins. In
  // some cases you'll need additional configuration -
  // consult the documentation for details:
  // https://github.com/rollup/plugins/tree/master/packages/commonjs
  resolve({
    browser: true,
    dedupe: ['svelte']
  }),
  commonjs(),
  glslify(),
  string({ include: "**/*.xml" }),
  // xml({ format: 'XMLDocument' }),


  // In dev mode, call `npm run start` once
  // the bundle has been generated
  !production && serve(),

  // Watch the `public` directory and refresh the
  // browser on changes when not in production
  !production && livereload('public'),

  // If we're building for production (npm run build
  // instead of npm run dev), minify
  production && terser()
];

export default [
  {
    input: 'src/main.js',
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'app',
      file: 'public/build/bundle.js'
    },
    plugins: defaultPlugins,
    watch: {
      clearScreen: false
    }
  }
];

