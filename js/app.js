var util = {
	/**
	 * uuid() generates and returns a compliant universally unique identifier.
	 *
	 * @return {String} uuidString
	 */
	uuid: function() {
		var uuidString = '';

		for (var i = 0; i < 32; i++) {
			if (i === 8 || i === 12 || i === 16 || i === 20) {
				uuidString += '-';
			}
			
			var randomInt = Math.floor(Math.random() * 16);
			uuidString += randomInt.toString(16);
		}

		return uuidString;
	},

	/**
	 * save() stores data in the browser's local storage if both the 
	 * namespace and data arguments are passed in. If only namespace
	 * is passed to save(), localStorage returns the data at that 
	 * namespace. If the namespace does not exist, and empty array is
	 * returned.
	 *
	 * @param {String} namespace
	 * @param {Array} data
	 * @return {Array}
	 */
	save: function(namespace, data) {
		if (arguments.length > 1) {
			localStorage.setItem(namespace, JSON.stringify(data));
		} else {
			return JSON.parse(localStorage.getItem(namespace)) || [];
		}
	},
}

var App = {
	todos: util.save('data'),

	/**
	 * init() initiates the rendering of the application and invokes
	 * the event listeners on the rendered HTML elements.
	 */
	init: function() {
		// 1. This selects the Handlebars code from the DOM and stores it in a variable:
		var mainTemplate 	= document.querySelector('#handlebars-todo-list-main').innerHTML;
		// 2. This selects the Handlebars code from the DOM and stores it in a variable:
		var partialTemplate = document.querySelector('#handlebars-todo-list-partial').innerHTML;
		// 3. Compile the template data into a function using Handlebars compile() method:
		this.todoTemplateMain = Handlebars.compile(mainTemplate);
		// 4. Partial templates must be registered. These templates are denoted with the '>'
		// symbol and allow achieving a level of recursion in Handlebars.
		// More info on Partial Templates here:
		// -https://handlebarsjs.com/partials.html
		// -http://www.independent-software.com/recursion-in-handlebars-with-depth-level.html
		Handlebars.registerPartial('todo', Handlebars.compile(partialTemplate));
		this.render();
		this.createEventListeners();
	},

	/**
	 * render() controls how the application is to be rendered 
	 * and the elements that receive focus at that time.
	 *
	 * @param {String} elementToFocusID
	 */
	render: function(elementToFocusID) {
		var todoList = document.querySelector('#todo-list');
		var focusParent;
		var lastInput;
		
		// get rid of this todo creation here, you have a createTodo function for exactly this purpose:
		if (!this.todos.length) {
			this.createTodo();
			todoList.innerHTML = this.todoTemplateMain({todos: this.todos});
			lastInput = this.getLastDivElement(todoList);
			lastInput.children[2].classList.add('show');
			lastInput.children[2].focus();
		} else {
			todoList.innerHTML = this.todoTemplateMain({todos: this.todos});

			if (arguments.length) {
				focusParent = document.getElementById(elementToFocusID);

				if (3 in focusParent.children) {
					lastInput = focusParent.children[3].lastElementChild;
				}
				
				lastInput = focusParent.children[2];
				lastInput.value = focusParent.firstElementChild.textContent.trim();
				lastInput.classList.add('show');
				lastInput.focus();
			}
		}
	},

	/**
	 * getLastDivElement() returns the last <div> inside a parent <li>.
	 * If the <li> has nestedTodos, getLastDivElement() recurses until
	 * it can return a <div>.
	 *
	 * @param {Element} ancestorEl
	 * @return {Element} descendentEl
	 */
	getLastDivElement: function(ancestorEl) {
		var descendentEl = ancestorEl.lastElementChild;

		if (descendentEl.type === 'text') {
			return ancestorEl;
		} else {
			return this.getLastDivElement(descendentEl);
		}
	},

	/**
	 * createEventListeners() adds event listeners on the <main> todo list
	 * HTML Element.
	 */
	createEventListeners: function() {
		var todoList = document.querySelector('#todo-list');

		// If you want to listen for a specific event...you have to have an event listener.
		todoList.addEventListener('click', this.delegateEvents.bind(this));
		todoList.addEventListener('keyup', this.delegateEvents.bind(this));
		todoList.addEventListener('keydown', this.delegateEvents.bind(this));
		todoList.addEventListener('focusout', this.delegateEvents.bind(this));
	},

	/**
	 * delegatEvents() handles the criteria of the different events that can
	 * occur on the todo list, and invokes the appropriate method.
	 *
	 * @param {Event Object} e
	 */
	delegateEvents: function(e) {
		// .hasAttribute is how you determine if an element has an id, as well as other attributes.
		if (e.target.classList[0] === 'text' && e.type === 'click' /*&& e.target.hasAttribute('id')*/) {
			this.editTodo(e);
		} else if (e.target.nodeName === 'INPUT' && e.type === 'keydown' && e.which === 9) {
			e.preventDefault();
			/*
		 	 * There is no keycode for Shift + Tab. Instead, there is a separate property on the event object, 
		 	 * .shiftKey that returns a Boolean indicating whether the shift key was pressed or not when the
		 	 * given event occurs.
		 	 */
			if (e.shiftKey) {
				this.unnestTodo(e);
			} else {
				this.nestTodo(e);
			}
		} else if (e.target.nodeName === 'INPUT' && e.type === 'keyup' && !e.ctrlKey && !e.shiftKey) {
			this.editKeyUp(e);
		} else if (e.target.nodeName === 'INPUT' && e.type === 'focusout') {
			this.unfocusTodo(e);
		} else if (e.target.nodeName === 'INPUT' && e.type === 'keydown' && e.which === 13 && e.ctrlKey) {
			e.preventDefault();
			this.completeTodo(e);
		} else if (e.target.nodeName === 'INPUT' && e.target.value === '' && e.type === 'keydown' && e.which === 8) {
			e.preventDefault();
			this.destroyTodo(e);
		} else if (e.target.nodeName === 'INPUT' && e.type === 'keydown' && e.which === 13 && e.shiftKey) {
			e.preventDefault();
			this.toggleNotesOn(e);
		} else if (e.target.classList[0] === 'notes' && e.type === 'keydown' && e.which === 13 && e.shiftKey) {
			e.preventDefault();
			this.toggleNotesOff(e);
		} else if (e.target.classList[0] === 'notes' && e.type === 'click') {
			this.toggleNotesOn(e);
		} else if (e.target.classList[1] === 'show-notes' && e.type === 'focusout') {
			this.toggleNotesOff(e);
		}
	},

	/**
	 * editTodo() is invoked when a <div> with the class of 'text' undergoes
	 * a 'click' event. The 'show' class is added to that element's <input> child
	 * and it is focused.
	 * 
	 * @param {Event Object} e
	 */
	editTodo: function(e) {
		var parentDiv = e.target.parentElement;
		var inputFieldEl = parentDiv.children[2];
		inputFieldEl.value = parentDiv.children[0].textContent.trim();
		inputFieldEl.classList.add('show');
		inputFieldEl.focus();
	},

	/**
	 * editKeyUp() is invoked when keyup events occur in an <input> element.
	 *
	 * @param {Event Object} e
	 */
	editKeyUp: function(e) {
		var ENTER_KEY = 13;
		var topLevelParent = e.target.parentElement.parentElement.parentElement;
		var divID 			 = e.target.parentElement.id;
		var arr;
		var index;

		if (e.which !== ENTER_KEY) {
			this.updateTodo(e);
		} else {
			arr = this.getArray(this.todos, divID);
			index = this.getTodoIndex(this.todos, divID);

			if (arr[index].nestedTodos.length) {
				this.createTodo(arr[index].nestedTodos, index, topLevelParent, true);
			} else {
				this.createTodo(arr, index, topLevelParent);
			}
		}
	},

	/**
	 * updateTodo() is invoked when the value of an <input> element is changed.
	 *
	 * @param {Event Object} e
	 */
	updateTodo: function(e) {
		// You can access the parent of an element using .parentElement:
		var divID 			 = e.target.parentElement.id;
		var inputFieldText 	 = e.target.value;
		var array = this.getArray(this.todos, divID);
		var index = this.getTodoIndex(this.todos, divID);
		array[index].text = inputFieldText.trim();
	},
 
 	/**
 	 * createTodo() is invoked by editKeyUp when the ENTER key is pressed.
 	 * This method is responsible for appending todos to the todolist based
 	 * on the different possible scenarios.
 	 *
 	 * @param {Array} todos
 	 * @param {Number} i
 	 * @param {Element} parent
 	 * @param {Boolean} nesting - optional
 	 */
	createTodo: function(todos, i, parent, nesting) {
		var indexToAdd = i + 1; // you don't really need this, you can add i + 1
		var todo = {
			id: util.uuid(),
			text: '',
			completed: false,
			notes: '',
			nestedTodos: []
		};

		if (nesting) {
			todos.unshift(todo);
			this.render(todos[0].id);
		} else if (!arguments.length) {
			this.todos.push(todo);
		} else if (arguments.length < 3 || parent.nodeName === 'MAIN') {
			todos.splice(indexToAdd, 0, todo);
			this.render(todos[indexToAdd].id);
		} else {
			todos.splice(indexToAdd, 0, todo);
			this.render(todos[indexToAdd].id);
		}

		this.saveTodos();
	},

	/**
	 * destroyTodo() is invoked when the BACKSPACE key causes a keydown event
	 * on an empty <input> element. That element is then spliced from todos
	 * and another element is focused depending on the conditions.
	 *
	 * @param {Event Object} e
	 */
	destroyTodo: function(e) {
		var div = e.target.parentElement;
		var todoArray = this.getArray(this.todos, div.id);
		var todoIndex = this.getTodoIndex(this.todos, div.id);
		var divID;

		if (todoArray[todoIndex].nestedTodos.length) {
			return;
		} else {
			todoArray.splice(todoIndex, 1);
			
			// ternary operators here maybe??
			if (div.previousElementSibling !== null) {
				this.render(div.previousElementSibling.id);
			} else if (div.parentElement.parentElement.nodeName !== 'MAIN') {
				this.render(div.parentElement.parentElement.id);
			} else if (div.nextElementSibling !== null) {
				this.render(div.nextElementSibling.id);
			} else {
				this.render();
			}

			this.saveTodos();
		}
	},

	/**
	 * unfocusTodo() is invoked whenever an <input> element loses focus. Once this
	 * occurs, the text content of the parent <div> element is updateTodod to 
	 * reflect the new <input> value. Helps prevent the page from having to 
	 * render again.
	 *
	 * @param {Event Object} e
	 */
	unfocusTodo: function(e) {
		e.target.previousElementSibling.previousElementSibling.textContent = e.target.value.trim();
		e.target.classList.remove('show');
	},

	/**
	 * nestTodo() is invoked when a TAB keydown event occurs. This method will 
	 * cause the current <div> element to become a child of the previous <div>
	 * element.
	 *
	 * @param {Event Object} e
	 */
	nestTodo: function(e) {
		// *can some logic be reduced here with a  conditional check and a return statment? Run through this function and 
		// check all the conditions to confirm.
		var parentLi = e.target.parentElement;
		var todoArray = this.getArray(this.todos, parentLi.id);
		var todoIndex = this.getTodoIndex(this.todos, parentLi.id);
		var previousSibling = parentLi.previousElementSibling;
		var siblingArray;
		var siblingIndex;

		if (previousSibling && previousSibling.nodeName === 'LI') {
			siblingArray = this.getArray(this.todos, previousSibling.id);
			siblingIndex = this.getTodoIndex(this.todos, previousSibling.id);
			siblingArray[siblingIndex].nestedTodos.push(todoArray[todoIndex]);
			todoArray.splice(todoIndex, 1);
			this.render(parentLi.id);
			this.saveTodos();
		}
	},

	/**
	 * unnestTodo() is invoked when a TAB keydown event occurs while the SHIFT
	 * key is being held. This method causes the current <div> to unnest one
	 * layer, if it is a child of another <div>
	 *
	 * @param {Event Object} e
	 */
	unnestTodo: function(e) {
		// * Rework the logic of this function!
		var currentLI = e.target.parentElement;
		var todoArray = this.getArray(this.todos, currentLI.id);
		var todoIndex = this.getTodoIndex(this.todos, currentLI.id);
		var futureParent = currentLI.parentElement.parentElement.parentElement.parentElement;

		if (futureParent.nodeName === 'LI') {
			var previousParent = currentLI.parentElement.parentElement;
			var previousParentIndex = this.getTodoIndex(this.todos, previousParent.id);
			var parentArray = this.getArray(this.todos, futureParent.id);
			var parentIndex = this.getTodoIndex(this.todos, futureParent.id);
			parentArray[parentIndex].nestedTodos.splice(previousParentIndex + 1, 0, todoArray[todoIndex]);
			todoArray.splice(todoIndex, 1);
			this.render(currentLI.id);
		} else if (futureParent.nodeName === 'MAIN') {
			var currentParent = currentLI.parentElement.parentElement;
			var parentIndex = this.getTodoIndex(this.todos, currentParent.id);
			this.todos.splice(parentIndex + 1, 0, todoArray[todoIndex]);
			todoArray.splice(todoIndex, 1);
			this.render(currentLI.id);
		}

		this.saveTodos();

		// If an element's futureParent.nodeName === 'html', the element is already on the outermost ul,
		// the above conditionals will not execute, and this function will return undefined.
	},

	/**
	 * completeTodo() is invoked when an ENTER keydown event occurs on an <input>
	 * element while CTRL key is being held. This method updateTodos the current .completed 
	 * property value of that todo object to its inverse.
	 *
	 * @param {Event Object} e
	 */
	completeTodo: function(e) {
		var currentDiv = e.target.parentElement;
		var todoArray = this.getArray(this.todos, currentDiv.id);
		var todoIndex = this.getTodoIndex(this.todos, currentDiv.id);
		var todoStatus = todoArray[todoIndex].completed;
		todoArray[todoIndex].completed = !todoStatus;
		this.render(currentDiv.id);
		this.saveTodos();
	},

	/**
	 * toggleNotesOn() is invoked when an ENTER keydown event occurs on an <input>
	 * element while the SHIFT key is being held. This method will toggle the <div>
	 * element with a class of 'notes', allowing a user to type additional
	 * information about a given todo.
	 *
	 * @param {Event Object} e
	 */
	toggleNotesOn: function(e) {
		var parentDiv = e.target.parentElement;
		var array = this.getArray(this.todos, parentDiv.id);
		var index = this.getTodoIndex(this.todos, parentDiv.id);
		var notesDiv;

		// ternary operator here? blur will still need to be in its own conditional
		if (e.type === 'keydown') {
			e.target.blur();
			notesDiv = e.target.previousElementSibling;	
		} else {
			notesDiv = e.target;
		}
		
		notesDiv.classList.remove('notes-preview');
		notesDiv.classList.add('show-notes');
		notesDiv.focus();
	},

	/**
	 * toggleNotesOff() is invoked when an ENTER keydown event occurs on a <div>
	 * element with a class of 'notes'. It will remove focus from the current <div>
	 * and give focus to its corresponding <input> element.
	 *
	 * @param {Event Object} e
	 */
	toggleNotesOff: function(e) {
		var parentDiv = e.target.parentElement;
		var array = this.getArray(this.todos, parentDiv.id);
		var index = this.getTodoIndex(this.todos, parentDiv.id);
		e.target.blur();
		e.target.classList.remove('show-notes');
		e.target.classList.add('notes-preview');
		array[index].notes = e.target.innerHTML;

		if (e.type === 'keydown') {
			this.editTodo(e);
		}

		this.saveTodos();
	},

	/**
	 * getArray() returns the array at which the todo that corresponds with the passed
	 * ID can be found.
	 *
	 * @param {Array} todos
	 * @param {String} id
	 * @return {Array} array
	 */
	getArray: function(todos, id) {
		var array;

		for (var i = 0; i < todos.length; i++) {
			if (id === todos[i].id) {
				array = todos;
				break;
			} else if (todos[i].nestedTodos.length) {
				array = this.getArray(todos[i].nestedTodos, id);

				// Without this check, the for loop cannot be escaped, even if a match exists.
				if (array !== undefined) {
					break;
				}
			}
		}

		return array;
	},

	/**
	 * getTodoIndex() returns the index at which the todo that corresponds with the passed
	 * ID can be found.
	 *
	 * @param {Array} todos
	 * @param {String} id
	 * @return {Array} index
	 */
	getTodoIndex: function(todos, id) {
		var index;

		for (var i = 0; i < todos.length; i++) {
			if (id === todos[i].id) {
				index = i;
				break;
			} else if (todos[i].nestedTodos.length) {
				index = this.getTodoIndex(todos[i].nestedTodos, id);

				// Without this check, the for loop cannot be escaped, even if a match exists.
				if (index !== undefined) {
					break;
				}
			}
		}

		return index;
	},



	/**
	 * saveTodos() stores the current state of the todos property in localStorage.
	 */
	saveTodos: function() {
		util.save('data', this.todos);
	}
}

App.init();
