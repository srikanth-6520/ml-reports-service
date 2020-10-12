/**
 * name : key-cloak-authentication
 * author : 
 **/
var keyCloakAuthUtils = require("keycloak-auth-utils");
const jwt = require('jsonwebtoken');
const fs = require('fs');
const accessTokenValidationMode = (process.env.VALIDATE_ACCESS_TOKEN_OFFLINE && process.env.VALIDATE_ACCESS_TOKEN_OFFLINE === "OFF")? "OFF" : "ON";
const keyCloakPublicKeyPath = (process.env.KEYCLOAK_PUBLIC_KEY_PATH && process.env.KEYCLOAK_PUBLIC_KEY_PATH != "") ? PROJECT_ROOT_DIRECTORY+"/"+process.env.KEYCLOAK_PUBLIC_KEY_PATH : PROJECT_ROOT_DIRECTORY+"/"+"keycloak-public-keys/" ;

function ApiInterceptor(keycloak_config, cache_config) {
  this.config = keycloak_config;
  this.keyCloakConfig = new keyCloakAuthUtils.Config(this.config);
  this.grantManager = new keyCloakAuthUtils.GrantManager(this.keyCloakConfig);

}

/**
 * [validateToken is used for validate user]
 * @param  {[string]}   token    [x-auth-token]
 * @param  {Function} callback []
 * @return {[Function]} callback [its retrun err or object with fields(token, userId)]
 */
ApiInterceptor.prototype.validateToken = function(token, callback) {

  if (accessTokenValidationMode === "ON") {
    var self = this;
    var decoded = jwt.decode(token, { complete: true });
    const kid = decoded.header.kid
    let cert = "";
    let path = keyCloakPublicKeyPath + kid + '.pem';
    cert = fs.readFileSync(path);

    if (fs.existsSync(path)) {
      jwt.verify(token, cert, { algorithm: 'RS256' }, function (err, decode) {
  
        if (err) {
          return callback(err.message, null);
        }

        if (decode !== undefined) {
          const expiry = decode.exp;
          const now = new Date();
          if (now.getTime() > expiry * 1000) {
            return callback('Expired', null);
          }

          self.grantManager.userInfo(token, function(err, userData) {
            if (err) {
              return callback(err, null);
            } else {
              return callback(null, { token: token, userId: userData.sub.split(":").pop() });
            }
          });

        } else {
          return callback(err, null);
        }

      });
    } else {
      return callback(err, null);
    }
  }else{
      self.grantManager.userInfo(token, function(err, userData) {
        if (err) {
          return callback(err, null);
        } else {
          return callback(null, { token: token, userId: userData.sub.split(":").pop() });
        }
      });
    }    
};

module.exports = ApiInterceptor;
