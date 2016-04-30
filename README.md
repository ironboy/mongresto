# mongresto 0.20 - documentation

A REST service API for Node.js Express + MongoDB + Mongoose that is based on Mongoose models and generates Angular Resource objects on the fly.

Thomas Frank, Nodebite, April 2016

### Download

[Download the mongresto module.](https://raw.githubusercontent.com/ironboy/mongresto/master/mongresto.js)

(Mongresto hasn't been packaged as a NPM module yet.)

[Download a full scale node.app example.](http://www.nodebite.se/mongresto/mongresto.zip)

## Setup

Install MongoDB, node.js, Express and Mongoose.

### Include mongresto in your node.js/Express app

In your node.js app add the following:

```javascript
// Require the module
var mongresto = require("./mongresto.js");
// Initialize it (the variable app must be the Express server instance)
mongresto.init(app[,options]);
```
#### Please note:
Mongresto relies on the app running [Express](http://expressjs.com) with the [body-parser module](https://github.com/expressjs/body-parser). Typical boiler-plate code for your app.js might thus look something like this:
```javascript
// Require modules
var m = {};
[
  "express",
  "path",
  "cookie-parser",
  "body-parser",
  "./mongresto"
].forEach(function(x){
  // store required modules in m
  m[x.replace(/\W/g,'')] = require(x);
});

// Standard Express boiler plate code
var app = m.express();
app.use(m.bodyparser.json());
app.use(m.bodyparser.urlencoded({ extended: false }));
app.use(m.cookieparser());
app.use(m.express.static(m.path.join(__dirname, 'public')));

// Initialize our own REST api - mongresto
m.mongresto.init(app);

// Route everything "else" to angular (in html5mode)
app.get('*', function (req, res) {
  res.sendFile('index.html', {root: './public'});
});

// Start up
app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
```

#### Optional parameters

If you want to you can set a number of options as well . Otherwise they will be set to their default values:

```javascript
{

  // The MongoDB database to connect to
  dbName: "test",

  // The path to the rest api
  apiPath: "/api",

  // The path where you should put your Mongoose models
  modelPath: "./mongoose-models/",

  // The path where Mongresto will autogenerate
  // frontend JavaScript containing ngResource-based objects
  ngResourcesPath: "/api/ngresources",

  // If Angular.js should stop all further requests to the backend
  // if one result comes back as an error
  ngStopQueueOnError: false,

  // A function written by you - it gets access to the current question
  // and can deny Mongresto permission to run it
  permissionToAsk:
    function(modelName, method, query, req){ return true; },

  // A function written by you - it gets access to the current result
  // (and question) and can deny Mongresto permission to return it
  permissionToAnswer:
    function(modelName, method, query, req, result){ return true; },

  // An array of objects which define "custom routes". Custom routes get
  // mongrestos' mongoose connection injected but otherwise disregard all
  // mongresto functionality
  customRoutes: [
    {
      path: "customRoute/:param1",
      // route name AFTER '/api/'

      controller: customRouteController
      /*
        function that will recieve mongoose connection,
        should return an express function or array of functions
        example:

        function customRouteController(mongoose) {
          return [function (req, res) {
            res.json(true);
          }];
        }
      */
    }
  ]
}
```

#### A note on security:

Mongresto does not handle security based on user privileges. It will create, delete, update and show anything you ask for. By defining your own **permissionToAsk** and **permissionToAnswer** functions you can integrate your own handling of user roles and privileges with mongresto in a simple, yet fine-grained way.

### Use with Angular.js

If you want to take advantage of mongrestos integration with Angular.js, do the following in your index.html file:

```html
<!-- Include the angular.js library -->
<script src="js/libs/angular.js"></script>
<!-- Include the angular-route.js library -->
<script src="js/libs/angular-route.js"></script>
<!-- Include the angular-resource.js library -->
<script src="js/libs/angular-resource.js"></script>
<!-- Include your own basic angular.js app -->
<script src="js/app.js"></script>
<!-- Now include the code automatically genereated by mongresto
     /api/ngResources/ is the default route for this (see previous setup)
     app is the global variable name we have chosen for our Angular app.
     So if you name your ng app something else change the last part of this URL.
 -->
<script src="/api/ngResources/app"></script>
<!-- Include your controllers etc. -->
```

#### Please note:
In order for the integration with Angular to work you should set up your app with injected dependencies pointing to ngRoute and ngResource (in the example below we also inject a dependency to "ui.bootstrap"):
```javascript
var app = angular.module("ngNode", ["ngRoute", "ngResource", "ui.bootstrap"]);
```

Your next step will be to add one (or several) mongoose models.

## Create a mongoose model

Create a new file in the mongoose-models folder (or a sub folder inside it). Wrap it in the following way:

```javascript
module.exports = function(mongoose){

  // Create a new mongoose schema 
  // with properties
  var PersonSchema = mongoose.Schema({
    name: String,
    towelColor: String,
    age:Number
  });

  // Create a model from the schema
  var Person = mongoose.model("Person",PersonSchema);

  // Return the model
  return Person;

};
```

Mongresto will now automatically create a REST path and an ngResource object from this model (and any other model you create).

## Use the REST service

If you plan to take advantage of mongresto's Angular.js integration, chances are you will never need to see/understand the raw REST service. However, if you are using another frontend, this documentation might come in handy.

This example presupposes that you have created a mongoose model named Person.

### POST - C[reate]RUD

```javascript
HTTP method: POST

URL: /api/person

Request body:
{
  "name":"Annika Green",
  "age": 65,
  "towelColor": "black"
}

Creates a new person. You can also create several persons at once:

URL: /api/person

Request body:
[
  {
    "name":"Annie",
    "age": 30,
    "towelColor": "green"
  },
  {
    "name":"Xerxes",
    "age": 15,
    "towelColor": "xtra-black"
  }
]

The return value will be an JSON array with objects containing _id and __v properties:
[
  {
    "__v":0,
    "name":"Annie",
    "age":30,
    "towelColor":"green",
    "_id":"557c478c7174aca62e8bb84c"
  },
  {
    "__v":0,
    "name":"Xerxes",
    "age":15,
    "towelColor":"xtra-black",
    "_id":"557c478c7174aca62e8bb84d"
  }
]
```

### GET - CR[ead]UD

```javascript
HTTP method: GET

URL: /api/person
List all persons. JSON array.

URL: /api/person/557c4349779ef7d82cd8611a
Return a person with the id 557c4349779ef7d82cd8611a. JSON object.

URL: /api/person/{name:"Annie"}
Return all persons named Annie. JSON array.

URL: /api/person/{name:/an/i}
Return all persons with names starting with "an" (case insensitive). JSON array.

URL: /api/person/{age:{$gt:30}}
Return all persons that are older than 30 years. JSON array.

URL: /api/person/{_all:/green/i}
Return all persons with a name or towelColor that contains "green". JSON array
```

You can use any type of search object that you can define with mongoose/mongo. [Read up on a world of possibilites](http://docs.mongodb.org/manual/reference/operator/query/).

### UPDATE - CRU[pdate]D

```javascript
HTTP method: UPDATE

The following will update the name of the person with the id 557c4349779ef7d82cd8611a to Marcus.

URL: /api/person/557c4349779ef7d82cd8611a

Request body:
{
  "name": "Marcus"
}

The following will find all persons that have the word black in their towelColor and set their towelColor to pink.

URL: /api/person/{towelColor:/black/}

Request body: 
{
  "towelColor":"pink"
}

An update operation returns a JSON object:
{
  "ok": [0 = no, 1 = yes],
  "nModified": [numer of items modified],
  "n": [number of items found]
}
```

### DELETE - CRUD[elete]

```javascript
HTTP method: DELETE

URL: /api/person/557c4349779ef7d82cd8611a
Delete the person with the id 557c4349779ef7d82cd8611a.

URL: /api/person/{name:/^an/i}
Delete all persons with names starting with "an" (case insensitive).

A delete operation returns a JSON object:
{
  ok: [0 = no, 1 = yes]
  n: [number of items deleted]
}
```

## Integration with Angular.js

Mongresto will integrate beautifully with Angular.js (provided that you have followed the steps we described in the _Setup_ section).

You are ready to inject objects with the same names as your mongoose models in your controllers - mongresto has created them for you.

This example presupposes that you have created a mongoose model named Person.

```javascript
app.controller("homeController", ["$scope", "Person",
  function($scope,Person){

    // Create a new person
    Person.create({
      name:"Annika Green",
      age: 65,
      towelColor: "black"
    });

    // Get all persons (including the new one)
    $scope.allPersons = Person.get();

  }
]);
```

### Methods

The Person object above – and any object created by mongresto – have 6 methods:

**Person.create** (_{personProperties}_) – Creates a new person. (You can also send an array of objects to this method to create several persons at once.)

**Person.getById** (_"id"_) – Returns an object by id.

**Person.get** (_{searchObject}_) Returns an array of object that match the criterias of the (optional) search object. If no search object is provided all persons will be returned.

**Person.update** (_{searchObject}, {propertiesToUpdate_) Updates objects that match the criterias of the search object.

**Person.remove** (_{searchObject}_) Delete objects that match the criterias of the search object.

**Person.onQueueDone** (_[function]_) Wait for the mongresto engine to finish all pending db queries (not just the ones involving Person). Then run the function you have provided (once, this is not a permanent listener) – see the note below for details on async behavior.

You can use any type of search object that you can define with mongoose/mongo. [Read up on a world of possibilites](http://docs.mongodb.org/manual/reference/operator/query/).

### An import note on the asynchronous nature of mongresto

For your convenience mongresto aims to hide/mitigate its asynchronous nature as far as possible. However a call to the REST service (and the following lookup in MongoDB) doesn't happen at once. So when you call a method it will return an empty array (or object). When the answer has been fetched from the database the array (or object) will be populated with data.

This means that you can safely assign the result of calls to any method to a $scope variable directly and Angular.js will automatically update the view when the results are in.

On top of this mongresto creates a request queue that will wait for one result set before it asks the next question. This minimizes the need for using callbacks. It ensures that the creation, updates and removals of items you ask for before listing them will actually have time to complete, without the need for callbacks. (See our example above.)

#### Sometimes you will need callbacks

This is fine and dandy as long as you just want to present some data in a view. But if you need to process/grab data from one request before you make another request you will still need callbacks. You can always add a callback when you call a method, as your last parameter:

```javascript
Person.get({name:"Marc"},function(marcs){
  // now we have list of persons named Marc to work with
});
```

Cool! Now lets look at some detailed examples of using mongresto with Angular.js

## Create one person

Send an object to the create method...

### Code

```javascript
$scope.createOnePerson = Person.create({
  name:"Annika Green",
  age: 65,
  towelColor: "black"
});
```

### Result – $scope.createOnePerson

```javascript
[
  {
    "__v": 0,
    "name": "Annika Green",
    "age": 65,
    "towelColor": "black",
    "_id": "557dd7cf8ba8b4a7f53d5523"
  }
]
```

## Create two persons

Send an array to the create method...

### Code

```javascript
$scope.createTwoPersons = Person.create([
  {
    name:"Annie",
    age: 30,
    towelColor: "green"
  },
  {
    name:"Xerxes",
    age: 15,
    towelColor: "xtra-black"
  }
]);
```

### Result – $scope.createTwoPersons

```javascript
[
  {
    "__v": 0,
    "name": "Annie",
    "age": 30,
    "towelColor": "green",
    "_id": "557dd7cf8ba8b4a7f53d5524"
  },
  {
    "__v": 0,
    "name": "Xerxes",
    "age": 15,
    "towelColor": "xtra-black",
    "_id": "557dd7cf8ba8b4a7f53d5525"
  }
]
```

## Get a person by id

Get a person by id. Returns an object (not an array).

### Code

```javascript
var previoslyStoredId = "557dd7cf8ba8b4a7f53d5523";
$scope.getAPersonById = Person.getById(previouslyStoredId);
```

### Result – $scope.getAPersonById

```javascript
{
  "_id": "557dd7cf8ba8b4a7f53d5523",
  "name": "Annika Green",
  "age": 65,
  "towelColor": "black",
  "__v": 0
}
```

## Get all persons

Get without any conditions.

### Code

```javascript
$scope.getAllPersons = Person.get();
```

### Result – $scope.getAllPersons

```javascript
[
  {
    "_id": "557dd7cf8ba8b4a7f53d5523",
    "name": "Annika Green",
    "age": 65,
    "towelColor": "black",
    "__v": 0
  },
  {
    "_id": "557dd7cf8ba8b4a7f53d5524",
    "name": "Annie",
    "age": 30,
    "towelColor": "green",
    "__v": 0
  },
  {
    "_id": "557dd7cf8ba8b4a7f53d5525",
    "name": "Xerxes",
    "age": 15,
    "towelColor": "xtra-black",
    "__v": 0
  }
]
```

## Get all persons below 35

Get using a comparison operator.

### Code

```javascript
$scope.getAllPersonsBelow35 = Person.get({age:{$lt:35}});
```

### Result – $scope.getAllPersonsBelow35

```javascript
[
  {
    "_id": "557dd7cf8ba8b4a7f53d5524",
    "name": "Annie",
    "age": 30,
    "towelColor": "green",
    "__v": 0
  },
  {
    "_id": "557dd7cf8ba8b4a7f53d5525",
    "name": "Xerxes",
    "age": 15,
    "towelColor": "xtra-black",
    "__v": 0
  }
]
```

## Get green - using _all for a "fulltext search"

Use regexps to get all persons that have the word green (case insensitive) in any string property. The property _all is "magic" and lets us search all strings in an object/document. But you can use reg exps when searching any normal property as well.

### Code

```javascript
$scope.getGreen = Person.get({_all:/green/i});
```

### Result – $scope.getGreen

```javascript
[
  {
    "_id": "557dd7cf8ba8b4a7f53d5523",
    "name": "Annika Green",
    "age": 65,
    "towelColor": "black",
    "__v": 0
  },
  {
    "_id": "557dd7cf8ba8b4a7f53d5524",
    "name": "Annie",
    "age": 30,
    "towelColor": "green",
    "__v": 0
  }
]
```

## Update all black towels to pink

When we update something we only get a "report" back - number of found documents and how many of them that were updated (didn't have the new values already).

### Code for update

```javascript
$scope.updateToPinkResult = Person.update({towelColor:/black/},{towelColor:"pink"});
```

### Result – $scope.updateToPinkResult

```javascript
{
  "ok": 1,
  "nModified": 2,
  "n": 2
}
```

### Persons with pink towels

But straight after this we can make a new get to see our changes.

```javascript
$scope.personsWithPinkTowels = Person.get({towelColor:/pink/});
```

### Result – $scope.personsWithPinkTowels

```javascript
[
  {
    "_id": "557dd7cf8ba8b4a7f53d5523",
    "name": "Annika Green",
    "age": 65,
    "towelColor": "pink",
    "__v": 0
  },
  {
    "_id": "557dd7cf8ba8b4a7f53d5525",
    "name": "Xerxes",
    "age": 15,
    "towelColor": "pink",
    "__v": 0
  }
]
```

## Populating relations - using _relate & _populate for "joins"

Mongresto supports relations via [the populate method of mongoose](http://mongoosejs.com/docs/populate.html).

Suppose with have authors that write stories. Each story is written by an author, and each author can write many stories.

We decide to create two mongoose Models for this. We want to story id references to the author in each story, and id references to stories in each author.

### The author model

```javascript
module.exports = function(mongoose){

  // Create a new mongoose schema 
  // with properties
  var AuthorSchema = mongoose.Schema({
    name: String,
    // Note: This tells mongoose that we are dealing with a relation
    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Story' }]
  });

  // Create a model from the schema
  var Author = mongoose.model("Author",AuthorSchema);

  // Return the model
  return Author;

};
```

### The story model

```javascript
module.exports = function(mongoose){

  // Create a new mongoose schema 
  // with properties
  var StorySchema = mongoose.Schema({
    title: String,
    content: String,
    // Note: This tells mongoose that we are dealing with a relation
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' }
  });

  // Create a model from the schema
  var Story = mongoose.model("Story",StorySchema);

  // Return the model
  return Story;

};
```

### In your controller - create an author & two stories and relate them

In our controller we create an author and two stories. We then connect them on _id level using in a special form of update with the magic property **_relate** - see the code below for details.

```javascript
// Create an author and remember his _id
var authorId, theAuthor = Author.create({
  name: "Raymond Cool"
},function(x){authorId = x[0]._id;});

// Create some stories
var theStories = Story.create([
  {
    title: "The long road",
    content: "The long road was dark."
  },
  {
    title: "The short road",
    content: "The short road was long."
  }
]);

// Relate the stories to the author and the author to the stories
Author.update({_relate:{items:theAuthor,stories:theStories}});
Story.update({_relate:{items:theStories,author:theAuthor}});

// After the update they have an _id based connection
$scope.authors = Author.get({_id:authorId});
$scope.stories = Story.get({author:authorId});
```

Here are our results so far (and this is the way our items are stored in the database):

#### $scope.authors

```javascript
[
  {
    "_id": "557dd7cf8ba8b4a7f53d5526",
    "name": "Raymond Cool",
    "__v": 0,
    "stories": [
      "557dd7cf8ba8b4a7f53d5527",
      "557dd7cf8ba8b4a7f53d5528"
    ]
  }
]
```

#### $scope.stories

```javascript
[
  {
    "_id": "557dd7cf8ba8b4a7f53d5527",
    "title": "The long road",
    "content": "The long road was dark.",
    "__v": 0,
    "author": "557dd7cf8ba8b4a7f53d5526"
  },
  {
    "_id": "557dd7cf8ba8b4a7f53d5528",
    "title": "The short road",
    "content": "The short road was long.",
    "__v": 0,
    "author": "557dd7cf8ba8b4a7f53d5526"
  }
]
```

### Get some populated results back

Now we will ask mongresto to populate the author with stories, ans the stories with the author - thus replacing the "foreign keys" with the corresponding objects from the database. To do this we use the "magic" property **_populate** in our search object.

The **_populate** property should be a string containing the name of the property you want to populate. (If you need to populate several properties just separate them with spaces in this string.)

```javascript
// Populate the author with stories and the stories with the author
$scope.authorsPopulated = Author.get({_id:authorId,_populate:"stories"});
$scope.storiesPopulated = Story.get({author:authorId,_populate:"author"});
```

Here you can see the results:

#### $scope.authorsPopulated

```javascript
[
  {
    "_id": "557dd7cf8ba8b4a7f53d5526",
    "name": "Raymond Cool",
    "__v": 0,
    "stories": [
      {
        "_id": "557dd7cf8ba8b4a7f53d5527",
        "title": "The long road",
        "content": "The long road was dark.",
        "__v": 0,
        "author": "557dd7cf8ba8b4a7f53d5526"
      },
      {
        "_id": "557dd7cf8ba8b4a7f53d5528",
        "title": "The short road",
        "content": "The short road was long.",
        "__v": 0,
        "author": "557dd7cf8ba8b4a7f53d5526"
      }
    ]
  }
]
```

#### $scope.storiesPopulated

```javascript
[
  {
    "_id": "557dd7cf8ba8b4a7f53d5527",
    "title": "The long road",
    "content": "The long road was dark.",
    "__v": 0,
    "author": {
      "_id": "557dd7cf8ba8b4a7f53d5526",
      "name": "Raymond Cool",
      "__v": 0,
      "stories": [
        "557dd7cf8ba8b4a7f53d5527",
        "557dd7cf8ba8b4a7f53d5528"
      ]
    }
  },
  {
    "_id": "557dd7cf8ba8b4a7f53d5528",
    "title": "The short road",
    "content": "The short road was long.",
    "__v": 0,
    "author": {
      "_id": "557dd7cf8ba8b4a7f53d5526",
      "name": "Raymond Cool",
      "__v": 0,
      "stories": [
        "557dd7cf8ba8b4a7f53d5527",
        "557dd7cf8ba8b4a7f53d5528"
      ]
    }
  }
]
```

## Sorting, skipping and limiting
Suppose that we have the following Mongoose model:

```javascript
module.exports = function(mongoose){

  // Create a new mongoose schema
  var AnimalSchema = mongoose.Schema({
    name: {type: String, required: true}
    species: {type: String, required: true},
    description: String
  });

  // Return the model
  return mongoose.model("Animal", AnimalSchema);
};
```
In *Mongoose* the syntax for sorting, skipping and limiting has changed a lot between versions. However current syntax follows MongoDB closely. Thus the following **backend code for Mongoose** would find all rabbits, sort them by name, skip the first 10 documents and deliver the next 5:

```javascript
// PLEASE NOTE: This is Mongoose code, NOT Mongresto code
Animal.find({species:"rabbit"})
  .sort({name: 1})
  .skip(10)
  .limit(5)
  .exec(function(err,result,errCode){
    var someRabbits = result;
    console.log(someRabbits);
  });
```

The same code using Mongresto in Angular would look like this:
```javascript
$scope.someRabbits = Animal.get({
  species: "rabbit",
  _sort: {name: 1},
  _skip: 10,
  _limit: 5
});
```

Note that it is important in what order you write your properties. Here the result will first be sorted, then a number of documents skipped and lastly the result will be limited to 5 documents.

(You can actually use *Mongresto* to call any *Mongoose* function - like *sort*, *skip*, *limit* etc - by creating a property with the Mongoose-function name prefixed with "_".)