

// This code does not yet completely support the existence of multiple transferBoxes on one page, although a large degree of abstraction toward that goal has been done. 


// object provides initialization consisting primarily of event-handler attachment, and some utility functions during runtime. 
// the data for the real state of the transfer box is in a hidden form field called "chosenItemsAddList" . When the form is submitted, the value of the multiple-select elements themselves is NOT relevant. Only this hidden form field with its single string, containing  item names and item categories seperated by ":", and those pairs then separated by "*" is relevant. 
function TransferBoxManager() {	

	// need this to be an array of booleans, if we want to support multiple transferBoxes per page.
	this.usesCategoryFiltering = false;
}


TransferBoxManager.prototype.init = function() {
	var formNodes = document.forms;
	
	for (var i=0; i<formNodes.length; i++) {
		if (formNodes[i].className == "transferBox") {
			
			
			this.getNewAvailableItemsList(formNodes[i]);
			this.checkButtons(formNodes[i]);
			formNodes[i].available_items.onchange = function() {ourTransferBoxManager.checkButtons(this.form)};
			formNodes[i].chosen_items.onchange = function() {ourTransferBoxManager.checkButtons(this.form)};

			formNodes[i].addButton.onclick = function() {ourTransferBoxManager.addToChosenList(this.form)};
			formNodes[i].removeButton.onclick = function() {ourTransferBoxManager.removeFromChosenList(this.form)};

			if (formNodes[i].sortUpButton) {
				
				formNodes[i].sortUpButton.onclick = function() {ourTransferBoxManager.moveSelectedChosenItems(this.form,true);}
				formNodes[i].sortDownButton.onclick = function() {ourTransferBoxManager.moveSelectedChosenItems(this.form,false);}
			}
			
			

			if (formNodes[i].itemCategory) {
				 eval("formNodes[i].itemCategory.onchange= function() {ourTransferBoxManager.getNewAvailableItemsList(document.getElementById('"+formNodes[i].id+"'))}");
				 this.usesCategoryFiltering = true;
			}
		}
	}	
}



// called by the iframe when the data loads. 
TransferBoxManager.prototype.resetAvailableItems = function(id,availableItemsString) {

	var transferBoxForm = document.getElementById(id);
	
	var availableBox = transferBoxForm.available_items;
	var chosenBox = transferBoxForm.chosen_items;

	// Loop through the tools list box to clear it out, then reload
	while (availableBox.length > 0) {
			availableBox.options[0] = null;
	}

	// Repopulate the available box with the new tool names
	// Parse through the list, and for each matching group name, turn on the selection
	var availableItems = availableItemsString.split("*");


	for (var i=0; i<availableItems.length; i++) {
		// See if this tool is already in the chosenBox. If it isn't, add it to the available box
		// Add this element to the end of the group list box
		var inToolBox = false;
		var itemPair         = availableItems[i];
		var itemPairArray    = itemPair.split("|");
		var itemName         = itemPairArray[0];
		var itemIdAndNamePair  = itemPairArray[1];
		var itemIdAndNameArray = itemIdAndNamePair.split(":");
		var itemId         = itemIdAndNameArray[0];

		for (var j = 0; j < chosenBox.length; j++) {
			var chosenItemValue = chosenBox.options[j].value;
			var chosenItemValueArray = chosenItemValue.split(":");
			if (chosenItemValueArray[0] == itemId) {
				inToolBox = true;
			}
		}

		// Create a new option object and add
		if (!inToolBox)availableBox.options[availableBox.length] = new Option(itemName, itemIdAndNamePair);
	}
}

TransferBoxManager.prototype.getNewAvailableItemsList = function(formObj) { 	
	var formId = formObj.getAttribute("id");
	if (this.usesCategoryFiltering) {
		
	  var categoryIndex = formObj.itemCategory.selectedIndex;
	  var category = formObj.itemCategory.options[categoryIndex].text;
	  //document.getElementById(formId + "DataSource").src = "GetToolsForCategory.jsp?category=" + category;
		
		document.getElementById(formId+"DataSource").src = formObj.pathToGetNewItems.value + "?category="+category;
	}
	else {
		document.getElementById(formId + "DataSource").src = formObj.pathToGetNewItems.value;
	}
}

