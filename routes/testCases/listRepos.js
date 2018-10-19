var express = require('express');
var router = express.Router();
var http = require('http');

var assert = require('assert');
const AssertionError = require('assert').AssertionError;

var axios= require('axios');

var fs = require('fs');

var gitCredentials={
    username:"ciprianvf9",
    token:"9d8892ffc1caf7d8da462f53ed4cdae55d7e1cfc"
  };

var proxy_settings={
    host: 'web-proxy.atl.hp.com',
    port: '8088'
};

console.log("___________________TEST IS STARTING_________________________");

let listRepos={
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

        listRepos.loggerBucket.push({"auth":"Authentication verification","passed":"true"});

        /*We need a delay in case this test is executed immediately after delteRepo test*/
        listRepos.sleep(3000).then(function(response){
          listRepos.listRepo().then(function(response){
            listRepos.exportResults(listRepos.loggerBucket);

          })
        })

      })
      .catch(function (error) {
        console.log("Auth failed! Please check the report");
        listRepos.loggerBucket.push({"auth":"Authentication verification ","passed":"false"});
        try {           
           assert.notEqual(error.response.status, "401", "Unauthorized");                      
        } catch (e) {
              if (e instanceof AssertionError)     {                
                listRepos.loggerBucket.push({"AssertFail":e,
                                               "message":"Authentication verification ",
                                               "passed":"false"});
              }    
        }
        listRepos.exportResults(listRepos.loggerBucket);

      })


  },
  listRepo:function(){
    return axios.get('http://api.github.com/user/repos'+'?access_token='+gitCredentials.token)
      .then(function (response) {

        // - list the remaining repositories and assert the response code is correct,
        try {           
             assert.equal(response.status, 200, "Your repos could not be listed");                    
        } catch (e) {
              if (e instanceof AssertionError)     {                
                listRepos.loggerBucket.push({"AssertFail":e,
                                             "message":"Your repos could not be listed" ,
                                             "passed":"false"});
                console.log("Your repos could not be listed");
              }            
        }

        //assert that the 2 remaining repositories are still present  - it's 3 instead of 2 because we have the repo with the code      
        try {           
          assert.equal(Object.keys(response.data).length,3, "The remaining two repositories are not in place!");                          
        } catch (e) {
              if (e instanceof AssertionError)     {                
                listRepos.loggerBucket.push({"AssertFail":e,
                                             "message":"The remaining two repositories are not in place" ,
                                             "passed":"false"});
                console.log("The remaining two repositories are not in place");
              }            
        }
        console.log("Your repos have been listed ");

        response.data.forEach(function(data) {
          //and also assert that the deleted repository is present(this assert should fail)
          try {           
              assert.equal(data.name, "repo1", "Your first repo cannot be found!");
                        
          } catch (e) {
                if (e instanceof AssertionError)     {                
                  listRepos.loggerBucket.push({"AssertFail":e,
                                                 "message":"Your first repo cannot be found!",
                                                 "passed":"false"});
                }    
          }
          listRepos.loggerBucket.push({"listRepo":"Repository: "+ data.name+" has been found", "passed":"true"});

        });
        listRepos.loggerBucket.push({"listRepo":"Your repos have been listed", "passed":"true"});

        return;
      })
      .catch(function (error) {
          console.log(error);
      });
  },

  loggerBucket:[],
  sleep:function (millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
  },
  exportResults:function(data){
    // writeFile function with filename, content and callback function
    fs.writeFile('./reports/listRepos Report.json', JSON.stringify(data), function (err) {
      if (err) throw err;
      console.log('_________________Report has been exported successfully!_______________________');
    });
  }

};



listRepos.validateAuthByToken();
