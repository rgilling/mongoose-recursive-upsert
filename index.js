const _ = require('lodash');

module.exports = exports = upsertPlugin = (Schema) => {
  const id = this._id;

  /**
   * Performs the merge of source and destination.
   *
   * @param src {Object} The source object should be a basic JSON object
   * @param dest {Object} Mongoose object to merge properties to
   *
   * @returns {Object} Returns the mutated object
   *
   * @private
   */
  const _upsertObject = (src, dest) => {
    function recursiveFunc(src, dest) {
      _.forOwn(src, function (value, key) {
        if (_.isObject(value) && _.keys(value).length !== 0) {
          if (dest[key] && dest[key]._id) {
            dest[key] = (src[key].id !== dest[key].toString() && dest[key]) ? dest[key] : {};
          }else{
            dest[key] = dest[key] || {};
          }
          recursiveFunc(src[key], dest[key])
        } else {
          dest[key] = value;
        }
      });
    }

    recursiveFunc(src, dest);

    return dest;
  };

  /**
   * Adds a capability to upsert an object to mongoose static methods
   * To use call with a query that returns a single object or none (i.e. findOne)
   * If the query supports.
   *
   * @param query {Object} Mongoose query to resolve the object, should resolve a single object (i.e. findOne)
   * @param newObject {Object} The object to merge.
   *
   * @returns  a Promise that resolves to the saved object.
   **/
  Schema.statics.upsert = function (query, newObject) {
    const Model = this;

    return Model.findOne(query)
        .then((existingObj) => {
          let obj;
          if (existingObj) {
            _upsertObject(newObject, existingObj);
            return existingObj.save();
          } else {
            return new Model(newObject).save();
          }
        });
  }
};
