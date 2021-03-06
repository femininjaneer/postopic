/******************************************************************************
 *
 * Topic routes - Holds all routes that begin with /topics
 * 
 * create      | POST   '/api/topics'          | creates a new topic
 * all         | GET    '/api/topics'          | displays all topic
 * slug        | GET    '/api/topics/:slug'    | displays a specific topic
 * all.del     | DELETE '/api/topics'          | deletes all topics
 * slug.del    | DELETE '/api/topics/:slug'    | deletes this specific topic
 * slug.update | PUT    '/api/topics/:slug'    | updates a specific topic
 * 
 *****************************************************************************/

module.exports.create = function(data) {
  /* Set up variables */
  var slug = data.helper.slug;
  
  /* Return a request/response function */
  return function(req, res){
    console.log('\nHttp Method:   POST \nRoute:         /topics/ \nAction:        Creates a new topic');
    data.req = req;
    data.res = res;
    addUniqueSlug(data, slug((req.body.name).toLowerCase(), '_'), 0);
  };
};

function addUniqueSlug(data, slug, number){
  var Topic = data.database.model.topic;
  var testSlug;
  
  if(number === 0){
    testSlug = slug;
  } else {
    testSlug = slug + number;
  }
  
  console.log("Add Unique Slug: Test Slug: " + testSlug);
  
  Topic.findOne({slug: testSlug}).exec(function(err, topicResult){
    /* Error handling */
    if(err){
      console.log('There was an error finding a topic associated with this slug: \n' + err);
      res.json({
        error: 'There was an error finding a topic associated with this slug.',
        errorMessage: err
      });
    } else {
      if(topicResult === null){
        saveTopic(data, testSlug);
      }
      else {
        addUniqueSlug(data, slug, number+1);
      }
    }
  });
}

function saveTopic(data, slug){
  var Topic = data.database.model.topic;
  var req = data.req;
  var res = data.res;
  
  console.log("Save Post: Slug: " + slug);
  
  var topic = new Topic({
    name: req.body.name,
    slug: slug,
    author: req.body.author,
    dateCreated: Date.now(),
    dateUpdated: Date.now()
  });
  
  topic.save(function (err, newTopic) {
    
    /* Error handling */
    if(err) {
      console.log('There was an error saving this new topic to the database:\n' + err);
      res.json({
        error: 'There was an error saving this new topic to the database.',
        errorMessage: err
      });
    }
    newTopic.onCreate();
    res.json(newTopic);
  });
}

module.exports.all = function(data) {

  /* Set up variables */
  var Post = data.database.model.post;
  var Topic = data.database.model.topic;
  var async = data.helper.async;
  var limit = 2;
  
  return function(req, res){
    console.log('\nHttp Method:   GET \nRoute:         /topics \nAction:        Shows all topics');
    var offset = req.params.page * limit - 1;
    
    Topic.find().sort({date: 'desc'}).exec(function(err, results){
      
      /* Error handling */
      if(err){
        console.log('There was an error finding all posts:' + err);
        res.json({
          error: 'There was an error finding all posts.',
          errorMessage: err
        });
        return;
      } else{
        async.map(
          results, 
          function(item, callback){
            Post.find({topicId: item._id}).exec(function(err, posts){
              
              /* Error handling */
              if(err){
                console.log('There was an error finding a topic with the ID ' + item.topicId + ':\n' + err);
                res.json({
                  error: 'There was an error finding a topic with the ID: ' + item.topicId,
                  errorMessage: err
                });
              } else{
                var result = {
                  topic: item,
                  posts: posts
                };
                return callback(null, result);
              }
            });
          }, 
          function(err, results){
            
            /* Error handling */
            if(err){
              console.log('There was an error mapping posts to their topics:\n' + err);
              res.json({
                error: 'There was an error mapping posts to their topics',
                errorMessage: err
              });
            } else{
              console.log('Found ' + results.length + ' topics and the amount of posts that belong to them.');
              returnValue = {
                topics: results.splice(offset, limit),
                numberOfPages: results.length / limit
              };
              res.json(returnValue);
            }
          }
        );
      }
    });
  };
};

