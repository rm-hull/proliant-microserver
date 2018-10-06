

function TreeManager() {
	treeWrapperIds = new Array();
}

TreeManager.prototype.init = function() {
	var divs = document.getElementsByTagName("DIV");

	for (var i=0;i<divs.length;i++) {
		// first we deal with some things on entire treeWrappers, like scripting for tree links and checkboxes. 
		if (divs[i].className.indexOf("treeWrapper")!=-1) {

			// Dealing with the links within this particular treeWrapper div. 
			var linkNodes = divs[i].getElementsByTagName("A");
			for (var j=0; j<linkNodes.length; j++) {
				// we associate highlighting with clicks on a node's link ONLY if that link is of class treeSelectableLink
				if (linkNodes[j].className=="treeSelectableLink") {

					if (linkNodes[j].onclick) {
						// the diligent flag indicates that highlight state should not change if the link's onclick returns false.
						if (linkNodes[j].getAttribute("diligent") == "yes") {
							eval("linkNodes[j].onclick = function(mozEvent) {var hardCodedFunction = "+linkNodes[j].onclick+" ;if (hardCodedFunction())ourTreeManager.makeTreeNodeHighlighted(this);}");
						}
						else {
							eval("linkNodes[j].onclick = function(mozEvent) {var hardCodedFunction = "+linkNodes[j].onclick+";ourTreeManager.makeTreeNodeHighlighted(this);return hardCodedFunction();}");
						}
					}
					else {
						linkNodes[j].onclick = function(mozEvent) {ourTreeManager.makeTreeNodeHighlighted(this);}
					}
				}
			}
			// Done with the links
			// Dealing with checkboxes within this treeWrapper div.
			var inputNodeCollection = divs[i].getElementsByTagName("input");
			for (var j=0; j<inputNodeCollection.length; j++ ) {
				
				if (inputNodeCollection[j].getAttribute('treeselector')=="yes") { 
					
					//  if this is loading from a user initiated page-refresh, thanks to a 'feature' in ie, checkbox state can be different from the element classnames as they were outputted originally at the server. 
					// the following says "if checkbox state and [match for one of the selected classnames]" are not either both true or both false.. 
					if ((inputNodeCollection[j].checked) != (inputNodeCollection[j].parentNode.parentNode.className =="treeOpenSelected")||(inputNodeCollection[j].parentNode.parentNode.className =="treeClosedSelected")) {
						
						// if this input is within a node with it's own disclosure control, then we need to pass in the treeOpen or treeClosed div containing it.   Otherwise, this is a leaf node and we need to pass in the leafWrapper node, which is one more level of nesting above where the treeOpen/treeClosed would be.  
						relevantTreeNode  = inputNodeCollection[j].parentNode.parentNode;
						if (relevantTreeNode.className=="leafWrapper") {	
							ourTreeManager.toggleCheckboxHighlight(null,relevantTreeNode,false);
						}
						else {
							ourTreeManager.toggleCheckboxHighlight(null,relevantTreeNode.parentNode,false);
						}
					}
	
					// both of these result in the same data going into tableRowHighlightToggle, although the event will have different srcElement/currentTarget.  
					
					if (inputNodeCollection[j].parentNode.parentNode.className == "treeControl") {
						inputNodeCollection[j].onclick = function(mozEvent) {ourTreeManager.toggleCheckboxHighlight(mozEvent,this.parentNode.parentNode.parentNode,true);};
						
		
						var lookingForTreeTitle = inputNodeCollection[j].parentNode.parentNode.parentNode;
						for (var k=0;k<lookingForTreeTitle.childNodes.length;k++) {
							if (lookingForTreeTitle.childNodes[k].className =="treeTitle") {
								lookingForTreeTitle = lookingForTreeTitle.childNodes[k];
							}
						}
						var lookingForTreeControl = inputNodeCollection[j].parentNode.parentNode.parentNode;
						for (var k=0;k<lookingForTreeControl.childNodes.length;k++) {
							if (lookingForTreeControl.childNodes[k].className =="treeControl") {
								lookingForTreeControl = lookingForTreeControl.childNodes[k];
							}
						}


						lookingForTreeTitle.onclick = function(mozEvent) {ourTreeManager.toggleCheckboxHighlight(mozEvent,this.parentNode,true);};
						lookingForTreeControl.onclick = function(mozEvent) {ourTreeManager.toggleCheckboxHighlight(mozEvent,this.parentNode,true);};
						
					}
				
				
					else if ((inputNodeCollection[j].parentNode.parentNode.className == "leafWrapper") || (inputNodeCollection[j].parentNode.parentNode.className == "leafWrapperSelected")) {
						inputNodeCollection[j].onclick = function(mozEvent) {ourTreeManager.toggleCheckboxHighlight(mozEvent,this.parentNode.parentNode,true);};
						inputNodeCollection[j].parentNode.parentNode.onclick = function(mozEvent) {ourTreeManager.toggleCheckboxHighlight(mozEvent,this,true);};
					}
				}
			}
			// now we have to look for the masterCheckbox, if there is one. This is the only element of a tree that can be present outside of the TreeWrapper structure, hence we cant reach it with our normal approach of treeWrapper.getElementsByTagName("input")
			var masterCheckbox = document.getElementById(divs[i].getAttribute("id")+"_masterCheckbox");
			if (masterCheckbox) {
				masterCheckbox.onclick = function(){ourTreeManager.selectAllCheckboxes(this);}
			}
		}
		else if (
				(divs[i].className == "treeOpen")    ||
				(divs[i].className == "treeClosed")  ||
				(divs[i].className == "treeOpenSelected")  ||
				(divs[i].className == "treeClosedSelected")
			) {
			var tree = divs[i];
			// we will soon get this holding a reference to the "treeDisclosure" div that serves as our expand/collapse control. 
			var treeDisclosure = null;
			
			/* first look for the "treeControl" class */
			for (var j=0;j<tree.childNodes.length;j++) {
				if ((tree.childNodes[j].nodeType==1) && (tree.childNodes[j].className=="treeControl")) {
					treeDisclosure = tree.childNodes[j];
				}
			}
			/* Then look for the treeDisclosure element within the treeControl. TreeControl can also contain treeStatusIcon and treeCheckbox divs */
			for (var j=0;j<treeDisclosure.childNodes.length;j++) {
				if ((treeDisclosure.childNodes[j].nodeType==1) && (treeDisclosure.childNodes[j].className=="treeDisclosure")) {
					treeDisclosure = treeDisclosure.childNodes[j];
				}
			}

			

			// DEALING WITH THE TREECONTROL ITSELF
			if (treeDisclosure.onclick) {
				eval("treeDisclosure.onclick = function(mozEvent) {var hardCodedFunction = "+treeDisclosure.onclick+" ;ourTreeManager.toggleTree(mozEvent,this);hardCodedFunction();};");
			}
			else {
				eval("treeDisclosure.onclick = function(mozEvent) {ourTreeManager.toggleTree(mozEvent,this);};");
			}	
		}
	}	
}
// treeElement will always be either 
// a)  div of class treeOpen or treeClosed (or treeOpenSelected, etc.)
// b)  div of class leafWrapper

