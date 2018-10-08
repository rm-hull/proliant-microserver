


function TableManager() {
	// a global var holding a roster of all scrollableTables onscreen. Used in windowResize, for the following reason.  If a tableis scrolled horizontally, and the window is widened, you basically need this to realign the columns as the table is sort of unscrollbarring itself.  onscroll on the div will not fire for us, although you might think it should. 
	this.scrollableTableIds = new Array();
}


TableManager.prototype.init = function() {
	tableNodeCollection = window.document.getElementsByTagName("table");

	// dealing with scrollingTables
	for (var i=0; i<tableNodeCollection.length; i++ ) {
		if (tableNodeCollection[i].className.indexOf("scrollingTable")!=-1) {
			var tableId = tableNodeCollection[i].getAttribute('id');
			// file it away for use by the windowResize function
			this.scrollableTableIds[this.scrollableTableIds.length] = tableId;
			// this is the big function that aligns the divs with the table columns
			tableNodeCollection[i].initialWidth = tableNodeCollection[i].offsetWidth;
			this.resizeTableColumns(tableId);
			// a nice way to leverage anonymous functions to allow us to keep event handler code out of the html. A nice side effect is that event handlers arent in place until the page is loaded, at which point they generally also become safe to run.
			eval("document.getElementById(tableId + '_scrollingTableDiv').onscroll=function() {ourTableManager.slideColumns('"+tableId+"')}");
		}
	}

	// dealing with tables that have 'select all' checkboxes.
	inputNodeCollection = window.document.getElementsByTagName("input");
	var chk;
	for (var i=0; i<inputNodeCollection.length; i++ ) {
		if (inputNodeCollection[i].getAttribute('tableid')) {
			chk = inputNodeCollection[i];
			var tableId = chk.getAttribute("tableid");
			if (tableId) {
				eval("chk.onclick = function(mozEvent) {ourTableManager.tableCheckboxToggleAll(mozEvent,this,'"+ tableId +"');};");
			}
			else alert('error: table has checkbox but checkbox has no tableid');
		}
		if (inputNodeCollection[i].getAttribute('rowselector')=="yes") { 

			//  if this is loading from a refresh rather than a load, or if an application has been implemented too quickly, radio or checkbox state might be different from the classnames as they came down from the server. 
			if (((inputNodeCollection[i].checked) || (inputNodeCollection[i].value=="1")) && (inputNodeCollection[i].parentNode.parentNode.className.indexOf("rowHighlight")==-1)) {
				appendClassName(inputNodeCollection[i].parentNode.parentNode, "rowHighlight");
			}
			else if (((!inputNodeCollection[i].checked) && (inputNodeCollection[i].value!="1")) && (inputNodeCollection[i].parentNode.parentNode.className.indexOf("rowHighlight")!=-1)) {
				removeClassName(inputNodeCollection[i].parentNode.parentNode,"rowHighlight");
				
			}


			// both of these result in the same data going into tableRowHighlightToggle, although the event will have different srcElement/currentTarget.  
			inputNodeCollection[i].onclick = function(mozEvent) {ourTableManager.tableRowHighlightToggle(mozEvent,this.parentNode.parentNode,true);};

			var checkingForPropertyViewTable = inputNodeCollection[i].parentNode;
			var isPropertyViewTable = false;
			while (checkingForPropertyViewTable.tagName!="TABLE") {
				checkingForPropertyViewTable = checkingForPropertyViewTable.parentNode;
			}
			if (checkingForPropertyViewTable.className.indexOf("propertyViewTable")!=-1)  isPropertyViewTable = true;
			
			inputNodeCollection[i].parentNode.parentNode.onclick = function(mozEvent) {return ourTableManager.tableRowHighlightToggle(mozEvent,this,true);};
			if (isPropertyViewTable) {
				
				if (!document.all) {	
					// an elegant way to disable ctrl-click on these elements for Mozilla browsers. 
					// IE unfortunately has to use less subtle methods, disabling all ctrl-selection by setting document.onselectstart to return false if CTRL key is pressed. This occurs in global.js if the TableManager is loaded. 
					inputNodeCollection[i].parentNode.parentNode.onmousedown = function(mozEvent) {return false;};
				}
			}
		}
	}
}

