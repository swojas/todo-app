const express = require("express");
const parse = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const port = process.env.PORT || 3000;

app.use(parse.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');

mongoose.connect("mongodb+srv://swojas:w5RNHCCu3Q8f1Ppz@cluster0.6ylqvbd.mongodb.net/todolistDB?retryWrites=true&w=majority", { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

const TasksSchema = new mongoose.Schema({
    task: { type: String }
});

const Task = mongoose.model("Task", TasksSchema);

const item1 = new Task({
    task: "Welcome to To Do List"
});

const item2 = new Task({
    task: "Hit + to add new tasks"
});

const item3 = new Task({
    task: "<--- click this box to check this"
});

const defaultItems = [item1, item2, item3];

const ListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    items: [TasksSchema]
})

const List = mongoose.model("List", ListSchema);
let day;

app.get("/", function (req, res) {

    let today = new Date();

    let options = {
        weekday: "long",
        day: "numeric",
        month: "long"
    };

    day = today.toLocaleDateString("en-US", options);

    Task.find()
        .then(function (result) {
            if (result.length === 0) {
                Task.insertMany(defaultItems)
                    .then(function () {
                        console.log("Pushed default items because DB was empty");
                    })
                    .catch(function (err) {
                        console.log(err);
                    })
                res.redirect("/");
            }
            else {
                res.render("index", { title: day, text: result });
            }
        })
        .catch(function (err) {
            console.log(err);
        })

});

app.post("/", function (req, res) {
    const listName = req.body.button;

    const item = new Task({
        name: listName
    })

    if (listName == day) {
        Task.insertMany({ task: req.body.textField });
        res.redirect("/");
    } else {
        List.findOne({ name: listName })
            .then(function (foundList) {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            })
    }
});

app.post("/delete", function (req, res) {
    const checkedItem = req.body.checkbox;
    const listId = req.body.listName;

    if (listId === day) {
        Task.deleteOne({ _id: checkedItem })
            .then(function () {
                console.log(`deleted item with id ${req.body.checkbox}`);
            })
            .catch(function (err) {
                console.log(err);
            })
        res.redirect("/");
    } else {
        List.findOneAndUpdate({name: listId}, {$pull: {items: {_id: checkedItem}}})
        .then(function(){
            console.log("pulled " + checkedItem + " from " + listId);
        })
        .catch(function(err){
            console.log(err);
        })
        res.redirect("/"+listId);
    }


})

app.get("/:custom", function (req, res) {
    const customList = req.params.custom;

    List.findOne({ name: customList })
        .then(function (result) {
            if (!result) {
                const list = new List({
                    name: customList,
                    items: defaultItems
                });

                list.save();
                console.log("saved");
                res.redirect("/" + customList);
            } else {
                res.render("index", { title: result.name, text: result.items });
            }

        })
        .catch(function (err) {
            console.log(err);
        })


});

app.post(":/custom", function (req, res) {
    Task.deleteOne({ _id: req.body.checkbox })
        .then(function () {
            console.log(`deleted custom item with id ${req.body.checkbox}`);
        })
        .catch(function (err) {
            console.log(err);
        })
    res.redirect("/" + req.params.custom);
    console.log(req.body.button);
})

app.listen(port, function (req, res) {
    console.log("running on " + port);
});


