import * as utils from './utils.js';

var _propertyNameCache = {};

/**
 * Node type constant for element nodes
 *
 * @type {number}
 */
export var ELEMENT_NODE = 1;

/**
 * Node type constant for text nodes
 *
 * @type {number}
 */
export var TEXT_NODE = 3;

/**
 * Node type constant for comment nodes
 *
 * @type {number}
 */
export var COMMENT_NODE = 8;
export var DOCUMENT_NODE = 9;
export var DOCUMENT_FRAGMENT_NODE = 11;

function toFloat(value) {
	value = parseFloat(value);

	return isFinite(value) ? value : 0;
}

export function createElement(tag, attributes, context) {
	var node = (context || document).createElement(tag);

	Object.keys(attributes || {}).forEach(function (key) {
		if (key === 'style') {
			node.style.cssText = attributes[key];
		} else if (key in node) {
			node[key] = attributes[key];
		} else {
			node.setAttribute(key, attributes[key]);
		}
	});

	return node;
}

export function parents(node, selector) {
	var parents = [];
	var parent = node || {};

	while ((parent = parent.parentNode) && !/(9|11)/.test(parent.nodeType)) {
		if (!selector || is(parent, selector)) {
			parents.push(parent);
		}
	}

	return parents;
}

export function parent(node, selector) {
	var parent = node || {};

	while ((parent = parent.parentNode) && !/(9|11)/.test(parent.nodeType)) {
		if (!selector || is(parent, selector)) {
			return parent;
		}
	}
}

/**
 * Checks the passed node and all parents and
 * returns the first matching node if any.
 *
 * @param {HTMLElement} node
 * @param {string} selector
 * @returns {HTMLElement|null}
 */
export function closest(node, selector) {
	return is(node, selector) ? node : parent(node, selector);
}

export function remove(node) {
	node.parentNode.removeChild(node);
}

export function appendChild(node, child) {
	node.appendChild(child);
}

export function find(node, selector) {
	return node.querySelectorAll(selector);
}

export var EVENT_CAPTURE = true;
export var EVENT_BUBBLE = false;

// eslint-disable-next-line max-params
export function on(node, events, selector, fn, capture) {
	if (utils.isString(selector)) {
		var origFunc = fn;
		var delegate = function (e) {
			var target = e.target;
// TODO: tidy up and add off support
			while (target && target !== node) {
				if (is(target, selector)) {
					origFunc.call(target, e);
					return;
				}

				target = target.parentNode;
			}
		};

		fn._sceDelegate = delegate;
		fn = delegate;
	} else {
		fn = selector;
		capture = fn;
	}

	events.split(' ').forEach(function (event) {
		node.addEventListener(event, fn, capture);
	});
}

export function off(node, events, fn, capture) {
	events.split(' ').forEach(function (event) {
		node.removeEventListener(event, fn, capture);
	});
}

export function attr(node, attr, value) {
	if (arguments.length < 3) {
		return node.getAttribute(attr);
	}

	// eslint-disable-next-line eqeqeq, no-eq-null
	if (value == null) {
		removeAttr(node, attr);
	} else {
		node.setAttribute(attr, value);
	}
}

export function hide(node) {
	css(node, 'display', 'none');
}

export function show(node) {
	css(node, 'display', '');
}

export function toggle(node) {
	if (isVisible(node)) {
		hide(node);
	} else {
		show(node);
	}
}

export function removeAttr(node, attr) {
	node.removeAttribute(attr);
}

export function css(node, rule, value) {
	if (arguments.length < 3) {
		if (utils.isString(rule)) {
			return getComputedStyle(node)[rule];
		}

		Object.keys(rule).forEach(function (key) {
			css(node, key, rule[key]);
		});
	} else {
		node.style[rule] = utils.isNumber(value) ? value + 'px' : value;
	}
}


/**
 * Gets or sets thee data attributes on a node
 *
 * Unlike the jQuery version this only stores data
 * in the DOM attributes which means only strings
 * can be stored.
 *
 * @param {Node} node
 * @param {string} [key]
 * @param {string} [value]
 * @return {Object}
 */
