


function DropdownMenuManager() {
	// this global array allows the manager to clear all the menus at once without looking through the dom. 
	this.dropdownMenuIds = new Array();
}


// Init does the following: 
// 1 gets the collection of ul's that are dropdown menus. 
// 2 puts an omouseover on the matching trigger to show the menu and modify the trigger's highlighting. 
// 3 for those whose triggers are divs, puts onclick on the matching trigger to show the menu
// 4 for each ul, gets the collection of li's within, and if they are immediate children, and block elements, attaches onmouseover and onmouseout to modify the background colors.  This DOES NOT attach event handlers to li children that are themselves menuTriggers for further submenus. That step is taken care of by item 2) for the relevant submenu element. 
DropdownMenuManager.prototype.init = function() {
	// get all UL's
	var nodeCollection = window.document.getElementsByTagName("ul");

	for (var i=0; i<nodeCollection.length; i++ ) {

		// we want just the UL's with this attribute
		if (nodeCollection[i].getAttribute('isdropdownmenu') == "yes") {
			var menu = nodeCollection[i];
			var id = menu.getAttribute('id');
			var menuTrigger = document.getElementById(id +"_trigger");
			
			//attach a switch directly to the dom, which will be set based on onmouseovers and onmouseouts.  
			menuTrigger.mouseIsOver = false;


			// populate our global array for use in clearMenus
			this.dropdownMenuIds[this.dropdownMenuIds.length] = id;


			// sets up menu activation and deactivation when the trigger is an LI (ie for menus that are not top level, which are a little different. )
			if (menuTrigger.tagName == "LI") {
				eval("menuTrigger.onmouseover = function(mozEvent) {ourDropdownMenuManager.activateMenu(this,'"+id+"',mozEvent);this.mouseIsOver=true;ourDropdownMenuManager.checkForSiblingSubMenusToClose(this)}");

				eval("menuTrigger.onmouseout	= function(mozEvent) {ourDropdownMenuManager.unHighlightTrigger(this,'"+id+"',mozEvent);this.mouseIsOver=false;}");
			}

			// sets up menu activation and deactivation when the trigger is a DIV (ie, the top level menus, which are activated onclick)
			else {
				eval("menuTrigger.onclick			= function(event) {ourDropdownMenuManager.showDropdownMenu('" + id + "',event);ourDropdownMenuManager.highlightTopLevelTrigger('"+id+"');}");

				eval("menuTrigger.onmouseover = function(event) {if(ourDropdownMenuManager.someMenuIsOpen('" + id + "')){ourDropdownMenuManager.showDropdownMenu('" + id + "',event);}ourDropdownMenuManager.highlightTopLevelTrigger('"+id+"');}");

				// top level trigger should stay highlighted if it's child menu is still open.
				eval("menuTrigger.onmouseout	= function() {if(!ourDropdownMenuManager.aMenuIsOpen('"+id+"')){ourDropdownMenuManager.unHighlightTopLevelTrigger('"+id+"');}}");
			}


			// we are inside the loop iterating through all the dropdown menu ul's, and here we go into another loop through each of the child li elements's. 
			var childElements = menu.getElementsByTagName("li");
			// mozilla gets unsteady when it comes to li and ul widths. We need to nudge it a bit to normalize the size of li's. This var keeps track of the widestChild within every given UL. At the end some width assignments are made using this number.
			var widestChild = 0; 
			for (var j=0; j<childElements.length; j++) {

				var menuItem = childElements[j];
				//  nodeType==1 is to disinvite any text or whitespace nodes.   the second clause is to ensure that we are only operating on direct children. (we are traversing the whole tree, but in a somewhat haphazard order:  although we are going ul by ul, we are making NO assumptions as to the order of how these ul's are arranged in the collection.
				if ((menuItem.nodeType==1) && (menuItem.parentNode == menu) && (menuItem.className!="dropdownMenuSpacer")) {
					
					
					var listItemPadding = (document.all)?0: 33;
					// li's that are themselves menutriggers will just be text nodes inside. li's that are not will be links.  In the case of the link, we actually go in and get the width of the anchor element.  This is again due to mozilla's squirreliness regarding inherited widths on ul and li elements. 
					var menuItemTextContents = menuItem.childNodes[0];

					if ((menuItemTextContents.className) &&((menuItemTextContents.className.indexOf("dropdownMenuItemChecked")!=-1)||
						(menuItemTextContents.className.indexOf("dropdownMenuItemUnchecked")!=-1))) {
						menuItemTextContents = menuItem.childNodes[1];
					}	

					if (menuItemTextContents.nodeType==1) {
						widestChild = Math.max(widestChild, menuItemTextContents.offsetWidth+listItemPadding);
					}
					else {
						widestChild = Math.max(widestChild, menuItem.offsetWidth+listItemPadding);
					}
					

					// This is to skip over LI elements that are themselves triggers of further submenus. Triggers will be taken care of by their menus when this loop gets around to it. 
					// reads if NEITHER subMenuTrigger nor subMenuTriggerOver...
					if ((menuItem.className!= "subMenuTrigger") && (menuItem.className!= "subMenuTriggerOver")) {
						menuItem.onmouseover = function() {if (this.className!="disabled"){ourDropdownMenuManager.highlightRegularLiItem(this);ourDropdownMenuManager.checkForSiblingSubMenusToClose(this)}}
						menuItem.onmouseout = function() {if (this.className!="disabled"){ourDropdownMenuManager.unHighlightRegularLiItem(this);}}
					}
					
					// a note on the click() method in the next line.   If you should find, on some new release of Mozilla, that anchorElements or other elements dont seem to have a click method or are throwing errors, then this might mean that a certain patch for mozilla's DOM has stopped working. (The patch in question concerns the fact that Mozilla does not currently give link elements a click method and that one must be then created for it.)
					menuItem.onclick = function(){if(this.childNodes[0].tagName=='A'){this.childNodes[0].click();}else if (this.childNodes[0].className=="dropdownMenuItemChecked"){this.childNodes[0].className="dropdownMenuItemUnchecked";ourDropdownMenuManager.clearMenus();eval(this.childNodes[0].getAttribute("onuncheck"));}else if (this.childNodes[0].className=="dropdownMenuItemUnchecked"){this.childNodes[0].className="dropdownMenuItemChecked";ourDropdownMenuManager.clearMenus();eval(this.childNodes[0].getAttribute("oncheck"));}}

					// this stopPropagation call prevents legitimate clicks from tripping the document.onmousedown that closes the menus
					menuItem.onmousedown= function(mozEvent) {if (document.all) event.cancelBubble = true;else mozEvent.stopPropagation();}
				}
			}
			// widestChild will have the width of the widest element within this ul. 
			var borderWidthKludge = (document.all)? 2 : 0 ;
			menu.style.width = widestChild + borderWidthKludge;

			// hopefully, if all goes well with our development, this will only be a temporary kludge. 
			var boxModelKludge = (document.all)? 2 : 35;
			for (var j=0; j<childElements.length; j++) {
				childElements[j].style.width = childElements[j].parentNode.offsetWidth-boxModelKludge+"px";
			}
		}
	}
}
// takes a li obj, gets all the direct children of it's parent except for itself, and if any ofthem are subMenuTriggers, it calls checkSubMenu on them. 
DropdownMenuManager.prototype.checkForSiblingSubMenusToClose = function(liObj) {
	var ulParent = liObj.parentNode;
	var family = ulParent.getElementsByTagName("LI"); 
	for (var i=0; i<family.length;i++) {
		// we only want sibling li's that are actually triggers. 
		if ((family[i].className== "subMenuTrigger") || (family[i].className== "subMenuTriggerOver")) {
			// also make sure we are getting only direct children, and not the liObj itself. 
			if (  (family[i].parentNode == ulParent)  && (family[i] != liObj)) {			
				var id = family[i].getAttribute("id").replace("_trigger","");
				var menu = document.getElementById(id);
				if (!mouseIsOverAbsElement(menu)) {
					setTimeout("ourDropdownMenuManager.possiblyClearMenu('"+id+"')",700);
				}
			}
		}
	}	
}

