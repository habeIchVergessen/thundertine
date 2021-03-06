/*

Copyright (C) 2010 by Santa Noel

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; version 2
of the License ONLY.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

*/

var helper = {

  doEvaluateXPath: function (aNode, aExpr) {  
	var xpe = new XPathEvaluator(); 
	try { 
		var nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ?  
		aNode.documentElement : aNode.ownerDocument.documentElement);  
		var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);  
		var found = [];  
		var res;  
		while ((res = result.iterateNext()) != null) // to avoid warnings  
			found.push(res);  
		return found;  
	}
	catch (err) {
		helper.prompt("DOM Error \n\n" + err);
		return undefined;
	}
  },

  domStr: function(dom) {
	var serializer = new XMLSerializer();
	var retStr = serializer.serializeToString(dom);
	return retStr;
  },

  dom2file: function(filename, dom) {
	var serializer = new XMLSerializer();
	var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
		.createInstance(Components.interfaces.nsIFileOutputStream);
	var file = Components.classes["@mozilla.org/file/directory_service;1"]
		.getService(Components.interfaces.nsIProperties)
		.get("ProfD", Components.interfaces.nsILocalFile); // get profile folder
	file.append(filename); // set file name
	foStream.init(file, 0x02 | 0x08 | 0x20, parseInt('0664',8), 0);   // write, create, truncate
		serializer.serializeToStream(dom, foStream, "");
	foStream.close();
  },

  file2dom: function(filename) {
	//devTools.enter('helper', 'file2dom', 'filename: ' + filename);
	var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"]
		.createInstance(Components.interfaces.nsIFileInputStream); 
	 var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"]  
		.createInstance(Components.interfaces.nsIConverterInputStream);
	var file = Components.classes["@mozilla.org/file/directory_service;1"]
		.getService(Components.interfaces.nsIProperties)
		.get("ProfD", Components.interfaces.nsILocalFile); // get profile folder
	try {
		file.append(filename); // set file name
		fstream.init(file, 0x01, parseInt('0444',8), 0);
		cstream.init(fstream, "UTF-8", 0, 0);
		var data;
		let (str = {}) {  
			cstream.readString(-1, str); // read the whole file and put it in str.value  
			data = str.value;  
		}  
		cstream.close();
		fstream.close();
	} catch(e) {
		//devTools.leave('helper', 'file2dom', 'exception: ' + e);
		return false;
	}
	var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
		.createInstance(Components.interfaces.nsIDOMParser); 
	//devTools.leave('helper', 'file2dom');
	return parser.parseFromString(data, "text/xml"); 
  }, 

  prompt: function(txt) {
    if (config.fullSilence==true) {
      Components.utils.reportError(txt);
    } else {
      var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                    .getService(Components.interfaces.nsIPromptService);
      promptService.alert(window, ttine.strings.getString("messageTitle"), txt);
    }
  },

  promptInput: function(txt, input) {
      var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                         .getService(Components.interfaces.nsIPromptService);

      var check = {value: false};
	  return promptService.prompt(window, ttine.strings.getString("messageTitle"), txt, input, null, check);
  },

  ask: function(txt) {
    var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                  .getService(Components.interfaces.nsIPromptService);
    return promptService.confirm(window, ttine.strings.getString("messageTitle"), txt);
  },

  askYesNo: function(txt) {
	    var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	                                  .getService(Components.interfaces.nsIPromptService);

	    var bFlag = (promptService.BUTTON_POS_0) * (promptService.BUTTON_TITLE_YES) + (promptService.BUTTON_POS_1) * (promptService.BUTTON_TITLE_NO);
	    var result = promptService.confirmEx(window, ttine.strings.getString("messageTitle"), txt, bFlag, null, null, null, null, { 'value': false });
	    return (result == 0);
  },

  unescapeNodeValue: function(nodeValue) {
	var result = nodeValue;

	if (result != undefined) {
		result = result.replace(/&lt;/g, '<');
		result = result.replace(/&gt;/g, '>');
		result = result.replace(/&amp;/g, '&');
	}

	return result;
  },

  // The following functions are only for the ease of development. 
  // They have no functional sense.
  debugDom: function(dom) {
	if (dom == null) {
		alert('Dom is empty!');
		return null;
	}

	var serializer = new XMLSerializer();
	var pretty = null;
	try {
		pretty = serializer.serializeToString(dom);
	} catch (err) {
		pretty = "This is not a DOM structure!\n\n"+err;
	}
	alert(pretty); 
	return null;
  },

  debugOut: function(data) {
	var file = Components.classes["@mozilla.org/file/directory_service;1"]
		.getService(Components.interfaces.nsIProperties)
		.get("ProfD", Components.interfaces.nsILocalFile); // get profile folder
	file.append('debug.out');
	var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
		.createInstance(Components.interfaces.nsIFileOutputStream);
	foStream.init(file, 0x02 | 0x08 | 0x20, parseInt('0664',8), 0);   // write, create, truncate
		foStream.write(data, data.length);
	foStream.close();
  },

  showExtraFields: function(uri) {
	var res = '';

	let abManager = Components.classes["@mozilla.org/abmanager;1"]
		.getService(Components.interfaces.nsIAbManager);

	let addressBook = abManager.getDirectory(uri);
	let cards = addressBook.childCards;
	while (cards.hasMoreElements()) { 
		let card = cards.getNext();
		if (!(card instanceof Components.interfaces.nsIAbCard))
			continue;
		
		res = res + card.getProperty("DisplayName", "")+"\n";
		res = res + card.getProperty("TineSyncId", "")+"\n";
		res = res + card.getProperty("TineSyncMD5", "")+"\n";
		res = res + card.getProperty("PhotoURI", "")+"\n";
		res = res + card.getProperty("PhotoType", "")+"\n";
		res = res + card.getProperty("PhotoName", "")+"\n";
		res = res + "==============================================\n";
	}

	alert(res);
  }

};
