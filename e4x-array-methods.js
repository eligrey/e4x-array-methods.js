/*
* e4x-array-methods.js v0.1.3
*
* 2009-07-22
*
* By Elijah Grey, http://eligrey.com
*
* A library that implements every array method for XML lists.
* Requires E4X, array generics, and array extensions introduced in JavaScript 1.6
*
* License: GNU GPL v3 and the X11/MIT license
*   See http://eligrey.com/blog/about/license
*/

// This library is intended for making XML easier to use with server-side
// JavaScript environments based on (Spider|Trace|Action)Monkey and Rhino.

(function() {
	if (typeof XML == "undefined")
		return;
	
	function extendXMLproto(methods) {
		var XMLproto = XML.prototype;
		
		for (var method in methods)
			if (methods.hasOwnProperty(method))
				XML.prototype.function::[method] = methods[method]; // yes, this is valid JavaScript 1.6
	};
	
	function requireXMLList(xml, fnName) { // this is needed because XML inherits from XMLList (wtf?)
		var notXMLList = typeof xml != "xml"; // check if xml
		if (!notXMLList) notXMLList = !!xml.length(); // if 0, can only be XML list
		if (notXMLList) { // still maby an xmllist
			try {
				xml[0] = xml[0]; // throws error on all non-XML lists
				notXMLList = false;
			} catch (ex) {}
		}
		if (notXMLList)
			throw new TypeError(fnName + " can only be called on XML lists");
	};
	
	function requireFunCallback(fun) { // check if something is fun, er... a function
		if (typeof fun != "function") // boring un-fun non-function
			throw new TypeError("Callback is not a function");	
	};
	
	function toXMLString(x) {
		if (typeof x == "xml")
			return x.toXMLString();
		
		else return x;
	};
	
	extendXMLproto({
		// xmllist.push()
		// syntax: xmllist.push(xml1, ..., xmlN)
		push: function push() {
			requireXMLList(this, "push");
		
			Array.slice(arguments).forEach(function(arg) {
				this[this.length()] = arg;
			}, this);
		
			return this.length();
		},

		// xmllist.pop()
		pop: function pop() {
			requireXMLList(this, "pop");
		
			var popped = this[this.length()-1];
			delete this[this.length()-1];
			return popped;
		},
	
		// xmllist.shift()
		shift: function shift() {
			requireXMLList(this, "shift");
		
			var shifted = this[0];
			delete this[0];
			return shifted;
		},
	
		// xmllist.unshift()
		// syntax: xmllist.unshift(xml1, ..., xmlN)
		unshift: function shift() {
			requireXMLList(this, "unshift");
		
			Array.slice(arguments).forEach(function(arg) {
				// check if length is 0 so undefined isn't appended
				if (this.length())
					this[0] = arg + this[0];
			
				else this[0] = arg; 
			}, this);
		
			return this.length();
		},
	
		// xmllist.splice()
		// syntax: xmllist.splice(index, howMany, element1, ..., elementN)
		splice: function splice() {
			requireXMLList(this, "splice");
		
			var args = Array.slice(arguments),
			index    = args.shift(),
			toRemove = args.shift(),
			removed  = [];
		
			for (var i=0; i<toRemove; i++) {
				removed.push(this[index]);
				delete this[index];
			}
		
			while (args.length) // args to insert
				this[index] =
					(this.length() ? // check length in case this is empty
						this[index] + args.pop() : args.pop()
					);
		
			return (removed.length === 1 ? removed[0] : removed);
		},
	
		// xmllist.concat()
		// syntax: xmlist.concat(xml1, ..., xmlN)
		concat: function concat() {
			var res = this.slice(0); // clone this to results
		
			Array.slice(arguments).forEach(function(arg) {
				res += arg;
			});
		
			return res;
		},
	
		// xmllist.slice()
		// syntax: xmlist.slice(fromIndex, toIndex, returnArray)
		slice: function slice(from, to, returnArray) {		
			from = (isNaN(+from) ? 0 : +from);
			to   = (isNaN(+to)   ? this.length() : +to);
		
			returnArray = returnArray === true || arguments.length === 0;
		
			var xml = XMLList(this.toXMLString()); // clone XML
		
			// if no args, the only intention could be to make an array
			var sliced = (returnArray === true || arguments.length === 0) ? [] : <></>;
		
			for (; from<to; from++)
				sliced.push(xml[from]);
		
			return sliced;
		},
	
		// xmllist.join()
		// syntax: xmllist.join(separator)
		join: function join(separator) {
			return this.slice().map(function(xml) {
				return xml.toXMLString();
			}).join(separator);
		},
	
		// xmllist.reverse()
		// syntax: xmllist.reverse()
		reverse: function reverse() {
			return XMLList(this.slice().map(toXMLString).reverse().join(""));
		},

		// syntax for all until sort: xmlist[method](function(item, index, xmllist), thisObject)

		// xmllist.forEach()
		forEach: function forEach(fun, thisp) {
			requireFunCallback(fun);
		
			var len = this.length();
			for (var i=0; i<len; i++)
				if (i in this)
					fun.call(thisp, this[i], i, this);
		},
	
		// xmllist.map()
		map: function map(fun, thisp) {
			requireFunCallback(fun);
		
			var len = this.length(),
			res = <></>;
		
			for (var i=0; i<len; i++)
				if (i in this)
					res[i] = fun.call(thisp, this[i], i, this);
		
			return res;
		},
	
		// xmllist.filter()
		filter: function filter(fun, thisp) {
			requireFunCallback(fun);
		
			var len = this.length(),
			res = <></>;
		
			for (var i=0; i<len; i++)
				if (i in this) {
					var val = this[i];
					if ( fun.call(thisp, this[i], i, this) )
						res.push(val);
				}
		
			return res;
		},
	
		// xmllist.every()
		every: function every(fun, thisp) {
			requireFunCallback(fun);
		
			var len = this.length(),
			res = <></>;
		
			for (var i=0; i<len; i++)
				if (i in this && !fun.call(thisp, this[i], i, this) )
						return false;
		
			return true;
		},
	
		// xmllist.some()
		some: function some(fun, thisp) {
			requireFunCallback(fun);
		
			var len = this.length(),
			res = <></>;
		
			for (var i=0; i<len; i++)
				if (i in this && fun.call(thisp, this[i], i, this) )
						return true;
		
			return false;
		},
	
		// xmllist.sort()
		// syntax: xmllist.sort(function(a, b))
		sort: function sort(compareFun) {
			return XMLproto.function::concat.apply(
				<></>,
				Array.prototype.sort.apply(
					this.slice(),
					Array.slice(arguments)
				)
			);
		},
	
		// xmllist.indexOf() and xmllist.lastIndexOf()
		// syntax: xmlist[method](searchElement, fromIndex)
	
		indexOf : function indexOf(elt /*, from*/) {
			var len = this.length() >>> 0;
	
			var from = Number(arguments[1]) || 0;
			from = (from < 0)
						? Math.ceil(from)
						: Math.floor(from);
			if (from < 0)
				from += len;
	
			for (; from < len; from++)
				if (from in this && this[from] == elt) // use == instead of === for XML
					return from;
	
			return -1;
		},
	
		lastIndexOf: function lastIndexOf(elt /*, from*/) {
			var len = this.length(),
			from = Number(arguments[1]);
			
			if (isNaN(from))
				from = len - 1;
			
			else {
				from = (from < 0)
							? Math.ceil(from)
							: Math.floor(from);
				if (from < 0)
					from += len;
				else if (from >= len)
					from = len - 1;
			}

			for (; from > -1; from--)
				if (from in this && this[from] == elt) // use == instead of === for XML
					return from;
			
			return -1;
		}
	});

})();
