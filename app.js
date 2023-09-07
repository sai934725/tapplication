const express= require("express");
const app = express();
app.use(express.json());
const format= require("date-fns/format");
const inValid = require("date-fns/inValid");
const toDate = require("date-fns/toDate");
const {open}=require("sqlite");
const sqlite3= require("sqlite3");
const path = require("path");
const dbPath= path.join(__dirname, "todoApplication.db");
let db=null;
const initializeDbAndServer = async () => {
    try {
        db = await open({
            filename:dbPath,
            driver: sqlite3.Database,
        });
     app.listen(3000, () => {
        console.log("Server is running at http:localhost:3000/");
    })
} catch (e) {
    console.log("e.message")
}
};

initializeDbAndServer();

const checkRequestsQuires = async(request, response, next)=>{
  const {search_q, category, priority, status, date} = request.query;
  const {todoId} = request.params;
  if (category !== undefined){
      const categoryArray =["WORK", "HOME", "LEARNING"];
      const categoryIsInArray = categoryArray.includes(category);
      if (categoryIsInArray === true){
          request.category=category;
      } else{
          response.status(400);
          response.send("Invalid Todo Category");
          return;
      }
  }
  if (priority !== undefined){
      const priorityArray = ["HIGH", "MEDIUM", "LOW"];
      const priorityIsInArray = priorityArray.includes(priority);
      if (priorityIsInArray === true){
          request.priority = priority;
      } else{
          response.status(400);
          response.send("Invalid Todo Priority");
          return;
      }
  }
  if(status!== undefined){
      const statusArray=["TO DO ", "IN PROGRESS", "DONE"];
      if(statusIsInArray === true){
          request.status=status;
      } else{
          response.status(400);
          response.send("Invalid Todo Status");
      }
  }
  if (date !== undefined){
      try{
          const myDate = new Date(date);
          const formateDate = format(new Date(date), "yyyy-MM-dd");
          console.log(formateDate, "f");
          const result = toDate(
              new Date(
                  `${myDate.getFullYear()}-${myDate.getMonth()+1}-${myDate.getDate()}`
              )
              );
              console.log(result,"r");
              console.log(new Date(), "new");
              const isValidDate = await isValid(result);
              console.log(isValidDate,"V");
              if(isValidDate===true){
                  request.date=formateDate;
              } else{
                  response.status(400);
                  response.send("Invalid Due Date");
                  return;
              }
          
            }catch(e){
                response.status(400);
                response.send("Invalid Due Date");
                return;
            }
  }
  request.todId=todoId;
  request.search_q=search_q;
  next();
};

const CheckRequestsBody = (request,response,next){
    const {id, todo, category, priority, status, dueDate}=request.body;
    const {todoId}=request.params;
    if (category !== undefined){
        categoryArray=["WORK","HOME", "LEARNING"];
        categoryIsInArray = categoryArray.includes(category);
        if (categoryIsInArray===true){
            request.category = category;
        } else{
            response.status(400);
            response.send("Invalid Todo Category");
            return;
        }
    }
    if ( priority!==undefined){
        priorityArray = ["HIGH", "MEDIUM","LOW"];
        priorityIsInArray = priorityArray.includes(priority);
        if (priorityIsInArray === true){
            request.priority = priority;
        } else{
            response.status(400);
            response.send("Invalid Todo Priority");
            return;
        }   
    }
    if (status!==undefined){
        statusArray=["TO DO","IN PROGRESS", "DONE"];
        statusIsInArray=statusArray.includes(status);
        if(statusIsInArray===true){
            request.status=status;
        } else{
            response.status(400);
            response.send("Invalid Todo Status");
            return;
        }
    }
    if(dueDate !==undefined){
        try{
            const myDate = new Date(dueDate);
            const formateDate=format(new Date(dueDate),"yyyy-MM-dd");
            console.log(formateDate);
            const result = toDate(new Date(formateDate));
            const isValidDate = isValid(result);
            console.log(isValidDate);
            console.log(isValidDate);
            if (isValidDate ===true){
                request.dueDate = formateDate;
            } else{
                response.status(400);
                response.send("Invalid Due Date");
                return;

            }
        } catch(e){
            response.status(400);
            response.send("Invalid Due Date");
        }
    }
    request.todo=todo;
    request.id=id;
    request.todoId=todoId;
    next();
};

