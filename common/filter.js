

module.exports = function(RED) {

    function checkSafeBlockList(action, userList, block = true) {
      if (!block) {
        for (let j = 0; j < userList.length; j++) {
          if (action.idMemberCreator === userList[j]) {
            return true;
          }
        }
        return false;
      } else {
        let sendMessage = true;
        for (let j = 0; j < userList.length; j++) {
          if (action.idMemberCreator === userList[j]) {
            sendMessage = false;
            break;
          }
        }
        return sendMessage;
      }
    }

    return {
        checkSafeBlockList: checkSafeBlockList,
    }
};
