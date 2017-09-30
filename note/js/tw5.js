(function() {

	var Dropbox = require('dropbox');

	var twits = {
		redirectUri: "https://manoj549t.github.io/note",
		apiKeyDev: "qek5i8hcngzihxm"
	};

	// Parses the url and gets the access token if it is in the urls hash
	twits.getAccessTokenFromUrl = function() {
		return utils.parseQueryString(window.location.hash).access_token;
	}

	// contain the access token.
	twits.isAuthenticated = function() {
		return !!this.getAccessTokenFromUrl();
	}

	// Main application
	twits.initApp = function() {

		twits.setStatusMessage("Authenticating with Dropbox...");

		// Initialise Dropbox for full access
		debugger;

		if (this.isAuthenticated()) {
			var dbx = new Dropbox({ accessToken: this.getAccessTokenFromUrl() });
		} else {
			var dbx = new Dropbox({ clientId: twits.apiKeyDev });
			window.location.replace(dbx.getAuthenticationUrl(twits.redirectUri));
		}

		twits.dbx.filesListFolder({path: ''})
		  .then(function(response) {
		  	// Loading message
		  	console.log(response);
			var listParent = document.createElement("ul");
			listParent.appendChild(document.createTextNode("Loading..."));
			listParent.classList.add("list-group");
			document.getElementById("twits-files").appendChild(listParent);
			var navParent = document.getElementById("mySidenav");
			//twits.readFolder(listParent, navParent, response.entries);
			//$("#twitsModal").modal();
		  })
		  .catch(function(error) {
				if(error) {
					return twits.showError(error);  // Something went wrong.
			}	
	    });
	};

	twits.readFolder = function(listParent,navParent, stats) {
			//console.log(stats);
			// Remove loading message
			while(listParent.hasChildNodes()) {
				listParent.removeChild(listParent.firstChild);
			}

			twits.clearStatusMessage();
			// Load entries
			for(var t=0; t<stats.length; t++) {
				stat = stats[t];
				var listItem = document.createElement("li");	
				var link;

				link = document.createElement("a");
				link.href = "#";
				link.setAttribute("data-twits-path",stat.path_display);
				link.appendChild(document.createTextNode(stat.name));
				listItem.appendChild(link);
				listItem.classList.add("list-group-item");
				listItem.classList.add("list-group-item-action");
				listItem.addEventListener("click", twits.onClickFolderEntry, false)
				listItem.setAttribute("data-twits-path",stat.path_display);

				listParent.appendChild(listItem);
				var linkSideNav = link.cloneNode(true);
				linkSideNav.addEventListener("click", twits.onClickFolderEntry, false)
				navParent.appendChild(linkSideNav);
			}

	};

	twits.onClickFolderEntry = function(event) {
		var path = this.getAttribute("data-twits-path");
		twits.openFile(path);
		event.preventDefault();
		return false;
	};

	twits.openFile = function(path) {
		// Read the TiddlyWiki file
		// We can't trust Dropbox to have detected that the file is UTF8, so we load it in binary and manually decode it
		//twits.setStatusMessage("Reading HTML file...");
		twits.dbx.filesDownload({ path: path})
		.then(r => {
            console.log(r);
            var blob = r.fileBlob;
        	var reader = new FileReader();

        	reader.onload = function() {
        	twits.originalText = reader.result;
            twits.loadTW5(reader.result);
        	};
 
			twits.originalPath = r.path_display;
			reader.readAsText(blob);
        })
        .catch(e => {
            if(error) {
				return twits.showError(error);  // Something went wrong.
			}
        });
	}

	twits.getStatusPanel = function() {
		var getElement = function(id,parentNode) {
				parentNode = parentNode || document;
				var el = document.getElementById(id);
				if(!el) {
					el = document.createElement("div");
					el.setAttribute("id",id);
					parentNode.appendChild(el);
				}
				return el;
			},
			status = getElement("twits-status",document.body),
			message = getElement("twits-message",status),
			progress = getElement("twits-progress",status);
		status.style.display = "block";
		return {status: status, message: message, progress: progress};
	};

	twits.clearStatusMessage = function() {
		var status = twits.getStatusPanel();
		status.status.style.display = "none";
	}

	twits.setStatusMessage = function(text) {
		var status = twits.getStatusPanel();
		while(status.message.hasChildNodes()) {
			status.message.removeChild(status.message.firstChild);
		}
		status.message.appendChild(document.createTextNode(text));
	};

	twits.setProgress = function(text) {
		var status = twits.getStatusPanel();
		while(status.progress.hasChildNodes()) {
			status.progress.removeChild(status.progress.firstChild);
		}
		status.progress.appendChild(document.createTextNode(text));
	};

	twits.showError = function(error) {
		twits.setStatusMessage("Error: " + error);
		twits.setProgress("");
	};

	twits.trackProgress = function(xhr,isUpload) {
		var onProgressHandler = function(event) {
				twits.setProgress(Math.ceil(event.loaded/1024) + "KB");
			},
			onLoadHandler = function() {
			},
			onErrorHandler = function() {
				twits.setStatusMessage("XHR error");
			};
		var src = isUpload ? xhr.upload : xhr;
		src.addEventListener("progress",onProgressHandler,false);
		src.addEventListener("load",onLoadHandler,false);
		src.addEventListener("error",onErrorHandler,false);
	};

	twits.isTiddlyWiki = function(text) {
		return true; 
	};

	twits.loadTW5 = function(data){
		var rawIndex = data.indexOf('<' + '!--~~ Raw markup ~~--' + '>');
		
		window.temp = data;
		
		var doc = document.createElement('html');
		doc.innerHTML = data;

		var iFrame = $("#twits-Frame");

		if(iFrame)
			iFrame.remove();
		
		$('<iframe id="twits-Frame"/>').appendTo("#main").contents().find('html').append(data);
		$("#twits-Frame").height("100%");
		$("#twits-Frame").width("100%");
		
		$("#twits-Frame").ready(function(){
 			
 			$("#twits-Frame")[0].contentWindow.$tw.saverHandler.savers.push({
				info: {
					name: "tw5-in-the-sky",
					priority: 5000,
					capabilities: ["save"]
				},
				save: function( text, method, callback, options ){
					twits.setStatusMessage("Saving changes...");
					twits.setProgress("");

					twits.dbx.filesUpload({path: twits.originalPath, mode: "overwrite",contents: text})
			        .then(function(response) {
			          twits.clearStatusMessage();
			          callback();
			          console.log(response);
			        })
			        .catch(function(error) {
			          console.error(error);
			        });
					return true;
				}
			});
		});
	};

	// Extract the blocks of a TiddlyWiki 2.x.x document and add them to the current document
	twits.filletTiddlyWiki = function(text) {
		// Extract a block from a string given start and end markers
		var extractBlock = function(start,end) {
			var s = text.indexOf(start);
			if(s !== -1) {
				var e = text.indexOf(end,s);
				if(e !== -1) {
					return text.substring(s + start.length,e);
				}
			}
			return null;
		};
		// Collect up all the blocks in the document
		var output = {html: [], script: [], style: []};
		for(var block=0; block<twits.blocks.length; block++) {
			var blockInfo = twits.blocks[block],
				blockText = extractBlock(blockInfo.start,blockInfo.end);
			if(blockText) {
				output[blockInfo.type].push(blockText);
			}
		}
		// Process the HTML blocks
		document.body.innerHTML = output.html.join("\n");
		// Process the style blocks
		var styleElement = document.createElement("style");
		styleElement.type = "text/css";
		styleElement.appendChild(document.createTextNode(output.style.join("\n")));
		document.getElementsByTagName("head")[0].appendChild(styleElement);
		// Compose the boot tail script
		var tail = "twits.patchTiddlyWiki();";
		// Process the script blocks
		var scr = document.createElement("script");
		scr.type = "text/javascript";
		scr.appendChild(document.createTextNode(output.script.join("\n") + "\n" + tail + "\n"));
		document.getElementsByTagName("head")[0].appendChild(scr);
	};

	twits.patchedSaveChanges = function(onlyIfDirty,tiddlers) {
		if(onlyIfDirty && !store.isDirty())
			return;
		clearMessage();
		twits.setStatusMessage("Saving changes...");
		twits.setProgress("");
		
		// Save the file to Dropbox
		twits.trackProgress(twits.client.writeFile(twits.originalPath, revised, function(error, stat) {
			if(error) {
				return twits.showError(error);  // Something went wrong.
			}
			twits.clearStatusMessage();
			displayMessage(config.messages.mainSaved);
			store.setDirty(false);
		}),true);
	};

	twits.patchTiddlyWiki = function() {
		window.saveChanges = twits.patchedSaveChanges;
		config.tasks.save.action = twits.patchedSaveChanges;
		// Older TiddlyWikis use loadOptionsCookie()
		var overrideFn = window.loadOptions ? "loadOptions" : "loadOptionsCookie";
		var _old_ = window[overrideFn];
		window[overrideFn] = function() {
			_old_();
			config.options.chkHttpReadOnly = false;
		};
		main();
		window[overrideFn] = _old_;
		story.closeAllTiddlers();
		story.displayTiddlers(null,store.filterTiddlers(store.getTiddlerText("DefaultTiddlers")));
	};

	twits.manualConvertUTF8ToUnicode = function(utf) {
		var uni = [],
			src = 0,
			b1, b2, b3,
			c;
		while(src < utf.length) {
			b1 = utf[src++];
			if(b1 < 0x80) {
				uni.push(String.fromCharCode(b1));
			} else if(b1 < 0xE0) {
				b2 = utf[src++];
				c = String.fromCharCode(((b1 & 0x1F) << 6) | (b2 & 0x3F));
				uni.push(c);
			} else {
				b2 = utf[src++];
				b3 = utf[src++];
				c = String.fromCharCode(((b1 & 0xF) << 12) | ((b2 & 0x3F) << 6) | (b3 & 0x3F));
				uni.push(c);
			}
		}
		return uni.join("");
	};

	// Do our stuff when the page has loaded
	document.addEventListener("DOMContentLoaded",function(event) {
		twits.initApp();
	},false);

})();