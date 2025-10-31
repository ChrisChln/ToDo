import { createSlice } from '@reduxjs/toolkit';
import { createDefaultTodoState, normalizeTodosData } from '../../utils/todoHelpers';

const initialState = createDefaultTodoState();

const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    addTodo: (state, action) => {
      const { categoryId, todo } = action.payload;
      const category = state.categories.find(cat => cat.id === categoryId);
      if (category) {
        category.todos.push(todo);
      }
    },
    toggleTodo: (state, action) => {
      const { categoryId, id } = action.payload;
      const category = state.categories.find(cat => cat.id === categoryId);
      if (category) {
        const todo = category.todos.find(t => t.id === id);
        if (todo) {
          todo.status = todo.status === 'complete' ? 'incomplete' : 'complete';
        }
      }
    },
    deleteTodo: (state, action) => {
      const { categoryId, id } = action.payload;
      const category = state.categories.find(cat => cat.id === categoryId);
      if (category) {
        category.todos = category.todos.filter(t => t.id !== id);
      }
    },
    updateTodo: (state, action) => {
      const { categoryId, id, updates } = action.payload;
      const category = state.categories.find(cat => cat.id === categoryId);
      if (category) {
        const index = category.todos.findIndex(t => t.id === id);
        if (index !== -1) {
          category.todos[index] = {
            ...category.todos[index],
            ...updates,
            id,
          };
        }
      }
    },
    loadTodos: (state, action) => {
      const normalized = normalizeTodosData(action.payload);
      return normalized;
    },
    resetTodos: () => {
      return createDefaultTodoState();
    },
    addCategory: (state, action) => {
      const { id, name } = action.payload;
      if (!id) return;
      state.categories.push({
        id,
        name: name?.trim() || '新建分类',
        collapsed: false,
        todos: [],
      });
    },
    updateCategory: (state, action) => {
      const { categoryId, name, finalizeName } = action.payload;
      const category = state.categories.find(cat => cat.id === categoryId);
      if (category) {
        if (typeof name === 'string') {
          category.name = finalizeName ? (name.trim() || '未命名分类') : name;
        }
      }
    },
    deleteCategory: (state, action) => {
      const { categoryId } = action.payload;
      state.categories = state.categories.filter(cat => cat.id !== categoryId);
    },
    toggleCategoryCollapse: (state, action) => {
      const { categoryId } = action.payload;
      const category = state.categories.find(cat => cat.id === categoryId);
      if (category) {
        category.collapsed = !category.collapsed;
      }
    },
    reorderCategories: (state, action) => {
      const { orderedIds } = action.payload;
      if (!Array.isArray(orderedIds) || orderedIds.length === 0) return;
      const idToCategory = state.categories.reduce((acc, category) => {
        acc[category.id] = category;
        return acc;
      }, {});
      const reordered = orderedIds
        .map(id => idToCategory[id])
        .filter(Boolean);
      const remaining = state.categories.filter(
        category => !orderedIds.includes(category.id)
      );
      state.categories = [...reordered, ...remaining];
    },
  },
});

export const {
  addTodo,
  toggleTodo,
  deleteTodo,
  updateTodo,
  loadTodos,
  resetTodos,
  addCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryCollapse,
  reorderCategories,
} = todoSlice.actions;

export default todoSlice.reducer;
