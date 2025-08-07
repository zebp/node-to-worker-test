class TodoApp {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
    this.initCharacterCounters();
  }

  bindEvents() {
    const addTaskForm = document.getElementById('addTaskForm');
    const editTaskForm = document.getElementById('editTaskForm');
    const modal = document.getElementById('editModal');
    const closeModal = document.getElementById('closeModal');
    const cancelEdit = document.getElementById('cancelEdit');

    if (addTaskForm) {
      addTaskForm.addEventListener('submit', (e) => this.handleAddTask(e));
    }

    if (editTaskForm) {
      editTaskForm.addEventListener('submit', (e) => this.handleEditTask(e));
    }

    if (closeModal) {
      closeModal.addEventListener('click', () => this.closeEditModal());
    }

    if (cancelEdit) {
      cancelEdit.addEventListener('click', () => this.closeEditModal());
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeEditModal();
        }
      });
    }

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('task-checkbox')) {
        this.handleToggleTask(e);
      } else if (e.target.classList.contains('delete-task')) {
        this.handleDeleteTask(e);
      } else if (e.target.classList.contains('edit-task')) {
        this.handleEditTaskClick(e);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
        this.closeEditModal();
      }
    });
  }

  initCharacterCounters() {
    const titleInput = document.getElementById('title');
    const descriptionTextarea = document.getElementById('description');
    const editTitleInput = document.getElementById('editTitle');
    const editDescriptionTextarea = document.getElementById('editDescription');

    if (titleInput) {
      this.setupCharacterCounter(titleInput, 'titleCounter', 255);
    }
    
    if (descriptionTextarea) {
      this.setupCharacterCounter(descriptionTextarea, 'descriptionCounter', 1000);
    }
    
    if (editTitleInput) {
      this.setupCharacterCounter(editTitleInput, 'editTitleCounter', 255);
    }
    
    if (editDescriptionTextarea) {
      this.setupCharacterCounter(editDescriptionTextarea, 'editDescriptionCounter', 1000);
    }
  }

  setupCharacterCounter(input, counterId, maxLength) {
    const counter = document.getElementById(counterId);
    if (!counter) return;

    const updateCounter = () => {
      const currentLength = input.value.length;
      counter.textContent = currentLength;
      
      if (currentLength > maxLength * 0.8) {
        counter.style.color = '#ff7043';
      } else {
        counter.style.color = '#757575';
      }
    };

    input.addEventListener('input', updateCounter);
    updateCounter();
  }

  async handleAddTask(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const title = formData.get('title').trim();
    const description = formData.get('description').trim();

    if (!title) {
      this.showNotification('Task title is required', 'error');
      return;
    }

    try {
      this.setLoading(form, true);
      
      const response = await fetch('/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ title, description })
      });

      if (response.ok) {
        const task = await response.json();
        this.addTaskToDOM(task);
        form.reset();
        this.updateCounters();
        this.showNotification('Task created successfully!', 'success');
        
        document.querySelectorAll('.char-counter span').forEach(counter => {
          counter.textContent = '0';
          counter.style.color = '#757575';
        });
      } else {
        const error = await response.json();
        this.showNotification(error.error?.message || 'Failed to create task', 'error');
      }
    } catch (error) {
      console.log({ event: 'task_create_error', error: error.message, timestamp: new Date().toISOString() });
      this.showNotification('Failed to create task. Please try again.', 'error');
    } finally {
      this.setLoading(form, false);
    }
  }

  async handleToggleTask(e) {
    const taskId = e.target.dataset.taskId;
    const taskItem = e.target.closest('.task-item');
    
    try {
      const response = await fetch(`/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const task = await response.json();
        taskItem.classList.toggle('task-completed', task.completed);
        this.updateCounters();
        
        const action = task.completed ? 'completed' : 'marked as pending';
        this.showNotification(`Task ${action}!`, 'success');
      } else {
        e.target.checked = !e.target.checked;
        this.showNotification('Failed to update task', 'error');
      }
    } catch (error) {
      console.log({ event: 'task_toggle_error', error: error.message, timestamp: new Date().toISOString() });
      e.target.checked = !e.target.checked;
      this.showNotification('Failed to update task. Please try again.', 'error');
    }
  }

  async handleDeleteTask(e) {
    const taskId = e.target.dataset.taskId;
    const taskItem = e.target.closest('.task-item');
    const taskTitle = taskItem.querySelector('.task-title').textContent;

    if (!confirm(`Are you sure you want to delete "${taskTitle}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        taskItem.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => {
          taskItem.remove();
          this.updateCounters();
          this.checkEmptyState();
        }, 300);
        this.showNotification('Task deleted successfully!', 'success');
      } else {
        this.showNotification('Failed to delete task', 'error');
      }
    } catch (error) {
      console.log({ event: 'task_delete_error', error: error.message, timestamp: new Date().toISOString() });
      this.showNotification('Failed to delete task. Please try again.', 'error');
    }
  }

  handleEditTaskClick(e) {
    const taskId = e.target.dataset.taskId;
    const taskItem = e.target.closest('.task-item');
    const title = taskItem.querySelector('.task-title').textContent;
    const descriptionElement = taskItem.querySelector('.task-description');
    const description = descriptionElement ? descriptionElement.textContent : '';

    this.openEditModal(taskId, title, description);
  }

  openEditModal(taskId, title, description) {
    const modal = document.getElementById('editModal');
    const editForm = document.getElementById('editTaskForm');
    const titleInput = document.getElementById('editTitle');
    const descriptionTextarea = document.getElementById('editDescription');

    if (!modal || !editForm || !titleInput || !descriptionTextarea) return;

    editForm.dataset.taskId = taskId;
    titleInput.value = title;
    descriptionTextarea.value = description;

    modal.classList.add('active');
    titleInput.focus();
    
    const titleCounter = document.getElementById('editTitleCounter');
    const descriptionCounter = document.getElementById('editDescriptionCounter');
    
    if (titleCounter) titleCounter.textContent = title.length;
    if (descriptionCounter) descriptionCounter.textContent = description.length;
  }

  closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  async handleEditTask(e) {
    e.preventDefault();
    
    const form = e.target;
    const taskId = form.dataset.taskId;
    const formData = new FormData(form);
    const title = formData.get('title').trim();
    const description = formData.get('description').trim();

    if (!title) {
      this.showNotification('Task title is required', 'error');
      return;
    }

    try {
      this.setLoading(form, true);
      
      const response = await fetch(`/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ title, description })
      });

      if (response.ok) {
        const task = await response.json();
        this.updateTaskInDOM(taskId, task);
        this.closeEditModal();
        this.showNotification('Task updated successfully!', 'success');
      } else {
        const error = await response.json();
        this.showNotification(error.error?.message || 'Failed to update task', 'error');
      }
    } catch (error) {
      console.log({ event: 'task_update_error', error: error.message, timestamp: new Date().toISOString() });
      this.showNotification('Failed to update task. Please try again.', 'error');
    } finally {
      this.setLoading(form, false);
    }
  }

  addTaskToDOM(task) {
    const tasksList = document.getElementById('tasksList');
    const emptyState = document.querySelector('.empty-state');
    
    if (emptyState) {
      emptyState.remove();
    }

    if (!tasksList) {
      location.reload();
      return;
    }

    const taskHTML = this.createTaskHTML(task);
    tasksList.insertAdjacentHTML('afterbegin', taskHTML);
    
    const newTask = tasksList.firstElementChild;
    newTask.classList.add('fade-in');
  }

  updateTaskInDOM(taskId, task) {
    const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskItem) return;

    const titleElement = taskItem.querySelector('.task-title');
    const descriptionElement = taskItem.querySelector('.task-description');

    if (titleElement) {
      titleElement.textContent = task.title;
    }

    if (task.description) {
      if (descriptionElement) {
        descriptionElement.textContent = task.description;
      } else {
        const taskContent = taskItem.querySelector('.task-content');
        const taskMeta = taskItem.querySelector('.task-meta');
        const descriptionHTML = `<p class="task-description" data-field="description">${task.description}</p>`;
        taskMeta.insertAdjacentHTML('beforebegin', descriptionHTML);
      }
    } else if (descriptionElement) {
      descriptionElement.remove();
    }
  }

  createTaskHTML(task) {
    const description = task.description ? `<p class="task-description" data-field="description">${task.description}</p>` : '';
    const completedClass = task.completed ? 'task-completed' : '';
    const checkedAttr = task.completed ? 'checked' : '';
    
    return `
      <div class="task-item ${completedClass}" data-task-id="${task.id}">
        <div class="task-checkbox-wrapper">
          <input type="checkbox" 
                 class="task-checkbox" 
                 id="task-${task.id}" 
                 ${checkedAttr}
                 data-task-id="${task.id}">
          <label for="task-${task.id}" class="checkbox-label"></label>
        </div>
        
        <div class="task-content">
          <div class="task-header">
            <h3 class="task-title" data-field="title">${task.title}</h3>
            <div class="task-actions">
              <button type="button" 
                      class="btn-icon edit-task" 
                      data-task-id="${task.id}"
                      title="Edit task">
                ✏️
              </button>
              <button type="button" 
                      class="btn-icon delete-task" 
                      data-task-id="${task.id}"
                      title="Delete task">
                🗑️
              </button>
            </div>
          </div>
          
          ${description}
          
          <div class="task-meta">
            <small class="task-date">
              Created: ${this.formatDate(task.created_at)}
            </small>
          </div>
        </div>
      </div>
    `;
  }

  updateCounters() {
    const tasks = document.querySelectorAll('.task-item');
    const completedTasks = document.querySelectorAll('.task-completed');
    const totalTasks = tasks.length;
    const completedCount = completedTasks.length;
    const pendingCount = totalTasks - completedCount;

    const summaryNumbers = document.querySelectorAll('.summary-number');
    if (summaryNumbers.length >= 3) {
      summaryNumbers[0].textContent = totalTasks;
      summaryNumbers[1].textContent = pendingCount;
      summaryNumbers[2].textContent = completedCount;
    }
  }

  checkEmptyState() {
    const tasksList = document.getElementById('tasksList');
    const tasksSection = document.querySelector('.tasks-section');
    
    if (!tasksList || tasksList.children.length > 0) return;

    const emptyStateHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>No tasks yet</h3>
        <p>Create your first task to get started!</p>
      </div>
    `;
    
    tasksList.outerHTML = emptyStateHTML;
  }

  setLoading(form, isLoading) {
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (isLoading) {
      form.classList.add('loading');
      submitButton.disabled = true;
      submitButton.textContent = 'Loading...';
    } else {
      form.classList.remove('loading');
      submitButton.disabled = false;
      
      if (form.id === 'addTaskForm') {
        submitButton.innerHTML = '<span class="btn-icon">+</span>Add Task';
      } else {
        submitButton.textContent = 'Save Changes';
      }
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
      word-wrap: break-word;
      font-weight: 500;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

const addAnimationStyles = () => {
  if (document.getElementById('dynamicStyles')) return;
  
  const style = document.createElement('style');
  style.id = 'dynamicStyles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    @keyframes fadeOut {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-20px);
      }
    }
  `;
  document.head.appendChild(style);
};

document.addEventListener('DOMContentLoaded', () => {
  addAnimationStyles();
  new TodoApp();
});