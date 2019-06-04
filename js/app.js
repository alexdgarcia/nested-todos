(function() {
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
		 * @param {String} elementToFocus
		 */
		render: function(elementToFocus) {
			var todoList = document.querySelector('#todo-list');
			var focusParent;
			var childElToFocus;
			
			if (!this.todos.length) {
				this.createTodo();
				todoList.innerHTML = this.todoTemplateMain({todos: this.todos});
				childElToFocus = document.querySelector('div');
				childElToFocus.focus();
			} else {
				todoList.innerHTML = this.todoTemplateMain({todos: this.todos});

				if (arguments.length) {
					if (typeof elementToFocus === 'object') {
						focusParent = elementToFocus.parentElement;
						childElToFocus = document.getElementById(focusParent.id).children[1];
						this.toggleNotesOn(childElToFocus);
					} else {
						focusParent = document.getElementById(elementToFocus);
						childElToFocus = focusParent.firstElementChild;
						childElToFocus.focus();
					}
				} else {
					focusParent = todoList.firstElementChild.firstElementChild;
					childElToFocus = focusParent.firstElementChild;
					childElToFocus.focus();
				}
			}

			this.focusElementEnd(childElToFocus);
			console.log(this.todos);
		},

		/**
		 * focusElementEnd() moves the caret from its current selection,
		 * to the end of the range. Necessary to do when focusing on 
		 * contenteditable <divs>
		 *
		 * @param {Element} el
		 */
		focusElementEnd: function(el) {
			// creates a Range object
			var range = document.createRange();

			// returns a Selection object, representing current position of the caret
			var sel = window.getSelection();

			// selects the text node in el, and sets the Range to contain its contents
	  		range.selectNodeContents(el);

	  		// true collapses the range to its start, false to its end
	        range.collapse(false);
	        sel.removeAllRanges();
	        sel.addRange(range);
		},

		// this code will select and programatically highlight a range:
		// focusElementEnd: function(el) {
		// 	var range = document.createRange();
		// 	var sel = window.getSelection();
		// 	range.setStart(el.childNodes[0], 0);
		// 	range.setEnd(el.childNodes[0], 26);
		// 	sel.removeAllRanges();
		// 	sel.addRange(range);
		// },


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
			if (e.target.classList[0] === 'text' && e.type === 'click') {
				this.editTodo(e);
			} else if (e.target.classList[0] === 'text' && e.type === 'keydown' && e.which === 9) {
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
			} else if (e.target.classList[0] === 'text' && e.type === 'keyup' && !e.ctrlKey && !e.shiftKey) {
				this.editKeyUp(e);
			} else if (e.target.classList[0] === 'text' && e.type === 'focusout') {
				this.unfocusTodo(e);
			} else if (e.target.classList[0] === 'text' && e.type === 'keydown' && e.which === 13 && e.ctrlKey) {
				e.preventDefault();
				this.setCompleteTodoDiv(e);
			} else if (e.target.classList[0] === 'notes' && e.type === 'keydown' && e.which === 13 && e.ctrlKey) {
				e.preventDefault();
				this.setCompleteTodoNotes(e);
			} else if (e.target.classList[0] === 'text' && e.target.textContent === '' && e.type === 'keydown' && e.which === 8) {
				e.preventDefault();
				this.destroyTodo(e);
			} else if (e.target.classList[0] === 'text' && e.type === 'keydown' && e.which === 13) {
				e.preventDefault();

				if (e.shiftKey) {
					this.toggleNotesOn(e);
				}
			} else if (e.target.classList[0] === 'notes' && e.type === 'keydown' && e.which === 13 && e.shiftKey) {
				e.preventDefault();
				this.toggleNotesOff(e);
			} else if (e.target.classList[0] === 'notes' && e.type === 'click') {
				this.toggleNotesOn(e);
			} else if (e.target.classList[1] === 'show-notes' && e.type === 'focusout') {
				this.toggleNotesOff(e);
			} else if (e.target.classList[1] === 'show-notes' && e.target.textContent === '' && e.type === 'keydown' && e.which === 8) {
				e.preventDefault();
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
			var parentLI = e.target.parentElement;
			var contentDiv = parentLI.firstElementChild;
			contentDiv.focus();
			this.focusElementEnd(contentDiv);
		},

		/**
		 * editKeyUp() is invoked when keyup events occur in <div> elements with a 
		 * class of 'text'.
		 *
		 * @param {Event Object} e
		 */
		editKeyUp: function(e) {
			var ENTER_KEY = 13;
			var topLevelParent = e.target.parentElement;
			var parentID = topLevelParent.id;
			var arr;
			var index;

			if (e.which !== ENTER_KEY) {
				this.updateTodo(e);
			} else {
				arr = this.getArray(this.todos, parentID);
				index = this.getTodoIndex(this.todos, parentID);

				if (arr[index].nestedTodos.length) {

					// unshift a todo
					this.createTodo(arr[index].nestedTodos, index, topLevelParent, true);
				} else {
					if (!e.target.textContent && !arr[index + 1] && topLevelParent.nodeName !== 'MAIN') {

						// if a todo is blank and is not followed by a sibling, unnest one layer
						this.unnestTodo(e);
					} else {
						//push a todo
						this.createTodo(arr, index, topLevelParent);
					}
				}
			}
		},

		/**
		 * updateTodo() is invoked when the value of an <div> element is changed.
		 *
		 * @param {Event Object} e
		 */
		updateTodo: function(e) {
			var divID = e.target.parentElement.id;
			var contentDivText = e.target.textContent;
			var array = this.getArray(this.todos, divID);
			var index = this.getTodoIndex(this.todos, divID);
			array[index].text = contentDivText;
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
				todos.splice(i + 1, 0, todo);
				this.render(todos[i + 1].id);
			} else {
				todos.splice(i + 1, 0, todo);
				this.render(todos[i + 1].id);
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
			var parentLI = e.target.parentElement; // the li
			var parentID = parentLI.id;
			var todoArray = this.getArray(this.todos, parentID);
			var todoIndex = this.getTodoIndex(this.todos, parentID);
			var divID;

			if (todoArray[todoIndex].nestedTodos.length) {
				return;
			} else {
				todoArray.splice(todoIndex, 1);
				this.saveTodos();
				
				// ternary operators here maybe??
				if (parentLI.previousElementSibling !== null) { // if the li has a prior sibling
					divID = this.getLastNestedTodo(parentLI.previousElementSibling.id);
					this.render(divID);
				} else if (parentLI.parentElement.parentElement.nodeName !== 'MAIN') {
					this.render(parentLI.parentElement.parentElement.id); // the parent if it is nested
				} else if (parentLI.nextElementSibling !== null) {
					this.render(parentLI.nextElementSibling.id); // the following li
				} else {
					this.render();
				}
			}
		},

		/**
		 * getLastNestedTodo() is invoked by destroyTodo() when a todo is destroyed
		 * and has a previousElementSibling. If the sibling has layers of nesting,
		 * this method will return the ID of last nested element, otherwise it will
		 * return the ID of the passed argument.
		 *
		 * @param {String} startTodo
		 * @return {String} startTodo
		 */
		getLastNestedTodo: function(startTodo) {
			var todoArray = this.getArray(this.todos, startTodo);
			var todoIndex = this.getTodoIndex(this.todos, startTodo);
			var length;

			if (todoArray[todoIndex].nestedTodos.length) {
				length = todoArray[todoIndex].nestedTodos.length;
				return this.getLastNestedTodo(todoArray[todoIndex].nestedTodos[length - 1].id);
			} else {
				return startTodo;
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
			e.target.blur();
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
				this.saveTodos();
				this.render(parentLi.id);
			}
		},

		/**
		 * unnestTodo() is invoked when a TAB keydown event occurs while the SHIFT
		 * key is being held. This method causes the current <div> to unnest one
		 * layer, if it is a child of another <div>. If an element's 
		 * futureParent.nodeName === 'html', the element is already on the outermost
		 * <ul>, the control statements will not execute, and this function will 
		 * return undefined.
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
			} else if (futureParent.nodeName === 'MAIN') {
				var currentParent = currentLI.parentElement.parentElement;
				var parentIndex = this.getTodoIndex(this.todos, currentParent.id);
				this.todos.splice(parentIndex + 1, 0, todoArray[todoIndex]);
				todoArray.splice(todoIndex, 1);
			}

			this.saveTodos();
			this.render(currentLI.id);
		},

		/**
		 * setCompleteTodoDiv() is invoked when an ENTER keydown event occurs on a <div>
		 * element with a class of 'text' while CTRL key is being held. This method 
		 * updates the current .completed property value of that todo object to its 
		 * inverse.
		 *
		 * @param {Event Object} e
		 */
		setCompleteTodoDiv: function(e) {
			var parentListItemID = e.target.parentElement.id;
			var todoArray = this.getArray(this.todos, parentListItemID);
			var todoIndex = this.getTodoIndex(this.todos, parentListItemID);
			var todoStatus = todoArray[todoIndex].completed;
			todoArray[todoIndex].completed = !todoStatus;
			this.saveTodos();
			this.render(parentListItemID);
		},

		/**
		 * 
		 */
		setCompleteTodoNotes: function(e) {
			var parentLI = e.target.parentElement;
			var todoArray = this.getArray(this.todos, parentLI.id);
			var todoIndex = this.getTodoIndex(this.todos, parentLI.id);
			var todoStatus = todoArray[todoIndex].completed;
			var elementToRender;
			todoArray[todoIndex].completed = !todoStatus;

			if (!todoArray[todoIndex].completed) {
				elementToRender = e.target;
			} else if (todoArray[todoIndex].completed && parentLI.nextElementSibling) {
				elementToRender = parentLI.nextElementSibling.id;
			} else if (todoArray[todoIndex].completed && parentLI.previousElementSibling) {
				todoArray = this.getArray(this.todos, parentLI.previousElementSibling.id);
				todoIndex = this.getTodoIndex(this.todos, parentLI.previousElementSibling.id);
				elementToRender = this.getLastNestedTodo(parentLI.previousElementSibling.id);
			}

			this.saveTodos();
			this.render(elementToRender);
		},

		/**
		 * toggleNotesOn() is invoked when an ENTER keydown event occurs on a <div>
		 * element with a class of 'text' while the SHIFT key is being held. This 
		 * method will toggle the <div> element with a class of 'notes', allowing a 
		 * user to type additional information about a given todo.
		 *
		 * @param {Event Object} e
		 */
		toggleNotesOn: function(e) {
			var notesDiv;

			// ternary operator here? blur will still need to be in its own conditional
			if (e.type === 'keydown') { // keydown event
				e.target.blur();
				notesDiv = e.target.nextElementSibling;	
			} else { // click event
				notesDiv = e.target || e;
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
			var parentListItemID = e.target.parentElement.id;
			var array = this.getArray(this.todos, parentListItemID);
			var index = this.getTodoIndex(this.todos, parentListItemID);
			e.target.blur();
			e.target.classList.remove('show-notes');
			array[index].notes = e.target.innerHTML;

			if (e.target.textContent !== '') {
				e.target.classList.add('notes-preview');
			}

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

	Window.app = App;
})(Window.app);

Window.app.init();