export function data(node, key, value) {
	var argsLength = arguments.length;
	var data = {};

	if (node.nodeType === ELEMENT_NODE) {
		if (argsLength === 1) {
			[].forEach.call(node.attributes, function (attr) {
				if (/^data\-/i.test(attr.name)) {
					data[attr.name.substr(5)] = attr.value;
				}
			});

			return data;
		}

		if (argsLength === 2) {
			return attr(node, 'data-' + key);
		}

		attr(node, 'data-' + key, String(value));
	}
}

/**
 * Checks if node matches the given selector.
 *
 * @param {HTMLElement} node
 * @param {string} selector
 * @returns {boolean}
 */
export function is(node, selector) {
	return node && node.nodeType === ELEMENT_NODE &&
		(node.matches || node.msMatchesSelector ||
			node.webkitMatchesSelector).call(node, selector);
}


/**
 * Returns true if node contains child otherwise false.
 *
 * This differs from the DOM contains() method in that
 * if node and child are equal this will return false.
 *
 * @param {HTMLElement} node
 * @param {HTMLElement} child
 * @returns {boolean}
 */
export function contains(node, child) {
	return node !== child && node.contains(child);
}

export function previousElementSibling(node, selector) {
	var prev = node.previousElementSibling;

	if (selector && prev) {
		return is(prev, selector) ? prev : null;
	}

	return prev;
}

export function insertBefore(node, refNode) {
	return refNode.parentNode.insertBefore(node, refNode);
}

function classes(node) {
	return node ? (node.className || '').trim().split(/\s+/) : [];
}

export function hasClass(node, className) {
	return classes(node).indexOf(className) > -1;
}

export function addClass(node, className) {
	var classList = classes(node);

	if (classList.indexOf(className) < 0) {
		classList.push(className);
	}

	node.className = classList.join(' ');
}

export function removeClass(node, className) {
	var classList = classes(node);

	utils.arrayRemove(classList, className);

	node.className = classList.join(' ');
}

export function toggleClass(node, className, state) {
	state = utils.isUndefined(state) ? hasClass(node, className) : state;

	if (state) {
		addClass(node, className);
	} else {
		removeClass(node, className);
	}
}

export function width(node, value) {
	if (utils.isUndefined(value)) {
		var cs = getComputedStyle(node);
		var padding = toFloat(cs.paddingLeft) + toFloat(cs.paddingRight);
		var border = toFloat(cs.borderLeftWidth) + toFloat(cs.borderRightWidth);

		return node.offsetWidth - padding - border;
	}

	css(node, 'width', value);
}

export function height(node, value) {
	if (utils.isUndefined(value)) {
		var cs = getComputedStyle(node);
		var padding = toFloat(cs.paddingTop) + toFloat(cs.paddingButtom);
		var border = toFloat(cs.borderTopWidth) + toFloat(cs.borderBottomWidth);

		return node.offsetHeight - padding - border;
	}

	css(node, 'height', value);
}

export function trigger(node, eventName, data) {
	var event;

	if (window.CustomEvent) {
		event = new CustomEvent(eventName, {
			bubbles: true,
			cancelable: true,
			detail: data
		});
	} else {
		event = document.createEvent('CustomEvent');
		event.initCustomEvent(eventName, true, true, data);
	}

	node.dispatchEvent(event);
}

/**
 * Returns if a node is visible.
 *
 * @param {HTMLElement}
 * @returns {boolean}
 */
export function isVisible(node) {
	return !!node.getClientRects().length;
}

function camelCase(string) {
	return string
		.replace(/^-ms-/, 'ms-')
		.replace(/-(\w)/g, function (match, char) {
			return char.toUpperCase();
		});
}


/**
 * Loop all child nodes of the passed node
 *
 * The function should accept 1 parameter being the node.
 * If the function returns false the loop will be exited.
 *
 * @param  {HTMLElement} node
 * @param  {Function} func       Callback which is called with every
 *                               child node as the first argument.
 * @param  {bool} innermostFirst If the innermost node should be passed
 *                               to the function before it's parents.
 * @param  {bool} siblingsOnly   If to only traverse the nodes siblings
 * @param  {bool} reverse        If to traverse the nodes in reverse
 */
