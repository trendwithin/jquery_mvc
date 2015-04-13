/*global jQuery, Handlebars */
jQuery(function ($) {
	'use strict';

	Handlebars.registerHelper('eq', function(a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	var TOKEN = prompt("Please enter your access token:");

	var util = {
		uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}

			return uuid;
		},
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		},
		store: function (namespace, data) {
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	var App = {
		init: function () {
			this.todos = util.store('todos-jquery');
			this.cacheElements();
			this.bindEvents();
			this.gitIssues();

			Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');
		},
		cacheElements: function () {
			this.todoTemplate = Handlebars.compile($('#todo-template').html());
			this.footerTemplate = Handlebars.compile($('#footer-template').html());
			this.$todoApp = $('#todoapp');
			this.$header = this.$todoApp.find('#header');
			this.$main = this.$todoApp.find('#main');
			this.$footer = this.$todoApp.find('#footer');
			this.$newTodo = this.$header.find('#new-todo');
			this.$toggleAll = this.$main.find('#toggle-all');
			this.$todoList = this.$main.find('#todo-list');
			this.$count = this.$footer.find('#todo-count');
			this.$clearBtn = this.$footer.find('#clear-completed');
		},
		bindEvents: function () {
			var list = this.$todoList;
			this.$newTodo.on('keyup', this.create.bind(this));
			this.$toggleAll.on('change', this.toggleAll.bind(this));
			this.$footer.on('click', '#clear-completed', this.destroyCompleted.bind(this));
			list.on('change', '.toggle', this.toggle.bind(this));
			list.on('dblclick', 'label', this.edit.bind(this));
			list.on('keyup', '.edit', this.editKeyup.bind(this));
			list.on('focusout', '.edit', this.update.bind(this));
			list.on('click', '.destroy', this.destroy.bind(this));
		},
		render: function () {
			var todos = this.getFilteredTodos();
			this.$todoList.html(this.todoTemplate(todos));
			this.$main.toggle(todos.length > 0);
			this.$toggleAll.prop('checked', this.getActiveTodos().length === 0);
			this.renderFooter();
			this.$newTodo.focus();
			util.store('todos-jquery', this.todos);
		},
		renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});

			this.$footer.toggle(todoCount > 0).html(template);
		},
		toggleAll: function (e) {
			var isChecked = $(e.target).prop('checked');

			this.todos.forEach(function (todo) {
				todo.completed = isChecked;
			});

			this.render();
		},
		getActiveTodos: function () {
			return this.todos.filter(function (todo) {
				return !todo.completed;
			});
		},
		getCompletedTodos: function () {
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},
		getFilteredTodos: function () {
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;
		},
		destroyCompleted: function () {
			this.todos = this.getActiveTodos();
			this.filter = 'all';
			this.render();
		},
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
		indexFromEl: function (el) {
			var id = $(el).closest('li').data('id');
			var todos = this.todos;
			var i = todos.length;

			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},
		create: function (e) {
			var $input = $(e.target);
			var $val = $input.val().trim();

			if (e.which !== ENTER_KEY || !$val) {
				return;
			}
			$.post('https://api.github.com/repos/Tybosis/issue_tests/issues?access_token=' + TOKEN, JSON.stringify({ "title": $val }))
			.done(function( data ) {
				App.todos.unshift({
					id: data.number,
					title: data.title,
					completed: false
				});
				App.render();
			});
			$input.val('');
		},
		toggle: function (e) {
			var i = this.indexFromEl(e.target);
			var $status = "";
			var $id = this.todos[i].id;
			if(this.todos[i].completed) {
				$status = "open";
			} else {
				$status = "closed";
			}
			$.ajax({
				url: "https://api.github.com/repos/Tybosis/issue_tests/issues/" + $id + "?access_token=" + TOKEN,
				data: JSON.stringify({ "state": $status }),
				type: 'PATCH',
				contentType : 'application/json',
				processData: false,
				dataType: 'json'
			});
			this.todos[i].completed = !this.todos[i].completed;
			this.render();
		},
		edit: function (e) {
			var $input = $(e.target).closest('li').addClass('editing').find('.edit');
			$input.val($input.val()).focus();
		},
		editKeyup: function (e) {
			if (e.which === ENTER_KEY) {
				e.target.blur();
			}

			if (e.which === ESCAPE_KEY) {
				$(e.target).data('abort', true).blur();
			}
		},
		update: function (e) {
			var el = e.target;
			var $el = $(el);
			var $val = $el.val().trim();
			var i = this.indexFromEl(el);
			var $id = this.todos[i].id;

			if ($el.data('abort')) {
				$el.data('abort', false);
				this.render();
				return;
			}


			if ($val) {
				this.todos[i].title = $val;
			} else {
				this.todos.splice(i, 1);
			}

			this.render();
			$.ajax({
				url: 'https://api.github.com/repos/Tybosis/issue_tests/issues/' + $id + '?access_token=' + TOKEN,
				data: JSON.stringify({ "title": $val }),
				type: 'PATCH',
				contentType : 'application/json',
				processData: false,
				dataType: 'json'
			});
		},
		destroy: function (e) {
			this.todos.splice(this.indexFromEl(e.target), 1);
			this.render();
		},

		gitIssues: function() {
			if(this.todos.length) {
				return;
			}
	    $.getJSON( 'https://api.github.com/repos/Tybosis/issue_tests/issues?state=all&access_token=' + TOKEN, function( data ) {
	      var $state = false;
	      $.each( data, function( key, value ){
      		if (value.state == "open"){
      			$state = false;
      		} else {
      			$state = true;
      		}

		      App.todos.push({
		      	id: value.number,
		      	title: value.title.toString(),
		      	completed: $state
		      });

		      App.render();
		      $("h1").text("New Issue");
		      $("#new-todo").attr("placeholder", "Open a new issue").val("").focus().blur();
		    });
	    });
   	}
  };

	App.init();
});
