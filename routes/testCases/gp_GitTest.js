var express = require('express');
var router = express.Router();
var http = require('http');

var assert = require('assert');
const AssertionError = require('assert').AssertionError;

var axios= require('axios');

var fs = require('fs');

var gitCredentials={
    username:"ciprianvf9",
    token:"4fc17e6bef44c1bf60f52d3751bfefadc6b3ec5e"
  };

var proxy_settings={
    host: 'web-proxy.atl.hp.com',
    port: '8088'
}

/*THIS IS THE FULL TEST*/
console.log("___________________TEST IS STARTING_________________________");

let gp_GitTest={
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
        gp_GitTest.loggerBucket.push({"auth":"Authentication verification","passed":"true"});


      // - successfully create 3 distinct repositories and assert that the response code is correct
       console.log("_______________CREATING FIRST REPO_______________");
        gp_GitTest.createRepo("repo1").then(function (response) {

          console.log("_______________CREATING SECOND REPO_______________");
          gp_GitTest.createRepo("repo2").then(function (response) {

            console.log("_______________CREATING THIRD REPO_______________");
            gp_GitTest.createRepo("repo3").then(function (response) {

              //- delete successfully one of them and assert that the response code is correct
              console.log("_______________REMOVE FIRST REPO_______________");
              gp_GitTest.removeRepo('repo1').then(function (response) {

                //- try to delete again one of the repositories and assert that the response code is correct for a failed delete
               console.log("_______________TRY AGAIN_______________");
                gp_GitTest.removeRepo('repo1');

              });

              // there is a delay when deleting a folder so we need to wait a bit
              gp_GitTest.sleep(3000).then(function(response){
                gp_GitTest.listRepo().then(function(response){
                  gp_GitTest.exportResults(gp_GitTest.loggerBucket);


                })
              })

            });

          });

        });

      })
      .catch(function (error) {
        console.log("Auth failed! Please check the report");
        gp_GitTest.loggerBucket.push({"auth":"Authentication verification ","passed":"false"});
        try {           
           assert.notEqual(error.response.status, "401", "Unauthorized");                      
        } catch (e) {
              if (e instanceof AssertionError)     {                
                gp_GitTest.loggerBucket.push({"AssertFail":e,
                                               "message":"Authentication verification ",
                                               "passed":"false"});
              }    
        }
        gp_GitTest.exportResults(gp_GitTest.loggerBucket);
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
                gp_GitTest.loggerBucket.push({"AssertFail":e,
                                               "message":"Your repo "+repoName+" has not been created",
                                               "passed":"false"});
              }    
        }
        gp_GitTest.loggerBucket.push({"createRepo":"Your repo "+repoName+" has been created", "passed":"true"});
      return;
      })
      .catch(function (error) {
        console.log("Your repo "+repoName+" has not been created");
        gp_GitTest.loggerBucket.push({"createRepo":"Your repo "+repoName+" has not been created", "passed":"false"});
        try {           
             assert.notEqual(error.response.status, "422", "Your repo already exists");             
        } catch (e) {
              if (e instanceof AssertionError)     {                
                gp_GitTest.loggerBucket.push({"AssertFail":e,
                                               "message":"Your repo already exists",
                                               "passed":"false"});
              }    
        }
      return;
      });
  },
  removeRepo:function(repoName){
    return axios.delete('https://api.github.com/repos/'+gitCredentials.username+'/'+repoName+'?access_token='+gitCredentials.token)
      .then(function (response) {
        try {           
           assert.equal(response.status, 204, "Your repo "+repoName+" has been removed");             
        } catch (e) {
              if (e instanceof AssertionError)     {                
                gp_GitTest.loggerBucket.push({"AssertFail":e,
                                               "message":"Your repo "+repoName+" has been removed",
                                               "passed":"false"});
              }    
        }
        console.log("Your repo "+repoName+" has been removed ");
        gp_GitTest.loggerBucket.push({"removeRepo":"Your repo "+repoName+" has been removed", "passed":"true"});

      return;
      })
      .catch(function (error) {
        try {           
           assert.notEqual(error.response.status, "404", "Your repo does not exists");         
        } catch (e) {
              if (e instanceof AssertionError)     {                
                gp_GitTest.loggerBucket.push({"AssertFail":e,
                                               "message":"Your repo does not exists",
                                               "passed":"false"});
              }    
        }
        console.log("Your repo "+repoName+" has not been removed");
        gp_GitTest.loggerBucket.push({"removeRepo":"Your repo "+repoName+" has not been removed", "passed":"false"});

      return;
      });
  },
  listRepo:function(){
      return axios.get('http://api.github.com/user/repos'+'?access_token='+gitCredentials.token)
        .then(function (response) {

          // - list the remaining repositories and assert the response code is correct,
          try {           
               assert.equal(response.status, 200, "Your repos could not be listed");                    
          } catch (e) {
                if (e instanceof AssertionError)     {                
                  gp_GitTest.loggerBucket.push({"AssertFail":e,
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
                  gp_GitTest.loggerBucket.push({"AssertFail":e,
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
                    gp_GitTest.loggerBucket.push({"AssertFail":e,
                                                   "message":"Your first repo cannot be found!",
                                                   "passed":"false"});
                  }    
            }
            gp_GitTest.loggerBucket.push({"listRepo":"Repository: "+ data.name+" has been found", "passed":"true"});

          });
          gp_GitTest.loggerBucket.push({"listRepo":"Your repos have been listed", "passed":"true"});

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
      fs.writeFile('./reports/gp_GitTest Report.json', JSON.stringify(data), function (err) {
        if (err) throw err;
        console.log('_________________Report has been exported successfully!_______________________');
      });
    }
  };

gp_GitTest.validateAuthByToken();



router.get('/', function(req, res, next) {
//
});

module.exports = router;