TransferBoxManager.prototype.addToChosenList = function(formObj) {

	// Set up the select box elements and the option counter
	var availableBox = formObj.available_items;
	var chosenBox = formObj.chosen_items;

	// Loop through the available list
	// Add selected elements to the add list
	for (var i = 0; i < availableBox.length; i++) {
		if(availableBox.options[i].selected == true) {
			// Create a new option object
			var newToolOption = new Option((availableBox.options[i].text), (availableBox.options[i].value));

			// Add this element to the end of the group list box
			chosenBox.options[chosenBox.length] = newToolOption;
		}
	}

	// Loop through to remove the selected items from the available list
	var availableBoxLength = availableBox.length;
	for (i = 0; i < availableBoxLength; i++) {
		if (availableBox.options[i].selected) {
			// Remove the selected option from the available list
			availableBox.options[i] = null;
			i--;
			availableBoxLength--;
		}
	}

	// Now check the buttons
	
	this.checkButtons(formObj);

}

TransferBoxManager.prototype.removeFromChosenList = function(formObj) {
	// Set up the select box elements and the option counter
	var availableBox = formObj.available_items;
	var categoryName = (this.usesCategoryFiltering)? formObj.itemCategory.options[formObj.itemCategory.value].text : "";
	var chosenBox = formObj.chosen_items;
	
	var chosenBoxLength = chosenBox.length;

	// Loop through the group list
	// Add selected elements to the available list
	for (var i= 0; i < chosenBoxLength; i ++)  {
		var itemIdAndNamePair = chosenBox.options[i].value;
		var itemIdAndNameArray = itemIdAndNamePair.split(":");

		
		// Only add the removed tool back to the available box if it's selected 
		// OR if either we're ignoring category filtering, or the category name is actually correct. 
		if (chosenBox.options[i].selected && ((!this.usesCategoryFiltering) ||    ((this.usesCategoryFiltering) && (itemIdAndNameArray[1] == categoryName)))) {
			// Create a new option object
			var newToolOption = new Option((chosenBox.options[i].text), itemIdAndNamePair);

			// Add this element to the end of the group list box
			availableBox.options[availableBox.length] = newToolOption;
		}
		
	}
	// Remove selected elements from group list
	for (var i=0; i<chosenBoxLength; i++) {
		if (chosenBox.options[i].selected) {
			// Remove the selected option from the available list
			chosenBox.options[i] = null;
			i--;
			chosenBoxLength--;
		}
	}

	// Now check the buttons
	this.checkButtons(formObj);
}

TransferBoxManager.prototype.postChosenItemsList = function(formObj)  {	
	// Loop through to concat the tool names together
	// Format is optionText|value*optionText|value, etc
	var chosenBox = formObj.chosen_items;
	var toolList = "";
	for (var i=0; i < chosenBox.length; i++) {
		var seperator = (i==0)?"":"*";
		toolList += seperator + chosenBox.options[i].text + "|" + chosenBox.options[i].value;
	}

	formObj.chosenItemsAddList.value = toolList;

	return true;
}