module.exports.slug = function(data) {

  /* Set up variables */
  var Post = data.database.model.post;
  var Topic = data.database.model.topic;
  var async = data.helper.async;
  return function(req, res){
    console.log('\nHttp Method:   GET \nRoute:         /topics/' + req.params.slug + ' \nAction:        Shows one topic');
    
    Topic.find({slug: req.params.slug}).exec(function(err, topic){
      
      console.log(topic);
      /* Error handling */
      if(err){
        console.log('There was an error finding a topic with this slug:' + err);
        res.json({
          error: 'There was an error finding a topic with this slug.',
          errorMessage: err
        });
      } else{
        Post.find({topicId: topic._id}).exec(function(err, posts){
          /* Error handling */
          if(err){
            console.log('There was an error finding posts with the topicId ' + topic._id + ':\n' + err);
            res.json({
              error: 'There was an error finding posts with the topicId ' + topic._id ,
              errorMessage: err
            });
          } else{
            res.json({
              topic: topic,
              posts: posts
            });
          }
        });
      }
    });
  };
};

module.exports.all.del = function(data) {

  /* Set up variables */
  var Post = data.database.model.post;
  var Topic = data.database.model.topic;
  var async = data.helper.async;
  return function(req, res){
    console.log('\nHttp Method:   DELETE \nRoute:         /topics \nAction:        Deletes all topics');
    async.parallel([
      function(callback){
        Topic.find({}, null, {}, callback);
      },
      function(callback){
        Post.find({}, null, {}, callback);
      }
    ], 
    function(err, results){
      var topics = results[0];
      var posts = results[1];
      
      /* Error handling */
      if(err){
        console.log('There was an error getting all topics and/or all posts: ' + err);
        res.json({
          error: 'There was an error getting all topics and/or all posts.',
          errorMessage: err
        });
      } else{
        if(topics === undefined){
          console.log('There are no topics to delete.');
          res.json({
            error: 'There are no topics to delete.',
            errorMessage: 'There are no topics to delete.'
          });
        } else{
          console.log('Deleting ' + topics.length + ' topics and ' + posts.length + ' posts.');
          topics.forEach(function(topic){
            topic.remove();
          });
          posts.forEach(function(post){
            post.remove();
          });
          res.json({});
        }
      }
    });
  };
};

module.exports.slug.del = function(data) {

  /* Set up variables */
  var Post = data.database.model.post;
  var Topic = data.database.model.topic;
  var async = data.helper.async;
  return function(req, res){
    console.log('\nHttp Method:   DELETE \nRoute:         /topics/' + req.params.slug + ' \nAction:        Deletes one topic');

    Topic.find({slug: req.params.slug}).exec(function(err, topic){
      
      /* Error handling */
      if(err){
        console.log('There was an error finding this topic:' + err);
        res.json({
          error: 'There was an error finding a topic associated with this slug',
          errorMessage: err
        });
      } else{
        Post.find({topicId: topic._id}).exec(function(err, posts){
          /* Error handling */
          if(err){
            console.log('There was an error finding posts for the topic with the ID ' + topic._id + ':\n' + err);
            res.json({
              error: 'There was an error finding posts for the topic with the ID ' + topic._id,
              errorMessage: err
            });
          } else{
            console.log('Deleting the topic' + topic.name + ' and its ' + posts.length + ' posts.');
            topic[0].remove();
            posts.forEach(function(post){
              post.remove();
            });
            res.json({});
          }
        });
      }
    });
  };
};

module.exports.slug.update = function(data) {

  /* Set up variables */
  var Post = data.database.model.post;
  var Topic = data.database.model.topic;
  var async = data.helper.async;
  return function(req, res){
    console.log('\nHttp Method:   PUT \nRoute:         /topics/' + req.params.slug + ' \nAction:        Updates one topic');
    var topic = {
      name: req.body.name,
      author: req.body.author,
      dateUpdated: Date.now()
    };
    console.log('Updating the topic with the slug: ' + req.params.slug);
    Topic.update({slug: req.params.slug}, { $set: topic}).exec();
    res.json({});
  };
};