// this function is called by a timeout.  When the timeout returns and this runs, the idea is that if the mouse is still not 'over' the trigger, then close the menu. 
// note that due to the nesting of submenus within the trigger elements,  the mouse will be 'over' the trigger when it is over the submenu, or one of the submenu's submenus.
DropdownMenuManager.prototype.possiblyClearMenu = function(id) {
	var menu = document.getElementById(id);
	var menuTrigger = document.getElementById(id + "_trigger");

	if (!menuTrigger.mouseIsOver) {
		this.hideDropdownMenu(id);
		menuTrigger.className = "subMenuTrigger";
	}
}

// check visibility of a given menu element
DropdownMenuManager.prototype.aMenuIsOpen = function(id) {
	menu = document.getElementById(id);
	if (menu.style.visibility == "visible") return true;
	else return false;
}

// check the given element's navbar to see if any menus are open.  This is needed since the top level triggers behave differently based on whether any menus are open. 
DropdownMenuManager.prototype.someMenuIsOpen = function(someChildElementId) {
	// from the child Element we are given, we can find the container for this menubar. 
	var childElement = document.getElementById(someChildElementId);
	var lookingForTopLevelTrigger = childElement;
	while ((lookingForTopLevelTrigger) && (lookingForTopLevelTrigger.tagName!="DIV")) {
		lookingForTopLevelTrigger = lookingForTopLevelTrigger.parentNode;
	}
	// with the menuBar's container we will look through all child UL elements. 
	var menuContainer = lookingForTopLevelTrigger.parentNode;

	var ulCollection = menuContainer.getElementsByTagName("UL");
	var foundAnOpenMenu = false;
	// see if any of the ul children of this menu bar are open
	for (var i=0;i<ulCollection.length;i++) {
		if ((ulCollection[i].className.indexOf("dropdownMenu")!=-1)&&(this.aMenuIsOpen(ulCollection[i].getAttribute("id")))) {
			foundAnOpenMenu = true;
		}
	}
	return foundAnOpenMenu;
}

