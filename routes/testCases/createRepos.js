var express = require('express');
var router = express.Router();
var http = require('http');

var assert = require('assert');
const AssertionError = require('assert').AssertionError;

var axios= require('axios');

var fs = require('fs');

var gitCredentials={
    username:"ciprianvf9",
    token:"c9134ca9e2056bd4bcf7d9742d390cced8a0cdf3"
  };

var proxy_settings={
    host: 'web-proxy.atl.hp.com',
    port: '8088'
}

// - successfully create 3 distinct repositories and assert that the response code is correct
console.log("___________________TEST IS STARTING_________________________");

let createRepos={
  validateAuthByToken:function(){

    axios.get('https://api.github.com?access_token='+gitCredentials.token,{
      /*proxy:proxy_settings,
      withCredentials: true,
      auth:{
        username:gitCredentials.username,
        password:gitCredentials.password
      }*/

    })
      .then(function (response) {

        console.log("_______________AUTH OK_______________");
        createRepos.loggerBucket.push({"auth":"Authentication verification","passed":"true"});

        console.log("_______________CREATING FIRST REPO_______________");
        createRepos.createRepo("repo1").then(function (response) {

          console.log("_______________CREATING SECOND REPO_______________");
          createRepos.createRepo("repo2").then(function (response) {

            console.log("_______________CREATING THIRD REPO_______________");
            createRepos.createRepo("repo3").then(function (response) {
              createRepos.exportResults(createRepos.loggerBucket);              
            });

          });

        });

      })
      .catch(function (error) {
        createRepos.loggerBucket.push({"auth":"Authentication verification ","passed":"false"});

        try {           
           assert.notEqual(error.response.status, "404", "404-Not found");                      
        } catch (e) {
              if (e instanceof AssertionError)     {                
                createRepos.loggerBucket.push({"AssertFail":e,
                                               "message":"Authentication verification ",
                                               "passed":"false"});
              }    
        }

      })
  },
  createRepo:function(repoName){
    return axios.post('https://api.github.com/user/repos?access_token='+gitCredentials.token,
        {
          'name':repoName
        },{
          headers: {
               'content-type': 'application/json',
          }
      })
      .then(function (response) {
        console.log("Your repo "+repoName+" has been created");
        try {           
             assert.equal(response.status, 201, "Your repo "+repoName+" has not been created");                  
        } catch (e) {
              if (e instanceof AssertionError)     {                
                createRepos.loggerBucket.push({"AssertFail":e,
                                               "message":"Your repo "+repoName+" has not been created",
                                               "passed":"false"});
              }    
        }
        createRepos.loggerBucket.push({"createRepo":"Your repo "+repoName+" has been created", "passed":"true"});
      return;
      })
      .catch(function (error) {
        console.log("Your repo "+repoName+" has not been created");
        createRepos.loggerBucket.push({"createRepo":"Your repo "+repoName+" has not been created", "passed":"false"});
        try {           
             assert.notEqual(error.response.status, "422", "Your repo already exists");             
        } catch (e) {
              if (e instanceof AssertionError)     {                
                createRepos.loggerBucket.push({"AssertFail":e,
                                               "message":"Your repo already exists",
                                               "passed":"false"});
              }    
        }
      return;
      });
  },
  loggerBucket:[],
  sleep:function (millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
  },
  exportResults:function(data){
    // writeFile function with filename, content and callback function
    fs.writeFile('./reports/createRepos Report.json', JSON.stringify(data), function (err) {
      if (err) throw err;
      console.log('_________________Report has been exported successfully!_______________________');
    });
  }

};


createRepos.validateAuthByToken();
