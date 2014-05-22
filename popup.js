//popup.js
//this is the javascript file that will handle the UI logic of our customization
//of DFB

//I prefer that the storage code be handled in the background, as that is where
//the folders are generated. Therefore, when performing operations here, we will
//refer to the background page functions.

//5/7/14 note: I have decided that (at least for now) I will limit the download
//destination to within subfolders of the user's download folder. This is due to both
//chrome's refusal to move backwards in directories for destinations. (..\) produces
//an error without fail.
//If the user wishes to, they may change the root download folder to their drive root, and expand
//their destination availability that way (although this still excludes multiple
//drives)


//the background interface is as follows:
//getFolders()
//addFolder(nickname, directory)
//removeFolder(nickname)
//modifyFolder(nickname, directory)

background = chrome.extension.getBackgroundPage();
if(background == null)
	alert("Error: could not access background page!");

/////////////////////
//UTILITY FUNCTIONS//
/////////////////////

//checks if a given string contains any of a list of characters
function stringContainsCharacters(string, characterSet)
{
	for(var i = 0; i < characterSet.length; i++)
	{
		if(string.indexOf(characterSet[i]) != -1)
		{
			console.log("character: " + characterSet[i]);
			return true;
		}
	}
	return false;
}

//check for a valid directory string
//rules:
//directory folders are seperated by a single "/" character
//may not start with /
//may not end with /
//illegal characters for folder names:
// <, >, :, ", /, \, |, ?, *, \0
function isValidDirectory(directory)
{

	//first and last characters cannot contain a /
	if(directory[0] == "/" || directory[directory.length - 1] == "/")
	{
		console.log("Directory may not begin nor end with the character '/'.");
		alert("Error: Directory may not begin nor end with the character '/'.");
		return false;
	}

	//we split the directory here, because
	var split = directory.split("/");
	console.log(split);
	for(var i = 0; i < split.length; i++)
	{
		//this means there was a double / in the directory
		//indicating an invalid directory
		if(split[i] == "")
		{
			console.log("directory contains invalid character");
			alert("Error: Directory may not contain a double '/'");
			return false;
		}
		//first check for illegal characters
		if(stringContainsCharacters(split[i], "<>:;\"\\/|?*\0"))
		{
			console.log("directory contains invalid character");
			alert("Error: Directory may not contain any of the following characters: <, >, :, ;, \", \\, /, |, ?, *");
			return false;
		}
	}

	return true;
}

/////////////////////
//FOLDER OPERATIONS//
/////////////////////

function addFolder()
{
	console.log("addFolder()");
	//obtain the data from our fields
	nickname = document.querySelector("#nameinput").value;
	directory = document.querySelector("#dirinput").value;

	//check for empty fields
	if(nickname == "")
	{
		alert("Error: No name was entered");
		console.log("No name was entered");
		return;
	}
	if(directory == "")
	{
		alert("Error: No directory was entered");
		console.log("No directory was entered");
		return;
	}

	//note: remove in production?
	console.log("name: [" + nickname + "]\ndirectory: " + directory);

	//check if the given directory is valid
	if(!isValidDirectory(directory))
		return;

	//call the background process for addition
	if(background.addFolder(nickname, directory))
	{
		addTableRow(nickname, directory);
	}
	else
	{
		alert("Error: Failed to create new folder");
		console.log("Error: Failed to create new folder - Background process failure");
	}

}

//delete a folder from the extension
function deleteFolder(nickname)
{
	console.log("deleteFolder()");

	//verify with the user that they want to do this
	del = confirm("Delete Bookmark \"" + nickname + "\"?");

	if(del)
	{
		background.removeFolder(nickname);
		removeTableRow(nickname);
	}
}

//change the name of one of the directories
function editFolder(nickname)
{
	console.log("editFolder()");
	var directory = prompt("Select a new directory for folder \"" + nickname + "\"");

	//document.querySelector("#dirinput").value;

	//empty directory field indicates this was probably unintentional
	if(directory == null)
		return;

	//check if the directory is valid
	if(!isValidDirectory(directory))
		return;

	if(background.modifyFolder(nickname, directory))
		updateTable();
	else
	{
		alert("Error: Failed to modify folder");
		console.log("Error: Failed to modify folder - Background process failure");
	}
}




////////////////////
//TABLE OPERATIONS//
////////////////////