// highlights the top level trigger div, but makes no changes to the menu state itself. 
DropdownMenuManager.prototype.highlightTopLevelTrigger = function(id) {
	for (var i=0; i<this.dropdownMenuIds.length; i++) {
		trigger = document.getElementById(this.dropdownMenuIds[i] + "_trigger");
		if (trigger.tagName == "DIV") {
			if (this.dropdownMenuIds[i] == id) {
				if (trigger.className.indexOf("globalNavTrigger")!=-1) {
					trigger.className="globalNavTriggerOver";
				}
				else if (trigger.className.indexOf("localNavTrigger")!=-1) {
					trigger.className="localNavTriggerOver";
				}
			}
			else {
				if (trigger.className.indexOf("globalNavTrigger")!=-1) {
					trigger.className="globalNavTrigger";
				}
				else if (trigger.className.indexOf("localNavTrigger")!=-1) {
					trigger.className="localNavTrigger";
				}
			}
		}
	}
}
//  simply unHighlights a top level trigger div. 
DropdownMenuManager.prototype.unHighlightTopLevelTrigger = function(id) {
	trigger = document.getElementById(id + "_trigger");
	if (trigger.className.indexOf("globalNavTrigger")!=-1) {
		trigger.className="globalNavTrigger";
	}
	else if (trigger.className.indexOf("localNavTrigger")!=-1) {
		trigger.className="localNavTrigger";
	}
}

// activates the menu and also highlights its menuTrigger
DropdownMenuManager.prototype.activateMenu = function(obj,id,mozEvent) {
	var eventSource = getEventOriginator(mozEvent);
	if (eventSource.getAttribute("id")  == id + "_trigger" ) {
		this.showDropdownMenu(id,mozEvent);	
		obj.className = "subMenuTriggerOver";
	}
}

// unHighlights a particular LI-type trigger. Currently the trigger is passed in as an object reference, and the id is passed in as well. 
// NOTE: this is also called directly by showDropdownMenu, when it clears all other menus.   
DropdownMenuManager.prototype.unHighlightTrigger = function(obj,id,mozEvent) {
	// onmouseovers and omouseouts bubbling up from children would cause a lot of redundant assignments here. All this unnecessary activity can trigger redraws on the ul elements in mozilla. Therefore we restrict to : 1) cases where the onmouseout was generated by the trigger itself, and 2) when the menu itself is already closed 
	if ((obj==getEventOriginator(mozEvent)) && (!this.aMenuIsOpen(id))) {
		obj.className = "subMenuTrigger";
	}
}

//  rollover state for regular li's that arent triggers.
DropdownMenuManager.prototype.unHighlightRegularLiItem = function(obj) {
	// These colors are not tied to theme colors, therefore can appear in js.
	obj.style.background='#ffffff';
}
DropdownMenuManager.prototype.highlightRegularLiItem = function (obj) {	
	// These colors are not tied to theme colors, therefore can appear in js.
	obj.style.background='#99ccff';
}
DropdownMenuManager.prototype.disableMenuItem = function(id) {
	document.getElementById(id).className = "disabled";
}
DropdownMenuManager.prototype.enableMenuItem = function(id) {
	document.getElementById(id).className = "";
}
DropdownMenuManager.prototype.insertNewMenuItem = function(newTitle,newURL,idOfItemToInsertAfter) {
	var newLiElement = document.createElement("li");
	var insertAfter = document.getElementById(idOfItemToInsertAfter);
	
	var liContents = document.createTextNode(newTitle);
	newLiElement.setAttribute("action",newURL);
	newLiElement.appendChild(liContents);



	newLiElement.onmouseover = function() {if (this.className!="disabled"){ourDropdownMenuManager.highlightRegularLiItem(this);ourDropdownMenuManager.checkForSiblingSubMenusToClose(this)}}
	newLiElement.onmouseout = function() {if (this.className!="disabled"){ourDropdownMenuManager.unHighlightRegularLiItem(this);}}

	newLiElement.onclick = function(){if ((this.className!="disabled")&&(this.getAttribute("action"))){document.location=this.getAttribute("action");}}

	// this stopPropagation call prevents legitimate clicks from tripping the document.onmousedown that closes the menus
	newLiElement.onmousedown= function(mozEvent) {if (document.all) event.cancelBubble = true;else mozEvent.stopPropagation();}


	insertAfter.parentNode.insertBefore(newLiElement,insertAfter);

}