// eslint-disable-next-line max-params
export function traverse(node, func, innermostFirst, siblingsOnly, reverse) {
	if (node) {
		node = reverse ? node.lastChild : node.firstChild;

		while (node) {
			var next = reverse ?
				node.previousSibling :
				node.nextSibling;

			if (
				(!innermostFirst && func(node) === false) ||
				(!siblingsOnly && traverse(
					node, func, innermostFirst, siblingsOnly, reverse
				) === false) ||
				(innermostFirst && func(node) === false)
			) {
				return false;
			}

			// move to next child
			node = next;
		}
	}
}

/**
 * Like traverse but loops in reverse
 * @see traverse
 */
export function rTraverse(node, func, innermostFirst, siblingsOnly) {
	traverse(node, func, innermostFirst, siblingsOnly, true);
}

/**
 * Parses HTML
 *
 * @param {String} html
 * @param {Document} context
 * @since 1.4.4
 * @return {DocumentFragment}
 */
export function parseHTML(html, context) {
	context = context || document;

	var	ret = context.createDocumentFragment();
	var tmp = createElement('div', {}, context);

	tmp.innerHTML = html;

	while (tmp.firstChild) {
		appendChild(ret, tmp.firstChild);
	}

	return ret;
}

/**
 * Checks if an element has any styling.
 *
 * It has styling if it is not a plain <div> or <p> or
 * if it has a class, style attribute or data.
 *
 * @param  {HTMLElement} elm
 * @return {Boolean}
 * @since 1.4.4
 */
export function hasStyling(node) {
	return node && (!is(node, 'p,div') || node.className ||
		attr(node, 'style') || !utils.isEmptyObject(data(node)));
}

/**
 * Converts an element from one type to another.
 *
 * For example it can convert the element <b> to <strong>
 *
 * @param  {HTMLElement} oldElm
 * @param  {String}      toTagName
 * @return {HTMLElement}
 * @since 1.4.4
 */
export function convertElement(oldElm, toTagName) {
	var	child, attribute,
		oldAttrs = oldElm.attributes,
		attrsIdx = oldAttrs.length,
		newElm   = oldElm.ownerDocument.createElement(toTagName);

	while (attrsIdx--) {
		attribute = oldAttrs[attrsIdx];

		// Some browsers parse invalid attributes names like
		// 'size"2' which throw an exception when set, just
		// ignore these.
		try {
			attr(newElm, attribute.name, attribute.value);
		} catch (ex) {}
	}

	while ((child = oldElm.firstChild)) {
		appendChild(newElm, child);
	}

	oldElm.parentNode.replaceChild(newElm, oldElm);

	return newElm;
}

/**
 * List of block level elements separated by bars (|)
 * @type {string}
 */
export var blockLevelList = '|body|hr|p|div|h1|h2|h3|h4|h5|h6|address|pre|' +
	'form|table|tbody|thead|tfoot|th|tr|td|li|ol|ul|blockquote|center|';

/**
 * List of elements that do not allow children separated by bars (|)
 *
 * @param {Node} node
 * @return {bool}
 * @since  1.4.5
 */
export function canHaveChildren(node) {
	// 1  = Element
	// 9  = Document
	// 11 = Document Fragment
	if (!/11?|9/.test(node.nodeType)) {
		return false;
	}

	// List of empty HTML tags separated by bar (|) character.
	// Source: http://www.w3.org/TR/html4/index/elements.html
	// Source: http://www.w3.org/TR/html5/syntax.html#void-elements
	return ('|iframe|area|base|basefont|br|col|frame|hr|img|input|wbr' +
		'|isindex|link|meta|param|command|embed|keygen|source|track|' +
		'object|').indexOf('|' + node.nodeName.toLowerCase() + '|') < 0;
}

/**
 * Checks if an element is inline
 *
 * @return {bool}
 */
export function isInline(elm, includeCodeAsBlock) {
	var tagName,
		nodeType = (elm || {}).nodeType || TEXT_NODE;

	if (nodeType !== ELEMENT_NODE) {
		return nodeType === TEXT_NODE;
	}

	tagName = elm.tagName.toLowerCase();

	if (tagName === 'code') {
		return !includeCodeAsBlock;
	}

	return blockLevelList.indexOf('|' + tagName + '|') < 0;
}

