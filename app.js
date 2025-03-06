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
        // 创建一个弹窗提醒
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert-popup';
        alertDiv.innerHTML = `
            <div class="alert-content">
                <h3>待办事项提醒</h3>
                <p>${text}</p>
                <button id="alert-close">我知道了</button>
                <audio id="notification-sound" src="https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3" preload="auto"></audio>
            </div>
        `;
        document.body.appendChild(alertDiv);
        
        // 获取音频元素
        const sound = document.getElementById('notification-sound');
        
        // 当用户点击按钮时播放声音（这样可以绕过自动播放限制）
        document.getElementById('alert-close').addEventListener('click', function() {
            sound.play();
            setTimeout(() => {
                alertDiv.remove();
            }, 500);
        });
        
        // 尝试直接播放声音
        try {
            // 创建用户交互事件来触发声音播放
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(clickEvent);
            
            // 尝试直接播放
            sound.volume = 1.0;
            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('自动播放被阻止，需要用户交互');
                });
            }
        } catch (e) {
            console.log('播放声音失败:', e);
        }
        
        // 发送系统通知
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('待办事项提醒', {
                    body: text,
                    icon: 'https://example.com/icon.png'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification('待办事项提醒', {
                            body: text,
                            icon: 'https://example.com/icon.png'
                        });
                    }
                });
            }
        }
        
        // 使用振动API作为额外提醒（如果设备支持）
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
    }
    
    // 播放闹铃声音的函数
    function playAlarmSound() {
        // 使用多个备选铃声，增加成功率
        const alarmSources = [
            'https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3',
            'https://assets.mixkit.co/sfx/preview/mixkit-classic-alarm-995.mp3',
            'https://assets.mixkit.co/sfx/preview/mixkit-classic-short-alarm-993.mp3'
        ];
        
        // 尝试播放第一个铃声
        tryPlaySound(alarmSources, 0);
    }
    
    // 尝试依次播放铃声
    function tryPlaySound(sources, index) {
        if (index >= sources.length) {
            console.log('所有铃声播放尝试均失败');
            return;
        }
        
        const alarm = new Audio(sources[index]);
        alarm.volume = 0.8; // 设置音量
        
        // 预加载
        alarm.preload = 'auto';
        
        // 错误处理
        alarm.onerror = function() {
            console.log(`铃声 ${index + 1} 加载失败，尝试下一个`);
            tryPlaySound(sources, index + 1);
        };
        
        // 尝试播放
        const playPromise = alarm.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log(`铃声 ${index + 1} 播放被阻止，尝试下一个`);
                tryPlaySound(sources, index + 1);
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