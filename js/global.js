
// this function will patch a click method onto anchor elements for Mozilla. Due apparently to confusion in the early DOM spec, anchor elements in mozilla are missing click methods. This will attach a click method to HTMLElement so that all elements, being descendants of this object will inherit it if they dont have one of their own. 
if (!document.all) {
  try {
		document.createElement('a');
		HTMLElement.prototype.click = function () {
			if (typeof this.onclick == 'function') {
				if (this.onclick({type: 'click'}) && this.href) 
					window.open(this.href, this.target ? this.target : '_self');
			}
			else if (this.href)
				window.open(this.href, this.target ? this.target : '_self');
		}
	}
	catch (e) {
		window.status='Warning: your browser is unable to attach click methods to all elements.';
	}
}



// only for use with absolute positioned elements. 
function mouseIsOverAbsElement(obj) {
	if ((mouseX < obj.offsetLeft) || (mouseX > obj.offsetLeft + obj.offsetWidth)) return false;
	else if ((mouseY < obj.offsetTop) || (mouseY > obj.offsetTop + obj.offsetHeight)) return false;
	else return true;
}
function mouseTracker(e) {
	mouseX = (document.all) ? window.event.x : e.pageX;
	mouseY = (document.all) ? window.event.y : e.pageY;
}

window.onmousemove = mouseTracker;
var mouseX = 0;
var mouseY = 0;


function globalComponentInit() {
	if (typeof(ButtonManager)!="undefined") {
		ourButtonManager = new ButtonManager();
		ourButtonManager.init();
	}
	if (typeof(TransferBoxManager)!="undefined") {
		ourTransferBoxManager = new TransferBoxManager();
		ourTransferBoxManager.init();
	}
	if (typeof(DropdownMenuManager)!="undefined") {
		ourDropdownMenuManager = new DropdownMenuManager();
		ourDropdownMenuManager.init();
		document.onmousedown= dropdownMenuManager_clearMenus;
	}
	if (typeof(NavigationControlManager)!="undefined") {
		ourNavigationControlManager = new NavigationControlManager();
		ourNavigationControlManager.init();
	}
	if (typeof(TabManager)!="undefined") {
		ourTabManager = new TabManager();
		ourTabManager.init();
	}
	if (typeof(TableManager)!="undefined") {
		ourTableManager = new TableManager();
		ourTableManager.init();
	
		
		tableManager_windowResize();
		// to disable the default behaviour that ctrl-clicks selects a whole word. 
		// Ctrl-click within hp applications has a special meaning. 
		if (document.all) {					
			document.onselectstart = function() {var ctrlKey = (document.all) ? window.event.ctrlKey :mozEvent.ctrlKey;if (ctrlKey)return false;}
		}
	}
	if (typeof(TreeManager)!="undefined") {
		ourTreeManager = new TreeManager();
		ourTreeManager.init();
	}
	if (typeof(TreeTableManager)!="undefined") {
		ourTreeTableManager = new TreeTableManager();
		ourTreeTableManager.init();
	}	
}

var ourButtonManager = null;
var ourTransferBoxManager = null;
var ourDropdownMenuManager = null;
var ourNavigationControlManager = null;
var ourTabManager = null;
var ourTableManager = null;
var ourTreeManager = null;
var ourTreeTableManager = null;



function dF(foo) {
	document.debugform.debugtext.value += foo + "\n";
}

// a little global function that returns a reasonably cross-browser reference to the originating object of the given mozEvent. 
function getEventOriginator(mozEvent) {
	return (document.all) ?  event.srcElement : mozEvent.target;
}

// attaches event handlers that various components need, without destroying the application's own event handlers in the process.
function reconcileEventHandlers() {
	if (window.onload) {   // some onload code has been placed into the body tag, or some function assigned to window.onload, before this function was called.
		// capture it as a function object, assign it to a var. 
		var applicationLevelOnload = window.onload;  		
		// execute our globalComponentInit, then execute the function object holding the other onload code. 
		eval("window.onload = function() {globalComponentInit();var applicationLevelOnload="+applicationLevelOnload+";applicationLevelOnload()}");
	}
	else { // window.onload is still untouched when this function gets called. 
		window.onload = globalComponentInit;
	}

	if (typeof(TableManager)!="undefined") {
		
		if (window.onresize) {
			var applicationLevelOnresize = window.onresize;
			eval("window.onresize = function() {tableManager_windowResize();var applicationLevelOnresize="+applicationLevelOnresize+";applicationLevelOnresize();}");
		}
		else { // window.onload is still untouched when this function gets called. 
			window.onresize = tableManager_windowResize;
		}
	}
}
// some implementations where classNames need to be changed may have multiple class selectors in their classname.  This will add a classname as a class selector, if it is not already present, and without deleting other unrelated classnames that might be present. 
function appendClassName(obj, newClassName) {
	if (obj.className.indexOf(newClassName)!=-1) return true;
	if (!obj.className) obj.className = newClassName;
	else obj.className = obj.className + " " + newClassName;
}
function removeClassName(obj, classNameToRemove) {
	var newClassName = obj.className.replace(" "+classNameToRemove,"");
	newClassName = newClassName.replace(classNameToRemove+" ","");
	if (obj.className.length == newClassName.length) {
		newClassName = newClassName.replace(classNameToRemove,"");
	}
	obj.className = newClassName;
}
