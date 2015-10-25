$(function() {
	$(".gallery a").prettyPhoto({
		animation_speed: 'fast',
		slideshow: 3000,
		show_title: false,
		allow_resize: true,
		deeplinking: false,
		overlay_gallery: true,
		social_tools: false
	});

	$.nette.init();
	$.nette.ext({success: function() {
			setIeLabel();
		}});
	function setIeLabel() {
		if (navigator.userAgent.match(/msie/i)) {
			($("input[placeholder], textarea[placeholder]")).each(function() {
				var element = $(this);
				element.val(element.attr("placeholder"));
				element.focus(removeLabel);
				element.blur(setLabel);
			});
		}
	}
	function removeLabel() {
		var element = $(this);
		if (element.val() === element.attr("placeholder")) {
			element.val("");
		}
	}
	function setLabel() {
		var element = $(this);
		if (!element.val()) {
			element.val(element.attr("placeholder"));
		}
	}
});
/*AJAX Nette Framework plugin for jQuery version 1.2.2*/
(function(window, $, undefined) {
	if (typeof $ !== 'function') {
		return console.error('nette.ajax.js: jQuery is missing, load it please');
	}
	var nette = function() {
		var inner = {
			self: this,
			initialized: false,
			contexts: {},
			on: {
				init: {},
				load: {},
				prepare: {},
				before: {},
				start: {},
				success: {},
				complete: {},
				error: {}
			},
			fire: function() {
				var result = true;
				var args = Array.prototype.slice.call(arguments);
				var props = args.shift();
				var name = (typeof props === 'string') ? props : props.name;
				var off = (typeof props === 'object') ? props.off || {} : {};
				args.push(inner.self);
				$.each(inner.on[name], function(index, reaction) {
					if (reaction === undefined || $.inArray(index, off) !== -1)
						return true;
					var temp = reaction.apply(inner.contexts[index], args);
					return result = (temp === undefined || temp);
				});
				return result;
			},
			requestHandler: function(e) {
				inner.self.ajax({}, this, e);
			},
			ext: function(callbacks, context, name) {
				while (!name) {
					name = 'ext_' + Math.random();
					if (inner.contexts[name]) {
						name = undefined;
					}
				}
				$.each(callbacks, function(event, callback) {
					inner.on[event][name] = callback;
				});
				inner.contexts[name] = $.extend(context ? context : {}, {
					name: function() {
						return name;
					},
					ext: function(name, force) {
						var ext = inner.contexts[name];
						if (!ext && force)
							throw "Extension '" + this.name() + "' depends on disabled extension '" + name + "'.";
						return ext;
					}
				});
			}
		};

		/**
		 * Allows manipulation with extensions.
		 * When called with 1. argument only, it returns extension with given name.
		 * When called with 2. argument equal to false, it removes extension entirely.
		 * When called with 2. argument equal to hash of event callbacks, it adds new extension.
		 *
		 * @param {string} Name of extension
		 * @param {bool|object|null} Set of callbacks for any events OR false for removing extension.
		 * @param {object|null} Context for added extension
		 * @return {$.nette|object} Provides a fluent interface OR returns extensions with given name
		 */
		this.ext = function(name, callbacks, context) {
			if (typeof name === 'object') {
				inner.ext(name, callbacks);
			} else if (callbacks === undefined) {
				return inner.contexts[name];
			} else if (!callbacks) {
				$.each(['init', 'load', 'prepare', 'before', 'start', 'success', 'complete', 'error'], function(index, event) {
					inner.on[event][name] = undefined;
				});
				inner.contexts[name] = undefined;
			} else if (typeof name === 'string' && inner.contexts[name] !== undefined) {
				throw "Cannot override already registered nette-ajax extension '" + name + "'.";
			} else {
				inner.ext(callbacks, context, name);
			}
			return this;
		};

		/**
		 * Initializes the plugin:
		 * - fires 'init' event, then 'load' event
		 * - when called with any arguments, it will override default 'init' extension
		 * with provided callbacks
		 *
		 * @param {function|object|null} Callback for 'load' event or entire set of callbacks for any events
		 * @param {object|null} Context provided for callbacks in first argument
		 * @return {$.nette} Provides a fluent interface
		 */
		this.init = function(load, loadContext) {
			if (inner.initialized)
				throw 'Cannot initialize nette-ajax twice.';

			if (typeof load === 'function') {
				this.ext('init', null);
				this.ext('init', {
					load: load
				}, loadContext);
			} else if (typeof load === 'object') {
				this.ext('init', null);
				this.ext('init', load, loadContext);
			} else if (load !== undefined) {
				throw 'Argument of init() can be function or function-hash only.';
			}

			inner.initialized = true;

			inner.fire('init');
			this.load();
			return this;
		};

		/**
		 * Fires 'load' event
		 *
		 * @return {$.nette} Provides a fluent interface
		 */
		this.load = function() {
			inner.fire('load', inner.requestHandler);
			return this;
		};

		/**
		 * Executes AJAX request. Attaches listeners and events.
		 *
		 * @param {object} settings
		 * @param {Element|null} ussually Anchor or Form
		 * @param {event|null} event causing the request
		 * @return {jqXHR|null}
		 */
		this.ajax = function(settings, ui, e) {
			if (!settings.nette && ui && e) {
				var $el = $(ui), xhr, originalBeforeSend;
				var analyze = settings.nette = {
					e: e,
					ui: ui,
					el: $el,
					isForm: $el.is('form'),
					isSubmit: $el.is('input[type=submit]') || $el.is('button[type=submit]'),
					isImage: $el.is('input[type=image]'),
					form: null
				};

				if (analyze.isSubmit || analyze.isImage) {
					analyze.form = analyze.el.closest('form');
				} else if (analyze.isForm) {
					analyze.form = analyze.el;
				}

				if (!settings.url) {
					settings.url = analyze.form ? analyze.form.attr('action') : ui.href;
				}
				if (!settings.type) {
					settings.type = analyze.form ? analyze.form.attr('method') : 'get';
				}

				if ($el.is('[data-ajax-off]')) {
					var rawOff = $el.attr('data-ajax-off');
					if (rawOff.indexOf('[') === 0) {
						settings.off = $el.data('ajaxOff');
					} else if (rawOff.indexOf(',') !== -1) {
						settings.off = rawOff.split(',');
					} else if (rawOff.indexOf(' ') !== -1) {
						settings.off = rawOff.split(' ');
					} else {
						settings.off = rawOff;
					}
					if (typeof settings.off === 'string')
						settings.off = [settings.off];
					settings.off = $.grep($.each(settings.off, function(off) {
						return $.trim(off);
					}), function(off) {
						return off.length;
					});
				}
			}
			inner.fire({
				name: 'prepare',
				off: settings.off || {}
			}, settings);
			if (settings.prepare) {
				settings.prepare(settings);
			}
			originalBeforeSend = settings.beforeSend;
			settings.beforeSend = function(xhr, settings) {
				var result = inner.fire({
					name: 'before',
					off: settings.off || {}
				}, xhr, settings);
				if ((result || result === undefined) && originalBeforeSend) {
					result = originalBeforeSend(xhr, settings);
				}
				return result;
			};

			return this.handleXHR($.ajax(settings), settings);
		};
		this.handleXHR = function(xhr, settings) {
			settings = settings || {};

			if (xhr && (typeof xhr.statusText === 'undefined' || xhr.statusText !== 'canceled')) {
				xhr.done(function(payload, status, xhr) {
					inner.fire({
						name: 'success',
						off: settings.off || {}
					}, payload, status, xhr, settings);
				}).fail(function(xhr, status, error) {
					inner.fire({
						name: 'error',
						off: settings.off || {}
					}, xhr, status, error, settings);
				}).always(function(xhr, status) {
					inner.fire({
						name: 'complete',
						off: settings.off || {}
					}, xhr, status, settings);
				});
				inner.fire({
					name: 'start',
					off: settings.off || {}
				}, xhr, settings);
				if (settings.start) {
					settings.start(xhr, settings);
				}
			}
			return xhr;
		};
	};
	$.nette = new ($.extend(nette, $.nette ? $.nette : {}));
	$.fn.netteAjax = function(e, options) {
		return $.nette.ajax(options || {}, this[0], e);
	};
	$.fn.netteAjaxOff = function() {
		return this.off('.nette');
	};
	$.nette.ext('validation', {
		before: function(xhr, settings) {
			if (!settings.nette)
				return true;
			else
				var analyze = settings.nette;
			var e = analyze.e;
			var validate = $.extend({
				keys: true,
				url: true,
				form: true
			}, settings.validate || (function() {
				if (!analyze.el.is('[data-ajax-validate]'))
					return;
				var attr = analyze.el.data('ajaxValidate');
				if (attr === false)
					return {
						keys: false,
						url: false,
						form: false
					};
				else if (typeof attr === 'object')
					return attr;
			})() || {});
			var passEvent = false;
			if (analyze.el.attr('data-ajax-pass') !== undefined) {
				passEvent = analyze.el.data('ajaxPass');
				passEvent = typeof passEvent === 'bool' ? passEvent : true;
			}
			if (validate.keys) {
				var explicitNoAjax = e.button || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey;

				if (analyze.form) {
					if (explicitNoAjax && analyze.isSubmit) {
						this.explicitNoAjax = true;
						return false;
					} else if (analyze.isForm && this.explicitNoAjax) {
						this.explicitNoAjax = false;
						return false;
					}
				} else if (explicitNoAjax)
					return false;
			}
			if (validate.form && analyze.form && !((analyze.isSubmit || analyze.isImage) && analyze.el.attr('formnovalidate') !== undefined)) {
				if (analyze.form.get(0).onsubmit && analyze.form.get(0).onsubmit(e) === false) {
					e.stopImmediatePropagation();
					e.preventDefault();
					return false;
				}
			}
			if (validate.url) {
				if (/:|^#/.test(analyze.form ? settings.url : analyze.el.attr('href')))
					return false;
			}
			if (!passEvent) {
				e.stopPropagation();
				e.preventDefault();
			}
			return true;
		}
	}, {
		explicitNoAjax: false
	});
	$.nette.ext('forms', {
		init: function() {
			var snippets;
			if (!window.Nette || !(snippets = this.ext('snippets')))
				return;

			snippets.after(function($el) {
				$el.find('form').each(function() {
					window.Nette.initForm(this);
				});
			});
		},
		prepare: function(settings) {
			var analyze = settings.nette;
			if (!analyze || !analyze.form)
				return;
			var e = analyze.e;
			var originalData = settings.data || {};
			var formData = {};

			if (analyze.isSubmit) {
				formData[analyze.el.attr('name')] = analyze.el.val() || '';
			} else if (analyze.isImage) {
				var offset = analyze.el.offset();
				var name = analyze.el.attr('name');
				var dataOffset = [Math.max(0, e.pageX - offset.left), Math.max(0, e.pageY - offset.top)];

				if (name.indexOf('[', 0) !== -1) { // inside a container
					formData[name] = dataOffset;
				} else {
					formData[name + '.x'] = dataOffset[0];
					formData[name + '.y'] = dataOffset[1];
				}
			}

			if (typeof originalData !== 'string') {
				originalData = $.param(originalData);
			}
			formData = $.param(formData);
			settings.data = analyze.form.serialize() + (formData ? '&' + formData : '') + '&' + originalData;
		}
	});
	$.nette.ext('snippets', {
		success: function(payload) {
			var snippets = [];
			var elements = [];
			if (payload.snippets) {
				for (var i in payload.snippets) {
					var $el = this.getElement(i);
					if ($el.get(0)) {
						elements.push($el.get(0));
					}
					$.each(this.beforeQueue, function(index, callback) {
						if (typeof callback === 'function') {
							callback($el);
						}
					});
					this.updateSnippet($el, payload.snippets[i]);
					$.each(this.afterQueue, function(index, callback) {
						if (typeof callback === 'function') {
							callback($el);
						}
					});
				}
				var defer = $(elements).promise();
				$.each(this.completeQueue, function(index, callback) {
					if (typeof callback === 'function') {
						defer.done(callback);
					}
				});
			}
		}
	}, {
		beforeQueue: [],
		afterQueue: [],
		completeQueue: [],
		before: function(callback) {
			this.beforeQueue.push(callback);
		},
		after: function(callback) {
			this.afterQueue.push(callback);
		},
		complete: function(callback) {
			this.completeQueue.push(callback);
		},
		updateSnippet: function($el, html, back) {
			if (typeof $el === 'string') {
				$el = this.getElement($el);
			}
			if ($el.is('title')) {
				document.title = html;
			} else {
				this.applySnippet($el, html, back);
			}
		},
		getElement: function(id) {
			return $('#' + this.escapeSelector(id));
		},
		applySnippet: function($el, html, back) {
			if (!back && $el.is('[data-ajax-append]')) {
				$el.append(html);
			} else {
				$el.html(html);
			}
		},
		escapeSelector: function(selector) {
			return selector.replace(/[\!"#\$%&'\(\)\*\+,\.\/:;<=>\?@\[\\\]\^`\{\|\}~]/g, '\\$&');
		}
	});
	$.nette.ext('redirect', {
		success: function(payload) {
			if (payload.redirect) {
				window.location.href = payload.redirect;
				return false;
			}
		}
	});
	$.nette.ext('state', {
		success: function(payload) {
			if (payload.state) {
				this.state = payload.state;
			}
		}
	}, {state: null});
	$.nette.ext('unique', {
		start: function(xhr) {
			if (this.xhr) {
				this.xhr.abort();
			}
			this.xhr = xhr;
		},
		complete: function() {
			this.xhr = null;
		}
	}, {xhr: null});
	$.nette.ext('abort', {
		init: function() {
			$('body').keydown($.proxy(function(e) {
				if (this.xhr && (e.keyCode.toString() === '27' // Esc
					&& !(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey))
					) {
					this.xhr.abort();
				}
			}, this));
		},
		start: function(xhr) {
			this.xhr = xhr;
		},
		complete: function() {
			this.xhr = null;
		}
	}, {xhr: null});
	$.nette.ext('load', {
		success: function() {
			$.nette.load();
		}
	});
	$.nette.ext('init', {
		load: function(rh) {
			$(this.linkSelector).off('click.nette', rh).on('click.nette', rh);
			$(this.formSelector).off('submit.nette', rh).on('submit.nette', rh)
				.off('click.nette', ':image', rh).on('click.nette', ':image', rh)
				.off('click.nette', ':submit', rh).on('click.nette', ':submit', rh);
			$(this.buttonSelector).closest('form')
				.off('click.nette', this.buttonSelector, rh).on('click.nette', this.buttonSelector, rh);
		}
	}, {
		linkSelector: 'a.ajax',
		formSelector: 'form.ajax',
		buttonSelector: 'input.ajax[type="submit"], button.ajax[type="submit"], input.ajax[type="image"]'
	});

})(window, window.jQuery);

/*NetteForms - simple form validation.*/
var Nette = Nette || {};
Nette.addEvent = function(element, on, callback) {
	var original = element['on' + on];
	element['on' + on] = function() {
		if (typeof original === 'function' && original.apply(element, arguments) === false) {
			return false;
		}
		return callback.apply(element, arguments);
	};
};
Nette.getValue = function(elem) {
	var i, len;
	if (!elem) {
		return null;
	} else if (!elem.nodeName) {
		for (i = 0, len = elem.length; i < len; i++) {
			if (elem[i].checked) {
				return elem[i].value;
			}
		}
		return null;
	} else if (elem.nodeName.toLowerCase() === 'select') {
		var index = elem.selectedIndex, options = elem.options, values = [];
		if (index < 0) {
			return null;
		} else if (elem.type === 'select-one') {
			return options[index].value;
		}
		for (i = 0, len = options.length; i < len; i++) {
			if (options[i].selected) {
				values.push(options[i].value);
			}
		}
		return values;
	} else if (elem.type === 'checkbox') {
		return elem.checked;
	} else if (elem.type === 'radio') {
		return Nette.getValue(elem.form.elements[elem.name].nodeName ? [elem] : elem.form.elements[elem.name]);
	} else {
		return elem.value.replace("\r", '').replace(/^\s+|\s+$/g, '');
	}
};
Nette.validateControl = function(elem, rules, onlyCheck) {
	rules = rules || Nette.parseJSON(elem.getAttribute('data-nette-rules'));
	for (var id = 0, len = rules.length; id < len; id++) {
		var rule = rules[id], op = rule.op.match(/(~)?([^?]+)/);
		rule.neg = op[1];
		rule.op = op[2];
		rule.condition = !!rule.rules;
		var el = rule.control ? elem.form.elements[rule.control] : elem;
		var success = Nette.validateRule(el, rule.op, rule.arg);
		if (success === null) {
			continue;
		}
		if (rule.neg) {
			success = !success;
		}
		if (rule.condition && success) {
			if (!Nette.validateControl(elem, rule.rules, onlyCheck)) {
				return false;
			}
		} else if (!rule.condition && !success) {
			if (el.disabled) {
				continue;
			}
			if (!onlyCheck) {
				Nette.addError(el, rule.msg.replace('%value', Nette.getValue(el)));
			}
			return false;
		}
	}
	return true;
};
Nette.validateForm = function(sender) {
	var form = sender.form || sender, scope = false;
	if (form['nette-submittedBy'] && form['nette-submittedBy'].getAttribute('formnovalidate') !== null) {
		var scopeArr = Nette.parseJSON(form['nette-submittedBy'].getAttribute('data-nette-validation-scope'));
		if (scopeArr.length) {
			scope = new RegExp('^(' + scopeArr.join('-|') + '-)');
		} else {
			return true;
		}
	}
	for (var i = 0; i < form.elements.length; i++) {
		var elem = form.elements[i];
		if (!(elem.nodeName.toLowerCase() in {input: 1, select: 1, textarea: 1}) ||
			(elem.type in {hidden: 1, submit: 1, image: 1, reset: 1}) ||
			(scope && !elem.name.replace(/]\[|\[|]|$/g, '-').match(scope)) ||
			elem.disabled || elem.readonly
			) {
			continue;
		}
		if (!Nette.validateControl(elem)) {
			return false;
		}
	}
	return true;
};
Nette.addError = function(elem, message) {
	if (elem.focus) {
		elem.focus();
	}
	if (message) {
		alert(message);
	}
};
Nette.validateRule = function(elem, op, arg) {
	var val = Nette.getValue(elem);
	if (elem.getAttribute) {
		if (val === elem.getAttribute('data-nette-empty-value')) {
			val = '';
		}
	}
	if (op.charAt(0) === ':') {
		op = op.substr(1);
	}
	op = op.replace('::', '_');
	op = op.replace(/\\/g, '');
	return Nette.validators[op] ? Nette.validators[op](elem, arg, val) : null;
};
Nette.validators = {
	filled: function(elem, arg, val) {
		return val !== '' && val !== false && val !== null;
	},
	blank: function(elem, arg, val) {
		return !Nette.validators.filled(elem, arg, val);
	},
	valid: function(elem, arg, val) {
		return Nette.validateControl(elem, null, true);
	},
	equal: function(elem, arg, val) {
		if (arg === undefined) {
			return null;
		}
		arg = Nette.isArray(arg) ? arg : [arg];
		for (var i = 0, len = arg.length; i < len; i++) {
			if (val == (arg[i].control ? Nette.getValue(elem.form.elements[arg[i].control]) : arg[i])) {
				return true;
			}
		}
		return false;
	},
	notEqual: function(elem, arg, val) {
		return arg === undefined ? null : !Nette.validators.equal(elem, arg, val);
	},
	minLength: function(elem, arg, val) {
		return val.length >= arg;
	},
	maxLength: function(elem, arg, val) {
		return val.length <= arg;
	},
	length: function(elem, arg, val) {
		arg = Nette.isArray(arg) ? arg : [arg, arg];
		return (arg[0] === null || val.length >= arg[0]) && (arg[1] === null || val.length <= arg[1]);
	},
	email: function(elem, arg, val) {
		return (/^("([ !\x23-\x5B\x5D-\x7E]*|\\[ -~])+"|[-a-z0-9!#$%&'*+\/=?^_`{|}~]+(\.[-a-z0-9!#$%&'*+\/=?^_`{|}~]+)*)@([0-9a-z\u00C0-\u02FF\u0370-\u1EFF]([-0-9a-z\u00C0-\u02FF\u0370-\u1EFF]{0,61}[0-9a-z\u00C0-\u02FF\u0370-\u1EFF])?\.)+[a-z\u00C0-\u02FF\u0370-\u1EFF][-0-9a-z\u00C0-\u02FF\u0370-\u1EFF]{0,17}[a-z\u00C0-\u02FF\u0370-\u1EFF]$/i).test(val);
	},
	url: function(elem, arg, val) {
		return (/^(https?:\/\/|(?=.*\.))([0-9a-z\u00C0-\u02FF\u0370-\u1EFF](([-0-9a-z\u00C0-\u02FF\u0370-\u1EFF]{0,61}[0-9a-z\u00C0-\u02FF\u0370-\u1EFF])?\.)*[a-z\u00C0-\u02FF\u0370-\u1EFF][-0-9a-z\u00C0-\u02FF\u0370-\u1EFF]{0,17}[a-z\u00C0-\u02FF\u0370-\u1EFF]|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|\[[0-9a-f:]{3,39}\])(:\d{1,5})?(\/\S*)?$/i).test(val);
	},
	regexp: function(elem, arg, val) {
		var parts = typeof arg === 'string' ? arg.match(/^\/(.*)\/([imu]*)$/) : false;
		if (parts) {
			try {
				return (new RegExp(parts[1], parts[2].replace('u', ''))).test(val);
			} catch (e) {
			}
		}
	},
	pattern: function(elem, arg, val) {
		try {
			return typeof arg === 'string' ? (new RegExp('^(' + arg + ')$')).test(val) : null;
		} catch (e) {
		}
	},
	integer: function(elem, arg, val) {
		return (/^-?[0-9]+$/).test(val);
	},
	'float': function(elem, arg, val) {
		return (/^-?[0-9]*[.,]?[0-9]+$/).test(val);
	},
	range: function(elem, arg, val) {
		return Nette.isArray(arg) ?
			((arg[0] === null || parseFloat(val) >= arg[0]) && (arg[1] === null || parseFloat(val) <= arg[1])) : null;
	},
	submitted: function(elem, arg, val) {
		return elem.form['nette-submittedBy'] === elem;
	}
};
Nette.toggleForm = function(form, firsttime) {
	var i;
	Nette.toggles = {};
	for (i = 0; i < form.elements.length; i++) {
		if (form.elements[i].nodeName.toLowerCase() in {input: 1, select: 1, textarea: 1, button: 1}) {
			Nette.toggleControl(form.elements[i], null, null, firsttime);
		}
	}

	for (i in Nette.toggles) {
		Nette.toggle(i, Nette.toggles[i]);
	}
};
Nette.toggleControl = function(elem, rules, topSuccess, firsttime) {
	rules = rules || Nette.parseJSON(elem.getAttribute('data-nette-rules'));
	var has = false, __hasProp = Object.prototype.hasOwnProperty, handler = function() {
		Nette.toggleForm(elem.form);
	};
	for (var id = 0, len = rules.length; id < len; id++) {
		var rule = rules[id], op = rule.op.match(/(~)?([^?]+)/);
		rule.neg = op[1];
		rule.op = op[2];
		rule.condition = !!rule.rules;
		if (!rule.condition) {
			continue;
		}
		var el = rule.control ? elem.form.elements[rule.control] : elem;
		var success = topSuccess;
		if (success !== false) {
			success = Nette.validateRule(el, rule.op, rule.arg);
			if (success === null) {
				continue;
			}
			if (rule.neg) {
				success = !success;
			}
		}
		if (Nette.toggleControl(elem, rule.rules, success, firsttime) || rule.toggle) {
			has = true;
			if (firsttime) {
				if (!el.nodeName) {
					for (var i = 0; i < el.length; i++) {
						Nette.addEvent(el[i], 'click', handler);
					}
				} else if (el.nodeName.toLowerCase() === 'select') {
					Nette.addEvent(el, 'change', handler);
				} else {
					Nette.addEvent(el, 'click', handler);
				}
			}
			for (var id2 in rule.toggle || []) {
				if (__hasProp.call(rule.toggle, id2)) {
					Nette.toggles[id2] = Nette.toggles[id2] || (success && rule.toggle[id2]);
				}
			}
		}
	}
	return has;
};
Nette.parseJSON = function(s) {
	s = s || '[]';
	if (s.substr(0, 3) === '{op') {
		return eval('[' + s + ']');
	}
	return window.JSON && window.JSON.parse ? JSON.parse(s) : eval(s);
};
Nette.toggle = function(id, visible) {
	var elem = document.getElementById(id);
	if (elem) {
		elem.style.display = visible ? '' : 'none';
	}
};
Nette.initForm = function(form) {
	form.noValidate = 'novalidate';

	Nette.addEvent(form, 'submit', function() {
		return Nette.validateForm(form);
	});
	Nette.addEvent(form, 'click', function(e) {
		e = e || event;
		var target = e.target || e.srcElement;
		form['nette-submittedBy'] = (target.type in {submit: 1, image: 1}) ? target : null;
	});
	Nette.toggleForm(form, true);
	if (/MSIE/.exec(navigator.userAgent)) {
		var labels = {},
			wheelHandler = function() {
				return false;
			},
			clickHandler = function() {
				document.getElementById(this.htmlFor).focus();
				return false;
			};

		for (i = 0, elms = form.getElementsByTagName('label'); i < elms.length; i++) {
			labels[elms[i].htmlFor] = elms[i];
		}
		for (i = 0, elms = form.getElementsByTagName('select'); i < elms.length; i++) {
			Nette.addEvent(elms[i], 'mousewheel', wheelHandler);
			if (labels[elms[i].htmlId]) {
				Nette.addEvent(labels[elms[i].htmlId], 'click', clickHandler);
			}
		}
	}
};
Nette.isArray = function(arg) {
	return Object.prototype.toString.call(arg) === '[object Array]';
};
Nette.addEvent(window, 'load', function() {
	for (var i = 0; i < document.forms.length; i++) {
		Nette.initForm(document.forms[i]);
	}
});

//pretty foto
(function(e) {
	function t() {
		var e = location.href;
		hashtag = e.indexOf("#prettyPhoto") !== -1 ? decodeURI(e.substring(e.indexOf("#prettyPhoto") + 1, e.length)) : false;
		return hashtag
	}
	function n() {
		if (typeof theRel == "undefined")
			return;
		location.hash = theRel + "/" + rel_index + "/"
	}
	function r() {
		if (location.href.indexOf("#prettyPhoto") !== -1)
			location.hash = "prettyPhoto"
	}
	function i(e, t) {
		e = e.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var n = "[\\?&]" + e + "=([^&#]*)";
		var r = new RegExp(n);
		var i = r.exec(t);
		return i == null ? "" : i[1]
	}
	e.prettyPhoto = {version: "3.1.5"};
	e.fn.prettyPhoto = function(s) {
		function g() {
			e(".pp_loaderIcon").hide();
			projectedTop = scroll_pos["scrollTop"] + (d / 2 - a["containerHeight"] / 2);
			if (projectedTop < 0)
				projectedTop = 0;
			$ppt.fadeTo(settings.animation_speed, 1);
			$pp_pic_holder.find(".pp_content").animate({height: a["contentHeight"], width: a["contentWidth"]}, settings.animation_speed);
			$pp_pic_holder.animate({top: projectedTop, left: v / 2 - a["containerWidth"] / 2 < 0 ? 0 : v / 2 - a["containerWidth"] / 2, width: a["containerWidth"]}, settings.animation_speed, function() {
				$pp_pic_holder.find(".pp_hoverContainer,#fullResImage").height(a["height"]).width(a["width"]);
				$pp_pic_holder.find(".pp_fade").fadeIn(settings.animation_speed);
				if (isSet && S(pp_images[set_position]) == "image") {
					$pp_pic_holder.find(".pp_hoverContainer").show()
				} else {
					$pp_pic_holder.find(".pp_hoverContainer").hide()
				}
				if (settings.allow_expand) {
					if (a["resized"]) {
						e("a.pp_expand,a.pp_contract").show()
					} else {
						e("a.pp_expand").hide()
					}
				}
				if (settings.autoplay_slideshow && !m && !f)
					e.prettyPhoto.startSlideshow();
				settings.changepicturecallback();
				f = true
			});
			C();
			s.ajaxcallback()
		}
		function y(t) {
			$pp_pic_holder.find("#pp_full_res object,#pp_full_res embed").css("visibility", "hidden");
			$pp_pic_holder.find(".pp_fade").fadeOut(settings.animation_speed, function() {
				e(".pp_loaderIcon").show();
				t()
			})
		}
		function b(t) {
			t > 1 ? e(".pp_nav").show() : e(".pp_nav").hide()
		}
		function w(e, t) {
			resized = false;
			E(e, t);
			imageWidth = e, imageHeight = t;
			if ((p > v || h > d) && doresize && settings.allow_resize && !u) {
				resized = true, fitting = false;
				while (!fitting) {
					if (p > v) {
						imageWidth = v - 200;
						imageHeight = t / e * imageWidth
					} else if (h > d) {
						imageHeight = d - 200;
						imageWidth = e / t * imageHeight
					} else {
						fitting = true
					}
					h = imageHeight, p = imageWidth
				}
				if (p > v || h > d) {
					w(p, h)
				}
				E(imageWidth, imageHeight)
			}
			return{width: Math.floor(imageWidth), height: Math.floor(imageHeight), containerHeight: Math.floor(h), containerWidth: Math.floor(p) + settings.horizontal_padding * 2, contentHeight: Math.floor(l), contentWidth: Math.floor(c), resized: resized}
		}
		function E(t, n) {
			t = parseFloat(t);
			n = parseFloat(n);
			$pp_details = $pp_pic_holder.find(".pp_details");
			$pp_details.width(t);
			detailsHeight = parseFloat($pp_details.css("marginTop")) + parseFloat($pp_details.css("marginBottom"));
			$pp_details = $pp_details.clone().addClass(settings.theme).width(t).appendTo(e("body")).css({position: "absolute", top: -1e4});
			detailsHeight += $pp_details.height();
			detailsHeight = detailsHeight <= 34 ? 36 : detailsHeight;
			$pp_details.remove();
			$pp_title = $pp_pic_holder.find(".ppt");
			$pp_title.width(t);
			titleHeight = parseFloat($pp_title.css("marginTop")) + parseFloat($pp_title.css("marginBottom"));
			$pp_title = $pp_title.clone().appendTo(e("body")).css({position: "absolute", top: -1e4});
			titleHeight += $pp_title.height();
			$pp_title.remove();
			l = n + detailsHeight;
			c = t;
			h = l + titleHeight + $pp_pic_holder.find(".pp_top").height() + $pp_pic_holder.find(".pp_bottom").height();
			p = t
		}
		function S(e) {
			if (e.match(/youtube\.com\/watch/i) || e.match(/youtu\.be/i)) {
				return"youtube"
			} else if (e.match(/vimeo\.com/i)) {
				return"vimeo"
			} else if (e.match(/\b.mov\b/i)) {
				return"quicktime"
			} else if (e.match(/\b.swf\b/i)) {
				return"flash"
			} else if (e.match(/\biframe=true\b/i)) {
				return"iframe"
			} else if (e.match(/\bajax=true\b/i)) {
				return"ajax"
			} else if (e.match(/\bcustom=true\b/i)) {
				return"custom"
			} else if (e.substr(0, 1) == "#") {
				return"inline"
			} else {
				return"image"
			}
		}
		function x() {
			if (doresize && typeof $pp_pic_holder != "undefined") {
				scroll_pos = T();
				contentHeight = $pp_pic_holder.height(), contentwidth = $pp_pic_holder.width();
				projectedTop = d / 2 + scroll_pos["scrollTop"] - contentHeight / 2;
				if (projectedTop < 0)
					projectedTop = 0;
				if (contentHeight > d)
					return;
				$pp_pic_holder.css({top: projectedTop, left: v / 2 + scroll_pos["scrollLeft"] - contentwidth / 2})
			}
		}
		function T() {
			if (self.pageYOffset) {
				return{scrollTop: self.pageYOffset, scrollLeft: self.pageXOffset}
			} else if (document.documentElement && document.documentElement.scrollTop) {
				return{scrollTop: document.documentElement.scrollTop, scrollLeft: document.documentElement.scrollLeft}
			} else if (document.body) {
				return{scrollTop: document.body.scrollTop, scrollLeft: document.body.scrollLeft}
			}
		}
		function N() {
			d = e(window).height(), v = e(window).width();
			if (typeof $pp_overlay != "undefined")
				$pp_overlay.height(e(document).height()).width(v)
		}
		function C() {
			if (isSet && settings.overlay_gallery && S(pp_images[set_position]) == "image") {
				itemWidth = 52 + 5;
				navWidth = settings.theme == "facebook" || settings.theme == "pp_default" ? 50 : 30;
				itemsPerPage = Math.floor((a["containerWidth"] - 100 - navWidth) / itemWidth);
				itemsPerPage = itemsPerPage < pp_images.length ? itemsPerPage : pp_images.length;
				totalPage = Math.ceil(pp_images.length / itemsPerPage) - 1;
				if (totalPage == 0) {
					navWidth = 0;
					$pp_gallery.find(".pp_arrow_next,.pp_arrow_previous").hide()
				} else {
					$pp_gallery.find(".pp_arrow_next,.pp_arrow_previous").show()
				}
				galleryWidth = itemsPerPage * itemWidth;
				fullGalleryWidth = pp_images.length * itemWidth;
				$pp_gallery.css("margin-left", -(galleryWidth / 2 + navWidth / 2)).find("div:first").width(galleryWidth + 5).find("ul").width(fullGalleryWidth).find("li.selected").removeClass("selected");
				goToPage = Math.floor(set_position / itemsPerPage) < totalPage ? Math.floor(set_position / itemsPerPage) : totalPage;
				e.prettyPhoto.changeGalleryPage(goToPage);
				$pp_gallery_li.filter(":eq(" + set_position + ")").addClass("selected")
			} else {
				$pp_pic_holder.find(".pp_content").unbind("mouseenter mouseleave")
			}
		}
		function k(t) {
			if (settings.social_tools)
				facebook_like_link = settings.social_tools.replace("{location_href}", encodeURIComponent(location.href));
			settings.markup = settings.markup.replace("{pp_social}", "");
			e("body").append(settings.markup);
			$pp_pic_holder = e(".pp_pic_holder"), $ppt = e(".ppt"), $pp_overlay = e("div.pp_overlay");
			if (isSet && settings.overlay_gallery) {
				currentGalleryPage = 0;
				toInject = "";
				for (var n = 0; n < pp_images.length; n++) {
					if (!pp_images[n].match(/\b(jpg|jpeg|png|gif)\b/gi)) {
						classname = "default";
						img_src = ""
					} else {
						classname = "";
						img_src = pp_images[n]
					}
					toInject += "<li class='" + classname + "'><a href='#'><img src='" + img_src + "' width='50' alt='' /></a></li>"
				}
				toInject = settings.gallery_markup.replace(/{gallery}/g, toInject);
				$pp_pic_holder.find("#pp_full_res").after(toInject);
				$pp_gallery = e(".pp_pic_holder .pp_gallery"), $pp_gallery_li = $pp_gallery.find("li");
				$pp_gallery.find(".pp_arrow_next").click(function() {
					e.prettyPhoto.changeGalleryPage("next");
					e.prettyPhoto.stopSlideshow();
					return false
				});
				$pp_gallery.find(".pp_arrow_previous").click(function() {
					e.prettyPhoto.changeGalleryPage("previous");
					e.prettyPhoto.stopSlideshow();
					return false
				});
				$pp_pic_holder.find(".pp_content").hover(function() {
					$pp_pic_holder.find(".pp_gallery:not(.disabled)").fadeIn()
				}, function() {
					$pp_pic_holder.find(".pp_gallery:not(.disabled)").fadeOut()
				});
				itemWidth = 52 + 5;
				$pp_gallery_li.each(function(t) {
					e(this).find("a").click(function() {
						e.prettyPhoto.changePage(t);
						e.prettyPhoto.stopSlideshow();
						return false
					})
				})
			}
			if (settings.slideshow) {
				$pp_pic_holder.find(".pp_nav").prepend('<a href="#" class="pp_play">Play</a>');
				$pp_pic_holder.find(".pp_nav .pp_play").click(function() {
					e.prettyPhoto.startSlideshow();
					return false
				})
			}
			$pp_pic_holder.attr("class", "pp_pic_holder " + settings.theme);
			$pp_overlay.css({opacity: 0, height: e(document).height(), width: e(window).width()}).bind("click", function() {
				if (!settings.modal)
					e.prettyPhoto.close()
			});
			e("a.pp_close").bind("click", function() {
				e.prettyPhoto.close();
				return false
			});
			if (settings.allow_expand) {
				e("a.pp_expand").bind("click", function(t) {
					if (e(this).hasClass("pp_expand")) {
						e(this).removeClass("pp_expand").addClass("pp_contract");
						doresize = false
					} else {
						e(this).removeClass("pp_contract").addClass("pp_expand");
						doresize = true
					}
					y(function() {
						e.prettyPhoto.open()
					});
					return false
				})
			}
			$pp_pic_holder.find(".pp_previous, .pp_nav .pp_arrow_previous").bind("click", function() {
				e.prettyPhoto.changePage("previous");
				e.prettyPhoto.stopSlideshow();
				return false
			});
			$pp_pic_holder.find(".pp_next, .pp_nav .pp_arrow_next").bind("click", function() {
				e.prettyPhoto.changePage("next");
				e.prettyPhoto.stopSlideshow();
				return false
			});
			x()
		}
		s = jQuery.extend({hook: "rel", animation_speed: "fast", ajaxcallback: function() {
			}, slideshow: 5e3, autoplay_slideshow: false, opacity: .8, show_title: true, allow_resize: true, allow_expand: true, default_width: 500, default_height: 344, counter_separator_label: "/", theme: "pp_default", horizontal_padding: 20, hideflash: false, wmode: "opaque", autoplay: true, modal: false, deeplinking: true, overlay_gallery: true, overlay_gallery_max: 30, keyboard_shortcuts: true, changepicturecallback: function() {
			}, callback: function() {
			}, ie6_fallback: true, markup: '<div class="pp_pic_holder"> 						<div class="ppt"> </div> 						<div class="pp_top"> 							<div class="pp_left"></div> 							<div class="pp_middle"></div> 							<div class="pp_right"></div> 						</div> 						<div class="pp_content_container"> 							<div class="pp_left"> 							<div class="pp_right"> 								<div class="pp_content"> 									<div class="pp_loaderIcon"></div> 									<div class="pp_fade"> 										<a href="#" class="pp_expand" title="Expand the image">Expand</a> 										<div class="pp_hoverContainer"> 											<a class="pp_next" href="#">next</a> 											<a class="pp_previous" href="#">previous</a> 										</div> 										<div id="pp_full_res"></div> 										<div class="pp_details"> 											<div class="pp_nav"> 												<a href="#" class="pp_arrow_previous">Previous</a> 												<p class="currentTextHolder">0/0</p> 												<a href="#" class="pp_arrow_next">Next</a> 											</div> 											<p class="pp_description"></p> 											<div class="pp_social">{pp_social}</div> 											<a class="pp_close" href="#">Close</a> 										</div> 									</div> 								</div> 							</div> 							</div> 						</div> 						<div class="pp_bottom"> 							<div class="pp_left"></div> 							<div class="pp_middle"></div> 							<div class="pp_right"></div> 						</div> 					</div> 					<div class="pp_overlay"></div>', gallery_markup: '<div class="pp_gallery"> 								<a href="#" class="pp_arrow_previous">Previous</a> 								<div> 									<ul> 										{gallery} 									</ul> 								</div> 								<a href="#" class="pp_arrow_next">Next</a> 							</div>', image_markup: '<img id="fullResImage" src="{path}" />', flash_markup: '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="{width}" height="{height}"><param name="wmode" value="{wmode}" /><param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="movie" value="{path}" /><embed src="{path}" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="{width}" height="{height}" wmode="{wmode}"></embed></object>', quicktime_markup: '<object classid="clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B" codebase="http://www.apple.com/qtactivex/qtplugin.cab" height="{height}" width="{width}"><param name="src" value="{path}"><param name="autoplay" value="{autoplay}"><param name="type" value="video/quicktime"><embed src="{path}" height="{height}" width="{width}" autoplay="{autoplay}" type="video/quicktime" pluginspage="http://www.apple.com/quicktime/download/"></embed></object>', iframe_markup: '<iframe src ="{path}" width="{width}" height="{height}" frameborder="no"></iframe>', inline_markup: '<div class="pp_inline">{content}</div>', custom_markup: "", social_tools: '<div class="twitter"><a href="http://twitter.com/share" class="twitter-share-button" data-count="none">Tweet</a><script type="text/javascript" src="http://platform.twitter.com/widgets.js"></script></div><div class="facebook"><iframe src="//www.facebook.com/plugins/like.php?locale=en_US&href={location_href}&layout=button_count&show_faces=true&width=500&action=like&font&colorscheme=light&height=23" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:500px; height:23px;" allowTransparency="true"></iframe></div>'}, s);
		var o = this, u = false, a, f, l, c, h, p, d = e(window).height(), v = e(window).width(), m;
		doresize = true, scroll_pos = T();
		e(window).unbind("resize.prettyphoto").bind("resize.prettyphoto", function() {
			x();
			N()
		});
		if (s.keyboard_shortcuts) {
			e(document).unbind("keydown.prettyphoto").bind("keydown.prettyphoto", function(t) {
				if (typeof $pp_pic_holder != "undefined") {
					if ($pp_pic_holder.is(":visible")) {
						switch (t.keyCode) {
							case 37:
								e.prettyPhoto.changePage("previous");
								t.preventDefault();
								break;
							case 39:
								e.prettyPhoto.changePage("next");
								t.preventDefault();
								break;
							case 27:
								if (!settings.modal)
									e.prettyPhoto.close();
								t.preventDefault();
								break
						}
					}
				}
			})
		}
		e.prettyPhoto.initialize = function() {
			settings = s;
			if (settings.theme == "pp_default")
				settings.horizontal_padding = 16;
			theRel = e(this).attr(settings.hook);
			galleryRegExp = /\[(?:.*)\]/;
			isSet = galleryRegExp.exec(theRel) ? true : false;
			pp_images = isSet ? jQuery.map(o, function(t, n) {
				if (e(t).attr(settings.hook).indexOf(theRel) != -1)
					return e(t).attr("href")
			}) : e.makeArray(e(this).attr("href"));
			pp_titles = isSet ? jQuery.map(o, function(t, n) {
				if (e(t).attr(settings.hook).indexOf(theRel) != -1)
					return e(t).find("img").attr("alt") ? e(t).find("img").attr("alt") : ""
			}) : e.makeArray(e(this).find("img").attr("alt"));
			pp_descriptions = isSet ? jQuery.map(o, function(t, n) {
				if (e(t).attr(settings.hook).indexOf(theRel) != -1)
					return e(t).attr("title") ? e(t).attr("title") : ""
			}) : e.makeArray(e(this).attr("title"));
			if (pp_images.length > settings.overlay_gallery_max)
				settings.overlay_gallery = false;
			set_position = jQuery.inArray(e(this).attr("href"), pp_images);
			rel_index = isSet ? set_position : e("a[" + settings.hook + "^='" + theRel + "']").index(e(this));
			k(this);
			if (settings.allow_resize)
				e(window).bind("scroll.prettyphoto", function() {
					x()
				});
			e.prettyPhoto.open();
			return false
		};
		e.prettyPhoto.open = function(t) {
			$("body").keypress(function(t) {
				switch (t.keyCode) {
					case 13:
						t.preventDefault();
						break;
				}
			});
			if (typeof settings == "undefined") {
				settings = s;
				pp_images = e.makeArray(arguments[0]);
				pp_titles = arguments[1] ? e.makeArray(arguments[1]) : e.makeArray("");
				pp_descriptions = arguments[2] ? e.makeArray(arguments[2]) : e.makeArray("");
				isSet = pp_images.length > 1 ? true : false;
				set_position = arguments[3] ? arguments[3] : 0;
				k(t.target)
			}
			if (settings.hideflash)
				e("object,embed,iframe[src*=youtube],iframe[src*=vimeo]").css("visibility", "hidden");
			b(e(pp_images).size());
			e(".pp_loaderIcon").show();
			if (settings.deeplinking)
				n();
			if (settings.social_tools) {
				facebook_like_link = settings.social_tools.replace("{location_href}", encodeURIComponent(location.href));
				$pp_pic_holder.find(".pp_social").html(facebook_like_link)
			}
			if ($ppt.is(":hidden"))
				$ppt.css("opacity", 0).show();
			$pp_overlay.show().fadeTo(settings.animation_speed, settings.opacity);
			$pp_pic_holder.find(".currentTextHolder").text(set_position + 1 + settings.counter_separator_label + e(pp_images).size());
			if (typeof pp_descriptions[set_position] != "undefined" && pp_descriptions[set_position] != "") {
				$pp_pic_holder.find(".pp_description").show().html(unescape(pp_descriptions[set_position]))
			} else {
				$pp_pic_holder.find(".pp_description").hide()
			}
			movie_width = parseFloat(i("width", pp_images[set_position])) ? i("width", pp_images[set_position]) : settings.default_width.toString();
			movie_height = parseFloat(i("height", pp_images[set_position])) ? i("height", pp_images[set_position]) : settings.default_height.toString();
			u = false;
			if (movie_height.indexOf("%") != -1) {
				movie_height = parseFloat(e(window).height() * parseFloat(movie_height) / 100 - 150);
				u = true
			}
			if (movie_width.indexOf("%") != -1) {
				movie_width = parseFloat(e(window).width() * parseFloat(movie_width) / 100 - 150);
				u = true
			}
			$pp_pic_holder.fadeIn(function() {
				settings.show_title && pp_titles[set_position] != "" && typeof pp_titles[set_position] != "undefined" ? $ppt.html(unescape(pp_titles[set_position])) : $ppt.html(" ");
				imgPreloader = "";
				skipInjection = false;
				switch (S(pp_images[set_position])) {
					case"image":
						imgPreloader = new Image;
						nextImage = new Image;
						if (isSet && set_position < e(pp_images).size() - 1)
							nextImage.src = pp_images[set_position + 1];
						prevImage = new Image;
						if (isSet && pp_images[set_position - 1])
							prevImage.src = pp_images[set_position - 1];
						$pp_pic_holder.find("#pp_full_res")[0].innerHTML = settings.image_markup.replace(/{path}/g, pp_images[set_position]);
						imgPreloader.onload = function() {
							a = w(imgPreloader.width, imgPreloader.height);
							g()
						};
						imgPreloader.onerror = function() {
							alert("Image cannot be loaded. Make sure the path is correct and image exist.");
							e.prettyPhoto.close()
						};
						imgPreloader.src = pp_images[set_position];
						break;
					case"youtube":
						a = w(movie_width, movie_height);
						movie_id = i("v", pp_images[set_position]);
						if (movie_id == "") {
							movie_id = pp_images[set_position].split("youtu.be/");
							movie_id = movie_id[1];
							if (movie_id.indexOf("?") > 0)
								movie_id = movie_id.substr(0, movie_id.indexOf("?"));
							if (movie_id.indexOf("&") > 0)
								movie_id = movie_id.substr(0, movie_id.indexOf("&"))
						}
						movie = "http://www.youtube.com/embed/" + movie_id;
						i("rel", pp_images[set_position]) ? movie += "?rel=" + i("rel", pp_images[set_position]) : movie += "?rel=1";
						if (settings.autoplay)
							movie += "&autoplay=1";
						toInject = settings.iframe_markup.replace(/{width}/g, a["width"]).replace(/{height}/g, a["height"]).replace(/{wmode}/g, settings.wmode).replace(/{path}/g, movie);
						break;
					case"vimeo":
						a = w(movie_width, movie_height);
						movie_id = pp_images[set_position];
						var t = /http(s?):\/\/(www\.)?vimeo.com\/(\d+)/;
						var n = movie_id.match(t);
						movie = "http://player.vimeo.com/video/" + n[3] + "?title=0&byline=0&portrait=0";
						if (settings.autoplay)
							movie += "&autoplay=1;";
						vimeo_width = a["width"] + "/embed/?moog_width=" + a["width"];
						toInject = settings.iframe_markup.replace(/{width}/g, vimeo_width).replace(/{height}/g, a["height"]).replace(/{path}/g, movie);
						break;
					case"quicktime":
						a = w(movie_width, movie_height);
						a["height"] += 15;
						a["contentHeight"] += 15;
						a["containerHeight"] += 15;
						toInject = settings.quicktime_markup.replace(/{width}/g, a["width"]).replace(/{height}/g, a["height"]).replace(/{wmode}/g, settings.wmode).replace(/{path}/g, pp_images[set_position]).replace(/{autoplay}/g, settings.autoplay);
						break;
					case"flash":
						a = w(movie_width, movie_height);
						flash_vars = pp_images[set_position];
						flash_vars = flash_vars.substring(pp_images[set_position].indexOf("flashvars") + 10, pp_images[set_position].length);
						filename = pp_images[set_position];
						filename = filename.substring(0, filename.indexOf("?"));
						toInject = settings.flash_markup.replace(/{width}/g, a["width"]).replace(/{height}/g, a["height"]).replace(/{wmode}/g, settings.wmode).replace(/{path}/g, filename + "?" + flash_vars);
						break;
					case"iframe":
						a = w(movie_width, movie_height);
						frame_url = pp_images[set_position];
						frame_url = frame_url.substr(0, frame_url.indexOf("iframe") - 1);
						toInject = settings.iframe_markup.replace(/{width}/g, a["width"]).replace(/{height}/g, a["height"]).replace(/{path}/g, frame_url);
						break;
					case"ajax":
						doresize = false;
						a = w(movie_width, movie_height);
						doresize = true;
						skipInjection = true;
						e.get(pp_images[set_position], function(e) {
							toInject = settings.inline_markup.replace(/{content}/g, e);
							$pp_pic_holder.find("#pp_full_res")[0].innerHTML = toInject;
							g()
						});
						break;
					case"custom":
						a = w(movie_width, movie_height);
						toInject = settings.custom_markup;
						break;
					case"inline":
						myClone = e(pp_images[set_position]).clone().append('<br clear="all" />').css({width: settings.default_width}).wrapInner('<div id="pp_full_res"><div class="pp_inline"></div></div>').appendTo(e("body")).show();
						doresize = false;
						a = w(e(myClone).width(), e(myClone).height());
						doresize = true;
						e(myClone).remove();
						toInject = settings.inline_markup.replace(/{content}/g, e(pp_images[set_position]).html());
						break
				}
				if (!imgPreloader && !skipInjection) {
					$pp_pic_holder.find("#pp_full_res")[0].innerHTML = toInject;
					g()
				}
			});
			return false
		};
		e.prettyPhoto.changePage = function(t) {
			currentGalleryPage = 0;
			if (t == "previous") {
				set_position--;
				if (set_position < 0)
					set_position = e(pp_images).size() - 1
			} else if (t == "next") {
				set_position++;
				if (set_position > e(pp_images).size() - 1)
					set_position = 0
			} else {
				set_position = t
			}
			rel_index = set_position;
			if (!doresize)
				doresize = true;
			if (settings.allow_expand) {
				e(".pp_contract").removeClass("pp_contract").addClass("pp_expand")
			}
			y(function() {
				e.prettyPhoto.open()
			})
		};
		e.prettyPhoto.changeGalleryPage = function(e) {
			if (e == "next") {
				currentGalleryPage++;
				if (currentGalleryPage > totalPage)
					currentGalleryPage = 0
			} else if (e == "previous") {
				currentGalleryPage--;
				if (currentGalleryPage < 0)
					currentGalleryPage = totalPage
			} else {
				currentGalleryPage = e
			}
			slide_speed = e == "next" || e == "previous" ? settings.animation_speed : 0;
			slide_to = currentGalleryPage * itemsPerPage * itemWidth;
			$pp_gallery.find("ul").animate({left: -slide_to}, slide_speed)
		};
		e.prettyPhoto.startSlideshow = function() {
			if (typeof m == "undefined") {
				$pp_pic_holder.find(".pp_play").unbind("click").removeClass("pp_play").addClass("pp_pause").click(function() {
					e.prettyPhoto.stopSlideshow();
					return false
				});
				m = setInterval(e.prettyPhoto.startSlideshow, settings.slideshow)
			} else {
				e.prettyPhoto.changePage("next")
			}
		};
		e.prettyPhoto.stopSlideshow = function() {
			$pp_pic_holder.find(".pp_pause").unbind("click").removeClass("pp_pause").addClass("pp_play").click(function() {
				e.prettyPhoto.startSlideshow();
				return false
			});
			clearInterval(m);
			m = undefined
		};
		e.prettyPhoto.close = function() {
			$("body").off();
			if ($pp_overlay.is(":animated"))
				return;
			e.prettyPhoto.stopSlideshow();
			$pp_pic_holder.stop().find("object,embed").css("visibility", "hidden");
			e("div.pp_pic_holder,div.ppt,.pp_fade").fadeOut(settings.animation_speed, function() {
				e(this).remove()
			});
			$pp_overlay.fadeOut(settings.animation_speed, function() {
				if (settings.hideflash)
					e("object,embed,iframe[src*=youtube],iframe[src*=vimeo]").css("visibility", "visible");
				e(this).remove();
				e(window).unbind("scroll.prettyphoto");
				r();
				settings.callback();
				doresize = true;
				f = false;
				delete settings
			})
		};
		if (!pp_alreadyInitialized && t()) {
			pp_alreadyInitialized = true;
			hashIndex = t();
			hashRel = hashIndex;
			hashIndex = hashIndex.substring(hashIndex.indexOf("/") + 1, hashIndex.length - 1);
			hashRel = hashRel.substring(0, hashRel.indexOf("/"));
			setTimeout(function() {
				e("a[" + s.hook + "^='" + hashRel + "']:eq(" + hashIndex + ")").trigger("click")
			}, 50)
		}
		return this.unbind("click.prettyphoto").bind("click.prettyphoto", e.prettyPhoto.initialize)
	};
})(jQuery);
var pp_alreadyInitialized = false;