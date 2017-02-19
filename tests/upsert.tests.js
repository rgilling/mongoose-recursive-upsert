const mongoose = require('mongoose');
const _ = require('lodash');
const should = require('should');
const shortid = require('shortid');

const Schema = mongoose.Schema;

require('./conf');

const UserSchema = new Schema({
  _id: {
    type: String,
    default: shortid.generate
  },
  firstName: {
    type: 'string',
    required: true
  },
  lastName: {
    type: 'string',
    required: true
  },
  email: {
    type: 'string',
    required: true
  },
  roles: {
    type: ['string'],
    required: true
  }
});

UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

const MediaSchema = new Schema({
  _id: {
    type: String,
    default: shortid.generate
  },
  title: {
    type: 'string'
  },
  altText: {
    type: 'string'
  },
  url: {
    scheme: {
      type: 'string',
      default: 'http'
    },
    path: 'string'
  }
});

const ContentSchema = new Schema({
  _id: {
    type: String,
    default: shortid.generate
  },
  identifier: {
    type: 'string'
  },
  title: 'string',
  subtitle: 'string',
  publishDate: {
    type: 'Date',
    default: new Date()
  },
  archiveDate: {
    type: 'Date'
  },
  media: {
    type: [MediaSchema]
  },
  author: UserSchema
});



const testContent = {
  identifier: 'identifier-001',
  title: 'Title 1',
  subtitle: 'Subtitle',
  media: [
    {
      title: 'Media title 1',
      altText: 'Alt text',
      url: {
        scheme: 'https',
        path: 'www.placehold.it/300x300'
      }
    },
    {
      title: 'Media title 2',
      altText: 'Alt text 2',
      url: {
        scheme: 'https',
        path: 'www.placehold.it/200x200'
      }
    },
    {
      title: 'Media title 3',
      altText: 'Alt text 3',
      url: {
        scheme: 'http',
        path: 'www.placehold.it/150x150'
      }
    }
  ],
  author: {
    firstName: 'Rich',
    lastName: 'Gilling',
    email: 'Richard.Gilling@gmail.com',
    roles: [
        'Administrator', 'User'
    ]
  }
};

const Content = mongoose.model('Content', ContentSchema);

const handleError = (err) => {
  if (err.errors){
    console.log(JSON.stringify(err.errors, null, 2));
  }
  console.error(err);
  throw (err);
};

// recursively compare left
const leftCompare = (expected, actual) => {
  _.forOwn(expected, (value, key) => {
    if (_.isObject(_.get(expected, key))){
      return leftCompare(_.get(expected, key), value);
    }

    should.equal(_.get(actual, key), value);
  });
};

describe ('Create test', () => {

  it ('should be able to create new content with upsert', () => {
    return Content.upsert({ identifier: testContent.identifier }, testContent)
        .then((savedDoc) => {
          // just check the compared values were added
          leftCompare(testContent, savedDoc.toObject());
          // check the virtuals
          should.equal(savedDoc.author.fullName, `${testContent.author.firstName} ${testContent.author.lastName}`);

          _.each(savedDoc.media, function(media) {
            should.exist(media.id, 'id not generated');
          });

          should.exist(savedDoc.author.id);

        })
        .catch(handleError)
  });

});

describe ('Update tests', () => {
  let existingContent;
  let query;
  let update;

  beforeEach(() => {
    return Content.remove({})
        .then(() => {
          return new Content(testContent).save()
        })
        .then((existingDoc) => {
          existingContent = existingDoc;
          query = { _id: existingContent.id };
          update = existingContent.toObject();
        })
  });

  it('should be able to update simple properties with upsert', () => {
    update.title = 'Title changed';
    update.identifier = 'Update identifier';

    return Content.upsert(query, update)
        .then((updatedDoc) => {
          should.equal(updatedDoc.id, existingContent.id, 'Id should not change');
          should.equal(updatedDoc.title, update.title, 'Title should be updated');
          should.equal(updatedDoc.identifier, update.identifier, 'Identifier should be updated');
          return Content.count({});
        }).then((count) => count.should.equal(1))
        .catch(handleError);
  });

  it('should update nested object and regenerate virtuals', () => {
    update.author.firstName = 'Bob';
    update.author.lastName = 'Marley';
    update.author.email = 'Bob.Marley@mailinator.com';

    return Content.upsert(query, update)
        .then((updatedDoc) => {
          should.equal(updatedDoc.id, existingContent.id, 'Id should not change');
          should.equal(updatedDoc.author.firstName, update.author.firstName, 'Author should be updated');
          should.equal(updatedDoc.author.fullName, `${update.author.firstName} ${update.author.lastName}`);
          should.equal(existingContent.author.id, updatedDoc.author.id, 'Nested id should not change');
        })
        .catch(handleError);
  });

  it('should merge nested object array properties', () => {
    update.media[0].title = 'New Media title';
    update.media[2].title = 'Hello World';

    return Content.upsert(query, update)
        .then((updatedDoc) => {
          should.equal(updatedDoc.media[0].id, existingContent.media[0].id, 'Media id should not change');
          should.equal(updatedDoc.media[2].id, existingContent.media[2].id, 'Media id should not change');
          should.equal(updatedDoc.media[0].title, update.media[0].title, 'Title should be updated');
          should.equal(updatedDoc.media[2].title, update.media[2].title, 'Title should be updated');
        })
        .catch(handleError);
  });

  // note it requires the id be passed with the nested object updates
  it('should be able to add a new object to the existing array at position 0', () => {
    const newMedia = [{
      title: 'Brand new media',
      altText: 'Alt text',
      url: {
        scheme: 'http',
        path: 'www.placehold.it/200x250'
      }
    }];

    // add a new item to front of array
    update.media = [...newMedia, ...update.media];

    return Content.upsert(query, update)
        .then((updatedDoc) => {
          should.equal(updatedDoc.media[1].id, existingContent.media[0].id, 'Document should be moved');
          leftCompare(update.media[0], updatedDoc.media[0]);
        })
        .catch(handleError);
  });

  it('should be able to update nested primitive array', () => {
    update.author.roles = ["new", "role"];
    return Content.upsert(query, update)
        .then((updatedDoc) => {
          updatedDoc.author.roles.toObject().should.eql(update.author.roles, 'Primitive properties should be replaced');
        })
        .catch(handleError);
  });

});

