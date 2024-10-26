window.rawTemplates = %s;

window.templates = {};
Object.keys(window.rawTemplates).forEach(function(key) {
  window.templates[key] = Handlebars.compile(window.rawTemplates[key]);
});
