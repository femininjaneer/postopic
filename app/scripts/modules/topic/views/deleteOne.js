define([
  /* Libraries */
  'backbone',
  /* Templates */
  'hbs!modules/topic/templates/deleteOne'
],

function(Backbone, DeleteOneTemplate){
  'use strict';
  /*
   * Returns a Marionette.ItemView with a template.
   * 
   * [https://github.com/marionettejs/backbone.marionette/blob/master/docs/marionette.itemview.md]
   */
  return Backbone.Marionette.ItemView.extend({
    template: DeleteOneTemplate
  });
});