// Although in most cases of window resizing it's not necessary to recalculate column positions, if a table is partially scrolled horizontally, resizing the window can effectively scroll the div, and unfortunately in IE6 this does not trigger onscroll, so this amounts to a patch.
TableManager.prototype.windowResize = function() {
	for (var i=0; i<this.scrollableTableIds.length; i++) {
		this.slideColumns(this.scrollableTableIds[i]);
	}
}
// triggered by onclick on the master checkbox itself.  
TableManager.prototype.tableCheckboxToggleAll = function(mozEvent,masterCheckbox,uniqueTableId) {
	var tableNode = document.getElementById(uniqueTableId);
	
	
	inputNodeCollection = tableNode.getElementsByTagName("input");
	
	for (var i=0; i<inputNodeCollection.length; i++ ) {
		// only want checkboxes, not textfields and radios
		if (inputNodeCollection[i].getAttribute('type') == "checkbox")  {
			// careful not to toggle the masterCheckbox itself. 
			if (masterCheckbox != inputNodeCollection[i]) {
				// the checkbox is a rowSelector and not just some editable property checkbox.
				if (inputNodeCollection[i].getAttribute("rowselector")=="yes") {
					if (masterCheckbox.checked != inputNodeCollection[i].checked) {
						this.tableRowHighlightToggle(mozEvent,inputNodeCollection[i].parentNode.parentNode, false);
					}
				}
			}
		}
	}
}
// called by onclick on the table row.  This function will only be attached as an onclick handler to a row if either it contains a rowselector form element, or if the parent table is of class "propertyViewTable" 
TableManager.prototype.tableRowHighlightToggle = function(mozEvent,rowElement,checkOrigination) {
	var eventSource = getEventOriginator(mozEvent);

	// a list of various elements within tree rows upon which clicks should not toggle highlight state. 
	if ((eventSource.tagName=="IMG") ||
		(eventSource.tagName=="A") || ((eventSource.tagName=="DIV") && (eventSource.className=="treeControl"))) {
		return false;		
	}

	// the table node is used by the radio elements, which need to circle back onclick and change highlighting on other rows.
	// the other place it is used is in the Property View table, where presence of that "propertyViewTable" classname on the table must change the clicking interaction. 
	var tableNode = rowElement.parentNode;
	while (tableNode.tagName!= "TABLE") { tableNode = tableNode.parentNode }
	
	var isPropertyViewTable = (tableNode.className.indexOf("propertyViewTable")!=-1);


	// we will deal with state changes to the rowselector form elements.  (not highlighting, which is dealt with later in this function )
	inputNodeCollection = rowElement.getElementsByTagName("input");
	
	// obtaining a reference to the rowSelector element within the row.
	var ourRowSelectorFormElement;
	for (var i=0; i<inputNodeCollection.length; i++ ) {
		if (inputNodeCollection[i].getAttribute("rowselector")=="yes") {
			ourRowSelectorFormElement = inputNodeCollection[i];
		}
	}
	// only deal with the form element change if the click is not coming from the formElement itself. (in which case it will have taken care of its own state)
	if ((eventSource.tagName!="INPUT") || ( ( eventSource.tagName=="INPUT") && (eventSource.getAttribute("tableid")))) {
		// deals with cases where the click came from the row
		
		if (ourRowSelectorFormElement.getAttribute("type") == "checkbox") {
			// manually flip the checkbox. 
			ourRowSelectorFormElement.checked = !ourRowSelectorFormElement.checked;
		}
		if (ourRowSelectorFormElement.getAttribute("type") == "radio") {
			// manually flip the radio. 
			ourRowSelectorFormElement.checked = !ourRowSelectorFormElement.checked;
		}
		else if (ourRowSelectorFormElement.getAttribute("type") == "hidden") {
			if (ourRowSelectorFormElement.value == "1") ourRowSelectorFormElement.value=0;
			else ourRowSelectorFormElement.value = "1";
		}
	}



	// Dealing with the highlighting changes. 
	// class "propertyViewTable" tables have a significantly different interaction. 
	if (isPropertyViewTable) {
		var ctrlKey = (document.all) ? window.event.ctrlKey :mozEvent.ctrlKey;
		if (!ctrlKey) {
			var inputNodeCollection = tableNode.getElementsByTagName("INPUT");

			// go through all the inputs
			for (var j=0;j<inputNodeCollection.length;j++) {

				// only interested in rowselector, type="hidden" inputs. 
				if ((inputNodeCollection[j].getAttribute("type")=="hidden") && (inputNodeCollection[j].getAttribute("rowselector")=="yes")) {

					var tableRowNode = inputNodeCollection[j].parentNode;
					while (tableRowNode.tagName!= "TR") { tableRowNode = tableRowNode.parentNode; }
					
					// since CTRL is not pressed, we remove highlighting from all rows except the one clicked on.
					if (inputNodeCollection[j]!=ourRowSelectorFormElement)  {
						removeClassName(tableRowNode,"rowHighlight");
						inputNodeCollection[j].value = "0";
					}
					else {
						appendClassName(tableRowNode, "rowHighlight");	
					}
				}
			}
		}
		// Ctrl Key is pressed, which now allows multiple selection. In this case we only change highlighting for the row the user has clicked on.
		else {
			if (rowElement.className.indexOf("rowHighlight")!=-1) {
				removeClassName(rowElement,"rowHighlight");
				rowElement.value = "0";
			}
			else {
				appendClassName(rowElement,"rowHighlight");
				rowElement.value = "1";
			}
		}
	}
	
	// dealing with highlighting changes on radio or checkbox type Selectable Tables.  
	
	
	else {
		// if the rowselector is checked, highlight the row 
		if (ourRowSelectorFormElement.checked) {
			// dealing with checkboxes and hidden form fields. 
			if ((ourRowSelectorFormElement.getAttribute("type") == "checkbox") || (ourRowSelectorFormElement.getAttribute("type") == "hidden"))  {	
				appendClassName(rowElement,"rowHighlight");	
			}
			// dealing with radio buttons
			else {
				var inputNodeCollection = tableNode.getElementsByTagName("INPUT");
				for (var j=0;j<inputNodeCollection.length;j++) {

					if (inputNodeCollection[j].getAttribute("type")=="radio") {
						var tableRowNode = inputNodeCollection[j].parentNode.parentNode;

						if (!inputNodeCollection[j].checked)  {
							
							removeClassName(tableRowNode,"rowHighlight");	
						}
						else {
							appendClassName(tableRowNode,"rowHighlight");	
						}
					}
				}
			}
		}
		else {
			removeClassName(rowElement,"rowHighlight");
		}
	}
}