// onclick will run twice in some cases, which is why we have this checkOrigination boolean. this boolean is true when the function is run from a user click, but false if it is run during init, or during the selectAllCheckboxes function
TreeManager.prototype.toggleCheckboxHighlight = function (mozEvent,treeElement,checkOrigination) {
	var eventSource;
	
	if (checkOrigination) {
		eventSource = (document.all)?  event.srcElement : mozEvent.target;
		try {
			if (
					(eventSource.tagName == "INPUT") && ((eventSource.getAttribute("treeselector")!="yes") )&& ((eventSource.getAttribute("treeselector")!="yes") )
				|| (eventSource.tagName == "A")	
				|| (eventSource.tagName == "IMG")	
				|| (eventSource.className == "treeDisclosure")	
			) {
				return false;
			}
		}
		catch(e) {alert(e)}
	}
	
	

	var lookingForCheckbox = treeElement;
	// at the end of these for loops, we will have a reference to the checkbox element.
	for (var i=0;i<lookingForCheckbox.childNodes.length; i++) {
		if (lookingForCheckbox.childNodes[i].className == "treeControl")	lookingForCheckbox = lookingForCheckbox.childNodes[i];
	}
	for (var i=0;i<lookingForCheckbox.childNodes.length; i++) {
		if (lookingForCheckbox.childNodes[i].className == "treeCheckbox")	lookingForCheckbox = lookingForCheckbox.childNodes[i];
	}
	for (var i=0;i<lookingForCheckbox.childNodes.length; i++) {
		if (lookingForCheckbox.childNodes[i].tagName == "INPUT")	lookingForCheckbox = lookingForCheckbox.childNodes[i];
	}
	
	
	var ourTreeCheckbox = lookingForCheckbox;



	// if the event originates from the checkbox itself, it will already have handled it's own state change. 
	if ((checkOrigination)&&((!eventSource)||(eventSource.tagName != "INPUT")))	{
		ourTreeCheckbox.checked = !ourTreeCheckbox.checked;
	}

	// change classname to the selected version. 
	if (ourTreeCheckbox.checked) {
		if (treeElement.className == "leaf")  treeElement.className = "leafSelected";
		else if (treeElement.className == "treeOpen")  treeElement.className = "treeOpenSelected";
		else if (treeElement.className == "treeClosed")  treeElement.className = "treeClosedSelected";
		else if (treeElement.className == "leafWrapper")  treeElement.className = "leafWrapperSelected";	
	}
	else {
		if (treeElement.className == "leafSelected")  treeElement.className = "leaf";
		else if (treeElement.className == "treeOpenSelected")  treeElement.className = "treeOpen";
		else if (treeElement.className == "treeClosedSelected")  treeElement.className = "treeClosed";
		else if (treeElement.className == "leafWrapperSelected")  treeElement.className = "leafWrapper";	
	}
}

