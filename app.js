document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const todoInput = document.getElementById('todo-input');
    const reminderTime = document.getElementById('reminder-time');
    const addButton = document.getElementById('add-button');
    const todoList = document.getElementById('todo-list');
    
    // 从本地存储加载待办事项
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    
    // 渲染待办事项列表
    function renderTodos() {
        todoList.innerHTML = '';
        
        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            if (todo.completed) {
                li.classList.add('completed');
            }
            
            let reminderText = todo.reminderTime ? 
                `<div class="reminder-time">提醒时间: ${new Date(todo.reminderTime).toLocaleString()}</div>` : '';
            
            li.innerHTML = `
                <div>
                    <span onclick="toggleTodo(${index})">${todo.text}</span>
                    ${reminderText}
                </div>
                <button class="delete-btn" onclick="deleteTodo(${index})">删除</button>
            `;
            
            todoList.appendChild(li);
        });
    }
    
    // 添加新的待办事项
    function addTodo() {
        const todoText = todoInput.value.trim();
        const reminderTimeValue = reminderTime.value;
        
        if (todoText) {
            const todo = {
                text: todoText,
                completed: false,
                reminderTime: reminderTimeValue || null
            };
            
            todos.push(todo);
            
            if (reminderTimeValue) {
                scheduleReminder(todo);
            }
            
            todoInput.value = '';
            reminderTime.value = '';
            saveTodos();
            renderTodos();
        }
    }
    
    function scheduleReminder(todo) {
        const reminderTime = new Date(todo.reminderTime).getTime();
        const now = new Date().getTime();
        
        if (reminderTime > now) {
            setTimeout(() => {
                if (!todo.completed) {
                    showNotification(todo.text);
                }
            }, reminderTime - now);
        }
    }
    
    function showNotification(text) {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('待办事项提醒', {
                        body: text,
                        icon: 'https://example.com/icon.png' // 你可以添加一个图标
                    });
                }
            });
        }
    }
    
    // 恢复所有提醒
    function restoreReminders() {
        todos.forEach(todo => {
            if (todo.reminderTime && !todo.completed) {
                scheduleReminder(todo);
            }
        });
    }
    
    // 切换待办事项的完成状态
    window.toggleTodo = function(index) {
        todos[index].completed = !todos[index].completed;
        saveTodos();
        renderTodos();
    };
    
    // 删除待办事项
    window.deleteTodo = function(index) {
        todos.splice(index, 1);
        saveTodos();
        renderTodos();
    };
    
    // 保存待办事项到本地存储
    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }
    
    // 添加事件监听器
    addButton.addEventListener('click', addTodo);
    
    todoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
    
    renderTodos();
    restoreReminders();
});