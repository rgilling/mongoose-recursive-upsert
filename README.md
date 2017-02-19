## Plugin Overview

Adds a recursive upsert capability to a mongoose model.

The capability is enabled as a mongoose plugin, and can be used as a static method against the schema.


### Motivation
While you can use `findOneAndUpdate` with the `upsert` option, unfortunately it doesn't trigger mongoose Middleware.

I created the plugin because upsert is something I use a lot, but I rely heavily on Mongoose middleware for things like generating short id's, generating the virtual id field, generating other virtual fields etc. 

Note this performs 2 separate, non-atomic DB operations:
1. `findOne` to retrieve the document.
2. Separately `saves` to update or create the document.

### Installation

`npm install mongoose-recursive-upsert`

### To use

First set up the plugin on your schema. Refer to the mongoose instructions how to do this.

```javascript
const mongooseRecursiveUpsert = require('mongoose-recursive-upsert');

const MySchema = new Schema({...});

MySchema.plugin(mongooseRecursiveUpsert);

```

Alternatively set it up for all schemas

```javascrupot 
const mongooseRecursiveUpsert = require('mongoose-recursive-upsert')
const mongoose = require('mongoose');

mongoose.plugin(mongooseRecursiveUpsert);

```

With the plugin set up you can now use upsert static method set up on your Schema. The method returns a Mongoose Promise. Refer to the Mongoose documentation for setting up an alternative promise library.


``` javascript 
const Model = mongoose.model('MyModel');
const newObject = {title: 'hello world'};
Model.upsert({_id: newObject.id}, newObject)
  .then((object) => {
    console.log('saved object');
  })
```

Or an existing object: 

``` javascript 
const Model = mongoose.model('MyModel');

const update = {
    _id: '12345'
    title: 'Update'
}

Model.upsert({_id: update._id}, update)
  .then((updatedDoc) => {
    // here is the document
  })
  .catch((err) => {
    // handle any save errors here
  });

```

Note you do not need to use id for the query, as long as it resolves a single document any query will be fine. The query is passed verbatim to Mongoose's `findOne` query.



`e.g.  Model.upsert({'identifier': 'UniqueIdent'}, upsertDoc); // will work `

### Change Log

**Version 0.8 (19/2/2017)**
- Initial Release
- Tested Version 4

### Dependencies

Dependency | Description
----------- | ---------------------
Lodash | Used for iterating and merging the object properties.
Mongoose | Required as a peer dependency. Tested with v4 of Mongoose.

### Testing and Development
Unit test dependencies:

1. Mongoose
2. Should.js
3. Mocha
4. MongoDB

Set up `./conf.js` with your Mongo details. 

Run `npm test` or `mocha ./tests/upsert.tests.js` directly.

Need changes? Submit an issue or better yet a pull-request on the Github repository: 


### License
MIT License