TreeManager.prototype.selectAllCheckboxes	= function(masterCheckbox) {
	var treeId = masterCheckbox.getAttribute("id").replace("_masterCheckbox","");
	var treeObj = document.getElementById(treeId);
	var inputNodeCollection = treeObj.getElementsByTagName("input");
	
	for (var i=0; i<inputNodeCollection.length; i++ ) {
		// only want checkboxes, not textfields and radios
		
		if (inputNodeCollection[i].getAttribute('type') == "checkbox")  {
			
			if (masterCheckbox.checked != inputNodeCollection[i].checked) {
				if (inputNodeCollection[i].getAttribute("treeselector")=="yes") {
					inputNodeCollection[i].checked = !inputNodeCollection[i].checked;
					var relevantTreeElement =inputNodeCollection[i].parentNode.parentNode;

					if (relevantTreeElement.className=="treeControl") {
						relevantTreeElement = relevantTreeElement.parentNode;
					}
					this.toggleCheckboxHighlight(null,relevantTreeElement,false);
					
				}
			}
		}
	}
}
TreeManager.prototype.toggleTree = function(mozEvent,treeControl) {
	
	var treeObject = treeControl.parentNode;

	if (treeControl.className == "treeDisclosure") {
		treeObject = treeControl.parentNode.parentNode;
	}
	if (treeObject.className == "treeClosed") {
		treeObject.className = "treeOpen";
	}
	else if (treeObject.className == "treeClosedSelected") {
		treeObject.className = "treeOpenSelected";
	}
	else if (treeObject.className == "treeOpenSelected") {
		treeObject.className = "treeClosedSelected";
	}
	else {	
		treeObject.className = "treeClosed"
	}
}

TreeManager.prototype.openAllTrees = function(wrapperId) {
	var wrapperDiv = document.getElementById(wrapperId);
	var childDivs = wrapperDiv.getElementsByTagName("div");
	for (var i=0;i<childDivs.length;i++) {
		if (childDivs[i].className == "treeClosed"){
			childDivs[i].className = "treeOpen";
		}
		else if (childDivs[i].className == "treeClosedSelected"){
			childDivs[i].className = "treeOpenSelected";
		}
	}
}

