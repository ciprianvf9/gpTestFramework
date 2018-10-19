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

//- delete successfully one of them and assert that the response code is correct
// there is a delay when deleting a folder so we need to wait a bit
console.log("___________________TEST IS STARTING_________________________");

let removeRepos={
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
        removeRepos.loggerBucket.push({"auth":"Authentication verification","passed":"true"});


              console.log("_______________REMOVE FIRST REPO_______________");
              removeRepos.removeRepo('repo1').then(function (response) {
                removeRepos.exportResults(removeRepos.loggerBucket);
              });

      })
      .catch(function (error) {
        removeRepos.loggerBucket.push({"auth":"Authentication verification ","passed":"false"});

        try {           
           assert.notEqual(error.response.status, "404", "404-Not found");                      
        } catch (e) {
              if (e instanceof AssertionError)     {                
                removeRepos.loggerBucket.push({"AssertFail":e,
                                               "message":"Authentication verification ",
                                               "passed":"false"});
              }    
        }
      })
  },
  removeRepo:function(repoName){
    return axios.delete('https://api.github.com/repos/'+gitCredentials.username+'/'+repoName+'?access_token='+gitCredentials.token)
      .then(function (response) {
        try {           
           assert.equal(response.status, 204, "Your repo "+repoName+" has been removed");             
        } catch (e) {
              if (e instanceof AssertionError)     {                
                removeRepos.loggerBucket.push({"AssertFail":e,
                                               "message":"Your repo "+repoName+" has been removed",
                                               "passed":"false"});
              }    
        }
        console.log("Your repo "+repoName+" has been removed ");
        removeRepos.loggerBucket.push({"removeRepo":"Your repo "+repoName+" has been removed", "passed":"true"});

      return;
      })
      .catch(function (error) {
        try {           
           assert.notEqual(error.response.status, "404", "Your repo does not exists");         
        } catch (e) {
              if (e instanceof AssertionError)     {                
                removeRepos.loggerBucket.push({"AssertFail":e,
                                               "message":"Your repo does not exists",
                                               "passed":"false"});
              }    
        }
        console.log("Your repo "+repoName+" has not been removed");
        removeRepos.loggerBucket.push({"removeRepo":"Your repo "+repoName+" has not been removed", "passed":"false"});

      return;
      });
  },
  loggerBucket:[],
  sleep:function (millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
  },
  exportResults:function(data){
    // writeFile function with filename, content and callback function
    fs.writeFile('./reports/removeRepos Report.json', JSON.stringify(data), function (err) {
      if (err) throw err;
      console.log('_________________Report has been exported successfully!_______________________');
    });
  }

};





removeRepos.sleep(3000).then(function(response){
  removeRepos.validateAuthByToken();
})