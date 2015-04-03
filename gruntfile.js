var javascript = [
	'src/libs/domparser.js',
	'src/libs/handlebars.runtime.js',
	'src/libs/tiny.js',
	'src/config.js',
	'src/handlers.js',
	'build/templates.js',
	'src/script.js',
	'src/sorting.js',
	'src/twitter.js'
];

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json')
		, handlebars: {
			main: {
				options: {
					namespace: 'templates'
					, processName: function(path) {
						return path.split('/').pop().split('.').shift();
					}
					, processContent: function(content) {
						content = content.replace(/\t/g, '');
						content = content.replace(/\n{2,}/g, '\n');
						content = content.trim();

						return content;
					}
				}
				, files: {
					'build/templates.js': 'src/hbs/*.hbs'
				}
			}
		}
		, uglify: {
			dev: {
				options: {
					beautify: true
					, mangle: false
					, compress: false
					, enclose: true
				}
				, files: {
					'release/script.min.js': javascript
				}
			}
			, prod: {
				options: {
					beautify: false
					, mangle: true
					, enclose: true
					, compress: {
						drop_console: true
						, dead_code: true
					}
				}
				, files: {
					'release/script.min.js': javascript
				}
			}
		}
		, less: {
			dev: {
				options: {
					compress: false
				}
				, files: {
					'release/style.min.css': 'src/style.less'
				}
			}
			, prod: {
				options: {
					compress: true
				}
				, files: {
					'release/style.min.css': 'src/style.less'
				}
			}
		}
		, filerev: {
			main: {
				src: 'release/*.{css,js}'
			}
		}
		, replace: {
			html: {
				src: 'src/index.html'
				, dest: 'build/index.html'
				, replacements: [{
					from: 'script.min.js'
					, to: function() {
						return grunt.filerev.summary['release/script.min.js'].split('/').pop();
					}
				}
				, {
					from: 'style.min.css'
					, to: function() {
						return grunt.filerev.summary['release/style.min.css'].split('/').pop();
					}
				}]
			}
		}
		, htmlmin: {
			main: {
				options: {
					collapseWhitespace: true
					, collapseBooleanAttributes: true
					, removeAttributeQuotes: true
					, removeRedundantAttributes: true
					, useShortDoctype: true
				}
				, files: {
					'release/index.html': 'build/index.html'
				}
			}
		}
		, clean: {
			all: ['release']
			, build: ['build']
		}
		, watch: {
			main: {
				files: ['src/*.js', 'src/hbs/*.hbs', 'src/*.less', 'src/index.html', 'src/images/*']
				, tasks: ['dev']
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-handlebars');
	grunt.loadNpmTasks('grunt-contrib-htmlmin');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-filerev');
	grunt.loadNpmTasks('grunt-text-replace');

	grunt.registerTask('dev', [
		'clean',
		'handlebars',
		'uglify:dev',
		'less:dev',
		'filerev',
		'replace',
		'htmlmin',
		'clean:build'
	]);
	grunt.registerTask('prod', [
		'clean',
		'handlebars',
		'uglify:prod',
		'less:prod',
		'filerev',
		'replace',
		'htmlmin',
		'clean:build'
	]);
};
