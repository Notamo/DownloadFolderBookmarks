// Download Folder Bookmarks
// Allows users to save download folders and save files directly to them

//5/7/14 note: I have decided that (at least for now) I will limit the download
//destination to within subfolders of the user's download folder. This is due to both
//chrome's refusal to move backwards in directories for destinations. (..\) produces
//an error without fail.
//If the user wishes to, they may change the root download folder to their drive root, and expand
//their destination availability that way (although this still excludes multiple
//drives)

//TODO: code to ensure target is a file

//format of the folder object
/*
	var ret = {
		id: -1,				//for context menu access purposes, default -1
		nick: "nickname",		//any string, really. It's what you see on the context menu
		dir: "directory"		//the directory you save to.
	};
*/


const STORAGE_KEY = "DFB_folders";	//The LocalStorage key we use to store our folder data
var folderList = [];
var contextList = ["link", "image"];
var mainContextId = -1;	//the id for the main context menu (for parent-ness) -1 indicates it is not set




function removeFromFolderList(folder)
{
	//find the index where the folder is
	for(var i  = 0; i < folderList.length; i++)
	{
		if(folderList[i] == folder)
		{
			folderList.splice(i, 1);		//remove 1 item at index i
			return;
		}
	}
	console.log("Error: folder [" + folder.nick + "] not found in folderList");
}

//return the first folder object which has the given nickname
//returns null if not found
function getFolderByNickname(nickname)
{
	for(var i = 0; i < folderList.length; i++)
	{
		if(folderList[i].nick == nickname)
		{
			return folderList[i];
		}
	}
	return null;
}

function getFolderById(id)
{
	for(var i = 0; i < folderList.length; i++)
	{
		if(folderList[i].id == id)
		{
			return folderList[i];
		}
	}
	return null;
}


function makeFolderObject(nickname, directory)
{
	console.log("makeFolderObject()");

	var ret = {
		id: -1,
		nick: nickname,
		dir: directory
	};
	console.log(JSON.stringify(ret));
	return ret;
}


////////////////////////
//CONTEXT MENU FUNCTIONS
///////////////////////
function addContextMenu(folder)
{
	//todo: checks for proper object type
	if(mainContextId == -1) {
		console.log("Error: mainContextId == -1, cannot create child");
		return false;
	}

	var id = chrome.contextMenus.create({ "title": folder.nick, 
										"parentId": mainContextId,
										"contexts": contextList,			//can't do this, link images spawn menu item twice
	                                    "onclick": contextOnClick });
	if (chrome.extension.lastError) {
		console.log("Error: " + chrome.extension.lastError.message);
		return false;
	}

	folder.id = id;
	return true;
}

function removeContextMenu(folder)
{
	//todo: checks for proper object

	chrome.contextMenus.remove(folder.id);

	if (chrome.extension.lastError) {
		console.log("Error: " + chrome.extension.lastError.message);
		return false;
	}

	return true;
}

function updateContextMenu(folder)
{
	removeContextMenu(folder);
	addContextMenu(folder);
}


/////////////////////
//STORAGE FUNCTIONS//
/////////////////////

function updateStorage()
{
	localStorage.setItem(STORAGE_KEY, JSON.stringify(folderList));
	printStorageState();
}

//print the current state of our local storage
function printStorageState()
{
	var data = JSON.parse(localStorage.getItem(STORAGE_KEY));
	if(data == undefined)
	{
		console.log("localStorage empty");
		return;
	}
	for(var i = 0; i < data.length; i++)
	{
		console.log(i + " | id: " + data[i].id + " nick: " + data[i].nick + " dir: " + data[i].dir);
	}
}

//clear all of our data (completely)
function clearData()
{
	//remove context menus
	for(var i = 0; i < folderList.length; i++)
	{
		removeContextMenu(folderList[i]);
	}
	
	folderList = [];
  	localStorage.removeItem(STORAGE_KEY);
}


///////////////////////
//INTERFACE FUNCTIONS//
///////////////////////

//called by the browser_action page for customization purposes
//return an array of the folders the user has set up, along with their
//nicknames

//get a list of our folders(not in data stored form)
function getFolders()
{
	return folderList;
}

//add a new download destination folder
//don't forget to update context menu