//api-1
app.get("/todos/", checkRequestsQuires, async(request,response)=>{
    const {status="",search_q="", priority="",category=""}=request;
    console.log(status,search_q,priority,category);
    const getTodosQuery =`
           SELECT
              id,
              todo,
              priority,
              status,
              category,
              due_date AS dueDate
            FROM
               todo
            WHERE
               todo LIKE '%${search_q}'AND priority LIKE '%{priority}%'
            AND  status LIKE '%{status}%' AND category LIKE '%${category}%';`;
    const todosArray = await db.all(getTodosQuery);
    response.send(todosArray);
});

//api 2

app.get("/todos/:todoId/", checkRequestsQuires, async(request,response)=>{
    const {todoId}=request;
    const getTodoQuery=`
        SELECT
              id,
              todo,
              priority,
              status,
              category,
              due_date AS dueDate
        FROM 
        todo
        WHERE
           id=${todoId};
    `;
    const todo = await db.get(getTodoQuery);
    response.send(todo);
});

//api-3
app.get("/agenda/", checkRequestsQuires, async(request,response)=>{
    const{date}=request;
    console.log(date, "a");
    const selectDueDateQuery=`
             SELECT
              id,
              todo,
              priority,
              status,
              category,
              due_date AS dueDate
               FROM 
               todo
               WHERE
                  due_date ='${date}'; `;
    const todosArray=await db.all(selectDueDateQuery);
    if(todosArray===undefined){
        response.status(400);
        response.send("Invalid Due Date");
    } else{
        response.send(todosArray);
    }
});

//api-4
app.post("/todos/", checkRequestsQuires, async(request,response)=>{
    const {id,todo, category, priority, status, dueDate}=request;
    const addTodoQuery=`
    INSERT INTO
    todo(id, todo, priority, status, category, due_date)
    VALUES 
    (
        ${id},
        '${todo}',
       ' ${priority}',
        '${status}',
        '${category}',
        '${dueDate}'

    );`;
    const createUser = await db.run(addTodoQuery);
    console.log(createUser);
    response.send("Todo Successfully Added");
});

//api-5 updated
app.put("/todos/:todoId/",CheckRequestsBody, async(request,response)=>{
    const{todoId}=request;
     const {priority,todo, status, category, dueDate}=request;
    const updateTodoQuery=null;
    console.log(priority, todo, status, dueDate,category);
    switch(true){
        case status !==undefined:
        updateTodoQuery =`
        UPDATE 
            todo
            SET 
              status='${status}'
            WHERE
             id=${todoId} ; `;
    await db.run(updateTodoQuery);
    response.send("Status Updated");
    break;
    case priority !==undefined:
        updateTodoQuery=`
        UPDATE
           todo 
        SET 
          priority='${priority}'
          WHERE 
            id =${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Priority Updated");
    break;

     case todo !==undefined:
        updateTodoQuery=`
        UPDATE
           todo 
        SET 
          todo='${todo}'
          WHERE 
            id =${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Todo Updated");
    break;

     case category !==undefined:
        updateTodoQuery=`
        UPDATE
           todo 
        SET 
          category='${category}'
          WHERE 
            id =${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Category Updated");
    break;
    }
  
     case dueDate !==undefined:
        updateTodoQuery=`
        UPDATE
           todo 
        SET 
          dueDate='${dueDate}'
          WHERE 
            id =${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Due Date Updated");
    break;
    }
  
});

// DELETE api-6
app.delete("/todos/:todoId/", async(request,response)=>{
    const {todoId}=request.params;
    const deleteTodoQuery=`
         DELETE 
            FROM
            todo
        WHERE
          id=${todoId}
          ;`;
    await db.run(deleteTodoQuery);
    response.send("Todo Deleted");

    <br/>
});





module.exports=app;
