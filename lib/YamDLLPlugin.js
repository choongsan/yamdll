var path = require("path"),
    async = require("async"),
    DllEntryPlugin = require("webpack/lib/DllEntryPlugin"),
    _ = require("underscore");

function YamDLLPlugin(options) {
    this.options = options;
}

YamDLLPlugin.prototype.apply = function(compiler) {
    compiler.plugin("entry-option", function(context, entry) {
        function itemToPlugin(item, name) {
            if(Array.isArray(item))
                return new DllEntryPlugin(context, item, name);
            else
                throw new Error("DllPlugin: supply an Array as entry");
        }
        if(typeof entry === "object") {
            Object.keys(entry).forEach(function(name) {
                compiler.apply(itemToPlugin(entry[name], name));
            });
        } else {
            compiler.apply(itemToPlugin(entry, "main"));
        }
        return true;
    });
    compiler.plugin("emit", function(compilation, callback) {
        async.forEach(compilation.entries, function(entry, callback) {
            if(!entry.chunks[0].initial) {
                callback();
                return;
            }

            var targetPath = compilation.getPath(this.options.path, {
                hash: compilation.hash,
                chunk: entry
            });
            var name = compilation.getPath(this.options.name, {
                hash: compilation.hash,
                chunk: entry
            });

            var manifest = {
                name: name,
                type: this.options.type,
                content: entry.dependencies.reduce(function(obj, module) {
                    module = module.module;
                    if(module.libIdent) {
                        var rawRequest = module.rawRequest,
                            ident = module.libIdent({
                                context: this.options.context || compiler.options.context
                            });

                        if(ident) {
                            var temporaryIdentity;

                            var dependencies = _.filter(module.dependencies, function(dependency) {
                                return dependency.type === 'amd define' && dependency.localModule && _.isString(dependency.localModule.name) ;
                            });

                            if (dependencies && dependencies.length == 1) {
                                temporaryIdentity = dependencies[0].localModule.name;
                                console.log('Matching...',temporaryIdentity);
                            }

                            if (temporaryIdentity) {
                                obj[temporaryIdentity] = module.id;
                            } else if(/^[a-zA-Z0-9\.].*/.test(rawRequest)) {
                                obj[rawRequest] = module.id;
                            } else {
                                obj[ident] = module.id;
                            }
                        }
                    }
                    return obj;
                }.bind(this), {})
            };
            var content = new Buffer(JSON.stringify(manifest, null, 2), "utf-8");
            compiler.outputFileSystem.mkdirp(path.dirname(targetPath), function(err) {
                if(err) return callback(err);
                compiler.outputFileSystem.writeFile(targetPath, content, callback);
            });
        }.bind(this), callback);
    }.bind(this));
};

module.exports = YamDLLPlugin;