(function() {

	var Dropbox = require('dropbox');
	/**
	Return isAuthenticated - > this.getAccessTokenFromUrl
	Updated new Dropbox ({ accessToken: ""})
	Remove access token from twits
	*/
	var twits = {
		redirectUri: "https://manoj549t.github.io/note",
		apiKeyDev: "qek5i8hcngzihxm",
		access_token: "",
		bLocal: false
	};

	twits.parentPath = []; //stack to save the parent directory. It is used for back-tracking (back button).

	$('#twitsModal').on('hidden.bs.modal', function (e) {
		twits.bModalVisible = false;
  		twits.parentPath = [];	//when the modal is closed. Reset the parentPath.
	})

	twits.folderIcon = document.createElement("i");
	twits.folderIcon.classList.add("material-icons");
	twits.folderIcon.style.color = "#3d9ae8";
	twits.folderIcon.appendChild(document.createTextNode("folder"));

	twits.fileIcon = document.createElement("i");
	twits.fileIcon.classList.add("material-icons");
	twits.fileIcon.style.color = "dimgrey";
	twits.fileIcon.appendChild(document.createTextNode("insert_drive_file"));


	// Parses the url and gets the access token if it is in the urls hash
	twits.getAccessTokenFromUrl = function() {
		if(this.bLocal)
			return this.access_token;
		else
			return utils.parseQueryString(window.location.hash).access_token;
	}

	// contain the access token.
	twits.isAuthenticated = function() {
		if(this.bLocal)
			return true;
		else
			return !!this.getAccessTokenFromUrl();
	}

	// Main application
	twits.initApp = function() {

		twits.setStatusMessage("Authenticating");

		// Initialise Dropbox for full access
		if (this.isAuthenticated()) {
			this.dbx = new Dropbox({ accessToken: this.getAccessTokenFromUrl()});
		} else {
			this.dbx = new Dropbox({ clientId: this.apiKeyDev });
			window.location.replace(this.dbx.getAuthenticationUrl(this.redirectUri));
			return;
		}

		document.getElementById("folderUp").addEventListener("click", twits.openNewFolder.bind(this, null, true), false);
		
		$("#navBack").on("click", function(){
			closeNav();
		});

		twits.dbx.filesListFolder({path: ''})
		  .then(function(response) {
		  	// Loading message
		  	twits.clearStatusMessage();
		  	$("#twitsModal").modal();
		  	twits.bModalVisible = true;
		  	
			var listParent = document.getElementById("twits-files");
			var navParent = document.getElementById("twits-sidenav");

			listParent.appendChild(document.createTextNode("Loading..."));
			twits.readFolder(listParent, navParent, response.entries, true);
			
		  })
		  .catch(function(error) {
				if(error) {
					return twits.showError(error);  // Something went wrong.
			}	
	    });
	};

	twits.readFolder = function(modalParent, navParent, directory, bOnload) {	
		var fileCount = 0;

		if(modalParent != null) {
			var listParent = modalParent;
			var bmodal = true;
		} else if (navParent != null) {
			var listParent = navParent;
			var bNav = true;
		} else {
			return twits.showError("Read Folder Error: Unable to find the list parent.")
		}

		while(listParent.hasChildNodes()) {
			listParent.removeChild(listParent.firstChild);
		}

		directory.forEach(function(item, index){

			// if its not a html file or a folder - Do not display.
			if(item.name.indexOf("html") != -1 || item[".tag"] == "folder") {
				fileCount++;

				var listItem = document.createElement("a");
				listItem.href = "#";
				var listName = document.createTextNode(item.name);

				listItem.appendChild(listName);
				listItem.setAttribute("data-twits-path",item.path_display);

				if(bOnload) {
					var navItem = listItem.cloneNode(listItem); // Copy node to navigation bar only onload (first time)!
					navParent.append(navItem);
					navItem.addEventListener("click", twits.onClickFolderEntry.bind(this, item[".tag"], item.path_display, item.name), false);
				}

				if(bmodal) {
					listItem.classList.add("list-group-item");
					listItem.classList.add("list-group-item-action");

					if(item[".tag"] == "folder") {
						listItem.appendChild(twits.folderIcon.cloneNode(true));
						listItem.addEventListener("click", twits.onClickFolderEntry.bind(this, item[".tag"], item.path_display, item.name), false);
					} else {
						listItem.appendChild(twits.fileIcon.cloneNode(true));
						listItem.addEventListener("click", twits.onClickFolderEntry.bind(this, item[".tag"], item.path_display, item.name), false);	
					}
				}

				if(bNav){
					listItem.addEventListener("click", twits.onClickFolderEntry.bind(this, item[".tag"], item.path_display, item.name), false);
				}

				listParent.append(listItem);
			}
		});

		if(fileCount == 0) {
			var listItem = document.createElement("a");
			var listName = document.createTextNode("No tw5 files in this folder");
			listItem.appendChild(listName);

			if (bmodal) {
				listItem.classList.add("list-group-item");
				listItem.classList.add("list-group-item-action");
			}

			listItem.classList.add("font-italic");
			listItem.classList.add("text-secondary");

			listParent.append(listItem);
		}

		if(twits.parentPath.length <= 0) {
			if (twits.bModalVisible) {
				document.getElementById("folderUp").classList.remove("visible");
				document.getElementById("folderUp").classList.add("invisible");
			} else {
				$("#navBack").off("click");
				$("#navBack").on("click", function(){
					closeNav();
				});
			}
			
		}
	};

	twits.onClickFolderEntry = function(tag, path, name) {

		if(tag == "folder") {
			var parentPath = path.substring(0, path.indexOf("/" + name));
			if(parentPath != twits.parentPath[parentPath.length -1])
				twits.parentPath.push(parentPath);

			twits.openNewFolder(path, false);

			if (twits.bModalVisible) {
				document.getElementById("folderUp").classList.remove("invisible");
				document.getElementById("folderUp").classList.add("visible");
			} else {
				$("#navBack").off("click");
				$("#navBack").on("click", function(){
					twits.openNewFolder(null, true);
				});
			}
		} else { 
			twits.openFile(path);
			$("#twitsModal").modal('hide');
			closeNav();
		}
	};

	twits.openNewFolder = function(path, backBtn) {

		if(backBtn) {
			path = twits.parentPath.pop();
			if(path == "" && twits.bModalVisible) {
				document.getElementById("folderUp").classList.remove("visible");
				document.getElementById("folderUp").classList.add("invisible");
			}
		}

		twits.dbx.filesListFolder({path: path})
		  .then(function(response) {
		  	// Loading message
			if(twits.bModalVisible) {
				var modalParent = document.getElementById("twits-files");
			} else {
				var navParent = document.getElementById("twits-sidenav");
			}

			twits.readFolder(modalParent, navParent, response.entries), false;
		  })
		  .catch(function(error) {
				if(error) {
					return twits.showError(error);  // Something went wrong.
			}	
	    });
	};

	twits.openFile = function(path) {

		twits.showProgress();
		
		twits.dbx.filesDownload({ path: path})
		.then(r => {
            var blob = r.fileBlob;
        	var reader = new FileReader();

        	reader.onload = function() {
        	twits.originalText = reader.result;	
            twits.loadTW5(reader.result);
        	};
 
			twits.originalPath = r.path_display;
			reader.readAsText(blob);

			setTimeout(twits.closeProgress, 1200);
        })
        .catch(e => {
            if(error) {
				return twits.showError(error);  // Something went wrong.
			}
        });
	};

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

	/*twits.trackProgress = function(xhr,isUpload) {
		var onProgressHandler = function(event) {
				twits.setProgress(Math.ceil(event.loaded/1024) + "KB");
			},
			onLoadHandler = function() {
			},
			onErrorHandler = function() {
				twits.setStatusMessage("XHR error");
			};
		var src = isUpload ? xhr.upload : xhr;
		src.addEventListener("progress",	,false);
		src.addEventListener("load",onLoadHandler,false);
		src.addEventListener("error",onErrorHandler,false);
	};*/

	twits.showProgress = function() {
		$("#downloadProgress").width(0);
		$("#progressBox").width("70%");
		$("body").toggleClass("showProgress");
		//document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
	};

	twits.closeProgress = function() {
		$("#progressBox").width("0%");
		$("body").toggleClass("showProgress");
		//document.body.style.backgroundColor = "white";
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
		
		$("#mainContainer").remove();

		$('<iframe id="twits-Frame"/>').appendTo("#main");
		$("#twits-Frame").contents().find('html').append(data);
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
	/*twits.filletTiddlyWiki = function(text) {
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
	};*/

	// Do our stuff when the page has loaded
	document.addEventListener("DOMContentLoaded",function(event) {
		twits.initApp();
	},false);

})();
