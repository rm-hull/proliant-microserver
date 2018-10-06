
function NavigationControlManager() {
	
}
NavigationControlManager.prototype.init = function() {
	var divs = document.getElementsByTagName("DIV");
	for (var i=0;i<divs.length;i++) {
		if (divs[i].className=="navigationControlSet") {
			var navigationControls = divs[i].getElementsByTagName("DIV")
			for (var j=0;j<navigationControls.length;j++) {
				navigationControls[j].childNodes[0].onclick = function(){ourNavigationControlManager.highlightItem(this);};
			}
		}
	}
}

NavigationControlManager.prototype.highlightItem = function(obj) {

	var lookingForWrapper = obj
	while ((lookingForWrapper) && (lookingForWrapper.className!="navigationControlSet")) {
		lookingForWrapper = lookingForWrapper.parentNode;
	}
	
	if (lookingForWrapper) {
		var navigationControls = lookingForWrapper.getElementsByTagName("DIV");
		for (var i=0;i<navigationControls.length;i++) {
			if (navigationControls[i]==obj.parentNode) {
				navigationControls[i].className = "navigationControlOn";
			}
			else {			
				navigationControls[i].className ="navigationControlOff";
			}
		}
	}
}

