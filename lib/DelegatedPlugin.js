var DelegatedModuleFactoryPlugin = require("./DelegatedModuleFactoryPlugin");
var DelegatedSourceDependency = require("webpack/lib/dependencies/DelegatedSourceDependency");

function DelegatedPlugin(options) {
	this.options = options;
}
module.exports = DelegatedPlugin;
DelegatedPlugin.prototype.apply = function(compiler) {
	compiler.plugin("compilation", function(compilation, params) {
		var normalModuleFactory = params.normalModuleFactory;

		compilation.dependencyFactories.set(DelegatedSourceDependency, normalModuleFactory);
	});
	compiler.plugin("compile", function(params) {
		params.normalModuleFactory.apply(new DelegatedModuleFactoryPlugin(this.options));
	}.bind(this));
};