// this is only called once from init, and doesnt need to run again.  
TableManager.prototype.resizeTableColumns = function(tableId) {
	var tableDummyRow					= document.getElementById(tableId+"_dummyRow");
	var visualHeaderDivParent	= document.getElementById(tableId+"_headerDiv");
	var visualHeaderDiv				= visualHeaderDivParent.childNodes[0];
	var table								= document.getElementById(tableId);
	var tableScrollingDiv		= document.getElementById(tableId+"_scrollingTableDiv");

	var maxScreenDivHeight = 0;

	// this line is to workaround a mozilla bug with headerDiv height. This is set back to hidden after the resizing is completed
	visualHeaderDivParent.style.overflow = "scroll";

	// the purpose of this loop is to gently force various elements to wrap a little before table column sizes are reconciled with header sizes.
	for (var i=0; i<tableDummyRow.childNodes.length; i++) {
		// skip over text/whitespace nodes
		if (tableDummyRow.childNodes[i].nodeType==1)  {
			
			// forcing the table's cells to wrap a bit if they can.  Although many of these assignments will be refused by the table, they do have a good effect on cells that are very text-heavy. 
			if (document.all) {	
				tableDummyRow.childNodes[i].style.width = Math.floor(tableDummyRow.childNodes[i].offsetWidth*0.8);
			}

			// Conversely, forcing the header divs to wrap a bit. The way this is done is by crunching the outer div, which will cause some text in the inner div to possibly wrap (although it might be clipped by the outerdiv), and then having tricked the innerDiv into wrapping, set the outerdiv to the innerDiv's new offsetWidth, thus making the wrapping permanent.  particularly useful for mozilla
			visualHeaderDiv.childNodes[i].style.width =  Math.floor(visualHeaderDiv.childNodes[i].offsetWidth*0.8);;
			visualHeaderDiv.childNodes[i].style.width = visualHeaderDiv.childNodes[i].childNodes[0].offsetWidth;

			// keep track of the highest header. All heights will be set to this number after widths are dealt with.
			maxScreenDivHeight   = Math.max(maxScreenDivHeight,visualHeaderDiv.childNodes[i].offsetHeight);
		}
	}
	// the purpose of this loop is to normalize the widths of table columns with their respective header divs. 
	for (var i=0; i<tableDummyRow.childNodes.length; i++) {
		var tableColumnWidth  = tableDummyRow.childNodes[i].offsetWidth;
		var visualHeaderDivWidth   = visualHeaderDiv.childNodes[i].offsetWidth ;

		// skip over text/whitespace nodes
		if (tableDummyRow.childNodes[i].nodeType==1)  {

			// the case where the visual Header is wider than the table cells
			if (visualHeaderDivWidth > tableColumnWidth) {
				
				// we need to bump up the whole table's width property each time a column is changed. This will always increase the size of the table, never decrease it. background: if this is not done until the end, then some of the columns along the way would have refused to accept the larger widths. Although IE might do ok if this is omitted, mozilla does need it.
				var widthIncrement = visualHeaderDivWidth - tableColumnWidth;
				table.style.width = table.offsetWidth + widthIncrement; 
				
				// set the width of the div's within the column header cells.  background: if you try the straightforward approach of setting the width of the cells, the tableElement's constant desire to balance things against cell contents will occasionally rebuff you. This way, since you're making assignments to cell contents, the table has to listen. 
				tableDummyRow.childNodes[i].childNodes[0].style.width =   visualHeaderDivWidth - 10;				
			}
		}
		// again, skip over text/whitespace nodes. 
		if (visualHeaderDiv.childNodes[i].nodeType==1) {
			// the other side
			if (visualHeaderDivWidth < tableColumnWidth) {	
				visualHeaderDiv.childNodes[i].style.width = tableDummyRow.childNodes[i].offsetWidth;
			}
		}
	}
	// this loop is just to set the heights of the headerDivs so the borders extend down to the table edge.  This cannot be moved into the previous loop.
	for (var i=0; i<tableDummyRow.childNodes.length; i++) {
		if (visualHeaderDiv.childNodes[i].nodeType==1) {
			visualHeaderDiv.childNodes[i].style.height = maxScreenDivHeight +"px";
		}
	}
	

	// Need to set the visualHeaderDiv's width large enough so that the header divs can happily float next to eachother in a horizontal line. doesnt really matter how wide we make the visualHeaderDiv, since it's cropped behind the outer div anyway by virtue of the outerdiv's overflow:hidden. 
	visualHeaderDiv.style.width = table.offsetWidth+ 300;
	visualHeaderDiv.style.height= maxScreenDivHeight;
	visualHeaderDivParent.style.overflow = "hidden";
}


// this function is triggered by onscroll on the scrolling div.  the onscroll event handler is attached during init
TableManager.prototype.slideColumns = function(tableId) {
	var visualHeaderDivParent	= document.getElementById(tableId+"_headerDiv");
	var slidingColumnHeaders = visualHeaderDivParent.childNodes[0];
	var scrollingDiv	= document.getElementById(tableId+"_scrollingTableDiv");
	slidingColumnHeaders.style.left = -scrollingDiv.scrollLeft;
	var tableScrollingDiv		= document.getElementById(tableId+"_scrollingTableDiv");
	visualHeaderDivParent.style.width = tableScrollingDiv.offsetWidth;
}


function tableManager_windowResize() {
	ourTableManager.windowResize();
}