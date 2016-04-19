/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var DelegatedModule = require("webpack/lib/DelegatedModule");

// options.source
// options.type
// options.context
// options.scope
// options.content
function DelegatedModuleFactoryPlugin(options) {
	this.options = options;
	options.type = options.type || "require";
	options.extensions = options.extensions || ["", ".js"];
}
module.exports = DelegatedModuleFactoryPlugin;

DelegatedModuleFactoryPlugin.prototype.apply = function(normalModuleFactory) {
	normalModuleFactory.plugin("factory", function(factory) {
		return function(data, callback) {
			var dependency = data.dependency;
			var request = dependency.request;
			if(request) {
				var innerRequest = request;
				for(var i = 0; i < this.options.extensions.length; i++) {
					var requestPlusExt = innerRequest + this.options.extensions[i];
					if(requestPlusExt in this.options.content) {
						var resolved = this.options.content[requestPlusExt];
						return callback(null, new DelegatedModule(this.options.source, resolved, this.options.type, requestPlusExt));
					}
				}
			}
			return factory(data, callback);
		}.bind(this);
	}.bind(this));
};
