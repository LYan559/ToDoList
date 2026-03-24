class KanbanBoard {
    constructor() {
        this.tasks = [];
        this.loadTasks();
        this.initEventListeners();
        this.render();
        this.initDragAndDrop();
    }

    // Carrega tarefas do localStorage
    loadTasks() {
        const storedTasks = localStorage.getItem('kanbanTasks');
        if (storedTasks) {
            this.tasks = JSON.parse(storedTasks);
        } else {
            // Dados de exemplo com tema escuro
            this.tasks = [
                {
                    id: Date.now(),
                    title: 'Implementar tema escuro',
                    description: 'Criar uma interface moderna com cores pretas e azuis',
                    status: 'todo',
                    createdAt: new Date().toLocaleString('pt-BR')
                },
                {
                    id: Date.now() + 1,
                    title: 'Melhorar animações',
                    description: 'Adicionar transições suaves e feedback visual',
                    status: 'progress',
                    createdAt: new Date().toLocaleString('pt-BR')
                },
                {
                    id: Date.now() + 2,
                    title: 'Otimizar performance',
                    description: 'Melhorar a eficiência do drag and drop',
                    status: 'done',
                    createdAt: new Date().toLocaleString('pt-BR')
                }
            ];
            this.saveTasks();
        }
    }

    // Salva tarefas no localStorage
    saveTasks() {
        localStorage.setItem('kanbanTasks', JSON.stringify(this.tasks));
        this.updateStats();
    }

    // Adiciona nova tarefa
    addTask(title, description) {
        if (!title || title.trim() === '') {
            this.showNotification('Por favor, digite um título para a tarefa!', 'warning');
            return false;
        }

        const newTask = {
            id: Date.now(),
            title: title.trim(),
            description: description ? description.trim() : '',
            status: 'todo',
            createdAt: new Date().toLocaleString('pt-BR')
        };

        this.tasks.push(newTask);
        this.saveTasks();
        this.render();
        this.showNotification('✨ Tarefa adicionada com sucesso!', 'success');
        return true;
    }

    // Move tarefa para outro status
    moveTask(taskId, newStatus) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.status !== newStatus) {
            const oldStatus = task.status;
            task.status = newStatus;
            this.saveTasks();
            this.render();

            const statusNames = {
                todo: '📝 A Fazer',
                progress: '⚙️ Em Desenvolvimento',
                done: '✅ Concluído'
            };
            this.showNotification(`🚀 Tarefa movida para "${statusNames[newStatus]}"!`, 'info');
        }
    }

    // Remove tarefa
    deleteTask(taskId) {
        if (confirm('⚠️ Tem certeza que deseja remover esta tarefa?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
            this.render();
            this.showNotification('🗑️ Tarefa removida com sucesso!', 'success');
        }
    }

    // Atualiza estatísticas
    updateStats() {
        const todoCount = this.tasks.filter(t => t.status === 'todo').length;
        const progressCount = this.tasks.filter(t => t.status === 'progress').length;
        const doneCount = this.tasks.filter(t => t.status === 'done').length;
        const totalCount = this.tasks.length;

        document.getElementById('todoCount').textContent = todoCount;
        document.getElementById('progressCount').textContent = progressCount;
        document.getElementById('doneCount').textContent = doneCount;

        const statsContainer = document.getElementById('statsContainer');
        statsContainer.innerHTML = `
                    <div class="stat-card">
                        <h3>📊 Total</h3>
                        <div class="number">${totalCount}</div>
                    </div>
                    <div class="stat-card">
                        <h3>📝 A Fazer</h3>
                        <div class="number">${todoCount}</div>
                    </div>
                    <div class="stat-card">
                        <h3>⚙️ Em Dev</h3>
                        <div class="number">${progressCount}</div>
                    </div>
                    <div class="stat-card">
                        <h3>✅ Concluído</h3>
                        <div class="number">${doneCount}</div>
                    </div>
                    <div class="stat-card">
                        <h3>🎯 Progresso</h3>
                        <div class="number">${totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100)}%</div>
                    </div>
                `;
    }

    // Renderiza todas as colunas
    render() {
        this.renderColumn('todo', 'todoTasks');
        this.renderColumn('progress', 'progressTasks');
        this.renderColumn('done', 'doneTasks');
        this.updateStats();
        this.initDragAndDrop();
    }

    // Renderiza uma coluna específica
    renderColumn(status, containerId) {
        const container = document.getElementById(containerId);
        const tasksInColumn = this.tasks.filter(task => task.status === status);

        if (tasksInColumn.length === 0) {
            container.innerHTML = this.getEmptyStateHTML(status);
            return;
        }

        const tasksHTML = tasksInColumn.map(task => this.getTaskHTML(task)).join('');
        container.innerHTML = tasksHTML;

        // Adiciona event listeners para os botões
        container.querySelectorAll('.btn-move').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = parseInt(btn.getAttribute('data-id'));
                const direction = btn.getAttribute('data-direction');
                this.moveTaskDirection(taskId, direction);
            });
        });

        container.querySelectorAll('.btn-delete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = parseInt(btn.getAttribute('data-id'));
                this.deleteTask(taskId);
            });
        });
    }

    // Retorna HTML de uma tarefa
    getTaskHTML(task) {
        let moveButtons = '';
        if (task.status === 'todo') {
            moveButtons = `<button class="btn-move" data-id="${task.id}" data-direction="progress">→ Desenvolver</button>`;
        } else if (task.status === 'progress') {
            moveButtons = `
                        <button class="btn-move" data-id="${task.id}" data-direction="todo">← Voltar</button>
                        <button class="btn-move" data-id="${task.id}" data-direction="done">Concluir →</button>
                    `;
        } else if (task.status === 'done') {
            moveButtons = `<button class="btn-move" data-id="${task.id}" data-direction="progress">↺ Reabrir</button>`;
        }

        return `
                    <div class="task-card" data-id="${task.id}" data-status="${task.status}" draggable="true">
                        <div class="task-title">${this.escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                        <div class="task-meta">
                            <div class="task-date">📅 ${task.createdAt}</div>
                            <div class="task-actions">
                                ${moveButtons}
                                <button class="btn-delete-task" data-id="${task.id}">🗑️</button>
                            </div>
                        </div>
                    </div>
                `;
    }

    // Retorna HTML para estado vazio
    getEmptyStateHTML(status) {
        const messages = {
            todo: '📭 Nenhuma tarefa pendente',
            progress: '⚡ Nenhuma tarefa em desenvolvimento',
            done: '🎉 Nenhuma tarefa concluída'
        };

        const icons = {
            todo: '📝',
            progress: '⚙️',
            done: '✅'
        };

        return `
                    <div class="empty-column">
                        <div style="font-size: 3rem; margin-bottom: 10px;">${icons[status]}</div>
                        <p>${messages[status]}</p>
                        <small>Adicione tarefas para começar</small>
                    </div>
                `;
    }

    // Move tarefa baseado na direção
    moveTaskDirection(taskId, direction) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        let newStatus = task.status;
        if (direction === 'progress') newStatus = 'progress';
        else if (direction === 'todo') newStatus = 'todo';
        else if (direction === 'done') newStatus = 'done';

        if (newStatus !== task.status) {
            this.moveTask(taskId, newStatus);
        }
    }

    // Inicializa drag and drop
    initDragAndDrop() {
        const cards = document.querySelectorAll('.task-card');
        const containers = document.querySelectorAll('.tasks-container');

        cards.forEach(card => {
            card.addEventListener('dragstart', this.handleDragStart.bind(this));
            card.addEventListener('dragend', this.handleDragEnd.bind(this));
        });

        containers.forEach(container => {
            container.addEventListener('dragover', this.handleDragOver.bind(this));
            container.addEventListener('dragenter', this.handleDragEnter.bind(this));
            container.addEventListener('dragleave', this.handleDragLeave.bind(this));
            container.addEventListener('drop', this.handleDrop.bind(this));
        });
    }

    handleDragStart(e) {
        const card = e.target.closest('.task-card');
        if (card) {
            e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
            card.classList.add('dragging');
        }
    }

    handleDragEnd(e) {
        const card = e.target.closest('.task-card');
        if (card) {
            card.classList.remove('dragging');
        }
        document.querySelectorAll('.tasks-container').forEach(container => {
            container.style.backgroundColor = '';
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e) {
        e.preventDefault();
        const container = e.target.closest('.tasks-container');
        if (container) {
            container.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        }
    }

    handleDragLeave(e) {
        const container = e.target.closest('.tasks-container');
        if (container) {
            container.style.backgroundColor = '';
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const container = e.target.closest('.tasks-container');
        if (container) {
            container.style.backgroundColor = '';
            const taskId = parseInt(e.dataTransfer.getData('text/plain'));
            const newStatus = container.getAttribute('data-status');
            this.moveTask(taskId, newStatus);
        }
    }

    // Previne XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Mostra notificações
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;

        const colors = {
            success: '#10b981',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        notification.style.backgroundColor = colors[type] || colors.info;
        notification.style.color = '#ffffff';
        notification.style.border = `1px solid ${colors[type]}`;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Inicializa event listeners
    initEventListeners() {
        const addButton = document.getElementById('addTaskBtn');
        const titleInput = document.getElementById('taskTitle');
        const descInput = document.getElementById('taskDescription');

        addButton.addEventListener('click', () => {
            const title = titleInput.value;
            const description = descInput.value;
            if (this.addTask(title, description)) {
                titleInput.value = '';
                descInput.value = '';
                titleInput.focus();
            }
        });

        titleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const title = titleInput.value;
                const description = descInput.value;
                if (this.addTask(title, description)) {
                    titleInput.value = '';
                    descInput.value = '';
                }
            }
        });
    }
}

// Inicializa aplicação
document.addEventListener('DOMContentLoaded', () => {
    new KanbanBoard();
});