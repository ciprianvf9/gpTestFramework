var express = require('express');
var router = express.Router();
var http = require('http');

var assert = require('assert');
const AssertionError = require('assert').AssertionError;

var axios= require('axios');

var fs = require('fs');

var gitCredentials={
    username:"ciprianvf9",
    password:"Fcv10951070",
    token:"ToBeGenerated",
    token_id:"ToBeRetreived"
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
                  removeRepos.removeToken();
              });

      })
      .catch(function (error) {
        console.log("Auth failed! Please check the report");
        removeRepos.loggerBucket.push({"auth":"Authentication verification ","passed":"false"});
        try {           
           assert.notEqual(error.response.status, "401", "Unauthorized");                      
        } catch (e) {
              if (e instanceof AssertionError)     {                
                removeRepos.loggerBucket.push({"AssertFail":e,
                                               "message":"Authentication verification ",
                                               "passed":"false"});
              }    
        }
        removeRepos.exportResults(removeRepos.loggerBucket);

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
  },
  createToken:function(){
    axios({
          method: 'POST',
          url: "https://api.github.com/authorizations",
          data: {
            "scopes": [
            "public_repo",
            "delete_repo"
          ],
          "note": "goProToken"
          },
          withCredentials: true,
          auth: {
            username: gitCredentials.username,
            password: gitCredentials.password
          },
        })
      .then(function (response) {
        console.log("GENERATING NEW TOKEN");
          gitCredentials.token=response.data.token;
          gitCredentials.token_id=response.data.id;
      }).catch(function (error) {
        // console.log(error);
      });
  },
  removeToken:function(){
    axios({
          method: 'DELETE',
          url: "https://api.github.com/authorizations/"+gitCredentials.token_id,
          withCredentials: true,
          auth: {
            username: gitCredentials.username,
            password: gitCredentials.password
          },
        })
      .then(function (response) {
        console.log("REMOVING TOKEN");
          gitCredentials.token=response.data.token;
          gitCredentials.token_id=response.data.id;

      }).catch(function (error) {
      // console.log(error);
      });
  }
};




removeRepos.createToken();
removeRepos.sleep(3000).then(function(response){
  removeRepos.validateAuthByToken();
})