//Make the modify cell for a given folder row
//The "modify cell" is a cell containing the edit | delete buttons
function constructModCell(modCell, name)
{
	console.log("constructModCell()");

	//create some tags to pass to the buttons
	//This is so the onClick function knows what to
	//pass to the delete/editFolder functions
	//There is probably a more elegant way to do this.
	var delTag = 'del' + name;
	var editTag = 'edt' + name;

	//the delete button
	var delBtn = document.createElement("button");
	delBtn.id = delTag;
	delBtn.addEventListener("click", function(){deleteFolder(this.id.substring(3))});
	delBtn.innerHTML = "delete";
	delBtn.className = "button";
	modCell.appendChild(delBtn);

	//the edit button
	var editBtn = document.createElement("button");
	editBtn.id = editTag;
	editBtn.addEventListener("click", function(){editFolder(this.id.substring(3))});
	editBtn.innerHTML = "edit";
	editBtn.className = "button";
	modCell.appendChild(editBtn);
}

//Make a table row containing a folder name, a directory
//and edit | delete buttons
//operates on row object instead of working with the table
//because it leaves the ability to insert a row wherever desired
function constructRow(row, name, dir)
{
	console.log("constructRow()");
	var nickCell = row.insertCell(-1);		//nickname
	var dirCell = row.insertCell(-1);		//directory
	var modCell = row.insertCell(-1);		//"edit | delete"

	nickCell.innerHTML = name;
	dirCell.innerHTML = "/" + dir;

	nickCell.className = "nickCell";
	dirCell.className = "dirCell";
	modCell.className = "editCell"; //for css manipulation
	
	constructModCell(modCell, name);
}

//update the table with whatever information we have
//fully refreshes the entire table
function updateTable()
{
	console.log("updateTable()");
	var folderListTable = document.querySelector("#FoldersTable");
	var folderList = background.getFolders();

	console.log("folderList length: " + folderList.length);
	console.log("rows: " + folderListTable.rows.length);


	//clear the table except for the first row
	//which is the column titles
	while(folderListTable.rows.length > 1)
	{
		console.log("deleting row");
		folderListTable.deleteRow(-1);
	}

	//set up a row for each folder in folderList
	for(var i = 0; i < folderList.length; i++)
	{
		console.log("creating row. name: " + folderList[i].nick + " dir: " + folderList[i].dir);
		addTableRow(folderList[i].nick, folderList[i].dir);
	}

	//create a footer indicating a lack of folders if there are none in the table
	if(folderListTable.rows.length == 1)
	{
		var footer = folderListTable.createTFoot();
		var row = footer.insertRow(0);
		var cell = row.insertCell(0);
		cell.innerHTML = "Sorry, there are no folders set up yet!";
	}
}

//remove just one table row without completely reloading everything
function removeTableRow(name)
{
	var folderListTable = document.querySelector("#FoldersTable");

	var row = document.getElementById(name);
	for(var i = 0; i < folderListTable.rows.length; i++)
	{

		if(folderListTable.rows[i].id == name)
		{
			console.log("deleting row " + i + ". name: " + folderListTable.rows[i].id);
			folderListTable.deleteRow(i);

			//add a footer indicating an empty table
			if(folderListTable.rows.length == 1)
			{
				var footer = folderListTable.createTFoot();
				var row = footer.insertRow(0);
				var cell = row.insertCell(0);
				cell.innerHTML = "Sorry, there are no folders set up yet!";
			}

			return true;
		}
	}

	alert("Error: Could not remove table row - row not found");
	console.log("Error: Could not remove table row - row not found");

	return false;
}

//add a row to the table
function addTableRow(name, directory)
{
	var folderListTable = document.querySelector("#FoldersTable");

	//this needs to be first - I don't know why yet
	folderListTable.deleteTFoot();

	var row = folderListTable.insertRow(-1);
	row.id = name;
	constructRow(row, name, directory);
}



//clear Data (mostly for debug purposes, although I may leave it in)
function clearData()
{
	//verify with the user that they want to do this
	var clear = confirm("Are you sure you want to delete all of your bookmarks?");

	if(clear == true)
	{
		background.clearData();
		console.log("All data cleared");
		updateTable();
	}
}

function aboutPopup()
{
	alert("Download Folder Bookmarks\nCopyright 2014 by Nicholas Carpenetti under the MIT license.\n\nIcon from \"Hand Drawn Web Icon Set\" by Pawel Kadysz  of 177DESIGNS (http://www.177designs.com) is licensed under the Creative Commons License. Found here: https://www.iconfinder.com/icons/66792/download_folder_icon\n\nThanks for using my humble extension!");
}


//required setup to follow the google content security policy (no inline javascript allowed)
document.addEventListener("DOMContentLoaded", function(){
	document.querySelector("#clearData").addEventListener('click', clearData);
	document.querySelector("#addFolder").addEventListener('click', addFolder);
	document.querySelector("#about").addEventListener("click", aboutPopup);
	updateTable();

});