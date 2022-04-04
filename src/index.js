const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();

let { users } = require("./repositories");

app.use(cors());
app.use(express.json());

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  if (!username) {
    return response.status(401).json({
      error: "You need to be logged in for accessing this resource.",
    });
  }

  const userExists = users.find((user) => user.username === username);

  if (!userExists) {
    return response.status(404).json({ error: "User not found." });
  }

  request.user = userExists;

  return next();
}

function checksIfTodoExists(request, response, next) {
  const { user } = request;
  const { id } = request.params;

  const todoExists = user.todos.find((todo) => todo.id === id);

  if (!todoExists) {
    return response.status(404).json({ error: "Todo not found." });
  }

  request.todo = todoExists;
  return next();
}

// MINHA ROTINHA DESNECESSARIA
// app.get("/users", (request, response) => {
//   return response.json({ users });
// });

app.post("/users", (request, response) => {
  const id = uuidv4();

  const { name, username } = request.body;
  const userAlreadyExists = users.find(
    (registeredUser) => registeredUser.username === username
  );
  if (userAlreadyExists) {
    return response.status(400).json({
      error:
        "This username is already in use... Please choose another one. If that is your account, you can already check your todos.",
    });
  }

  const newUser = {
    id,
    name,
    username,
    todos: [],
  };

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return response.status(200).json([...user.todos]);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  const currentTime = new Date();
  const newDeadline = new Date(deadline);

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: newDeadline,
    created_at: currentTime,
  };

  const newUsersList = users.map((registeredUser) =>
    registeredUser.username === user.username
      ? { ...registeredUser, todos: [...registeredUser.todos, newTodo] }
      : registeredUser
  );

  users = newUsersList;
  return response.status(201).json(newTodo);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checksIfTodoExists,
  (request, response) => {
    const { user, todo } = request;
    const { title, deadline } = request.body;

    const updatedUserTodos = user.todos.map((userTodo) =>
      userTodo.id === todo.id ? { ...userTodo, title, deadline } : userTodo
    );

    const updatedUsers = users.map((registeredUser) =>
      registeredUser.id === user.id
        ? { ...registeredUser, todos: updatedUserTodos }
        : registeredUser
    );

    users = updatedUsers;

    return response.status(200).json({ title, deadline, done: todo.done });
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checksIfTodoExists,
  (request, response) => {
    // Complete aqui
    const { user, todo } = request;

    const updatedUserTodos = user.todos.map((userTodo) =>
      userTodo.id === todo.id ? { ...userTodo, done: true } : userTodo
    );

    const updatedUsers = users.map((registeredUser) =>
      registeredUser.id === user.id
        ? { ...registeredUser, todos: updatedUserTodos }
        : registeredUser
    );

    users = updatedUsers;

    return response.status(200).json({ ...todo, done: true });
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksIfTodoExists,
  (request, response) => {
    const { user, todo } = request;
    const updateUserTodos = user.todos.filter(
      (userTodo) => userTodo.id !== todo.id
    );

    user.todos = updateUserTodos;

    return response.status(204).json(user);
  }
);

module.exports = app;