DropdownMenuManager.prototype.showDropdownMenu = function(id,mozEvent) {
	var menu = document.getElementById(id);
	var menuTrigger = document.getElementById(id+"_trigger");
	var eventSource = getEventOriginator(mozEvent);

	// this event will bubble up, so we only care about the first time it comes around, when it's fired by the menuTrigger itself. 
	// OR, if it's fired by one of the arrow images that's inside the menuTriggers
	if ((eventSource == menuTrigger) || (  (eventSource.tagName == "IMG") && (eventSource.parentNode == menuTrigger) ) ) {

		// first explicitly hide the other menus at this level. 
		this.hideAllSiblingsOfAGivenMenu(menu);

		var offsetX =  menuTrigger.offsetLeft;
		var offsetY =  menuTrigger.offsetTop;

		/* this will sum up the additional offsets of the div on the page.  */
		/* ul.dropdownMenu elements are position absolute, and since they are nested within eachother, the coordinate system is constantly having it's origin reset at the upper left corner of each menu.   Unfortunately the mechanism to decide whether to flow the menu to the left or the right is unfinished */
		
		if (menuTrigger.tagName == "DIV") {
			var ob = menuTrigger.parentNode;

			// goes up the tree, adding offsets as it goes
			while (ob.offsetParent != null) {
				offsetY += ob.offsetTop;
				offsetX += ob.offsetLeft;
				ob = ob.offsetParent;
			}
		}
		

		var insertionX = offsetX;
		var insertionY = offsetY;

		// if we're dealing with a top level menu and thus a div trigger
		if (menuTrigger.tagName == "DIV") insertionY += menuTrigger.offsetHeight;

		// ie, we're dealing with a normal menu and trigger
		else {	
			/*
			if (offsetX + menuTrigger.offsetWidth  + menu.offsetWidth + 3> document.body.clientWidth) insertionX -= menu.offsetWidth;
			else insertionX += menuTrigger.offsetWidth ;
			*/
			insertionX += menuTrigger.offsetWidth;
			insertionY -= 3;
		}
		// all done, now just assign the insertion values and flip the visibility back
		if (menu.style.visibility != "visible") {
			menu.style.left = insertionX + "px";
			menu.style.top  = insertionY + "px";
			menu.style.visibility= "visible";
		}
	}
}

// hide one specific dropdown menu, identified by the id matching the UL's id tag. 
DropdownMenuManager.prototype.hideDropdownMenu = function(id) {
	var menu = document.getElementById(id);
	// the menus are made invisible.
	// additionally, they are moved offscreen so that they will not influence the presence or absence of scrollbars. 
	menu.style.visibility = "hidden";
	menu.style.left = "-500px";
	menu.style.top = "-500px";
}

// Hide a set of menus as follows: 
// given a particular menu (ie a UL element), look at the menu that it's trigger is in 
// then explicitly hide any other menus that you see at that level. 
DropdownMenuManager.prototype.hideAllSiblingsOfAGivenMenu = function(menu) {
	var menuSiblings = menu.parentNode.parentNode.getElementsByTagName("ul");
	for (var i=0; i<menuSiblings.length; i++) {
		if (menuSiblings[i] != menu) {
			this.hideDropdownMenu(menuSiblings[i].id);
			var siblingMenuTrigger = document.getElementById(menuSiblings[i].id + "_trigger");
			if (siblingMenuTrigger .tagName !="DIV") siblingMenuTrigger.className = "subMenuTrigger";
		}
	}
}
// explicitly clearing all the menus at once.  This function is hooked up to document.onmousedown
DropdownMenuManager.prototype.clearMenus = function() {
	for (var i=0; i<this.dropdownMenuIds.length;i++) {
		var menuTrigger = document.getElementById(this.dropdownMenuIds[i] + "_trigger");
		
		if (menuTrigger.tagName == "LI")		menuTrigger.className = "subMenuTrigger";
		else {
			if (menuTrigger.className.indexOf("localNavTrigger")!=-1) {
				menuTrigger.className = "localNavTrigger";
			}
			else {
				menuTrigger.className = "globalNavTrigger";
			}
		}
		this.hideDropdownMenu(this.dropdownMenuIds[i]);
	}

}

function dropdownMenuManager_clearMenus() {
	ourDropdownMenuManager.clearMenus();
}