/**
 * <p>Copys the CSS from 1 node to another.</p>
 *
 * <p>Only copies CSS defined on the element e.g. style attr.</p>
 *
 * @param {HTMLElement} from
 * @param {HTMLElement} to
 */
export function copyCSS(from, to) {
	to.style.cssText = from.style.cssText + to.style.cssText;
}

/**
 * Fixes block level elements inside in inline elements.
 *
 * Also fixes invalid list nesting by placing nested lists
 * inside the previous li tag or wrapping them in an li tag.
 *
 * @param {HTMLElement} node
 */
export function fixNesting(node) {
	var	getLastInlineParent = function (node) {
		while (isInline(node.parentNode, true)) {
			node = node.parentNode;
		}

		return node;
	};

	traverse(node, function (node) {
		var list = 'ul,ol',
			isBlock = !isInline(node, true);

		// Any blocklevel element inside an inline element needs fixing.
		if (isBlock && isInline(node.parentNode, true)) {
			var	parent  = getLastInlineParent(node),
				before  = extractContents(parent, node),
				middle  = node;

			// copy current styling so when moved out of the parent
			// it still has the same styling
			copyCSS(parent, middle);

			insertBefore(before, parent);
			insertBefore(middle, parent);
		}

		// Fix invalid nested lists which should be wrapped in an li tag
		if (isBlock && is(node, list) && is(node.parentNode, list)) {
			var li = previousElementSibling(node, 'li');

			if (!li) {
				li = createElement('li');
				insertBefore(li, node);
			}

			if (li) {
				appendChild(li, node);
			}
		}
	});
}

/**
 * Finds the common parent of two nodes
 *
 * @param {HTMLElement} node1
 * @param {HTMLElement} node2
 * @return {HTMLElement}
 */
export function findCommonAncestor(node1, node2) {
	// Not as fast as making two arrays of parents and comparing
	// but is a lot smaller and as it's currently only used with
	// fixing invalid nesting it doesn't need to be very fast
	var node = node1.parentNode;
	while (node) {
		if (contains(node, node2)) {
			return node;
		}

		node = node.parentNode;
	}
}

export function getSibling(node, previous) {
	if (!node) {
		return null;
	}

	return (previous ? node.previousSibling : node.nextSibling) ||
		getSibling(node.parentNode, previous);
}

/**
 * Removes unused whitespace from the root and all it's children
 *
 * @name removeWhiteSpace^1
 * @param {HTMLElement} root
 */
/**
 * Removes unused whitespace from the root and all it's children.
 *
 * If preserveNewLines is true, new line characters will not be removed
 *
 * @name removeWhiteSpace^2
 * @param {HTMLElement} root
 * @param {boolean}     preserveNewLines
 * @since 1.4.3
 */
export function removeWhiteSpace(root, preserveNewLines) {
	var	nodeValue, nodeType, next, previous, previousSibling,
		cssWhiteSpace, nextNode, trimStart,
		node              = root.firstChild;

	while (node) {
		nextNode  = node.nextSibling;
		nodeValue = node.nodeValue;
		nodeType  = node.nodeType;

		if (nodeType === ELEMENT_NODE && node.firstChild) {
			cssWhiteSpace = css(node, 'whiteSpace');

			// Skip pre & pre-wrap with any vendor prefix
			if (!/pre(\-wrap)?$/i.test(cssWhiteSpace)) {
				// Preserve newlines if is pre-line
				removeWhiteSpace(node, /line$/i.test(cssWhiteSpace));
			}
		}

		if (nodeType === TEXT_NODE && nodeValue) {
			next            = getSibling(node);
			previous        = getSibling(node, true);
			trimStart       = false;

			while (hasClass(previous, 'sceditor-ignore')) {
				previous = getSibling(previous, true);
			}
			// If previous sibling isn't inline or is a textnode that
			// ends in whitespace, time the start whitespace
			if (isInline(node) && previous) {
				previousSibling = previous;

				while (previousSibling.lastChild) {
					previousSibling = previousSibling.lastChild;
				}

				trimStart = previousSibling.nodeType === TEXT_NODE ?
					/[\t\n\r ]$/.test(previousSibling.nodeValue) :
					!isInline(previousSibling);
			}

			// Clear zero width spaces
			nodeValue = nodeValue.replace(/\u200B/g, '');

			// Strip leading whitespace
			if (!previous || !isInline(previous) || trimStart) {
				nodeValue = nodeValue.replace(
					preserveNewLines ? /^[\t ]+/ : /^[\t\n\r ]+/,
					''
				);
			}

			// Strip trailing whitespace
			if (!next || !isInline(next)) {
				nodeValue = nodeValue.replace(
					preserveNewLines ? /[\t ]+$/ : /[\t\n\r ]+$/,
					''
				);
			}
			// Remove empty text nodes
			if (!nodeValue.length) {
				remove(node);
			} else {
				node.nodeValue = nodeValue.replace(
					preserveNewLines ? /[\t ]+/g : /[\t\n\r ]+/g,
					' '
				);
			}
		}

		node = nextNode;
	}
}