TransferBoxManager.prototype.checkButtons = function(formObj) {
	// Loop through the available node box and the member node boxes and
	// see if they have anything selected. If no selections, disable the appropriate button
	var availableBox = formObj.available_items;
	var chosenBox = formObj.chosen_items;
	someAvailableSelected = false;
	someChosenSelected    = false;
	
	for (var i = 0; i < availableBox.length; i++) {
		if (availableBox.options[i].selected) someAvailableSelected = true;
	}
	for (i = 0; i < chosenBox.length; i++) {
		if (chosenBox.options[i].selected) someChosenSelected = true;
	}

	if (someAvailableSelected)  {
		ourButtonManager.enableButton(formObj.addButton)
		if (formObj.sortUpButton) {
			ourButtonManager.enableButton(formObj.sortUpButton);
			ourButtonManager.enableButton(formObj.sortDownButton);
		}
	}
	else {
		
		ourButtonManager.disableButton(formObj.addButton);
		if (formObj.sortUpButton) {
			ourButtonManager.disableButton(formObj.sortUpButton);
			ourButtonManager.disableButton(formObj.sortDownButton);
		}
	}
		
	if (someChosenSelected)	{
		ourButtonManager.enableButton(formObj.removeButton);
		if (formObj.sortUpButton) {
			ourButtonManager.enableButton(formObj.sortUpButton);
			ourButtonManager.enableButton(formObj.sortDownButton);
		}
	}
	else {
		ourButtonManager.disableButton(formObj.removeButton);
		if (formObj.sortUpButton) {
			ourButtonManager.disableButton(formObj.sortUpButton);
			ourButtonManager.disableButton(formObj.sortDownButton);
		}
	}

	
}
	
TransferBoxManager.prototype.swapChosenItems = function(chosenBox,selectedItemIndex,unselectedItemIndex) {
	var selectedItem = chosenBox.options[selectedItemIndex];
	var unselectedItem = chosenBox.options[unselectedItemIndex];
	var tempLabel = selectedItem.innerHTML;
	var tempValue = selectedItem.value;

	selectedItem.innerHTML = unselectedItem.innerHTML;
	selectedItem.value = unselectedItem.value;
	
	unselectedItem.innerHTML= tempLabel;
	unselectedItem.value = tempValue;
	selectedItem.selected = false;
	unselectedItem.selected = true;
}
TransferBoxManager.prototype.moveSelectedChosenItems = function(formObj,moveUp) {
	var chosenBox = formObj.chosen_items;
	var listOfSelectedIndices = [];
	var selectedIndexHash = [];
	
	for (var i=0; i < chosenBox.length; i++) {
		selectedIndexHash[i] = false;
		if (chosenBox.options[i].selected) {	 
			listOfSelectedIndices[listOfSelectedIndices.length]=i;
			selectedIndexHash[i] = true;
		}
	}
	// cant just simply swap them one by one.  too many cases where this leads to bugs with multiple selection. 
	// so, 
	// if sorting up,  start with lower indices, 
	// IF the index is !=1, and the one you're swapping with is not one of the indices itself,   swap each item up. 
	
	if (moveUp) {
		for (var i=0; i<listOfSelectedIndices.length;i++) {
			// can only move it up if it's not already at the top. 
			if (listOfSelectedIndices[i]!=0) {
				// can only move it up if the one above it is not also selected.  
				if (selectedIndexHash[listOfSelectedIndices[i]-1]!=true) {
					this.swapChosenItems(chosenBox,listOfSelectedIndices[i],listOfSelectedIndices[i]-1);
					selectedIndexHash[listOfSelectedIndices[i]]=false;
					selectedIndexHash[listOfSelectedIndices[i]-1]=true;
				}
			}
		}
	}
	else {
		// sorting down, so go through backwards. 
		for (var i=listOfSelectedIndices.length-1; i>=0;i--) {
			// can only move it down if it's not already at the bottom. 
			if (listOfSelectedIndices[i]!=selectedIndexHash.length-1) {
				
				// can only move it up if the one below it is not also selected.  
				if (selectedIndexHash[listOfSelectedIndices[i]+1]!=true) {
				
					this.swapChosenItems(chosenBox,listOfSelectedIndices[i],listOfSelectedIndices[i]+1);
					selectedIndexHash[listOfSelectedIndices[i]]=false;
					selectedIndexHash[listOfSelectedIndices[i]+1]=true;
				}
			}
		}
	}
}
function transferBox_resetAvailableItems(id,availableItems) {
	if (ourTransferBoxManager) ourTransferBoxManager.resetAvailableItems(id,availableItems);
	
}




