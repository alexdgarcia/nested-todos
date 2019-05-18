var util = {
	uuid: function() {
		var uuidString = "";

		for (var i = 0; i < 32; i++) {
			if (i === 8 || i === 12 || i === 16 || i === 20) {
				uuidString += "-";
			}
			
			var randomInt = Math.floor(Math.random() * 16);
			uuidString += randomInt.toString(16);
		}

		return uuidString;
	},
	save: function(namespace, data) {
		if (arguments.length > 1) {
			localStorage.setItem(namespace, JSON.stringify(data));
		} else {
			return JSON.parse(localStorage.getItem(namespace)) || [];
		}
	},
}
var App = {
	todos: /*util.save('todos')*/[],
	init: function() {
		// 1. This selects the Handlebars code from the DOM and stores it in a variable:
		var mainTemplate 	= document.querySelector('#handlebars-todo-list-main').innerHTML;
		// 2. This selects the Handlebars code from the DOM and stores it in a variable:
		var partialTemplate = document.querySelector('#handlebars-todo-list-partial').innerHTML;
		// 3. Compile the template data into a function using Handlebars compile() method:
		this.todoTemplateMain = Handlebars.compile(mainTemplate);
		// 4. Partial templates must be registered. These templates are denoted with the ">"
		// symbol and allow achieving a level of recursion in Handlebars.
		// More info on Partial Templates here:
		// -https://handlebarsjs.com/partials.html
		// -http://www.independent-software.com/recursion-in-handlebars-with-depth-level.html
		Handlebars.registerPartial('todo', Handlebars.compile(partialTemplate));
		this.shallowRender();
		this.createEventListeners();
	},
	// render: function() {
	// 	// 5. Select the element you want to insert Handlebars code into:
	// 	var todoList = document.querySelector('#todo-list');

	// 	if (!this.todos.length) {
	// 		this.createTodo(this.todos, '');
	// 	} 
	// 	// 6. Set the innerHTML of your element equal to the result of calling the compiled
	// 	// Handlebars function with a given context (this.todos). This will return a string
	// 	// that can be stored in todoList.innerHTML. innerHTML is always a string itself:
	// 	todoList.innerHTML = this.todoTemplateMain({todos: this.todos});
	// 	var lastElementInput = this.getLastDivElement(todoList).children[1];
	// 	lastElementInput.classList.add('show');
	// 	lastElementInput.classList.add('last');
	// 	lastElementInput.focus();
	// },
	// renderHelper: function() {
	// 	var temporaryDOM = document.createElement('UL');
	// 	temporaryDOM.innerHTML = this.todoTemplateMain({todos: this.todos});
	// 	var arr = this.getArray(this.todos, this.getLastDivElement(temporaryDOM).id);

	// 	arr.push({
	// 			id: util.uuid(),
	// 			text: '',
	// 			completed: false,
	// 			nestedTodos: []
	// 	});
	// },
	shallowRender: function(elementToFocusID) {
		var todoList = document.querySelector('#todo-list');
		
		if (this.todos.length === 0) {
			this.todos.push({
				id: util.uuid(),
				text: '',
				completed: false,
				nestedTodos: []
			});

			todoList.innerHTML = this.todoTemplateMain({todos: this.todos});
			var lastInput = this.getLastDivElement(todoList);
			lastInput.children[1].classList.add('show');
			lastInput.children[1].focus();
		} else {
			todoList.innerHTML = this.todoTemplateMain({todos: this.todos});

			if (arguments.length > 0) {
				var focusParent = document.getElementById(elementToFocusID);
				var focusChild = focusParent.lastElementChild;
				focusChild.value = focusParent.textContent.trim();
				focusChild.classList.add('show');
				focusChild.focus();
			}
		}

		console.log(this.todos);
	},
	getLastDivElement: function(ancestorEl) {
		var descendentEl = ancestorEl.lastElementChild;

		if (descendentEl.type === "text") {
			return ancestorEl;
		} else {
			return this.getLastDivElement(descendentEl);
		}
	},
	createEventListeners: function() {
		var todoList = document.querySelector('#todo-list');

		// If you want to listen for a specific event...you have to have an event listener.
		todoList.addEventListener('click', this.delegateEvents.bind(this));
		todoList.addEventListener('keyup', this.delegateEvents.bind(this));
		todoList.addEventListener('keydown', this.delegateEvents.bind(this));
		todoList.addEventListener('focusout', this.delegateEvents.bind(this));
	},
	delegateEvents: function(e) {
		// .hasAttribute is how you determine if an element has an id, as well as other attributes.
		if (e.target.nodeName === 'DIV' && e.type === 'click' /*&& e.target.hasAttribute("id")*/) {
			this.editTodo(e);
		} else if (e.target.nodeName === 'INPUT' && e.type === 'keydown' && e.which === 9) {
			e.preventDefault();
			/*
		 	 * There is not keycode for Shift + Tab. Instead, there is a separate property on the event object, 
		 	 * .shiftKey that returns a Boolean indicating whether the shift key was pressed or not when the
		 	 * given event occurs.
		 	 */
			if (e.shiftKey) {
				this.unnestTodo(e);
			} else {
				this.nestTodo(e);
			}
		} else if (e.target.nodeName === 'INPUT' && e.type === 'keyup') {
			this.editKeyUp(e);
		} else if (e.target.nodeName === 'INPUT' && e.type === 'focusout') {
			this.unfocus(e);
		} else if (e.target.nodeName === 'INPUT' && e.type === 'keyup' && e.which === 13 && e.ctrlKey) {
			this.completeTodo(e);
		} else if (e.target.nodeName === 'INPUT' && e.target.value === '' /*&& e.type === 'keydown'*/ && e.which === 8) {
			var divID = e.target.parentElement.id;
			if (divID && e.type === 'keydown') {
				//debugger; /* look into these two debuggers and the behavior here when a todo is destroyed and when it is cleared */
				this.destroyTodo(e);
			} else if (!divID && e.type === 'keyup') {
				//debugger;
				this.clearEmptyTodo();
			}
		} 
	},
	editTodo: function(e) {
		if (e.target.nodeName === 'DIV') {
			var inputFieldEl = e.target.nextElementSibling;
			inputFieldEl.value = e.target.textContent.trim();
			inputFieldEl.classList.add('show');
			inputFieldEl.focus();
		} else {
			console.log(e.target.parentElement);
		}
	},
	editKeyUp: function(e) {
		var ENTER_KEY = 13;
		var topLevelParent = e.target.parentElement.parentElement.parentElement;
		var divID 			 = e.target.parentElement.id;

		if (e.which !== ENTER_KEY) {
			this.update(e);
		} else {
			var arr = this.getArray(this.todos, divID);
			var index = this.getTodoIndex(this.todos, divID);

			if (arr[index].nestedTodos.length > 0) {
				this.createTodo(arr[index].nestedTodos, index, topLevelParent, true);
			} else {
				this.createTodo(arr, index, topLevelParent);
			}
		}
	},
	update: function(e) {
		// You can access the parent of an element using .parentElement:
		var divID 			 = e.target.parentElement.id;
		var inputFieldText 	 = e.target.value;
		this.updateHelper(this.todos, divID, inputFieldText.trim());
	},
	updateHelper: function(todos, id, newText, nesting) {
		todos.forEach(function(todo, index, array) {
			if (todo.id === id) {
				/* You can always reference the array currently being processed in the callback function.
				 * When you reference an array, you are always referencing its address in memory, so even
				 * If it is many layers deep, you can access it.
				 */
				array[index].text = newText;
			} else if (todo.nestedTodos.length > 0) {
				this.updateHelper(todo.nestedTodos, id, newText);
			}
		}, this);
	},
	createTodo: function(todos, i, parent, nesting) {
		var indexToAdd = i + 1;
		var todo = {
			id: util.uuid(),
			text: '',
			completed: false,
			nestedTodos: []
		};

		if (nesting) {
			todos.unshift(todo);
			this.shallowRender(todos[0].id);
		} else if (arguments.length < 3 || parent.nodeName === 'MAIN') {
			todos.splice(indexToAdd, 0, todo);
			this.shallowRender(todos[indexToAdd].id);
		} else {
			todos.splice(indexToAdd, 0, todo);
			this.shallowRender(todos[indexToAdd].id);
		}
	},
	destroyTodo: function(e) {
		var divID = e.target.parentElement.id;
		var todoArray = this.getArray(this.todos, divID);
		var todoIndex = this.getTodoIndex(this.todos, divID);

		if (todoArray[todoIndex].nestedTodos.length > 0) {
			return;
		} else {
			todoArray.splice(todoIndex, 1);
			this.shallowRender();
		}
	},
	unfocus(e) {
		e.target.previousElementSibling.textContent = e.target.value.trim();
		e.target.classList.remove('show');
	},
	nestTodo: function(e) {
		var parentLi = e.target.parentElement;
		var todoArray = this.getArray(this.todos, parentLi.id);
		var todoIndex = this.getTodoIndex(this.todos, parentLi.id);
		var previousSibling = parentLi.previousElementSibling;

		if (previousSibling && previousSibling.nodeName === 'LI') {
			var siblingArray = this.getArray(this.todos, previousSibling.id);
			var siblingIndex = this.getTodoIndex(this.todos, previousSibling.id);
			siblingArray[siblingIndex].nestedTodos.push(todoArray[todoIndex]);
			todoArray.splice(todoIndex, 1);
			this.shallowRender(parentLi.id);
		}
	},
	unnestTodo: function(e) {
		var currentLI = e.target.parentElement;
		var todoArray = this.getArray(this.todos, currentLI.id);
		var todoIndex = this.getTodoIndex(this.todos, currentLI.id);
		var futureParent = currentLI.parentElement.parentElement.parentElement.parentElement;

		if (futureParent.nodeName === 'LI') {
			var parentArray = this.getArray(this.todos, futureParent.id);
			var parentIndex = this.getTodoIndex(this.todos, futureParent.id);
			parentArray[parentIndex].nestedTodos.push(todoArray[todoIndex]);
			todoArray.splice(todoIndex, 1);
			this.shallowRender();
		} else if (futureParent.nodeName === 'MAIN') {
			var currentParent = currentLI.parentElement.parentElement;
			var parentIndex = this.getTodoIndex(this.todos, currentParent.id);
			this.todos.splice(parentIndex + 1, 0, todoArray[todoIndex]);
			todoArray.splice(todoIndex, 1);
			this.shallowRender(currentLI);
		}
	},
	completeTodo: function(e) {
		var currentDiv = e.target.parentElement;
		var todoArray = this.getArray(this.todos, currentDiv.id);
		var todoIndex = this.getTodoIndex(this.todos, currentDiv.id);
		var todoStatus = todoArray[todoIndex].completed;
		todoArray[todoIndex].completed = !todoStatus;
		this.render();
	},
	getArray: function(todos, id) {
		var array;

		for (var i = 0; i < todos.length; i++) {
			if (id === todos[i].id) {
				array = todos;
				break;
			} else if (todos[i].nestedTodos.length > 0) {
				array = this.getArray(todos[i].nestedTodos, id);

				// Without this check, the for loop cannot be escaped, even if a match exists.
				if (array !== undefined) {
					break;
				}
			}
		}

		return array;
	},
	getTodoIndex: function(todos, id) {
		var index;

		for (var i = 0; i < todos.length; i++) {
			if (id === todos[i].id) {
				index = i;
				break;
			} else if (todos[i].nestedTodos.length > 0) {
				index = this.getTodoIndex(todos[i].nestedTodos, id);

				// Without this check, the for loop cannot be escaped, even if a match exists.
				if (index !== undefined) {
					break;
				}
			}
		}

		return index;
	},
}

App.init();