function addFolder(nickname, directory)
{
	console.log("addFolder()");

	if(getFolderByNickname(nickname) != null)
	{
		console.log("Error: Could not add folder - folder already exists!");
		return false;
	}

	var obj = makeFolderObject(nickname, directory);	//update for failure handling
	folderList.push(obj);
	addContextMenu(obj);
	updateStorage();

	return true;
}

//remove a download destination folder
//don't forget to update context menu
function removeFolder(nickname)
{
	var folder = getFolderByNickname(nickname);
	if(folder == null)
	{
		console.log("Error:  could not remove folder - folder does not exist");
		return false;
	}

	removeContextMenu(folder);
	removeFromFolderList(folder);
	updateStorage();

	return true;
}



//modify a directory for a download destination
//don't forget to update context menu
function modifyFolder(nickname, directory)
{
	//update: check for valid directory

	var folder = getFolderByNickname(nickname);
	if(folder == null)
	{
		console.log("Error:  could not modify folder - folder does not exist");
		return false;
	}

	folder.dir = directory;
	updateStorage();
	updateContextMenu(folder);

	return true;
}



/////////////////////////////
// END INTERFACE FUNCTIONS //
/////////////////////////////


//extracts a filename from a url
//if the url does not have an associated file
//or is invalid in some way, returns ""
function getFileNameFromUrl(url)
{
	console.log("u: " + url);
	//the filename will at least be some variant of what is after the last '/' in the url
	var filename = url.substring(url.lastIndexOf("/") + 1);

	//link to same page, not a file
	if(filename.indexOf("#") != -1)
	{
		console.log("url has reference to same page (#)");
		return "";
	}

	if(filename.lastIndexOf(".") == -1)
	{
		console.log("no extension");
	}

	console.log("file name is [" + filename + "]");
	return filename;
}




//onclick callback function
function contextOnClick(info, tab)
{
	console.log("info: " + JSON.stringify(info));

	//find the corresponding folder from our menu item id
	var folder = getFolderById(info.menuItemId);
	if(folder == null)
	{
		console.log("Error: no corresponding folder from menuItemId");
		return;
	}


	//This logic is subject to change in future versions
	//determine what type of url to pick up
	//srcUrl if image, link o.w.
	var url;
	if(info.mediaType == "image")
	{
		console.log("image");
		console.log(info.srcUrl);
		url = info.srcUrl;
	}
	else
	{
		console.log("linkUrl");
		url = info.linkUrl;
	}

	var targetFile = getFileNameFromUrl(url);

	
	if(targetFile == "")
	{
		console.log("Error: invalid filename");
		return;
	}

	console.log("Full path: " + folder.dir + "/" + targetFile);

	chrome.downloads.download({"url": url, "filename": folder.dir + "/" + targetFile, "saveAs": true});
	if (chrome.extension.lastError) {
		console.log("Error: " + chrome.extension.lastError.message);
	}
}




function initialize()
{
	//load data from localStorage
	console.log("Loading data from local storage");

	folderList = JSON.parse(localStorage.getItem(STORAGE_KEY));
	if(folderList == undefined)
	{
		console.log("No DFB_folder item in localStorage, creating...");
		localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
	}

	folderList = JSON.parse(localStorage.getItem(STORAGE_KEY));
	console.log("Number of folders loaded: " + folderList.length);

	//add context menu items
	console.log("Adding context menu items")

	//main context menu item
	mainContextId = chrome.contextMenus.create({"title": "Download Folder Bookmarks", "contexts": contextList });			//can't do this, link images spawn menu item twice
	if (chrome.extension.lastError) {
		console.log("Error: " + chrome.extension.lastError.message);
	}

	console.log("Main context menu item created, id: " + mainContextId)


	//children items
	for(var i = 0; i < folderList.length; i++)
	{
		 if(!addContextMenu(folderList[i]))
		 {
		 	console.log("Failed to create context menu [" + folderList[i].nick + "]");
		 }
		 else
		 {
		 	console.log("Created context menu item. id: " + folderList[i].id + " nickname: " + folderList[i].nick + " directory: " + folderList[i].dir);
		 }
	}

	console.log("End of initialization");
}

document.addEventListener('DOMContentLoaded', initialize);