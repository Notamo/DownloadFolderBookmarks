DownloadFolderBookmarks
=======================

A Google Chrome extension which allows you to save multiple download locations and download files directly to them.

This project is under the MIT license. See "LICENSE" file for details.

Icon from "Hand Drawn Web Icon Set" by Pawel Kadysz  of 177DESIGNS (http://www.177designs.com) is licensed under the Creative Commons License. Found here: https://www.iconfinder.com/icons/66792/download_folder_icon

Description:
This is a small side-project of mine for experimenting with Google extensions
and some javascript, which solves a little pet peeve of mine where I have
several folders spread all around my computer that i have to relocate my
files to after I initially download them.

Note: This is my first project using javascript/json/css/etc. Let me know if there is something I could do better!

Operation: 

This project utilizes context menus, and instead of using
right-click->save as.. the user will use a custom section where they can
choose which folder to save the selected file/link to. The user can also
add new folders to download to through this menu, and remove folders as
well.

To add folders to the list, click on the icon in the top-right corner of the browser to bring up the menu. Enter any string of your choosing for a nickname for the folder into the "Name" field, and enter a valid subdirectory of your downloads folder into the "directory" field. Note that starting or ending your directory with a "/" will result in an invalid directory error. Also, use "/" as a subdirectory indicator, as chrome recognizes it as valid, regardless of OS.

To download, simply right-click on the a link of your choice, and instead of selection the "Save As..." option, move your mouse to "Download Folder Bookmarks", and then to one of the new menu items you just created and click it.

Note: Due to limitations imposed by the browser (and reasonably so) I have not been able to find a way to download to full paths, or regress backwards from the downloads folder using "../". As a result, all paths are subdirectories of the Downloads folder. If you wish do use this extension to download anywhere on your computer, you would have to move your downloads folder to your drive's root folder throught the chrome downloads settings.

Happy Downloading!

-Notamo