TreeManager.prototype.closeAllTrees = function(wrapperId) {
	var wrapperDiv = document.getElementById(wrapperId);
	var childDivs = wrapperDiv.getElementsByTagName("div");
	for (var i=0;i<childDivs.length;i++) {
		if (childDivs[i].className == "treeOpen"){
			childDivs[i].className = "treeClosed";
		}
		else if (childDivs[i].className == "treeOpenSelected"){
			childDivs[i].className = "treeClosedSelected";
		}
	}
}
TreeManager.prototype.openSpecificTreeNode = function(id) {
	var walkingNode = document.getElementById(id); 
	
	while( walkingNode.parentNode) {	
		if (walkingNode.className== "treeClosed"){
			walkingNode.className = "treeOpen";
		}
		walkingNode = walkingNode.parentNode;
	}
}

// used for Navigation highlighting. Not used for checkbox highlighting
TreeManager.prototype.makeTreeNodeHighlighted = function(treeLink) {
	
	if (treeLink.parentNode.tagName=="B") treeLink = treeLink.parentNode;
	
	var parentClassName = treeLink.parentNode.className;
	var grandparentClassName = treeLink.parentNode.parentNode.className;
	// true if the treeSelectable link is within a treeTitle
	if ((grandparentClassName == "treeOpen")  || (grandparentClassName == "treeClosed") ) {
		this.unHighlightAllTreesExceptOne(treeLink.parentNode.parentNode);
	}
	// true if the treeSelectable link is within a leaf. 
	else if (parentClassName == "leaf") {
		this.unHighlightAllTreesExceptOne(treeLink.parentNode);
	}
}
TreeManager.prototype.makeSpecificTreeNodeHighlighted = function(id) {
	this.openSpecificTreeNode(id);
	var treeNode = document.getElementById(id);
	var linkNode = (treeNode.childNodes[0].tagName=="B") ? treeNode.childNodes[0].childNodes[0] : treeNode.childNodes[0]; 
	 
	this.makeTreeNodeHighlighted(linkNode);
}
TreeManager.prototype.unHighlightAllTreesExceptOne = function(highlightedTree) {
	var walkingNode = highlightedTree;
	while((walkingNode.className !=  "treeWrapper") && (walkingNode.className !=  "treeHasOneIconSpacing") && (walkingNode.className !=  "treeHasTwoIconSpacing") && ( walkingNode.parentNode)) {
		walkingNode = walkingNode.parentNode;
	}
	var divNodes = walkingNode.getElementsByTagName("DIV");
	for (var i=0; i<divNodes.length; i++) {	
		if (divNodes[i] ==  highlightedTree) {
			if (divNodes[i].className == "leaf")  divNodes[i].className = "leafSelected";
			else if (divNodes[i].className == "treeOpen")  divNodes[i].className = "treeOpenSelected";
			else if (divNodes[i].className == "treeClosed")  divNodes[i].className = "treeClosedSelected";
			else if (divNodes[i].className == "leafWrapper")  {
				divNodes[i].className = "leafWrapperSelected";
			}
		}
		else {
			if (divNodes[i].className == "leafSelected")  divNodes[i].className = "leaf";
			else if (divNodes[i].className == "treeOpenSelected")  divNodes[i].className = "treeOpen";
			else if (divNodes[i].className == "treeClosedSelected")  divNodes[i].className = "treeClosed";
			else if (divNodes[i].className == "leafWrapperSelected")  divNodes[i].className = "leafWrapper";
		}
	}
}

TreeManager.prototype.resizeTreeContainerTo = function(id,width,height) {
	var treeContainerDiv = document.getElementById(id);
	treeContainerDiv.style.width = width;
	treeContainerDiv.style.height = height;
}

TreeManager.prototype.resizeTreeContainerBy = function(id,dWidth,dHeight) {
	var treeContainerDiv = document.getElementById(id);
	if (treeContainerDiv.offsetWidth + dWidth > 0 ) {
		treeContainerDiv.style.width = treeContainerDiv.offsetWidth + dWidth;
	}
	else treeContainerDiv.style.width = 1;

	if (treeContainerDiv.offsetHeight + dHeight > 0) {
		treeContainerDiv.style.height = treeContainerDiv.offsetHeight + dHeight;
	}
	else treeContainerDiv.style.height = 1;
}
