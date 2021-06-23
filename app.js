const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

mongoose.connect("mongodb+srv://Anash:Anash@cluster0.ap3l5.mongodb.net/toDoListDB", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
const app = express();

const itemsSchema={
  name: String
}

const listSchema={
  name: String,
  items: [itemsSchema]
}

const List= mongoose.model("list",listSchema);
const Item =mongoose.model("item",itemsSchema);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const code=new Item({
  name: "Welcome to your todolist!"
});
const sleep=new Item({
  name: "Hit the + button to add a new item"
});const repeat=new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [code ,sleep,repeat];

app.get("/", function(req, res) {

  Item.find(function(err,items){
    if(err){
      console.log("Error!");
    }
    else{
        if(items.length===0){
          Item.insertMany(defaultItems,function(err){
            if(err){
              console.log("Error!");
            }
          });
          res.redirect("/");
          }
          else{
            const day = date.getDate();
            res.render("list", {listTitle: day, newListItems: items});
          }
        }
  });
});

app.get("/:customListName", function(req,res){

  const customListName= req.params.customListName;

  List.findOne({name: customListName}, function(err,foundList){
    if(!err){
      if(!foundList){
        //console.log("Doesn't exist");
        const list= new List({
          name: customListName,
          items: defaultItems
        });
        list.save();

        res.redirect("/" + customListName);
      }
      else{
        //console.log("Exists");
        res.render("customList", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});
var newListName;
app.post("/", function(req, res){

  if(req.body.home === "home"){
    Item.find(function(err,items){
      if(err){
        console.log("Error!");
      }else{
        const day = date.getDate();
        res.render("list", {listTitle: day, newListItems: items});
      }
    });
  }
  else{
    if(req.body.list === "customList"){
      var newListName= _.capitalize(req.body.newListName);
      res.redirect("/" + newListName);
    }
    else{
      const itemName = req.body.newItem;
      const listName = req.body.list.slice(0,-1);

      const addItem= new Item({
        name: itemName
      });

      if(!isNaN(listName.slice(-2))){

        addItem.save();
        res.redirect("/");
      }
      else{
        List.findOne({name: listName}, function(err,foundList){
          if(err){
            console.log("Error!");
          }
          else{

          foundList.items.push(addItem);
          foundList.save();
          res.redirect("/" + listName);
          }
        })
      }
    }
  }
});

  app.post("/" + newListName,function(req,res){
    console.log(req.body);
    List.findOne({name: newListName},function(err,foundList){
      if(!err){
        if(!foundList){
          //console.log("Doesn't exist");
          const list= new List({
            name: newListName,
            items: defaultItems
          });
          list.save();
  
          res.redirect("/" + newListName);
        }
        else{
          //console.log("Exists");
          res.render("customList", {listTitle: foundList.name, newListItems: foundList.items});
        }
    };
  });
});

  app.post("/delete", function(req,res){
    const checkedItemId= req.body.checkbox.slice(0,-1);
    const listName= req.body.listName.slice(0,-1);

    if(!isNaN(listName.slice(-1))){

      Item.deleteOne({_id: checkedItemId}, function(err){
        if(err){
          console.log("Error!");
        }
        res.redirect("/");
      });
    }
    else{
      List.findOneAndUpdate({name: listName},{$pull: {items: {_id : checkedItemId }}}, function(err){
        if(!err){
          res.redirect("/" + listName);
        }
      })
    }
    
  });

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
