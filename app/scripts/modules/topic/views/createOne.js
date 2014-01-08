define([
  'backbone',
  'hbs!modules/topic/templates/createOne'
],

function(Backbone, CreateOneTemplate){
  'use strict';
  return Backbone.Marionette.ItemView.extend({
    template: CreateOneTemplate
  });
});