/**
 * Extracts all the nodes between the start and end nodes
 *
 * @param {HTMLElement} startNode	The node to start extracting at
 * @param {HTMLElement} endNode		The node to stop extracting at
 * @return {DocumentFragment}
 */
export function extractContents(startNode, endNode) {
	var	extract,
		commonAncestor = findCommonAncestor(startNode, endNode),
		startReached   = false,
		endReached     = false;

	extract = function (root) {
		var clone,
			docFrag = startNode.ownerDocument.createDocumentFragment();

		traverse(root, function (node) {
			// if end has been reached exit loop
			if (endReached || node === endNode) {
				endReached = true;

				return false;
			}

			if (node === startNode) {
				startReached = true;
			}

			// if the start has been reached and this elm contains
			// the end node then clone it
			// if this node contains the start node then add it
			if (contains(node, startNode) ||
				(startReached && contains(node, endNode))) {
				clone = node.cloneNode(false);

				appendChild(clone, extract(node));
				appendChild(docFrag, clone);

			// otherwise move it if its parent isn't already part of it
			} else if (startReached && !contains(docFrag, node)) {
				appendChild(docFrag, node);
			}
		}, false);

		return docFrag;
	};

	return extract(commonAncestor);
}

/**
 * Gets the offset position of an element
 *
 * @param  {HTMLElement} node
 * @return {Object} An object with left and top properties
 */
export function getOffset(node) {
	var	left = 0,
		top = 0;

	while (node) {
		left += node.offsetLeft;
		top  += node.offsetTop;
		node   = node.offsetParent;
	}

	return {
		left: left,
		top: top
	};
}

/**
 * Gets the value of a CSS property from the elements style attribute
 *
 * @param  {HTMLElement} elm
 * @param  {String} property
 * @return {String}
 */
export function getStyle(elm, property) {
	var	direction, styleValue,
		elmStyle = elm.style;

	if (!elmStyle) {
		return '';
	}

	if (!_propertyNameCache[property]) {
		_propertyNameCache[property] = camelCase(property);
	}

	property   = _propertyNameCache[property];
	styleValue = elmStyle[property];

	// Add an exception for text-align
	if ('textAlign' === property) {
		direction  = elmStyle.direction;
		styleValue = styleValue || css(elm, property);

		if (css(elm.parentNode, property) === styleValue ||
			css(elm, 'display') !== 'block' ||
			is(elm, 'hr,th')) {
			return '';
		}

		// IE changes text-align to the same as the current direction
		// so skip unless its not the same
		if ((/right/i.test(styleValue) && direction === 'rtl') ||
			(/left/i.test(styleValue) && direction === 'ltr')) {
			return '';
		}
	}

	return styleValue;
}

/**
 * Tests if an element has a style.
 *
 * If values are specified it will check that the styles value
 * matches one of the values
 *
 * @param  {HTMLElement} elm
 * @param  {String} property
 * @param  {String|Array} values
 * @return {Boolean}
 */
export function hasStyle(elm, property, values) {
	var styleValue = getStyle(elm, property);

	if (!styleValue) {
		return false;
	}

	return !values || styleValue === values ||
		(Array.isArray(values) && values.indexOf(styleValue) > -1);
}
